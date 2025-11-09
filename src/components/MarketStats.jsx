import React, { useMemo } from 'react'

export default function MarketStats({ bars = [], saty, symbol, timeframe, streaming }) {
  const stats = useMemo(() => {
    if (!bars.length) return null
    const last = bars[bars.length - 1]
    const prev = bars[bars.length - 2] || last
    const close = last.close
    const change = close - prev.close
    const changePct = prev.close ? (change / prev.close) * 100 : 0
    const atr = saty?.atr || 0
    const rangePct = saty?.rangeUsed ? saty.rangeUsed * 100 : 0
    return { close, change, changePct, atr, rangePct }
  }, [bars, saty])

  if (!stats) return null
  const items = [
    { label: 'Last', value: `$${stats.close.toFixed(2)}` },
    { label: 'Change', value: `${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)} (${stats.changePct.toFixed(2)}%)`, accent: stats.change >= 0 ? 'text-emerald-400' : 'text-rose-400' },
    { label: 'ATR₁₄', value: stats.atr ? `$${stats.atr.toFixed(2)}` : '—' },
    { label: 'Range Used', value: stats.rangePct ? `${stats.rangePct.toFixed(0)}%` : '—' },
    { label: 'Mode', value: streaming ? 'Streaming' : 'Polling', accent: streaming ? 'text-cyan-300' : 'text-slate-300' },
  ]

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{symbol} · {timeframe}</span>
        <div className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wide ${streaming ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
          {streaming ? 'Live Streaming' : 'Snapshot'}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        {items.map(item => (
          <div key={item.label} className="bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-800">
            <div className="text-xs uppercase tracking-wide text-slate-500">{item.label}</div>
            <div className={`text-base font-semibold ${item.accent || 'text-slate-100'}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

