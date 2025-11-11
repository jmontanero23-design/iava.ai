import React, { useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

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
    <div>
      <div className="text-xs text-slate-400 mb-1">{title}</div>
      <div className="space-y-1 max-h-64 overflow-auto pr-1">
        {!items?.length && <div className="text-xs text-slate-500">No results</div>}
        {items?.map(it => (
          <div key={it.symbol} className="border border-slate-800 rounded px-2 py-1 flex items-center justify-between">
            <div className="text-slate-200">{it.symbol} <span className="text-slate-500 text-xs">{Math.round(it.score)}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => onLoadSymbol?.(it.symbol, timeframe)} className="text-xs bg-slate-800 hover:bg-slate-700 rounded px-2 py-0.5 border border-slate-700">Load</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Market Scanner <InfoPopover title="Scanner">Scans a symbol list and surfaces the highest Unicorn Scores for longs/shorts.\n\nTips:\n- Enable Daily to require Daily Pivot + Ichimoku agreement.\n- Enable Consensus to require secondary timeframe alignment (Chart’s Consensus Bonus = +10).\n- Threshold applies after gating. Counts show what was filtered.</InfoPopover>
          {matched && (
            <span className="px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300 bg-emerald-900/20 text-[10px] inline-flex items-center gap-1">
              matched
              <InfoPopover title="Matched to chart">Timeframe, Daily gating, and Bonus +10 match the chart’s current settings.</InfoPopover>
            </span>
          )}
          <button onClick={() => { try { window.dispatchEvent(new CustomEvent('iava.help', { detail: { question: 'How should I configure the Scanner for this market?', context: { timeframe, threshold, enforceDaily, requireConsensus } } })) } catch {} }} className="text-xs text-slate-400 underline ml-2">Ask AI</button>
        </h3>
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
          <label className="inline-flex items-center gap-2">Asset
            <select value={assetClass} onChange={e=>{ setAssetClass(e.target.value); setUniverse('manual') }} className="select">
              <option value="stocks">Stocks</option>
              <option value="crypto">Crypto</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2">Universe
            <select value={universe} onChange={e=>setUniverse(e.target.value)} className="select">
              <option value="manual">Manual</option>
              {assetClass === 'stocks' && <option value="all">All (US active)</option>}
              {assetClass === 'crypto' && <option value="popular">Popular (crypto)</option>}
            </select>
          </label>
          <label className="inline-flex items-center gap-2">Threshold
            <input type="number" min={0} max={100} value={threshold} onChange={e=>setThreshold(parseInt(e.target.value,10)||0)} className="input w-16" />
          </label>
          <label className="inline-flex items-center gap-2">Top
            <input type="number" min={1} max={100} value={top} onChange={e=>setTop(Math.max(1,parseInt(e.target.value,10)||10))} className="input w-16" />
          </label>
          <label className="inline-flex items-center gap-2"><input aria-label="Daily confluence" className="checkbox" type="checkbox" checked={enforceDaily} onChange={e=>setEnforceDaily(e.target.checked)} />Daily <InfoPopover title="Daily Confluence">Requires Daily Pivot + Ichimoku agreement (bullish for longs, bearish for shorts). Tightens quality at the expense of fewer candidates.</InfoPopover></label>
          <label className="inline-flex items-center gap-2"><input aria-label="Consensus alignment" className="checkbox" type="checkbox" checked={requireConsensus} onChange={e=>setRequireConsensus(e.target.checked)} />Consensus <InfoPopover title="Consensus (secondary TF)">Requires primary trend to match a secondary timeframe (e.g., 1→5, 5→15min). Filters misaligned setups; pair with Bonus +10 for chart parity.</InfoPopover></label>
          <label className="inline-flex items-center gap-2"><input className="checkbox" type="checkbox" checked={consensusBonus} onChange={e=>setConsensusBonus(e.target.checked)} />Bonus +10 <InfoPopover title="Consensus Bonus (+10)">Adds +10 to the score when secondary timeframe trend aligns with the primary (same as the chart’s Consensus Bonus). Use with Consensus gating for stricter filtering, or alone to boost aligned names.</InfoPopover></label>
          <button onClick={matchChart} className="btn btn-xs" title="Copy timeframe, Daily, and Bonus +10 from the chart">Match chart</button>
          <button onClick={useChartConsensus} className="btn btn-xs" title="Require secondary TF alignment (same logic the chart uses)">Use chart consensus</button>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" className="checkbox" checked={autoRunOnMatch} onChange={e=>setAutoRunOnMatch(e.target.checked)} />
            Auto-run
            <InfoPopover title="Auto-run">Automatically runs a scan right after you Match chart or Use chart consensus.</InfoPopover>
          </label>
          <button onClick={() => {
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
          }} className="btn btn-xs" title="Copy a link that runs this scan via API">Copy scan link</button>
          <button onClick={async()=>{ if (universe === 'all') await fullScanAll(); else await run(); }} disabled={loading} className="btn btn-xs">{loading ? 'Scanning…' : 'Scan'}</button>
          {universe === 'all' && (
            <button onClick={()=>{ abortRef.current.stop = true; setProgress('Stopping…') }} disabled={!loading} className="btn btn-xs">Stop</button>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-400">Symbols (paste or import) {assetClass === 'crypto' ? 'e.g., BTC/USD, ETH/USD' : ''}</div>
      <textarea value={symbols} onChange={e=>setSymbols(e.target.value)} className="mt-1 w-full h-16 bg-slate-800 border border-slate-700 rounded p-2 text-sm" />
      <div className="mt-1 flex items-center gap-2 text-xs">
        <button onClick={()=>setTop(100)} className="btn btn-xs" title="Show up to 100 results">Top 100</button>
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
          const mod = await import('../utils/watchlists.js'); const wl = mod.get(name)
          if (wl?.symbols?.length) setSymbols(Array.from(new Set([...(symbols?symbols.split(','):[]), ...wl.symbols])).join(','))
          e.target.value = ''
        }} className="select">
          <option value="">—</option>
          {lists.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {assetClass === 'crypto' && universe === 'popular' && (
          <button onClick={loadPopularCrypto} className="btn btn-xs">Load popular</button>
        )}
        {progress && <span className="text-slate-400">{progress}</span>}
      </div>
      {err && <div className="text-xs text-rose-400 mt-2">{err}</div>}
      {res && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex items-center gap-2 text-xs">
            <button onClick={async()=>{
              try {
                setAiLoading(true); setAiErr(''); setAiSummary(null)
                const r = await fetch('/api/llm/scan_summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result: res }) })
                const j = await r.json()
                if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
                setAiSummary(j.summary || null)
              } catch (e) {
                setAiErr(String(e.message || e))
              } finally { setAiLoading(false) }
            }} disabled={aiReady===false || aiLoading} className="btn btn-xs disabled:opacity-50">{aiLoading ? 'Summarizing…' : 'Summarize (AI)'}</button>
            {aiErr && <span className="text-rose-400">{aiErr}</span>}
          </div>
          {aiSummary && (
            <div className="md:col-span-2 text-sm p-2 rounded border border-slate-700 bg-slate-900/60">
              <div className="text-xs text-slate-400 mb-1">AI Summary</div>
              <ul className="list-disc pl-5 text-slate-200">
                {(aiSummary.bullets||[]).map((b,i)=>(<li key={i}>{b}</li>))}
              </ul>
              {aiSummary.quick_take ? <div className="text-xs text-slate-400 mt-1">Quick take: {aiSummary.quick_take}</div> : null}
            </div>
          )}
          <div className="md:col-span-2 text-xs flex items-center gap-2 mb-1">
            <span className="text-slate-400">Results Tools</span>
            <button onClick={() => { try { const txt = JSON.stringify(res, null, 2); navigator.clipboard.writeText(txt); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Scan results copied', type: 'success' } })) } catch {} }} className="btn btn-xs">Copy results</button>
            <a className="btn btn-xs" href={`/api/scan?${new URLSearchParams({ symbols, timeframe, threshold: String(threshold), top: String(top), enforceDaily: enforceDaily ? '1' : '0', requireConsensus: requireConsensus ? '1' : '0', consensusBonus: consensusBonus ? '1' : '0', assetClass }).toString()}`} target="_blank" rel="noreferrer">Open API</a>
          </div>
          <Section title={`Top Longs (${res.longs?.length || 0})`} items={res.longs} />
          <Section title={`Top Shorts (${res.shorts?.length || 0})`} items={res.shorts} />
          <div className="md:col-span-2 flex items-center gap-2 text-xs mt-2">
            <span className="text-slate-400">Save to watchlist</span>
            <input value={wlName} onChange={e=>setWlName(e.target.value)} className="select" />
            <button onClick={async ()=>{
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
            }} className="btn btn-xs">Save</button>
            <button onClick={async ()=>{
              try { const { save, setActive } = await import('../utils/watchlists.js'); const base=(wlName||'scanner-top'); const name=base+"-longs"; const longs = (res.longs||[]).map(x=>x.symbol); save(name, longs); setActive(name); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Saved longs', type: 'success' } })) } catch { window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Save failed', type: 'error' } })) }
            }} className="btn btn-xs">Save Longs</button>
            <button onClick={async ()=>{
              try { const { save, setActive } = await import('../utils/watchlists.js'); const base=(wlName||'scanner-top'); const name=base+"-shorts"; const shorts = (res.shorts||[]).map(x=>x.symbol); save(name, shorts); setActive(name); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Saved shorts', type: 'success' } })) } catch { window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Save failed', type: 'error' } })) }
            }} className="btn btn-xs">Save Shorts</button>
            <button onClick={exportCsv} className="btn btn-xs">Export CSV</button>
            <button onClick={exportJson} className="btn btn-xs">Export JSON</button>
          </div>
          <div className="md:col-span-2 text-xs text-slate-500">
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
