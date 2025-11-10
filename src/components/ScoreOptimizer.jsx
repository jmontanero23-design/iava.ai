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
    // Force re-render by updating a dummy state
    setTimeout(() => window.location.reload(), 500)
  }

  function resetToDefaults() {
    resetWeights()
    setApplied(false)
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">
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
        <div className="flex items-center gap-2">
          <button
            onClick={runOptimization}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-500 rounded px-3 py-1 text-xs disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Optimization'}
          </button>
          {results && (
            <>
              <button
                onClick={applyRecommendedWeights}
                disabled={applied}
                className="bg-emerald-600 hover:bg-emerald-500 rounded px-3 py-1 text-xs disabled:opacity-50"
              >
                {applied ? 'Applied ✓' : 'Apply Weights'}
              </button>
              <button
                onClick={resetToDefaults}
                className="bg-slate-700 hover:bg-slate-600 rounded px-3 py-1 text-xs"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-900/20 border border-rose-500/50 rounded p-3 mb-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
            <div className="text-xs text-slate-400 mb-1">Analysis Summary</div>
            <div className="text-sm text-slate-200">
              <div>Symbol: <span className="text-emerald-400">{results.symbol}</span></div>
              <div>Timeframe: <span className="text-emerald-400">{results.timeframe}min</span></div>
              <div>Bars Analyzed: <span className="text-emerald-400">{results.bars}</span></div>
              <div>Best Performer: <span className="text-emerald-400">{results.summary?.bestPerformer}</span></div>
            </div>
            <div className="text-xs text-slate-400 mt-2">{results.summary?.message}</div>
          </div>

          {/* Current Weights */}
          <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
            <div className="text-xs text-slate-400 mb-2">Current Weights</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(UNICORN_WEIGHTS).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-300">{key}:</span>
                  <span className="text-slate-100 font-mono">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Indicator Performance */}
          <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
            <div className="text-xs text-slate-400 mb-2">Individual Indicator Performance</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-1 px-2">Indicator</th>
                    <th className="text-right py-1 px-2">Occurrences</th>
                    <th className="text-right py-1 px-2">Rarity</th>
                    <th className="text-right py-1 px-2">Avg Return</th>
                    <th className="text-right py-1 px-2">Bull Return</th>
                    <th className="text-right py-1 px-2">Bear Return</th>
                    <th className="text-right py-1 px-2">Recommended</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results.individual || {}).map(([name, data]) => (
                    <tr key={name} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-1 px-2 text-slate-200">{name}</td>
                      <td className="py-1 px-2 text-right text-slate-300">{data.occurrences}</td>
                      <td className="py-1 px-2 text-right text-slate-300">{data.rarity || '—'}</td>
                      <td className="py-1 px-2 text-right text-slate-300">
                        {data.avgReturn ? (
                          <span className={parseFloat(data.avgReturn) > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {data.avgReturn}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-1 px-2 text-right text-slate-300">{data.bullReturn || '—'}</td>
                      <td className="py-1 px-2 text-right text-slate-300">{data.bearReturn || '—'}</td>
                      <td className="py-1 px-2 text-right">
                        {data.recommendedWeight != null ? (
                          <span className="text-violet-400 font-semibold">{data.recommendedWeight}</span>
                        ) : (
                          <span className="text-slate-500 text-xs">{data.note}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Combo Performance */}
          {results.combos && Object.keys(results.combos).length > 0 && (
            <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2">2-Indicator Combinations</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-1 px-2">Combo</th>
                      <th className="text-right py-1 px-2">Occurrences</th>
                      <th className="text-right py-1 px-2">Rarity</th>
                      <th className="text-right py-1 px-2">Avg Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.combos).map(([name, data]) => (
                      <tr key={name} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-1 px-2 text-slate-200">{name}</td>
                        <td className="py-1 px-2 text-right text-slate-300">{data.occurrences}</td>
                        <td className="py-1 px-2 text-right text-slate-300">{data.rarity}</td>
                        <td className="py-1 px-2 text-right">
                          <span className={parseFloat(data.avgReturn) > 0 ? 'text-emerald-400' : 'text-rose-400'}>
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

      {!results && !loading && (
        <div className="text-center py-6 text-slate-400 text-sm">
          Click "Run Optimization" to analyze indicator performance on {symbol} {timeframe}min
        </div>
      )}
    </div>
  )
}
