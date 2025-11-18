/**
 * AI Trade Copilot - Proactive Real-Time Trading Assistant
 * Elite floating panel that monitors positions and provides live guidance
 *
 * DIFFERENT FROM AI CHAT:
 * - AI Chat: Reactive (you ask, it answers)
 * - AI Copilot: Proactive (always watching, alerts you)
 *
 * Features:
 * - Real-time position monitoring
 * - Live exit signal detection
 * - Risk violation alerts
 * - Profit target recommendations
 * - Market regime change warnings
 * - Unicorn Score updates
 * - Proactive trade management
 */

import { useState, useEffect, useRef } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import { fetchBars } from '../services/yahooFinance.js'
import { computeStates } from '../utils/indicators.js'

export default function AITradeCopilot({ onClose }) {
  const { marketData } = useMarketData()
  const [isMinimized, setIsMinimized] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [symbolScores, setSymbolScores] = useState({}) // Cache scores for each symbol
  const [positions, setPositions] = useState([])
  const [lastCheck, setLastCheck] = useState(Date.now())
  const [newsCache, setNewsCache] = useState([]) // Breaking news cache
  const [watchlist, setWatchlist] = useState(['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA']) // PhD++: Multi-symbol monitoring
  const [validatedSymbols, setValidatedSymbols] = useState(new Set()) // Cache of validated symbols

  // PhD++ CRITICAL: Validate if symbol is a real ticker (prevents SATY, LEVEL, etc.)
  const validateSymbol = async (symbol) => {
    if (!symbol || symbol.length < 1 || symbol.length > 5) return false

    // Check cache first
    if (validatedSymbols.has(symbol)) return true

    const symbolUpper = symbol.toUpperCase()

    // Common indicators/words that are NOT stocks (quick filter)
    const notStocks = new Set([
      'SATY', 'ATR', 'EMA', 'SMA', 'RSI', 'MACD', 'VWAP', 'LEVEL', 'ZONE', 'MIN', 'MAX',
      'SETUP', 'DAILY', 'THE', 'AND', 'FOR', 'BUY', 'SELL', 'LONG', 'SHORT'
    ])
    if (notStocks.has(symbolUpper)) return false

    // CRITICAL FIX: Whitelist common stocks (prevents false rejections from API failures)
    const knownStocks = new Set([
      'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'VEA', 'VWO', 'AGG', 'BND',
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'BRKB',
      'LLY', 'AVGO', 'JPM', 'V', 'UNH', 'XOM', 'WMT', 'MA', 'PG', 'HD',
      'JNJ', 'COST', 'ABBV', 'NFLX', 'CRM', 'MRK', 'KO', 'BAC', 'PEP', 'CVX',
      'AMD', 'ADBE', 'TMO', 'ACN', 'CSCO', 'MCD', 'ABT', 'DHR', 'WFC', 'PM'
    ])
    if (knownStocks.has(symbolUpper)) {
      setValidatedSymbols(prev => new Set([...prev, symbol]))
      return true
    }

    // For unknown symbols, try to validate via Yahoo Finance
    try {
      const response = await fetch(`/api/yahoo-proxy?symbol=${symbol}&interval=1d&range=1d`, {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      if (response.ok) {
        const data = await response.json()
        const isValid = data.bars && data.bars.length > 0
        if (isValid) {
          setValidatedSymbols(prev => new Set([...prev, symbol]))
        }
        return isValid
      }
      // CRITICAL FIX: On API failure, be LENIENT (accept symbol rather than reject)
      // Better to accept a potentially invalid symbol than reject a valid one
      console.warn(`[Copilot] Could not validate ${symbol} via API (status: ${response.status}), accepting anyway`)
      setValidatedSymbols(prev => new Set([...prev, symbol]))
      return true
    } catch (error) {
      // CRITICAL FIX: Network error or timeout = accept symbol (lenient validation)
      console.warn(`[Copilot] Could not validate ${symbol} (${error.message}), accepting anyway`)
      setValidatedSymbols(prev => new Set([...prev, symbol]))
      return true
    }
  }

  // Listen for position updates from Orders panel
  // PhD++ ENHANCED: Validate symbols before accepting positions
  useEffect(() => {
    const handlePositionUpdate = async (event) => {
      const updatedPositions = event.detail
      console.log('[Copilot] Raw positions received:', updatedPositions.length)

      // Validate all position symbols
      const validationResults = await Promise.all(
        updatedPositions.map(async (pos) => ({
          ...pos,
          isValid: await validateSymbol(pos.symbol)
        }))
      )

      // Filter and warn about invalid symbols
      const valid = validationResults.filter(p => p.isValid)
      const invalid = validationResults.filter(p => !p.isValid)

      if (invalid.length > 0) {
        console.warn('[Copilot] ⚠️ Invalid symbols detected (filtered out):', invalid.map(p => p.symbol))

        // Add alert for invalid positions
        setAlerts(prev => [{
          id: `invalid-symbols-${Date.now()}`,
          type: 'warning',
          priority: 'high',
          symbol: 'SYSTEM',
          title: '⚠️ Invalid Positions Detected',
          message: `Filtered out positions with invalid symbols: ${invalid.map(p => p.symbol).join(', ')}`,
          action: 'Review your positions - these may be test trades',
          timestamp: Date.now()
        }, ...prev].slice(0, 10))
      }

      setPositions(valid)
      console.log('[Copilot] ✅ Valid positions:', valid.length, 'Invalid:', invalid.length)
    }

    window.addEventListener('iava-positions-update', handlePositionUpdate)
    return () => window.removeEventListener('iava-positions-update', handlePositionUpdate)
  }, [])

  // PhD++ CRITICAL FIX: Fetch fresh Unicorn score for ANY symbol
  // This allows AI Copilot to analyze ALL positions, not just current chart symbol!
  const fetchFreshScore = async (symbol, timeframe = '1Min') => {
    try {
      // Check cache first (5 second TTL to avoid excessive API calls)
      const cached = symbolScores[symbol]
      if (cached && Date.now() - cached.timestamp < 5000) {
        return cached
      }

      console.log(`[Copilot] Fetching fresh score for ${symbol}...`)
      const bars = await fetchBars(symbol, timeframe, 200)

      if (!bars || bars.length === 0) {
        console.warn(`[Copilot] No bars data for ${symbol}`)
        return null
      }

      const signalState = computeStates(bars)
      const currentPrice = bars[bars.length - 1]?.close

      const scoreData = {
        symbol,
        score: signalState.score || 0,
        currentPrice,
        signalState,
        bars: bars.length,
        timestamp: Date.now()
      }

      // Update cache
      setSymbolScores(prev => ({
        ...prev,
        [symbol]: scoreData
      }))

      console.log(`[Copilot] ✅ Fresh score for ${symbol}: ${scoreData.score.toFixed(0)}/100`)
      return scoreData

    } catch (error) {
      console.error(`[Copilot] Error fetching score for ${symbol}:`, error)
      return null
    }
  }

  // Monitor positions and market data for alerts
  useEffect(() => {
    if (!marketData.symbol || positions.length === 0) return

    const checkInterval = setInterval(() => {
      analyzePositions()
    }, 5000) // Check every 5 seconds

    return () => clearInterval(checkInterval)
  }, [marketData, positions])

  // Proactive analysis of positions - PhD++ ASYNC for fresh score fetching
  const analyzePositions = async () => {
    const newAlerts = []
    const currentTime = Date.now()

    // PhD++ CRITICAL FIX: Analyze ALL positions with fresh scores, not just current chart symbol!
    for (const position of positions) {
      // Alpaca position structure: symbol, side, avg_entry_price, qty, current_price, unrealized_pl
      const { symbol, side, avg_entry_price, qty, current_price } = position
      const entry = parseFloat(avg_entry_price)
      const quantity = parseFloat(qty)
      const currentPrice = current_price ? parseFloat(current_price) : null

      if (!currentPrice || !entry) continue

      // Alert 1: Unicorn Score Deterioration - NOW WORKS FOR ALL POSITIONS!
      // Fetch fresh score for THIS position's symbol (not just current chart)
      const scoreData = await fetchFreshScore(symbol)

      if (scoreData) {
        const score = scoreData.score

        if (side === 'long' && score < 40) {
          newAlerts.push({
            id: `score-${symbol}-${currentTime}`,
            type: 'danger',
            priority: 'high', // Elevated from medium - this is REAL-TIME fresh data!
            symbol,
            title: 'Unicorn Score Deteriorating',
            message: `${symbol} Unicorn Score: ${score.toFixed(0)}/100 (BEARISH) - Fresh data!`,
            action: 'Consider tightening stop or exiting',
            timestamp: currentTime
          })
        }

        if (side === 'short' && score > 70) {
          newAlerts.push({
            id: `score-${symbol}-${currentTime}`,
            type: 'danger',
            priority: 'high',
            symbol,
            title: 'Unicorn Score Rising',
            message: `${symbol} Unicorn Score: ${score.toFixed(0)}/100 (BULLISH) - Fresh data!`,
            action: 'Cover short or tighten stop',
            timestamp: currentTime
          })
        }
      }

      // Alert 2: Large Price Move
      const priceChange = side === 'long' ?
        ((currentPrice - entry) / entry) * 100 :
        ((entry - currentPrice) / entry) * 100

      if (Math.abs(priceChange) > 5) {
        const isProfit = priceChange > 0
        newAlerts.push({
          id: `move-${symbol}-${currentTime}`,
          type: isProfit ? 'success' : 'warning',
          priority: 'medium',
          symbol,
          title: `Large ${isProfit ? 'Gain' : 'Loss'}: ${Math.abs(priceChange).toFixed(1)}%`,
          message: `${symbol} moved ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}% from entry`,
          action: isProfit ? 'Consider trailing stop' : 'Review position sizing',
          timestamp: currentTime
        })
      }

      // PhD++ Alert 3: SATY-Based Stop Loss Recommendation
      if (marketData.symbol === symbol && marketData.overlays?.saty) {
        const saty = marketData.overlays.saty
        const stopLevel = side === 'long' ? saty.levels?.t0236?.dn : saty.levels?.t0236?.up

        if (stopLevel) {
          const distanceToSATY = Math.abs(currentPrice - stopLevel) / currentPrice * 100

          // Alert if price is near SATY level (good stop location)
          if (distanceToSATY < 1) {
            newAlerts.push({
              id: `saty-stop-${symbol}-${currentTime}`,
              type: 'info',
              priority: 'high',
              symbol,
              title: 'SATY Stop Level Nearby',
              message: `Ideal stop loss at $${stopLevel.toFixed(2)} (SATY 0.236 ATR level)`,
              action: `Consider setting stop at $${stopLevel.toFixed(2)}`,
              timestamp: currentTime
            })
          }

          // Alert if price breaks below/above stop level
          const stopBroken = side === 'long' ? currentPrice < stopLevel : currentPrice > stopLevel
          if (stopBroken) {
            newAlerts.push({
              id: `saty-broken-${symbol}-${currentTime}`,
              type: 'danger',
              priority: 'high',
              symbol,
              title: '🚨 SATY Stop Broken!',
              message: `${symbol} broke SATY stop at $${stopLevel.toFixed(2)}`,
              action: 'EXIT POSITION NOW - Stop loss triggered',
              timestamp: currentTime
            })
          }
        }

        // Profit target using SATY 1.0 ATR level
        const targetLevel = side === 'long' ? saty.levels?.t1000?.up : saty.levels?.t1000?.dn
        if (targetLevel) {
          const distanceToTarget = Math.abs(currentPrice - targetLevel) / currentPrice * 100

          if (distanceToTarget < 2) {
            newAlerts.push({
              id: `saty-target-${symbol}-${currentTime}`,
              type: 'success',
              priority: 'high',
              symbol,
              title: '🎯 Profit Target Reached!',
              message: `${symbol} at SATY 1.0 ATR target: $${targetLevel.toFixed(2)}`,
              action: 'Consider taking profits or trailing stop',
              timestamp: currentTime
            })
          }
        }
      }

      // PhD++ Alert 4: Regime Change Warning - NOW USES FRESH DATA!
      if (scoreData?.signalState?.regime) {
        const regime = scoreData.signalState.regime
        const regimeScore = scoreData.signalState.rawScore || 0

        // Alert if holding long position but regime turned bearish
        if (side === 'long' && regimeScore < -35) {
          newAlerts.push({
            id: `regime-${symbol}-${currentTime}`,
            type: 'danger',
            priority: 'high',
            symbol,
            title: '⚠️ Regime Turned Bearish',
            message: `Market regime: ${regime} (score: ${regimeScore.toFixed(0)}) - Fresh data!`,
            action: 'Consider exiting long position - bearish regime detected',
            timestamp: currentTime
          })
        }

        // Alert if holding short position but regime turned bullish
        if (side === 'short' && regimeScore > 35) {
          newAlerts.push({
            id: `regime-${symbol}-${currentTime}`,
            type: 'danger',
            priority: 'high',
            symbol,
            title: '⚠️ Regime Turned Bullish',
            message: `Market regime: ${regime} (score: ${regimeScore.toFixed(0)}) - Fresh data!`,
            action: 'Consider covering short - bullish regime detected',
            timestamp: currentTime
          })
        }
      }

      // PhD++ Alert 5: RSI Divergence Warning - NOW USES FRESH DATA!
      if (scoreData?.signalState?.rsi) {
        const rsi = scoreData.signalState.rsi

        // Overbought warning for longs
        if (side === 'long' && rsi > 80) {
          newAlerts.push({
            id: `rsi-ob-${symbol}-${currentTime}`,
            type: 'warning',
            priority: 'medium',
            symbol,
            title: 'RSI Overbought',
            message: `${symbol} RSI at ${rsi.toFixed(1)} - extremely overbought (Fresh data!)`,
            action: 'Consider tightening stops or taking partial profits',
            timestamp: currentTime
          })
        }

        // Oversold warning for shorts
        if (side === 'short' && rsi < 20) {
          newAlerts.push({
            id: `rsi-os-${symbol}-${currentTime}`,
            type: 'warning',
            priority: 'medium',
            symbol,
            title: 'RSI Oversold',
            message: `${symbol} RSI at ${rsi.toFixed(1)} - extremely oversold (Fresh data!)`,
            action: 'Consider covering short - bounce risk',
            timestamp: currentTime
          })
        }
      }
    }

    // Add new alerts (avoid duplicates)
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const existingIds = new Set(prev.map(a => a.id))
        const uniqueNew = newAlerts.filter(a => !existingIds.has(a.id))
        return [...uniqueNew, ...prev].slice(0, 10) // Keep last 10 alerts
      })
    }

    setLastCheck(currentTime)
  }

  // PhD++ BREAKING NEWS MONITORING: Check news for positions
  const checkBreakingNews = async () => {
    if (positions.length === 0) return

    try {
      // Get symbols from positions
      const symbols = [...new Set(positions.map(p => p.symbol))]

      for (const symbol of symbols) {
        // Fetch news (limit to avoid rate limits)
        const response = await fetch(`/api/news?symbol=${symbol}&limit=5`)
        if (!response.ok) continue

        const { news } = await response.json()
        if (!news || news.length === 0) continue

        // Analyze sentiment of latest news
        const latestNews = news[0]
        const newsId = `${symbol}-${latestNews.id || latestNews.headline}`

        // Check if we've already alerted on this news
        if (newsCache.includes(newsId)) continue

        // Add to cache
        setNewsCache(prev => [...prev, newsId].slice(-50)) // Keep last 50

        // Analyze sentiment
        const sentimentResponse = await fetch('/api/sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: latestNews.headline })
        })

        if (!sentimentResponse.ok) continue
        const { sentiment, score } = await sentimentResponse.json()

        // Find if we have a position in this symbol
        const position = positions.find(p => p.symbol === symbol)
        if (!position) continue

        // Alert if news sentiment contradicts position
        const isBearishNews = sentiment === 'negative' && score < -0.3
        const isBullishNews = sentiment === 'positive' && score > 0.3

        if ((position.side === 'long' && isBearishNews) || (position.side === 'short' && isBullishNews)) {
          const currentTime = Date.now()
          setAlerts(prev => [{
            id: `news-${symbol}-${currentTime}`,
            type: 'warning',
            priority: 'high',
            symbol,
            title: `📰 Breaking News Alert`,
            message: `${sentiment.toUpperCase()} news: "${latestNews.headline.slice(0, 80)}..."`,
            action: `Review your ${position.side} position - news sentiment: ${(score * 100).toFixed(0)}%`,
            timestamp: currentTime
          }, ...prev].slice(0, 10))
        }

        // Alert on very strong news regardless of position
        if (Math.abs(score) > 0.7) {
          const currentTime = Date.now()
          setAlerts(prev => [{
            id: `news-strong-${symbol}-${currentTime}`,
            type: 'info',
            priority: 'medium',
            symbol,
            title: `📰 Strong ${sentiment} News`,
            message: `"${latestNews.headline.slice(0, 80)}..."`,
            action: `Sentiment: ${(score * 100).toFixed(0)}% ${sentiment}`,
            timestamp: currentTime
          }, ...prev].slice(0, 10))
        }
      }
    } catch (error) {
      console.error('[Copilot] News check error:', error)
    }
  }

  // PhD++ OPPORTUNITY SCANNER with RISK VALIDATION
  const scanForOpportunities = async () => {
    if (!marketData.symbol) return

    try {
      const state = marketData.signalState
      if (!state) return

      const currentTime = Date.now()
      const symbol = marketData.symbol
      const currentPrice = marketData.currentPrice

      // Import risk controls to check if alerts should be generated
      const { getRiskConfig, getDailyStats } = await import('../utils/riskControls.js')
      const riskConfig = getRiskConfig()
      const dailyStats = getDailyStats()

      // Skip opportunity scanning if trading is halted
      if (riskConfig.haltTrading) return

      // Skip if daily limits reached
      if (dailyStats.realizedPnLPct <= -riskConfig.dailyLossLimitPct) return
      if (dailyStats.tradesCount >= riskConfig.dailyMaxTrades) return

      // Perfect Unicorn Setup (score > 85) with Risk Validation
      if (state.score >= 85 && state.rawScore >= 85 && currentPrice) {
        // Calculate estimated stop based on SATY levels
        const satyStop = state.saty?.support || (currentPrice * 0.985) // Fallback to 1.5% stop

        setAlerts(prev => {
          // Avoid duplicate alerts
          if (prev.some(a => a.id.includes(`unicorn-perfect-${symbol}`))) return prev

          // Add risk-aware message
          const riskMsg = positions.length >= riskConfig.maxConcurrentPositions
            ? ` ⚠️ Max positions reached (${positions.length}/${riskConfig.maxConcurrentPositions})`
            : ` ✓ Risk controls OK (${dailyStats.tradesCount}/${riskConfig.dailyMaxTrades} trades today)`

          return [{
            id: `unicorn-perfect-${symbol}-${currentTime}`,
            type: 'success',
            priority: 'high',
            symbol,
            title: '🦄 PERFECT UNICORN SETUP!',
            message: `${symbol} Unicorn Score: ${state.score.toFixed(0)}/100 - ALL indicators aligned.${riskMsg}`,
            action: 'Consider entering LONG position',
            timestamp: currentTime,
            suggestedEntry: currentPrice,
            suggestedStop: satyStop
          }, ...prev].slice(0, 10)
        })
      }

      // Squeeze Fire + Trend Alignment
      if (state.sq?.fired && state.pivotNow === 'bullish' && state.ichiRegime === 'bullish') {
        setAlerts(prev => {
          if (prev.some(a => a.id.includes(`squeeze-fire-${symbol}`))) return prev

          return [{
            id: `squeeze-fire-${symbol}-${currentTime}`,
            type: 'success',
            priority: 'high',
            symbol,
            title: '💥 Squeeze Fired + Trend Aligned!',
            message: `${symbol} squeeze released ${state.sq.dir === 'up' ? 'BULLISH' : 'BEARISH'}`,
            action: `Breakout in progress - consider ${state.sq.dir === 'up' ? 'LONG' : 'SHORT'}`,
            timestamp: currentTime
          }, ...prev].slice(0, 10)
        })
      }

      // High Volume + Strong Momentum + SATY Trigger
      if (state.relativeVolume > 2.0 && state.rsi > 60 && state.satyDir === 'long') {
        setAlerts(prev => {
          if (prev.some(a => a.id.includes(`momentum-${symbol}`))) return prev

          return [{
            id: `momentum-${symbol}-${currentTime}`,
            type: 'success',
            priority: 'medium',
            symbol,
            title: '⚡ High Volume Momentum Setup',
            message: `${symbol} - Volume: ${state.relativeVolume.toFixed(1)}x avg, RSI: ${state.rsi.toFixed(0)}`,
            action: 'Strong momentum confirmed - watch for entry',
            timestamp: currentTime
          }, ...prev].slice(0, 10)
        })
      }

      // Bearish Perfect Setup (score < 15)
      if (state.score <= 15 && state.rawScore <= -85) {
        setAlerts(prev => {
          if (prev.some(a => a.id.includes(`bear-perfect-${symbol}`))) return prev

          return [{
            id: `bear-perfect-${symbol}-${currentTime}`,
            type: 'warning',
            priority: 'high',
            symbol,
            title: '🐻 PERFECT BEARISH SETUP!',
            message: `${symbol} Unicorn Score: ${state.score.toFixed(0)}/100 - Strong bearish alignment`,
            action: 'Consider entering SHORT position or exiting longs',
            timestamp: currentTime
          }, ...prev].slice(0, 10)
        })
      }

    } catch (error) {
      console.error('[Copilot] Opportunity scan error:', error)
    }
  }

  // Run news check every 2 minutes
  useEffect(() => {
    if (positions.length === 0) return

    checkBreakingNews() // Check immediately
    const newsInterval = setInterval(checkBreakingNews, 120000) // Every 2 minutes

    return () => clearInterval(newsInterval)
  }, [positions, newsCache])

  // Run opportunity scan every 30 seconds
  useEffect(() => {
    scanForOpportunities() // Scan immediately
    const scanInterval = setInterval(scanForOpportunities, 30000) // Every 30 seconds

    return () => clearInterval(scanInterval)
  }, [marketData])

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  // Clear all alerts
  const clearAll = () => {
    setAlerts([])
  }

  // PhD++ ONE-CLICK EXECUTION: Execute alert recommendation
  const executeAlert = (alert) => {
    if (!alert.symbol) return

    // Different actions based on alert type
    if (alert.id.includes('saty-broken') || alert.id.includes('regime')) {
      // CRITICAL: Exit position immediately
      const confirmed = window.confirm(
        `⚠️ CRITICAL ALERT\n\n${alert.title}\n${alert.message}\n\n` +
        `This will close your ${alert.symbol} position immediately. Continue?`
      )

      if (confirmed) {
        // Dispatch close position event to OrdersPanel
        window.dispatchEvent(new CustomEvent('iava-close-position', {
          detail: { symbol: alert.symbol, reason: alert.title }
        }))

        dismissAlert(alert.id)

        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: {
            text: `Closing ${alert.symbol} position...`,
            type: 'success',
            ttl: 3000
          }
        }))
      }
    } else if (alert.id.includes('saty-stop')) {
      // Set stop loss at SATY level
      const stopPrice = parseFloat(alert.message.match(/\$([0-9.]+)/)?.[1])

      if (stopPrice) {
        window.dispatchEvent(new CustomEvent('iava-set-stop', {
          detail: { symbol: alert.symbol, stopPrice, type: 'saty' }
        }))

        dismissAlert(alert.id)

        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: {
            text: `Setting SATY stop at $${stopPrice.toFixed(2)}`,
            type: 'success',
            ttl: 3000
          }
        }))
      }
    } else if (alert.id.includes('saty-target')) {
      // Take profits at target
      const confirmed = window.confirm(
        `${alert.title}\n\n${alert.message}\n\n` +
        `Close 50% of your ${alert.symbol} position to lock in profits?`
      )

      if (confirmed) {
        window.dispatchEvent(new CustomEvent('iava-take-profits', {
          detail: { symbol: alert.symbol, percentage: 50, reason: 'SATY target hit' }
        }))

        dismissAlert(alert.id)

        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: {
            text: `Taking 50% profits on ${alert.symbol}`,
            type: 'success',
            ttl: 3000
          }
        }))
      }
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span className="text-lg">🤖</span>
          <span className="text-sm font-semibold">AI Copilot</span>
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] z-50">
      <div className="glass-panel overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <div className="text-white font-bold text-sm">AI Trade Copilot</div>
                <div className="text-indigo-200 text-xs">Always watching your positions</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white hover:bg-white/20 rounded px-2 py-1 text-xs transition-colors"
              >
                _
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded px-2 py-1 text-xs transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-700/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${positions.length > 0 ? 'bg-emerald-400' : 'bg-slate-500'} animate-pulse`} />
              <span className="text-slate-300">
                {positions.length > 0 ?
                  `Monitoring ${positions.length} position${positions.length !== 1 ? 's' : ''}` :
                  'No active positions'}
              </span>
            </div>
            <div className="text-slate-400">
              Updated {Math.round((Date.now() - lastCheck) / 1000)}s ago
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">👁️</div>
              <div className="text-sm">I'm watching the markets</div>
              <div className="text-xs mt-1">You'll be alerted of important events</div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-400 font-semibold">
                  ACTIVE ALERTS ({alerts.length})
                </div>
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Clear all
                </button>
              </div>

              {alerts.map(alert => {
                const alertStyles = {
                  success: 'border-emerald-500/30 bg-emerald-500/10',
                  warning: 'border-amber-500/30 bg-amber-500/10',
                  danger: 'border-red-500/30 bg-red-500/10',
                  info: 'border-cyan-500/30 bg-cyan-500/10'
                }

                const iconMap = {
                  success: '✅',
                  warning: '⚠️',
                  danger: '🚨',
                  info: '💡'
                }

                // Check if alert is actionable (has one-click execution)
                const isActionable = alert.id.includes('saty-broken') ||
                                    alert.id.includes('regime') ||
                                    alert.id.includes('saty-stop') ||
                                    alert.id.includes('saty-target')

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${alertStyles[alert.type] || alertStyles.info} animate-slide-in-right`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-base">{iconMap[alert.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <span>{alert.title}</span>
                            {alert.priority === 'high' && (
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                                HIGH
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5">
                            {alert.message}
                          </div>
                          {alert.action && (
                            <div className="text-xs text-indigo-300 mt-1 font-semibold">
                              → {alert.action}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-slate-400 hover:text-slate-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    {/* PhD++ ONE-CLICK EXECUTION BUTTONS */}
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="text-xs text-slate-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                      {isActionable && (
                        <button
                          onClick={() => executeAlert(alert)}
                          className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                            alert.type === 'danger'
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40'
                              : alert.type === 'success'
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40'
                          }`}
                        >
                          ⚡ Execute
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Market Status */}
        {marketData.symbol && marketData.signalState && (
          <div className="bg-slate-800/30 px-3 py-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs">
              <div className="text-slate-400">
                {marketData.symbol}: <span className="text-slate-200">${marketData.currentPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Unicorn Score:</span>
                <span className={`font-bold ${
                  (marketData.signalState.score || 0) >= 70 ? 'text-emerald-400' :
                  (marketData.signalState.score || 0) >= 50 ? 'text-cyan-400' :
                  (marketData.signalState.score || 0) >= 35 ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {(marketData.signalState.score || 0).toFixed(0)}/100
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
