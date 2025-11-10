import React, { useEffect, useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function WatchlistPanel({ onLoadSymbol }) {
  const [lists, setLists] = useState({})
  const [active, setActive] = useState('')
  const [symbols, setSymbols] = useState([])
  const [name, setName] = useState('')

  function refresh() {
    import('../utils/watchlists.js').then(mod => {
      const all = mod.getAll()
      setLists(all)
      const names = Object.keys(all)
      if (!active && names.length) setActive(names[0])
      if (active && all[active]) setSymbols(all[active].symbols || [])
      else if (names.length) setSymbols(all[names[0]].symbols || [])
      else setSymbols([])
    }).catch(()=>{})
  }

  useEffect(() => { refresh() }, [])
  useEffect(() => { refresh() }, [active])

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Watchlists <InfoPopover title="Watchlists">Save symbols from the Scanner and quickly load them here. Stored locally in your browser.</InfoPopover></h3>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={refresh} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700">Refresh</button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="text-slate-400">Lists:</span>
        <select value={active} onChange={e=>setActive(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
          <option value="">—</option>
          {Object.keys(lists).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Rename as…" className="bg-slate-800 border border-slate-700 rounded px-2 py-1" />
        <button onClick={async()=>{
          try {
            const mod = await import('../utils/watchlists.js')
            if (active && name) {
              // rename by copy
              const cur = mod.get(active)
              if (cur) { mod.save(name, cur.symbols || []); mod.remove(active); setActive(name); setName(''); refresh() }
            }
          } catch {}
        }} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700 text-xs">Rename</button>
        <button onClick={async()=>{
          try { const mod = await import('../utils/watchlists.js'); if (active) { mod.remove(active); setActive(''); setSymbols([]); refresh() } } catch {}
        }} className="bg-rose-700/30 hover:bg-rose-700/40 text-rose-200 rounded px-2 py-1 text-xs">Delete</button>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
        {symbols.length === 0 && <div className="text-xs text-slate-500">No symbols</div>}
        {symbols.map(sym => (
          <button key={sym} onClick={() => onLoadSymbol?.(sym)} className="px-2 py-1 rounded border border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-200 text-sm">{sym}</button>
        ))}
      </div>
    </div>
  )
}

