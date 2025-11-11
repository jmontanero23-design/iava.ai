import React from 'react'
import InfoPopover from './InfoPopover.jsx'

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
  const desc = {
    'EMA 8/21': 'Trend cloud for pullbacks; 8>21 bullish, 8<21 bearish.',
    'EMA 5/12': 'Faster cloud for intraday pullbacks/breakouts.',
    'EMA 8/9': 'Very fast momentum band; fade or continuation cues.',
    Ribbon: '8/21/34 color flip shows pivot/trend state.',
    Ichimoku: 'Cloud regime: above bull, below bear, inside neutral.',
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {chips.map((c, idx) => (
        <span
          key={idx}
          className="tile px-3 py-1.5 inline-flex items-center gap-2 border"
          style={{ borderColor: c.color + '40' }}
          title={c.title}
        >
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: c.color, boxShadow: `0 0 6px ${c.color}80` }}
          />
          <span className="text-xs text-slate-200 font-medium">{c.label}</span>
          {desc[c.label] ? <InfoPopover title={c.label}>{desc[c.label]}</InfoPopover> : null}
        </span>
      ))}
    </div>
  )
}
