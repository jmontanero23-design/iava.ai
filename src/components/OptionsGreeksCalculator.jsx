/**
 * Options Greeks Calculator Component
 * Real-time Greeks calculation with advanced analytics
 */

import { useState, useEffect, useCallback } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import {
  calculateBlackScholes,
  calculateImpliedVolatility,
  calculatePortfolioGreeks,
  calculateGreeksSensitivities,
  analyzeOptionsStrategy,
  formatGreeks
} from '../utils/optionsGreeks.js'

export default function OptionsGreeksCalculator() {
  const { marketData } = useMarketData()
  const [optionType, setOptionType] = useState('call')
  const [strikePrice, setStrikePrice] = useState(100)
  const [expiryDays, setExpiryDays] = useState(30)
  const [volatility, setVolatility] = useState(0.25) // 25% IV
  const [riskFreeRate, setRiskFreeRate] = useState(0.05) // 5% rate
  const [dividendYield, setDividendYield] = useState(0)
  const [greeks, setGreeks] = useState(null)
  const [sensitivities, setSensitivities] = useState(null)
  const [strategy, setStrategy] = useState('single')
  const [strategyAnalysis, setStrategyAnalysis] = useState(null)
  const [isRealTime, setIsRealTime] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [aiPredictions, setAiPredictions] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(true)

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

  // Calculate current spot price
  const spotPrice = marketData?.price || 100

  // Calculate Greeks whenever inputs change
  useEffect(() => {
    if (spotPrice > 0) {
      calculateCurrentGreeks()
    }
  }, [spotPrice, strikePrice, expiryDays, volatility, riskFreeRate, dividendYield, optionType, strategy])

  // Real-time updates
  useEffect(() => {
    if (!isRealTime) return

    const interval = setInterval(() => {
      calculateCurrentGreeks()
    }, 1000)

    return () => clearInterval(interval)
  }, [isRealTime, spotPrice])

  const calculateCurrentGreeks = useCallback(() => {
    const params = {
      spotPrice,
      strikePrice,
      timeToExpiry: expiryDays / 365,
      volatility,
      riskFreeRate,
      dividendYield,
      optionType
    }

    // Calculate basic Greeks
    const calculatedGreeks = calculateBlackScholes(params)
    setGreeks(calculatedGreeks)

    // Calculate sensitivities
    const calculatedSensitivities = calculateGreeksSensitivities(params)
    setSensitivities(calculatedSensitivities)

    // Analyze strategy if not single option
    if (strategy !== 'single') {
      const strategyParams = getStrategyParams(strategy, params)
      const analysis = analyzeOptionsStrategy(strategy, strategyParams)
      setStrategyAnalysis(analysis)
    }
  }, [spotPrice, strikePrice, expiryDays, volatility, riskFreeRate, dividendYield, optionType, strategy])

  // Get AI predictions for Greeks movement
  const getAIPredictions = async () => {
    if (!greeks || aiLoading) return

    setAiLoading(true)
    try {
      const prompt = `As a quantitative options analyst using advanced ML models, analyze these Greeks and predict their movements:

      Current Greeks:
      - Delta: ${greeks.delta.toFixed(4)}
      - Gamma: ${greeks.gamma.toFixed(5)}
      - Theta: ${greeks.theta.toFixed(3)}
      - Vega: ${greeks.vega.toFixed(3)}
      - Option Type: ${optionType}
      - Days to Expiry: ${expiryDays}
      - Moneyness: ${greeks.moneyness > 1.02 ? 'ITM' : greeks.moneyness < 0.98 ? 'OTM' : 'ATM'}
      - IV: ${(volatility * 100).toFixed(1)}%

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
          feature: 'options-greeks', // Uses GPT-5-mini for medium complexity
          temperature: 0.3,
          max_tokens: 500
        })
      })

      if (response.ok) {
        const data = await response.json()
        const predictions = JSON.parse(data.content || '{}')
        setAiPredictions(predictions)

        // Show AI insight toast
        if (predictions.optimalAdjustment) {
          window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: {
              text: `🤖 AI suggests: ${predictions.optimalAdjustment}`,
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
    if (greeks && showAI) {
      const timer = setTimeout(() => {
        getAIPredictions()
      }, 1000) // Debounce
      return () => clearTimeout(timer)
    }
  }, [greeks, showAI])

  const getStrategyParams = (strategyType, baseParams) => {
    const params = { ...baseParams }

    switch (strategyType) {
      case 'covered-call':
        params.otmPercent = 5 // 5% OTM
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
        params.strikePrice = spotPrice // ATM
        break
      case 'strangle':
        params.callStrike = spotPrice * 1.05
        params.putStrike = spotPrice * 0.95
        break
    }

    return params
  }

  // Quick strike presets
  const setQuickStrike = (type) => {
    switch (type) {
      case 'ATM':
        setStrikePrice(Math.round(spotPrice))
        break
      case 'ITM':
        setStrikePrice(Math.round(spotPrice * (optionType === 'call' ? 0.95 : 1.05)))
        break
      case 'OTM':
        setStrikePrice(Math.round(spotPrice * (optionType === 'call' ? 1.05 : 0.95)))
        break
    }
  }

  // Calculate IV from market price
  const calculateIVFromPrice = () => {
    const marketPrice = parseFloat(prompt('Enter current option market price:'))
    if (!marketPrice || marketPrice <= 0) return

    const iv = calculateImpliedVolatility({
      optionPrice: marketPrice,
      spotPrice,
      strikePrice,
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

  // Get Greek color based on value
  const getGreekColor = (value, type) => {
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

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">Δ</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Options Greeks</h3>
              <p className="text-xs text-slate-400">
                Real-time Black-Scholes calculations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRealTime(!isRealTime)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                isRealTime
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {isRealTime ? '⚡ LIVE' : '⏸️ Static'}
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="btn-tertiary btn-sm"
            >
              {showAdvanced ? '📊 Advanced' : '📈 Basic'}
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                showAI
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              🤖 AI {showAI ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Current Market */}
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Underlying</div>
              <div className="text-lg font-bold text-slate-200">
                {marketData?.symbol || 'SPY'} @ ${spotPrice.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
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
        </div>

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

        {/* Option Parameters */}
        <div className="space-y-3">
          <div className="text-xs text-slate-400 font-semibold">OPTION PARAMETERS</div>

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
              📈 CALL
            </button>
            <button
              onClick={() => setOptionType('put')}
              className={`flex-1 py-2 rounded transition-all ${
                optionType === 'put'
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              📉 PUT
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

        {/* Greeks Display */}
        {greeks && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-semibold">CALCULATED GREEKS</div>

            {/* Price & Value */}
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-4 border border-indigo-500/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400">Option Price</div>
                  <div className="text-2xl font-bold text-white">${greeks.price.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Breakeven</div>
                  <div className="text-xl font-semibold text-purple-400">${greeks.breakeven.toFixed(2)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="text-xs">
                  <span className="text-slate-400">Intrinsic: </span>
                  <span className="text-emerald-400">${greeks.intrinsicValue.toFixed(2)}</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400">Time Value: </span>
                  <span className="text-amber-400">${greeks.timeValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Main Greeks */}
            <div className="grid grid-cols-2 gap-3">
              {/* Delta */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Δ Delta</span>
                  <span className="text-xs text-slate-500">Price sensitivity</span>
                </div>
                <div className={`text-xl font-bold ${getGreekColor(greeks.delta, 'delta')}`}>
                  {greeks.delta.toFixed(4)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ${(greeks.delta * 100).toFixed(2)} per $1 move
                </div>
              </div>

              {/* Gamma */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Γ Gamma</span>
                  <span className="text-xs text-slate-500">Delta change</span>
                </div>
                <div className={`text-xl font-bold ${getGreekColor(greeks.gamma, 'gamma')}`}>
                  {greeks.gamma.toFixed(5)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Δ {(greeks.gamma * 100).toFixed(3)} per $1
                </div>
              </div>

              {/* Theta */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Θ Theta</span>
                  <span className="text-xs text-slate-500">Time decay</span>
                </div>
                <div className={`text-xl font-bold ${getGreekColor(greeks.theta, 'theta')}`}>
                  ${greeks.theta.toFixed(3)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Per day decay
                </div>
              </div>

              {/* Vega */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">ν Vega</span>
                  <span className="text-xs text-slate-500">Vol sensitivity</span>
                </div>
                <div className="text-xl font-bold text-purple-400">
                  ${greeks.vega.toFixed(3)}
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
                    <span className="text-xs text-slate-400">ρ Rho: </span>
                    <span className="text-sm font-semibold text-slate-300">
                      ${greeks.rho.toFixed(3)}
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
                    <span className="text-cyan-400">{sensitivities.speed.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Charm: </span>
                    <span className="text-amber-400">{sensitivities.charm.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Color: </span>
                    <span className="text-pink-400">{sensitivities.color.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Predictions Panel */}
        {showAI && greeks && (
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
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
                      {(aiPredictions.deltaDirection?.confidence * 100 || 0).toFixed(0)}% confidence
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${
                      aiPredictions.deltaDirection?.direction === 'increase' ? '📈' :
                      aiPredictions.deltaDirection?.direction === 'decrease' ? '📉' : '➡️'
                    }`}></span>
                    <span className="text-sm font-semibold text-white">
                      Delta will {aiPredictions.deltaDirection?.direction || 'remain stable'}
                    </span>
                  </div>
                </div>

                {/* Volatility Forecast */}
                {aiPredictions.volatilityForecast && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">IV Forecast (1 Day)</div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-amber-400">
                        {aiPredictions.volatilityForecast.predicted || (volatility * 100).toFixed(1)}%
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
                      {(aiPredictions.profitProbability * 100).toFixed(1)}%
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
                      <span className="text-xs text-indigo-400">💡 AI Recommendation</span>
                    </div>
                    <div className="text-sm text-white">
                      {aiPredictions.optimalAdjustment}
                    </div>
                  </div>
                )}

                {/* Hedge Suggestion */}
                {aiPredictions.hedgeSuggestion && (
                  <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                    <div className="text-xs text-amber-400 mb-1">🛡️ Hedge Strategy</div>
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
                  ${strategyAnalysis.maxProfit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Max Loss</div>
                <div className="text-lg font-semibold text-red-400">
                  ${strategyAnalysis.maxLoss.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs">
                <span className="text-slate-400">Breakeven: </span>
                <span className="text-yellow-400">
                  {strategyAnalysis.breakevens.map(be => `$${be.toFixed(2)}`).join(', ') || 'N/A'}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400">Win Probability: </span>
                <span className="text-cyan-400">
                  {(strategyAnalysis.profitProbability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400">Portfolio Delta: </span>
                <span className="text-indigo-400">
                  {strategyAnalysis.portfolio.totalDelta.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}