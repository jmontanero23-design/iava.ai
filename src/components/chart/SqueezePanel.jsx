import React, { useMemo } from 'react'
import InfoPopover from '../InfoPopover.jsx'
import { squeezeState } from '../../utils/indicators.js'

export default function SqueezePanel({ bars = [] }) {
  const period = 20
  const data = useMemo(() => {
    if (!Array.isArray(bars) || bars.length === 0) return null
    const close = bars.map(b => b.close)
    const high = bars.map(b => b.high)
    const low = bars.map(b => b.low)
    const st = squeezeState(close, high, low, period)
    const N = Math.min(bars.length, 180)
    const start = bars.length - N
    const mom = st.mom.slice(start)
    const sq = st.sq.slice(start)
    const sliceBars = bars.slice(start)
    const maxAbs = Math.max(...mom.map(v => Math.abs(v || 0)), 1e-6)
    return {
      mom,
      sq,
      bars: sliceBars,
      on: st.on,
      fired: st.fired,
      dir: st.dir,
      firedBarsAgo: st.firedBarsAgo,
      maxAbs,
    }
  }, [bars])

  const ready = !!(data && data.bars.length >= period)
  const width = 360
  const height = 84
  const mid = height / 2
  const step = data ? (width / Math.max(1, data.bars.length - 1)) : 1

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-200 inline-flex items-center gap-2">TTM Squeeze <InfoPopover title="TTM Squeeze">Red = squeeze ON (BB inside KC). First green after red = fire. The bars below are linear‑reg slope (momentum proxy).</InfoPopover></h3>
        <div className="text-xs text-slate-400">
          {!ready ? 'waiting for 20 bars…' : data.on ? 'ON' : data.fired ? `fired ${data.dir}` : (data.firedBarsAgo != null ? `fired ${data.firedBarsAgo} bars ago` : 'OFF')}
        </div>
      </div>
      <div className="h-28">
        {/* Robust SVG momentum histogram */}
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
          <line x1="0" y1={mid} x2={width} y2={mid} stroke="#334155" strokeWidth="1" />
          {ready && data.mom.map((v, i) => {
            if (v == null) return null
            const mag = Math.min(1, Math.abs(v) / (data.maxAbs || 1))
            const h = 2 + Math.round(mag * (mid - 6))
            const x = Math.round(i * step)
            const color = v >= 0 ? 'rgba(16,185,129,0.75)' : 'rgba(239,68,68,0.75)'
            const y1 = v >= 0 ? (mid - h) : mid
            const y2 = v >= 0 ? mid : (mid + h)
            return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth="2" />
          })}
        </svg>
        {/* Squeeze ON/OFF row */}
        <div className="mt-2 flex items-center gap-[1px] overflow-hidden">
          {ready && data.sq.map((on, i) => (
            <div key={i} className={`w-[2px] h-[6px] ${on===1 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          ))}
          {!ready && <div className="text-xs text-slate-500">No data yet. Load another timeframe or wait for enough bars.</div>}
        </div>
      </div>
    </div>
  )
}

