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

  useEffect(() => {
    refresh()
  }, [])

  // Keyboard shortcuts: ← prev, → next, space toggles Auto
  useEffect(() => {
    const onKey = e => {
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
  const currentSymbol = canNav ? symbols[idx] : '—'

  return (
    <div className="card p-4">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
              Watchlist Navigator
            </h3>
            <p className="text-xs text-slate-400">Cycle through symbols automatically</p>
          </div>
          <InfoPopover title="Navigator">
            Cycle a watchlist and load each symbol. Shortcuts: ← Prev, → Next, Space Auto/Pause.
          </InfoPopover>
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Current Symbol */}
        <div className="stat-tile bg-indigo-500/5 border-indigo-500/20 border">
          <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
            <span className="text-lg">🎯</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">Current</div>
            <div className="stat-value text-sm text-indigo-300">{currentSymbol}</div>
          </div>
        </div>

        {/* Position */}
        <div className="stat-tile">
          <div className="stat-icon bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
            <span className="text-lg">📍</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">Position</div>
            <div className="stat-value text-sm text-cyan-400">{pos}</div>
          </div>
        </div>

        {/* Auto Status */}
        <div className={`stat-tile ${playing ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-500/5 border-slate-500/20'} border`}>
          <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
            <span className="text-lg">{playing ? '▶️' : '⏸️'}</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">Auto Mode</div>
            <div className={`stat-value text-xs ${playing ? 'text-emerald-400' : 'text-slate-400'}`}>
              {playing ? 'Playing' : 'Paused'}
            </div>
          </div>
        </div>
      </div>

      {/* Watchlist Selection */}
      <div className="mb-3">
        <label className="text-xs text-slate-400 block mb-1">Select Watchlist</label>
        <div className="flex gap-2">
          <select
            value={name}
            onChange={e => {
              const n = e.target.value
              setName(n)
              setSymbols(lists[n]?.symbols || [])
              setIdx(0)
            }}
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="">—</option>
            {Object.keys(lists).map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button
            onClick={refresh}
            className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 font-semibold rounded-lg px-4 py-2 transition-all duration-200"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {/* Prev */}
        <button
          onClick={() => {
            if (!canNav) return
            setIdx(i => (i - 1 + symbols.length) % symbols.length)
          }}
          disabled={!canNav}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200"
        >
          ← Prev
        </button>

        {/* Next */}
        <button
          onClick={() => {
            if (!canNav) return
            setIdx(i => (i + 1) % symbols.length)
          }}
          disabled={!canNav}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200"
        >
          Next →
        </button>

        {/* Toggle Auto */}
        <button
          onClick={() => setPlaying(p => !p)}
          className={`${
            playing
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
              : 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700'
          } text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200`}
        >
          {playing ? '⏸️ Pause' : '▶️ Auto'}
        </button>

        {/* Interval */}
        <div className="stat-tile">
          <div className="flex-1">
            <label className="text-[9px] text-slate-400 block mb-1">Interval (sec)</label>
            <input
              type="number"
              min={2}
              max={60}
              value={sec}
              onChange={e => setSec(parseInt(e.target.value, 10) || 5)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="p-2 bg-slate-800/30 border border-slate-700/30 rounded-lg">
        <div className="text-xs text-slate-400 flex items-center justify-center gap-4">
          <span>⌨️ <span className="text-slate-300">←</span> Prev</span>
          <span>⌨️ <span className="text-slate-300">→</span> Next</span>
          <span>⌨️ <span className="text-slate-300">Space</span> Auto/Pause</span>
        </div>
      </div>
    </div>
  )
}
