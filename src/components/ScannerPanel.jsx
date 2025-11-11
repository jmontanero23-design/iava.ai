import React, { useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function ScannerPanel({ onLoadSymbol, defaultTimeframe = '5Min' }) {
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

  async function loadSavedLists() {
    try {
      const mod = await import('../utils/watchlists.js')
      setLists(mod.listNames())
    } catch {}
  }
  React.useEffect(()=>{ loadSavedLists() }, [])

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header with Logo Badge */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              Market Scanner
            </h3>
            <p className="text-xs text-slate-400">Discover high-probability setups across the market</p>
          </div>
          <InfoPopover title="Market Scanner">
            Scans symbol lists and surfaces the highest Unicorn Scores for longs/shorts.
            <br/><br/>
            <strong>Tips:</strong>
            <br/>• Enable <strong>Daily</strong> to require Daily Pivot + Ichimoku agreement
            <br/>• Enable <strong>Consensus</strong> to require secondary timeframe alignment
            <br/>• Threshold applies after gating filters
          </InfoPopover>
          <button
            onClick={() => { try { window.dispatchEvent(new CustomEvent('iava.help', { detail: { question: 'How should I configure the Scanner for this market?', context: { timeframe, threshold, enforceDaily, requireConsensus } } })) } catch {} }}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition-all duration-200 flex items-center gap-1"
            title="NLP Scanner (AI Feature #11)"
          >
            <span>🤖</span>
            <span>Ask AI</span>
          </button>
        </div>

        {/* Configuration Section */}
        <div className="panel-header mb-3">
          <span className="text-xs font-semibold text-slate-300">Configuration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {/* Timeframe */}
          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Timeframe</label>
            <select value={timeframe} onChange={e=>setTimeframe(e.target.value)} className="select w-full">
              <option value="1Min">1 Minute</option>
              <option value="5Min">5 Minutes</option>
              <option value="15Min">15 Minutes</option>
              <option value="1Hour">1 Hour</option>
              <option value="1Day">1 Day</option>
            </select>
          </div>

          {/* Asset Class */}
          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Asset Class</label>
            <select value={assetClass} onChange={e=>{ setAssetClass(e.target.value); setUniverse('manual') }} className="select w-full">
              <option value="stocks">US Stocks</option>
              <option value="crypto">Cryptocurrency</option>
            </select>
          </div>

          {/* Universe */}
          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Universe</label>
            <select value={universe} onChange={e=>setUniverse(e.target.value)} className="select w-full">
              <option value="manual">Manual List</option>
              {assetClass === 'stocks' && <option value="all">All US Active Stocks</option>}
              {assetClass === 'crypto' && <option value="popular">Popular Crypto</option>}
            </select>
          </div>

          {/* Threshold */}
          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Score Threshold</label>
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={e=>setThreshold(parseInt(e.target.value,10)||0)}
              className="input w-full"
            />
          </div>

          {/* Top N */}
          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Top Results</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={top}
                onChange={e=>setTop(Math.max(1,parseInt(e.target.value,10)||10))}
                className="input flex-1"
              />
              <button onClick={()=>setTop(100)} className="btn btn-xs">100</button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="panel-header mb-3">
          <span className="text-xs font-semibold text-slate-300">Quality Filters</span>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox accent-indigo-500"
              checked={enforceDaily}
              onChange={e=>setEnforceDaily(e.target.checked)}
            />
            <span className="text-sm text-slate-300">Daily Confluence</span>
            <InfoPopover title="Daily Confluence">
              Requires Daily Pivot + Ichimoku agreement (bullish for longs, bearish for shorts).
              Tightens quality at the expense of fewer candidates.
            </InfoPopover>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox accent-violet-500"
              checked={requireConsensus}
              onChange={e=>setRequireConsensus(e.target.checked)}
            />
            <span className="text-sm text-slate-300">Require Consensus</span>
            <InfoPopover title="Consensus Alignment">
              Requires primary trend to match a secondary timeframe (e.g., 1→5, 5→15min).
              Filters misaligned setups; pair with Bonus +10 for chart parity.
            </InfoPopover>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox accent-emerald-500"
              checked={consensusBonus}
              onChange={e=>setConsensusBonus(e.target.checked)}
            />
            <span className="text-sm text-slate-300">Consensus Bonus +10</span>
            <InfoPopover title="Consensus Bonus">
              Adds +10 to the score when secondary timeframe trend aligns with the primary.
              Use with Consensus gating for stricter filtering, or alone to boost aligned names.
            </InfoPopover>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async()=>{ if (universe === 'all') await fullScanAll(); else await run(); }}
            disabled={loading}
            className="btn btn-primary px-4 py-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Scanning…
              </span>
            ) : 'Run Scan'}
          </button>

          {universe === 'all' && (
            <button
              onClick={()=>{ abortRef.current.stop = true; setProgress('Stopping…') }}
              disabled={!loading}
              className="btn btn-danger"
            >
              Stop
            </button>
          )}

          {progress && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              {progress}
            </div>
          )}
        </div>

        {err && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-sm text-rose-400">{err}</p>
          </div>
        )}
      </div>

      {/* Symbol Input Section */}
      <div className="card p-4">
        <div className="panel-header mb-3">
          <span className="text-xs font-semibold text-slate-300">Symbol Input</span>
          <span className="text-xs text-slate-500 ml-2">
            {assetClass === 'crypto' ? '(e.g., BTC/USD, ETH/USD, SOL/USD)' : '(e.g., SPY, QQQ, AAPL, MSFT)'}
          </span>
        </div>

        <textarea
          value={symbols}
          onChange={e=>setSymbols(e.target.value)}
          className="input w-full h-20 resize-none font-mono text-sm"
          placeholder="Enter symbols separated by commas..."
        />

        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="text-slate-400">Import from:</span>

          <label className="btn btn-xs cursor-pointer">
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={async (e)=>{
                const f = e.target.files?.[0]; if (!f) return
                const txt = await f.text()
                const toks = txt.toUpperCase().split(/[^A-Z0-9_\.\-\/]+/).filter(Boolean)
                const uniq = Array.from(new Set(toks)).join(',')
                setSymbols(uniq)
                e.target.value = ''
              }}
            />
            File (.csv/.txt)
          </label>

          <select
            onChange={async (e)=>{
              const name = e.target.value; if (!name) return
              const mod = await import('../utils/watchlists.js'); const wl = mod.get(name)
              if (wl?.symbols?.length) setSymbols(Array.from(new Set([...(symbols?symbols.split(','):[]), ...wl.symbols])).join(','))
              e.target.value = ''
            }}
            className="select text-xs"
          >
            <option value="">Watchlist…</option>
            {lists.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          {assetClass === 'crypto' && universe === 'popular' && (
            <button onClick={loadPopularCrypto} className="btn btn-xs">
              Load Popular Crypto
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      {res && (
        <div className="space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat-tile">
              <div className="stat-icon">
                <span className="text-lg">📊</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Universe</div>
                <div className="stat-value">{res.universe || 0}</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
                <span className="text-lg">📈</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Longs</div>
                <div className="stat-value text-emerald-400">{res.longs?.length || 0}</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-rose-500/20 to-rose-600/20">
                <span className="text-lg">📉</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Shorts</div>
                <div className="stat-value text-rose-400">{res.shorts?.length || 0}</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-violet-500/20 to-violet-600/20">
                <span className="text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Threshold</div>
                <div className="stat-value">≥{res.threshold}</div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          {res.counts && (
            <div className="card p-4">
              <div className="panel-header mb-3">
                <span className="text-xs font-semibold text-slate-300">Filter Pipeline</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-slate-500 text-xs">Neutral</div>
                  <div className="text-slate-300 font-semibold">{res.counts.neutralSkipped ?? 0}</div>
                </div>
                {requireConsensus && (
                  <div className="text-center">
                    <div className="text-amber-500 text-xs">⚠ Consensus</div>
                    <div className="text-amber-400 font-semibold">{res.counts.consensusBlocked ?? 0}</div>
                  </div>
                )}
                {res.enforceDaily && (
                  <div className="text-center">
                    <div className="text-amber-500 text-xs">⚠ Daily</div>
                    <div className="text-amber-400 font-semibold">{res.counts.dailyBlocked ?? 0}</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-rose-500 text-xs">Below TH</div>
                  <div className="text-rose-400 font-semibold">{res.counts.thresholdRejected ?? 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-500 text-xs">✓ Long</div>
                  <div className="text-emerald-400 font-semibold">{res.counts.acceptedLongs ?? 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-rose-500 text-xs">✓ Short</div>
                  <div className="text-rose-400 font-semibold">{res.counts.acceptedShorts ?? 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Longs */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-emerald-400">
                  Top Longs ({res.longs?.length || 0})
                </h4>
                <span className="logo-badge scale-75">
                  <img src="/logo.svg" alt="" className="w-4 h-4" />
                </span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {!res.longs?.length && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No long setups found
                  </div>
                )}
                {res.longs?.map(it => (
                  <div key={it.symbol} className="tile hover:scale-100 flex items-center justify-between p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-100 font-semibold">{it.symbol}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono">
                          {Math.round(it.score)}
                        </span>
                      </div>
                      {it.last?.close && (
                        <div className="text-xs text-slate-400 mt-1">
                          ${it.last.close.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onLoadSymbol?.(it.symbol, timeframe)}
                      className="btn btn-xs"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Shorts */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-rose-400">
                  Top Shorts ({res.shorts?.length || 0})
                </h4>
                <span className="logo-badge scale-75">
                  <img src="/logo.svg" alt="" className="w-4 h-4" />
                </span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {!res.shorts?.length && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No short setups found
                  </div>
                )}
                {res.shorts?.map(it => (
                  <div key={it.symbol} className="tile hover:scale-100 flex items-center justify-between p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-100 font-semibold">{it.symbol}</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono">
                          {Math.round(it.score)}
                        </span>
                      </div>
                      {it.last?.close && (
                        <div className="text-xs text-slate-400 mt-1">
                          ${it.last.close.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onLoadSymbol?.(it.symbol, timeframe)}
                      className="btn btn-xs"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export & Save Section */}
          <div className="card p-4">
            <div className="panel-header mb-3">
              <span className="text-xs font-semibold text-slate-300">Save & Export</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Watchlist name:</span>
              <input
                value={wlName}
                onChange={e=>setWlName(e.target.value)}
                className="input w-48 text-sm"
                placeholder="e.g., scanner-top"
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
                    alert('✓ Watchlist saved: ' + listName)
                  } catch (e) { alert('Save failed') }
                }}
                className="btn btn-success"
              >
                Save Combined
              </button>

              <button
                onClick={async ()=>{
                  try {
                    const { save, setActive } = await import('../utils/watchlists.js')
                    const base=(wlName||'scanner-top')
                    const name=base+"-longs"
                    const longs = (res.longs||[]).map(x=>x.symbol)
                    save(name, longs)
                    setActive(name)
                    alert('✓ Longs saved: ' + name)
                  } catch { alert('Save failed') }
                }}
                className="btn btn-xs"
              >
                Save Longs
              </button>

              <button
                onClick={async ()=>{
                  try {
                    const { save, setActive } = await import('../utils/watchlists.js')
                    const base=(wlName||'scanner-top')
                    const name=base+"-shorts"
                    const shorts = (res.shorts||[]).map(x=>x.symbol)
                    save(name, shorts)
                    setActive(name)
                    alert('✓ Shorts saved: ' + name)
                  } catch { alert('Save failed') }
                }}
                className="btn btn-xs"
              >
                Save Shorts
              </button>

              <div className="h-4 w-px bg-slate-700"></div>

              <button onClick={exportCsv} className="btn btn-xs">
                Export CSV
              </button>

              <button onClick={exportJson} className="btn btn-xs">
                Export JSON
              </button>
            </div>

            {/* Scan Metadata */}
            <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-500">
              {assetClass.toUpperCase()} • TF {res.timeframe} • TH ≥{res.threshold} •
              Daily {res.enforceDaily ? 'On' : 'Off'} •
              Consensus {requireConsensus ? 'On' : 'Off'} •
              Bonus {consensusBonus ? '+10' : 'Off'} •
              Top {top}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
