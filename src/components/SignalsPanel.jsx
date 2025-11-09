import React from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function SignalsPanel({ state }) {
  if (!state) return null
  const rows = [
    { label: 'Pivot Ribbon', value: state.pivotNow },
    { label: 'Ripster 34/50', value: state.rip?.bias },
    { label: 'SATY Trigger', value: state.satyDir || 'none' },
    { label: 'Squeeze', value: state.sq?.on ? 'on' : (state.sq?.fired ? `fired ${state.sq?.dir}` : 'off') },
    { label: 'Ichimoku', value: state.ichiRegime },
  ]
  const scoreColor = state.score >= 70 ? 'text-emerald-400' : state.score >= 40 ? 'text-amber-400' : 'text-slate-300'
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Signal Snapshot <InfoPopover title="Signals">Snapshot of normalized states and the current Unicorn Score. Score is a weighted sum of independent components.</InfoPopover></h3>
        <div className={`text-sm font-semibold ${scoreColor}`}>Unicorn Score: {Math.round(state.score)}</div>
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
