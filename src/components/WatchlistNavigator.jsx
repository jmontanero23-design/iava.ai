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
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Watchlist Navigator <InfoPopover title="Navigator">Cycle a watchlist and load each symbol. Shortcuts: ← Prev, → Next, Space Auto/Pause.</InfoPopover></h3>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={refresh} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700">Refresh</button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="text-slate-400">List</span>
        <select value={name} onChange={(e)=>{ const n=e.target.value; setName(n); setSymbols(lists[n]?.symbols||[]); setIdx(0) }} className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
          <option value="">—</option>
          {Object.keys(lists).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-slate-500 text-xs">{pos}</span>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button onClick={()=>{ if (!canNav) return; setIdx(i => (i - 1 + symbols.length) % symbols.length) }} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700" disabled={!canNav}>Prev</button>
          <button onClick={()=>{ if (!canNav) return; setIdx(i => (i + 1) % symbols.length) }} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700" disabled={!canNav}>Next</button>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={playing} onChange={e=>setPlaying(e.target.checked)} /> Auto</label>
          <label className="inline-flex items-center gap-1">Sec<input type="number" min={2} max={60} value={sec} onChange={e=>setSec(parseInt(e.target.value,10)||5)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-16" /></label>
        </div>
      </div>
    </div>
  )
}
