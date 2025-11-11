import React from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function SatyPanel({ saty, trend }) {
  if (!saty || !saty.levels) return null
  const { pivot, atr, rangeUsed, levels } = saty
  const pct = atr ? (rangeUsed * 100).toFixed(0) : '—'
  const fmt = (n) => (n == null ? '—' : n.toFixed(2))

  const trendConfig = {
    bullish: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: '📈' },
    bearish: { color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30', icon: '📉' },
    neutral: { color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30', icon: '➖' },
  }
  const trendStyle = trendConfig[trend] || trendConfig.neutral

  return (
    <div className="card p-4">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-amber-200 to-emerald-200 bg-clip-text text-transparent">
              SATY ATR Levels
            </h3>
            <p className="text-xs text-slate-400">Pivot-based support/resistance zones</p>
          </div>
          <InfoPopover title="SATY ATR">
            Pivot is the prior close.
            {'\n\n'}
            - Triggers: ±0.236 ATR (early momentum).
            {'\n'}
            - Targets: ±1.0 ATR (primary), ±1.618 ATR (extensions).
            {'\n'}
            - With trend: prefer direction of Ribbon/Ichimoku.
            {'\n'}
            - Distance shown in SATY Targets and on-chart dock.
          </InfoPopover>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Trend */}
        <div className={`stat-tile ${trendStyle.bg} ${trendStyle.border} border`}>
          <div className="stat-icon bg-gradient-to-br from-slate-500/20 to-slate-600/20">
            <span className="text-lg">{trendStyle.icon}</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">Trend</div>
            <div className={`stat-value text-xs ${trendStyle.color}`}>{trend || 'neutral'}</div>
          </div>
        </div>

        {/* ATR */}
        <div className="stat-tile">
          <div className="stat-icon bg-gradient-to-br from-violet-500/20 to-violet-600/20">
            <span className="text-lg">📊</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">ATR₁₄</div>
            <div className="stat-value text-xs text-violet-400">{fmt(atr)}</div>
          </div>
        </div>

        {/* Range Used */}
        <div className="stat-tile">
          <div className="stat-icon bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
            <span className="text-lg">📏</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">Range</div>
            <div className="stat-value text-xs text-cyan-400">{pct}%</div>
          </div>
        </div>
      </div>

      {/* Pivot */}
      <div className="mb-3">
        <div className="text-xs text-slate-400 mb-2">Pivot Point</div>
        <div className="stat-tile bg-indigo-500/5 border-indigo-500/20 border">
          <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
            <span className="text-lg">🎯</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">Prior Close</div>
            <div className="stat-value text-sm text-indigo-300">{fmt(pivot)}</div>
          </div>
        </div>
      </div>

      {/* Trigger Levels */}
      <div className="mb-3">
        <div className="text-xs text-slate-400 mb-2">Trigger Levels (±0.236 ATR)</div>
        <div className="grid grid-cols-2 gap-3">
          {/* Up Trigger */}
          <div className="stat-tile bg-emerald-500/5 border-emerald-500/20 border">
            <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
              <span className="text-lg">⬆️</span>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-emerald-400">+0.236</div>
              <div className="stat-value text-sm text-emerald-300">{fmt(levels.t0236.up)}</div>
            </div>
          </div>

          {/* Down Trigger */}
          <div className="stat-tile bg-rose-500/5 border-rose-500/20 border">
            <div className="stat-icon bg-gradient-to-br from-rose-500/20 to-rose-600/20">
              <span className="text-lg">⬇️</span>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-rose-400">-0.236</div>
              <div className="stat-value text-sm text-rose-300">{fmt(levels.t0236.dn)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Targets */}
      <div className="mb-3">
        <div className="text-xs text-slate-400 mb-2">Primary Targets (±1.0 ATR)</div>
        <div className="grid grid-cols-2 gap-3">
          {/* Up Target */}
          <div className="stat-tile bg-emerald-500/5 border-emerald-500/20 border">
            <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
              <span className="text-lg">🎯</span>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-emerald-400">+1.000</div>
              <div className="stat-value text-sm text-emerald-300">{fmt(levels.t1000.up)}</div>
            </div>
          </div>

          {/* Down Target */}
          <div className="stat-tile bg-rose-500/5 border-rose-500/20 border">
            <div className="stat-icon bg-gradient-to-br from-rose-500/20 to-rose-600/20">
              <span className="text-lg">🎯</span>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-rose-400">-1.000</div>
              <div className="stat-value text-sm text-rose-300">{fmt(levels.t1000.dn)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Extension Targets */}
      <div>
        <div className="text-xs text-slate-400 mb-2">Extension Targets (±1.618 ATR)</div>
        <div className="grid grid-cols-2 gap-3">
          {/* Up Extension */}
          <div className="stat-tile bg-emerald-500/5 border-emerald-500/20 border">
            <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
              <span className="text-lg">🚀</span>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-emerald-400">+1.618</div>
              <div className="stat-value text-sm text-emerald-300">{fmt(levels.t1618.up)}</div>
            </div>
          </div>

          {/* Down Extension */}
          <div className="stat-tile bg-rose-500/5 border-rose-500/20 border">
            <div className="stat-icon bg-gradient-to-br from-rose-500/20 to-rose-600/20">
              <span className="text-lg">🚀</span>
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-rose-400">-1.618</div>
              <div className="stat-value text-sm text-rose-300">{fmt(levels.t1618.dn)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
