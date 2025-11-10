import React, { useMemo } from 'react'
import { computeStates } from '../utils/indicators.js'
import InfoPopover from './InfoPopover.jsx'

export default function SignalsPanel({ state, bars = [] }) {
  if (!state) return null
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
      return (
        <svg width={w} height={h} className="block ml-2">
          <polyline fill="none" stroke="#22c55e" strokeWidth="2" points={poly} />
        </svg>
      )
    } catch { return null }
  }, [bars])
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
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Signal Snapshot <InfoPopover title="Signals">Signal Snapshot shows each indicator state (trend, regime, volatility, structure) and the weighted Unicorn Score. Look for broad agreement + high score.</InfoPopover></h3>
        <div className="flex items-center">
          <div className={`text-sm font-semibold ${scoreColor}`}>Unicorn Score: {Math.round(state.score)}</div>
          {spark}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <span className="text-slate-400">{r.label}</span>
            <span className="text-slate-200">{r.value}</span>
          </div>
        ))}
      </div>
      {state.components && (
        <div className="mt-3">
          <div className="text-xs text-slate-400 mb-1">Contributions</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(state.components).map(([k,v]) => (
              <span key={k} className="px-2 py-1 rounded border border-slate-800" style={{ background:'rgba(2,6,23,0.6)'}}>{k}: <span className="text-slate-200">{v}</span></span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
