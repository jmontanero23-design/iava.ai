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
    <div className="card overflow-hidden border-2 border-emerald-500/50" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' }}>
      {/* Gradient Background Effect */}
      <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />

      <div className="relative p-4 flex items-center justify-between gap-4">
        {/* Left: Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🦄</span>
            <div className="text-sm font-bold text-emerald-300">
              Unicorn Threshold Reached
            </div>
            <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30">
              <span className="text-xs font-bold text-emerald-300">Score {score}</span>
            </div>
          </div>

          {/* Premium Details Row */}
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 font-medium">
              {symbol}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 font-medium">
              {timeframe}
            </span>
            {state.satyDir && (
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 font-medium">
                SATY {state.satyDir}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 font-medium">
              Ribbon {state.pivotNow || '—'}
            </span>
            {state._daily && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 font-medium">
                Daily {state._daily.pivotNow || '—'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Action Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={sendN8n}
            disabled={!canSend}
            className={`relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden transition-all ${!canSend ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {canSend ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <span className="relative text-white flex items-center gap-1.5">
                  📡 Send to n8n
                </span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-slate-700" />
                <span className="relative text-slate-400 flex items-center gap-1.5">
                  📡 Send to n8n
                </span>
              </>
            )}
          </button>

          {msg && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${msg.includes('error') ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300' : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'}`}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
