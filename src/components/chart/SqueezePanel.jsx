import React, { useMemo } from 'react'
import InfoPopover from '../InfoPopover.jsx'
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
        <h3 className="text-sm font-medium text-slate-200 inline-flex items-center gap-2">TTM Squeeze <InfoPopover title="TTM Squeeze">Red dots = squeeze ON (BB inside KC). First green after red = squeeze fires. Histogram is a linear-reg slope proxy for momentum.</InfoPopover></h3>
        <div className="text-xs text-slate-400">red: squeeze ON • green: OFF</div>
      </div>
      <div className="h-28 overflow-hidden">
        {/* Momentum histogram with dynamic scaling*/}
        <div className="relative h-20">
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700" />
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {bars.map((b, i) => {
              const v = mom[i]
              if (v == null) return <div key={i} className="w-[2px] bg-transparent" />
              const window = mom.slice(Math.max(0, i - 100), i + 1)
              const max = Math.max(...window.map(x => Math.abs(x || 0)), 1e-6)
              const mag = Math.min(1, Math.abs(v) / max)
              const h = 2 + Math.round(mag * 38)
              const up = v >= 0
              const cls = up ? 'bg-emerald-500/70' : 'bg-rose-500/70'
              return <div key={i} className={`w-[2px] ${cls}`} style={{ height: h }} />
            })}
          </div>
        </div>
        {/* Squeeze dots row */}
        <div className="mt-2 flex gap-[4px] items-center">
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
