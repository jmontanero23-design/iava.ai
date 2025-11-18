import React, { useState } from 'react'
import InfoPopover from './InfoPopover.jsx'
import { updateWeights, UNICORN_WEIGHTS, resetWeights } from '../utils/scoreConfig.js'

/**
 * Score Optimizer Component
 *
 * Runs data-driven analysis to recommend Unicorn Score weights
 * based on historical performance.
 *
 * Blueprint: docs/blueprint.md (Score Optimization section)
 */
export default function ScoreOptimizer({ symbol = 'SPY', timeframe = '15' }) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [applied, setApplied] = useState(false)

  async function runOptimization() {
    setLoading(true)
    setError(null)
    setApplied(false)
    try {
      const res = await fetch(`/api/optimize_score?symbol=${symbol}&timeframe=${timeframe}&horizon=10`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function applyRecommendedWeights() {
    if (!results?.individual) return
    const newWeights = {}
    for (const [name, data] of Object.entries(results.individual)) {
      if (data.recommendedWeight != null) {
        newWeights[name] = data.recommendedWeight
      }
    }
    updateWeights(newWeights)
    setApplied(true)
    // Show success feedback
    setTimeout(() => {
      alert('Weights applied! Scores will update on next data load.')
    }, 100)
  }

  function resetToDefaults() {
    resetWeights()
    setApplied(false)
    // Show success feedback
    setTimeout(() => {
      alert('Weights reset to defaults! Scores will update on next data load.')
    }, 100)
  }

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Icon with glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-violet-600 blur-lg opacity-50 animate-pulse" />
                <span className="relative text-2xl filter drop-shadow-lg">⚙️</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-violet-200 via-purple-200 to-fuchsia-300 bg-clip-text text-transparent inline-flex items-center gap-2">
                Score Optimization
                <InfoPopover title="Data-Driven Weights">
                  Analyzes historical data to find the best-performing indicator combinations.
                  Recommends weights based on:
                  <br/>• <strong>Quality</strong>: Avg forward return when signal triggers
                  <br/>• <strong>Rarity</strong>: How often the signal appears (rarer = higher weight)
                  <br/>• <strong>Regime-Fit</strong>: Performance in bull vs bear markets
                  <br/><br/>
                  Click "Run Optimization" to analyze {symbol} on {timeframe}min data.
                </InfoPopover>
              </h3>
            </div>
          </div>

          {/* Premium Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={runOptimization}
              disabled={loading}
              className="relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-500 group-hover:to-purple-500 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <span className="relative text-white flex items-center gap-1.5">
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Running...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Run Optimization
                  </>
                )}
              </span>
            </button>

            {results && (
              <>
                <button
                  onClick={applyRecommendedWeights}
                  disabled={applied}
                  className="relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                  <span className="relative text-white flex items-center gap-1.5">
                    {applied ? (
                      <>
                        <span>✓</span>
                        Applied
                      </>
                    ) : (
                      <>
                        <span>📊</span>
                        Apply Weights
                      </>
                    )}
                  </span>
                </button>

                <button
                  onClick={resetToDefaults}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all"
                >
                  🔄 Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Premium Content */}
      <div className="p-5 space-y-4">
        {/* Premium Error Display */}
        {error && (
          <div className="p-4 bg-rose-900/20 rounded-xl border border-rose-500/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <p className="text-sm text-rose-300 font-medium">{error}</p>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {/* Premium Analysis Summary */}
            <div className="p-4 bg-slate-800/30 rounded-xl border border-violet-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">📈</span>
                <div className="text-xs uppercase tracking-wider text-violet-300 font-semibold">Analysis Summary</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-400">Symbol:</span>
                  <span className="text-emerald-400 font-semibold">{results.symbol}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-400">Timeframe:</span>
                  <span className="text-emerald-400 font-semibold">{results.timeframe}min</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-400">Bars Analyzed:</span>
                  <span className="text-emerald-400 font-semibold">{results.bars}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-400">Best Performer:</span>
                  <span className="text-violet-400 font-semibold">{results.summary?.bestPerformer}</span>
                </div>
              </div>
              {results.summary?.message && (
                <div className="mt-3 p-3 bg-violet-900/20 rounded-lg border border-violet-500/30">
                  <p className="text-xs text-violet-200">{results.summary.message}</p>
                </div>
              )}
            </div>

            {/* Premium Current Weights */}
            <div className="p-4 bg-slate-800/30 rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">⚖️</span>
                <div className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Current Weights</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(UNICORN_WEIGHTS).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-purple-500/30 transition-all">
                    <span className="text-xs text-slate-300 font-medium">{key}</span>
                    <span className="text-xs text-purple-400 font-bold font-mono">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Individual Performance Table */}
            <div className="bg-slate-800/30 rounded-xl border border-violet-500/20 overflow-hidden">
              <div className="p-3 bg-slate-800/50 border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <div className="text-xs uppercase tracking-wider text-violet-300 font-semibold">Individual Indicator Performance</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900/50 sticky top-0 backdrop-blur-sm">
                    <tr className="text-slate-400 border-b border-slate-700/30">
                      <th className="text-left py-3 px-3 font-semibold">Indicator</th>
                      <th className="text-right py-3 px-3 font-semibold">Occurrences</th>
                      <th className="text-right py-3 px-3 font-semibold">Rarity</th>
                      <th className="text-right py-3 px-3 font-semibold">Avg Return</th>
                      <th className="text-right py-3 px-3 font-semibold">Bull Return</th>
                      <th className="text-right py-3 px-3 font-semibold">Bear Return</th>
                      <th className="text-right py-3 px-3 font-semibold">Recommended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.individual || {}).map(([name, data]) => (
                      <tr key={name} className="border-t border-slate-700/30 hover:bg-violet-900/10 transition-colors">
                        <td className="py-2 px-3 text-slate-200 font-medium">{name}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{data.occurrences}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{data.rarity || '—'}</td>
                        <td className="py-2 px-3 text-right">
                          {data.avgReturn ? (
                            <span className={`font-semibold ${parseFloat(data.avgReturn) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {data.avgReturn}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">{data.bullReturn || '—'}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{data.bearReturn || '—'}</td>
                        <td className="py-2 px-3 text-right">
                          {data.recommendedWeight != null ? (
                            <span className="text-violet-400 font-bold">{data.recommendedWeight}</span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">{data.note}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Premium Combo Performance Table */}
            {results.combos && Object.keys(results.combos).length > 0 && (
              <div className="bg-slate-800/30 rounded-xl border border-fuchsia-500/20 overflow-hidden">
                <div className="p-3 bg-slate-800/50 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔗</span>
                    <div className="text-xs uppercase tracking-wider text-fuchsia-300 font-semibold">2-Indicator Combinations</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900/50 sticky top-0 backdrop-blur-sm">
                      <tr className="text-slate-400 border-b border-slate-700/30">
                        <th className="text-left py-3 px-3 font-semibold">Combo</th>
                        <th className="text-right py-3 px-3 font-semibold">Occurrences</th>
                        <th className="text-right py-3 px-3 font-semibold">Rarity</th>
                        <th className="text-right py-3 px-3 font-semibold">Avg Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(results.combos).map(([name, data]) => (
                        <tr key={name} className="border-t border-slate-700/30 hover:bg-fuchsia-900/10 transition-colors">
                          <td className="py-2 px-3 text-slate-200 font-medium">{name}</td>
                          <td className="py-2 px-3 text-right text-slate-300">{data.occurrences}</td>
                          <td className="py-2 px-3 text-right text-slate-300">{data.rarity}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`font-semibold ${parseFloat(data.avgReturn) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {data.avgReturn}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Premium Empty State */}
        {!results && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">⚙️</div>
            <p className="text-slate-400 text-sm">
              Click "Run Optimization" to analyze indicator performance on {symbol} {timeframe}min
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
