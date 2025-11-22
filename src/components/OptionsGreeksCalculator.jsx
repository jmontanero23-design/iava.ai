/**
 * Options Greeks Calculator Component
 * Real-time Greeks calculation with LIVE OPTIONS CHAIN DATA
 *
 * Elite++ Production Implementation:
 * - Real API integration with /api/options/chain
 * - Automatic 30-second data refresh for live updates
 * - Robust error handling with retry logic
 * - Loading states and connection status
 * - Full options chain display with real Greeks
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import {
  calculateBlackScholes,
  calculateImpliedVolatility,
  calculatePortfolioGreeks,
  calculateGreeksSensitivities,
  analyzeOptionsStrategy,
  formatGreeks
} from '../utils/optionsGreeks.js'

// Constants for configuration
const REFRESH_INTERVAL_MS = 30000 // 30 seconds for live updates
const INITIAL_FETCH_TIMEOUT_MS = 10000
const RETRY_DELAY_MS = 5000
const MAX_RETRIES = 3

// Cache for options data to prevent flickering during refreshes
const optionsCache = new Map()

export default function OptionsGreeksCalculator() {
  const { marketData } = useMarketData()

  // ==================== STATE MANAGEMENT ====================

  // Options chain data state
  const [optionsChain, setOptionsChain] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [optionType, setOptionType] = useState('call')

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting') // 'connecting' | 'connected' | 'error' | 'stale'
  const [retryCount, setRetryCount] = useState(0)

  // User input states
  const [symbol, setSymbol] = useState(null) // Will sync with marketData
  const [customSymbol, setCustomSymbol] = useState('')
  const [showSymbolInput, setShowSymbolInput] = useState(false)
  const [selectedExpiry, setSelectedExpiry] = useState(null)

  // Manual override states (when user wants custom calculations)
  const [manualMode, setManualMode] = useState(false)
  const [strikePrice, setStrikePrice] = useState(100)
  const [expiryDays, setExpiryDays] = useState(30)
  const [volatility, setVolatility] = useState(0.25)
  const [riskFreeRate, setRiskFreeRate] = useState(0.0525)
  const [dividendYield, setDividendYield] = useState(0)

  // Calculated values state
  const [greeks, setGreeks] = useState(null)
  const [sensitivities, setSensitivities] = useState(null)

  // Strategy state
  const [strategy, setStrategy] = useState('single')
  const [strategyAnalysis, setStrategyAnalysis] = useState(null)

  // UI state
  const [isRealTime, setIsRealTime] = useState(true) // Default to real-time
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showChain, setShowChain] = useState(true) // Show options chain by default
  const [aiPredictions, setAiPredictions] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(true)

  // Refs for cleanup and tracking
  const refreshIntervalRef = useRef(null)
  const abortControllerRef = useRef(null)
  const mountedRef = useRef(true)

  // Pre-defined strategies
  const strategies = {
    single: 'Single Option',
    'covered-call': 'Covered Call',
    'protective-put': 'Protective Put',
    'bull-call-spread': 'Bull Call Spread',
    'bear-put-spread': 'Bear Put Spread',
    'iron-condor': 'Iron Condor',
    straddle: 'Long Straddle',
    strangle: 'Long Strangle'
  }

  // ==================== DERIVED VALUES ====================

  // Current spot price from API or market data
  const spotPrice = useMemo(() => {
    return optionsChain?.underlying || marketData?.price || marketData?.currentPrice || 100
  }, [optionsChain?.underlying, marketData?.price, marketData?.currentPrice])

  // Effective symbol (from market context or user override)
  const effectiveSymbol = useMemo(() => {
    return symbol || marketData?.symbol || 'SPY'
  }, [symbol, marketData?.symbol])

  // Filtered options based on selected type
  const filteredOptions = useMemo(() => {
    if (!optionsChain) return []
    return optionType === 'call' ? optionsChain.calls : optionsChain.puts
  }, [optionsChain, optionType])

  // ATM option (closest to current price)
  const atmOption = useMemo(() => {
    if (!filteredOptions.length || !spotPrice) return null
    return filteredOptions.reduce((closest, opt) => {
      const currentDiff = Math.abs(opt.strike - spotPrice)
      const closestDiff = Math.abs(closest.strike - spotPrice)
      return currentDiff < closestDiff ? opt : closest
    }, filteredOptions[0])
  }, [filteredOptions, spotPrice])

  // ==================== API FETCHING ====================

  /**
   * Fetches options chain data from the API
   * Implements retry logic and proper error handling
   */
  const fetchOptionsChain = useCallback(async (symbolToFetch, options = {}) => {
    const { isInitial = false, silent = false } = options

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    if (!silent) {
      setIsLoading(true)
      setConnectionStatus('connecting')
    }

    try {
      // Build API URL with parameters
      const params = new URLSearchParams({ symbol: symbolToFetch })
      if (selectedExpiry) {
        params.append('expiry', selectedExpiry)
      }

      const response = await fetch(`/api/options/chain?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!mountedRef.current) return

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format')
      }

      if (!data.calls || !data.puts || !Array.isArray(data.calls) || !Array.isArray(data.puts)) {
        throw new Error('Missing options chain data in response')
      }

      // Update state with fetched data
      setOptionsChain(data)
      setError(null)
      setConnectionStatus('connected')
      setLastUpdate(new Date())
      setRetryCount(0)

      // Cache the data
      optionsCache.set(symbolToFetch, {
        data,
        timestamp: Date.now()
      })

      // Auto-select ATM option if none selected
      if (!selectedOption && data.calls.length > 0) {
        const calls = data.calls
        const underlying = data.underlying
        const atm = calls.reduce((closest, opt) => {
          const currentDiff = Math.abs(opt.strike - underlying)
          const closestDiff = Math.abs(closest.strike - underlying)
          return currentDiff < closestDiff ? opt : closest
        }, calls[0])
        setSelectedOption(atm)
        setStrikePrice(atm.strike)
        setVolatility(atm.impliedVolatility || 0.25)
      }

      // Update expiry options if not set
      if (!selectedExpiry && data.expirations?.length > 0) {
        setSelectedExpiry(data.expirations[0])
      }

      // Show success toast on initial fetch
      if (isInitial) {
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: {
            text: `Options chain loaded for ${symbolToFetch}`,
            type: 'success'
          }
        }))
      }

      return data

    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return null
      }

      if (!mountedRef.current) return null

      console.error('[OptionsGreeksCalculator] Fetch error:', err)

      // Try to use cached data
      const cached = optionsCache.get(symbolToFetch)
      if (cached && Date.now() - cached.timestamp < 60000) {
        setOptionsChain(cached.data)
        setConnectionStatus('stale')
        setError('Using cached data - connection error')
      } else {
        setError(err.message || 'Failed to fetch options chain')
        setConnectionStatus('error')
      }

      // Implement retry logic
      if (retryCount < MAX_RETRIES && !options.noRetry) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          if (mountedRef.current) {
            fetchOptionsChain(symbolToFetch, { silent: true })
          }
        }, RETRY_DELAY_MS)
      }

      return null

    } finally {
      if (mountedRef.current && !silent) {
        setIsLoading(false)
      }
    }
  }, [selectedExpiry, selectedOption, retryCount])

  // ==================== EFFECT HOOKS ====================

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Sync symbol with market data
  useEffect(() => {
    if (marketData?.symbol && marketData.symbol !== symbol) {
      setSymbol(marketData.symbol)
    }
  }, [marketData?.symbol])

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (!effectiveSymbol) return

    // Initial fetch
    fetchOptionsChain(effectiveSymbol, { isInitial: true })

    // Setup periodic refresh if real-time is enabled
    if (isRealTime) {
      refreshIntervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          fetchOptionsChain(effectiveSymbol, { silent: true })
        }
      }, REFRESH_INTERVAL_MS)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [effectiveSymbol, isRealTime, fetchOptionsChain])

  // Calculate Greeks when option or manual inputs change
  useEffect(() => {
    if (manualMode) {
      // Manual calculation mode
      calculateManualGreeks()
    } else if (selectedOption) {
      // Use selected option's Greeks from API
      setGreeks({
        price: selectedOption.last || ((selectedOption.bid + selectedOption.ask) / 2),
        delta: selectedOption.delta,
        gamma: selectedOption.gamma,
        theta: selectedOption.theta,
        vega: selectedOption.vega,
        rho: 0, // API doesn't provide Rho
        moneyness: spotPrice / selectedOption.strike,
        intrinsicValue: optionType === 'call'
          ? Math.max(0, spotPrice - selectedOption.strike)
          : Math.max(0, selectedOption.strike - spotPrice),
        timeValue: (selectedOption.last || 0) - (optionType === 'call'
          ? Math.max(0, spotPrice - selectedOption.strike)
          : Math.max(0, selectedOption.strike - spotPrice)),
        breakeven: optionType === 'call'
          ? selectedOption.strike + selectedOption.last
          : selectedOption.strike - selectedOption.last
      })
    }
  }, [selectedOption, manualMode, spotPrice, strikePrice, expiryDays, volatility, riskFreeRate, dividendYield, optionType])

  // Calculate sensitivities when advanced mode is on
  useEffect(() => {
    if (showAdvanced && spotPrice > 0) {
      const params = {
        spotPrice,
        strikePrice: selectedOption?.strike || strikePrice,
        timeToExpiry: expiryDays / 365,
        volatility: selectedOption?.impliedVolatility || volatility,
        riskFreeRate,
        dividendYield,
        optionType
      }
      const calculatedSensitivities = calculateGreeksSensitivities(params)
      setSensitivities(calculatedSensitivities)
    }
  }, [showAdvanced, spotPrice, selectedOption, strikePrice, expiryDays, volatility, riskFreeRate, dividendYield, optionType])

  // Strategy analysis
  useEffect(() => {
    if (strategy !== 'single' && spotPrice > 0) {
      const params = {
        spotPrice,
        strikePrice: selectedOption?.strike || strikePrice,
        timeToExpiry: expiryDays / 365,
        volatility: selectedOption?.impliedVolatility || volatility,
        riskFreeRate,
        dividendYield,
        optionType
      }
      const strategyParams = getStrategyParams(strategy, params)
      const analysis = analyzeOptionsStrategy(strategy, strategyParams)
      setStrategyAnalysis(analysis)
    } else {
      setStrategyAnalysis(null)
    }
  }, [strategy, spotPrice, selectedOption, strikePrice, expiryDays, volatility, riskFreeRate, dividendYield, optionType])

  // ==================== HELPER FUNCTIONS ====================

  const calculateManualGreeks = useCallback(() => {
    if (spotPrice <= 0) return

    const params = {
      spotPrice,
      strikePrice,
      timeToExpiry: expiryDays / 365,
      volatility,
      riskFreeRate,
      dividendYield,
      optionType
    }

    const calculatedGreeks = calculateBlackScholes(params)
    setGreeks(calculatedGreeks)
  }, [spotPrice, strikePrice, expiryDays, volatility, riskFreeRate, dividendYield, optionType])

  const getStrategyParams = (strategyType, baseParams) => {
    const params = { ...baseParams }

    switch (strategyType) {
      case 'covered-call':
        params.otmPercent = 5
        break
      case 'protective-put':
        params.otmPercent = 5
        break
      case 'bull-call-spread':
        params.lowerStrike = spotPrice * 0.95
        params.upperStrike = spotPrice * 1.05
        break
      case 'bear-put-spread':
        params.lowerStrike = spotPrice * 0.95
        params.upperStrike = spotPrice * 1.05
        break
      case 'iron-condor':
        params.putShortStrike = spotPrice * 0.95
        params.putLongStrike = spotPrice * 0.90
        params.callShortStrike = spotPrice * 1.05
        params.callLongStrike = spotPrice * 1.10
        break
      case 'straddle':
        params.strikePrice = spotPrice
        break
      case 'strangle':
        params.callStrike = spotPrice * 1.05
        params.putStrike = spotPrice * 0.95
        break
    }

    return params
  }

  const handleSymbolChange = (newSymbol) => {
    const normalizedSymbol = newSymbol.toUpperCase().trim()
    if (normalizedSymbol && normalizedSymbol !== effectiveSymbol) {
      setSymbol(normalizedSymbol)
      setSelectedOption(null)
      setSelectedExpiry(null)
      setShowSymbolInput(false)
      setCustomSymbol('')
    }
  }

  const handleOptionSelect = (option) => {
    setSelectedOption(option)
    setStrikePrice(option.strike)
    setVolatility(option.impliedVolatility || volatility)
  }

  // Quick strike presets
  const setQuickStrike = (type) => {
    if (!filteredOptions.length) return

    let targetOption
    switch (type) {
      case 'ATM':
        targetOption = atmOption
        break
      case 'ITM':
        targetOption = filteredOptions.find(opt =>
          optionType === 'call' ? opt.strike < spotPrice : opt.strike > spotPrice
        ) || atmOption
        break
      case 'OTM':
        targetOption = filteredOptions.find(opt =>
          optionType === 'call' ? opt.strike > spotPrice : opt.strike < spotPrice
        ) || atmOption
        break
    }

    if (targetOption) {
      handleOptionSelect(targetOption)
    }
  }

  // Calculate IV from market price
  const calculateIVFromPrice = () => {
    const marketPrice = parseFloat(prompt('Enter current option market price:'))
    if (!marketPrice || marketPrice <= 0) return

    const iv = calculateImpliedVolatility({
      optionPrice: marketPrice,
      spotPrice,
      strikePrice: selectedOption?.strike || strikePrice,
      timeToExpiry: expiryDays / 365,
      riskFreeRate,
      dividendYield,
      optionType
    })

    setVolatility(iv)
    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: { text: `Implied Volatility: ${(iv * 100).toFixed(2)}%`, type: 'success' }
    }))
  }

  // Manual refresh
  const handleManualRefresh = () => {
    fetchOptionsChain(effectiveSymbol, { isInitial: false })
  }

  // Get AI predictions for Greeks movement
  const getAIPredictions = async () => {
    if (!greeks || aiLoading) return

    setAiLoading(true)
    try {
      const prompt = `As a quantitative options analyst using advanced ML models, analyze these Greeks and predict their movements:

      Current Greeks:
      - Delta: ${greeks.delta?.toFixed(4) || 'N/A'}
      - Gamma: ${greeks.gamma?.toFixed(5) || 'N/A'}
      - Theta: ${greeks.theta?.toFixed(3) || 'N/A'}
      - Vega: ${greeks.vega?.toFixed(3) || 'N/A'}
      - Option Type: ${optionType}
      - Days to Expiry: ${expiryDays}
      - Moneyness: ${greeks.moneyness > 1.02 ? 'ITM' : greeks.moneyness < 0.98 ? 'OTM' : 'ATM'}
      - IV: ${((selectedOption?.impliedVolatility || volatility) * 100).toFixed(1)}%
      - Symbol: ${effectiveSymbol}
      - Strike: ${selectedOption?.strike || strikePrice}
      - Underlying: ${spotPrice.toFixed(2)}

      Provide JSON with:
      1. deltaDirection: 'increase'/'decrease'/'stable' with confidence 0-1
      2. volatilityForecast: predicted IV in 1 day with reasoning
      3. optimalAdjustment: specific parameter changes to improve position
      4. riskScore: 0-100 with breakdown
      5. mlSignals: array of technical signals detected
      6. profitProbability: chance of profit at expiry
      7. hedgeSuggestion: recommended hedge position`

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          feature: 'options-greeks',
          temperature: 0.3,
          max_tokens: 500
        })
      })

      if (response.ok) {
        const data = await response.json()
        const predictions = JSON.parse(data.content || '{}')
        setAiPredictions(predictions)

        if (predictions.optimalAdjustment) {
          window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: {
              text: `AI suggests: ${predictions.optimalAdjustment}`,
              type: 'info'
            }
          }))
        }
      }
    } catch (error) {
      console.error('AI prediction error:', error)
    }
    setAiLoading(false)
  }

  // Auto-run AI predictions when Greeks change
  useEffect(() => {
    if (greeks && showAI && !aiLoading) {
      const timer = setTimeout(() => {
        getAIPredictions()
      }, 2000) // Debounce
      return () => clearTimeout(timer)
    }
  }, [greeks?.delta, showAI])

  // Get Greek color based on value
  const getGreekColor = (value, type) => {
    if (value === undefined || value === null) return 'text-slate-400'

    if (type === 'delta') {
      return Math.abs(value) > 0.7 ? 'text-red-400' :
             Math.abs(value) < 0.3 ? 'text-green-400' : 'text-yellow-400'
    }
    if (type === 'gamma') {
      return value > 0.1 ? 'text-red-400' :
             value > 0.05 ? 'text-yellow-400' : 'text-green-400'
    }
    if (type === 'theta') {
      return value < -1 ? 'text-red-400' :
             value < -0.5 ? 'text-yellow-400' : 'text-green-400'
    }
    return 'text-slate-300'
  }

  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-emerald-500'
      case 'connecting': return 'bg-yellow-500 animate-pulse'
      case 'stale': return 'bg-amber-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-slate-500'
    }
  }

  // Format time since last update
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never'
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return lastUpdate.toLocaleTimeString()
  }

  // ==================== RENDER ====================

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">Delta</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Options Greeks</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></span>
                <span>
                  {connectionStatus === 'connected' ? 'Live Data' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   connectionStatus === 'stale' ? 'Cached' : 'Disconnected'}
                </span>
                {lastUpdate && (
                  <span className="text-slate-500">| Updated {formatLastUpdate()}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-all disabled:opacity-50"
              title="Refresh data"
            >
              {isLoading ? '...' : 'Refresh'}
            </button>
            <button
              onClick={() => setIsRealTime(!isRealTime)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                isRealTime
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {isRealTime ? 'LIVE 30s' : 'Static'}
            </button>
            <button
              onClick={() => setShowChain(!showChain)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                showChain
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              Chain
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="btn-tertiary btn-sm"
            >
              {showAdvanced ? 'Advanced' : 'Basic'}
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                showAI
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              AI {showAI ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Error Display */}
        {error && connectionStatus === 'error' && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-red-400">Error</span>
                <span className="text-sm text-red-300">{error}</span>
              </div>
              <button
                onClick={handleManualRefresh}
                className="px-3 py-1 bg-red-500/30 text-red-300 rounded text-xs hover:bg-red-500/40"
              >
                Retry {retryCount > 0 && `(${retryCount}/${MAX_RETRIES})`}
              </button>
            </div>
          </div>
        )}

        {/* Current Market / Symbol Selector */}
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-slate-400">Underlying</div>
              {showSymbolInput ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSymbolChange(customSymbol)
                      if (e.key === 'Escape') setShowSymbolInput(false)
                    }}
                    placeholder="Enter symbol..."
                    className="px-2 py-1 bg-slate-700 rounded text-sm text-white w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSymbolChange(customSymbol)}
                    className="px-2 py-1 bg-indigo-500/30 text-indigo-300 rounded text-xs"
                  >
                    Go
                  </button>
                  <button
                    onClick={() => setShowSymbolInput(false)}
                    className="px-2 py-1 bg-slate-600 text-slate-300 rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div
                  className="text-lg font-bold text-slate-200 cursor-pointer hover:text-indigo-400 transition-colors"
                  onClick={() => setShowSymbolInput(true)}
                  title="Click to change symbol"
                >
                  {effectiveSymbol} @ ${spotPrice.toFixed(2)}
                  {isLoading && <span className="ml-2 text-xs text-slate-500">...</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Quick symbol buttons */}
              {['SPY', 'AAPL', 'TSLA', 'QQQ', 'NVDA'].map(sym => (
                <button
                  key={sym}
                  onClick={() => handleSymbolChange(sym)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    effectiveSymbol === sym
                      ? 'bg-indigo-500/30 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
            <div className="text-right ml-4">
              <div className="text-xs text-slate-400">Moneyness</div>
              <div className="text-sm font-semibold">
                {greeks && (
                  <span className={
                    greeks.moneyness > 1.02 ? 'text-emerald-400' :
                    greeks.moneyness < 0.98 ? 'text-red-400' : 'text-yellow-400'
                  }>
                    {greeks.moneyness > 1.02 ? 'ITM' :
                     greeks.moneyness < 0.98 ? 'OTM' : 'ATM'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expiration Selector */}
          {optionsChain?.expirations && optionsChain.expirations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="text-xs text-slate-400 mb-2">EXPIRATION</div>
              <div className="flex flex-wrap gap-1">
                {optionsChain.expirations.slice(0, 6).map(expiry => (
                  <button
                    key={expiry}
                    onClick={() => setSelectedExpiry(expiry)}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      selectedExpiry === expiry
                        ? 'bg-purple-500/30 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                    }`}
                  >
                    {new Date(expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Options Chain Display */}
        {showChain && optionsChain && (
          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-400 font-semibold">OPTIONS CHAIN</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setManualMode(!manualMode)}
                  className={`px-2 py-1 rounded text-xs ${
                    manualMode
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-700/50 text-slate-400'
                  }`}
                >
                  {manualMode ? 'Manual Mode' : 'Chain Mode'}
                </button>
              </div>
            </div>

            {/* Option Type Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setOptionType('call')}
                className={`flex-1 py-2 rounded transition-all ${
                  optionType === 'call'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                CALLS ({optionsChain.calls.length})
              </button>
              <button
                onClick={() => setOptionType('put')}
                className={`flex-1 py-2 rounded transition-all ${
                  optionType === 'put'
                    ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                PUTS ({optionsChain.puts.length})
              </button>
            </div>

            {/* Chain Table */}
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="text-slate-400">
                    <th className="text-left py-2 px-2">Strike</th>
                    <th className="text-right py-2 px-1">Bid</th>
                    <th className="text-right py-2 px-1">Ask</th>
                    <th className="text-right py-2 px-1">Delta</th>
                    <th className="text-right py-2 px-1">Gamma</th>
                    <th className="text-right py-2 px-1">Theta</th>
                    <th className="text-right py-2 px-1">Vega</th>
                    <th className="text-right py-2 px-1">IV</th>
                    <th className="text-right py-2 px-2">Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOptions.map((option, idx) => {
                    const isSelected = selectedOption?.strike === option.strike
                    const isITM = option.inTheMoney
                    const isATM = Math.abs(option.strike - spotPrice) < (spotPrice * 0.01)

                    return (
                      <tr
                        key={`${option.strike}-${idx}`}
                        onClick={() => handleOptionSelect(option)}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-500/30 border-l-2 border-indigo-500'
                            : isATM
                            ? 'bg-yellow-500/10 hover:bg-yellow-500/20'
                            : isITM
                            ? 'bg-emerald-500/5 hover:bg-emerald-500/15'
                            : 'hover:bg-slate-700/50'
                        }`}
                      >
                        <td className={`py-2 px-2 font-semibold ${
                          isATM ? 'text-yellow-400' : isITM ? 'text-emerald-400' : 'text-slate-300'
                        }`}>
                          ${option.strike}
                          {isATM && <span className="ml-1 text-yellow-500/70">ATM</span>}
                        </td>
                        <td className="text-right py-2 px-1 text-slate-300">${option.bid?.toFixed(2)}</td>
                        <td className="text-right py-2 px-1 text-slate-300">${option.ask?.toFixed(2)}</td>
                        <td className={`text-right py-2 px-1 ${getGreekColor(option.delta, 'delta')}`}>
                          {option.delta?.toFixed(3)}
                        </td>
                        <td className={`text-right py-2 px-1 ${getGreekColor(option.gamma, 'gamma')}`}>
                          {option.gamma?.toFixed(4)}
                        </td>
                        <td className={`text-right py-2 px-1 ${getGreekColor(option.theta, 'theta')}`}>
                          {option.theta?.toFixed(3)}
                        </td>
                        <td className="text-right py-2 px-1 text-purple-400">
                          {option.vega?.toFixed(3)}
                        </td>
                        <td className="text-right py-2 px-1 text-amber-400">
                          {((option.impliedVolatility || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="text-right py-2 px-2 text-slate-500">
                          {(option.volume || 0).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Strike Buttons */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
              <span className="text-xs text-slate-400">Quick Select:</span>
              <button onClick={() => setQuickStrike('ITM')} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">ITM</button>
              <button onClick={() => setQuickStrike('ATM')} className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">ATM</button>
              <button onClick={() => setQuickStrike('OTM')} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">OTM</button>
            </div>
          </div>
        )}

        {/* Strategy Selector */}
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-2">STRATEGY</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(strategies).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setStrategy(key)}
                className={`px-3 py-2 rounded text-xs transition-all ${
                  strategy === key
                    ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                    : 'bg-slate-700/50 border border-slate-600/30 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Input Parameters (when in manual mode or no chain data) */}
        {(manualMode || !optionsChain) && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-semibold">MANUAL PARAMETERS</div>

            {/* Option Type */}
            <div className="flex gap-2">
              <button
                onClick={() => setOptionType('call')}
                className={`flex-1 py-2 rounded transition-all ${
                  optionType === 'call'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                CALL
              </button>
              <button
                onClick={() => setOptionType('put')}
                className={`flex-1 py-2 rounded transition-all ${
                  optionType === 'put'
                    ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                PUT
              </button>
            </div>

            {/* Strike Price */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Strike Price</label>
                <div className="flex gap-1">
                  <button onClick={() => setQuickStrike('ITM')} className="px-2 py-0.5 bg-slate-700 rounded text-xs">ITM</button>
                  <button onClick={() => setQuickStrike('ATM')} className="px-2 py-0.5 bg-slate-700 rounded text-xs">ATM</button>
                  <button onClick={() => setQuickStrike('OTM')} className="px-2 py-0.5 bg-slate-700 rounded text-xs">OTM</button>
                </div>
              </div>
              <input
                type="number"
                value={strikePrice}
                onChange={(e) => setStrikePrice(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 rounded text-slate-200"
                step="1"
              />
            </div>

            {/* Days to Expiry */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Days to Expiry</label>
                <div className="flex gap-1">
                  <button onClick={() => setExpiryDays(7)} className="px-2 py-0.5 bg-slate-700 rounded text-xs">1W</button>
                  <button onClick={() => setExpiryDays(30)} className="px-2 py-0.5 bg-slate-700 rounded text-xs">1M</button>
                  <button onClick={() => setExpiryDays(90)} className="px-2 py-0.5 bg-slate-700 rounded text-xs">3M</button>
                </div>
              </div>
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 rounded text-slate-200"
                step="1"
                min="1"
              />
            </div>

            {/* Implied Volatility */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Implied Volatility (%)</label>
                <button
                  onClick={calculateIVFromPrice}
                  className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs"
                >
                  Calculate IV
                </button>
              </div>
              <input
                type="range"
                value={volatility * 100}
                onChange={(e) => setVolatility(parseFloat(e.target.value) / 100)}
                className="w-full"
                min="5"
                max="150"
                step="1"
              />
              <div className="text-center text-sm text-slate-300">{(volatility * 100).toFixed(1)}%</div>
            </div>

            {/* Advanced Parameters */}
            {showAdvanced && (
              <>
                <div>
                  <label className="text-xs text-slate-400">Risk-Free Rate (%)</label>
                  <input
                    type="number"
                    value={riskFreeRate * 100}
                    onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) / 100)}
                    className="w-full px-3 py-2 bg-slate-700 rounded text-slate-200 mt-1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Dividend Yield (%)</label>
                  <input
                    type="number"
                    value={dividendYield * 100}
                    onChange={(e) => setDividendYield(parseFloat(e.target.value) / 100)}
                    className="w-full px-3 py-2 bg-slate-700 rounded text-slate-200 mt-1"
                    step="0.1"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Greeks Display */}
        {greeks && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-semibold">
              {selectedOption ? `GREEKS FOR $${selectedOption.strike} ${optionType.toUpperCase()}` : 'CALCULATED GREEKS'}
            </div>

            {/* Price & Value */}
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-4 border border-indigo-500/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400">Option Price</div>
                  <div className="text-2xl font-bold text-white">
                    ${greeks.price?.toFixed(3) || '0.000'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Breakeven</div>
                  <div className="text-xl font-semibold text-purple-400">
                    ${greeks.breakeven?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="text-xs">
                  <span className="text-slate-400">Intrinsic: </span>
                  <span className="text-emerald-400">${greeks.intrinsicValue?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400">Time Value: </span>
                  <span className="text-amber-400">${greeks.timeValue?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Main Greeks */}
            <div className="grid grid-cols-2 gap-3">
              {/* Delta */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Delta</span>
                  <span className="text-xs text-slate-500">Price sensitivity</span>
                </div>
                <div className={`text-xl font-bold ${getGreekColor(greeks.delta, 'delta')}`}>
                  {greeks.delta?.toFixed(4) || '0.0000'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ${((greeks.delta || 0) * 100).toFixed(2)} per $1 move
                </div>
              </div>

              {/* Gamma */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Gamma</span>
                  <span className="text-xs text-slate-500">Delta change</span>
                </div>
                <div className={`text-xl font-bold ${getGreekColor(greeks.gamma, 'gamma')}`}>
                  {greeks.gamma?.toFixed(5) || '0.00000'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Delta +{((greeks.gamma || 0) * 100).toFixed(3)} per $1
                </div>
              </div>

              {/* Theta */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Theta</span>
                  <span className="text-xs text-slate-500">Time decay</span>
                </div>
                <div className={`text-xl font-bold ${getGreekColor(greeks.theta, 'theta')}`}>
                  ${greeks.theta?.toFixed(3) || '0.000'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Per day decay
                </div>
              </div>

              {/* Vega */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Vega</span>
                  <span className="text-xs text-slate-500">Vol sensitivity</span>
                </div>
                <div className="text-xl font-bold text-purple-400">
                  ${greeks.vega?.toFixed(3) || '0.000'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Per 1% IV change
                </div>
              </div>
            </div>

            {/* Rho (if advanced) */}
            {showAdvanced && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Rho: </span>
                    <span className="text-sm font-semibold text-slate-300">
                      ${greeks.rho?.toFixed(3) || '0.000'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Per 1% rate change</span>
                </div>
              </div>
            )}

            {/* Sensitivities (if advanced) */}
            {showAdvanced && sensitivities && (
              <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 font-semibold mb-2">2ND ORDER GREEKS</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Speed: </span>
                    <span className="text-cyan-400">{sensitivities.speed?.toFixed(6) || '0'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Charm: </span>
                    <span className="text-amber-400">{sensitivities.charm?.toFixed(5) || '0'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Color: </span>
                    <span className="text-pink-400">{sensitivities.color?.toFixed(6) || '0'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State for initial load */}
        {isLoading && !greeks && !optionsChain && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="text-sm text-slate-400">Loading options chain for {effectiveSymbol}...</div>
          </div>
        )}

        {/* AI Predictions Panel */}
        {showAI && greeks && (
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">AI</span>
                <span className="text-sm font-bold text-purple-400">AI PREDICTIONS</span>
              </div>
              {aiLoading && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-purple-400">Analyzing...</span>
                </div>
              )}
            </div>

            {aiPredictions ? (
              <div className="space-y-3">
                {/* Delta Direction Prediction */}
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Delta Movement</span>
                    <span className="text-xs text-purple-400">
                      {((aiPredictions.deltaDirection?.confidence || 0) * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Delta will {aiPredictions.deltaDirection?.direction || aiPredictions.deltaDirection || 'remain stable'}
                    </span>
                  </div>
                </div>

                {/* Volatility Forecast */}
                {aiPredictions.volatilityForecast && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">IV Forecast (1 Day)</div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-amber-400">
                        {aiPredictions.volatilityForecast.predicted || aiPredictions.volatilityForecast}%
                      </span>
                      <span className="text-xs text-slate-500">
                        {aiPredictions.volatilityForecast.reasoning || 'Based on ML patterns'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Risk Score */}
                {aiPredictions.riskScore !== undefined && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Risk Assessment</span>
                      <span className={`text-sm font-bold ${
                        aiPredictions.riskScore > 70 ? 'text-red-400' :
                        aiPredictions.riskScore > 40 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {aiPredictions.riskScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          aiPredictions.riskScore > 70 ? 'bg-red-500' :
                          aiPredictions.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${aiPredictions.riskScore}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Profit Probability */}
                {aiPredictions.profitProbability !== undefined && (
                  <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg p-3 border border-emerald-500/30">
                    <div className="text-xs text-emerald-400 mb-1">AI Profit Probability</div>
                    <div className="text-2xl font-bold text-white">
                      {((aiPredictions.profitProbability || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                {/* ML Signals */}
                {aiPredictions.mlSignals && aiPredictions.mlSignals.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-2">ML Signals Detected</div>
                    <div className="flex flex-wrap gap-1">
                      {aiPredictions.mlSignals.map((signal, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimal Adjustment */}
                {aiPredictions.optimalAdjustment && (
                  <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-3 border border-indigo-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-indigo-400">AI Recommendation</span>
                    </div>
                    <div className="text-sm text-white">
                      {aiPredictions.optimalAdjustment}
                    </div>
                  </div>
                )}

                {/* Hedge Suggestion */}
                {aiPredictions.hedgeSuggestion && (
                  <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                    <div className="text-xs text-amber-400 mb-1">Hedge Strategy</div>
                    <div className="text-sm text-slate-200">
                      {aiPredictions.hedgeSuggestion}
                    </div>
                  </div>
                )}
              </div>
            ) : aiLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-slate-800/30 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={getAIPredictions}
                  className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-all"
                >
                  Generate AI Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {/* Strategy Analysis */}
        {strategy !== 'single' && strategyAnalysis && (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/30">
            <div className="text-xs text-purple-400 font-semibold mb-3">
              {strategies[strategy].toUpperCase()} ANALYSIS
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-slate-400">Max Profit</div>
                <div className="text-lg font-semibold text-emerald-400">
                  ${strategyAnalysis.maxProfit?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Max Loss</div>
                <div className="text-lg font-semibold text-red-400">
                  ${strategyAnalysis.maxLoss?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs">
                <span className="text-slate-400">Breakeven: </span>
                <span className="text-yellow-400">
                  {strategyAnalysis.breakevens?.map(be => `$${be.toFixed(2)}`).join(', ') || 'N/A'}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400">Win Probability: </span>
                <span className="text-cyan-400">
                  {((strategyAnalysis.profitProbability || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400">Portfolio Delta: </span>
                <span className="text-indigo-400">
                  {strategyAnalysis.portfolio?.totalDelta?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
