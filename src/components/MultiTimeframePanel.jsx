/**
 * Multi-Timeframe Analysis Panel - PhD++ Elite Quality
 *
 * Shows comprehensive analysis across ALL timeframes (1Min → Daily)
 * This is what professional traders use for context - never trade one TF in isolation!
 */

import { useState, useEffect } from 'react'
import InfoPopover from './InfoPopover.jsx'
import { analyzeAllTimeframes, TIMEFRAMES } from '../utils/multiTimeframeAnalysis.js'

export default function MultiTimeframePanel({ symbol, onLoadTimeframe }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const runAnalysis = async () => {
    if (!symbol) {
      setError('No symbol provided')
      return
    }

    try {
      setLoading(true)
      setError('')

      const result = await analyzeAllTimeframes(symbol)

      if (result.error) {
        setError(result.error)
        setAnalysis(null)
      } else {
        setAnalysis(result)
      }
    } catch (e) {
      setError(e.message || 'Analysis failed')
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  // Run analysis on mount and when symbol changes
  useEffect(() => {
    runAnalysis()
  }, [symbol])

  // Auto-refresh every 60 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(runAnalysis, 60000)
    return () => clearInterval(interval)
  }, [autoRefresh, symbol])

  const getRecommendationColor = (type) => {
    if (type === 'strong_buy' || type === 'buy') return 'emerald'
    if (type === 'strong_sell' || type === 'sell') return 'rose'
    if (type === 'caution') return 'amber'
    return 'slate'
  }

  const getConsensusColor = (consensus) => {
    if (consensus?.includes('strong_bullish')) return 'emerald'
    if (consensus?.includes('bullish')) return 'green'
    if (consensus?.includes('strong_bearish')) return 'rose'
    if (consensus?.includes('bearish')) return 'red'
    if (consensus?.includes('mixed')) return 'amber'
    return 'slate'
  }

  const getScoreColor = (score) => {
    if (score >= 75) return 'emerald'
    if (score >= 60) return 'green'
    if (score >= 40) return 'amber'
    if (score >= 25) return 'orange'
    return 'rose'
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-500 blur-2xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="panel-icon">📊</span>
              <h3 className="font-bold bg-gradient-to-r from-cyan-200 to-blue-300 bg-clip-text text-transparent inline-flex items-center gap-2" style={{ fontSize: 'var(--text-lg)' }}>
                Multi-Timeframe Analysis: {symbol || 'Select Symbol'}
                <InfoPopover title="Multi-TF Analysis">
                  Professional traders NEVER look at just one timeframe.
                  {'\n\n'}This panel analyzes ALL timeframes simultaneously (1Min → Daily) to give you:
                  {'\n• '}Overall trend direction
                  {'\n• '}Timeframe alignment/divergence
                  {'\n• '}Best entry timeframe
                  {'\n• '}Weighted consensus score
                  {'\n• '}Risk warnings
                  {'\n\n'}PhD++ Quality: Industry-standard top-down analysis.
                </InfoPopover>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={autoRefresh}
                  onChange={e => setAutoRefresh(e.target.checked)}
                />
                <span className="text-slate-400">Auto-refresh</span>
              </label>
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="btn-ghost btn-xs"
              >
                {loading ? '⏳ Analyzing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {error && (
          <div className="p-3 bg-rose-600/10 border border-rose-500/30 rounded-lg text-sm text-rose-300">
            ⚠️ {error}
          </div>
        )}

        {loading && !analysis && (
          <div className="text-center py-8">
            <div className="spinner mx-auto mb-3" />
            <div className="text-sm text-slate-400">Analyzing all timeframes...</div>
          </div>
        )}

        {analysis && (
          <>
            {/* Consensus & Weighted Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`p-4 rounded-lg border bg-${getConsensusColor(analysis.consensus)}-600/10 border-${getConsensusColor(analysis.consensus)}-500/30`}>
                <div className="text-xs text-slate-400 mb-1">Multi-TF Consensus</div>
                <div className={`text-xl font-bold text-${getConsensusColor(analysis.consensus)}-400`}>
                  {analysis.consensus?.toUpperCase().replace(/_/g, ' ')}
                </div>
              </div>

              <div className={`p-4 rounded-lg border bg-${getScoreColor(analysis.weightedScore)}-600/10 border-${getScoreColor(analysis.weightedScore)}-500/30`}>
                <div className="text-xs text-slate-400 mb-1">Weighted Unicorn Score</div>
                <div className={`text-xl font-bold text-${getScoreColor(analysis.weightedScore)}-400`}>
                  {analysis.weightedScore.toFixed(1)} / 100
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  (Higher TFs weighted more)
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {analysis.recommendation && (
              <div className={`p-4 rounded-lg border bg-${getRecommendationColor(analysis.recommendation.type)}-600/10 border-${getRecommendationColor(analysis.recommendation.type)}-500/30`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-bold text-slate-200">
                    📈 Recommendation
                  </div>
                  <div className={`px-2 py-0.5 rounded-md text-xs font-semibold bg-${getRecommendationColor(analysis.recommendation.type)}-600/20 border border-${getRecommendationColor(analysis.recommendation.type)}-500/30 text-${getRecommendationColor(analysis.recommendation.type)}-300`}>
                    {analysis.recommendation.confidence.toUpperCase().replace(/_/g, ' ')} CONFIDENCE
                  </div>
                </div>

                <div className={`text-base font-bold mb-2 text-${getRecommendationColor(analysis.recommendation.type)}-300`}>
                  {analysis.recommendation.message}
                </div>

                <div className="text-sm text-slate-400 mb-2">
                  {analysis.recommendation.rationale}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Risk Level:</span>
                  <span className={`px-2 py-0.5 rounded bg-slate-800 text-${analysis.recommendation.riskLevel === 'low' ? 'emerald' : analysis.recommendation.riskLevel === 'medium' ? 'amber' : 'rose'}-400 font-semibold`}>
                    {analysis.recommendation.riskLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Best Entry Timeframe */}
            {analysis.bestEntryTimeframe && (
              <div className="p-4 rounded-lg border bg-indigo-600/10 border-indigo-500/30">
                <div className="text-sm font-bold text-slate-200 mb-2">
                  🎯 Optimal Entry Timeframe
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl font-bold text-indigo-400">
                    {analysis.bestEntryTimeframe.timeframe}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-300">
                      {analysis.bestEntryTimeframe.reason}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Strategy: {analysis.bestEntryTimeframe.strategy}
                    </div>
                  </div>
                </div>
                {onLoadTimeframe && (
                  <button
                    onClick={() => onLoadTimeframe(analysis.bestEntryTimeframe.timeframe)}
                    className="btn-primary btn-sm w-full"
                  >
                    📊 Load {analysis.bestEntryTimeframe.timeframe} Chart
                  </button>
                )}
              </div>
            )}

            {/* Timeframe Breakdown */}
            <div className="space-y-2">
              <div className="text-sm font-bold text-slate-300 mb-3">
                Timeframe Breakdown
              </div>

              {TIMEFRAMES.map(tf => {
                const data = analysis.timeframes[tf]

                if (!data?.available) {
                  return (
                    <div key={tf} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-400">{tf}</div>
                        <div className="text-xs text-slate-400">❌ Not available</div>
                      </div>
                    </div>
                  )
                }

                const icon = data.regime.includes('bullish') ? '🟢' :
                             data.regime.includes('bearish') ? '🔴' : '⚪'

                const scoreColor = getScoreColor(data.score)

                return (
                  <div
                    key={tf}
                    className={`p-3 rounded-lg bg-${scoreColor}-600/5 border border-${scoreColor}-500/20 cursor-pointer hover:bg-${scoreColor}-600/10 transition-all`}
                    onClick={() => onLoadTimeframe?.(tf)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="text-sm font-semibold text-slate-200">{tf}</span>
                      </div>
                      <div className={`text-lg font-bold text-${scoreColor}-400`}>
                        {data.score.toFixed(0)}/100
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-slate-400">Regime</div>
                        <div className={`font-semibold text-${scoreColor}-400`}>
                          {data.regime}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">RSI</div>
                        <div className="font-semibold text-slate-300">
                          {data.rsi?.toFixed(0) || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Volume</div>
                        <div className="font-semibold text-slate-300">
                          {data.relativeVolume?.toFixed(1) || 'N/A'}x
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Squeeze</div>
                        <div className={`font-semibold ${data.squeeze === 'fired' ? 'text-amber-400' : data.squeeze === 'on' ? 'text-rose-400' : 'text-slate-400'}`}>
                          {data.squeeze.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Warnings */}
            {analysis.warnings && analysis.warnings.length > 0 && (
              <div className="p-4 rounded-lg border bg-amber-600/10 border-amber-500/30">
                <div className="text-sm font-bold text-amber-300 mb-2">
                  ⚠️ Warnings & Divergences
                </div>
                <div className="space-y-2">
                  {analysis.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <div className="flex-1">
                        <div className="text-amber-300">{warning.message}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Severity: {warning.severity.toUpperCase()} • Type: {warning.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-slate-400 text-center pt-3 border-t border-slate-700/50">
              Last analyzed: {new Date(analysis.timestamp).toLocaleTimeString()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
