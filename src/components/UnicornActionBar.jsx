import React, { useState } from 'react'

export default function UnicornActionBar({ state, symbol, timeframe, threshold = 70 }) {
  const [msg, setMsg] = useState('')
  if (!state) return null
  const score = Math.round(state.score || 0)
  const meets = score >= threshold
  // Daily gating if provided
  let dailyOk = true
  if (state._enforceDaily && state._daily) {
    const bull = state._daily.pivotNow === 'bullish' && state._daily.ichiRegime === 'bullish'
    const bear = state._daily.pivotNow === 'bearish' && state._daily.ichiRegime === 'bearish'
    dailyOk = bull || bear
  }
  const canSend = meets && dailyOk
  async function sendN8n() {
    setMsg('')
    try {
      const payload = {
        symbol,
        timeframe,
        score,
        components: state.components,
        last: state._bars?.[state._bars.length - 1] || null,
        daily: state._daily || null,
      }
      const r = await fetch('/api/n8n/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const txt = await r.text()
      setMsg(r.ok ? 'Sent to n8n' : (`n8n error: ${txt}`))
    } catch (e) {
      setMsg(String(e?.message || e))
    }
  }
  if (!meets) return null
  return (
    <div className="card p-3 flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-slate-200">Unicorn Threshold reached · Score {score}</div>
        <div className="text-xs text-slate-400">{symbol} · {timeframe} · {state.satyDir ? `SATY ${state.satyDir}` : '—'} · Ribbon {state.pivotNow} · Daily {state._daily ? state._daily.pivotNow : '—'}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={sendN8n} disabled={!canSend} className={`text-xs rounded px-3 py-1 border ${canSend ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'}`}>Send to n8n</button>
        {msg && <div className="text-xs text-slate-400">{msg}</div>}
      </div>
    </div>
  )
}

