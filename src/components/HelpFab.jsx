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
      } catch (err) {
        console.error('[HelpFab] Error handling help event:', err)
      }
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
      console.error('[HelpFab] Error:', e)
      setAns(`${String(e.message || e)}\n\nTip: open /api/health to check AI status.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Premium FAB Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-4 right-4 z-[60] w-12 h-12 rounded-full overflow-hidden shadow-2xl group"
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all" />
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-xl opacity-50 group-hover:opacity-70 animate-pulse transition-opacity" />
        {/* Icon */}
        <span className="relative text-white text-xl font-bold flex items-center justify-center h-full">
          {open ? '✕' : '🤖'}
        </span>
      </button>

      {/* Premium Help Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-[60] w-96 max-w-[calc(100vw-2rem)]">
          <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
            {/* Gradient Border Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 opacity-20 blur-xl" />

            {/* Content */}
            <div className="relative">
              {/* Premium Header */}
              <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div className="text-sm font-bold text-purple-300">
                    Ask AI
                    {llmReady === false && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                        Not Configured
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Section */}
              <div className="p-4 space-y-3">
                <textarea
                  aria-label="Help question"
                  value={q}
                  onChange={e=>setQ(e.target.value)}
                  placeholder="Ask about indicators, score, presets, scanning, backtests…"
                  className="w-full h-24 bg-slate-800/50 border border-slate-700/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 resize-none transition-all"
                />

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={ask}
                    disabled={loading || llmReady===false || !q.trim()}
                    className="relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all group-disabled:from-slate-700 group-disabled:to-slate-700" />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity group-disabled:opacity-0" />
                    <span className="relative text-white flex items-center gap-1.5">
                      {loading ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Thinking…
                        </>
                      ) : (
                        <>
                          <span>💭</span>
                          Ask
                        </>
                      )}
                    </span>
                  </button>

                  <button
                    onClick={()=>{ setQ('Explain my current Unicorn Score and which components contribute the most.'); setAns('') }}
                    className="text-xs text-purple-400 hover:text-purple-300 underline transition-colors"
                  >
                    Explain Score
                  </button>

                  <button
                    onClick={()=>{ setQ('Which preset should I use now and why?'); setAns('') }}
                    className="text-xs text-purple-400 hover:text-purple-300 underline transition-colors"
                  >
                    Suggest Preset
                  </button>
                </div>

                {/* Premium Answer Display */}
                {ans && (
                  <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">💡</span>
                      <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Answer</div>
                    </div>
                    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {ans}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
