import React from 'react'

export default function StatusBar({ symbol, timeframe, bars, usingSample, updatedAt, stale, rateLimitUntil = 0 }) {
  const count = Array.isArray(bars) ? bars.length : 0
  const updated = updatedAt ? new Date(updatedAt).toLocaleTimeString() : ''
  let rateMsg = ''
  if (rateLimitUntil && rateLimitUntil > Date.now()) {
    const secs = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000))
    rateMsg = `Rate limit · wait ${secs}s`
  }
  return (
    <div className="text-xs text-slate-400 flex items-center gap-3 mt-2">
      <span><span className="text-slate-300">{symbol}</span> · {timeframe}</span>
      <span>Bars: {count}</span>
      {updated && <span>Updated: {updated}</span>}
      <span>Source: {usingSample ? 'Sample' : 'Live'}</span>
      {stale ? <span className="text-amber-400">Stale</span> : <span className="text-emerald-400">Fresh</span>}
      {rateMsg ? <span className="text-amber-400">{rateMsg}</span> : null}
    </div>
  )
}
