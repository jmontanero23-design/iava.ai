/**
 * Volume Profile Chart Component - Elite PhD Level
 * Real-time volume profile analysis with API data integration
 * TPO, VWAP, POC, Value Area, Market Profile
 *
 * Fetches real data from /api/market/volume-profile endpoint
 * Auto-refreshes every 60 seconds for live market data
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

// API fetch status constants
const FETCH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
}

// Period options for volume profile analysis
const PERIOD_OPTIONS = [
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' },
  { value: '1M', label: '1 Month' }
]

// Auto-refresh interval in milliseconds (60 seconds)
const REFRESH_INTERVAL = 60000

export default function VolumeProfile() {
  const { marketData } = useMarketData()

  // API data state
  const [apiData, setApiData] = useState(null)
  const [fetchStatus, setFetchStatus] = useState(FETCH_STATUS.IDLE)
  const [fetchError, setFetchError] = useState(null)
  const [lastFetchTime, setLastFetchTime] = useState(null)

  // UI state
  const [viewMode, setViewMode] = useState('profile') // profile, tpo, delta, analysis
  const [period, setPeriod] = useState('1D')
  const [showVWAP, setShowVWAP] = useState(true)
  const [showValueArea, setShowValueArea] = useState(true)
  const [showNodes, setShowNodes] = useState(true)
  const [showAI, setShowAI] = useState(true)

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Refs
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const refreshIntervalRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Get current symbol from market data context
  const currentSymbol = useMemo(() => {
    return marketData?.symbol || 'SPY'
  }, [marketData?.symbol])

  /**
   * Fetch volume profile data from API
   * Elite error handling with abort controller support
   */
  const fetchVolumeProfile = useCallback(async (forceRefresh = false) => {
    // Don't fetch if already loading (unless force refresh)
    if (fetchStatus === FETCH_STATUS.LOADING && !forceRefresh) {
      return
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setFetchStatus(FETCH_STATUS.LOADING)
    setFetchError(null)

    try {
      const url = `/api/market/volume-profile?symbol=${encodeURIComponent(currentSymbol)}&period=${encodeURIComponent(period)}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch volume profile`)
      }

      const data = await response.json()

      // Validate response structure
      if (!data || !data.profile || !data.keyLevels || !data.metrics) {
        throw new Error('Invalid API response structure')
      }

      setApiData(data)
      setFetchStatus(FETCH_STATUS.SUCCESS)
      setLastFetchTime(new Date())
      setFetchError(null)

    } catch (error) {
      // Ignore abort errors (they're intentional)
      if (error.name === 'AbortError') {
        return
      }

      console.error('[VolumeProfile] API fetch error:', error)
      setFetchStatus(FETCH_STATUS.ERROR)
      setFetchError(error.message || 'Failed to fetch volume profile data')
    }
  }, [currentSymbol, period, fetchStatus])

  /**
   * Initial fetch and periodic refresh setup
   */
  useEffect(() => {
    // Initial fetch
    fetchVolumeProfile(true)

    // Setup periodic refresh
    refreshIntervalRef.current = setInterval(() => {
      fetchVolumeProfile(true)
    }, REFRESH_INTERVAL)

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [currentSymbol, period]) // Re-fetch when symbol or period changes

  /**
   * Manual refresh handler
   */
  const handleManualRefresh = useCallback(() => {
    fetchVolumeProfile(true)
  }, [fetchVolumeProfile])

  /**
   * AI Volume Analysis using LLM
   */
  const analyzeVolumeWithAI = useCallback(async () => {
    if (!apiData || aiLoading) return

    setAiLoading(true)
    try {
      const prompt = `As an AI volume profile analyst using ML models, analyze this market structure:

      Volume Profile:
      - Symbol: ${apiData.symbol}
      - Period: ${apiData.period}
      - POC (Point of Control): $${apiData.keyLevels.poc}
      - Value Area High: $${apiData.keyLevels.vah}
      - Value Area Low: $${apiData.keyLevels.val}
      - VWAP: $${apiData.keyLevels.vwap}
      - Current Price: $${apiData.currentPrice}
      - Total Volume: ${apiData.metrics.totalVolume.toLocaleString()}
      - Profile Type: ${apiData.metrics.profileType}
      - Balance: ${(apiData.metrics.balance * 100).toFixed(2)}%
      - Delta: ${apiData.metrics.delta.toLocaleString()}

      Market Structure:
      - Trend: ${apiData.marketStructure.trend}
      - Position: ${apiData.marketStructure.position}
      - Strength: ${apiData.marketStructure.strength}
      - Nearest Support: $${apiData.marketStructure.nearestSupport}
      - Nearest Resistance: $${apiData.marketStructure.nearestResistance}

      Provide JSON analysis with:
      1. supportResistance: array of {price, strength: 0-100, type: 'support'|'resistance', reasoning}
      2. institutionalFlow: {detected: boolean, type: 'accumulation'|'distribution'|'neutral', confidence: 0-1}
      3. volumePattern: identified pattern name with explanation
      4. priceTarget: {short_term: price, medium_term: price, confidence: 0-1}
      5. migrationSignal: POC migration direction and strength
      6. liquidityPockets: array of price levels with trapped liquidity
      7. optimalEntry: {price, stop_loss, take_profit, risk_reward_ratio}`

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          feature: 'volume-profile',
          temperature: 0.3,
          max_tokens: 600
        })
      })

      if (response.ok) {
        const data = await response.json()
        try {
          const analysis = JSON.parse(data.content || '{}')
          setAiAnalysis(analysis)

          // Alert on institutional flow detection
          if (analysis.institutionalFlow?.detected) {
            window.dispatchEvent(new CustomEvent('iava.toast', {
              detail: {
                text: `Institutional ${analysis.institutionalFlow.type} detected (${(analysis.institutionalFlow.confidence * 100).toFixed(0)}% confidence)`,
                type: 'info'
              }
            }))
          }
        } catch (parseError) {
          console.error('[VolumeProfile] AI response parse error:', parseError)
        }
      }
    } catch (error) {
      console.error('[VolumeProfile] AI analysis error:', error)
    }
    setAiLoading(false)
  }, [apiData, aiLoading])

  // Auto-analyze when API data changes
  useEffect(() => {
    if (showAI && apiData && fetchStatus === FETCH_STATUS.SUCCESS) {
      const timer = setTimeout(() => {
        analyzeVolumeWithAI()
      }, 1500) // Debounce
      return () => clearTimeout(timer)
    }
  }, [apiData, showAI, fetchStatus])

  /**
   * Parse profile data for rendering
   * Transforms API response to rendering-friendly format
   */
  const profileRenderData = useMemo(() => {
    if (!apiData?.profile || apiData.profile.length === 0) return null

    const profile = apiData.profile
    const maxVolume = Math.max(...profile.map(p => p.volume))
    const prices = profile.map(p => parseFloat(p.price))
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }

    // Find HVN (High Volume Nodes) and LVN (Low Volume Nodes)
    const avgVolume = profile.reduce((sum, p) => sum + p.volume, 0) / profile.length
    const hvn = profile.filter(p => p.volume > avgVolume * 1.5)
    const lvn = profile.filter(p => p.volume < avgVolume * 0.5)

    return {
      profile,
      maxVolume,
      priceRange,
      hvn,
      lvn,
      poc: parseFloat(apiData.keyLevels.poc),
      vah: parseFloat(apiData.keyLevels.vah),
      val: parseFloat(apiData.keyLevels.val),
      vwap: parseFloat(apiData.keyLevels.vwap)
    }
  }, [apiData])

  /**
   * Draw volume profile on canvas
   * Elite-level visualization with real API data
   */
  useEffect(() => {
    if (!canvasRef.current || !profileRenderData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    // Set canvas size with device pixel ratio for crisp rendering
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    const { profile, maxVolume, priceRange, hvn, lvn, poc, vah, val } = profileRenderData
    const bins = profile.length

    // Draw value area background
    if (showValueArea) {
      const vaHighY = ((priceRange.max - vah) / (priceRange.max - priceRange.min)) * rect.height
      const vaLowY = ((priceRange.max - val) / (priceRange.max - priceRange.min)) * rect.height

      ctx.fillStyle = 'rgba(139, 92, 246, 0.1)' // Purple with low opacity
      ctx.fillRect(0, vaHighY, rect.width, vaLowY - vaHighY)
    }

    // Draw POC line
    const pocY = ((priceRange.max - poc) / (priceRange.max - priceRange.min)) * rect.height
    ctx.strokeStyle = '#fbbf24' // Amber
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, pocY)
    ctx.lineTo(rect.width, pocY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw VWAP line
    if (showVWAP && profileRenderData.vwap) {
      const vwapY = ((priceRange.max - profileRenderData.vwap) / (priceRange.max - priceRange.min)) * rect.height
      ctx.strokeStyle = '#06b6d4' // Cyan
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(0, vwapY)
      ctx.lineTo(rect.width, vwapY)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw VAH and VAL lines
    if (showValueArea) {
      const vahY = ((priceRange.max - vah) / (priceRange.max - priceRange.min)) * rect.height
      const valY = ((priceRange.max - val) / (priceRange.max - priceRange.min)) * rect.height

      ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])

      ctx.beginPath()
      ctx.moveTo(0, vahY)
      ctx.lineTo(rect.width, vahY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, valY)
      ctx.lineTo(rect.width, valY)
      ctx.stroke()

      ctx.setLineDash([])
    }

    // Draw volume bars
    profile.forEach((bin, index) => {
      const price = parseFloat(bin.price)
      const y = ((priceRange.max - price) / (priceRange.max - priceRange.min)) * rect.height
      const width = (bin.volume / maxVolume) * rect.width * 0.75
      const height = Math.max(rect.height / bins, 4)

      // Determine color based on delta (buy vs sell pressure)
      const deltaPercent = bin.volume > 0 ? ((bin.delta / bin.volume) * 100) : 0

      if (deltaPercent > 10) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.7)' // Green for buying
      } else if (deltaPercent < -10) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)' // Red for selling
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)' // Gray for neutral
      }

      // Highlight POC level
      if (bin.isPOC) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)' // Amber for POC
      }

      ctx.fillRect(0, y - height/2, width, height)

      // Draw volume text for significant levels
      const volumePercent = parseFloat(bin.percent)
      if (volumePercent > 5) {
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '10px monospace'
        ctx.fillText(
          formatVolume(bin.volume),
          width + 5,
          y + 3
        )
      }
    })

    // Draw HVN and LVN markers
    if (showNodes) {
      // High Volume Nodes
      hvn.forEach(node => {
        const price = parseFloat(node.price)
        const y = ((priceRange.max - price) / (priceRange.max - priceRange.min)) * rect.height
        ctx.fillStyle = '#8b5cf6'
        ctx.beginPath()
        ctx.arc(rect.width - 20, y, 5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Low Volume Nodes
      lvn.forEach(node => {
        const price = parseFloat(node.price)
        const y = ((priceRange.max - price) / (priceRange.max - priceRange.min)) * rect.height
        ctx.fillStyle = '#06b6d4'
        ctx.beginPath()
        ctx.arc(rect.width - 20, y, 5, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw current price marker
    if (apiData?.currentPrice) {
      const currentPrice = parseFloat(apiData.currentPrice)
      const currentY = ((priceRange.max - currentPrice) / (priceRange.max - priceRange.min)) * rect.height

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(rect.width - 10, currentY - 6)
      ctx.lineTo(rect.width, currentY)
      ctx.lineTo(rect.width - 10, currentY + 6)
      ctx.closePath()
      ctx.fill()
    }
  }, [profileRenderData, showValueArea, showNodes, showVWAP, apiData])

  /**
   * Format volume with K/M suffix
   */
  const formatVolume = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return Math.round(num).toString()
  }

  /**
   * Get profile type description
   */
  const getProfileTypeDescription = (type) => {
    switch (type) {
      case 'p-shape':
        return 'P-Shape: Volume concentrated at highs, potential distribution or rejection'
      case 'b-shape':
        return 'B-Shape: Volume concentrated at lows, potential accumulation or support'
      case 'D-shape':
        return 'D-Shape: Double distribution, balanced market with two value areas'
      case 'balanced':
        return 'Balanced: Even distribution, market in equilibrium'
      default:
        return 'Unknown profile shape'
    }
  }

  /**
   * Get trend color class
   */
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'BULLISH':
        return 'text-emerald-400'
      case 'BEARISH':
        return 'text-red-400'
      default:
        return 'text-slate-400'
    }
  }

  /**
   * Get strength color class
   */
  const getStrengthColor = (strength) => {
    if (strength?.includes('BULLISH')) return 'text-emerald-400'
    if (strength?.includes('BEARISH')) return 'text-red-400'
    return 'text-slate-400'
  }

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Loading volume profile...</p>
        <p className="text-slate-500 text-xs mt-1">{currentSymbol} | {period}</p>
      </div>
    </div>
  )

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-red-400 font-medium mb-2">Failed to Load Data</p>
        <p className="text-slate-500 text-sm mb-4">{fetchError}</p>
        <button
          onClick={handleManualRefresh}
          className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-all text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  )

  /**
   * Render no data state
   */
  const renderNoDataState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-slate-400">No volume profile data available</p>
        <p className="text-slate-500 text-xs mt-1">Market may be closed</p>
      </div>
    </div>
  )

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Volume Profile</h3>
              <p className="text-xs text-slate-400">
                {currentSymbol} | Real-time TPO & Market Profile
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-700 rounded px-2 py-1 text-xs text-slate-300 border border-slate-600"
            >
              {PERIOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Toggle Buttons */}
            <button
              onClick={() => setShowVWAP(!showVWAP)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showVWAP ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              VWAP
            </button>
            <button
              onClick={() => setShowValueArea(!showValueArea)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showValueArea ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              VA
            </button>
            <button
              onClick={() => setShowNodes(!showNodes)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showNodes ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              Nodes
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showAI ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              AI
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={fetchStatus === FETCH_STATUS.LOADING}
              className={`px-2 py-1 rounded text-xs transition-all ${
                fetchStatus === FETCH_STATUS.LOADING
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              title={lastFetchTime ? `Last updated: ${lastFetchTime.toLocaleTimeString()}` : 'Refresh'}
            >
              {fetchStatus === FETCH_STATUS.LOADING ? (
                <span className="inline-block w-3 h-3 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin"></span>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-2">
          {['profile', 'tpo', 'delta', 'analysis'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                viewMode === mode
                  ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {/* Status Indicator */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                fetchStatus === FETCH_STATUS.LOADING ? 'bg-amber-400 animate-pulse' :
                fetchStatus === FETCH_STATUS.SUCCESS ? 'bg-emerald-400' :
                fetchStatus === FETCH_STATUS.ERROR ? 'bg-red-400' :
                'bg-slate-500'
              }`}></div>
              <span className="text-xs text-slate-500">
                {lastFetchTime ? `Updated ${lastFetchTime.toLocaleTimeString()}` : 'Waiting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics from API */}
      {apiData && fetchStatus === FETCH_STATUS.SUCCESS && (
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div>
              <span className="text-slate-500">POC:</span>
              <div className="text-sm font-semibold text-yellow-400">
                ${apiData.keyLevels.poc}
              </div>
              <div className="text-xs text-slate-400">
                {formatVolume(apiData.metrics.totalVolume * 0.15)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Value Area:</span>
              <div className="text-sm font-semibold text-purple-400">
                ${apiData.keyLevels.val}-${apiData.keyLevels.vah}
              </div>
              <div className="text-xs text-slate-400">
                {apiData.metrics.valueAreaPercent}% vol
              </div>
            </div>
            <div>
              <span className="text-slate-500">VWAP:</span>
              <div className="text-sm font-semibold text-cyan-400">
                ${apiData.keyLevels.vwap}
              </div>
              <div className="text-xs text-slate-400">
                {formatVolume(apiData.metrics.totalVolume)} total
              </div>
            </div>
            <div>
              <span className="text-slate-500">Shape:</span>
              <div className="text-sm font-semibold text-indigo-400">
                {apiData.metrics.profileType?.toUpperCase() || 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                {apiData.metrics.totalTrades} bars
              </div>
            </div>
            <div>
              <span className="text-slate-500">Trend:</span>
              <div className={`text-sm font-semibold ${getTrendColor(apiData.marketStructure?.trend)}`}>
                {apiData.marketStructure?.trend || 'N/A'}
              </div>
              <div className={`text-xs ${getStrengthColor(apiData.marketStructure?.strength)}`}>
                {apiData.marketStructure?.strength || ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Handle different states */}
        {fetchStatus === FETCH_STATUS.LOADING && !apiData ? (
          renderLoadingState()
        ) : fetchStatus === FETCH_STATUS.ERROR ? (
          renderErrorState()
        ) : !apiData || !profileRenderData ? (
          renderNoDataState()
        ) : (
          <>
            {/* Chart Area */}
            <div className="flex-1 relative" ref={containerRef}>
              {viewMode === 'profile' && (
                <>
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                  />
                  {/* Price Scale */}
                  <div className="absolute right-0 top-0 bottom-0 w-16 bg-slate-900/50 border-l border-slate-700/50">
                    {profileRenderData && Array.from({ length: 10 }).map((_, i) => {
                      const price = profileRenderData.priceRange.max -
                        (i * (profileRenderData.priceRange.max - profileRenderData.priceRange.min) / 9)
                      return (
                        <div
                          key={i}
                          className="absolute right-0 px-1 text-xs text-slate-400"
                          style={{ top: `${i * 11}%` }}
                        >
                          ${price.toFixed(2)}
                        </div>
                      )
                    })}
                  </div>

                  {/* Loading overlay for refreshes */}
                  {fetchStatus === FETCH_STATUS.LOADING && apiData && (
                    <div className="absolute top-2 left-2 bg-slate-800/80 rounded px-2 py-1 flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-400">Refreshing...</span>
                    </div>
                  )}
                </>
              )}

              {viewMode === 'tpo' && apiData?.profile && (
                <div className="p-4 overflow-y-auto h-full">
                  <div className="space-y-1 font-mono text-xs">
                    {apiData.profile.slice(0, 50).map((level, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-slate-500 w-16 text-right">
                          ${level.price}
                        </span>
                        <span className={`${
                          level.isPOC ? 'text-yellow-400' : 'text-slate-300'
                        }`}>
                          {Array(Math.min(level.tpo || 0, 30)).fill('X').join('')}
                        </span>
                        {level.isPOC && (
                          <span className="text-xs text-yellow-400 ml-2">POC</span>
                        )}
                        {level.isVAH && (
                          <span className="text-xs text-purple-400 ml-2">VAH</span>
                        )}
                        {level.isVAL && (
                          <span className="text-xs text-purple-400 ml-2">VAL</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'delta' && apiData?.profile && (
                <div className="p-4 h-full">
                  <div className="h-full flex flex-col">
                    {/* Delta Chart */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 flex items-end justify-around px-2">
                        {apiData.profile.map((level, idx) => {
                          const maxDelta = Math.max(...apiData.profile.map(p => Math.abs(p.delta)))
                          const normalizedHeight = maxDelta > 0 ? (Math.abs(level.delta) / maxDelta) * 100 : 0
                          const isPositive = level.delta >= 0

                          return (
                            <div
                              key={idx}
                              className="flex-1 flex flex-col items-center justify-end mx-px"
                              style={{ height: '100%' }}
                            >
                              <div
                                className={`w-full ${isPositive ? 'bg-emerald-500/60' : 'bg-red-500/60'}`}
                                style={{
                                  height: `${normalizedHeight}%`,
                                  minHeight: level.delta !== 0 ? '2px' : '0'
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Delta Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs border-t border-slate-700/50 pt-4">
                      <div>
                        <span className="text-slate-500">Total Delta:</span>
                        <div className={`text-sm font-semibold ${
                          apiData.metrics.delta > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {formatVolume(Math.abs(apiData.metrics.delta))}
                          {apiData.metrics.delta >= 0 ? ' BUY' : ' SELL'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Balance:</span>
                        <div className={`text-sm font-semibold ${
                          apiData.metrics.balance > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {(apiData.metrics.balance * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Efficiency:</span>
                        <div className="text-sm font-semibold text-indigo-400">
                          {apiData.metrics.efficiency}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'analysis' && apiData && (
                <div className="p-4 overflow-y-auto h-full space-y-4">
                  {/* Market Structure Summary */}
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">MARKET STRUCTURE</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Trend:</span>
                        <span className={`ml-2 font-semibold ${getTrendColor(apiData.marketStructure?.trend)}`}>
                          {apiData.marketStructure?.trend}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Strength:</span>
                        <span className={`ml-2 font-semibold ${getStrengthColor(apiData.marketStructure?.strength)}`}>
                          {apiData.marketStructure?.strength}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Position:</span>
                        <span className="ml-2 font-semibold text-purple-400">
                          {apiData.marketStructure?.position}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Efficiency:</span>
                        <span className="ml-2 font-semibold text-amber-400">
                          {apiData.metrics.efficiency}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Support & Resistance from API */}
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">KEY LEVELS</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-400">Resistance</span>
                        <span className="text-slate-300">${apiData.marketStructure?.nearestResistance}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-yellow-400">POC</span>
                        <span className="text-slate-300">${apiData.keyLevels.poc}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-400">Support</span>
                        <span className="text-slate-300">${apiData.marketStructure?.nearestSupport}</span>
                      </div>
                    </div>
                  </div>

                  {/* Volume Nodes */}
                  {profileRenderData && (
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2">VOLUME NODES</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-purple-400 mb-1">High Volume Nodes (Support/Resistance)</div>
                          {profileRenderData.hvn.slice(0, 3).map((node, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-slate-300">${node.price}</span>
                              <span className="text-slate-500">{formatVolume(node.volume)}</span>
                              <span className="text-purple-400">{node.percent}%</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-xs text-cyan-400 mb-1">Low Volume Nodes (Breakout Zones)</div>
                          {profileRenderData.lvn.slice(0, 3).map((node, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-slate-300">${node.price}</span>
                              <span className="text-slate-500">{formatVolume(node.volume)}</span>
                              <span className="text-cyan-400">{node.percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Shape Analysis */}
                  <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-3 border border-indigo-500/30">
                    <h4 className="text-xs font-semibold text-indigo-400 mb-2">PROFILE SHAPE ANALYSIS</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-semibold text-white">
                          {apiData.metrics.profileType?.toUpperCase() || 'UNKNOWN'} PROFILE
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        {getProfileTypeDescription(apiData.metrics.profileType)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div>
                          <span className="text-slate-500">Total Volume:</span>
                          <span className="ml-1 text-slate-300">{formatVolume(apiData.metrics.totalVolume)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">VA Volume:</span>
                          <span className="ml-1 text-slate-300">{formatVolume(apiData.metrics.valueAreaVolume)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Heatmap Visualization */}
                  {apiData.heatmap && (
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2">VOLUME HEATMAP</h4>
                      <div className="flex h-8 rounded overflow-hidden">
                        {apiData.heatmap.map((level, idx) => (
                          <div
                            key={idx}
                            className="flex-1"
                            style={{ backgroundColor: level.color }}
                            title={`$${level.price}: ${level.intensity}%`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-slate-500">
                        <span>${apiData.heatmap[0]?.price}</span>
                        <span>Volume Intensity</span>
                        <span>${apiData.heatmap[apiData.heatmap.length - 1]?.price}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar - Key Levels & AI Analysis */}
            {showVWAP && viewMode === 'profile' && (
              <div className="w-48 border-l border-slate-700/50 p-3 overflow-y-auto">
                <h4 className="text-xs font-semibold text-slate-400 mb-3">KEY LEVELS</h4>
                <div className="space-y-2 text-xs">
                  {/* Value Area */}
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400">VAH</span>
                    <span className="text-slate-300">${apiData.keyLevels.vah}</span>
                  </div>
                  <div className="flex items-center justify-between border-y border-yellow-500/50 py-1">
                    <span className="text-yellow-400 font-semibold">POC</span>
                    <span className="text-yellow-400 font-semibold">${apiData.keyLevels.poc}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400">VAL</span>
                    <span className="text-slate-300">${apiData.keyLevels.val}</span>
                  </div>
                  <div className="flex items-center justify-between border-y border-cyan-500/50 py-1 mt-2">
                    <span className="text-cyan-400 font-semibold">VWAP</span>
                    <span className="text-cyan-400 font-semibold">${apiData.keyLevels.vwap}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-400">Developing</span>
                    <span className="text-slate-300">${apiData.keyLevels.developing}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-2">CURRENT PRICE</div>
                  <div className="text-lg font-bold text-white">
                    ${apiData.currentPrice}
                  </div>
                  <div className={`text-xs ${
                    parseFloat(apiData.currentPrice) > parseFloat(apiData.keyLevels.poc)
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}>
                    {parseFloat(apiData.currentPrice) > parseFloat(apiData.keyLevels.poc)
                      ? 'Above POC'
                      : 'Below POC'}
                  </div>
                </div>

                {/* AI Analysis */}
                {showAI && (
                  <div className="mt-4 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-purple-400">AI ANALYSIS</span>
                      </div>
                      {aiLoading && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      )}
                    </div>

                    {aiAnalysis ? (
                      <div className="space-y-2">
                        {/* Support & Resistance */}
                        {aiAnalysis.supportResistance && aiAnalysis.supportResistance.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs text-slate-400">AI Levels</div>
                            {aiAnalysis.supportResistance.slice(0, 3).map((level, idx) => (
                              <div key={idx} className="text-xs bg-slate-800/50 rounded p-1">
                                <div className="flex items-center justify-between">
                                  <span className={level.type === 'support' ? 'text-emerald-400' : 'text-red-400'}>
                                    {level.type === 'support' ? 'S' : 'R'} ${level.price?.toFixed(2)}
                                  </span>
                                  <span className="text-slate-400">{level.strength}%</span>
                                </div>
                                {level.reasoning && (
                                  <div className="text-xs text-slate-500 mt-0.5">{level.reasoning}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Institutional Flow */}
                        {aiAnalysis.institutionalFlow && (
                          <div className={`p-2 rounded text-xs ${
                            aiAnalysis.institutionalFlow.type === 'accumulation'
                              ? 'bg-emerald-500/20 border border-emerald-500/30'
                              : aiAnalysis.institutionalFlow.type === 'distribution'
                              ? 'bg-red-500/20 border border-red-500/30'
                              : 'bg-slate-700/50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className={
                                aiAnalysis.institutionalFlow.type === 'accumulation' ? 'text-emerald-400' :
                                aiAnalysis.institutionalFlow.type === 'distribution' ? 'text-red-400' :
                                'text-slate-400'
                              }>
                                {aiAnalysis.institutionalFlow.type?.toUpperCase()}
                              </span>
                              <span className="text-xs">
                                {(aiAnalysis.institutionalFlow.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Volume Pattern */}
                        {aiAnalysis.volumePattern && (
                          <div className="bg-indigo-500/10 rounded p-2 text-xs">
                            <div className="text-indigo-400 mb-1">Pattern</div>
                            <div className="text-slate-300">{aiAnalysis.volumePattern}</div>
                          </div>
                        )}

                        {/* Price Targets */}
                        {aiAnalysis.priceTarget && (
                          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded p-2">
                            <div className="text-xs text-cyan-400 mb-1">AI Targets</div>
                            <div className="space-y-1">
                              {aiAnalysis.priceTarget.short_term && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">Short:</span>
                                  <span className="text-white font-semibold">
                                    ${aiAnalysis.priceTarget.short_term.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {aiAnalysis.priceTarget.medium_term && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">Medium:</span>
                                  <span className="text-white font-semibold">
                                    ${aiAnalysis.priceTarget.medium_term.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Liquidity Pockets */}
                        {aiAnalysis.liquidityPockets && aiAnalysis.liquidityPockets.length > 0 && (
                          <div className="bg-amber-500/10 rounded p-2">
                            <div className="text-xs text-amber-400 mb-1">Liquidity</div>
                            <div className="space-y-0.5">
                              {aiAnalysis.liquidityPockets.slice(0, 2).map((pocket, idx) => (
                                <div key={idx} className="text-xs text-slate-300">
                                  ${pocket.toFixed(2)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Optimal Entry */}
                        {aiAnalysis.optimalEntry && (
                          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded p-2 border border-purple-500/30">
                            <div className="text-xs text-purple-400 mb-1">Entry Setup</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Entry:</span>
                                <span className="text-emerald-400">${aiAnalysis.optimalEntry.price?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Stop:</span>
                                <span className="text-red-400">${aiAnalysis.optimalEntry.stop_loss?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Target:</span>
                                <span className="text-cyan-400">${aiAnalysis.optimalEntry.take_profit?.toFixed(2)}</span>
                              </div>
                              {aiAnalysis.optimalEntry.risk_reward_ratio && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">R:R:</span>
                                  <span className="text-purple-400">1:{aiAnalysis.optimalEntry.risk_reward_ratio.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
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
                        onClick={analyzeVolumeWithAI}
                        className="w-full py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-all"
                      >
                        Analyze Volume
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
