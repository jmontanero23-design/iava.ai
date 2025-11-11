import React, { useMemo, useState } from 'react'
import { computeStates } from '../utils/indicators.js'
import InfoPopover from './InfoPopover.jsx'

export default function SignalsPanel({ state, bars = [] }) {
  const [aiExplain, setAiExplain] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!state) return null

  async function getAIExplanation() {
    setLoading(true)
    try {
      const r = await fetch('/api/llm/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, threshold: 70 })
      })
      const j = await r.json()
      if (r.ok) setAiExplain(j)
      else setAiExplain({ error: j?.error || 'Failed to get explanation' })
    } catch (e) {
      setAiExplain({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const spark = useMemo(() => {
    try {
      const N = Math.min(30, Math.max(0, bars.length))
      const start = bars.length - N
      const pts = []
      for (let i = start; i < bars.length; i++) {
        const slice = bars.slice(0, i + 1)
        const st = computeStates(slice)
        pts.push(st.score)
      }
      if (!pts.length) return null
      let min = Infinity, max = -Infinity
      for (const v of pts) { if (v < min) min = v; if (v > max) max = v }
      if (!isFinite(min) || !isFinite(max)) return null
      if (min === max) { min -= 1; max += 1 }
      const w = 120, h = 32, pad = 2
      const toX = (i) => pad + (i * (w - pad * 2)) / Math.max(1, pts.length - 1)
      const toY = (v) => pad + (h - pad * 2) * (1 - (v - min) / (max - min))
      const poly = pts.map((v, i) => `${Math.round(toX(i))},${Math.round(toY(v))}`).join(' ')
      return (
        <svg width={w} height={h} className="block">
          <polyline fill="none" stroke="#22c55e" strokeWidth="2" points={poly} />
        </svg>
      )
    } catch { return null }
  }, [bars])

  const rows = [
    { label: 'Pivot Ribbon', value: state.pivotNow, icon: '🎯' },
    { label: 'Ripster 34/50', value: state.rip?.bias, icon: '📊' },
    { label: 'SATY Trigger', value: state.satyDir || 'none', icon: '⚡' },
    { label: 'Squeeze', value: (state.sq?.on ? 'on' : (state.sq?.fired ? `fired ${state.sq?.dir}` : (state.sq?.firedBarsAgo != null ? `fired ${state.sq.firedBarsAgo} bars` : 'off'))), icon: '💥' },
    { label: 'Ichimoku', value: state.ichiRegime, icon: '☁️' },
    ...(state._daily ? [
      { label: 'Daily Pivot', value: state._daily.pivotNow, icon: '📅' },
      { label: 'Daily Ichimoku', value: state._daily.ichiRegime, icon: '🌤️' },
    ] : []),
  ]

  const scoreColor = state.score >= 70 ? 'text-emerald-400' : state.score >= 40 ? 'text-amber-400' : 'text-slate-300'

  return (
    <div className="space-y-4">
      {/* Header with Logo */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              Signal Snapshot
            </h3>
            <p className="text-xs text-slate-400">Indicator states and weighted Unicorn Score</p>
          </div>
          <InfoPopover title="Signal Snapshot">
            Shows each indicator state (trend, regime, volatility, structure) and the weighted Unicorn Score.
            Look for broad agreement + high score for quality setups.
          </InfoPopover>
        </div>

        {/* Unicorn Score Stat Tile */}
        <div className="stat-tile mb-4">
          <div className={`stat-icon bg-gradient-to-br ${state.score >= 70 ? 'from-emerald-500/20 to-emerald-600/20' : state.score >= 40 ? 'from-amber-500/20 to-amber-600/20' : 'from-slate-500/20 to-slate-600/20'}`}>
            <span className="text-2xl">🦄</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400">Unicorn Score</div>
            <div className={`text-3xl font-bold ${scoreColor}`}>{Math.round(state.score)}</div>
            {aiExplain?.confidence != null && (
              <div className="text-xs text-slate-500 mt-1">
                AI Confidence: <span className="text-indigo-400 font-semibold">{(aiExplain.confidence * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
          {spark && (
            <div className="flex flex-col items-end">
              <div className="text-xs text-slate-500 mb-1">Last 30 bars</div>
              {spark}
            </div>
          )}
        </div>

        {/* AI Explanation */}
        {aiExplain && !aiExplain.error && (
          <div className="card p-3 mb-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/30">
            <div className="panel-header mb-2">
              <span className="text-xs font-semibold text-indigo-300">AI Analysis</span>
              <span className="text-xs text-indigo-400 font-semibold">{(aiExplain.confidence * 100).toFixed(0)}% confident</span>
            </div>
            <p className="text-sm text-slate-200 mb-2">{aiExplain.explanation}</p>
            {aiExplain.highlights && aiExplain.highlights.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-slate-400 mb-1">Key Points:</div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {aiExplain.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {aiExplain?.error && (
          <div className="card p-3 mb-4 bg-rose-500/10 border-rose-500/30">
            <p className="text-sm text-rose-400">{aiExplain.error}</p>
          </div>
        )}

        {/* AI Explain Button */}
        <button
          onClick={getAIExplanation}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200"
        >
          {loading ? 'Analyzing...' : aiExplain ? 'Refresh AI Analysis' : 'Get AI Explanation'}
        </button>
      </div>

      {/* Signal States Grid */}
      <div className="card p-4">
        <div className="panel-header mb-3">
          <span className="text-sm font-semibold text-slate-200">Indicator States</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.label} className="tile p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.icon}</span>
                  <span className="text-xs text-slate-400">{r.label}</span>
                </div>
                <span className="text-sm text-slate-100 font-semibold">{r.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Contributions */}
      {state.components && (
        <div className="card p-4">
          <div className="panel-header mb-3">
            <span className="text-sm font-semibold text-slate-200">Score Contributions</span>
            <span className="text-xs text-slate-500">Points by indicator</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(state.components).map(([k, v]) => (
              <div key={k} className="tile p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{k}</span>
                  <span className={`text-sm font-bold ${v > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    +{v}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
