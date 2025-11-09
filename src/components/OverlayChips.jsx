import React from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function OverlayChips({
  showEma821, setShowEma821,
  showEma512, setShowEma512,
  showEma89, setShowEma89,
  showEma3450, setShowEma3450,
  showIchi, setShowIchi,
  showRibbon, setShowRibbon,
  showSaty, setShowSaty,
}) {
  const chips = [
    { key: 'ema821', label: 'EMA 8/21', on: showEma821, toggle: () => setShowEma821(!showEma821), color: '#f59e0b' },
    { key: 'ema512', label: 'EMA 5/12', on: showEma512, toggle: () => setShowEma512(!showEma512), color: '#22d3ee' },
    { key: 'ema89', label: 'EMA 8/9', on: showEma89, toggle: () => setShowEma89(!showEma89), color: '#a78bfa' },
    { key: 'ema3450', label: 'EMA 34/50', on: showEma3450, toggle: () => setShowEma3450(!showEma3450), color: '#10b981' },
    { key: 'ribbon', label: 'Ribbon', on: showRibbon, toggle: () => setShowRibbon(!showRibbon), color: '#94a3b8' },
    { key: 'ichi', label: 'Ichimoku', on: showIchi, toggle: () => setShowIchi(!showIchi), color: '#60a5fa' },
    { key: 'saty', label: 'SATY', on: showSaty, toggle: () => setShowSaty(!showSaty), color: '#14b8a6' },
  ]
  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-400 inline-flex items-center gap-2">Quick Overlays <InfoPopover title="Quick Overlays">Toggle common overlays without scrolling. These switches mirror the main overlay controls.</InfoPopover></span>
      {chips.map(c => (
        <button
          key={c.key}
          onClick={c.toggle}
          className={`text-xs px-2 py-1 rounded-full border ${c.on ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
          title={c.label}
        >
          <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: c.color }} />
          {c.label}
        </button>
      ))}
    </div>
  )
}

