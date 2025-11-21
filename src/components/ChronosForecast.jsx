/**
 * Chronos AI Forecast Dashboard
 * PhD++ Quality Time Series Forecasting Visualization
 *
 * Features:
 * - Real Chronos-T5-Base predictions via Modal GPU
 * - Price prediction chart with confidence bands
 * - Directional scoring (BULLISH/NEUTRAL/BEARISH)
 * - Percent change prediction
 *
 * Quick Key: 8
 */

import { useState, useEffect } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import { ChronosForecasting } from '../services/ai/ultraEliteModels_v2_SIMPLIFIED.js'

export default function ChronosForecast() {
  const { marketData } = useMarketData()

  const [forecast, setForecast] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError] = useState(null)

  // Get current symbol and price data
  const symbol = marketData.symbol || 'SPY'
  const bars = marketData.bars || []
  const currentPrice = bars.length > 0 ? bars[bars.length - 1]?.close : null

  // Run forecast
  const runForecast = async () => {
    if (!bars || bars.length < 10) {
      setError('Need at least 10 price bars for forecasting')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Extract close prices for forecasting
      const prices = bars.map(b => b.close)

      console.log(`🔮 Running Chronos forecast for ${symbol} with ${prices.length} data points...`)

      // Run the forecast
      const result = await ChronosForecasting.forecast(prices, 24)

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
    if (bars && bars.length >= 10) {
      runForecast()
    }
  }, [symbol, bars?.length])

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

  // Calculate predicted price
  const predictedPrice = forecast?.predictions?.[forecast.predictions.length - 1]

  return (
    <div className="h-full bg-slate-900 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🔮 Chronos AI Forecast
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {symbol} • {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Not yet loaded'}
          </p>
        </div>

        <button
          onClick={runForecast}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            isLoading
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isLoading ? '🔄 Forecasting...' : '🔄 Refresh Forecast'}
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
      {isLoading && (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center mb-6">
          <div className="text-4xl mb-4 animate-pulse">🔮</div>
          <div className="text-slate-300 font-semibold">Running Chronos-T5-Base Forecast...</div>
          <div className="text-slate-500 text-sm mt-2">Analyzing {bars.length} price bars</div>
        </div>
      )}

      {/* Forecast Results */}
      {forecast && !isLoading && (
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
                {forecast.percentChange >= 0 ? '↑' : '↓'} ${Math.abs(predictedPrice - currentPrice)?.toFixed(2) || '0'} change
              </div>
            </div>

            {/* Confidence Range */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
              <div className="text-slate-400 text-sm font-semibold mb-1">CONFIDENCE RANGE</div>
              {forecast.confidence_low && forecast.confidence_high ? (
                <>
                  <div className="text-xl font-bold text-cyan-400">
                    ${forecast.confidence_low[forecast.confidence_low.length - 1]?.toFixed(2)} - ${forecast.confidence_high[forecast.confidence_high.length - 1]?.toFixed(2)}
                  </div>
                  <div className="text-slate-500 text-sm mt-1">90% confidence interval</div>
                </>
              ) : (
                <>
                  <div className="text-xl font-bold text-slate-500">N/A</div>
                  <div className="text-slate-500 text-sm mt-1">Fallback mode</div>
                </>
              )}
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
                    {forecast.model?.includes('REAL')
                      ? 'Using Amazon Chronos-T5-Base on Modal GPU'
                      : 'Using algorithmic fallback (Modal unavailable)'
                    }
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                forecast.model?.includes('REAL')
                  ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-900/50 text-amber-400 border border-amber-500/30'
              }`}>
                {forecast.model?.includes('REAL') ? 'REAL AI' : 'FALLBACK'}
              </div>
            </div>
          </div>

          {/* Info Footer */}
          <div className="text-center text-slate-500 text-sm">
            <p>Forecasts are AI predictions based on historical price patterns.</p>
            <p>Not financial advice. Past performance doesn't guarantee future results.</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!forecast && !isLoading && !error && (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🔮</div>
          <div className="text-slate-300 font-semibold">No Forecast Data</div>
          <div className="text-slate-500 text-sm mt-2">
            Load a symbol with price data to see AI predictions
          </div>
          <button
            onClick={runForecast}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all"
          >
            Run Forecast
          </button>
        </div>
      )}
    </div>
  )
}
