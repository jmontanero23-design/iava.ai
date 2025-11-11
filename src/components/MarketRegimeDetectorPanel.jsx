import { useState } from 'react'
import { detectMarketRegime } from '../utils/regimeDetector.js'
import { fetchBars } from '../services/alpaca.js'

export default function MarketRegimeDetectorPanel() {
  const [symbol, setSymbol] = useState('SPY')
  const [timeframe, setTimeframe] = useState('1Hour')
  const [loading, setLoading] = useState(false)
  const [regimeData, setRegimeData] = useState(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setRegimeData(null)

    try {
      // Fetch bars
      const bars = await fetchBars(symbol, timeframe, 500)

      if (!Array.isArray(bars) || bars.length === 0) {
        throw new Error('No data available for this symbol/timeframe')
      }

      // Detect regime
      const regime = detectMarketRegime(bars)
      setRegimeData(regime)
    } catch (err) {
      console.error('Regime detection failed:', err)
      setError(err.message || 'Failed to detect market regime')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-600 blur-lg opacity-50 animate-pulse" />
                  <span className="relative text-2xl filter drop-shadow-lg">🌊</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-200 to-blue-300 bg-clip-text text-transparent">
                    Market Regime Detector
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Classify market conditions with AI-powered analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Controls */}
        <div className="p-5 bg-slate-800/30 border-b border-slate-700/50">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all uppercase"
                placeholder="SPY"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-slate-400 mb-1">Timeframe</label>
              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value)}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              >
                <option value="5Min">5 Min</option>
                <option value="15Min">15 Min</option>
                <option value="1Hour">1 Hour</option>
                <option value="1Day">1 Day</option>
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !symbol}
              className="relative group px-6 py-2 rounded-lg text-sm font-semibold overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 group-hover:from-cyan-500 group-hover:to-blue-500 transition-all" />
              <span className="relative text-white">
                {loading ? 'Analyzing...' : '🔍 Analyze Regime'}
              </span>
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-500/10 rounded-lg border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Quick Analysis Buttons */}
        <div className="p-5">
          <div className="text-xs text-slate-400 mb-2">Quick Analysis:</div>
          <div className="flex flex-wrap gap-2">
            {['SPY', 'QQQ', 'IWM', 'AAPL', 'TSLA', 'NVDA'].map(sym => (
              <button
                key={sym}
                onClick={() => { setSymbol(sym); setTimeout(handleAnalyze, 100) }}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Regime Analysis Results */}
      {regimeData && (
        <div className="space-y-6">
          {/* Main Regime Card */}
          <div className="card overflow-hidden">
            <div
              className="p-6 relative overflow-hidden border-b border-slate-700/50"
              style={{
                background: `linear-gradient(135deg, ${
                  regimeData.color === 'emerald' ? '#10b98120' :
                  regimeData.color === 'rose' ? '#f4344420' :
                  regimeData.color === 'amber' ? '#f59e0b20' :
                  regimeData.color === 'orange' ? '#f9731620' :
                  regimeData.color === 'cyan' ? '#06b6d420' :
                  '#64748b20'
                } 0%, transparent 100%)`
              }}
            >
              <div className="absolute inset-0 opacity-10 blur-2xl" style={{
                background: `radial-gradient(circle at 50% 50%, ${
                  regimeData.color === 'emerald' ? '#10b981' :
                  regimeData.color === 'rose' ? '#f43444' :
                  regimeData.color === 'amber' ? '#f59e0b' :
                  regimeData.color === 'orange' ? '#f97316' :
                  regimeData.color === 'cyan' ? '#06b6d4' :
                  '#64748b'
                } 0%, transparent 70%)`
              }} />

              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{regimeData.icon}</div>
                  <div className="flex-1">
                    <div className={`text-2xl font-bold text-${regimeData.color}-300 mb-2`}>
                      {regimeData.label}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-400">Confidence:</div>
                      <div className={`text-xl font-bold text-${regimeData.color}-300`}>
                        {regimeData.confidence}%
                      </div>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-${regimeData.color}-500 to-${regimeData.color}-400`}
                          style={{ width: `${regimeData.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl bg-${regimeData.color}-500/10 border border-${regimeData.color}-500/30`}>
                  <div className={`text-sm font-semibold text-${regimeData.color}-300 mb-2`}>
                    📋 Trading Recommendation
                  </div>
                  <div className={`text-sm text-${regimeData.color}-200 leading-relaxed`}>
                    {regimeData.recommendation}
                  </div>
                </div>
              </div>
            </div>

            {/* Regime Factors */}
            <div className="p-6">
              <div className="text-sm font-semibold text-slate-300 mb-4">
                Analysis Factors
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ADX / Trend Strength */}
                {regimeData.factors.adx !== undefined && (
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1">Trend Strength (ADX)</div>
                    <div className="text-2xl font-bold text-slate-200 mb-1">
                      {regimeData.factors.adx}
                    </div>
                    <div className={`text-xs font-semibold ${
                      regimeData.factors.trendStrength === 'strong' ? 'text-emerald-400' :
                      regimeData.factors.trendStrength === 'moderate' ? 'text-amber-400' :
                      'text-slate-400'
                    }`}>
                      {regimeData.factors.trendStrength?.toUpperCase()}
                    </div>
                  </div>
                )}

                {/* EMA Alignment */}
                {(regimeData.factors.bullishAlignment !== undefined || regimeData.factors.bearishAlignment !== undefined) && (
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1">EMA Alignment</div>
                    <div className="text-2xl font-bold text-slate-200 mb-1">
                      {regimeData.factors.bullishAlignment ? '📈' : regimeData.factors.bearishAlignment ? '📉' : '—'}
                    </div>
                    <div className={`text-xs font-semibold ${
                      regimeData.factors.bullishAlignment ? 'text-emerald-400' :
                      regimeData.factors.bearishAlignment ? 'text-rose-400' :
                      'text-slate-400'
                    }`}>
                      {regimeData.factors.bullishAlignment ? 'BULLISH' :
                       regimeData.factors.bearishAlignment ? 'BEARISH' :
                       'NEUTRAL'}
                    </div>
                  </div>
                )}

                {/* Volatility */}
                {regimeData.factors.volatility && (
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1">Volatility (ATR %ile)</div>
                    <div className="text-2xl font-bold text-slate-200 mb-1">
                      {regimeData.factors.atrPercentile || 0}
                    </div>
                    <div className={`text-xs font-semibold ${
                      regimeData.factors.volatility === 'high' ? 'text-orange-400' :
                      regimeData.factors.volatility === 'moderate' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {regimeData.factors.volatility?.toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Volume */}
                {regimeData.factors.volume && (
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1">Volume (%ile)</div>
                    <div className="text-2xl font-bold text-slate-200 mb-1">
                      {regimeData.factors.volumePercentile || 0}
                    </div>
                    <div className={`text-xs font-semibold ${
                      regimeData.factors.volume === 'high' ? 'text-emerald-400' :
                      regimeData.factors.volume === 'average' ? 'text-amber-400' :
                      'text-slate-400'
                    }`}>
                      {regimeData.factors.volume?.toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Ichimoku Cloud */}
                {regimeData.factors.cloudColor && (
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1">Ichimoku Cloud</div>
                    <div className="text-2xl font-bold text-slate-200 mb-1">
                      {regimeData.factors.aboveCloud ? '☁️↑' :
                       regimeData.factors.belowCloud ? '☁️↓' :
                       '☁️'}
                    </div>
                    <div className={`text-xs font-semibold ${
                      regimeData.factors.cloudColor === 'green' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {regimeData.factors.aboveCloud ? 'ABOVE CLOUD' :
                       regimeData.factors.belowCloud ? 'BELOW CLOUD' :
                       'IN CLOUD'}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                {regimeData.factors.rangePercent && (
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1">20-Bar Range</div>
                    <div className="text-2xl font-bold text-slate-200 mb-1">
                      {regimeData.factors.rangePercent}%
                    </div>
                    <div className="text-xs font-semibold text-cyan-400">
                      PRICE ACTION
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Regime Guide */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-200">Understanding Market Regimes</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📈</span>
                  <span className="text-sm font-bold text-emerald-300">Trending Bull</span>
                </div>
                <div className="text-xs text-emerald-200/80">
                  Strong upward trend with high ADX, bullish EMA alignment, above Ichimoku cloud. Best for trend-following longs.
                </div>
              </div>

              <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📉</span>
                  <span className="text-sm font-bold text-rose-300">Trending Bear</span>
                </div>
                <div className="text-xs text-rose-200/80">
                  Strong downward trend with high ADX, bearish EMA alignment, below Ichimoku cloud. Best for trend-following shorts.
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">↔️</span>
                  <span className="text-sm font-bold text-amber-300">Choppy Range</span>
                </div>
                <div className="text-xs text-amber-200/80">
                  Low ADX, no clear trend. Market is ranging sideways. Best for support/resistance trades, avoid trend-following.
                </div>
              </div>

              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm font-bold text-orange-300">High Volatility</span>
                </div>
                <div className="text-xs text-orange-200/80">
                  ATR above 80th percentile. Large price swings, increased risk. Use tighter stops and smaller position sizes.
                </div>
              </div>

              <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💤</span>
                  <span className="text-sm font-bold text-slate-300">Low Liquidity</span>
                </div>
                <div className="text-xs text-slate-400">
                  Volume below 30th percentile. Thin trading conditions. Be cautious with large orders, spreads may be wider.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!regimeData && !loading && !error && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🌊</div>
          <div className="text-xl font-bold text-slate-300 mb-2">
            Market Regime Detector
          </div>
          <div className="text-sm text-slate-400 mb-6">
            Enter a symbol and timeframe above to analyze current market conditions
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !symbol}
            className="relative group px-6 py-2 rounded-lg text-sm font-semibold overflow-hidden inline-block disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 group-hover:from-cyan-500 group-hover:to-blue-500 transition-all" />
            <span className="relative text-white">Analyze {symbol}</span>
          </button>
        </div>
      )}
    </div>
  )
}
