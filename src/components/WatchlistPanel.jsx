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
      const preferred = mod.getActive() || ''
      const selected = active || preferred || (names[0] || '')
      if (!active && selected) setActive(selected)
      if (selected && all[selected]) setSymbols(all[selected].symbols || [])
      else if (names.length) setSymbols(all[names[0]].symbols || [])
      else setSymbols([])
    }).catch(()=>{})
  }

  useEffect(() => { refresh() }, [])
  useEffect(() => { refresh() }, [active])

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="p-4 relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-purple-600 blur-lg opacity-50 animate-pulse" />
              <span className="relative text-2xl filter drop-shadow-lg">📋</span>
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-200 to-cyan-300 bg-clip-text text-transparent inline-flex items-center gap-2">
              Watchlists
              <InfoPopover title="Watchlists">Save symbols from the Scanner and quickly load them here. Stored locally in your browser.</InfoPopover>
            </h3>
          </div>

          {/* Refresh button */}
          <button
            onClick={refresh}
            className="relative group px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden"
            title="Refresh watchlists"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 group-hover:from-purple-500 group-hover:to-cyan-500 transition-all" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            <span className="relative text-white flex items-center gap-1.5">
              🔄 Refresh
            </span>
          </button>
        </div>
      </div>

      {/* Premium Controls Section */}
      <div className="p-4 space-y-3">
        {/* List Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-300">Select List</span>
          <select
            value={active}
            onChange={e=>setActive(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-slate-800/50 border border-slate-700/50 focus:border-purple-500/50 text-slate-200 transition-all"
          >
            <option value="">—</option>
            {Object.keys(lists).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Rename & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={name}
            onChange={e=>setName(e.target.value)}
            placeholder="Rename as…"
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-slate-800/50 border border-slate-700/50 focus:border-purple-500/50 text-slate-200 placeholder-slate-500 transition-all"
          />

          <button
            onClick={async()=>{
              try {
                const mod = await import('../utils/watchlists.js')
                if (active && name) {
                  // rename by copy
                  const cur = mod.get(active)
                  if (cur) { mod.save(name, cur.symbols || []); mod.remove(active); setActive(name); setName(''); refresh() }
                }
              } catch {}
            }}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all"
          >
            Rename
          </button>

          <button
            onClick={async()=>{ try { const mod = await import('../utils/watchlists.js'); if (active) { mod.setActive(active); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Set active', type: 'success' } })) } } catch {} }}
            className="relative group px-3 py-2 rounded-lg text-xs font-semibold overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all" />
            <span className="relative text-white">Set Active</span>
          </button>

          <button
            onClick={async()=>{
              try { const mod = await import('../utils/watchlists.js'); if (active) { mod.remove(active); setActive(''); setSymbols([]); refresh() } } catch {}
            }}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white transition-all"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Premium Symbols Grid */}
      <div className="p-4 pt-0">
        {symbols.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-sm text-slate-500 italic">No symbols in this list</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {symbols.map(sym => (
                <button
                  key={sym}
                  onClick={() => onLoadSymbol?.(sym)}
                  className="relative group px-3 py-2 rounded-lg text-sm font-semibold overflow-hidden"
                >
                  <div className="absolute inset-0 bg-slate-800/40 group-hover:bg-slate-700/60 border border-slate-700/50 group-hover:border-purple-500/40 rounded-lg transition-all" />
                  <div className="absolute inset-0 bg-purple-600 blur-xl opacity-0 group-hover:opacity-5 transition-opacity" />
                  <span className="relative text-slate-200 group-hover:text-white transition-colors">{sym}</span>
                </button>
              ))}
            </div>

            {/* Active List Indicator */}
            {active && (
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                <div className="px-2 py-0.5 rounded-md bg-emerald-600/20 border border-emerald-500/30">
                  <span className="text-xs text-emerald-400 font-semibold">✓ Active</span>
                </div>
                <span className="text-xs text-slate-500">List:</span>
                <span className="text-xs text-slate-300 font-semibold">{active}</span>
                <span className="text-xs text-slate-500">({symbols.length} symbols)</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
