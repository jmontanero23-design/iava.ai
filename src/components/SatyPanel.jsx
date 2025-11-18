import React from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function SatyPanel({ saty, trend }) {
  if (!saty || !saty.levels) return null
  const { pivot, atr, rangeUsed, levels } = saty
  const pct = atr ? (rangeUsed * 100).toFixed(0) : '—'
  const fmt = (n) => (n == null ? '—' : n.toFixed(2))

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-600 blur-lg opacity-50 animate-pulse" />
                <span className="relative text-2xl filter drop-shadow-lg">🎯</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-teal-200 to-cyan-300 bg-clip-text text-transparent">
                    SATY ATR Levels
                  </h3>
                  <InfoPopover title="SATY ATR">
                    Pivot is the prior close.{'\n\n'}
                    - Triggers: ±0.236 ATR (early momentum).{'\n'}
                    - Targets: ±1.0 ATR (primary), ±1.618 ATR (extensions).{'\n'}
                    - With trend: prefer direction of Ribbon/Ichimoku.{'\n'}
                    - Distance shown in SATY Targets and on-chart dock.
                  </InfoPopover>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>Trend: <span className="text-teal-300 font-semibold">{trend}</span></span>
                  <span>·</span>
                  <span>ATR₁₄: <span className="text-cyan-300 font-semibold">{fmt(atr)}</span></span>
                  <span>·</span>
                  <span>Range: <span className="text-blue-300 font-semibold">{pct}%</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Content */}
      <div className="p-5 space-y-4">
        {/* Pivot Section */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📍</span>
            <div className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">Pivot Point</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
              <div className="relative px-4 py-2 bg-slate-800/50 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
                <div className="text-xs text-slate-400 mb-1">Prior Close</div>
                <div className="text-lg font-bold text-cyan-300">${fmt(pivot)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Triggers Section */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-teal-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⚡</span>
            <div className="text-xs uppercase tracking-wider text-teal-300 font-semibold">Triggers (±0.236 ATR)</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Up Trigger */}
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
              <div className="relative p-3 bg-slate-800/50 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                <div className="text-xs text-slate-400 mb-1">Upside Trigger</div>
                <div className="text-base font-bold text-emerald-300">${fmt(levels.t0236.up)}</div>
              </div>
            </div>
            {/* Down Trigger */}
            <div className="relative group">
              <div className="absolute inset-0 bg-rose-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
              <div className="relative p-3 bg-slate-800/50 rounded-lg border border-rose-500/30 hover:border-rose-500/50 transition-all">
                <div className="text-xs text-slate-400 mb-1">Downside Trigger</div>
                <div className="text-base font-bold text-rose-300">${fmt(levels.t0236.dn)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Targets Section */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🎯</span>
            <div className="text-xs uppercase tracking-wider text-blue-300 font-semibold">Price Targets</div>
          </div>
          <div className="space-y-3">
            {/* Primary Targets (±1.0 ATR) */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Primary (±1.0 ATR)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                  <div className="relative p-3 bg-slate-800/50 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                    <div className="text-xs text-slate-400 mb-1">Upside Target</div>
                    <div className="text-base font-bold text-emerald-300">${fmt(levels.t1000.up)}</div>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-rose-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                  <div className="relative p-3 bg-slate-800/50 rounded-lg border border-rose-500/30 hover:border-rose-500/50 transition-all">
                    <div className="text-xs text-slate-400 mb-1">Downside Target</div>
                    <div className="text-base font-bold text-rose-300">${fmt(levels.t1000.dn)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Extension Targets (±1.618 ATR) */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Extensions (±1.618 ATR)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                  <div className="relative p-3 bg-slate-800/50 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                    <div className="text-xs text-slate-400 mb-1">Upside Extension</div>
                    <div className="text-base font-bold text-emerald-300">${fmt(levels.t1618.up)}</div>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-rose-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                  <div className="relative p-3 bg-slate-800/50 rounded-lg border border-rose-500/30 hover:border-rose-500/50 transition-all">
                    <div className="text-xs text-slate-400 mb-1">Downside Extension</div>
                    <div className="text-base font-bold text-rose-300">${fmt(levels.t1618.dn)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
