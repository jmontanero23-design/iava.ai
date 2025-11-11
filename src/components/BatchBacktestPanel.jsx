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
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const mod = await import('../utils/watchlists.js')
        setLists(mod.listNames())
      } catch {}
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
    for (const [k, v] of Object.entries(params)) qs.set(k, String(v))
    return `/api/backtest_batch?${qs.toString()}`
  }

  async function testRun() {
    try {
      setErr('')
      setTesting(true)
      const r = await fetch(buildUrl({ format: 'summary-json' }))
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      alert(`✅ Success! Summary rows: ${(j.summary || []).length}`)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setTesting(false)
    }
  }

  const symbolCount = (symbols || '').split(',').filter(s => s.trim()).length

  return (
    <div className="card p-4">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
              Batch Backtest
            </h3>
            <p className="text-xs text-slate-400">Test multiple symbols across historical data</p>
          </div>
          <InfoPopover title="Batch Backtest">
            Download per-symbol event CSVs or summary stats for a list of symbols. Server caches daily bars; use Summary JSON/CSV for quick comparisons.
          </InfoPopover>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        {/* Timeframe */}
        <div className="stat-tile">
          <div className="flex-1">
            <label className="text-[9px] text-slate-400 block mb-1">Timeframe</label>
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="1Min">1Min</option>
              <option value="5Min">5Min</option>
              <option value="15Min">15Min</option>
              <option value="1Hour">1Hour</option>
              <option value="1Day">1Day</option>
            </select>
          </div>
        </div>

        {/* Threshold */}
        <div className="stat-tile">
          <div className="flex-1">
            <label className="text-[9px] text-slate-400 block mb-1">Threshold</label>
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={e => setThreshold(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            />
          </div>
        </div>

        {/* Horizon */}
        <div className="stat-tile">
          <div className="flex-1">
            <label className="text-[9px] text-slate-400 block mb-1">Horizon (bars)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={horizon}
              onChange={e => setHorizon(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            />
          </div>
        </div>

        {/* Daily Filter */}
        <div className="stat-tile">
          <div className="flex-1">
            <label className="text-[9px] text-slate-400 block mb-1">Daily Filter</label>
            <select
              value={dailyFilter}
              onChange={e => setDailyFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="none">None</option>
              <option value="bull">Bull</option>
              <option value="bear">Bear</option>
            </select>
          </div>
        </div>

        {/* Include Regimes */}
        <div className="stat-tile col-span-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeRegimes}
              onChange={e => setIncludeRegimes(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-xs text-slate-200">Include Regime Analysis</label>
          </div>
        </div>
      </div>

      {/* Symbol Count */}
      <div className="mb-3">
        <div className="stat-tile bg-indigo-500/5 border-indigo-500/20 border">
          <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
            <span className="text-lg">📊</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-400">Symbols to Test</div>
            <div className="stat-value text-sm text-indigo-300">{symbolCount} symbol{symbolCount !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Symbols Input */}
      <div className="mb-3">
        <label className="text-xs text-slate-400 block mb-1">Symbol List (comma-separated)</label>
        <textarea
          value={symbols}
          onChange={e => setSymbols(e.target.value)}
          className="w-full h-20 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-slate-200 font-mono"
          placeholder="AAPL,MSFT,SPY,QQQ..."
        />
      </div>

      {/* Import Controls */}
      <div className="mb-4 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
        <div className="text-xs text-slate-400 mb-2">Import Symbols</div>
        <div className="flex flex-wrap gap-2">
          {/* File Upload */}
          <label className="flex-1 min-w-[140px] bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 cursor-pointer transition-colors">
            <span className="inline-flex items-center gap-2">
              📂 <span>Upload CSV/TXT</span>
            </span>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={async e => {
                const f = e.target.files?.[0]
                if (!f) return
                const txt = await f.text()
                const toks = txt
                  .toUpperCase()
                  .split(/[^A-Z0-9_\.\-]+/)
                  .filter(Boolean)
                const uniq = Array.from(new Set(toks)).join(',')
                setSymbols(uniq)
                e.target.value = ''
              }}
            />
          </label>

          {/* Watchlist Import */}
          <select
            onChange={async e => {
              const name = e.target.value
              if (!name) return
              try {
                const mod = await import('../utils/watchlists.js')
                const wl = mod.get(name)
                if (wl?.symbols?.length) {
                  const current = symbols ? symbols.split(',') : []
                  setSymbols(Array.from(new Set([...current, ...wl.symbols])).join(','))
                }
              } catch {}
              e.target.value = ''
            }}
            className="flex-1 min-w-[140px] bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 transition-colors"
          >
            <option value="">📋 Import from Watchlist...</option>
            {lists.map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Display */}
      {err && (
        <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
          <div className="text-xs text-rose-400">{err}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Test Button */}
        <button
          onClick={testRun}
          disabled={testing}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200"
        >
          {testing ? 'Testing...' : 'Test Run'}
        </button>

        {/* Download Buttons */}
        <a
          href={buildUrl({ format: 'csv' })}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200 text-center"
        >
          Events CSV
        </a>
        <a
          href={buildUrl({ format: 'summary' })}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200 text-center"
        >
          Summary CSV
        </a>
        <a
          href={buildUrl({ format: 'summary-json' })}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200 text-center"
        >
          Summary JSON
        </a>
      </div>
    </div>
  )
}
