import React, { useState } from 'react'

export default function BacktestPanel({ symbol, timeframe }) {
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')

  async function run() {
    try {
      setLoading(true); setErr('')
      const r = await fetch(`/api/backtest?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000`)
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setRes(j)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Backtest Snapshot</h3>
        <button onClick={run} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">{loading ? 'Running…' : 'Run'}</button>
      </div>
      {err && <div className="text-xs text-rose-400 mt-2">{err}</div>}
      {res && (
        <div className="mt-2 text-sm text-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-slate-400">Bars</span> {res.bars}</div>
            <div><span className="text-slate-400">Score Avg</span> {res.scoreAvg}</div>
            <div><span className="text-slate-400">≥40%</span> {res.scorePcts?.p40}%</div>
            <div><span className="text-slate-400">≥60%</span> {res.scorePcts?.p60}%</div>
            <div><span className="text-slate-400">≥70%</span> {res.scorePcts?.p70}%</div>
          </div>
          {Array.isArray(res.recentScores) && res.recentScores.length ? (
            <div className="mt-3 h-16 flex items-end gap-[2px]">
              {res.recentScores.map((v, i) => {
                const h = Math.max(2, Math.min(60, Math.round((v / 100) * 60)))
                const color = v >= 70 ? 'bg-emerald-500/70' : v >= 40 ? 'bg-amber-500/70' : 'bg-slate-500/50'
                return <div key={i} className={`w-[2px] ${color}`} style={{ height: h }} title={`${v.toFixed(1)}`} />
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )}
