/**
 * AVA Forecast Dashboard
 * PhD++ Quality Time Series Forecasting Visualization
 *
 * Features:
 * - Real AI predictions via AVA Cloud
 * - Price prediction chart with confidence bands
 * - Directional scoring (BULLISH/NEUTRAL/BEARISH)
 * - Percent change prediction
 *
 * Quick Key: 8
 */

import { useState, useEffect } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

export default function ChronosForecast() {
  const { marketData } = useMarketData()

  const [forecast, setForecast] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError] = useState(null)
  const [lastSymbol, setLastSymbol] = useState(null) // PhD++ Track last symbol to detect changes

  // PhD++ CRITICAL: Check if marketData is loading - prevents stale data usage
  const isDataLoading = marketData.isLoading || !marketData.symbol

  // Get current symbol and price data
  const symbol = marketData.symbol || null  // PhD++ Don't default to SPY - wait for real data
  const bars = marketData.bars || []
  const currentPrice = bars.length > 0 ? bars[bars.length - 1]?.close : null

  // Run forecast
  const runForecast = async () => {
    // PhD++ CRITICAL: Don't run with stale/loading data
    if (isDataLoading) {
      console.log('[Forecast] Waiting for data to load...')
      return
    }

    if (!symbol) {
      setError('No symbol loaded')
      return
    }

    if (!bars || bars.length < 10) {
      setError('Need at least 10 price bars for forecasting')
      return
    }

    setIsLoading(true)
    setError(null)
    setLastSymbol(symbol) // Track which symbol we're forecasting

    try {
      // PhD++ Extract FULL OHLCV data for rich context
      const prices = bars.map(b => b.close)
      const ohlcv = bars.map(b => ({
        o: b.open,
        h: b.high,
        l: b.low,
        c: b.close,
        v: b.volume || 0,
        t: b.time || b.timestamp
      }))

      // PhD++ Calculate key indicators for context
      const recentPrices = prices.slice(-20)
      const sma20 = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
      const volatility = Math.sqrt(
        recentPrices.reduce((sum, p) => sum + Math.pow(p - sma20, 2), 0) / recentPrices.length
      ) / sma20 * 100 // As percentage

      // PhD++ RSI calculation (simplified)
      const rsiPeriod = Math.min(14, prices.length - 1)
      let gains = 0, losses = 0
      for (let i = prices.length - rsiPeriod; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1]
        if (change > 0) gains += change
        else losses -= change
      }
      const avgGain = gains / rsiPeriod
      const avgLoss = losses / rsiPeriod
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      const rsi = 100 - (100 / (1 + rs))

      // PhD++ Trend detection
      const shortTrend = prices.slice(-5)
      const longTrend = prices.slice(-20)
      const shortMomentum = (shortTrend[shortTrend.length - 1] - shortTrend[0]) / shortTrend[0] * 100
      const longMomentum = longTrend.length >= 20 ? (longTrend[longTrend.length - 1] - longTrend[0]) / longTrend[0] * 100 : shortMomentum

      console.log(`🔮 Running AVA forecast for ${symbol} with ${prices.length} data points...`)
      console.log(`📊 Context: RSI=${rsi.toFixed(1)}, Vol=${volatility.toFixed(2)}%, Momentum=${shortMomentum.toFixed(2)}%`)

      // Call backend API (which has access to Modal)
      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prices,
          ohlcv: ohlcv.slice(-100), // Last 100 bars for context
          horizon: 24,
          symbol,
          // PhD++ Rich context injection
          context: {
            rsi,
            volatility,
            sma20,
            shortMomentum,
            longMomentum,
            currentPrice: prices[prices.length - 1],
            priceRange: {
              high: Math.max(...recentPrices),
              low: Math.min(...recentPrices)
            }
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const result = await response.json()

      setForecast(result)
      setLastUpdate(new Date())

      console.log(`✅ Forecast complete:`, result)
    } catch (err) {
      console.error('Forecast error:', err)
      setError(err.message || 'Forecast failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-run forecast when symbol changes
  useEffect(() => {
    // PhD++ CRITICAL: Clear old forecast when symbol changes
    if (symbol !== lastSymbol && lastSymbol !== null) {
      setForecast(null)
      setError(null)
    }

    // PhD++ Don't auto-run if data is still loading
    if (isDataLoading) {
      return
    }

    if (bars && bars.length >= 10 && symbol) {
      runForecast()
    }
  }, [symbol, bars?.length, isDataLoading])

  // Get direction color
  const getDirectionColor = (direction) => {
    if (!direction) return 'text-slate-400'
    const d = direction.toLowerCase()
    if (d.includes('bullish')) return 'text-emerald-400'
    if (d.includes('bearish')) return 'text-red-400'
    return 'text-slate-400'
  }

  // Get direction icon
  const getDirectionIcon = (direction) => {
    if (!direction) return '➖'
    const d = direction.toLowerCase()
    if (d.includes('bullish')) return '📈'
    if (d.includes('bearish')) return '📉'
    return '➖'
  }

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 55) return 'bg-cyan-500'
    if (score >= 45) return 'bg-slate-500'
    if (score >= 30) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // Calculate predicted price with NaN protection
  const rawPredictedPrice = forecast?.predictions?.[forecast.predictions.length - 1]
  const predictedPrice = (typeof rawPredictedPrice === 'number' && !isNaN(rawPredictedPrice) && isFinite(rawPredictedPrice))
    ? rawPredictedPrice
    : null

  return (
    <div className="h-full bg-slate-900 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🔮 AVA Forecast
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isDataLoading ? (
              <span className="text-amber-400 animate-pulse">Loading market data...</span>
            ) : symbol ? (
              <>
                {symbol} • {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Ready to forecast'}
              </>
            ) : (
              'No symbol loaded'
            )}
          </p>
        </div>

        <button
          onClick={runForecast}
          disabled={isLoading || isDataLoading || !symbol}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            isLoading || isDataLoading || !symbol
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isLoading ? '🔄 Forecasting...' : isDataLoading ? '⏳ Loading...' : '🔄 Refresh Forecast'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
          <div className="text-red-400 font-semibold">❌ Forecast Error</div>
          <div className="text-red-300 text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Loading State */}
      {(isLoading || isDataLoading) && (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center mb-6">
          <div className="text-4xl mb-4 animate-pulse">🔮</div>
          <div className="text-slate-300 font-semibold">
            {isDataLoading ? 'Loading market data...' : 'Running AVA Forecast Engine...'}
          </div>
          <div className="text-slate-500 text-sm mt-2">
            {isDataLoading ? `Symbol: ${symbol || 'loading...'}` : `Analyzing ${bars.length} price bars for ${symbol}`}
          </div>
        </div>
      )}

      {/* Forecast Results */}
      {forecast && !isLoading && !isDataLoading && (
        <div className="space-y-6">
          {/* Main Direction Card */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-sm font-semibold mb-2">FORECAST DIRECTION</div>
                <div className={`text-4xl font-bold ${getDirectionColor(forecast.direction)} flex items-center gap-3`}>
                  <span>{getDirectionIcon(forecast.direction)}</span>
                  <span>{forecast.direction || 'NEUTRAL'}</span>
                </div>
                <div className={`text-xl mt-2 ${forecast.percentChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {forecast.percentChange >= 0 ? '+' : ''}{forecast.percentChange?.toFixed(2)}% predicted
                </div>
              </div>

              {/* Score Gauge */}
              <div className="text-center">
                <div className="text-slate-400 text-sm font-semibold mb-2">FORECAST SCORE</div>
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${(forecast.accuracy_score || 0.5) * 352} 352`}
                      className={getScoreColor(forecast.accuracy_score * 100).replace('bg-', 'text-')}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {Math.round((forecast.accuracy_score || 0.5) * 100)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Prediction Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Price */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
              <div className="text-slate-400 text-sm font-semibold mb-1">CURRENT PRICE</div>
              <div className="text-3xl font-bold text-white">
                ${currentPrice?.toFixed(2) || '---'}
              </div>
              <div className="text-slate-500 text-sm mt-1">Live market price</div>
            </div>

            {/* Predicted Price */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
              <div className="text-slate-400 text-sm font-semibold mb-1">PREDICTED PRICE (24h)</div>
              <div className={`text-3xl font-bold ${getDirectionColor(forecast.direction)}`}>
                ${predictedPrice?.toFixed(2) || '---'}
              </div>
              <div className="text-slate-500 text-sm mt-1">
                {(() => {
                  // PhD++ NaN-safe price change calculation
                  if (predictedPrice === null || currentPrice === null) return '---'
                  const change = Math.abs(predictedPrice - currentPrice)
                  if (isNaN(change) || !isFinite(change)) return '---'
                  return `${forecast.percentChange >= 0 ? '↑' : '↓'} $${change.toFixed(2)} change`
                })()}
              </div>
            </div>

            {/* Confidence Range */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
              <div className="text-slate-400 text-sm font-semibold mb-1">CONFIDENCE RANGE</div>
              {(() => {
                // PhD++ NaN-safe confidence range extraction
                const lowVal = forecast.confidence_low?.[forecast.confidence_low.length - 1]
                const highVal = forecast.confidence_high?.[forecast.confidence_high.length - 1]
                const isValidLow = typeof lowVal === 'number' && !isNaN(lowVal) && isFinite(lowVal)
                const isValidHigh = typeof highVal === 'number' && !isNaN(highVal) && isFinite(highVal)

                if (isValidLow && isValidHigh) {
                  return (
                    <>
                      <div className="text-xl font-bold text-cyan-400">
                        ${lowVal.toFixed(2)} - ${highVal.toFixed(2)}
                      </div>
                      <div className="text-slate-500 text-sm mt-1">90% confidence interval</div>
                    </>
                  )
                } else {
                  return (
                    <>
                      <div className="text-xl font-bold text-slate-500">N/A</div>
                      <div className="text-slate-500 text-sm mt-1">Fallback mode</div>
                    </>
                  )
                }
              })()}
            </div>
          </div>

          {/* Prediction Timeline */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <div className="text-slate-400 text-sm font-semibold mb-4">PREDICTION TIMELINE (24 periods)</div>

            {/* Simple bar chart visualization */}
            <div className="flex items-end gap-1 h-32">
              {forecast.predictions?.slice(0, 24).map((pred, i) => {
                const minPred = Math.min(...forecast.predictions)
                const maxPred = Math.max(...forecast.predictions)
                const range = maxPred - minPred || 1
                const height = ((pred - minPred) / range) * 100

                const isUp = pred > currentPrice
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all ${
                      isUp ? 'bg-emerald-500/60' : 'bg-red-500/60'
                    }`}
                    style={{ height: `${Math.max(10, height)}%` }}
                    title={`Period ${i + 1}: $${pred.toFixed(2)}`}
                  />
                )
              })}
            </div>

            {/* Timeline labels */}
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>Now</span>
              <span>+6h</span>
              <span>+12h</span>
              <span>+18h</span>
              <span>+24h</span>
            </div>
          </div>

          {/* Model Status */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {forecast.model?.includes('REAL') ? '🚀' : '⚠️'}
                </span>
                <div>
                  <div className="font-semibold text-white">{forecast.model || 'Unknown Model'}</div>
                  <div className="text-slate-500 text-sm">
                    {forecast.model?.includes('Ensemble')
                      ? 'AVA Ensemble: ML + Context-Aware Analysis'
                      : forecast.model?.includes('REAL')
                        ? 'AVA Cloud Neural Network'
                        : 'AVA Algorithmic Fallback'
                    }
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                forecast.model?.includes('REAL')
                  ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-900/50 text-amber-400 border border-amber-500/30'
              }`}>
                {forecast.model?.includes('REAL') ? 'ENSEMBLE AI' : 'FALLBACK'}
              </div>
            </div>

            {/* PhD++ Ensemble breakdown */}
            {forecast.ensemble && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Weights:</span>
                    {forecast.ensemble.chronosAvailable && (
                      <span className="text-cyan-400">
                        {(forecast.ensemble.weights.chronos * 100).toFixed(0)}% AVA ML
                      </span>
                    )}
                    <span className="text-amber-400">
                      {(forecast.ensemble.weights.smart * 100).toFixed(0)}% Smart
                    </span>
                  </div>
                  {forecast.ensemble.smartReason && (
                    <div className="text-slate-500">
                      Strategy: {forecast.ensemble.smartReason}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PhD++ Context insights */}
            {forecast.contextInsights && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-4 text-xs">
                  <span className={`px-2 py-0.5 rounded ${
                    forecast.contextInsights.rsi > 70 ? 'bg-red-900/50 text-red-400' :
                    forecast.contextInsights.rsi < 30 ? 'bg-emerald-900/50 text-emerald-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    RSI: {forecast.contextInsights.rsi?.toFixed(1)}
                  </span>
                  <span className="text-slate-400">
                    Volatility: {forecast.contextInsights.volatility?.toFixed(2)}%
                  </span>
                  <span className={`px-2 py-0.5 rounded ${
                    forecast.contextInsights.regime === 'overbought' ? 'bg-red-900/50 text-red-400' :
                    forecast.contextInsights.regime === 'oversold' ? 'bg-emerald-900/50 text-emerald-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {forecast.contextInsights.regime?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="text-center text-slate-500 text-sm">
            <p>Forecasts are AI predictions based on historical price patterns.</p>
            <p>Not financial advice. Past performance doesn't guarantee future results.</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!forecast && !isLoading && !isDataLoading && !error && (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🔮</div>
          <div className="text-slate-300 font-semibold">
            {symbol ? 'Ready to Forecast' : 'No Symbol Loaded'}
          </div>
          <div className="text-slate-500 text-sm mt-2">
            {symbol
              ? `Click below to run AI forecast for ${symbol}`
              : 'Load a symbol on the chart to see AI predictions'}
          </div>
          {symbol && (
            <button
              onClick={runForecast}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all"
            >
              Run Forecast for {symbol}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
