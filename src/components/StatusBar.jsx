import React from 'react'

export default function StatusBar({ symbol, timeframe, bars, usingSample, updatedAt, stale, rateLimitUntil = 0 }) {
  const count = Array.isArray(bars) ? bars.length : 0
  const updated = updatedAt ? new Date(updatedAt).toLocaleTimeString() : ''
  let rateMsg = ''
  if (rateLimitUntil && rateLimitUntil > Date.now()) {
    const secs = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000))
    rateMsg = `Rate limit · wait ${secs}s`
  }

  // Check if data came from cache
  const fromCache = bars && bars.length > 0 && bars[0]?._fromCache
  const isStale = bars && bars.length > 0 && bars[0]?._stale

  const source = usingSample ? 'Sample' : fromCache ? 'Cached' : 'Live'
  const sourceIcon = usingSample ? '📋' : fromCache ? '💾' : '⚡'
  const freshness = stale || isStale ? 'Stale' : 'Fresh'
  const freshnessColor = stale || isStale ? 'text-amber-400' : 'text-emerald-400'
  const freshnessIcon = stale || isStale ? '⚠️' : '✅'

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {/* Symbol & Timeframe */}
      <div className="tile px-3 py-1">
        <span className="text-xs">
          <span className="text-slate-100 font-semibold">{symbol}</span>
          <span className="text-slate-400 mx-1">·</span>
          <span className="text-slate-300">{timeframe}</span>
        </span>
      </div>

      {/* Bar Count */}
      <div className="tile px-3 py-1">
        <span className="text-xs text-slate-400">
          <span className="text-slate-300 font-semibold">{count}</span> bars
        </span>
      </div>

      {/* Updated Time */}
      {updated && (
        <div className="tile px-3 py-1">
          <span className="text-xs text-slate-400">
            🕐 <span className="text-slate-300">{updated}</span>
          </span>
        </div>
      )}

      {/* Source */}
      <div className="tile px-3 py-1">
        <span className="text-xs text-slate-400">
          {sourceIcon} <span className="text-slate-300">{source}</span>
        </span>
      </div>

      {/* Freshness */}
      <div className="tile px-3 py-1">
        <span className="text-xs">
          {freshnessIcon} <span className={freshnessColor}>{freshness}</span>
        </span>
      </div>

      {/* Rate Limit Warning */}
      {rateMsg && (
        <div className="tile px-3 py-1 bg-amber-500/10 border-amber-500/30">
          <span className="text-xs text-amber-400">{rateMsg}</span>
        </div>
      )}
    </div>
  )
}
