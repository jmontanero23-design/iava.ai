import React, { useState } from 'react'
import InfoPopover from './InfoPopover.jsx'
import { SkeletonScannerResults } from './SkeletonLoader.jsx'

export default function ScannerPanel({ onLoadSymbol, defaultTimeframe = '5Min', currentTimeframe, currentEnforceDaily, currentConsensusBonus }) {
  const [symbols, setSymbols] = useState('SPY,QQQ,AAPL,MSFT,NVDA,TSLA,AMZN,META,GOOGL,NFLX')
  const [timeframe, setTimeframe] = useState(defaultTimeframe)
  const [threshold, setThreshold] = useState(70)
  const [top, setTop] = useState(20)
  const [enforceDaily, setEnforceDaily] = useState(true)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [res, setRes] = useState(null)
  const [wlName, setWlName] = useState('scanner-top')
  const [universe, setUniverse] = useState('manual') // manual | all
  const [progress, setProgress] = useState('')
  const [lists, setLists] = useState([])
  const abortRef = React.useRef({ stop: false })
  const [requireConsensus, setRequireConsensus] = useState(false)
  const [consensusBonus, setConsensusBonus] = useState(false)
  const [assetClass, setAssetClass] = useState('stocks') // stocks | crypto
  const [exporting, setExporting] = useState(false)
  const [autoRunOnMatch, setAutoRunOnMatch] = useState(true)
  const [aiReady, setAiReady] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiErr, setAiErr] = useState('')
  const [aiSummary, setAiSummary] = useState(null)

  const matched = (
    (!!currentTimeframe && timeframe === currentTimeframe) &&
    (typeof currentEnforceDaily === 'boolean' ? enforceDaily === currentEnforceDaily : true) &&
    (typeof currentConsensusBonus === 'boolean' ? consensusBonus === currentConsensusBonus : true)
  )

  function useChartConsensus() {
    try {
      setRequireConsensus(true)
      if (typeof currentConsensusBonus === 'boolean') setConsensusBonus(currentConsensusBonus)
      if (autoRunOnMatch) setTimeout(() => { run() }, 60)
    } catch {}
  }

  React.useEffect(() => { (async () => { try { const r = await fetch('/api/health'); const j = await r.json(); setAiReady(Boolean(j?.api?.llm?.configured)) } catch { setAiReady(false) } })() }, [])

  function matchChart() {
    try {
      if (currentTimeframe) setTimeframe(currentTimeframe)
      if (typeof currentEnforceDaily === 'boolean') setEnforceDaily(currentEnforceDaily)
      if (typeof currentConsensusBonus === 'boolean') setConsensusBonus(currentConsensusBonus)
      if (autoRunOnMatch) setTimeout(() => { run() }, 60)
    } catch {}
  }

  function exportCsv() {
    try {
      if (!res) return
      const rows = []
      rows.push('symbol,dir,score,time,close')
      const add = (arr, dir) => (arr||[]).forEach(r => {
        const iso = r.last?.time ? new Date(r.last.time*1000).toISOString() : ''
        const close = r.last?.close != null ? String(r.last.close) : ''
        rows.push(`${r.symbol},${dir},${Math.round(r.score)},${iso},${close}`)
      })
      add(res.longs, 'long'); add(res.shorts, 'short')
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `scan_${timeframe}_th${threshold}_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch {}
  }

  function exportJson() {
    try {
      if (!res) return
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `scan_${timeframe}_th${threshold}_${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch {}
  }

  async function run() {
    try {
      setLoading(true); setErr('')
      const qs = new URLSearchParams({ symbols, timeframe, threshold: String(threshold), top: String(top), enforceDaily: enforceDaily ? '1' : '0', requireConsensus: requireConsensus ? '1' : '0', consensusBonus: consensusBonus ? '1' : '0', assetClass })
      const r = await fetch(`/api/scan?${qs.toString()}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setRes(j)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  // Allow global trigger to run the scanner (from Command Palette)
  React.useEffect(() => {
    const fn = () => { if (universe === 'all') fullScanAll(); else run() }
    window.addEventListener('iava.scan', fn)
    return () => window.removeEventListener('iava.scan', fn)
  }, [universe, symbols, timeframe, threshold, top, enforceDaily, requireConsensus, consensusBonus, assetClass])

  async function fullScanAll() {
    try {
      setLoading(true); setErr(''); setProgress('Fetching universe…')
      abortRef.current.stop = false
      const ur = await fetch('/api/universe')
      const uj = await ur.json()
      if (!ur.ok) throw new Error(uj?.error || `HTTP ${ur.status}`)
      const syms = assetClass === 'crypto' ? (uj.symbols || []).slice() : (uj.symbols || []).slice()
      if (!syms.length) throw new Error('Universe is empty')
      const chunk = (arr, n) => arr.reduce((acc, x, i) => { if (i % n === 0) acc.push([]); acc[acc.length-1].push(x); return acc }, [])
      const chunks = chunk(syms, 25)
      const acc = { longs: [], shorts: [] }
      let totalScanned = 0
      let totals = { neutralSkipped: 0, consensusBlocked: 0, dailyBlocked: 0, thresholdRejected: 0, acceptedLongs: 0, acceptedShorts: 0 }
      for (let i = 0; i < chunks.length; i++) {
        if (abortRef.current.stop) break
        setProgress(`Scanning ${i+1}/${chunks.length}… L${acc.longs.length} S${acc.shorts.length}`)
        const list = chunks[i].join(',')
        const qs = new URLSearchParams({ symbols: list, timeframe, threshold: String(threshold), top: String(top), enforceDaily: enforceDaily ? '1' : '0', returnAll: '1', requireConsensus: requireConsensus ? '1' : '0', consensusBonus: consensusBonus ? '1' : '0', assetClass })
        const r = await fetch(`/api/scan?${qs.toString()}`)
        const j = await r.json()
        if (r.ok) {
          acc.longs.push(...(j.longs || []))
          acc.shorts.push(...(j.shorts || []))
          totalScanned += chunks[i].length
          if (j.counts) {
            totals.neutralSkipped += j.counts.neutralSkipped || 0
            totals.consensusBlocked += j.counts.consensusBlocked || 0
            totals.dailyBlocked += j.counts.dailyBlocked || 0
            totals.thresholdRejected += j.counts.thresholdRejected || 0
            totals.acceptedLongs += j.counts.acceptedLongs || 0
            totals.acceptedShorts += j.counts.acceptedShorts || 0
          }
          setProgress(`Scanning ${i+1}/${chunks.length}… scanned ${totalScanned}/${syms.length} · L${acc.longs.length} S${acc.shorts.length}`)
        }
      }
      acc.longs.sort((a,b)=>b.score-a.score)
      acc.shorts.sort((a,b)=>b.score-a.score)
      setRes({ timeframe, threshold, enforceDaily, universe: syms.length, longs: acc.longs.slice(0, top), shorts: acc.shorts.slice(0, top), counts: totals })
      setProgress('')
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }
  async function loadPopularCrypto() {
    try {
      setLoading(true); setErr(''); setProgress('Loading popular crypto…')
      const ur = await fetch('/api/universe?assetClass=crypto')
      const uj = await ur.json()
      if (!ur.ok) throw new Error(uj?.error || `HTTP ${ur.status}`)
      const list = (uj.symbols || []).join(',')
      setSymbols(list)
      setProgress('')
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  // Saved watchlists (local) to import
  async function loadSavedLists() {
    try {
      const mod = await import('../utils/watchlists.js')
      setLists(mod.listNames())
    } catch {}
  }
  React.useEffect(()=>{ loadSavedLists() }, [])

  const Section = ({ title, items }) => (
    <div className="relative">
      {/* Premium section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1 w-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" />
        <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">{title}</div>
      </div>
      <div className="space-y-2 max-h-64 overflow-auto pr-1 styled-scrollbar">
        {!items?.length && <div className="text-sm text-slate-400 italic p-4 text-center bg-slate-800/20 rounded-lg border border-slate-700/30">No results</div>}
        {items?.map(it => (
          <div key={it.symbol} className="relative group row-highlight">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 blur-lg opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
            <div className="relative flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:border-cyan-500/40 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-slate-100 transition-colors group-hover:text-cyan-300">{it.symbol}</span>
                <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold scale-hover">{Math.round(it.score)}</span>
              </div>
              <button
                onClick={() => onLoadSymbol?.(it.symbol, timeframe)}
                className="btn-primary btn-sm ripple"
              >
                Load
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="panel-header">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-2xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />

        <div className="relative space-y-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="panel-icon" style={{ fontSize: 'var(--text-2xl)' }}>🔍</span>
              <h3 className="font-bold bg-gradient-to-r from-cyan-200 to-indigo-300 bg-clip-text text-transparent inline-flex items-center gap-2" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
                Market Scanner
                <InfoPopover title="Scanner">Scans a symbol list and surfaces the highest Unicorn Scores for longs/shorts.\n\nTips:\n- Enable Daily to require Daily Pivot + Ichimoku agreement.\n- Enable Consensus to require secondary timeframe alignment (Chart's Consensus Bonus = +10).\n- Threshold applies after gating. Counts show what was filtered.</InfoPopover>
                {matched && (
                  <span className="px-2 py-1 border border-emerald-600 text-emerald-300 bg-emerald-900/20 inline-flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-full)' }}>
                    matched
                    <InfoPopover title="Matched to chart">Timeframe, Daily gating, and Bonus +10 match the chart's current settings.</InfoPopover>
                  </span>
                )}
                <button onClick={() => { try { window.dispatchEvent(new CustomEvent('iava.help', { detail: { question: 'How should I configure the Scanner for this market?', context: { timeframe, threshold, enforceDaily, requireConsensus } } })) } catch {} }} className="text-slate-400 underline" style={{ fontSize: 'var(--text-xs)' }}>Ask AI</button>
              </h3>
            </div>
          </div>

          {/* Controls Section - Better organized */}
          <div className="space-y-3">
            {/* Row 1: Core Config */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <label className="inline-flex items-center gap-2">
                <span className="text-slate-400 font-semibold">TF</span>
                <select value={timeframe} onChange={e=>setTimeframe(e.target.value)} className="select">
                  <option value="1Min">1Min</option>
                  <option value="5Min">5Min</option>
                  <option value="15Min">15Min</option>
                  <option value="1Hour">1Hour</option>
                  <option value="1Day">1Day</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Asset</span>
                <select value={assetClass} onChange={e=>{ setAssetClass(e.target.value); setUniverse('manual') }} className="select">
                  <option value="stocks">Stocks</option>
                  <option value="crypto">Crypto</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Universe</span>
                <select value={universe} onChange={e=>setUniverse(e.target.value)} className="select">
                  <option value="manual">Manual</option>
                  {assetClass === 'stocks' && <option value="all">All (US active)</option>}
                  {assetClass === 'crypto' && <option value="popular">Popular (crypto)</option>}
                </select>
              </label>
              <label className="inline-flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Threshold</span>
                <input type="number" min={0} max={100} value={threshold} onChange={e=>setThreshold(parseInt(e.target.value,10)||0)} className="input w-16" />
              </label>
              <label className="inline-flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Top</span>
                <input type="number" min={1} max={100} value={top} onChange={e=>setTop(Math.max(1,parseInt(e.target.value,10)||10))} className="input w-16" />
              </label>
            </div>

            {/* Row 2: Filters */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <label className="inline-flex items-center gap-2">
                <input aria-label="Daily confluence" className="checkbox" type="checkbox" checked={enforceDaily} onChange={e=>setEnforceDaily(e.target.checked)} />
                <span className="text-slate-300">Daily</span>
                <InfoPopover title="Daily Confluence">Requires Daily Pivot + Ichimoku agreement (bullish for longs, bearish for shorts). Tightens quality at the expense of fewer candidates.</InfoPopover>
              </label>
              <label className="inline-flex items-center gap-2">
                <input aria-label="Consensus alignment" className="checkbox" type="checkbox" checked={requireConsensus} onChange={e=>setRequireConsensus(e.target.checked)} />
                <span className="text-slate-300">Consensus</span>
                <InfoPopover title="Consensus (secondary TF)">Requires primary trend to match a secondary timeframe (e.g., 1→5, 5→15min). Filters misaligned setups; pair with Bonus +10 for chart parity.</InfoPopover>
              </label>
              <label className="inline-flex items-center gap-2">
                <input className="checkbox" type="checkbox" checked={consensusBonus} onChange={e=>setConsensusBonus(e.target.checked)} />
                <span className="text-slate-300">Bonus +10</span>
                <InfoPopover title="Consensus Bonus (+10)">Adds +10 to the score when secondary timeframe trend aligns with the primary (same as the chart's Consensus Bonus). Use with Consensus gating for stricter filtering, or alone to boost aligned names.</InfoPopover>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="checkbox" checked={autoRunOnMatch} onChange={e=>setAutoRunOnMatch(e.target.checked)} />
                <span className="text-slate-300">Auto-run</span>
                <InfoPopover title="Auto-run">Automatically runs a scan right after you Match chart or Use chart consensus.</InfoPopover>
              </label>
            </div>

            {/* Row 3: Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={matchChart}
                className="btn-secondary btn-sm"
                title="Copy timeframe, Daily, and Bonus +10 from the chart"
              >
                Match chart
              </button>
              <button
                onClick={useChartConsensus}
                className="btn-secondary btn-sm"
                title="Require secondary TF alignment (same logic the chart uses)"
              >
                Use chart consensus
              </button>
              <button
                onClick={() => {
                  try {
                    const qs = new URLSearchParams({ symbols, timeframe, threshold: String(threshold), top: String(top), enforceDaily: enforceDaily ? '1' : '0', requireConsensus: requireConsensus ? '1' : '0', consensusBonus: consensusBonus ? '1' : '0', assetClass })
                    const url = `${window.location.origin}/api/scan?${qs.toString()}`
                    const ta = document.createElement('textarea')
                    ta.value = url
                    document.body.appendChild(ta)
                    ta.select()
                    document.execCommand('copy')
                    document.body.removeChild(ta)
                    window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Scan link copied', type: 'success' } }))
                  } catch {}
                }}
                className="btn-ghost btn-sm"
                title="Copy a link that runs this scan via API"
              >
                Copy scan link
              </button>

              <div className="h-5 w-px bg-slate-700/50" />

              <button
                onClick={async()=>{ if (universe === 'all') await fullScanAll(); else await run(); }}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner-sm" />
                    <span>Scanning…</span>
                  </div>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Scan</span>
                  </>
                )}
              </button>
              {universe === 'all' && (
                <button
                  onClick={()=>{ abortRef.current.stop = true; setProgress('Stopping…') }}
                  disabled={!loading}
                  className="btn-danger btn-sm"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Symbols Section */}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-300">Symbols</span>
          <span className="text-xs text-slate-400">{assetClass === 'crypto' ? 'e.g., BTC/USD, ETH/USD' : 'paste or import'}</span>
        </div>
        <textarea
          aria-label="Symbols list"
          value={symbols}
          onChange={e=>setSymbols(e.target.value)}
          className="w-full h-20 bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500/50 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 transition-all"
          placeholder="Enter symbols separated by commas..."
        />

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={()=>setTop(100)}
            className="btn-ghost btn-xs"
            title="Show up to 100 results"
          >
            Top 100
          </button>
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
            className="text-xs"
          />
          <span className="text-xs text-slate-400">From saved list:</span>
          <select
            onChange={async (e)=>{
              const name = e.target.value; if (!name) return
              const mod = await import('../utils/watchlists.js'); const wl = mod.get(name)
              if (wl?.symbols?.length) setSymbols(Array.from(new Set([...(symbols?symbols.split(','):[]), ...wl.symbols])).join(','))
              e.target.value = ''
            }}
            className="select text-xs"
          >
            <option value="">—</option>
            {lists.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {assetClass === 'crypto' && universe === 'popular' && (
            <button
              onClick={loadPopularCrypto}
              className="btn-ghost btn-xs"
            >
              Load popular
            </button>
          )}
          {progress && (
            <div className="flex items-center gap-2 text-xs fade-in">
              <div className="spinner-sm" />
              <span className="text-cyan-400 font-semibold">{progress}</span>
            </div>
          )}
        </div>
      </div>

      {/* Premium Error Display */}
      {err && (
        <div className="mx-5 mb-3 p-3 bg-rose-600/10 border border-rose-500/30 rounded-lg flex items-start gap-2">
          <span className="text-rose-400 text-lg">⚠️</span>
          <span className="text-sm text-rose-300 font-medium">{err}</span>
        </div>
      )}

      {/* Premium Results Section */}
      {res && (
        <div className="p-5 pt-0 space-y-4">
          {/* AI Summary Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={async()=>{
                try {
                  setAiLoading(true); setAiErr(''); setAiSummary(null)
                  const r = await fetch('/api/llm/scan_summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result: res }) })
                  const j = await r.json()
                  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
                  setAiSummary(j.summary || null)
                } catch (e) {
                  setAiErr(String(e.message || e))
                } finally { setAiLoading(false) }
              }}
              disabled={aiReady===false || aiLoading}
              className="btn-secondary"
            >
              {aiLoading ? (
                <div className="flex items-center gap-2">
                  <div className="spinner-sm" />
                  <span>Summarizing…</span>
                </div>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Summarize (AI)</span>
                </>
              )}
            </button>
            {aiErr && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400">
                <span>⚠️</span>
                <span>{aiErr}</span>
              </div>
            )}
          </div>
          {/* Premium AI Summary Display */}
          {aiSummary && (
            <div className="relative group">
              <div className="absolute inset-0 bg-purple-600 blur-xl opacity-0 group-hover:opacity-5 rounded-xl transition-opacity" />
              <div className="relative p-4 bg-slate-800/40 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🤖</span>
                  <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Summary</span>
                </div>
                <ul className="list-disc pl-5 text-slate-200 space-y-1">
                  {(aiSummary.bullets||[]).map((b,i)=>(<li key={i} className="text-sm leading-relaxed">{b}</li>))}
                </ul>
                {aiSummary.quick_take && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-xs text-slate-400 font-semibold">Quick Take: </span>
                    <span className="text-xs text-slate-300">{aiSummary.quick_take}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 uppercase tracking-wider" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>Results Tools</span>
            <button
              onClick={() => { try { const txt = JSON.stringify(res, null, 2); navigator.clipboard.writeText(txt); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Scan results copied', type: 'success' } })) } catch {} }}
              className="btn-ghost btn-xs"
            >
              Copy results
            </button>
            <a
              className="btn-ghost btn-xs"
              href={`/api/scan?${new URLSearchParams({ symbols, timeframe, threshold: String(threshold), top: String(top), enforceDaily: enforceDaily ? '1' : '0', requireConsensus: requireConsensus ? '1' : '0', consensusBonus: consensusBonus ? '1' : '0', assetClass }).toString()}`}
              target="_blank"
              rel="noreferrer"
            >
              Open API
            </a>
          </div>

          {/* Premium Results Grid */}
          {loading && !res ? (
            <SkeletonScannerResults />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in">
              <Section title={`Top Longs (${res.longs?.length || 0})`} items={res.longs} />
              <Section title={`Top Shorts (${res.shorts?.length || 0})`} items={res.shorts} />
            </div>
          )}
          {/* Premium Watchlist Save Section */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 uppercase tracking-wider" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>Save to Watchlist</span>
            <input
              value={wlName}
              onChange={e=>setWlName(e.target.value)}
              className="input px-3 py-1 bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 text-slate-200"
              style={{ fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-lg)' }}
              placeholder="watchlist name"
            />
            <button
              onClick={async ()=>{
                try {
                  const { save, setActive } = await import('../utils/watchlists.js')
                  const longs = (res.longs||[]).map(x=>x.symbol)
                  const shorts = (res.shorts||[]).map(x=>x.symbol)
                  const combined = Array.from(new Set([...longs, ...shorts]))
                  const listName = wlName || 'scanner-top'
                  save(listName, combined)
                  setActive(listName)
                  window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Watchlist saved', type: 'success' } }))
                } catch (e) { window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Save failed', type: 'error' } })) }
              }}
              className="btn-success btn-xs"
            >
              Save All
            </button>
            <button
              onClick={async ()=>{
                try { const { save, setActive } = await import('../utils/watchlists.js'); const base=(wlName||'scanner-top'); const name=base+"-longs"; const longs = (res.longs||[]).map(x=>x.symbol); save(name, longs); setActive(name); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Saved longs', type: 'success' } })) } catch { window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Save failed', type: 'error' } })) }
              }}
              className="btn-success btn-xs"
            >
              Save Longs
            </button>
            <button
              onClick={async ()=>{
                try { const { save, setActive } = await import('../utils/watchlists.js'); const base=(wlName||'scanner-top'); const name=base+"-shorts"; const shorts = (res.shorts||[]).map(x=>x.symbol); save(name, shorts); setActive(name); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Saved shorts', type: 'success' } })) } catch { window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Save failed', type: 'error' } })) }
              }}
              className="btn-danger btn-xs"
            >
              Save Shorts
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <button
              onClick={exportCsv}
              className="btn-ghost btn-xs"
            >
              Export CSV
            </button>
            <button
              onClick={exportJson}
              className="btn-ghost btn-xs"
            >
              Export JSON
            </button>
          </div>

          {/* Premium Metadata Display */}
          <div className="text-xs text-slate-400 leading-relaxed">
            {assetClass.toUpperCase()} • Universe {res.universe} • TF {res.timeframe} • TH ≥{res.threshold} • Daily {res.enforceDaily ? 'On' : 'Off'} • Consensus {requireConsensus ? 'On' : 'Off'} • Bonus {consensusBonus ? '+10' : 'Off'} • Results L{res.longs?.length||0}/S{res.shorts?.length||0}
            {res.counts ? (
              <>
                <span className="mx-2">•</span>
                <span title="Symbols without a clear long/short direction">• Neutral {res.counts.neutralSkipped ?? 0}</span>
                {requireConsensus ? <span className="ml-2" title="Filtered by secondary TF misalignment">⚠ Consensus {res.counts.consensusBlocked ?? 0}</span> : null}
                {res.enforceDaily ? <span className="ml-2" title="Filtered by Daily confluence mismatch">⚠ Daily {res.counts.dailyBlocked ?? 0}</span> : null}
                <span className="ml-2" title="Below threshold after gating">↓ Below TH {res.counts.thresholdRejected ?? 0}</span>
                <span className="ml-2" title="Accepted before Top N slicing">✓ Accepted L{res.counts.acceptedLongs ?? 0}/S{res.counts.acceptedShorts ?? 0}</span>
                <span className="ml-2" title="Visible results after Top N">• Showing top {top}</span>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
