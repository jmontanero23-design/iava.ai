/**
 * Level 2 Market Depth - Ultra Elite+++ Real-Time Order Book Visualization
 *
 * Production-ready implementation with:
 * - Real API integration with /api/market/depth endpoint
 * - WebSocket fallback architecture for real-time updates
 * - Intelligent error handling with exponential backoff
 * - Live time & sales tape reading
 * - Market maker activity detection
 * - Order flow imbalance analysis
 * - Spread analytics with institutional detection
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

// Configuration constants
const REFRESH_INTERVAL_MS = 5000 // 5 seconds for Level 2 data
const MAX_RETRY_ATTEMPTS = 3
const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30000

// Connection states for status indicator
const CONNECTION_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
}

export default function Level2MarketDepth() {
  const { marketData } = useMarketData()

  // Core data state
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] })
  const [quote, setQuote] = useState({ bid: 0, ask: 0, spread: 0, spreadPercent: 0 })
  const [metrics, setMetrics] = useState({
    totalBidSize: 0,
    totalAskSize: 0,
    imbalance: 0,
    bidAskRatio: 1,
    weightedBid: 0,
    weightedAsk: 0
  })
  const [timeAndSales, setTimeAndSales] = useState([])
  const [mmSignals, setMmSignals] = useState([])
  const [orderFlow, setOrderFlow] = useState({ buyVolume: 0, sellVolume: 0, neutralVolume: 0 })

  // UI state
  const [depth, setDepth] = useState(10)
  const [aggregation, setAggregation] = useState(0.01)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showImbalance, setShowImbalance] = useState(true)
  const [autoCenter, setAutoCenter] = useState(true)
  const [showAI, setShowAI] = useState(true)

  // Connection/loading state
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.CONNECTING)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Refs
  const containerRef = useRef(null)
  const wsRef = useRef(null)
  const refreshIntervalRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const isMountedRef = useRef(true)

  // Get current symbol from market data context
  const symbol = useMemo(() => {
    return marketData?.symbol || 'SPY'
  }, [marketData?.symbol])

  /**
   * Calculate exponential backoff delay
   */
  const getBackoffDelay = useCallback((attempt) => {
    const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
    return Math.min(delay, MAX_BACKOFF_MS)
  }, [])

  /**
   * Fetch market depth data from API
   */
  const fetchMarketDepth = useCallback(async (isRetry = false) => {
    if (!isMountedRef.current) return

    try {
      if (!isRetry) {
        setConnectionState(CONNECTION_STATES.CONNECTING)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(`/api/market/depth?symbol=${encodeURIComponent(symbol)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!isMountedRef.current) return

      // Validate response structure
      if (!data || !data.depth) {
        throw new Error('Invalid response structure from API')
      }

      // Update all state with real data
      setOrderBook({
        bids: processOrderBookLevels(data.depth.bids || [], depth, 'bid'),
        asks: processOrderBookLevels(data.depth.asks || [], depth, 'ask')
      })

      if (data.quote) {
        setQuote({
          bid: parseFloat(data.quote.bid) || 0,
          ask: parseFloat(data.quote.ask) || 0,
          spread: parseFloat(data.quote.spread) || 0,
          spreadPercent: parseFloat(data.quote.spreadPercent) || 0
        })
      }

      if (data.metrics) {
        setMetrics({
          totalBidSize: data.metrics.totalBidSize || 0,
          totalAskSize: data.metrics.totalAskSize || 0,
          imbalance: parseFloat(data.metrics.imbalance) || 0,
          bidAskRatio: parseFloat(data.metrics.bidAskRatio) || 1,
          weightedBid: parseFloat(data.metrics.weightedBid) || 0,
          weightedAsk: parseFloat(data.metrics.weightedAsk) || 0
        })
      }

      if (data.timeAndSales) {
        setTimeAndSales(data.timeAndSales.slice(0, 20))
      }

      if (data.mmSignals) {
        setMmSignals(data.mmSignals)
      }

      if (data.orderFlow) {
        setOrderFlow({
          buyVolume: data.orderFlow.buyVolume || 0,
          sellVolume: data.orderFlow.sellVolume || 0,
          neutralVolume: data.orderFlow.neutralVolume || 0
        })
      }

      // Update connection state
      setConnectionState(CONNECTION_STATES.CONNECTED)
      setLastUpdate(new Date())
      setError(null)
      setRetryCount(0)
      setIsLoading(false)

    } catch (err) {
      if (!isMountedRef.current) return

      console.error('[Level2MarketDepth] Fetch error:', err)

      // Handle different error types
      if (err.name === 'AbortError') {
        setError('Request timeout - retrying...')
      } else if (err.message.includes('Failed to fetch')) {
        setError('Network error - check connection')
      } else {
        setError(err.message)
      }

      setConnectionState(CONNECTION_STATES.ERROR)
      setIsLoading(false)

      // Implement retry with exponential backoff
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const delay = getBackoffDelay(retryCount)
        setRetryCount(prev => prev + 1)

        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchMarketDepth(true)
          }
        }, delay)
      }
    }
  }, [symbol, depth, getBackoffDelay, retryCount])

  /**
   * Process order book levels with percentage calculations
   */
  const processOrderBookLevels = useCallback((levels, maxDepth, side) => {
    if (!levels || levels.length === 0) return []

    const slicedLevels = levels.slice(0, maxDepth)
    const maxSize = Math.max(...slicedLevels.map(l => l.size), 1)
    let cumulative = 0

    return slicedLevels.map((level, idx) => {
      cumulative += level.size
      return {
        ...level,
        price: parseFloat(level.price).toFixed(2),
        size: level.size,
        orders: level.orders || 1,
        total: parseFloat(level.total) || (parseFloat(level.price) * level.size),
        exchange: level.exchange || 'UNK',
        percentage: (level.size / maxSize) * 100,
        cumulative,
        depth: idx,
        side
      }
    })
  }, [])

  /**
   * Initialize WebSocket connection for real-time updates (if available)
   */
  const initializeWebSocket = useCallback(() => {
    // WebSocket fallback - attempt to connect if endpoint exists
    // This provides sub-second updates when available
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/market/depth/ws?symbol=${symbol}`

      // Check if WebSocket endpoint exists (graceful fallback)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[Level2MarketDepth] WebSocket connected')
        setConnectionState(CONNECTION_STATES.CONNECTED)
        wsRef.current = ws
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'depth_update' && isMountedRef.current) {
            // Process real-time update
            if (data.depth) {
              setOrderBook({
                bids: processOrderBookLevels(data.depth.bids || [], depth, 'bid'),
                asks: processOrderBookLevels(data.depth.asks || [], depth, 'ask')
              })
            }
            if (data.quote) {
              setQuote(data.quote)
            }
            setLastUpdate(new Date())
          }
        } catch (err) {
          console.warn('[Level2MarketDepth] WebSocket message parse error:', err)
        }
      }

      ws.onerror = () => {
        // WebSocket not available, fall back to polling
        console.log('[Level2MarketDepth] WebSocket unavailable, using polling')
        ws.close()
      }

      ws.onclose = () => {
        wsRef.current = null
      }

    } catch (err) {
      // WebSocket connection failed, polling will handle updates
      console.log('[Level2MarketDepth] WebSocket not supported, using polling')
    }
  }, [symbol, depth, processOrderBookLevels])

  /**
   * Main effect for data fetching and refresh interval
   */
  useEffect(() => {
    isMountedRef.current = true

    // Initial fetch
    fetchMarketDepth()

    // Attempt WebSocket connection
    initializeWebSocket()

    // Set up polling interval (primary refresh mechanism)
    refreshIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && connectionState !== CONNECTION_STATES.CONNECTING) {
        fetchMarketDepth()
      }
    }, REFRESH_INTERVAL_MS)

    return () => {
      isMountedRef.current = false

      // Cleanup interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }

      // Cleanup retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      // Cleanup WebSocket
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [symbol, depth]) // Re-initialize when symbol or depth changes

  /**
   * Refetch when depth changes
   */
  useEffect(() => {
    if (!isLoading) {
      fetchMarketDepth()
    }
  }, [depth])

  /**
   * Auto-center on price changes
   */
  useEffect(() => {
    if (autoCenter && containerRef.current) {
      const center = containerRef.current.querySelector('.price-center')
      if (center) {
        center.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [quote.bid, quote.ask, autoCenter])

  /**
   * AI Order Flow Analysis
   */
  const analyzeOrderFlow = async () => {
    if (!orderBook.bids.length || aiLoading) return

    setAiLoading(true)
    try {
      const prompt = `As an AI market microstructure analyst using ML order flow models, analyze this REAL Level 2 data:

      Order Book (REAL DATA):
      - Symbol: ${symbol}
      - Best Bid: $${quote.bid} (${orderBook.bids[0]?.size || 0} shares)
      - Best Ask: $${quote.ask} (${orderBook.asks[0]?.size || 0} shares)
      - Spread: $${quote.spread} (${quote.spreadPercent}%)
      - Imbalance: ${metrics.imbalance}%
      - Bid/Ask Ratio: ${metrics.bidAskRatio}
      - Weighted Bid: $${metrics.weightedBid}
      - Weighted Ask: $${metrics.weightedAsk}
      - Total Bid Volume: ${formatNumber(metrics.totalBidSize)}
      - Total Ask Volume: ${formatNumber(metrics.totalAskSize)}

      Order Flow:
      - Buy Volume: ${formatNumber(orderFlow.buyVolume)}
      - Sell Volume: ${formatNumber(orderFlow.sellVolume)}
      - Neutral Volume: ${formatNumber(orderFlow.neutralVolume)}

      Market Maker Signals:
      ${mmSignals.map(s => `- ${s.type}: ${s.message}`).join('\n') || 'None detected'}

      Recent Trades: ${timeAndSales.length} trades on tape

      Provide JSON analysis with:
      1. manipulation: {detected: boolean, type: 'spoofing'|'layering'|'momentum_ignition'|'none', confidence: 0-1}
      2. orderFlowPrediction: 'buying_pressure'|'selling_pressure'|'neutral' with reasoning
      3. hiddenLiquidity: estimated iceberg orders and dark pool activity
      4. microstructureSignals: array of detected patterns
      5. executionRecommendation: optimal order placement strategy
      6. toxicFlow: percentage of toxic vs informed flow
      7. shortTermDirection: {direction: 'up'|'down'|'sideways', confidence: 0-1}`

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          feature: 'level2-analysis',
          temperature: 0.2,
          max_tokens: 600
        })
      })

      if (response.ok) {
        const data = await response.json()
        try {
          const analysis = JSON.parse(data.content || '{}')
          setAiAnalysis(analysis)

          // Alert on manipulation detection
          if (analysis.manipulation?.detected) {
            window.dispatchEvent(new CustomEvent('iava.toast', {
              detail: {
                text: `[ALERT] AI detected ${analysis.manipulation.type} (${(analysis.manipulation.confidence * 100).toFixed(0)}% confidence)`,
                type: 'warning'
              }
            }))
          }
        } catch (parseErr) {
          console.error('AI response parse error:', parseErr)
          setAiAnalysis({ error: 'Failed to parse AI response' })
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error)
    }
    setAiLoading(false)
  }

  /**
   * Auto-analyze when order book changes significantly
   */
  useEffect(() => {
    if (showAI && orderBook.bids.length > 0 && !isLoading) {
      const timer = setTimeout(() => {
        analyzeOrderFlow()
      }, 3000) // Debounce for 3 seconds
      return () => clearTimeout(timer)
    }
  }, [orderBook, showAI, isLoading])

  // Utility functions
  const getSizeColor = (percentage) => {
    if (percentage > 75) return 'bg-purple-500/30'
    if (percentage > 50) return 'bg-blue-500/25'
    if (percentage > 25) return 'bg-cyan-500/20'
    return 'bg-slate-700/30'
  }

  const getImbalanceColor = (value) => {
    const numValue = parseFloat(value)
    if (numValue > 20) return 'text-emerald-400'
    if (numValue < -20) return 'text-red-400'
    return 'text-yellow-400'
  }

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case CONNECTION_STATES.CONNECTED: return 'bg-emerald-400'
      case CONNECTION_STATES.CONNECTING: return 'bg-yellow-400 animate-pulse'
      case CONNECTION_STATES.ERROR: return 'bg-red-400'
      default: return 'bg-slate-400'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case CONNECTION_STATES.CONNECTED: return 'Live'
      case CONNECTION_STATES.CONNECTING: return 'Connecting...'
      case CONNECTION_STATES.ERROR: return 'Error'
      default: return 'Disconnected'
    }
  }

  // Calculate liquidity score from real metrics
  const liquidityScore = useMemo(() => {
    const totalVolume = metrics.totalBidSize + metrics.totalAskSize
    const spreadPct = parseFloat(quote.spreadPercent) || 0.1
    const score = Math.min(100, (totalVolume / 500000) * (1 - spreadPct / 100) * 100)
    return Math.max(0, score)
  }, [metrics.totalBidSize, metrics.totalAskSize, quote.spreadPercent])

  // Render loading state
  if (isLoading && orderBook.bids.length === 0) {
    return (
      <div className="glass-panel flex flex-col h-full overflow-hidden">
        <div className="panel-header">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Level 2 Depth</h3>
              <p className="text-xs text-slate-400">Loading order book data...</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Fetching Level 2 data for {symbol}...</p>
            <p className="text-slate-500 text-xs mt-2">Connecting to market feed</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Level 2 Depth</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400">
                  {symbol} - Real-time order book
                </p>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
                  <span className="text-xs text-slate-500">{getConnectionStatusText()}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showHeatmap ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'
              }`}
              title="Toggle liquidity heatmap"
            >
              Heat
            </button>
            <button
              onClick={() => setShowImbalance(!showImbalance)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showImbalance ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
              }`}
              title="Toggle imbalance indicator"
            >
              Imb
            </button>
            <button
              onClick={() => setAutoCenter(!autoCenter)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                autoCenter ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'
              }`}
              title="Auto-center on spread"
            >
              Auto
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showAI ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'
              }`}
              title="Toggle AI analysis"
            >
              AI
            </button>
            <button
              onClick={() => fetchMarketDepth()}
              className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 transition-all"
              title="Refresh data"
              disabled={connectionState === CONNECTION_STATES.CONNECTING}
            >
              {connectionState === CONNECTION_STATES.CONNECTING ? '...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/20 border-b border-red-500/30 text-red-400 text-xs">
          <span className="font-semibold">Error:</span> {error}
          {retryCount > 0 && (
            <span className="ml-2 text-red-300">
              (Retry {retryCount}/{MAX_RETRY_ATTEMPTS})
            </span>
          )}
        </div>
      )}

      {/* Market Stats */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Spread:</span>
            <div className="text-sm font-semibold text-yellow-400">
              ${quote.spread} ({quote.spreadPercent}%)
            </div>
          </div>
          <div>
            <span className="text-slate-500">Imbalance:</span>
            <div className={`text-sm font-semibold ${getImbalanceColor(metrics.imbalance)}`}>
              {parseFloat(metrics.imbalance) > 0 ? '+' : ''}{metrics.imbalance}%
            </div>
          </div>
          <div>
            <span className="text-slate-500">Liquidity:</span>
            <div className="text-sm font-semibold text-cyan-400">
              {liquidityScore.toFixed(0)}/100
            </div>
          </div>
          <div>
            <span className="text-slate-500">Levels:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="bg-slate-700 rounded px-1 text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </div>
        </div>

        {/* Last Update Timestamp */}
        {lastUpdate && (
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            <span className="text-slate-600">|</span>
            <span>Refresh: {REFRESH_INTERVAL_MS / 1000}s</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Order Book */}
        <div className="flex-1 overflow-y-auto" ref={containerRef}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="text-slate-400">
                <th className="text-left py-2 px-2">Orders</th>
                <th className="text-right py-2 px-2">Size</th>
                <th className="text-right py-2 px-2">Bid</th>
                <th className="text-center py-2 px-2">Price</th>
                <th className="text-left py-2 px-2">Ask</th>
                <th className="text-left py-2 px-2">Size</th>
                <th className="text-right py-2 px-2">Orders</th>
              </tr>
            </thead>
            <tbody>
              {/* Ask levels (reversed for display) */}
              {[...orderBook.asks].reverse().map((ask, idx) => (
                <tr key={`ask-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-1 px-2"></td>
                  <td className="py-1 px-2"></td>
                  <td className="py-1 px-2"></td>
                  <td className="text-center py-1 px-2 text-red-400 font-medium">
                    {ask.price}
                  </td>
                  <td className="text-left py-1 px-2 relative">
                    {showHeatmap && (
                      <div
                        className={`absolute inset-0 ${getSizeColor(ask.percentage)}`}
                        style={{ width: `${ask.percentage}%` }}
                      />
                    )}
                    <span className="relative text-red-300">{ask.price}</span>
                  </td>
                  <td className="text-left py-1 px-2 text-slate-300">
                    {formatNumber(ask.size)}
                  </td>
                  <td className="text-right py-1 px-2 text-slate-500">
                    {ask.orders}
                  </td>
                </tr>
              ))}

              {/* Current Price / Spread */}
              <tr className="price-center bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent">
                <td colSpan="7" className="text-center py-2">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-xs text-emerald-400 font-medium">
                      BID ${quote.bid}
                    </span>
                    <span className="text-xs text-slate-400">SPREAD</span>
                    <span className="text-lg font-bold text-white">
                      ${((parseFloat(quote.bid) + parseFloat(quote.ask)) / 2).toFixed(2)}
                    </span>
                    <span className="text-xs text-yellow-400">
                      ${quote.spread} ({quote.spreadPercent}%)
                    </span>
                    <span className="text-xs text-red-400 font-medium">
                      ASK ${quote.ask}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Bid levels */}
              {orderBook.bids.map((bid, idx) => (
                <tr key={`bid-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                  <td className="text-left py-1 px-2 text-slate-500">
                    {bid.orders}
                  </td>
                  <td className="text-right py-1 px-2 text-slate-300">
                    {formatNumber(bid.size)}
                  </td>
                  <td className="text-right py-1 px-2 relative">
                    {showHeatmap && (
                      <div
                        className={`absolute inset-y-0 right-0 ${getSizeColor(bid.percentage)}`}
                        style={{ width: `${bid.percentage}%` }}
                      />
                    )}
                    <span className="relative text-emerald-300">{bid.price}</span>
                  </td>
                  <td className="text-center py-1 px-2 text-emerald-400 font-medium">
                    {bid.price}
                  </td>
                  <td className="py-1 px-2"></td>
                  <td className="py-1 px-2"></td>
                  <td className="py-1 px-2"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Panel: Time & Sales, Signals, AI */}
        <div className="w-64 border-l border-slate-700/50 flex flex-col">
          {/* Time & Sales (Real Tape) */}
          <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-900/50">
            <h4 className="text-xs font-semibold text-slate-400">TIME & SALES (LIVE)</h4>
          </div>
          <div className="flex-1 overflow-y-auto max-h-48">
            <div className="text-xs">
              {timeAndSales.length > 0 ? (
                timeAndSales.map((trade, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-1 border-b border-slate-800/50 ${
                      trade.side === 'ASK' ? 'bg-emerald-500/10' :
                      trade.side === 'BID' ? 'bg-red-500/10' : 'bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{trade.time}</span>
                      <span className={
                        trade.side === 'ASK' ? 'text-emerald-400' :
                        trade.side === 'BID' ? 'text-red-400' : 'text-yellow-400'
                      }>
                        {trade.side}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-slate-300">{formatNumber(trade.size)}</span>
                      <span className="text-slate-400">@ ${parseFloat(trade.price).toFixed(2)}</span>
                    </div>
                    <div className="text-slate-500 text-xs">
                      {trade.exchange}
                      {trade.condition && trade.condition.length > 0 && (
                        <span className="ml-1 text-amber-400">[{trade.condition.join(',')}]</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-slate-500">
                  No recent trades
                </div>
              )}
            </div>
          </div>

          {/* Market Maker Signals */}
          {mmSignals.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-700/50 bg-gradient-to-br from-amber-900/20 to-orange-900/20">
              <div className="text-xs font-semibold text-amber-400 mb-2">MM SIGNALS</div>
              <div className="space-y-1">
                {mmSignals.map((signal, idx) => (
                  <div key={idx} className="text-xs bg-amber-500/10 rounded px-2 py-1 text-amber-200">
                    <span className="font-semibold text-amber-400">{signal.type}:</span>
                    <span className="ml-1">{signal.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Flow Summary */}
          <div className="px-3 py-3 border-t border-slate-700/50 bg-slate-900/50">
            <div className="text-xs text-slate-400 mb-2">ORDER FLOW</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400">Buy Volume:</span>
                <span className="text-xs text-slate-300">
                  {formatNumber(orderFlow.buyVolume)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-400">Sell Volume:</span>
                <span className="text-xs text-slate-300">
                  {formatNumber(orderFlow.sellVolume)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-400">Neutral:</span>
                <span className="text-xs text-slate-300">
                  {formatNumber(orderFlow.neutralVolume)}
                </span>
              </div>
            </div>
          </div>

          {/* Imbalance Indicator */}
          {showImbalance && (
            <div className="px-3 py-3 border-t border-slate-700/50 bg-slate-900/50">
              <div className="text-xs text-slate-400 mb-2">BOOK IMBALANCE</div>
              <div className="relative h-6 bg-slate-700 rounded overflow-hidden">
                <div
                  className={`absolute top-0 bottom-0 transition-all ${
                    parseFloat(metrics.imbalance) > 0 ? 'bg-emerald-500/50 left-1/2' : 'bg-red-500/50 right-1/2'
                  }`}
                  style={{
                    width: `${Math.min(50, Math.abs(parseFloat(metrics.imbalance)) / 2)}%`,
                    left: parseFloat(metrics.imbalance) > 0 ? '50%' : undefined,
                    right: parseFloat(metrics.imbalance) < 0 ? '50%' : undefined
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-semibold ${getImbalanceColor(metrics.imbalance)}`}>
                    {parseFloat(metrics.imbalance) > 0 ? 'BID' : 'ASK'} {Math.abs(parseFloat(metrics.imbalance)).toFixed(1)}%
                  </span>
                </div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
              </div>
            </div>
          )}

          {/* Volume Distribution */}
          <div className="px-3 py-3 border-t border-slate-700/50 bg-slate-900/50">
            <div className="text-xs text-slate-400 mb-2">VOLUME DISTRIBUTION</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400">Bid Vol:</span>
                <span className="text-xs text-slate-300">
                  {formatNumber(metrics.totalBidSize)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-400">Ask Vol:</span>
                <span className="text-xs text-slate-300">
                  {formatNumber(metrics.totalAskSize)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-400">Ratio:</span>
                <span className="text-xs text-slate-300">
                  {metrics.bidAskRatio}:1
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-400">Total:</span>
                <span className="text-xs text-slate-300">
                  {formatNumber(metrics.totalBidSize + metrics.totalAskSize)}
                </span>
              </div>
            </div>
          </div>

          {/* AI Analysis Panel */}
          {showAI && (
            <div className="px-3 py-3 border-t border-slate-700/50 bg-gradient-to-br from-purple-900/20 to-pink-900/20 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-purple-400">AI ANALYSIS</span>
                </div>
                {aiLoading && (
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                )}
              </div>

              {aiAnalysis && !aiAnalysis.error ? (
                <div className="space-y-2">
                  {/* Manipulation Detection */}
                  {aiAnalysis.manipulation && (
                    <div className={`p-2 rounded text-xs ${
                      aiAnalysis.manipulation.detected
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-green-500/20 border border-green-500/30'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={aiAnalysis.manipulation.detected ? 'text-red-400' : 'text-green-400'}>
                          {aiAnalysis.manipulation.detected ? 'Manipulation Detected' : 'Clean Market'}
                        </span>
                        {aiAnalysis.manipulation.detected && (
                          <span className="text-red-300 text-xs">
                            {(aiAnalysis.manipulation.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {aiAnalysis.manipulation.detected && (
                        <div className="text-red-300">
                          Type: {aiAnalysis.manipulation.type}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Flow Prediction */}
                  {aiAnalysis.orderFlowPrediction && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-400 mb-1">Flow Direction</div>
                      <div className={`text-sm font-semibold ${
                        aiAnalysis.orderFlowPrediction === 'buying_pressure' ? 'text-emerald-400' :
                        aiAnalysis.orderFlowPrediction === 'selling_pressure' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {aiAnalysis.orderFlowPrediction === 'buying_pressure' ? 'Buying Pressure' :
                         aiAnalysis.orderFlowPrediction === 'selling_pressure' ? 'Selling Pressure' :
                         'Neutral Flow'}
                      </div>
                    </div>
                  )}

                  {/* Hidden Liquidity */}
                  {aiAnalysis.hiddenLiquidity && (
                    <div className="bg-indigo-500/10 rounded p-2 text-xs">
                      <div className="text-indigo-400 mb-1">Hidden Liquidity</div>
                      <div className="text-slate-300">{aiAnalysis.hiddenLiquidity}</div>
                    </div>
                  )}

                  {/* Microstructure Signals */}
                  {aiAnalysis.microstructureSignals && aiAnalysis.microstructureSignals.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400">Patterns:</div>
                      {aiAnalysis.microstructureSignals.map((signal, idx) => (
                        <div key={idx} className="text-xs bg-purple-500/10 rounded px-2 py-1 text-purple-300">
                          {signal}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Toxic Flow */}
                  {aiAnalysis.toxicFlow !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Toxic Flow:</span>
                      <span className={`font-semibold ${
                        aiAnalysis.toxicFlow > 50 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {aiAnalysis.toxicFlow}%
                      </span>
                    </div>
                  )}

                  {/* Short Term Direction */}
                  {aiAnalysis.shortTermDirection && (
                    <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded p-2">
                      <div className="text-xs text-cyan-400 mb-1">5-Min Forecast</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          {aiAnalysis.shortTermDirection.direction || aiAnalysis.shortTermDirection || 'Analyzing...'}
                        </span>
                        {aiAnalysis.shortTermDirection.confidence && (
                          <span className="text-xs text-cyan-300">
                            {(aiAnalysis.shortTermDirection.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Execution Recommendation */}
                  {aiAnalysis.executionRecommendation && (
                    <div className="bg-amber-500/10 rounded p-2 border border-amber-500/30">
                      <div className="text-xs text-amber-400 mb-1">Execution Strategy</div>
                      <div className="text-xs text-slate-200">{aiAnalysis.executionRecommendation}</div>
                    </div>
                  )}
                </div>
              ) : aiLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-slate-800/30 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={analyzeOrderFlow}
                  className="w-full py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-all"
                >
                  Analyze Order Flow
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Aggregation:</span>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(parseFloat(e.target.value))}
              className="bg-slate-700 rounded px-2 py-1 text-xs"
            >
              <option value="0.01">$0.01</option>
              <option value="0.05">$0.05</option>
              <option value="0.10">$0.10</option>
              <option value="0.50">$0.50</option>
              <option value="1.00">$1.00</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                liquidityScore > 70 ? 'bg-emerald-400' :
                liquidityScore > 40 ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <span className="text-xs text-slate-400">
                {liquidityScore > 70 ? 'High Liquidity' :
                 liquidityScore > 40 ? 'Medium Liquidity' : 'Low Liquidity'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {symbol}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
