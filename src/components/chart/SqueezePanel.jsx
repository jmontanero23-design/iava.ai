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

  // Status configuration
  const statusConfig = data?.on
    ? { label: 'Squeeze ON', icon: '🔴', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' }
    : data?.fired
    ? { label: `Fired ${data.dir}`, icon: '💥', color: data.dir === 'long' ? 'text-emerald-400' : 'text-rose-400', bg: data.dir === 'long' ? 'bg-emerald-500/20' : 'bg-rose-500/20', border: data.dir === 'long' ? 'border-emerald-500/30' : 'border-rose-500/30' }
    : data?.firedBarsAgo != null
    ? { label: `Fired ${data.firedBarsAgo} bars ago`, icon: '⏱️', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' }
    : { label: 'OFF', icon: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }

  return (
    <div className="card p-4">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-violet-200 to-rose-200 bg-clip-text text-transparent">
              TTM Squeeze
            </h3>
            <p className="text-xs text-slate-400">Volatility contraction & expansion tracker</p>
          </div>
          <InfoPopover title="TTM Squeeze">
            Red = squeeze ON (BB inside KC). First green after red = fire. The bars below are linear-reg slope (momentum proxy).
          </InfoPopover>
        </div>
      </div>

      {/* Status Tile */}
      {ready && (
        <div className="mb-4">
          <div className={`stat-tile ${statusConfig.bg} ${statusConfig.border} border`}>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-2xl">{statusConfig.icon}</span>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Status</div>
                <div className={`text-sm font-bold ${statusConfig.color}`}>{statusConfig.label}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Momentum Histogram */}
      <div className="mb-3">
        <div className="text-xs text-slate-400 mb-2">Momentum Histogram (last 180 bars)</div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2">
          <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
            {/* Zero line */}
            <line x1="0" y1={mid} x2={width} y2={mid} stroke="#475569" strokeWidth="1" strokeDasharray="4,4" />

            {/* Momentum bars */}
            {ready && data.mom.map((v, i) => {
              if (v == null) return null
              const mag = Math.min(1, Math.abs(v) / (data.maxAbs || 1))
              const h = 2 + Math.round(mag * (mid - 6))
              const x = Math.round(i * step)
              const color = v >= 0 ? '#10b981' : '#ef4444'
              const y1 = v >= 0 ? (mid - h) : mid
              const y2 = v >= 0 ? mid : (mid + h)
              return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth="2" opacity="0.85" />
            })}
          </svg>
        </div>
      </div>

      {/* Squeeze ON/OFF Timeline */}
      <div>
        <div className="text-xs text-slate-400 mb-2">Squeeze Timeline</div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2">
          <div className="flex items-center gap-[1px] overflow-hidden">
            {ready && data.sq.map((on, i) => (
              <div
                key={i}
                className={`w-[2px] h-[8px] ${on === 1 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                title={on === 1 ? 'Squeeze ON' : 'Squeeze OFF'}
              />
            ))}
            {!ready && (
              <div className="text-xs text-slate-500 p-2">
                Waiting for {period} bars… Load more data or wait for market updates.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      {ready && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-rose-500 rounded-sm"></div>
            <span className="text-slate-400">Squeeze ON</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
            <span className="text-slate-400">Squeeze OFF</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-rose-500 rounded-sm"></div>
            <span className="text-slate-400">Momentum</span>
          </div>
        </div>
      )}
    </div>
  )
}
