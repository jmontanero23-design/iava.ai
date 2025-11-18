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
    const up = rows.filter(r => r.diff > 0).sort((a,b) => a.diff - b.diff)[0] || null
    const dn = rows.filter(r => r.diff < 0).sort((a,b) => Math.abs(a.diff) - Math.abs(b.diff))[0] || null
    return { price, atr, nextUp: up, nextDown: dn, rows }
  }, [saty, last])

  if (!data) return null
  const fmt = (n, d=2) => (n == null ? '—' : Number(n).toFixed(d))

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
                <h3 className="text-lg font-bold bg-gradient-to-r from-teal-200 to-cyan-300 bg-clip-text text-transparent">
                  SATY Targets
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>Current: <span className="text-teal-300 font-semibold">${fmt(data.price)}</span></span>
                  <span>·</span>
                  <span>ATR: <span className="text-cyan-300 font-semibold">{fmt(data.atr)}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Content */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Next Up Target */}
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            <div className="relative p-4 bg-slate-800/30 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">⬆️</span>
                <div className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">Next Upside</div>
              </div>
              {data.nextUp ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs text-slate-400">Level</div>
                    <div className="text-sm font-semibold text-emerald-300">{data.nextUp.label}</div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs text-slate-400">Target Price</div>
                    <div className="text-lg font-bold text-emerald-300">${fmt(data.nextUp.target)}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50 space-y-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">Distance</span>
                      <span className="text-slate-300 font-medium">+${fmt(data.nextUp.abs)}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">In ATR</span>
                      <span className="text-slate-300 font-medium">{fmt(data.nextUp.inAtr, 2)} ATR</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  No upside target available
                </div>
              )}
            </div>
          </div>

          {/* Next Down Target */}
          <div className="relative group">
            <div className="absolute inset-0 bg-rose-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            <div className="relative p-4 bg-slate-800/30 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">⬇️</span>
                <div className="text-xs uppercase tracking-wider text-rose-300 font-semibold">Next Downside</div>
              </div>
              {data.nextDown ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs text-slate-400">Level</div>
                    <div className="text-sm font-semibold text-rose-300">{data.nextDown.label}</div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs text-slate-400">Target Price</div>
                    <div className="text-lg font-bold text-rose-300">${fmt(data.nextDown.target)}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50 space-y-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">Distance</span>
                      <span className="text-slate-300 font-medium">-${fmt(data.nextDown.abs)}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">In ATR</span>
                      <span className="text-slate-300 font-medium">{fmt(data.nextDown.inAtr, 2)} ATR</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  No downside target available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

