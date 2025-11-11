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
  useEffect(() => { refresh() }, [active]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Card */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              Watchlists
            </h3>
            <p className="text-xs text-slate-400">Save and manage your symbol collections</p>
          </div>
          <InfoPopover title="Watchlists">
            Save symbols from the Scanner and quickly load them here.
            <br/><br/>
            Stored locally in your browser.
          </InfoPopover>
          <button onClick={refresh} className="btn btn-xs">Refresh</button>
        </div>

        {/* List Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Select List</label>
            <select value={active} onChange={e=>setActive(e.target.value)} className="select w-full">
              <option value="">Select a watchlist…</option>
              {Object.keys(lists).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Rename As</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e=>setName(e.target.value)}
                placeholder="New name..."
                className="input flex-1"
              />
              <button
                onClick={async()=>{
                  try {
                    const mod = await import('../utils/watchlists.js')
                    if (active && name) {
                      const cur = mod.get(active)
                      if (cur) {
                        mod.save(name, cur.symbols || [])
                        mod.remove(active)
                        setActive(name)
                        setName('')
                        refresh()
                      }
                    }
                  } catch {}
                }}
                className="btn btn-xs"
              >
                Rename
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={async()=>{
              try {
                const mod = await import('../utils/watchlists.js')
                if (active) {
                  mod.setActive(active)
                  alert('✓ Set as active watchlist')
                }
              } catch {}
            }}
            className="btn btn-success px-3 py-1.5"
            disabled={!active}
          >
            Set Active
          </button>

          <button
            onClick={async()=>{
              try {
                const mod = await import('../utils/watchlists.js')
                if (active && window.confirm(`Delete watchlist "${active}"?`)) {
                  mod.remove(active)
                  setActive('')
                  setSymbols([])
                  refresh()
                }
              } catch {}
            }}
            className="btn btn-danger px-3 py-1.5"
            disabled={!active}
          >
            Delete
          </button>

          {active && (
            <span className="text-xs text-slate-400 ml-auto">
              Active: <span className="text-slate-300 font-semibold">{active}</span>
            </span>
          )}
        </div>
      </div>

      {/* Symbol Grid */}
      <div className="card p-4">
        <div className="panel-header mb-3">
          <span className="text-xs font-semibold text-slate-300">
            Symbols {symbols.length > 0 && `(${symbols.length})`}
          </span>
        </div>

        {symbols.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm">No symbols in this watchlist</div>
            <div className="text-xs text-slate-500 mt-1">Use the Scanner to save symbols here</div>
          </div>
        )}

        {symbols.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {symbols.map(sym => (
              <button
                key={sym}
                onClick={() => onLoadSymbol?.(sym)}
                className="tile p-3 text-center hover:scale-105"
              >
                <div className="text-slate-100 font-semibold text-sm">{sym}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
