import { useState } from 'react'
import { analyzeTimeframe, analyzeMultiTimeframe, getEntryTiming } from '../utils/multiTimeframeAnalyst.js'
import { fetchBarsSequential, PRIORITY } from '../services/alpacaQueue.js'

export default function MultiTimeframeAnalystPanel() {
  const [symbol, setSymbol] = useState('SPY')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      // Fetch bars for all 3 timeframes SEQUENTIALLY to avoid rate limiting
      // Using PANEL_ANALYSIS priority since this is an analysis panel
      const [shortBars, mediumBars, longBars] = await fetchBarsSequential([
        { symbol, timeframe: '5Min', limit: 500, priority: PRIORITY.PANEL_ANALYSIS },
        { symbol, timeframe: '15Min', limit: 500, priority: PRIORITY.PANEL_ANALYSIS },
        { symbol, timeframe: '1Hour', limit: 500, priority: PRIORITY.PANEL_ANALYSIS }
      ])

      if (!shortBars?.length || !mediumBars?.length || !longBars?.length) {
        throw new Error('Failed to fetch data for all timeframes')
      }

      // Analyze each timeframe
      const short = analyzeTimeframe(shortBars, '5Min')
      const medium = analyzeTimeframe(mediumBars, '15Min')
      const long = analyzeTimeframe(longBars, '1Hour')

      // Multi-timeframe synthesis
      const mtfAnalysis = analyzeMultiTimeframe({ short, medium, long })
      const entryTiming = getEntryTiming(mtfAnalysis)

      setAnalysis({ ...mtfAnalysis, entryTiming, symbol })
    } catch (err) {
      console.error('Multi-timeframe analysis failed:', err)
      setError(err.message || 'Failed to analyze timeframes')
    } finally {
      setLoading(false)
    }
  }

  const getTrendColor = (trend) => {
    const colors = {
      bullish: 'emerald',
      bearish: 'rose',
      neutral: 'slate'
    }
    return colors[trend] || 'slate'
  }

  const getTrendIcon = (trend) => {
    const icons = {
      bullish: '📈',
      bearish: '📉',
      neutral: '↔️'
    }
    return icons[trend] || '—'
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-600 blur-lg opacity-50 animate-pulse" />
                  <span className="relative text-2xl filter drop-shadow-lg">📊</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-purple-200 to-blue-300 bg-clip-text text-transparent">
                    Multi-Timeframe Analyst
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    3-timeframe confluence analysis (5m/15m/1h)
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
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all uppercase"
                placeholder="SPY"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !symbol}
              className="relative group px-6 py-2 rounded-lg text-sm font-semibold overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 group-hover:from-purple-500 group-hover:to-blue-500 transition-all" />
              <span className="relative text-white">
                {loading ? 'Analyzing...' : '🔍 Analyze Timeframes'}
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
            {['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT'].map(sym => (
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

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overall Recommendation Card */}
          <div className="card overflow-hidden">
            <div
              className="p-6 relative overflow-hidden border-b border-slate-700/50"
              style={{
                background: `linear-gradient(135deg, ${
                  analysis.recommendation.color === 'emerald' ? '#10b98120' :
                  analysis.recommendation.color === 'rose' ? '#f4344420' :
                  analysis.recommendation.color === 'cyan' ? '#06b6d420' :
                  analysis.recommendation.color === 'blue' ? '#3b82f620' :
                  analysis.recommendation.color === 'yellow' ? '#f59e0b20' :
                  '#64748b20'
                } 0%, transparent 100%)`
              }}
            >
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{analysis.recommendation.icon}</div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 mb-1">
                      {analysis.symbol} • Multi-Timeframe Confluence
                    </div>
                    <div className={`text-2xl font-bold text-${analysis.recommendation.color}-300 mb-2 capitalize`}>
                      {analysis.recommendation.action.replace(/_/g, ' ')}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-sm text-slate-400">Confidence:</div>
                      <div className={`text-lg font-bold text-${analysis.recommendation.color}-300 capitalize`}>
                        {analysis.recommendation.confidence.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl bg-${analysis.recommendation.color}-500/10 border border-${analysis.recommendation.color}-500/30`}>
                  <div className={`text-sm text-${analysis.recommendation.color}-200 leading-relaxed`}>
                    {analysis.recommendation.message}
                  </div>
                </div>
              </div>
            </div>

            {/* Confluence Metrics */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-1">Timeframe Alignment</div>
                  <div className={`text-2xl font-bold ${analysis.aligned ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {analysis.aligned ? '✓ Aligned' : '✗ Mixed'}
                  </div>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-1">Confluence Score</div>
                  <div className="text-2xl font-bold text-purple-300">
                    {Math.round(analysis.confluence * 100)}%
                  </div>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-400"
                      style={{ width: `${analysis.confluence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-1">Weighted Score</div>
                  <div className={`text-2xl font-bold ${
                    analysis.weightedScore > 60 ? 'text-emerald-300' :
                    analysis.weightedScore < 40 ? 'text-rose-300' :
                    'text-slate-300'
                  }`}>
                    {Math.round(analysis.weightedScore)}/100
                  </div>
                </div>
              </div>

              {/* Signal Distribution */}
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <div className="text-sm font-semibold text-slate-300 mb-3">Signal Distribution</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="text-xs text-emerald-400 mb-1">Bullish</div>
                    <div className="text-xl font-bold text-emerald-300">{analysis.signals.bullish}/3</div>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                    <div className="text-xs text-slate-400 mb-1">Neutral</div>
                    <div className="text-xl font-bold text-slate-300">{analysis.signals.neutral}/3</div>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                    <div className="text-xs text-rose-400 mb-1">Bearish</div>
                    <div className="text-xl font-bold text-rose-300">{analysis.signals.bearish}/3</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Entry Timing */}
          {analysis.entryTiming && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                <h3 className="text-sm font-bold text-purple-200">⏱️ Entry Timing</h3>
              </div>
              <div className="p-5">
                <div className={`p-4 rounded-xl bg-${analysis.entryTiming.color}-500/10 border border-${analysis.entryTiming.color}-500/30`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{analysis.entryTiming.icon}</span>
                    <div className={`text-sm font-bold text-${analysis.entryTiming.color}-300 capitalize`}>
                      {analysis.entryTiming.timing.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className={`text-sm text-${analysis.entryTiming.color}-200`}>
                    {analysis.entryTiming.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Individual Timeframe Analysis */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-200">Individual Timeframe Analysis</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Long-term (1 Hour) - Most Important */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Long-term (1 Hour) - 40% Weight</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTrendIcon(analysis.timeframes.long.trend)}</span>
                      <span className={`text-lg font-bold text-${getTrendColor(analysis.timeframes.long.trend)}-300 capitalize`}>
                        {analysis.timeframes.long.trend}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-1">Score</div>
                    <div className="text-2xl font-bold text-slate-200">
                      {Math.round(analysis.timeframes.long.score)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400 mb-1">Nearest Support</div>
                    <div className="text-slate-200 font-semibold">
                      ${analysis.timeframes.long.nearestSupport?.price?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Nearest Resistance</div>
                    <div className="text-slate-200 font-semibold">
                      ${analysis.timeframes.long.nearestResistance?.price?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Medium-term (15 Min) */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Medium-term (15 Min) - 35% Weight</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTrendIcon(analysis.timeframes.medium.trend)}</span>
                      <span className={`text-lg font-bold text-${getTrendColor(analysis.timeframes.medium.trend)}-300 capitalize`}>
                        {analysis.timeframes.medium.trend}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-1">Score</div>
                    <div className="text-2xl font-bold text-slate-200">
                      {Math.round(analysis.timeframes.medium.score)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400 mb-1">Nearest Support</div>
                    <div className="text-slate-200 font-semibold">
                      ${analysis.timeframes.medium.nearestSupport?.price?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Nearest Resistance</div>
                    <div className="text-slate-200 font-semibold">
                      ${analysis.timeframes.medium.nearestResistance?.price?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Short-term (5 Min) */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Short-term (5 Min) - 25% Weight</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTrendIcon(analysis.timeframes.short.trend)}</span>
                      <span className={`text-lg font-bold text-${getTrendColor(analysis.timeframes.short.trend)}-300 capitalize`}>
                        {analysis.timeframes.short.trend}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-1">Score</div>
                    <div className="text-2xl font-bold text-slate-200">
                      {Math.round(analysis.timeframes.short.score)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400 mb-1">Nearest Support</div>
                    <div className="text-slate-200 font-semibold">
                      ${analysis.timeframes.short.nearestSupport?.price?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Nearest Resistance</div>
                    <div className="text-slate-200 font-semibold">
                      ${analysis.timeframes.short.nearestResistance?.price?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-200">How Multi-Timeframe Analysis Works</h3>
            </div>
            <div className="p-5 space-y-3 text-sm text-slate-400">
              <p>
                <strong className="text-slate-300">Confluence:</strong> When all three timeframes agree on direction, the signal strength is much higher. Perfect alignment (3/3) gives 100% confluence.
              </p>
              <p>
                <strong className="text-slate-300">Weighted Scoring:</strong> Long-term trends (1 Hour) carry more weight (40%), followed by medium-term (15 Min, 35%) and short-term (5 Min, 25%).
              </p>
              <p>
                <strong className="text-slate-300">Entry Timing:</strong> Even with good confluence, entry timing matters. The system recommends when conditions are ideal vs when to wait.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && !error && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <div className="text-xl font-bold text-slate-300 mb-2">
            Multi-Timeframe Analyst
          </div>
          <div className="text-sm text-slate-400 mb-6">
            Analyze trend confluence across 5 minute, 15 minute, and 1 hour timeframes
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !symbol}
            className="relative group px-6 py-2 rounded-lg text-sm font-semibold overflow-hidden inline-block disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 group-hover:from-purple-500 group-hover:to-blue-500 transition-all" />
            <span className="relative text-white">Analyze {symbol}</span>
          </button>
        </div>
      )}
    </div>
  )
}
