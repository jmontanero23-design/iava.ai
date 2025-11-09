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
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">SATY Targets</h3>
        <div className="text-xs text-slate-400">Price <span className="text-slate-200">{fmt(data.price)}</span> · ATR <span className="text-slate-200">{fmt(data.atr)}</span></div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-slate-400 mb-1">Next Up</div>
          {data.nextUp ? (
            <div className="text-slate-200">{data.nextUp.label} → {fmt(data.nextUp.target)} (<span className="text-slate-400">+{fmt(data.nextUp.abs)} / {fmt(data.nextUp.inAtr,2)} ATR</span>)</div>
          ) : <div className="text-slate-500 text-xs">—</div>}
        </div>
        <div>
          <div className="text-slate-400 mb-1">Next Down</div>
          {data.nextDown ? (
            <div className="text-slate-200">{data.nextDown.label} → {fmt(data.nextDown.target)} (<span className="text-slate-400">-{fmt(data.nextDown.abs)} / {fmt(data.nextDown.inAtr,2)} ATR</span>)</div>
          ) : <div className="text-slate-500 text-xs">—</div>}
        </div>
      </div>
    </div>
  )
}

