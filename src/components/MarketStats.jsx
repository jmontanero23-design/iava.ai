import React, { useMemo } from 'react'
import { computeStates } from '../utils/indicators.js'

export default function MarketStats({ bars = [], saty, symbol, timeframe, streaming, consensus, threshold = 70 }) {
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
  // Build a tiny score sparkline from recent bars (last 40 points)
  const scoreData = useMemo(() => {
    try {
      const N = Math.min(40, Math.max(0, bars.length))
      const start = bars.length - N
      const arr = []
      for (let i = start; i < bars.length; i++) {
        const slice = bars.slice(0, i + 1)
        const st = computeStates(slice)
        arr.push({ t: slice[slice.length - 1].time, v: st.score })
      }
      return arr
    } catch { return [] }
  }, [bars])
  const lastScore = scoreData.length ? Math.round(scoreData[scoreData.length - 1].v || 0) : null
  const spark = (() => {
    if (!scoreData.length) return null
    const w = 160, h = 36, pad = 2
    let min = Infinity, max = -Infinity
    for (const p of scoreData) { if (p.v < min) min = p.v; if (p.v > max) max = p.v }
    if (!isFinite(min) || !isFinite(max)) return null
    if (min === max) { min -= 1; max += 1 }
    const toX = (i) => pad + (i * (w - pad * 2)) / Math.max(1, scoreData.length - 1)
    const toY = (v) => pad + (h - pad * 2) * (1 - (v - min) / (max - min))
    const pts = scoreData.map((p, i) => `${Math.round(toX(i))},${Math.round(toY(p.v))}`).join(' ')
    const last = scoreData[scoreData.length - 1]
    return (
      <svg width={w} height={h} className="block">
        <polyline fill="none" stroke="#22c55e" strokeWidth="2" points={pts} />
        <circle cx={Math.round(toX(scoreData.length - 1))} cy={Math.round(toY(last.v))} r="2" fill="#22c55e" />
      </svg>
    )
  })()
  const items = [
    { label: 'Last', value: `$${stats.close.toFixed(2)}` },
    { label: 'Change', value: `${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)} (${stats.changePct.toFixed(2)}%)`, accent: stats.change >= 0 ? 'text-emerald-400' : 'text-rose-400' },
    { label: 'ATR₁₄', value: stats.atr ? `$${stats.atr.toFixed(2)}` : '—' },
    { label: 'Range Used', value: stats.rangePct ? `${stats.rangePct.toFixed(0)}%` : '—' },
    { label: 'Mode', value: streaming ? 'Streaming' : 'Polling', accent: streaming ? 'text-cyan-300' : 'text-slate-300' },
  ]
  if (consensus && consensus.secTf) {
    const ok = consensus.align
    items.push({ label: `Consensus ${consensus.secTf}`, value: ok ? 'Yes' : 'No', accent: ok ? 'text-emerald-300' : 'text-slate-400' })
  }
  // Add score tile with sparkline
  if (lastScore != null) {
    items.push({ label: 'Score', value: `${lastScore}`, accent: lastScore >= threshold ? 'text-emerald-400' : 'text-slate-200', spark })
  }

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{symbol} · {timeframe}</span>
        <div className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wide ${streaming ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
          {streaming ? 'Live Streaming' : 'Snapshot'}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        {items.map(item => (
          <div key={item.label} className="bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-800" title={item.title || ''}>
            <div className="text-xs uppercase tracking-wide text-slate-500">{item.label}</div>
            <div className={`text-base font-semibold ${item.accent || 'text-slate-100'}`}>{item.value}</div>
            {item.spark ? <div className="mt-1">{item.spark}</div> : null}
          </div>
        ))}
      </div>
    </section>
  )
}
