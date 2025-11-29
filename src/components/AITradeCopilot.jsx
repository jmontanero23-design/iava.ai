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
import { speakAlert, speakGuidance, voiceQueue } from '../utils/voiceSynthesis.js'
import chronosBridge from '../services/chronosCopilotBridge.js'

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
  const [lastConfluence, setLastConfluence] = useState(null) // Track confluence changes

  // PhD++ ALERT COOLDOWN: Use ref instead of state for synchronous checks
  const alertCooldownsRef = useRef({})

  // PhD++ FIX: Track ALL alert IDs ever added to prevent any duplicates
  const addedAlertIdsRef = useRef(new Set())

  // PhD++ FIX: Track previous symbol to detect symbol changes (prevents wrong price display)
  const prevSymbolRef = useRef(null)

  // PhD++ FIX: Lock to prevent concurrent analyzePositions calls (async race condition fix)
  const analyzeInProgressRef = useRef(false)

  // PhD++ FIX: Track last known price per symbol to detect price discontinuities
  const lastKnownPriceRef = useRef({})

  // PhD++ ALERT COOLDOWN: Check if an alert type is on cooldown (60 seconds default)
  const isOnCooldown = (alertKey, cooldownMs = 60000) => {
    const lastTime = alertCooldownsRef.current[alertKey]
    const onCooldown = lastTime && (Date.now() - lastTime) < cooldownMs
    return onCooldown
  }

  // PhD++ Mark an alert type as recently fired (synchronous - no state delay)
  const markAlertFired = (alertKey) => {
    alertCooldownsRef.current[alertKey] = Date.now()
  }

  // PhD++ FIX: Check if an alert ID was EVER added (prevents any duplicate from appearing)
  const wasAlertEverAdded = (alertId) => {
    return addedAlertIdsRef.current.has(alertId)
  }

  // PhD++ FIX: Mark an alert as added (globally tracks across the session)
  const markAlertAdded = (alertId) => {
    addedAlertIdsRef.current.add(alertId)
  }

  // PhD++ POSITION-AWARE HELPERS: Get position info for smart alerts
  const getPosition = (symbol) => positions.find(p => p.symbol === symbol)
  const getPositionSide = (symbol) => getPosition(symbol)?.side || null
  const hasPosition = (symbol) => !!getPosition(symbol)

  // PhD++ Check if signal conflicts with position (BEARISH signal + LONG position = conflict)
  const hasPositionConflict = (symbol, signalDirection) => {
    const side = getPositionSide(symbol)
    if (!side) return false // No position = no conflict
    // Conflict: bullish signal + short position OR bearish signal + long position
    return (signalDirection === 'bullish' && side === 'short') ||
           (signalDirection === 'bearish' && side === 'long')
  }

  // PhD++ Check if signal aligns with position (BULLISH signal + LONG position = aligned)
  const hasPositionAlignment = (symbol, signalDirection) => {
    const side = getPositionSide(symbol)
    if (!side) return false // No position = no alignment
    return (signalDirection === 'bullish' && side === 'long') ||
           (signalDirection === 'bearish' && side === 'short')
  }

  // PhD++ Get position info string for alert badges
  const getPositionBadge = (symbol) => {
    const pos = getPosition(symbol)
    if (!pos) return null
    const qty = parseFloat(pos.qty)
    const side = pos.side.toUpperCase()
    return `📍 ${side} ${qty} shares`
  }

  // PhD++ CRITICAL: Check if marketData is still loading (prevents stale data usage)
  // FIX: Also detect symbol changes - when symbol changes, price is stale until new data loads
  const symbolChanged = prevSymbolRef.current !== null && prevSymbolRef.current !== marketData.symbol
  const isDataLoading = marketData.isLoading || !marketData.symbol || symbolChanged

  // PhD++ FIX: Clear stale alerts when chart symbol changes (prevents wrong data alerts)
  useEffect(() => {
    if (symbolChanged && prevSymbolRef.current && marketData.symbol) {
      console.log(`[Copilot] Symbol changed from ${prevSymbolRef.current} to ${marketData.symbol} - clearing stale alerts`)

      // Clear alerts that are for the OLD symbol (keep position alerts for other symbols)
      setAlerts(prev => prev.filter(alert => {
        // Keep alerts that are NOT from the old chart symbol
        // Position-based alerts use the position's symbol, not chart symbol
        // But opportunity/confluence alerts use chart symbol
        const isOldSymbolAlert = alert.symbol === prevSymbolRef.current
        return !isOldSymbolAlert
      }))

      // Clear cooldowns and global tracker for the old symbol
      // This allows fresh alerts when switching back to that symbol later
      const oldSymbol = prevSymbolRef.current
      Object.keys(alertCooldownsRef.current).forEach(key => {
        if (key.includes(oldSymbol)) {
          delete alertCooldownsRef.current[key]
        }
      })

      // Clear the global tracker entries for old symbol
      addedAlertIdsRef.current = new Set(
        [...addedAlertIdsRef.current].filter(id => !id.includes(oldSymbol))
      )
    }
  }, [symbolChanged, marketData.symbol])

  // Update previous symbol ref (after render, price should be correct)
  if (!marketData.isLoading && marketData.symbol) {
    prevSymbolRef.current = marketData.symbol
  }

  // PhD++ FIX: Detect price discontinuity (>10% jump) and clear stale alerts
  // This catches cases where price data switches sources (extended hours vs regular, data refresh, etc.)
  useEffect(() => {
    if (!marketData.symbol || !marketData.currentPrice || marketData.isLoading) return

    const symbol = marketData.symbol
    const currentPrice = marketData.currentPrice
    const lastPrice = lastKnownPriceRef.current[symbol]

    if (lastPrice && currentPrice) {
      const pctChange = Math.abs((currentPrice - lastPrice) / lastPrice) * 100

      // If price jumped by more than 50%, clear alerts for this symbol
      // Increased threshold to 50% to avoid false positives from:
      // - Extended hours vs regular market prices
      // - Different data sources (Yahoo vs Alpaca)
      // - Legitimate high volatility stocks
      // Only trigger on extreme jumps that indicate data errors
      if (pctChange > 50) {
        console.log(`[Copilot] ⚠️ Price discontinuity detected for ${symbol}: $${lastPrice.toFixed(2)} → $${currentPrice.toFixed(2)} (${pctChange.toFixed(1)}% jump)`)
        console.log(`[Copilot] Clearing stale alerts that may reference outdated price context`)

        // Clear alerts for this symbol that may have stale price references
        setAlerts(prev => prev.filter(alert => {
          // Keep alerts that are NOT for this symbol
          if (alert.symbol !== symbol) return true

          // Clear SATY-based alerts (they reference specific price levels)
          if (alert.id.includes('saty-')) {
            console.log(`[Copilot] Clearing stale SATY alert: ${alert.id}`)
            return false
          }

          // Clear momentum/opportunity alerts (they reference current price context)
          if (alert.id.includes('momentum') || alert.id.includes('unicorn') || alert.id.includes('squeeze')) {
            console.log(`[Copilot] Clearing stale opportunity alert: ${alert.id}`)
            return false
          }

          // Keep other alerts (like position health, regime changes - these are still relevant)
          return true
        }))

        // Clear cooldowns for this symbol so fresh alerts can be generated
        Object.keys(alertCooldownsRef.current).forEach(key => {
          if (key.includes(symbol) && (key.includes('saty') || key.includes('momentum') || key.includes('unicorn'))) {
            delete alertCooldownsRef.current[key]
          }
        })

        // Clear from global tracker too
        addedAlertIdsRef.current = new Set(
          [...addedAlertIdsRef.current].filter(id =>
            !id.includes(symbol) || (!id.includes('saty') && !id.includes('momentum') && !id.includes('unicorn'))
          )
        )
      }
    }

    // Update last known price for this symbol
    lastKnownPriceRef.current[symbol] = currentPrice
  }, [marketData.symbol, marketData.currentPrice, marketData.isLoading])

  // PhD++ CONFLUENCE CALCULATOR: Calculate current multi-TF confluence status
  const getConfluenceStatus = () => {
    // Don't calculate if data is loading
    if (isDataLoading) return { status: 'loading', direction: 'neutral', count: 0 }

    const primary = marketData.signalState?.pivotNow
    // Only include daily if NOT already on Daily timeframe (avoid double-counting)
    const daily = marketData.timeframe !== '1Day' ? marketData.dailyState?.pivotNow : null
    const secondary = marketData.consensus?.secondary?.pivotNow

    const directions = [primary, daily, secondary].filter(d => d && d !== 'neutral')
    const bullishCount = directions.filter(d => d === 'bullish').length
    const bearishCount = directions.filter(d => d === 'bearish').length

    // On Daily with no secondary, just return the primary direction
    if (directions.length < 2) {
      return { status: 'single', direction: primary || 'neutral', count: 1 }
    }

    const allAligned = bullishCount === directions.length || bearishCount === directions.length

    if (allAligned && directions.length >= 2) {
      return { status: 'full', direction: bullishCount > 0 ? 'bullish' : 'bearish', count: directions.length }
    } else if (bullishCount >= 2 || bearishCount >= 2) {
      return { status: 'partial', direction: bullishCount > bearishCount ? 'bullish' : 'bearish', count: Math.max(bullishCount, bearishCount) }
    }
    return { status: 'mixed', direction: 'neutral', count: 0 }
  }

  // PhD++ POSITION HEALTH SCORE: Calculate comprehensive health for a position
  const calculatePositionHealth = (position, scoreData) => {
    if (!position || !scoreData) return { score: 50, label: 'Unknown', color: 'text-slate-400' }

    const { side, avg_entry_price, current_price } = position
    const entry = parseFloat(avg_entry_price)
    const price = parseFloat(current_price)
    const techScore = scoreData?.score || 50

    // Component 1: Technical Alignment (40%)
    // For longs: higher score = healthier, for shorts: lower score = healthier
    let techHealth = side === 'long' ? techScore : (100 - techScore)

    // Component 2: P&L Position (30%)
    const plPct = side === 'long'
      ? ((price - entry) / entry) * 100
      : ((entry - price) / entry) * 100
    // Map P&L to 0-100 scale: -5% = 0, +5% = 100
    let plHealth = Math.max(0, Math.min(100, 50 + (plPct * 10)))

    // Component 3: R-Value / Risk Position (30%)
    // Ideal R is 1.0-2.0 (winning), penalize losses (negative R)
    const estimatedRisk = entry * 0.02 // Assume 2% stop
    const currentR = plPct > 0 ? plPct / 2 : plPct / 2 // Simplified R calculation
    let rHealth = currentR >= 2 ? 100 : currentR >= 1 ? 80 : currentR >= 0.5 ? 65 : currentR >= 0 ? 50 : Math.max(0, 50 + currentR * 25)

    // Weighted final score
    const healthScore = Math.round(
      (techHealth * 0.40) +
      (plHealth * 0.30) +
      (rHealth * 0.30)
    )

    // Determine label and color
    let label, color
    if (healthScore >= 80) { label = 'Excellent'; color = 'text-emerald-400' }
    else if (healthScore >= 65) { label = 'Good'; color = 'text-cyan-400' }
    else if (healthScore >= 50) { label = 'Fair'; color = 'text-amber-400' }
    else if (healthScore >= 35) { label = 'Weak'; color = 'text-orange-400' }
    else { label = 'Critical'; color = 'text-red-400' }

    return { score: healthScore, label, color, techHealth, plHealth, rHealth }
  }

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

      return scoreData

    } catch (error) {
      console.error(`[Copilot] Error fetching score for ${symbol}:`, error)
      return null
    }
  }

  // Monitor positions and market data for alerts
  // PhD++ FIX: Use stable interval - don't recreate on every marketData change!
  // Only recreate when positions change (not on every price tick)
  useEffect(() => {
    if (positions.length === 0) return

    const checkInterval = setInterval(() => {
      // Only analyze if we have a symbol and aren't already analyzing
      if (marketData.symbol && !analyzeInProgressRef.current) {
        analyzePositions()
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(checkInterval)
  }, [positions.length]) // PhD++ FIX: Only depend on positions.length, not the full objects

  // Proactive analysis of positions - PhD++ ASYNC for fresh score fetching
  const analyzePositions = async () => {
    // PhD++ FIX: Prevent concurrent calls (async race condition fix)
    if (analyzeInProgressRef.current) {
      console.log('[Copilot] analyzePositions already in progress, skipping')
      return
    }
    analyzeInProgressRef.current = true

    const newAlerts = []
    const currentTime = Date.now()

    try {

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

        // PhD++ STABLE ID + COOLDOWN: Prevents duplicate alerts
        const scoreAlertKey = `score-${symbol}-${side}`
        if (side === 'long' && score < 40 && !isOnCooldown(scoreAlertKey)) {
          markAlertFired(scoreAlertKey)
          newAlerts.push({
            id: scoreAlertKey,
            type: 'danger',
            priority: 'high',
            symbol,
            title: 'Unicorn Score Deteriorating',
            message: `${symbol} Unicorn Score: ${score.toFixed(0)}/100 (BEARISH) - Fresh data!`,
            action: 'Consider tightening stop or exiting',
            timestamp: currentTime
          })
        }

        if (side === 'short' && score > 70 && !isOnCooldown(scoreAlertKey)) {
          markAlertFired(scoreAlertKey)
          newAlerts.push({
            id: scoreAlertKey,
            type: 'danger',
            priority: 'high',
            symbol,
            title: 'Unicorn Score Rising',
            message: `${symbol} Unicorn Score: ${score.toFixed(0)}/100 (BULLISH) - Fresh data!`,
            action: 'Cover short or tighten stop',
            timestamp: currentTime
          })
        }

        // PhD++ NEW: Position Health Alert (with cooldown)
        const health = calculatePositionHealth(position, scoreData)
        const healthAlertKey = `health-critical-${symbol}`
        if (health.score < 35 && !isOnCooldown(healthAlertKey)) {
          markAlertFired(healthAlertKey)
          newAlerts.push({
            id: healthAlertKey,
            type: 'danger',
            priority: 'high',
            symbol,
            title: `🏥 Position Health Critical: ${health.score}/100`,
            message: `${symbol} health is ${health.label}. Tech: ${Math.round(health.techHealth)}%, P&L: ${Math.round(health.plHealth)}%, Risk: ${Math.round(health.rHealth)}%`,
            action: 'Consider exiting or tightening stop immediately',
            timestamp: currentTime
          })
        }
      }

      // Alert 2: Large Price Move (with cooldown)
      const priceChange = side === 'long' ?
        ((currentPrice - entry) / entry) * 100 :
        ((entry - currentPrice) / entry) * 100

      const moveAlertKey = `move-${symbol}-${side}`
      if (Math.abs(priceChange) > 5 && !isOnCooldown(moveAlertKey)) {
        markAlertFired(moveAlertKey)
        const isProfit = priceChange > 0
        newAlerts.push({
          id: moveAlertKey,
          type: isProfit ? 'success' : 'warning',
          priority: 'medium',
          symbol,
          title: `Large ${isProfit ? 'Gain' : 'Loss'}: ${Math.abs(priceChange).toFixed(1)}%`,
          message: `${symbol} moved ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}% from entry`,
          action: isProfit ? 'Consider trailing stop' : 'Review position sizing',
          timestamp: currentTime
        })
      }

      // PhD++ Alert 3: SATY-Based Stop Loss Recommendation (with cooldown)
      if (marketData.symbol === symbol && marketData.overlays?.saty) {
        const saty = marketData.overlays.saty
        const stopLevel = side === 'long' ? saty.levels?.t0236?.dn : saty.levels?.t0236?.up

        if (stopLevel) {
          const distanceToSATY = Math.abs(currentPrice - stopLevel) / currentPrice * 100

          // Alert if price is near SATY level (good stop location)
          const satyStopKey = `saty-stop-${symbol}`
          if (distanceToSATY < 1 && !isOnCooldown(satyStopKey)) {
            markAlertFired(satyStopKey)
            newAlerts.push({
              id: satyStopKey,
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
          const satyBrokenKey = `saty-broken-${symbol}`
          const stopBroken = side === 'long' ? currentPrice < stopLevel : currentPrice > stopLevel
          if (stopBroken && !isOnCooldown(satyBrokenKey)) {
            markAlertFired(satyBrokenKey)
            newAlerts.push({
              id: satyBrokenKey,
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

          const satyTargetKey = `saty-target-${symbol}`
          if (distanceToTarget < 2 && !isOnCooldown(satyTargetKey)) {
            markAlertFired(satyTargetKey)
            newAlerts.push({
              id: satyTargetKey,
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

      // PhD++ Alert 4: Regime Change Warning - NOW USES FRESH DATA! (with cooldown)
      if (scoreData?.signalState?.regime) {
        const regime = scoreData.signalState.regime
        const regimeScore = scoreData.signalState.rawScore || 0
        const regimeAlertKey = `regime-${symbol}-${side}`

        // Alert if holding long position but regime turned bearish
        if (side === 'long' && regimeScore < -35 && !isOnCooldown(regimeAlertKey)) {
          markAlertFired(regimeAlertKey)
          newAlerts.push({
            id: regimeAlertKey,
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
        if (side === 'short' && regimeScore > 35 && !isOnCooldown(regimeAlertKey)) {
          markAlertFired(regimeAlertKey)
          newAlerts.push({
            id: regimeAlertKey,
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

      // PhD++ Alert 5: AI vs Technical Score Divergence (with cooldown)
      // IMPORTANT: When sentiment/forecast conflicts with technicals
      if (marketData.unicornScore?.ultraUnicornScore && marketData.symbol === symbol) {
        const techScore = scoreData?.score || 0
        const aiScore = marketData.unicornScore.ultraUnicornScore
        const divergence = Math.abs(techScore - aiScore)
        const divergenceAlertKey = `divergence-${symbol}`

        // Alert if AI score and technical score differ by more than 25 points
        if (divergence > 25 && !isOnCooldown(divergenceAlertKey)) {
          const techBullish = techScore >= 60
          const aiBullish = aiScore >= 60

          // Only alert if they're on different sides
          if (techBullish !== aiBullish) {
            markAlertFired(divergenceAlertKey)
            newAlerts.push({
              id: divergenceAlertKey,
              type: 'warning',
              priority: 'high',
              symbol,
              title: '⚠️ AI vs Technical Divergence',
              message: `Tech: ${techScore.toFixed(0)} vs AI: ${aiScore.toFixed(0)} - ${techBullish ? 'Tech bullish but AI bearish' : 'AI bullish but Tech bearish'}`,
              action: techBullish
                ? 'AI sentiment/forecast is bearish - consider caution on longs'
                : 'AI sentiment/forecast is bullish - technicals may catch up',
              timestamp: currentTime
            })
          }
        }
      }

      // PhD++ Alert 6: RSI Divergence Warning - NOW USES FRESH DATA! (with cooldown)
      if (scoreData?.signalState?.rsi) {
        const rsi = scoreData.signalState.rsi

        // Overbought warning for longs
        const rsiOBKey = `rsi-ob-${symbol}`
        if (side === 'long' && rsi > 80 && !isOnCooldown(rsiOBKey)) {
          markAlertFired(rsiOBKey)
          newAlerts.push({
            id: rsiOBKey,
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
        const rsiOSKey = `rsi-os-${symbol}`
        if (side === 'short' && rsi < 20 && !isOnCooldown(rsiOSKey)) {
          markAlertFired(rsiOSKey)
          newAlerts.push({
            id: rsiOSKey,
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

    // Add new alerts (avoid duplicates) - PhD++ FIX: Also check global alert tracker
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const existingIds = new Set(prev.map(a => a.id))
        const uniqueNew = newAlerts.filter(a => {
          // PhD++ FIX: Triple protection - check existing IDs, global tracker, AND cooldown
          if (existingIds.has(a.id)) return false
          if (wasAlertEverAdded(a.id)) return false
          // Mark as added globally
          markAlertAdded(a.id)
          return true
        })

        // Speak high priority alerts using voice synthesis
        uniqueNew.forEach(alert => {
          if (alert.priority === 'high') {
            const voiceMessage = `${alert.title}. ${alert.symbol}. ${alert.action}`
            speakAlert(voiceMessage, 'high')
          } else if (alert.priority === 'medium') {
            const voiceMessage = `${alert.symbol} alert: ${alert.message}`
            speakAlert(voiceMessage, 'normal')
          }
        })

        return [...uniqueNew, ...prev].slice(0, 10) // Keep last 10 alerts
      })
    }

    setLastCheck(currentTime)

    } finally {
      // PhD++ FIX: Always release the lock
      analyzeInProgressRef.current = false
    }
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

        // Alert if news sentiment contradicts position (with cooldown)
        const isBearishNews = sentiment === 'negative' && score < -0.3
        const isBullishNews = sentiment === 'positive' && score > 0.3

        const newsAlertKey = `news-${symbol}-${position.side}`
        if ((position.side === 'long' && isBearishNews) || (position.side === 'short' && isBullishNews)) {
          if (!isOnCooldown(newsAlertKey, 120000)) { // 2 min cooldown for news
            markAlertFired(newsAlertKey)
            const currentTime = Date.now()
            setAlerts(prev => [{
              id: newsAlertKey,
              type: 'warning',
              priority: 'high',
              symbol,
              title: `📰 Breaking News Alert`,
              message: `${sentiment.toUpperCase()} news: "${latestNews.headline.slice(0, 80)}..."`,
              action: `Review your ${position.side} position - news sentiment: ${(score * 100).toFixed(0)}%`,
              timestamp: currentTime
            }, ...prev].slice(0, 10))
          }
        }

        // Alert on very strong news regardless of position (with cooldown)
        const strongNewsKey = `news-strong-${symbol}`
        if (Math.abs(score) > 0.7 && !isOnCooldown(strongNewsKey, 120000)) {
          markAlertFired(strongNewsKey)
          const currentTime = Date.now()
          setAlerts(prev => [{
            id: strongNewsKey,
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
    // PhD++ CRITICAL: Don't scan with stale/loading data
    if (!marketData.symbol || marketData.isLoading) return

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
      // PhD++ FIX: Use AI score when available, fallback to technical
      const effectiveScore = marketData.unicornScore?.ultraUnicornScore || state.score
      const scoreLabel = marketData.unicornScore ? 'AI' : 'Tech'

      // PhD++ Use stable IDs with cooldown for all opportunity alerts
      // POSITION-AWARE: Different alerts based on current position
      const unicornKey = `unicorn-perfect-${symbol}`
      if (effectiveScore >= 80 && state.rawScore >= 75 && currentPrice && !isOnCooldown(unicornKey)) {
        markAlertFired(unicornKey)
        const satyStop = state.saty?.support || (currentPrice * 0.985)
        const positionBadge = getPositionBadge(symbol)

        // PhD++ POSITION-AWARE LOGIC
        let alertType = 'success'
        let alertTitle = '🦄 PERFECT UNICORN SETUP!'
        let alertAction = 'Consider entering LONG position'
        let alertPriority = 'high'

        if (hasPositionAlignment(symbol, 'bullish')) {
          // Already LONG and bullish signal = great, just hold
          alertType = 'info'
          alertTitle = '🦄 UNICORN CONFIRMS LONG!'
          alertAction = 'Position aligned with setup - hold or consider adding'
          alertPriority = 'medium'
        } else if (hasPositionConflict(symbol, 'bullish')) {
          // SHORT but bullish signal = CONFLICT WARNING
          alertType = 'danger'
          alertTitle = '⚠️ BULLISH SETUP vs SHORT POSITION!'
          alertAction = 'Consider covering short - strong bullish alignment detected'
          alertPriority = 'high'
        } else {
          // No position - standard entry suggestion
          const riskMsg = positions.length >= riskConfig.maxConcurrentPositions
            ? ` ⚠️ Max positions reached (${positions.length}/${riskConfig.maxConcurrentPositions})`
            : ` ✓ Risk controls OK (${dailyStats.tradesCount}/${riskConfig.dailyMaxTrades} trades today)`
          alertAction = `Consider entering LONG position.${riskMsg}`
        }

        setAlerts(prev => {
          // PhD++ FIX: Triple protection against duplicates
          if (prev.some(a => a.id === unicornKey)) return prev
          if (wasAlertEverAdded(unicornKey)) return prev
          markAlertAdded(unicornKey)

          return [{
            id: unicornKey,
            type: alertType,
            priority: alertPriority,
            symbol,
            title: alertTitle,
            message: `${symbol} ${scoreLabel} Score: ${effectiveScore.toFixed(0)}/100 - ALL indicators aligned.`,
            action: alertAction,
            timestamp: currentTime,
            suggestedEntry: currentPrice,
            suggestedStop: satyStop,
            positionBadge  // PhD++ Add position badge for UI
          }, ...prev].slice(0, 10)
        })
      }

      // Squeeze Fire + Trend Alignment - POSITION-AWARE
      const squeezeKey = `squeeze-fire-${symbol}`
      if (state.sq?.fired && state.pivotNow === 'bullish' && state.ichiRegime === 'bullish' && !isOnCooldown(squeezeKey)) {
        markAlertFired(squeezeKey)
        const squeezeDir = state.sq.dir === 'up' ? 'bullish' : 'bearish'
        const positionBadge = getPositionBadge(symbol)

        // PhD++ POSITION-AWARE
        let alertType = 'success'
        let alertTitle = '💥 Squeeze Fired + Trend Aligned!'
        let alertAction = `Breakout in progress - consider ${state.sq.dir === 'up' ? 'LONG' : 'SHORT'}`

        if (hasPositionAlignment(symbol, squeezeDir)) {
          alertType = 'info'
          alertTitle = '💥 Squeeze Confirms Position!'
          alertAction = `Breakout supports your ${getPositionSide(symbol)?.toUpperCase()} - momentum building`
        } else if (hasPositionConflict(symbol, squeezeDir)) {
          alertType = 'danger'
          alertTitle = '💥 Squeeze AGAINST Position!'
          alertAction = `Breakout against your ${getPositionSide(symbol)?.toUpperCase()} - review position immediately`
        }

        setAlerts(prev => {
          // PhD++ FIX: Triple protection against duplicates
          if (prev.some(a => a.id === squeezeKey)) return prev
          if (wasAlertEverAdded(squeezeKey)) return prev
          markAlertAdded(squeezeKey)

          return [{
            id: squeezeKey,
            type: alertType,
            priority: 'high',
            symbol,
            title: alertTitle,
            message: `${symbol} squeeze released ${state.sq.dir === 'up' ? 'BULLISH' : 'BEARISH'}`,
            action: alertAction,
            timestamp: currentTime,
            positionBadge
          }, ...prev].slice(0, 10)
        })
      }

      // High Volume + Strong Momentum + SATY Trigger - POSITION-AWARE
      const momentumKey = `momentum-${symbol}`
      if (state.relativeVolume > 2.0 && state.rsi > 60 && state.satyDir === 'long' && !isOnCooldown(momentumKey)) {
        markAlertFired(momentumKey)
        const positionBadge = getPositionBadge(symbol)

        // PhD++ POSITION-AWARE
        let alertType = 'success'
        let alertAction = 'Strong momentum confirmed - watch for entry'

        if (hasPositionAlignment(symbol, 'bullish')) {
          alertType = 'info'
          alertAction = 'Momentum supports your LONG - position strengthening'
        } else if (hasPositionConflict(symbol, 'bullish')) {
          alertType = 'warning'
          alertAction = 'Bullish momentum against your SHORT - monitor closely'
        }

        setAlerts(prev => {
          // PhD++ FIX: Triple protection against duplicates
          if (prev.some(a => a.id === momentumKey)) return prev
          if (wasAlertEverAdded(momentumKey)) return prev
          markAlertAdded(momentumKey)

          return [{
            id: momentumKey,
            type: alertType,
            priority: 'medium',
            symbol,
            title: '⚡ High Volume Momentum Setup',
            message: `${symbol} - Volume: ${state.relativeVolume.toFixed(1)}x avg, RSI: ${state.rsi.toFixed(0)}`,
            action: alertAction,
            timestamp: currentTime,
            positionBadge
          }, ...prev].slice(0, 10)
        })
      }

      // Bearish Perfect Setup (score < 20) - POSITION-AWARE
      const bearKey = `bear-perfect-${symbol}`
      if (effectiveScore <= 20 && state.rawScore <= -75 && !isOnCooldown(bearKey)) {
        markAlertFired(bearKey)
        const positionBadge = getPositionBadge(symbol)

        // PhD++ POSITION-AWARE LOGIC - Critical for protecting LONG positions!
        let alertType = 'warning'
        let alertTitle = '🐻 PERFECT BEARISH SETUP!'
        let alertAction = 'Consider entering SHORT position'
        let alertPriority = 'high'

        if (hasPositionConflict(symbol, 'bearish')) {
          // LONG but bearish signal = CRITICAL EXIT WARNING!
          alertType = 'danger'
          alertTitle = '🚨 BEARISH SETUP vs LONG POSITION!'
          alertAction = 'EXIT LONG NOW - Strong bearish alignment detected against your position'
          alertPriority = 'critical' // Highest priority
        } else if (hasPositionAlignment(symbol, 'bearish')) {
          // Already SHORT and bearish signal = great, just hold
          alertType = 'info'
          alertTitle = '🐻 BEARISH CONFIRMS SHORT!'
          alertAction = 'Position aligned with setup - hold or consider adding'
          alertPriority = 'medium'
        }

        setAlerts(prev => {
          // PhD++ FIX: Triple protection against duplicates
          if (prev.some(a => a.id === bearKey)) return prev
          if (wasAlertEverAdded(bearKey)) return prev
          markAlertAdded(bearKey)

          return [{
            id: bearKey,
            type: alertType,
            priority: alertPriority,
            symbol,
            title: alertTitle,
            message: `${symbol} ${scoreLabel} Score: ${effectiveScore.toFixed(0)}/100 - Strong bearish alignment`,
            action: alertAction,
            timestamp: currentTime,
            positionBadge
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

  // PhD++ CHRONOS FORECAST INTEGRATION: Listen for AI predictions
  useEffect(() => {
    const handleChronosAlert = (event) => {
      const alert = event.detail
      if (!alert) return

      const chronosKey = `chronos-${alert.symbol}`

      // Check cooldown (5 min for Chronos alerts)
      if (isOnCooldown(chronosKey, 300000)) return
      markAlertFired(chronosKey)

      // Check if we already have this alert
      if (wasAlertEverAdded(alert.id)) return
      markAlertAdded(alert.id)

      // Add forecast alert with special styling
      setAlerts(prev => [{
        id: alert.id,
        type: alert.direction === 'bullish' ? 'success' : alert.direction === 'bearish' ? 'danger' : 'info',
        priority: alert.priority || 'medium',
        symbol: alert.symbol,
        title: alert.title,
        message: alert.message,
        action: `Target: $${alert.targetPrice?.toFixed(2)} • ${alert.confidence}% confidence`,
        timestamp: alert.timestamp,
        isChronosForecast: true,
        forecastData: {
          targetPrice: alert.targetPrice,
          confidence: alert.confidence,
          direction: alert.direction
        },
        actions: alert.actions
      }, ...prev].slice(0, 10))

      // Voice announcement for high confidence
      if (alert.confidence >= 80) {
        const voiceMsg = `AVA predicts ${alert.symbol} will ${
          alert.direction === 'bullish' ? 'rise' : alert.direction === 'bearish' ? 'fall' : 'stay flat'
        }. Confidence ${alert.confidence} percent.`
        speakAlert(voiceMsg)
      }
    }

    window.addEventListener('ava.chronosAlert', handleChronosAlert)
    return () => window.removeEventListener('ava.chronosAlert', handleChronosAlert)
  }, [])

  // PhD++ CONFLUENCE CHANGE ALERT: Alert when confluence changes to FULL (with cooldown) - POSITION-AWARE
  useEffect(() => {
    if (!marketData.signalState) return

    const currentConfluence = getConfluenceStatus()
    const symbol = marketData.symbol

    // Check for confluence change to FULL
    const confluenceKey = `confluence-${symbol}`
    if (lastConfluence?.status !== 'full' && currentConfluence.status === 'full' && symbol && !isOnCooldown(confluenceKey, 300000)) {
      markAlertFired(confluenceKey)
      const direction = currentConfluence.direction.toUpperCase()
      const dirLower = currentConfluence.direction
      const currentTime = Date.now()
      const positionBadge = getPositionBadge(symbol)

      // PhD++ POSITION-AWARE confluence alerts
      let alertType = 'success'
      let alertTitle = `🎯 FULL CONFLUENCE: ${direction}`
      let alertAction = direction === 'BULLISH' ? 'High-conviction LONG setup' : 'High-conviction SHORT setup'
      let alertPriority = 'high'

      if (hasPositionAlignment(symbol, dirLower)) {
        // Confluence aligns with position - great!
        alertType = 'success'
        alertTitle = `🎯 CONFLUENCE CONFIRMS ${getPositionSide(symbol)?.toUpperCase()}!`
        alertAction = `All timeframes aligned with your position - strong conviction hold`
      } else if (hasPositionConflict(symbol, dirLower)) {
        // Confluence conflicts with position - DANGER!
        alertType = 'danger'
        alertTitle = `🚨 CONFLUENCE AGAINST ${getPositionSide(symbol)?.toUpperCase()} POSITION!`
        alertAction = `EXIT ${getPositionSide(symbol)?.toUpperCase()} - All timeframes now ${direction}`
        alertPriority = 'critical'
      }

      setAlerts(prev => {
        // PhD++ FIX: Triple protection against duplicates
        if (prev.some(a => a.id === confluenceKey)) return prev
        if (wasAlertEverAdded(confluenceKey)) return prev
        markAlertAdded(confluenceKey)

        return [{
          id: confluenceKey,
          type: alertType,
          priority: alertPriority,
          symbol,
          title: alertTitle,
          message: `${symbol} now has ${currentConfluence.count} timeframes aligned ${direction}`,
          action: alertAction,
          timestamp: currentTime,
          positionBadge
        }, ...prev].slice(0, 10)
      })
    }

    // Track current confluence state
    setLastConfluence(currentConfluence)
  }, [marketData.signalState, marketData.dailyState, marketData.consensus])

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  // Clear all alerts
  const clearAll = () => {
    setAlerts([])
  }

  // PhD++ Track executing state for loading feedback
  const [executingAlerts, setExecutingAlerts] = useState(new Set())
  const [snoozedAlerts, setSnoozedAlerts] = useState({}) // Track snoozed alerts with expiry
  const [showAllPositions, setShowAllPositions] = useState(false) // PhD++ Toggle for all positions

  // PhD++ Snooze an alert for N minutes
  const snoozeAlert = (alertId, minutes = 15) => {
    setSnoozedAlerts(prev => ({
      ...prev,
      [alertId]: Date.now() + (minutes * 60 * 1000)
    }))
    dismissAlert(alertId)
    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: {
        text: `Alert snoozed for ${minutes} minutes`,
        type: 'info',
        ttl: 2000
      }
    }))
  }

  // PhD++ Check if an alert is snoozed
  const isAlertSnoozed = (alertId) => {
    const expiry = snoozedAlerts[alertId]
    return expiry && Date.now() < expiry
  }

  // PhD++ ONE-CLICK EXECUTION: Execute alert recommendation with loading states
  const executeAlert = async (alert) => {
    if (!alert.symbol) return

    // Mark as executing
    setExecutingAlerts(prev => new Set([...prev, alert.id]))

    try {
      // PhD++ POSITION CONFLICT ALERTS (bearish vs long, confluence against position)
      if (alert.id.includes('bear-perfect') || alert.id.includes('confluence')) {
        // Only act if this is a conflict (danger type)
        if (alert.type === 'danger' || alert.priority === 'critical') {
          const pos = getPosition(alert.symbol)
          if (!pos) {
            setExecutingAlerts(prev => { const n = new Set(prev); n.delete(alert.id); return n })
            return
          }

          const confirmed = window.confirm(
            `🚨 POSITION CONFLICT DETECTED\n\n${alert.title}\n${alert.message}\n\n` +
            `Your ${pos.side.toUpperCase()} position is at risk!\n\n` +
            `OK = Close entire position NOW\n` +
            `Cancel = I'll manage manually`
          )

          if (confirmed) {
            window.dispatchEvent(new CustomEvent('iava-close-position', {
              detail: { symbol: alert.symbol, reason: alert.title }
            }))

            dismissAlert(alert.id)

            window.dispatchEvent(new CustomEvent('iava.toast', {
              detail: {
                text: `Closing ${alert.symbol} ${pos.side} position...`,
                type: 'warning',
                ttl: 3000
              }
            }))
          }
        }
      }
      // CRITICAL: Exit position immediately (SATY broken, regime change)
      else if (alert.id.includes('saty-broken') || alert.id.includes('regime')) {
        const confirmed = window.confirm(
          `⚠️ CRITICAL ALERT\n\n${alert.title}\n${alert.message}\n\n` +
          `This will close your ${alert.symbol} position immediately. Continue?`
        )

        if (confirmed) {
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
      } else if (alert.id.includes('health-critical') || alert.id.includes('score-')) {
        // PhD++ Health/Score deterioration - offer multiple exit options
        const choice = window.confirm(
          `⚠️ POSITION AT RISK\n\n${alert.title}\n${alert.message}\n\n` +
          `Choose action:\n` +
          `OK = Close 25% (reduce risk)\n` +
          `Cancel = Do nothing (monitor manually)`
        )

        if (choice) {
          window.dispatchEvent(new CustomEvent('iava-take-profits', {
            detail: { symbol: alert.symbol, percentage: 25, reason: alert.title }
          }))

          dismissAlert(alert.id)

          window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: {
              text: `Reducing ${alert.symbol} position by 25%`,
              type: 'warning',
              ttl: 3000
            }
          }))
        }
      }
    } finally {
      // Clear executing state
      setExecutingAlerts(prev => { const n = new Set(prev); n.delete(alert.id); return n })
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

        {/* PhD++ Position Health Cards with Show All Toggle */}
        {positions.length > 0 && (
          <div className="bg-slate-900/30 px-3 py-2 border-b border-slate-700/50 space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-slate-500 font-semibold">POSITION HEALTH ({positions.length})</div>
              {positions.length > 3 && (
                <button
                  onClick={() => setShowAllPositions(!showAllPositions)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {showAllPositions ? 'Show less' : `Show all ${positions.length}`}
                </button>
              )}
            </div>
            {(showAllPositions ? positions : positions.slice(0, 3)).map(pos => {
              const scoreData = symbolScores[pos.symbol]
              const health = calculatePositionHealth(pos, scoreData)
              const plPct = pos.side === 'long'
                ? ((parseFloat(pos.current_price) - parseFloat(pos.avg_entry_price)) / parseFloat(pos.avg_entry_price)) * 100
                : ((parseFloat(pos.avg_entry_price) - parseFloat(pos.current_price)) / parseFloat(pos.avg_entry_price)) * 100
              const unrealizedPL = parseFloat(pos.unrealized_pl || 0)

              return (
                <div key={pos.symbol} className="flex items-center justify-between bg-slate-800/50 rounded px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{pos.symbol}</span>
                    <span className={`text-xs ${pos.side === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pos.side.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">{parseFloat(pos.qty)} shs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-xs font-medium ${plPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {plPct >= 0 ? '+' : ''}{plPct.toFixed(1)}%
                      </span>
                      <span className={`text-xs ml-1 ${unrealizedPL >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                        (${unrealizedPL >= 0 ? '+' : ''}{unrealizedPL.toFixed(0)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-8 h-1.5 rounded-full bg-slate-700 overflow-hidden`}>
                        <div
                          className={`h-full rounded-full transition-all ${
                            health.score >= 65 ? 'bg-emerald-500' :
                            health.score >= 50 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${health.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${health.color}`}>{health.score}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PhD++ Multi-TF Confluence Indicator */}
        {(marketData.signalState || isDataLoading) && (
          <div className="bg-slate-900/30 px-3 py-2 border-b border-slate-700/50">
            <div className="text-xs text-slate-500 font-semibold mb-1.5">MULTI-TF CONFLUENCE</div>
            {isDataLoading ? (
              <div className="text-xs text-amber-400 animate-pulse">Loading timeframe data...</div>
            ) : (
            <div className="flex items-center gap-3">
              {/* Primary Timeframe */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">Primary:</span>
                <span className={`text-xs font-semibold ${
                  marketData.signalState.pivotNow === 'bullish' ? 'text-emerald-400' :
                  marketData.signalState.pivotNow === 'bearish' ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {marketData.signalState.pivotNow === 'bullish' ? '↑' :
                   marketData.signalState.pivotNow === 'bearish' ? '↓' : '—'}
                </span>
              </div>

              {/* Higher Timeframe */}
              {marketData.consensus?.secondary && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Higher:</span>
                  <span className={`text-xs font-semibold ${
                    marketData.consensus.secondary.pivotNow === 'bullish' ? 'text-emerald-400' :
                    marketData.consensus.secondary.pivotNow === 'bearish' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {marketData.consensus.secondary.pivotNow === 'bullish' ? '↑' :
                     marketData.consensus.secondary.pivotNow === 'bearish' ? '↓' : '—'}
                  </span>
                </div>
              )}

              {/* Daily Timeframe */}
              {marketData.dailyState && marketData.timeframe !== '1Day' && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Daily:</span>
                  <span className={`text-xs font-semibold ${
                    marketData.dailyState.pivotNow === 'bullish' ? 'text-emerald-400' :
                    marketData.dailyState.pivotNow === 'bearish' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {marketData.dailyState.pivotNow === 'bullish' ? '↑' :
                     marketData.dailyState.pivotNow === 'bearish' ? '↓' : '—'}
                  </span>
                </div>
              )}

              {/* Confluence Status */}
              <div className="ml-auto flex items-center gap-1.5">
                {(() => {
                  const primary = marketData.signalState?.pivotNow
                  // Only include daily if NOT already on Daily timeframe (avoid double-counting)
                  const daily = marketData.timeframe !== '1Day' ? marketData.dailyState?.pivotNow : null
                  const secondary = marketData.consensus?.secondary?.pivotNow

                  // Count ALL timeframes shown (including neutrals)
                  const allTFs = [primary, daily, secondary].filter(d => d !== null && d !== undefined)
                  // Count only directional (non-neutral) timeframes
                  const directions = allTFs.filter(d => d !== 'neutral')
                  const bullishCount = directions.filter(d => d === 'bullish').length
                  const bearishCount = directions.filter(d => d === 'bearish').length
                  const neutralCount = allTFs.filter(d => d === 'neutral').length

                  // FULL requires ALL shown TFs to be directional AND aligned (no neutrals)
                  const allDirectionalAndAligned = neutralCount === 0 && allTFs.length >= 2 &&
                    (bullishCount === allTFs.length || bearishCount === allTFs.length)

                  // On single TF, just show the primary direction
                  if (allTFs.length < 2) {
                    const direction = primary === 'bullish' ? 'BULLISH' : primary === 'bearish' ? 'BEARISH' : 'NEUTRAL'
                    const color = primary === 'bullish' ? 'text-emerald-400' : primary === 'bearish' ? 'text-red-400' : 'text-slate-500'
                    return (
                      <span className={`text-xs font-medium ${color} flex items-center gap-1`}>
                        <span className={`w-2 h-2 rounded-full ${primary === 'bullish' ? 'bg-emerald-500' : primary === 'bearish' ? 'bg-red-500' : 'bg-slate-600'}`} />
                        {direction}
                      </span>
                    )
                  }

                  if (allDirectionalAndAligned) {
                    const dir = bullishCount > 0 ? 'BULLISH' : 'BEARISH'
                    const color = bullishCount > 0 ? 'text-emerald-400' : 'text-red-400'
                    const bgColor = bullishCount > 0 ? 'bg-emerald-500' : 'bg-red-500'
                    return (
                      <span className={`text-xs font-bold ${color} flex items-center gap-1`}>
                        <span className={`w-2 h-2 rounded-full ${bgColor} animate-pulse`} />
                        FULL {dir}
                      </span>
                    )
                  } else if (bullishCount >= 2 || bearishCount >= 2) {
                    const dir = bullishCount > bearishCount ? '↑' : '↓'
                    return (
                      <span className="text-xs font-medium text-cyan-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-500" />
                        {Math.max(bullishCount, bearishCount)}/{allTFs.length} {dir}
                      </span>
                    )
                  } else if (directions.length > 0) {
                    return (
                      <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        MIXED
                      </span>
                    )
                  } else {
                    return (
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                        NEUTRAL
                      </span>
                    )
                  }
                })()}
              </div>
            </div>
            )}
          </div>
        )}

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

              {/* PhD++ PRIORITY SORTING: critical > high > medium > low */}
              {[...alerts].sort((a, b) => {
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
              }).map(alert => {
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
                                    alert.id.includes('saty-target') ||
                                    alert.id.includes('health-critical') ||
                                    alert.id.includes('score-') ||
                                    alert.id.includes('bear-perfect') ||
                                    alert.id.includes('confluence') // PhD++ Add conflict alerts

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${alertStyles[alert.type] || alertStyles.info} animate-slide-in-right ${
                      alert.priority === 'critical' ? 'ring-2 ring-red-500 animate-pulse' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-base">{iconMap[alert.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-200 flex items-center gap-2 flex-wrap">
                            <span>{alert.title}</span>
                            {/* PhD++ Priority badges */}
                            {alert.priority === 'critical' && (
                              <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                ⚠️ CRITICAL
                              </span>
                            )}
                            {alert.priority === 'high' && alert.priority !== 'critical' && (
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                                HIGH
                              </span>
                            )}
                          </div>
                          {/* PhD++ Position Badge */}
                          {alert.positionBadge && (
                            <div className="text-xs text-cyan-400 mt-0.5 font-medium">
                              {alert.positionBadge}
                            </div>
                          )}
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

                    {/* PhD++ ONE-CLICK EXECUTION BUTTONS with Loading + Snooze */}
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                        {/* PhD++ Snooze button */}
                        <button
                          onClick={() => snoozeAlert(alert.id, 15)}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                          title="Snooze for 15 minutes"
                        >
                          💤
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isActionable && (
                          <button
                            onClick={() => executeAlert(alert)}
                            disabled={executingAlerts.has(alert.id)}
                            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                              executingAlerts.has(alert.id)
                                ? 'bg-slate-600/50 text-slate-400 cursor-wait'
                                : alert.type === 'danger' || alert.priority === 'critical'
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40'
                                : alert.type === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                                : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40'
                            }`}
                          >
                            {executingAlerts.has(alert.id) ? '⏳ ...' : '⚡ Execute'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Market Status */}
        {marketData.symbol && (
          <div className="bg-slate-800/30 px-3 py-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs">
              <div className="text-slate-400">
                {/* PhD++ FIX: Use isDataLoading which detects symbol changes */}
                {marketData.symbol}: {isDataLoading ? (
                  <span className="text-amber-400 animate-pulse">Loading...</span>
                ) : (
                  <span className="text-slate-200">${marketData.currentPrice?.toFixed(2) || 'N/A'}</span>
                )}
              </div>
              {!isDataLoading && marketData.signalState && (
                <div className="flex items-center gap-3">
                  {/* Technical Score */}
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Tech:</span>
                    <span className={`font-bold ${
                      (marketData.signalState.score || 0) >= 70 ? 'text-emerald-400' :
                      (marketData.signalState.score || 0) >= 50 ? 'text-cyan-400' :
                      (marketData.signalState.score || 0) >= 35 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {(marketData.signalState.score || 0).toFixed(0)}
                    </span>
                  </div>
                  {/* Ultra Unicorn Score (AI-powered with bonuses) */}
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">🦄 AI:</span>
                    <span className={`font-bold ${
                      (marketData.unicornScore?.ultraUnicornScore || 0) >= 70 ? 'text-emerald-400' :
                      (marketData.unicornScore?.ultraUnicornScore || 0) >= 50 ? 'text-cyan-400' :
                      (marketData.unicornScore?.ultraUnicornScore || 0) >= 35 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {marketData.unicornScore?.ultraUnicornScore?.toFixed(0) || '--'}
                    </span>
                    {/* Show bonus breakdown if bonuses applied */}
                    {marketData.unicornScore?.bonuses?.total > 0 && (
                      <span className="text-emerald-400" title={`Daily: +${marketData.unicornScore.bonuses.dailyConfluence || 0}, Consensus: +${marketData.unicornScore.bonuses.consensusAlignment || 0}, Vol: +${marketData.unicornScore.bonuses.volumeBreakout || 0}`}>
                        (+{marketData.unicornScore.bonuses.total})
                      </span>
                    )}
                    {/* Show GATED warning */}
                    {marketData.unicornScore?.bonuses?.gated && (
                      <span className="text-amber-400" title={marketData.unicornScore.bonuses.gateReason || 'Daily confluence not met'}>
                        ⛔
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
