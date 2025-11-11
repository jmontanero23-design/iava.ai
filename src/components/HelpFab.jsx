import React, { useEffect, useState } from 'react'

export default function HelpFab({ context = {} }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [ans, setAns] = useState('')
  const [loading, setLoading] = useState(false)
  const [llmReady, setLlmReady] = useState(null)
  const [eventCtx, setEventCtx] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/health')
        const j = await r.json()
        setLlmReady(Boolean(j?.api?.llm?.configured))
      } catch {
        setLlmReady(false)
      }
    })()
  }, [])

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
      setLoading(true)
      setAns('')
      const merged = { ...(context || {}), ...(eventCtx || {}) }
      const r = await fetch('/api/llm/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: merged }),
      })
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
      {/* AI Chat FAB (AI Feature #12) */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-2xl transition-all duration-200 flex items-center justify-center font-bold text-xl"
        title="Ask AI (Feature #12)"
      >
        🤖
      </button>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-96 card p-4 shadow-2xl border-indigo-500/30">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="logo-badge">
              <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-200">Ask AI</div>
              <div className="text-xs text-slate-400">
                {llmReady === false ? (
                  <span className="text-amber-400">⚠️ Not configured</span>
                ) : (
                  <span className="text-emerald-400">✓ Ready</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Question Input */}
          <textarea
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Ask about indicators, score, presets, scanning, backtests…"
            className="w-full h-24 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-slate-200 resize-none"
          />

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={ask}
              disabled={loading || llmReady === false || !q.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200"
            >
              {loading ? '⏳ Thinking…' : '💬 Ask'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setQ('Explain my current Unicorn Score and which components contribute the most.')
                setAns('')
              }}
              className="text-xs px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-300 transition-colors"
            >
              📊 Explain Score
            </button>
            <button
              onClick={() => {
                setQ('Which preset should I use now and why?')
                setAns('')
              }}
              className="text-xs px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-300 transition-colors"
            >
              🎯 Suggest Preset
            </button>
          </div>

          {/* Answer */}
          {ans && (
            <div className="mt-3 p-3 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/30 rounded-lg">
              <div className="text-xs font-semibold text-indigo-300 mb-2">AI Response</div>
              <div className="text-sm text-slate-200 whitespace-pre-wrap">{ans}</div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
