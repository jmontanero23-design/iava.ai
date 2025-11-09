import React, { useMemo } from 'react'
import { linregMomentum, ttmSqueeze } from '../../utils/indicators.js'

export default function SqueezePanel({ bars = [] }) {
  const { mom, sq } = useMemo(() => {
    const close = bars.map(b => b.close)
    const high = bars.map(b => b.high)
    const low = bars.map(b => b.low)
    const mom = linregMomentum(close, 20)
    const sq = ttmSqueeze(close, high, low, 20, 2, 1.5)
    return { mom, sq }
  }, [bars])

  // Render a compact histogram with squeeze dots
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-200">TTM Squeeze (approx)</h3>
        <div className="text-xs text-slate-400">red: squeeze ON • green: OFF</div>
      </div>
      <div className="h-24 overflow-hidden">
        <div className="flex gap-[2px] items-end h-16">
          {bars.map((b, i) => {
            const v = mom[i]
            if (v == null) return <div key={i} className="w-[2px] bg-transparent" />
            const mag = Math.min(1, Math.abs(v) / 0.5) // scale
            const h = 4 + Math.round(mag * 44)
            const up = v >= 0
            const cls = up ? 'bg-emerald-500/70' : 'bg-rose-500/70'
            return <div key={i} className={`w-[2px] ${cls}`} style={{ height: h }} />
          })}
        </div>
        <div className="mt-2 flex gap-[4px]">
          {bars.map((b, i) => {
            const on = sq[i] === 1
            const cls = on ? 'bg-rose-500' : 'bg-emerald-500'
            return <div key={i} className={`w-1 h-1 rounded-full ${cls}`} />
          })}
        </div>
      </div>
    </div>
  )
}

