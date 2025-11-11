import React, { useEffect, useMemo, useRef, useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function WatchlistNavigator({ onLoadSymbol, timeframe }) {
  const [lists, setLists] = useState({})
  const [name, setName] = useState('')
  const [symbols, setSymbols] = useState([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [sec, setSec] = useState(5)
  const timerRef = useRef(null)

  async function refresh() {
    try {
      const mod = await import('../utils/watchlists.js')
      const all = mod.getAll()
      setLists(all)
      const names = Object.keys(all)
      const preferred = mod.getActive() || ''
      const defaultName = name || preferred || (names[0] || '')
      setName(defaultName)
      setSymbols(all[defaultName]?.symbols || [])
      setIdx(0)
    } catch {}
  }

  useEffect(() => { refresh() }, [])
  // Keyboard shortcuts: ← prev, → next, space toggles Auto
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (symbols.length) setIdx(i => (i - 1 + symbols.length) % symbols.length)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (symbols.length) setIdx(i => (i + 1) % symbols.length)
      } else if (e.key === ' ') {
        e.preventDefault()
        setPlaying(p => !p)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [symbols.length])
  useEffect(() => {
    if (playing && symbols.length) {
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setIdx(i => (i + 1) % symbols.length)
      }, Math.max(2, sec) * 1000)
      return () => clearInterval(timerRef.current)
    } else {
      clearInterval(timerRef.current)
    }
  }, [playing, sec, symbols])

  useEffect(() => {
    if (symbols.length && idx >= 0 && idx < symbols.length) {
      const sym = symbols[idx]
      onLoadSymbol?.(sym, timeframe)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const canNav = symbols.length > 0
  const pos = useMemo(() => (canNav ? `${idx + 1}/${symbols.length}` : '—'), [idx, symbols])

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="p-4 relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-50 animate-pulse" />
              <span className="relative text-2xl filter drop-shadow-lg">🎯</span>
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text text-transparent inline-flex items-center gap-2">
              Watchlist Navigator
              <InfoPopover title="Navigator">Cycle a watchlist and load each symbol. Shortcuts: ← Prev, → Next, Space Auto/Pause.</InfoPopover>
            </h3>
          </div>

          {/* Refresh button */}
          <button
            onClick={refresh}
            className="relative group px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden"
            title="Refresh watchlists"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            <span className="relative text-white flex items-center gap-1.5">
              🔄 Refresh
            </span>
          </button>
        </div>
      </div>

      {/* Premium Controls Section */}
      <div className="p-4 space-y-3">
        {/* List Selector & Position */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-300">List</span>
          <select
            value={name}
            onChange={(e)=>{ const n=e.target.value; setName(n); setSymbols(lists[n]?.symbols||[]); setIdx(0) }}
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500/50 text-slate-200 transition-all"
          >
            <option value="">—</option>
            {Object.keys(lists).map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          {/* Premium Position Indicator */}
          <div className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
            <span className="text-sm text-indigo-300 font-bold">{pos}</span>
          </div>
        </div>

        {/* Navigation & Auto Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation Buttons */}
          <button
            onClick={()=>{ if (!canNav) return; setIdx(i => (i - 1 + symbols.length) % symbols.length) }}
            disabled={!canNav}
            className="relative group px-4 py-2 rounded-lg text-xs font-semibold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all" />
            <span className="relative text-white flex items-center gap-1.5">
              ← Prev
            </span>
          </button>

          <button
            onClick={()=>{ if (!canNav) return; setIdx(i => (i + 1) % symbols.length) }}
            disabled={!canNav}
            className="relative group px-4 py-2 rounded-lg text-xs font-semibold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all" />
            <span className="relative text-white flex items-center gap-1.5">
              Next →
            </span>
          </button>

          <div className="h-6 w-px bg-slate-700 mx-1" />

          {/* Auto-play Controls */}
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-indigo-500/30 transition-all cursor-pointer">
            <input
              className="checkbox"
              type="checkbox"
              checked={playing}
              onChange={e=>setPlaying(e.target.checked)}
            />
            <span className={`text-xs font-semibold ${playing ? 'text-emerald-400' : 'text-slate-400'}`}>
              {playing ? '▶️ Auto' : 'Auto'}
            </span>
          </label>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
            <span className="text-xs font-semibold text-slate-400">Interval</span>
            <input
              type="number"
              min={2}
              max={60}
              value={sec}
              onChange={e=>setSec(parseInt(e.target.value,10)||5)}
              className="w-16 px-2 py-1 rounded-md text-xs bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500/50 text-slate-200 transition-all"
            />
            <span className="text-xs text-slate-500">sec</span>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 font-mono">←</span>
          <span className="px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 font-mono">→</span>
          <span>Navigate</span>
          <span className="mx-1">•</span>
          <span className="px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 font-mono">Space</span>
          <span>Auto/Pause</span>
        </div>
      </div>
    </div>
  )
}
