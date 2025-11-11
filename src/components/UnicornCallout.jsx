import React, { useState, useEffect, useRef } from 'react'
import TradePanel from './TradePanel.jsx'
import { logSignal } from '../utils/tradeLogger.js'

export default function UnicornCallout({ state, threshold = 70, timeframe = '15Min' }) {
  const [open, setOpen] = useState(false)
  const [aiExplain, setAiExplain] = useState(null)
  const [loading, setLoading] = useState(false)
  const logged = useRef(false)

  if (!state || state.score == null || state.score < threshold) return null

  const facts = []
  if (state.pivotNow) facts.push({ label: 'Pivot Ribbon', value: state.pivotNow, icon: '🎯' })
  if (state.rip?.bias) facts.push({ label: 'Ripster 34/50', value: state.rip.bias, icon: '📊' })
  if (state.satyDir) facts.push({ label: 'SATY Trigger', value: state.satyDir, icon: '⚡' })
  if (state.sq?.fired) facts.push({ label: 'Squeeze', value: `fired ${state.sq.dir}`, icon: '💥' })
  if (state.ichiRegime) facts.push({ label: 'Ichimoku', value: state.ichiRegime, icon: '☁️' })

  // Log signal once when it first appears
  useEffect(() => {
    if (!logged.current && state.score >= threshold) {
      const symbol = state._bars?.[0]?.symbol || 'UNKNOWN'
      logSignal({
        symbol,
        timeframe,
        score: Math.round(state.score),
        components: state.components || {},
        threshold,
        notes: facts.map(f => `${f.label}: ${f.value}`).join(', '),
      }).catch(err => console.error('Failed to log signal:', err))
      logged.current = true
    }
  }, [state.score, threshold])  // eslint-disable-line react-hooks/exhaustive-deps

  async function getAIExplanation() {
    setLoading(true)
    try {
      const r = await fetch('/api/llm/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, threshold })
      })
      const j = await r.json()
      if (r.ok) setAiExplain(j)
      else setAiExplain({ error: j?.error || 'Failed to get explanation' })
    } catch (e) {
      setAiExplain({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function sendToN8N() {
    try {
      const payload = {
        type: 'unicorn_signal',
        at: new Date().toISOString(),
        score: state.score,
        facts: facts.map(f => `${f.label}: ${f.value}`),
        context: state
      }
      const r = await fetch('/api/n8n/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
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

  // Blocked by Daily Confluence
  if (state._enforceDaily && !confluenceOk) {
    return (
      <div className="card p-4 border-slate-600/50 bg-gradient-to-br from-slate-500/10 to-slate-600/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="logo-badge opacity-50">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-300">Unicorn Signal (Blocked)</h3>
            <p className="text-xs text-slate-400">Daily confluence not met</p>
          </div>
          <div className="text-2xl font-bold text-slate-400">{Math.round(state.score)}</div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-500/10 border border-slate-500/20 rounded-lg p-3">
          Required: <span className="text-slate-300 font-semibold">{dir === 'short' ? 'bearish' : 'bullish'}</span> Daily Pivot and Ichimoku regime.
          Adjust threshold or disable confluence to proceed.
        </div>
      </div>
    )
  }

  // Active Unicorn Signal
  return (
    <div className="card p-4 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 animate-pulse-subtle">
      {/* Header with Logo + Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="logo-badge animate-pulse">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-200 via-emerald-100 to-emerald-200 bg-clip-text text-transparent">
              🦄 Unicorn Signal Detected
            </h3>
            <p className="text-xs text-emerald-300/80">High-probability setup identified</p>
          </div>
        </div>

        {/* Giant Score Badge */}
        <div className="flex flex-col items-center bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border border-emerald-400/40 rounded-xl px-4 py-2">
          <div className="text-[9px] uppercase tracking-wide text-emerald-400 font-semibold">Score</div>
          <div className="text-3xl font-bold text-emerald-300">{Math.round(state.score)}</div>
          {aiExplain?.confidence != null && (
            <div className="text-[10px] text-emerald-400/80 mt-1">
              {(aiExplain.confidence * 100).toFixed(0)}% confident
            </div>
          )}
        </div>
      </div>

      {/* AI Explanation */}
      {aiExplain && !aiExplain.error && (
        <div className="card p-3 mb-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/30">
          <div className="panel-header mb-2">
            <span className="text-xs font-semibold text-indigo-300">AI Analysis</span>
            <span className="text-xs text-indigo-400 font-semibold">{(aiExplain.confidence * 100).toFixed(0)}% confident</span>
          </div>
          <p className="text-sm text-slate-200 mb-2">{aiExplain.explanation}</p>
          {aiExplain.highlights && aiExplain.highlights.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-slate-400 mb-1">Key Points:</div>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                {aiExplain.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {aiExplain?.error && (
        <div className="card p-3 mb-4 bg-rose-500/10 border-rose-500/30">
          <p className="text-sm text-rose-400">{aiExplain.error}</p>
        </div>
      )}

      {/* Signal Facts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        {facts.map((f, i) => (
          <div key={i} className="stat-tile bg-emerald-500/5 border-emerald-500/20">
            <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
              <span className="text-lg">{f.icon}</span>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-emerald-300/70">{f.label}</div>
              <div className="stat-value text-xs text-emerald-200">{f.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Score Contributions */}
      {state.components && Object.keys(state.components).length > 0 && (
        <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
          <div className="text-[10px] uppercase tracking-wide text-emerald-400 font-semibold mb-2">Score Breakdown</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(state.components)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => (
                <div key={k} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs">
                  <span className="text-emerald-300/80">{k}</span>
                  <span className="text-emerald-200 font-bold">+{v}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={getAIExplanation}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200"
        >
          {loading ? 'Analyzing...' : aiExplain ? 'Refresh AI Analysis' : 'Get AI Explanation'}
        </button>

        <button
          onClick={sendToN8N}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200"
        >
          Send to n8n
        </button>

        <button
          onClick={() => setOpen(v => !v)}
          className="bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-emerald-100 font-semibold rounded-lg px-4 py-2 transition-all duration-200"
        >
          {open ? 'Hide Trade Panel' : 'Open Trade Panel (Paper)'}
        </button>
      </div>

      {/* Trade Panel */}
      {open && (
        <div className="mt-4 p-4 bg-slate-800/50 border border-emerald-500/20 rounded-lg">
          <TradePanel
            bars={state._bars || []}
            saty={state.saty}
            account={state._account || {}}
            defaultSide={state.satyDir === 'short' ? 'sell' : 'buy'}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
