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
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Batch Backtest <InfoPopover title="Batch Backtest">Download per-symbol event CSVs or summary stats for a list of symbols. Server caches daily bars; use Summary JSON/CSV for quick comparisons.</InfoPopover></h3>
        <div className="flex items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-2">TF
            <select value={timeframe} onChange={e=>setTimeframe(e.target.value)} className="select">
              <option value="1Min">1Min</option>
              <option value="5Min">5Min</option>
              <option value="15Min">15Min</option>
              <option value="1Hour">1Hour</option>
              <option value="1Day">1Day</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2">TH
            <input type="number" min={0} max={100} value={threshold} onChange={e=>setThreshold(parseInt(e.target.value,10)||0)} className="input w-16" />
          </label>
          <label className="inline-flex items-center gap-2">HZ
            <input type="number" min={1} max={100} value={horizon} onChange={e=>setHorizon(parseInt(e.target.value,10)||1)} className="input w-16" />
          </label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={includeRegimes} onChange={e=>setIncludeRegimes(e.target.checked)} /> Regimes</label>
          <label className="inline-flex items-center gap-2">Daily
            <select value={dailyFilter} onChange={e=>setDailyFilter(e.target.value)} className="select">
              <option value="none">None</option>
              <option value="bull">Bull</option>
              <option value="bear">Bear</option>
            </select>
          </label>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-400">Symbols (paste or import)</div>
      <textarea value={symbols} onChange={e=>setSymbols(e.target.value)} className="mt-1 w-full h-16 bg-slate-800 border border-slate-700 rounded p-2 text-sm" />
      <div className="mt-1 flex items-center gap-2 text-xs">
        <input type="file" accept=".csv,.txt" onChange={async (e)=>{
          const f = e.target.files?.[0]; if (!f) return
          const txt = await f.text()
          const toks = txt.toUpperCase().split(/[^A-Z0-9_\.\-]+/).filter(Boolean)
          const uniq = Array.from(new Set(toks)).join(',')
          setSymbols(uniq)
          e.target.value = ''
        }} />
        <span className="text-slate-400">From saved list:</span>
        <select onChange={async (e)=>{
          const name = e.target.value; if (!name) return
          try { const mod = await import('../utils/watchlists.js'); const wl = mod.get(name); if (wl?.symbols?.length) setSymbols(Array.from(new Set([...(symbols?symbols.split(','):[]), ...wl.symbols])).join(',')) } catch {}
          e.target.value = ''
        }} className="select">
          <option value="">—</option>
          {lists.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={testRun} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700">Test</button>
        {err && <span className="text-rose-400">{err}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <a href={buildUrl({ format: 'csv' })} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700">Download Events CSV</a>
        <a href={buildUrl({ format: 'summary' })} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700">Download Summary CSV</a>
        <a href={buildUrl({ format: 'summary-json' })} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700">Download Summary JSON</a>
      </div>
    </div>
  )
}

