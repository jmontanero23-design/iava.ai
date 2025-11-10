import React, { useState, useEffect, useRef } from 'react'
import TradePanel from './TradePanel.jsx'
import { logSignal } from '../utils/tradeLogger.js'

export default function UnicornCallout({ state, threshold = 70 }) {
  if (!state || state.score == null || state.score < threshold) return null
  const facts = []
  if (state.pivotNow) facts.push(`Pivot: ${state.pivotNow}`)
  if (state.rip?.bias) facts.push(`34/50: ${state.rip.bias}`)
  if (state.satyDir) facts.push(`SATY: ${state.satyDir}`)
  if (state.sq?.fired) facts.push(`Squeeze: fired ${state.sq.dir}`)
  if (state.ichiRegime) facts.push(`Ichimoku: ${state.ichiRegime}`)
  const [open, setOpen] = useState(false)
  const logged = useRef(false)

  // Log signal once when it first appears
  useEffect(() => {
    if (!logged.current && state.score >= threshold) {
      const symbol = state._bars?.[0]?.symbol || 'UNKNOWN'
      const timeframe = '15'  // TODO: get from props
      logSignal({
        symbol,
        timeframe,
        score: Math.round(state.score),
        components: state.components || {},
        threshold,
        notes: facts.join(', '),
      }).catch(err => console.error('Failed to log signal:', err))
      logged.current = true
    }
  }, [state.score, threshold])  // eslint-disable-line react-hooks/exhaustive-deps
  async function sendToN8N() {
    try {
      const payload = { type: 'unicorn_signal', at: new Date().toISOString(), score: state.score, facts, context: state }
      const r = await fetch('/api/n8n/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) throw new Error(await r.text())
      alert('Sent to n8n')
    } catch (e) {
      alert(`n8n error: ${e.message}`)
    }
  }
  // Determine intended direction from state (prefer SATY), fallback to ribbon
  const dir = state.satyDir || (state.pivotNow === 'bearish' ? 'short' : 'long')
  const dailyBull = state._daily ? (state._daily.pivotNow === 'bullish' && state._daily.ichiRegime === 'bullish') : true
  const dailyBear = state._daily ? (state._daily.pivotNow === 'bearish' && state._daily.ichiRegime === 'bearish') : true
  const confluenceOk = dir === 'short' ? dailyBear : dailyBull
  if (state._enforceDaily && !confluenceOk) {
    // Show muted info when confluence not met
    return (
      <div className="card p-4 border-slate-700/60" style={{ background: 'linear-gradient(180deg, rgba(100,116,139,0.08), rgba(100,116,139,0.02))' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Unicorn Signal (blocked by Daily Confluence)</h3>
          <div className="text-sm font-bold text-slate-400">Score: {Math.round(state.score)}</div>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Required: {dir === 'short' ? 'bearish' : 'bullish'} Daily Pivot and Ichimoku regime. Adjust threshold or disable confluence to proceed.
        </div>
      </div>
    )
  }
  return (
    <div className="card p-4 border-emerald-700/60" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-emerald-300">Unicorn Signal</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-emerald-400">Score: {Math.round(state.score)}</div>
          <button onClick={sendToN8N} className="bg-emerald-700/30 hover:bg-emerald-700/40 text-emerald-200 text-xs rounded px-2 py-1">Send to n8n</button>
          <button onClick={() => setOpen(v => !v)} className="bg-emerald-700/30 hover:bg-emerald-700/40 text-emerald-200 text-xs rounded px-2 py-1">{open ? 'Hide Trade' : 'Trade (Paper)'}</button>
        </div>
      </div>
      <div className="mt-2 text-sm text-slate-200">
        <ul className="list-disc pl-5">
          {facts.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
        {state.components && (
          <div className="mt-2 text-xs text-slate-300">Why: {Object.entries(state.components).filter(([,v])=>v>0).map(([k,v]) => `${k}+${v}`).join(', ')}</div>
        )}
      </div>
      {open && <div className="mt-3">
        <TradePanel bars={state._bars || []} saty={state.saty} account={state._account || {}} defaultSide={state.satyDir === 'short' ? 'sell' : 'buy'} onClose={() => setOpen(false)} />
      </div>}
    </div>
  )
}
