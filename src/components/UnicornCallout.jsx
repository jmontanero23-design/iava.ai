import React from 'react'

export default function UnicornCallout({ state, threshold = 70 }) {
  if (!state || state.score == null || state.score < threshold) return null
  const facts = []
  if (state.pivotNow) facts.push(`Pivot: ${state.pivotNow}`)
  if (state.rip?.bias) facts.push(`34/50: ${state.rip.bias}`)
  if (state.satyDir) facts.push(`SATY: ${state.satyDir}`)
  if (state.sq?.fired) facts.push(`Squeeze: fired ${state.sq.dir}`)
  if (state.ichiRegime) facts.push(`Ichimoku: ${state.ichiRegime}`)
  return (
    <div className="card p-4 border-emerald-700/60" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-emerald-300">Unicorn Signal</h3>
        <div className="text-sm font-bold text-emerald-400">Score: {Math.round(state.score)}</div>
      </div>
      <div className="mt-2 text-sm text-slate-200">
        <ul className="list-disc pl-5">
          {facts.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      </div>
    </div>
  )
}

