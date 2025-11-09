import React from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function SatyPanel({ saty, trend }) {
  if (!saty || !saty.levels) return null
  const { pivot, atr, rangeUsed, levels } = saty
  const pct = atr ? (rangeUsed * 100).toFixed(0) : '—'
  const fmt = (n) => (n == null ? '—' : n.toFixed(2))
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">SATY ATR Levels <InfoPopover title="SATY ATR">Pivot is prior close; triggers at ±0.236 ATR, primary targets at ±1.0 ATR, extensions at ±1.618 ATR. Use with trend filter.</InfoPopover></h3>
        <div className="text-xs text-slate-400">Trend: <span className="text-slate-200">{trend}</span> · ATR14: <span className="text-slate-200">{fmt(atr)}</span> · Range: <span className="text-slate-200">{pct}%</span></div>
      </div>
      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-sm">
        <div><span className="text-slate-400">Pivot</span> <span className="text-slate-200">{fmt(pivot)}</span></div>
        <div><span className="text-slate-400">+0.236</span> <span className="text-slate-200">{fmt(levels.t0236.up)}</span></div>
        <div><span className="text-slate-400">-0.236</span> <span className="text-slate-200">{fmt(levels.t0236.dn)}</span></div>
        <div><span className="text-slate-400">+1.000</span> <span className="text-slate-200">{fmt(levels.t1000.up)}</span></div>
        <div><span className="text-slate-400">-1.000</span> <span className="text-slate-200">{fmt(levels.t1000.dn)}</span></div>
        <div><span className="text-slate-400">+1.618</span> <span className="text-slate-200">{fmt(levels.t1618.up)}</span></div>
        <div><span className="text-slate-400">-1.618</span> <span className="text-slate-200">{fmt(levels.t1618.dn)}</span></div>
      </div>
    </div>
  )
}
