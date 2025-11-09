import React from 'react'

export default function StatusBar({ symbol, timeframe, bars, usingSample, updatedAt }) {
  const count = Array.isArray(bars) ? bars.length : 0
  const updated = updatedAt ? new Date(updatedAt).toLocaleTimeString() : ''
  return (
    <div className="text-xs text-slate-400 flex items-center gap-3 mt-2">
      <span><span className="text-slate-300">{symbol}</span> · {timeframe}</span>
      <span>Bars: {count}</span>
      {updated && <span>Updated: {updated}</span>}
      <span>Source: {usingSample ? 'Sample' : 'Live'}</span>
    </div>
  )
}

