import React, { useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function BacktestPanel({ symbol, timeframe, preset, chartThreshold, chartConsensusBonus }) {
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [threshold, setThreshold] = useState(70)
  const [horizon, setHorizon] = useState(10)
  const [showCurve, setShowCurve] = useState(true)
  const [dailyFilter, setDailyFilter] = useState('none')
  const [batchSymbols, setBatchSymbols] = useState('AAPL,MSFT,NVDA,SPY')
  const [includeSummaryRegimes, setIncludeSummaryRegimes] = useState(true)
  const [curveThresholds, setCurveThresholds] = useState('30,40,50,60,70,80,90')
  const [regimeCurves, setRegimeCurves] = useState(false)
  const [assetClass, setAssetClass] = useState('stocks')
  const [consensus, setConsensus] = useState(false)
  const [suggestMsg, setSuggestMsg] = useState('')
  const [hzs, setHzs] = useState('5,10,20')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiErr, setAiErr] = useState('')
  const [aiExp, setAiExp] = useState('')

  const presets = [
    { label: 'Intraday (70 / 10)', th: 70, hz: 10, regime: 'bull' },
    { label: 'Swing (65 / 20)', th: 65, hz: 20, regime: 'none' },
    { label: 'Mean Revert (55 / 5)', th: 55, hz: 5, regime: 'bear' },
  ]

  function matchChart() {
    try {
      if (preset) applyPresetParams()
      if (typeof chartThreshold === 'number') setThreshold(chartThreshold)
      if (typeof chartConsensusBonus === 'boolean') setConsensus(chartConsensusBonus)
    } catch {}
  }

  async function run() {
    try {
      setLoading(true); setErr('')
      const ths = encodeURIComponent(curveThresholds)
      const r = await fetch(`/api/backtest?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&curve=${showCurve ? 1 : 0}&ths=${ths}&hzs=${encodeURIComponent(hzs)}&dailyFilter=${encodeURIComponent(assetClass==='stocks'?dailyFilter:'none')}&regimeCurves=${assetClass==='stocks' && regimeCurves ? 1 : 0}&assetClass=${encodeURIComponent(assetClass)}&consensus=${consensus ? 1 : 0}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setRes(j)
      setAiExp(''); setAiErr('')
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  async function explainBacktest() {
    try {
      setAiLoading(true); setAiErr(''); setAiExp('')
      const question = 'Explain these backtest results, including why certain thresholds and horizons perform better, and give one concise takeaway.'
      const context = { symbol, timeframe, threshold, horizon, dailyFilter, consensus, result: res }
      const r = await fetch('/api/llm/help', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, context }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setAiExp(j.answer || '')
    } catch (e) {
      setAiErr(String(e.message || e))
    } finally {
      setAiLoading(false)
    }
  }

  function applyPresetParams() {
    if (!preset) return
    if (typeof preset.th === 'number') setThreshold(preset.th)
    if (typeof preset.hz === 'number') setHorizon(preset.hz)
    if (preset.regime === 'bull' || preset.regime === 'bear' || preset.regime === 'none') setDailyFilter(preset.regime === 'none' ? 'none' : preset.regime)
  }

  async function downloadJson() {
    try {
      const url = `/api/backtest?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&curve=${showCurve ? 1 : 0}&dailyFilter=${encodeURIComponent(dailyFilter)}&format=json`
      const r = await fetch(url)
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      const blob = new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `backtest_${symbol}_${timeframe}_th${threshold}_hz${horizon}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setErr(String(e.message || e))
    }
  }
  async function downloadSummaryJson() {
    try {
      const url = `/api/backtest?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${encodeURIComponent(assetClass==='stocks'?dailyFilter:'none')}&regimeCurves=${assetClass==='stocks' && regimeCurves ? 1 : 0}&format=summary-json`
      const r = await fetch(url)
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      const blob = new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `backtest_summary_${symbol}_${timeframe}_th${threshold}_hz${horizon}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setErr(String(e.message || e))
    }
  }
  async function downloadSummaryCsv() {
    try {
      const url = `/api/backtest?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${encodeURIComponent(assetClass==='stocks'?dailyFilter:'none')}&regimeCurves=${assetClass==='stocks' && regimeCurves ? 1 : 0}&format=summary`
      const r = await fetch(url)
      const txt = await r.text()
      if (!r.ok) throw new Error(txt || `HTTP ${r.status}`)
      const blob = new Blob([txt], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `backtest_summary_${symbol}_${timeframe}_th${threshold}_hz${horizon}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setErr(String(e.message || e))
    }
  }

  async function downloadCsv() {
    try {
      const url = `/api/backtest?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${encodeURIComponent(assetClass==='stocks'?dailyFilter:'none')}&format=csv`
      const r = await fetch(url)
      const txt = await r.text()
      if (!r.ok) throw new Error(txt || `HTTP ${r.status}`)
      const blob = new Blob([txt], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `backtest_${symbol}_${timeframe}_th${threshold}_hz${horizon}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setErr(String(e.message || e))
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Backtest Snapshot <InfoPopover title="Backtest">Runs a quick score-based scan: counts events where Score ≥ threshold and shows forward returns after horizon bars.</InfoPopover>
          <button onClick={() => { try { window.dispatchEvent(new CustomEvent('iava.help', { detail: { question: 'How do I interpret this backtest heatmap and pick thresholds?', context: { symbol, timeframe, threshold, horizon, consensus, dailyFilter, assetClass } } })) } catch {} }} className="text-xs text-slate-400 underline ml-2">Ask AI</button>
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-2">Asset
            <select value={assetClass} onChange={e=>setAssetClass(e.target.value)} className="select">
              <option value="stocks">Stocks</option>
              <option value="crypto">Crypto</option>
            </select>
          </label>
          {preset ? (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700" title="Preset parameters">
              Preset · TH {preset.th} · H {preset.hz} · {preset.regime || 'none'}
            </span>
          ) : null}
          <button onClick={matchChart} className="btn btn-xs" title="Apply preset params and use chart’s threshold and consensus bonus">Match chart</button>
          <span className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700" title="Current parameters (live)">
            Current · TH {threshold} · H {horizon} · {dailyFilter}
          </span>
          {preset ? (
            <button onClick={applyPresetParams} className="bg-slate-800 hover:bg-slate-700 rounded px-2 py-1 border border-slate-700">Apply Preset</button>
          ) : null}
          <label className="inline-flex items-center gap-2">Threshold <input type="number" min={0} max={100} value={threshold} onChange={e => setThreshold(parseInt(e.target.value,10)||0)} className="input w-16" /></label>
          <label className="inline-flex items-center gap-2">Horizon <input type="number" min={1} max={100} value={horizon} onChange={e => setHorizon(parseInt(e.target.value,10)||1)} className="input w-16" /></label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={showCurve} onChange={e=>setShowCurve(e.target.checked)} /> Curve</label>
          <div className="inline-flex items-center gap-1">
            {[5,10,20].map(h => (
              <button key={h} onClick={() => setHorizon(h)} className={`px-2 py-1 rounded border text-xs ${horizon===h ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}>H{h}</button>
            ))}
          </div>
          <label className="inline-flex items-center gap-2">Curve THs
            <input value={curveThresholds} onChange={e=>setCurveThresholds(e.target.value)} className="input w-36" title="Comma-separated thresholds for expectancy curves" />
          </label>
          <label className="inline-flex items-center gap-2">HZs
            <input value={hzs} onChange={e=>setHzs(e.target.value)} className="input w-28" title="Comma-separated horizons for matrix heatmap" />
          </label>
          <InfoPopover title="Heatmap (HZs)">Enter multiple horizons (e.g., 5,10,20) to render a Threshold × Horizon heatmap of avg forward % returns. Helps pick robust thresholds and holding periods.</InfoPopover>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={consensus} onChange={e=>setConsensus(e.target.checked)} /> Consensus Bonus <span className="text-slate-500">(+10 if primary and secondary TFs agree)</span></label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={regimeCurves} onChange={e=>setRegimeCurves(e.target.checked)} disabled={assetClass!=='stocks'} /> Compare Regimes</label>
          <label className="inline-flex items-center gap-2">Regime
            <select value={dailyFilter} onChange={e => setDailyFilter(e.target.value)} className="select" disabled={assetClass!=='stocks'}>
              <option value="none">None</option>
              <option value="bull">Daily Bullish</option>
              <option value="bear">Daily Bearish</option>
            </select>
          </label>
          <button onClick={run} disabled={loading} className="btn btn-xs">{loading ? 'Running…' : 'Run'}</button>
          <button onClick={explainBacktest} disabled={aiLoading || !res} className="btn btn-xs disabled:opacity-50">{aiLoading ? 'Explaining…' : 'Explain (AI)'}</button>
          <button onClick={downloadJson} className="btn btn-xs">Download JSON</button>
          <button onClick={downloadCsv} className="btn btn-xs">Download CSV</button>
          <button onClick={downloadSummaryCsv} className="btn btn-xs">Summary CSV</button>
          <button onClick={downloadSummaryJson} className="btn btn-xs">Summary JSON</button>
          {res && (
            <>
              <button onClick={() => { try { const txt = JSON.stringify(res, null, 2); navigator.clipboard.writeText(txt); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Backtest results copied', type: 'success' } })) } catch {} }} className="btn btn-xs">Copy results</button>
              <a className="btn btn-xs" href={`/api/backtest?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${encodeURIComponent(assetClass==='stocks'?dailyFilter:'none')}&regimeCurves=${assetClass==='stocks' && regimeCurves ? 1 : 0}&assetClass=${encodeURIComponent(assetClass)}&consensus=${consensus ? 1 : 0}&format=json`} target="_blank" rel="noreferrer">Open API</a>
            </>
          )}
          <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700" title="Current parameters">
            TH {threshold} · H {horizon} · {assetClass==='stocks' ? (dailyFilter || 'none') : 'none'}
          </span>
          {preset && (
            <button onClick={() => { if (typeof preset.th === 'number') setThreshold(preset.th); if (typeof preset.hz === 'number') setHorizon(preset.hz); if (preset.regime) setDailyFilter(preset.regime) }} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">Apply Preset</button>
          )}
          {res ? (
            <button onClick={() => {
              try {
                // Prefer matrix row matching current horizon; fall back to curve
                let best = { th: threshold, score: -Infinity }
                if (Array.isArray(res.matrix)) {
                  const row = res.matrix.find(r => Number(r.hz) === Number(horizon))
                  if (row && Array.isArray(row.curve)) {
                    for (const c of row.curve) {
                      const s = (Number(c.avgFwd)||0) // use avgFwd
                      if (s > best.score) best = { th: c.th, score: s }
                    }
                  }
                }
                if (best.score === -Infinity && Array.isArray(res.curve)) {
                  for (const c of res.curve) {
                    const s = (Number(c.avgFwd)||0)
                    if (s > best.score) best = { th: c.th, score: s }
                  }
                }
                if (best.score > -Infinity) {
                  setThreshold(best.th)
                  setSuggestMsg(`Suggested TH ${best.th} (avg ${best.score.toFixed(2)}%)`)
                  setTimeout(()=>setSuggestMsg(''), 3500)
                }
              } catch {}
            }} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">Suggest TH</button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs mt-2">
        <span className="text-slate-400">Presets:</span>
        {presets.map(p => (
          <button key={p.label} onClick={() => { setThreshold(p.th); setHorizon(p.hz); setDailyFilter(p.regime) }} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-2 py-1">
            {p.label}
          </button>
        ))}
      </div>
          {err && <div className="text-xs text-rose-400 mt-2">{err}</div>}
          {aiErr && <div className="text-xs text-rose-400 mt-2">{aiErr} <span className="text-slate-500">Check <a className="underline" href="/api/health" target="_blank" rel="noreferrer">/api/health</a>.</span></div>}
      {res && (
        <div className="mt-2 text-sm text-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-slate-400">Bars</span> {res.bars}</div>
            <div><span className="text-slate-400">Score Avg</span> {res.scoreAvg}</div>
            <div><span className="text-slate-400">≥40%</span> {res.scorePcts?.p40}%</div>
            <div><span className="text-slate-400">≥60%</span> {res.scorePcts?.p60}%</div>
            <div><span className="text-slate-400">≥70%</span> {res.scorePcts?.p70}%</div>
            <div><span className="text-slate-400">Events</span> {res.events} @≥{res.threshold} / {res.horizon} bars</div>
            <div><span className="text-slate-400">Win‑rate</span> {res.winRate}%</div>
            <div><span className="text-slate-400">Avg fwd</span> {res.avgFwd}%</div>
            <div><span className="text-slate-400">Median fwd</span> {res.medianFwd}%</div>
            <div><span className="text-slate-400">Avg win</span> {res.avgWin}%</div>
            <div><span className="text-slate-400">Avg loss</span> {res.avgLoss}%</div>
            <div><span className="text-slate-400">Profit Factor</span> {res.profitFactor ?? '—'}</div>
          </div>
          <div className="mt-2 text-xs"><a className="underline hover:text-slate-300" href={`/api/backtest?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&format=csv`} target="_blank" rel="noreferrer">Download CSV</a></div>
          <div className="mt-2 text-xs flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 inline-flex items-center gap-1">Batch CSV <InfoPopover title="Batch Backtest">Download historical events or summary stats for multiple symbols at once. Use regimes to compare bull vs bear performance.</InfoPopover></span>
            <input value={batchSymbols} onChange={e=>setBatchSymbols(e.target.value)} className="input w-64" />
            <a className="underline hover:text-slate-300" href={`/api/backtest_batch?symbols=${encodeURIComponent(batchSymbols)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${dailyFilter}&format=csv`} target="_blank" rel="noreferrer">Events CSV</a>
            <a className="underline hover:text-slate-300" href={`/api/backtest_batch?symbols=${encodeURIComponent(batchSymbols)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${dailyFilter}&format=json`} target="_blank" rel="noreferrer">Events JSON</a>
            <label className="inline-flex items-center gap-1"><input type="checkbox" checked={includeSummaryRegimes} onChange={e=>setIncludeSummaryRegimes(e.target.checked)} />Regimes</label>
            <a className="underline hover:text-slate-300" href={`/api/backtest_batch?symbols=${encodeURIComponent(batchSymbols)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${dailyFilter}&format=summary&includeRegimes=${includeSummaryRegimes ? 1 : 0}`} target="_blank" rel="noreferrer">Summary CSV</a>
            <a className="underline hover:text-slate-300" href={`/api/backtest_batch?symbols=${encodeURIComponent(batchSymbols)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${dailyFilter}&format=summary-json&includeRegimes=${includeSummaryRegimes ? 1 : 0}`} target="_blank" rel="noreferrer">Summary JSON</a>
          </div>
          {Array.isArray(res.recentScores) && res.recentScores.length ? (
            <div className="mt-3 h-16 flex items-end gap-[2px]">
              {res.recentScores.map((v, i) => {
                const h = Math.max(2, Math.min(60, Math.round((v / 100) * 60)))
                const color = v >= 70 ? 'bg-emerald-500/70' : v >= 40 ? 'bg-amber-500/70' : 'bg-slate-500/50'
                return <div key={i} className={`w-[2px] ${color}`} style={{ height: h }} title={`${v.toFixed(1)}`} />
              })}
            </div>
          ) : null}
          {aiExp && (
            <div className="mt-3 p-2 rounded border border-slate-700 bg-slate-900/60">
              <div className="text-xs text-slate-400 mb-1">AI Explanation</div>
              <div className="text-sm text-slate-200 whitespace-pre-wrap">{aiExp}</div>
            </div>
          )}
          {Array.isArray(res.curve) && res.curve.length ? (
            <div className="mt-3">
              <div className="text-xs text-slate-400 mb-1">Expectancy vs Threshold</div>
              <div className="h-20 flex items-end gap-2">
                {res.curve.map((p, i) => {
                  const h = Math.max(2, Math.min(60, Math.round(Math.abs(p.avgFwd) * 0.8)))
                  const up = p.avgFwd >= 0
                  const color = up ? 'bg-emerald-500/70' : 'bg-rose-500/70'
                  return (
                    <div key={i} title={`th ${p.th}: avg ${p.avgFwd}% · med ${p.medianFwd ?? '—'}% · win ${p.winRate}% · n=${p.events}`} className="text-center">
                      <div className={`w-4 ${color}`} style={{ height: h }} />
                      <div className="text-[10px] text-slate-400 mt-1">{p.th}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
          {Array.isArray(res.matrix) && res.matrix.length ? (
            <div className="mt-4">
              <div className="text-xs text-slate-400 mb-1">Heatmap: Avg Fwd % (Threshold × Horizon) <span className="text-slate-500">(hover shows Win%, Median%)</span></div>
              <div className="inline-block border border-slate-700 rounded overflow-hidden">
                <table className="text-xs">
                  <thead>
                    <tr>
                      <th className="bg-slate-900 px-2 py-1 border-r border-slate-700">TH \ HZ</th>
                      {res.matrix.map(row => (
                        <th key={row.hz} className="bg-slate-900 px-2 py-1 border-r border-slate-700">H{row.hz}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(res.curve || []).map((thRow, idxTh) => (
                      <tr key={thRow.th}>
                        <td className="px-2 py-1 border-r border-slate-800">{thRow.th}</td>
                        {res.matrix.map(row => {
                          const cell = row.curve[idxTh]
                          const v = cell ? cell.avgFwd : 0
                          const val = typeof v === 'number' ? v : 0
                          const up = val >= 0
                          const mag = Math.min(1, Math.abs(val) / 5) // scale to 5%
                          const bg = up ? `rgba(16,185,129,${0.15+mag*0.35})` : `rgba(239,68,68,${0.15+mag*0.35})`
                          const tip = cell ? `H${row.hz} · TH ${thRow.th} → avg ${val.toFixed(2)}% · med ${(cell.medianFwd ?? 0).toFixed(2)}% · win ${cell.winRate}% · n=${cell.events}` : ''
                          return <td key={row.hz} className="px-2 py-1 border-r border-slate-800" style={{ background:bg }} title={tip}>{val.toFixed(2)}%</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {suggestMsg && <div className="text-xs text-emerald-400 mt-2">{suggestMsg}</div>}
            </div>
          ) : null}
          {Array.isArray(res.curveBull) && Array.isArray(res.curveBear) ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Bull Regime</div>
                <div className="h-20 flex items-end gap-2">
                  {res.curveBull.map((p, i) => {
                    const h = Math.max(2, Math.min(60, Math.round(Math.abs(p.avgFwd) * 0.8)))
                    const up = p.avgFwd >= 0
                    const color = up ? 'bg-emerald-500/70' : 'bg-rose-500/70'
                    return (
                      <div key={i} title={`th ${p.th}: avg ${p.avgFwd}% · med ${p.medianFwd ?? '—'}% · win ${p.winRate}% · n=${p.events}`} className="text-center">
                        <div className={`w-4 ${color}`} style={{ height: h }} />
                        <div className="text-[10px] text-slate-400 mt-1">{p.th}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Bear Regime</div>
                <div className="h-20 flex items-end gap-2">
                  {res.curveBear.map((p, i) => {
                    const h = Math.max(2, Math.min(60, Math.round(Math.abs(p.avgFwd) * 0.8)))
                    const up = p.avgFwd >= 0
                    const color = up ? 'bg-emerald-500/70' : 'bg-rose-500/70'
                    return (
                      <div key={i} title={`th ${p.th}: avg ${p.avgFwd}% · med ${p.medianFwd ?? '—'}% · win ${p.winRate}% · n=${p.events}`} className="text-center">
                        <div className={`w-4 ${color}`} style={{ height: h }} />
                        <div className="text-[10px] text-slate-400 mt-1">{p.th}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )}
