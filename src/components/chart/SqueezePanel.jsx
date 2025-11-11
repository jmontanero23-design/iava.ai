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
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-600 blur-lg opacity-50 animate-pulse" />
                <span className="relative text-2xl filter drop-shadow-lg">💥</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-violet-200 to-purple-300 bg-clip-text text-transparent">
                    TTM Squeeze
                  </h3>
                  <InfoPopover title="TTM Squeeze">
                    Red = squeeze ON (BB inside KC). First green after red = fire. The bars below are linear‑reg slope (momentum proxy).
                  </InfoPopover>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Momentum compression & breakout detector
                </div>
              </div>
            </div>

            {/* Premium Status Badge */}
            <div className="relative">
              {!ready ? (
                <div className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/30 text-slate-400 text-xs font-semibold">
                  Waiting for 20 bars…
                </div>
              ) : data.on ? (
                <div className="relative group">
                  <div className="absolute inset-0 bg-rose-500 blur-lg opacity-30 rounded-full" />
                  <div className="relative px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                    Squeeze ON
                  </div>
                </div>
              ) : data.fired ? (
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-30 rounded-full" />
                  <div className="relative px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                    <span className="text-base">🚀</span>
                    Fired {data.dir}
                  </div>
                </div>
              ) : data.firedBarsAgo != null ? (
                <div className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/30 text-slate-300 text-xs font-semibold">
                  Fired {data.firedBarsAgo} bars ago
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/30 text-slate-400 text-xs font-semibold">
                  Squeeze OFF
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Content */}
      <div className="p-5">
        <div className="p-4 bg-slate-800/30 rounded-xl border border-violet-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📊</span>
            <div className="text-xs uppercase tracking-wider text-violet-300 font-semibold">Momentum Histogram</div>
          </div>

          <div className="h-28 bg-slate-900/50 rounded-lg p-2">
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

            {/* Squeeze ON/OFF indicator row */}
            <div className="mt-2 flex items-center gap-[1px] overflow-hidden rounded">
              {ready && data.sq.map((on, i) => (
                <div key={i} className={`w-[2px] h-[6px] ${on===1 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              ))}
              {!ready && (
                <div className="text-xs text-slate-500 text-center py-2">
                  No data yet. Load another timeframe or wait for enough bars.
                </div>
              )}
            </div>
          </div>

          {/* Premium Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-rose-500 rounded-full" />
              <span className="text-slate-400">Squeeze ON</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-slate-400">Squeeze OFF</span>
            </div>
            <div className="h-3 w-px bg-slate-700 mx-1" />
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-emerald-500/75 rounded-sm" />
              <span className="text-slate-400">Bullish Momentum</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-rose-500/75 rounded-sm" />
              <span className="text-slate-400">Bearish Momentum</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

