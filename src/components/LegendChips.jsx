import React from 'react'

export default function LegendChips({ overlays }) {
  const chips = []
  if (Array.isArray(overlays?.emaClouds)) {
    overlays.emaClouds.forEach(c => {
      chips.push({ label: `EMA ${c.key}`, color: c.color || '#f59e0b', title: `EMA Cloud ${c.key}: dynamic trend zone` })
    })
  }
  if (overlays?.ribbon?.state) {
    const arr = overlays.ribbon.state
    const st = arr && arr.length ? arr[arr.length - 1] : 'neutral'
    chips.push({ label: `Ribbon ${st}`, color: st === 'bullish' ? '#10b981' : st === 'bearish' ? '#ef4444' : '#94a3b8', title: 'Pivot Ribbon 8/21/34 trend state' })
  }
  if (overlays?.ichimoku) {
    // high-level regime is computed in App via signalState.ichiRegime, but we hint presence here
    chips.push({ label: 'Ichimoku', color: '#60a5fa', title: 'Ichimoku Cloud overlay' })
  }
  if (!chips.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {chips.map((c, idx) => (
        <span key={idx} className="text-xs px-2 py-1 rounded-full border border-slate-700" style={{ background: 'rgba(2,6,23,0.6)' }} title={c.title}>
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: c.color }} />
          <span className="text-slate-200">{c.label}</span>
        </span>
      ))}
    </div>
  )
}
