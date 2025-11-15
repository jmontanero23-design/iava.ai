import React, { useMemo, useState } from 'react'
import { computeStates } from '../utils/indicators.js'
import InfoPopover from './InfoPopover.jsx'

export default function SignalsPanel({ state, bars = [], symbol = '', onRefresh, onClear }) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!state) return null

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setTimeout(() => setIsRefreshing(false), 500)
      }
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
      const w = 120, h = 28, pad = 2
      const toX = (i) => pad + (i * (w - pad * 2)) / Math.max(1, pts.length - 1)
      const toY = (v) => pad + (h - pad * 2) * (1 - (v - min) / (max - min))
      const poly = pts.map((v, i) => `${Math.round(toX(i))},${Math.round(toY(v))}`).join(' ')
      const strokeColor = state.score >= 70 ? '#10b981' : state.score >= 40 ? '#f59e0b' : '#64748b'
      return (
        <svg width={w} height={h} className="block ml-2">
          <defs>
            <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="1" />
            </linearGradient>
          </defs>
          <polyline fill="none" stroke="url(#sparkGradient)" strokeWidth="2.5" points={poly} className="drop-shadow-lg" />
        </svg>
      )
    } catch { return null }
  }, [bars, state.score])
  const rows = [
    { label: 'Pivot Ribbon', value: state.pivotNow },
    { label: 'Ripster 34/50', value: state.rip?.bias },
    { label: 'SATY Trigger', value: state.satyDir || 'none' },
    { label: 'Squeeze', value: (state.sq?.on ? 'on' : (state.sq?.fired ? `fired ${state.sq?.dir}` : (state.sq?.firedBarsAgo != null ? `fired ${state.sq.firedBarsAgo} bars` : 'off'))) },
    { label: 'Ichimoku', value: state.ichiRegime },
    ...(state._daily ? [
      { label: 'Daily Pivot', value: state._daily.pivotNow },
      { label: 'Daily Ichimoku', value: state._daily.ichiRegime },
    ] : []),
  ]
  const scoreColor = state.score >= 70 ? 'text-emerald-400' : state.score >= 40 ? 'text-amber-400' : 'text-slate-300'
  const glowColor = state.score >= 70 ? 'bg-emerald-600' : state.score >= 40 ? 'bg-amber-600' : 'bg-slate-600'

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Icon with glow */}
              <div className="relative">
                <div className={`absolute inset-0 ${glowColor} blur-lg opacity-50 animate-pulse`} />
                <span className="relative text-2xl filter drop-shadow-lg">📊</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text text-transparent inline-flex items-center gap-2">
                Signal Snapshot
                <InfoPopover title="Signals">Signal Snapshot shows each indicator state (trend, regime, volatility, structure) and the weighted Unicorn Score. Look for broad agreement + high score.</InfoPopover>
              </h3>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="relative group px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden disabled:opacity-50"
                  title="Refresh signals"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                  <span className="relative text-white flex items-center gap-1.5">
                    <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </span>
                </button>
              )}
              {onClear && (
                <button
                  onClick={onClear}
                  className="relative group px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden"
                  title="Clear signals"
                >
                  <div className="absolute inset-0 bg-slate-700 group-hover:bg-slate-600 transition-all" />
                  <span className="relative text-slate-300 group-hover:text-white flex items-center gap-1.5">
                    <span>✕</span>
                    Clear
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Symbol & Score Display */}
          <div className="flex items-center justify-between mt-3">
            {symbol && (
              <div className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">{symbol}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className={`text-base font-bold ${scoreColor}`}>
                Unicorn Score: {Math.round(state.score)}
              </div>
              {spark}
            </div>
          </div>
        </div>
      </div>
      {/* Premium Indicator Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <div key={r.label} className="relative group">
            <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-0 group-hover:opacity-5 rounded-lg transition-opacity" />
            <div className="relative flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-indigo-500/30 transition-all">
              <span className="text-sm text-slate-400 font-medium">{r.label}</span>
              <span className="text-sm text-slate-200 font-semibold break-words text-right max-w-[9rem]">
                {r.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Contributions Section */}
      {state.components && (
        <div className="p-5 pt-0">
          <div className="p-4 bg-slate-800/20 rounded-xl border border-slate-700/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Score Contributions</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(state.components).map(([k,v]) => (
                <div key={k} className="relative group">
                  <div className="absolute inset-0 bg-purple-600 blur-lg opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                  <div className="relative px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/40 transition-all">
                    <span className="text-xs text-slate-400">{k}:</span>
                    <span className="text-xs text-slate-200 font-semibold ml-1">{v}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium AI Button */}
            <div className="mt-4 pt-3 border-t border-slate-700/30">
              <button
                onClick={() => { try { window.dispatchEvent(new CustomEvent('iava.help', { detail: { question: 'Explain my current Unicorn Score and main contributors.', context: { score: state.score, components: state.components, pivot: state.pivotNow, satyDir: state.satyDir, ichimoku: state.ichiRegime } } })) } catch {} }}
                className="relative group w-full px-4 py-2 rounded-lg text-xs font-semibold overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <span className="relative text-white flex items-center justify-center gap-2">
                  <span>🤖</span>
                  <span>Ask AI about this score</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
