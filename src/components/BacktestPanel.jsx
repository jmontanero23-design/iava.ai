import React, { useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function BacktestPanel({ symbol, timeframe }) {
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [threshold, setThreshold] = useState(70)
  const [horizon, setHorizon] = useState(10)
  const [showCurve, setShowCurve] = useState(true)
  const [dailyFilter, setDailyFilter] = useState('none')
  const [batchSymbols, setBatchSymbols] = useState('AAPL,MSFT,NVDA,SPY')
  const [includeSummaryRegimes, setIncludeSummaryRegimes] = useState(true)

  const presets = [
    { label: 'Intraday (70 / 10)', th: 70, hz: 10, regime: 'bull' },
    { label: 'Swing (65 / 20)', th: 65, hz: 20, regime: 'none' },
    { label: 'Mean Revert (55 / 5)', th: 55, hz: 5, regime: 'bear' },
  ]

  async function run() {
    try {
      setLoading(true); setErr('')
      const r = await fetch(`/api/backtest?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&curve=${showCurve ? 1 : 0}&dailyFilter=${encodeURIComponent(dailyFilter)}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setRes(j)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Backtest Snapshot <InfoPopover title="Backtest">Runs a quick score-based scan: counts events where Score ≥ threshold and shows forward returns after horizon bars.</InfoPopover></h3>
        <div className="flex items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-2">Threshold <input type="number" min={0} max={100} value={threshold} onChange={e => setThreshold(parseInt(e.target.value,10)||0)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-16" /></label>
          <label className="inline-flex items-center gap-2">Horizon <input type="number" min={1} max={100} value={horizon} onChange={e => setHorizon(parseInt(e.target.value,10)||1)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-16" /></label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={showCurve} onChange={e=>setShowCurve(e.target.checked)} /> Curve</label>
          <label className="inline-flex items-center gap-2">Regime
            <select value={dailyFilter} onChange={e => setDailyFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
              <option value="none">None</option>
              <option value="bull">Daily Bullish</option>
              <option value="bear">Daily Bearish</option>
            </select>
          </label>
          <button onClick={run} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">{loading ? 'Running…' : 'Run'}</button>
          <button onClick={downloadJson} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">Download JSON</button>
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
            <input value={batchSymbols} onChange={e=>setBatchSymbols(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-64" />
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
          {Array.isArray(res.curve) && res.curve.length ? (
            <div className="mt-3">
              <div className="text-xs text-slate-400 mb-1">Expectancy vs Threshold</div>
              <div className="h-20 flex items-end gap-2">
                {res.curve.map((p, i) => {
                  const h = Math.max(2, Math.min(60, Math.round(Math.abs(p.avgFwd) * 0.8)))
                  const up = p.avgFwd >= 0
                  const color = up ? 'bg-emerald-500/70' : 'bg-rose-500/70'
                  return (
                    <div key={i} title={`th ${p.th}: avg ${p.avgFwd}% · win ${p.winRate}% · n=${p.events}`} className="text-center">
                      <div className={`w-4 ${color}`} style={{ height: h }} />
                      <div className="text-[10px] text-slate-400 mt-1">{p.th}</div>
                    </div>
                  )
                })}
              </div>
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
                      <div key={i} title={`th ${p.th}: avg ${p.avgFwd}% · win ${p.winRate}% · n=${p.events}`} className="text-center">
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
                      <div key={i} title={`th ${p.th}: avg ${p.avgFwd}% · win ${p.winRate}% · n=${p.events}`} className="text-center">
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
