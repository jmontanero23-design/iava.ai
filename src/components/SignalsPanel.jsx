import React from 'react'

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
        <h3 className="text-sm font-semibold text-slate-200">Signal Snapshot</h3>
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
    </div>
  )
}

