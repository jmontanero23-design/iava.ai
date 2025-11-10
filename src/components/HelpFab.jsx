import React, { useEffect, useState } from 'react'

export default function HelpFab({ context = {} }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [ans, setAns] = useState('')
  const [loading, setLoading] = useState(false)
  const [llmReady, setLlmReady] = useState(null)
  const [eventCtx, setEventCtx] = useState(null)

  useEffect(() => { (async () => { try { const r = await fetch('/api/health'); const j = await r.json(); setLlmReady(Boolean(j?.api?.llm?.configured)) } catch { setLlmReady(false) } })() }, [])

  useEffect(() => {
    function onHelp(ev) {
      try {
        const detail = ev.detail || {}
        if (typeof detail.question === 'string') setQ(detail.question)
        if (detail.context) setEventCtx(detail.context)
        setAns('')
        setOpen(true)
      } catch {}
    }
    window.addEventListener('iava.help', onHelp)
    return () => window.removeEventListener('iava.help', onHelp)
  }, [])

  async function ask() {
    try {
      setLoading(true); setAns('')
      const merged = { ...(context||{}), ...(eventCtx||{}) }
      const r = await fetch('/api/llm/help', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, context: merged }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setAns(j.answer || '')
    } catch (e) {
      setAns(`${String(e.message || e)}\n\nTip: open /api/health to check AI status.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(v => !v)} className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">?
      </button>
      {open && (
        <div className="fixed bottom-16 right-4 z-50 w-80 bg-slate-900 border border-slate-700 rounded shadow-xl p-3">
          <div className="text-sm font-semibold text-slate-200 mb-1">Ask AI {llmReady===false && <span className="text-amber-400 text-xs">(not configured)</span>}</div>
          <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about indicators, score, presets, scanning, backtests…" className="w-full h-20 bg-slate-800 border border-slate-700 rounded p-2 text-sm" />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={ask} disabled={loading || llmReady===false || !q.trim()} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded px-2 py-1 border border-slate-700 text-xs">{loading ? 'Thinking…' : 'Ask'}</button>
            <button onClick={()=>{ setQ('Explain my current Unicorn Score and which components contribute the most.'); setAns('') }} className="text-xs text-slate-400 underline">Explain Score</button>
            <button onClick={()=>{ setQ('Which preset should I use now and why?'); setAns('') }} className="text-xs text-slate-400 underline">Suggest Preset</button>
          </div>
          {ans && <div className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">{ans}</div>}
        </div>
      )}
    </>
  )
}
