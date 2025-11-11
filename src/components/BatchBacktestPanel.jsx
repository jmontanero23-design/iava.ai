import React, { useEffect, useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function BatchBacktestPanel({ defaultTimeframe = '5Min' }) {
  const [symbols, setSymbols] = useState('AAPL,MSFT,NVDA,SPY,TSLA')
  const [timeframe, setTimeframe] = useState(defaultTimeframe)
  const [threshold, setThreshold] = useState(70)
  const [horizon, setHorizon] = useState(10)
  const [dailyFilter, setDailyFilter] = useState('none') // none|bull|bear
  const [includeRegimes, setIncludeRegimes] = useState(true)
  const [err, setErr] = useState('')
  const [lists, setLists] = useState([])

  useEffect(() => {
    (async () => {
      try { const mod = await import('../utils/watchlists.js'); setLists(mod.listNames()) } catch {}
    })()
  }, [])

  function buildUrl(params = {}) {
    const sym = (symbols || '').trim()
    const qs = new URLSearchParams({
      symbols: sym,
      timeframe,
      limit: '1000',
      threshold: String(threshold),
      horizon: String(horizon),
      includeRegimes: includeRegimes ? '1' : '0',
      dailyFilter,
    })
    for (const [k,v] of Object.entries(params)) qs.set(k, String(v))
    return `/api/backtest_batch?${qs.toString()}`
  }

  async function testRun() {
    try {
      setErr('')
      const r = await fetch(buildUrl({ format: 'summary-json' }))
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      alert(`Summary rows: ${(j.summary || []).length}`)
    } catch (e) {
      setErr(String(e.message || e))
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-600 via-indigo-500 to-purple-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative">
          <div className="flex items-center gap-3">
            {/* Icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-600 blur-lg opacity-50 animate-pulse" />
              <span className="relative text-2xl filter drop-shadow-lg">📊</span>
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-200 via-indigo-200 to-purple-300 bg-clip-text text-transparent inline-flex items-center gap-2">
              Batch Backtest
              <InfoPopover title="Batch Backtest">
                Download per-symbol event CSVs or summary stats for a list of symbols. Server caches daily bars; use Summary JSON/CSV for quick comparisons.
              </InfoPopover>
            </h3>
          </div>
        </div>
      </div>

      {/* Premium Content */}
      <div className="p-5 space-y-4">
        {/* Core Configuration Section */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⚙️</span>
            <div className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">Core Configuration</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400 font-medium mb-1.5 block">Timeframe</span>
              <select
                value={timeframe}
                onChange={e=>setTimeframe(e.target.value)}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              >
                <option value="1Min">1Min</option>
                <option value="5Min">5Min</option>
                <option value="15Min">15Min</option>
                <option value="1Hour">1Hour</option>
                <option value="1Day">1Day</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 font-medium mb-1.5 block">Threshold</span>
              <input
                type="number"
                min={0}
                max={100}
                value={threshold}
                onChange={e=>setThreshold(parseInt(e.target.value,10)||0)}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 font-medium mb-1.5 block">Horizon (bars)</span>
              <input
                type="number"
                min={1}
                max={100}
                value={horizon}
                onChange={e=>setHorizon(parseInt(e.target.value,10)||1)}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </label>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🎯</span>
            <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Filters</div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="inline-flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeRegimes}
                onChange={e=>setIncludeRegimes(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
              <span className="text-sm text-slate-300 group-hover:text-indigo-300 transition-colors">Include Regimes</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <span className="text-sm text-slate-400 font-medium">Daily Filter:</span>
              <select
                value={dailyFilter}
                onChange={e=>setDailyFilter(e.target.value)}
                className="select bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              >
                <option value="none">None</option>
                <option value="bull">Bull</option>
                <option value="bear">Bear</option>
              </select>
            </label>
          </div>
        </div>

        {/* Symbol Import Section */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📝</span>
            <div className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Symbol Import</div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400 mb-2">Symbols (comma-separated)</div>
              <textarea
                value={symbols}
                onChange={e=>setSymbols(e.target.value)}
                className="w-full h-20 bg-slate-800/50 border border-slate-700/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 rounded-lg p-3 text-sm text-slate-200 transition-all resize-none"
                placeholder="AAPL,MSFT,NVDA,SPY,TSLA"
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="relative group cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={async (e)=>{
                    const f = e.target.files?.[0]; if (!f) return
                    const txt = await f.text()
                    const toks = txt.toUpperCase().split(/[^A-Z0-9_\.\-]+/).filter(Boolean)
                    const uniq = Array.from(new Set(toks)).join(',')
                    setSymbols(uniq)
                    e.target.value = ''
                  }}
                  className="sr-only"
                />
                <div className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 transition-all">
                  📂 Import File
                </div>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">From saved list:</span>
                <select
                  onChange={async (e)=>{
                    const name = e.target.value; if (!name) return
                    try {
                      const mod = await import('../utils/watchlists.js')
                      const wl = mod.get(name)
                      if (wl?.symbols?.length) {
                        setSymbols(Array.from(new Set([...(symbols?symbols.split(','):[]), ...wl.symbols])).join(','))
                      }
                    } catch {}
                    e.target.value = ''
                  }}
                  className="select bg-slate-800/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                >
                  <option value="">—</option>
                  {lists.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <button
                onClick={testRun}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 transition-all"
              >
                🧪 Test Run
              </button>

              {err && <span className="text-sm text-rose-400 font-medium">{err}</span>}
            </div>
          </div>
        </div>

        {/* Export Actions Section */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⬇️</span>
            <div className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">Export Results</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Events CSV - Cyan theme */}
            <a
              href={buildUrl({ format: 'csv' })}
              className="relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 group-hover:from-cyan-500 group-hover:to-indigo-500 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <span className="relative text-white flex items-center gap-1.5">
                📊 Events CSV
              </span>
            </a>

            {/* Summary CSV - Indigo theme */}
            <a
              href={buildUrl({ format: 'summary' })}
              className="relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <span className="relative text-white flex items-center gap-1.5">
                📈 Summary CSV
              </span>
            </a>

            {/* Summary JSON - Purple theme */}
            <a
              href={buildUrl({ format: 'summary-json' })}
              className="relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <span className="relative text-white flex items-center gap-1.5">
                💾 Summary JSON
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
