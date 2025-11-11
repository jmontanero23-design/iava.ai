import React, { useMemo } from 'react'

export default function SatyTargets({ saty, last }) {
  const data = useMemo(() => {
    if (!saty?.levels || !last) return null
    const { atr, levels } = saty
    const price = last.close
    const entries = [
      { key: '+0.236', value: levels.t0236.up },
      { key: '-0.236', value: levels.t0236.dn },
      { key: '+1.000', value: levels.t1000.up },
      { key: '-1.000', value: levels.t1000.dn },
      { key: '+1.618', value: levels.t1618.up },
      { key: '-1.618', value: levels.t1618.dn },
    ]
    const rows = entries.map(e => {
      const diff = e.value != null ? (e.value - price) : null
      const abs = diff != null ? Math.abs(diff) : null
      const inAtr = abs != null && atr ? abs / atr : null
      return { label: e.key, target: e.value, diff, abs, inAtr }
    }).filter(r => r.target != null)
    const up = rows.filter(r => r.diff > 0).sort((a, b) => a.diff - b.diff)[0] || null
    const dn = rows.filter(r => r.diff < 0).sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0] || null
    return { price, atr, nextUp: up, nextDown: dn, rows }
  }, [saty, last])

  if (!data) return null
  const fmt = (n, d = 2) => (n == null ? '—' : Number(n).toFixed(d))

  return (
    <div className="card p-4">
      {/* Header with Logo */}
      <div className="flex items-center gap-3 mb-4">
        <span className="logo-badge">
          <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-amber-200 to-cyan-200 bg-clip-text text-transparent">
            SATY Targets
          </h3>
          <p className="text-xs text-slate-400">Nearest support & resistance zones</p>
        </div>
      </div>

      {/* Current Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Current Price */}
        <div className="stat-tile">
          <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
            <span className="text-lg">💵</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">Current Price</div>
            <div className="stat-value text-sm text-indigo-300">${fmt(data.price)}</div>
          </div>
        </div>

        {/* ATR */}
        <div className="stat-tile">
          <div className="stat-icon bg-gradient-to-br from-violet-500/20 to-violet-600/20">
            <span className="text-lg">📊</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">ATR₁₄</div>
            <div className="stat-value text-sm text-violet-400">{fmt(data.atr)}</div>
          </div>
        </div>
      </div>

      {/* Next Target Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Next Up Target */}
        <div className="card p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⬆️</span>
            <div className="text-xs text-emerald-300 font-semibold">Next Up Target</div>
          </div>
          {data.nextUp ? (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xs text-emerald-400 font-semibold">{data.nextUp.label}</span>
                <span className="text-2xl font-bold text-emerald-300">${fmt(data.nextUp.target)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 bg-emerald-500/20 border border-emerald-500/30 rounded px-2 py-1">
                  <span className="text-emerald-400">+${fmt(data.nextUp.abs)}</span>
                </div>
                <div className="flex-1 bg-emerald-500/20 border border-emerald-500/30 rounded px-2 py-1">
                  <span className="text-emerald-400">{fmt(data.nextUp.inAtr, 2)} ATR</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-2 bg-slate-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((data.nextUp.inAtr || 0) / 1.618) * 100)}%` }}
                ></div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-500">No upside target available</div>
          )}
        </div>

        {/* Next Down Target */}
        <div className="card p-3 bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⬇️</span>
            <div className="text-xs text-rose-300 font-semibold">Next Down Target</div>
          </div>
          {data.nextDown ? (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xs text-rose-400 font-semibold">{data.nextDown.label}</span>
                <span className="text-2xl font-bold text-rose-300">${fmt(data.nextDown.target)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 bg-rose-500/20 border border-rose-500/30 rounded px-2 py-1">
                  <span className="text-rose-400">-${fmt(data.nextDown.abs)}</span>
                </div>
                <div className="flex-1 bg-rose-500/20 border border-rose-500/30 rounded px-2 py-1">
                  <span className="text-rose-400">{fmt(data.nextDown.inAtr, 2)} ATR</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-2 bg-slate-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 to-rose-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((data.nextDown.inAtr || 0) / 1.618) * 100)}%` }}
                ></div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-500">No downside target available</div>
          )}
        </div>
      </div>
    </div>
  )
}
