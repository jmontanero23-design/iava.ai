import React, { useEffect, useState } from 'react'
import TradePanel from './TradePanel.jsx'

export default function UnicornCallout({ state, threshold = 70 }) {
  if (!state || state.score == null || state.score < threshold) return null
  const facts = []
  if (state.pivotNow) facts.push(`Pivot: ${state.pivotNow}`)
  if (state.rip?.bias) facts.push(`34/50: ${state.rip.bias}`)
  if (state.satyDir) facts.push(`SATY: ${state.satyDir}`)
  if (state.sq?.fired) facts.push(`Squeeze: fired ${state.sq.dir}`)
  if (state.ichiRegime) facts.push(`Ichimoku: ${state.ichiRegime}`)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [expLoading, setExpLoading] = useState(false)
  const [expErr, setExpErr] = useState('')
  const [exp, setExp] = useState(null)
  const [llmReady, setLlmReady] = useState(null)
  const [n8nReady, setN8nReady] = useState(null)
  const bonus = state._consensus?.align ? 10 : 0
  const scoreLabel = bonus ? `${Math.round(state.score)} (+${bonus} consensus)` : `${Math.round(state.score)}`
  async function sendToN8N() {
    try {
      const payload = { type: 'unicorn_signal', at: new Date().toISOString(), score: state.score, facts, context: state }
      const r = await fetch('/api/n8n/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) throw new Error(await r.text())
      window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Sent to n8n', type: 'success' } }))
    } catch (e) {
      alert(`n8n error: ${e.message}`)
    }
  }
  async function explain() {
    try {
      setExpLoading(true); setExpErr('')
      const r = await fetch('/api/llm/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, threshold, enforceDaily: state._enforceDaily }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setExp(j)
    } catch (e) {
      setExpErr(String(e.message || e))
    } finally {
      setExpLoading(false)
    }
  }
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/health')
        const j = await r.json()
        if (mounted) {
          setLlmReady(Boolean(j?.api?.llm?.configured))
          setN8nReady(Boolean(j?.api?.n8n?.configured))
        }
      } catch { if (mounted) setLlmReady(false) }
    })()
    return () => { mounted = false }
  }, [])
  // Determine intended direction from state (prefer SATY), fallback to ribbon
  const dir = state.satyDir || (state.pivotNow === 'bearish' ? 'short' : 'long')
  const dailyPivot = state._daily?.pivotNow
  const dailyIchi = state._daily?.ichiRegime
  const dailyBull = state._daily ? (dailyPivot === 'bullish' && dailyIchi === 'bullish') : true
  const dailyBear = state._daily ? (dailyPivot === 'bearish' && dailyIchi === 'bearish') : true
  const confluenceOk = dir === 'short' ? dailyBear : dailyBull
  // Trade open state when not blocked
  const [open, setOpen] = useState(false)
  if (state._enforceDaily && !confluenceOk) {
    // Show muted info when confluence not met, with an explicit paper-trade override
    return (
      <div className="card p-4 border-slate-700/60" style={{ background: 'linear-gradient(180deg, rgba(100,116,139,0.08), rgba(100,116,139,0.02))' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Unicorn Signal (blocked by Daily Confluence)</h3>
          <div className="text-sm font-bold text-slate-400">Score: {scoreLabel}</div>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Required ({dir}): Daily Pivot and Ichimoku must be {dir === 'short' ? 'bearish' : 'bullish'}. <span className="ml-2">Currently: Pivot {dailyPivot || '—'}, Ichimoku {dailyIchi || '—'}.</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => setOverrideOpen(v => !v)} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">{overrideOpen ? 'Hide Trade' : 'Proceed (Paper)'}
          </button>
          <span className="text-xs text-slate-500">Proceed opens a paper trade ticket without daily confluence. Use with caution.</span>
        </div>
        {overrideOpen && (
          <div className="mt-3">
            <TradePanel bars={state._bars || []} saty={state.saty} account={state._account || {}} defaultSide={state.satyDir === 'short' ? 'sell' : 'buy'} defaultRiskPct={0.5} onClose={() => setOverrideOpen(false)} />
          </div>
        )}
        {expErr ? (
          <div className="mt-2 text-xs text-rose-400">
            {expErr}
            <span className="ml-2 text-slate-500">Check <a href="/api/health" target="_blank" rel="noreferrer" className="underline">/api/health</a> for LLM status.</span>
          </div>
        ) : null}
      </div>
    )
  }
  // Soft risk: if daily confluence is not enforced but we have daily data and it mismatches, reduce default risk
  const softRiskPct = (!state._enforceDaily && state._daily)
    ? ((dir === 'short' ? dailyBear : dailyBull) ? 1.0 : 0.5)
    : 1.0
  const softNote = softRiskPct < 1.0 ? ' · risk reduced (daily mismatch)' : ''

  return (
    <div className="card p-4 border-emerald-700/60" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-emerald-300">Unicorn Signal{softNote}</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">Score: {scoreLabel}</div>
          <button onClick={sendToN8N} disabled={n8nReady === false} title={n8nReady === false ? 'n8n not configured' : ''} className="bg-emerald-700/30 hover:bg-emerald-700/40 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-200 text-xs rounded px-2 py-1">Send to n8n</button>
          <button onClick={explain} disabled={expLoading || llmReady === false} title={llmReady === false ? 'LLM not configured' : ''} className="bg-slate-800 hover:bg-slate-700 text-emerald-200 text-xs rounded px-2 py-1 border border-slate-700">{expLoading ? 'Explaining…' : 'Explain'}</button>
          <button onClick={() => setOpen(v => !v)} className="bg-emerald-700/30 hover:bg-emerald-700/40 text-emerald-200 text-xs rounded px-2 py-1">{open ? 'Hide Trade' : 'Trade (Paper)'}</button>
        </div>
      </div>
      <div className="mt-2 text-sm text-slate-200">
        <ul className="list-disc pl-5">
          {facts.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
        {state.components && (
          <div className="mt-2 text-xs text-slate-300">
            {(() => {
              try {
                const arr = Object.entries(state.components).filter(([,v])=>v>0).map(([k,v]) => `${k}+${v}`)
                if (state._consensus?.align) arr.push('consensus+10')
                return `Why: ${arr.join(', ')}`
              } catch { return null }
            })()}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => { try { const el = document.createElement('textarea'); const why = (()=>{ try { const arr = Object.entries(state.components).filter(([,v])=>v>0).map(([k,v]) => `${k}+${v}`); if (state._consensus?.align) arr.push('consensus+10'); return `Why: ${arr.join(', ')}` } catch { return '' } })(); el.value = why; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Why copied', type: 'success' } })) } catch(_) {} }} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">Copy Why</button>
        </div>
        {exp && (
          <div className="mt-4 p-4 rounded-lg border border-indigo-500/30 bg-gradient-to-br from-indigo-900/20 to-slate-900/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h4 className="text-sm font-semibold text-indigo-300">AI Analysis</h4>
              {typeof exp.confidence === 'number' && (
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${exp.confidence > 0.7 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'}`}>
                  {Math.round(exp.confidence * 100)}% confidence
                </span>
              )}
            </div>
            <div className="text-sm text-slate-200 leading-relaxed mb-3">{exp.explanation || ''}</div>
            {Array.isArray(exp.highlights) && exp.highlights.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Key Points:</div>
                <ul className="space-y-1.5">
                  {exp.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-indigo-400 mt-0.5">▸</span>
                      <span className="flex-1">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {expErr ? <div className="mt-2 text-xs text-rose-400">{expErr}</div> : null}
      </div>
        {open && <div className="mt-3">
        <TradePanel bars={state._bars || []} saty={state.saty} account={state._account || {}} defaultSide={state.satyDir === 'short' ? 'sell' : 'buy'} defaultRiskPct={softRiskPct} onClose={() => setOpen(false)} />
      </div>}
    </div>
  )
}
