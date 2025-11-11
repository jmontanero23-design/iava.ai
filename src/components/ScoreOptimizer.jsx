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
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-violet-200 to-emerald-200 bg-clip-text text-transparent">
              Score Optimization
            </h3>
            <p className="text-xs text-slate-400">Data-driven analysis to recommend optimal Unicorn Score weights</p>
          </div>
          <InfoPopover title="Data-Driven Weights">
            Analyzes historical data to find the best-performing indicator combinations.
            Recommends weights based on:
            <br/>• <strong>Quality</strong>: Avg forward return when signal triggers
            <br/>• <strong>Rarity</strong>: How often the signal appears (rarer = higher weight)
            <br/>• <strong>Regime-Fit</strong>: Performance in bull vs bear markets
            <br/><br/>
            Click "Run Optimization" to analyze {symbol} on {timeframe}min data.
          </InfoPopover>
          <div className="flex items-center gap-2">
            <button
              onClick={runOptimization}
              disabled={loading}
              className="btn btn-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Optimization'}
            </button>
            {results && (
              <>
                <button
                  onClick={applyRecommendedWeights}
                  disabled={applied}
                  className="btn btn-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                >
                  {applied ? 'Applied ✓' : 'Apply Weights'}
                </button>
                <button
                  onClick={resetToDefaults}
                  className="btn btn-sm bg-slate-700 hover:bg-slate-600"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="card p-3 bg-rose-500/10 border-rose-500/30">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-4 mt-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="stat-tile">
                <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
                  <span className="text-lg">📊</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Symbol</div>
                  <div className="stat-value text-sm text-indigo-400">{results.symbol}</div>
                </div>
              </div>
              <div className="stat-tile">
                <div className="stat-icon bg-gradient-to-br from-violet-500/20 to-violet-600/20">
                  <span className="text-lg">⏱️</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Timeframe</div>
                  <div className="stat-value text-sm text-violet-400">{results.timeframe}min</div>
                </div>
              </div>
              <div className="stat-tile">
                <div className="stat-icon bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
                  <span className="text-lg">📈</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Bars Analyzed</div>
                  <div className="stat-value text-sm text-cyan-400">{results.bars}</div>
                </div>
              </div>
              <div className="stat-tile">
                <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
                  <span className="text-lg">🏆</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Best Performer</div>
                  <div className="stat-value text-sm text-emerald-400">{results.summary?.bestPerformer || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Summary Message */}
            {results.summary?.message && (
              <div className="card p-3 bg-indigo-500/10 border-indigo-500/30">
                <p className="text-sm text-indigo-300">{results.summary.message}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Weights */}
      {results && (
        <div className="card p-4">
          <div className="panel-header mb-3">
            <span className="text-sm font-semibold text-slate-200">Current Weights</span>
            <span className="text-xs text-slate-500">(Active configuration)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(UNICORN_WEIGHTS).map(([key, val]) => (
              <div key={key} className="tile p-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{key}</span>
                  <span className="text-slate-100 font-mono font-semibold">{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Indicator Performance */}
      {results && (
        <div className="card p-4">
          <div className="panel-header mb-3">
            <span className="text-sm font-semibold text-slate-200">Individual Indicator Performance</span>
            <span className="text-xs text-slate-500">(Quality, Rarity & Regime Analysis)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/80 sticky top-0 backdrop-blur-sm">
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold">Indicator</th>
                  <th className="text-right py-3 px-4 font-semibold">Occurrences</th>
                  <th className="text-right py-3 px-4 font-semibold">Rarity</th>
                  <th className="text-right py-3 px-4 font-semibold">Avg Return</th>
                  <th className="text-right py-3 px-4 font-semibold">Bull Return</th>
                  <th className="text-right py-3 px-4 font-semibold">Bear Return</th>
                  <th className="text-right py-3 px-4 font-semibold">Recommended</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(results.individual || {}).map(([name, data]) => (
                  <tr key={name} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-100 font-medium">{name}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{data.occurrences}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{data.rarity || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      {data.avgReturn ? (
                        <span className={`font-semibold ${parseFloat(data.avgReturn) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {data.avgReturn}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">{data.bullReturn || '—'}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{data.bearReturn || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      {data.recommendedWeight != null ? (
                        <span className="inline-flex px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 font-bold">
                          {data.recommendedWeight}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs italic">{data.note}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Combo Performance */}
      {results && results.combos && Object.keys(results.combos).length > 0 && (
        <div className="card p-4">
          <div className="panel-header mb-3">
            <span className="text-sm font-semibold text-slate-200">2-Indicator Combinations</span>
            <span className="text-xs text-slate-500">(Synergistic patterns)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/80 sticky top-0 backdrop-blur-sm">
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold">Combo</th>
                  <th className="text-right py-3 px-4 font-semibold">Occurrences</th>
                  <th className="text-right py-3 px-4 font-semibold">Rarity</th>
                  <th className="text-right py-3 px-4 font-semibold">Avg Return</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(results.combos).map(([name, data]) => (
                  <tr key={name} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-100 font-medium">{name}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{data.occurrences}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{data.rarity}</td>
                    <td className="py-3 px-4 text-right">
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

      {/* Empty State */}
      {!results && !loading && (
        <div className="card p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h4 className="text-slate-300 font-semibold mb-2">Ready to Optimize</h4>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Click "Run Optimization" to analyze indicator performance on <span className="text-emerald-400 font-semibold">{symbol}</span> using <span className="text-indigo-400 font-semibold">{timeframe}min</span> data
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
