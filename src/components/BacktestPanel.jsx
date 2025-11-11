import React, { useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function BacktestPanel({ symbol, timeframe, preset }) {
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
    <div className="space-y-4 animate-fadeIn">
      {/* Header Card */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              Backtest Engine
            </h3>
            <p className="text-xs text-slate-400">Score-based historical performance analysis</p>
          </div>
          <InfoPopover title="Backtest Engine">
            Runs score-based scans on historical data: counts events where Score ≥ threshold and shows forward returns after horizon bars.
            <br/><br/>
            <strong>Use Cases:</strong>
            <br/>• Validate strategy parameters
            <br/>• Optimize threshold and holding period
            <br/>• Compare bull vs bear regimes
          </InfoPopover>
          <button
            onClick={() => { try { window.dispatchEvent(new CustomEvent('iava.help', { detail: { question: 'How do I interpret this backtest heatmap and pick thresholds?', context: { symbol, timeframe, threshold, horizon, consensus, dailyFilter, assetClass } } })) } catch {} }}
            className="btn btn-xs"
          >
            Ask AI
          </button>
        </div>

        {/* Configuration Grid */}
        <div className="panel-header mb-3">
          <span className="text-xs font-semibold text-slate-300">Configuration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Asset Class</label>
            <select value={assetClass} onChange={e=>setAssetClass(e.target.value)} className="select w-full">
              <option value="stocks">Stocks</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>

          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Threshold</label>
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={e => setThreshold(parseInt(e.target.value,10)||0)}
              className="input w-full"
            />
          </div>

          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Horizon (bars)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={horizon}
                onChange={e => setHorizon(parseInt(e.target.value,10)||1)}
                className="input flex-1"
              />
              <div className="flex gap-1">
                {[5,10,20].map(h => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`btn btn-xs px-2 ${horizon===h ? 'btn-primary' : ''}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Regime Filter</label>
            <select
              value={dailyFilter}
              onChange={e => setDailyFilter(e.target.value)}
              className="select w-full"
              disabled={assetClass!=='stocks'}
            >
              <option value="none">None</option>
              <option value="bull">Daily Bullish</option>
              <option value="bear">Daily Bearish</option>
            </select>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="panel-header mb-3">
          <span className="text-xs font-semibold text-slate-300">Advanced Options</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">
              Curve Thresholds
              <InfoPopover title="Expectancy Curve">Comma-separated thresholds for expectancy curves (e.g., 30,40,50,60,70,80,90)</InfoPopover>
            </label>
            <input
              value={curveThresholds}
              onChange={e=>setCurveThresholds(e.target.value)}
              className="input w-full"
              placeholder="30,40,50,60,70,80,90"
            />
          </div>

          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">
              Horizons for Heatmap
              <InfoPopover title="Heatmap Horizons">Multiple horizons (e.g., 5,10,20) to render Threshold × Horizon heatmap</InfoPopover>
            </label>
            <input
              value={hzs}
              onChange={e=>setHzs(e.target.value)}
              className="input w-full"
              placeholder="5,10,20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showCurve} onChange={e=>setShowCurve(e.target.checked)} className="checkbox accent-indigo-500" />
            <span className="text-sm text-slate-300">Show Expectancy Curve</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={consensus} onChange={e=>setConsensus(e.target.checked)} className="checkbox accent-violet-500" />
            <span className="text-sm text-slate-300">Consensus Bonus (+10)</span>
            <InfoPopover title="Consensus Bonus">Adds +10 to score when primary and secondary TFs agree</InfoPopover>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={regimeCurves} onChange={e=>setRegimeCurves(e.target.checked)} disabled={assetClass!=='stocks'} className="checkbox accent-emerald-500" />
            <span className="text-sm text-slate-300">Compare Regimes (Bull/Bear)</span>
          </label>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-400">Quick Presets:</span>
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => { setThreshold(p.th); setHorizon(p.hz); setDailyFilter(p.regime) }}
              className="btn btn-xs"
            >
              {p.label}
            </button>
          ))}
          {preset && (
            <button onClick={applyPresetParams} className="btn btn-xs">
              Apply Current Preset
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={run}
            disabled={loading}
            className="btn btn-primary px-4 py-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Running…
              </span>
            ) : 'Run Backtest'}
          </button>

          <button
            onClick={explainBacktest}
            disabled={aiLoading || !res}
            className="btn btn-xs"
          >
            {aiLoading ? 'Explaining…' : 'Explain (AI)'}
          </button>

          {res && (
            <button
              onClick={() => {
                try {
                  let best = { th: threshold, score: -Infinity }
                  if (Array.isArray(res.matrix)) {
                    const row = res.matrix.find(r => Number(r.hz) === Number(horizon))
                    if (row && Array.isArray(row.curve)) {
                      for (const c of row.curve) {
                        const s = (Number(c.avgFwd)||0)
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
              }}
              className="btn btn-xs"
            >
              Suggest Best TH
            </button>
          )}

          <div className="h-4 w-px bg-slate-700"></div>

          <button onClick={downloadJson} className="btn btn-xs">JSON</button>
          <button onClick={downloadCsv} className="btn btn-xs">CSV</button>
          <button onClick={downloadSummaryJson} className="btn btn-xs">Summary JSON</button>
          <button onClick={downloadSummaryCsv} className="btn btn-xs">Summary CSV</button>
        </div>

        {err && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-sm text-rose-400">{err}</p>
          </div>
        )}

        {aiErr && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-sm text-rose-400">{aiErr}</p>
            <p className="text-xs text-slate-500 mt-1">Check <a className="underline" href="/api/health" target="_blank" rel="noreferrer">/api/health</a></p>
          </div>
        )}

        {suggestMsg && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-400">{suggestMsg}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {res && (
        <div className="space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="stat-tile">
              <div className="stat-icon">
                <span className="text-lg">📊</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Bars</div>
                <div className="stat-value text-sm">{res.bars}</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-violet-500/20 to-violet-600/20">
                <span className="text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Events</div>
                <div className="stat-value text-sm">{res.events}</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
                <span className="text-lg">✓</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Win Rate</div>
                <div className="stat-value text-sm text-emerald-400">{res.winRate}%</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
                <span className="text-lg">📈</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Avg Fwd</div>
                <div className={`stat-value text-sm ${parseFloat(res.avgFwd) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {res.avgFwd}%
                </div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
                <span className="text-lg">📉</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Median Fwd</div>
                <div className="stat-value text-sm">{res.medianFwd}%</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                <span className="text-lg">⚖️</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Profit Factor</div>
                <div className="stat-value text-sm">{res.profitFactor ?? '—'}</div>
              </div>
            </div>
          </div>

          {/* Additional Stats Grid */}
          <div className="card p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-400">Score Avg</div>
                <div className="text-slate-200 font-semibold">{res.scoreAvg}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">≥40%</div>
                <div className="text-slate-200 font-semibold">{res.scorePcts?.p40}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">≥60%</div>
                <div className="text-slate-200 font-semibold">{res.scorePcts?.p60}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">≥70%</div>
                <div className="text-slate-200 font-semibold">{res.scorePcts?.p70}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Avg Win</div>
                <div className="text-emerald-400 font-semibold">{res.avgWin}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Avg Loss</div>
                <div className="text-rose-400 font-semibold">{res.avgLoss}%</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-400">Config</div>
                <div className="text-slate-300 font-mono text-xs">
                  TH {res.threshold} · H {res.horizon} · {assetClass==='stocks' ? (dailyFilter || 'none') : 'none'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation */}
          {aiExp && (
            <div className="card p-4">
              <div className="panel-header mb-3">
                <span className="text-xs font-semibold text-slate-300">AI Analysis</span>
              </div>
              <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {aiExp}
              </div>
            </div>
          )}

          {/* Recent Scores Sparkline */}
          {Array.isArray(res.recentScores) && res.recentScores.length > 0 && (
            <div className="card p-4">
              <div className="panel-header mb-3">
                <span className="text-xs font-semibold text-slate-300">Score Distribution (Recent {res.recentScores.length} bars)</span>
              </div>
              <div className="h-16 flex items-end gap-[2px]">
                {res.recentScores.map((v, i) => {
                  const h = Math.max(2, Math.min(60, Math.round((v / 100) * 60)))
                  const color = v >= 70 ? 'bg-emerald-500/70' : v >= 40 ? 'bg-amber-500/70' : 'bg-slate-500/50'
                  return (
                    <div
                      key={i}
                      className={`w-[2px] ${color}`}
                      style={{ height: h }}
                      title={`${v.toFixed(1)}`}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Expectancy Curve */}
          {Array.isArray(res.curve) && res.curve.length > 0 && (
            <div className="card p-4">
              <div className="panel-header mb-3">
                <span className="text-xs font-semibold text-slate-300">Expectancy vs Threshold</span>
              </div>
              <div className="h-24 flex items-end gap-2 overflow-x-auto pb-6">
                {res.curve.map((p, i) => {
                  const h = Math.max(2, Math.min(80, Math.round(Math.abs(p.avgFwd) * 1.5)))
                  const up = p.avgFwd >= 0
                  const color = up ? 'bg-emerald-500/70' : 'bg-rose-500/70'
                  return (
                    <div key={i} className="text-center flex-shrink-0">
                      <div
                        className={`w-6 ${color} rounded-t`}
                        style={{ height: h }}
                        title={`TH ${p.th}: avg ${p.avgFwd}% · med ${p.medianFwd ?? '—'}% · win ${p.winRate}% · n=${p.events}`}
                      />
                      <div className="text-[10px] text-slate-400 mt-1">{p.th}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Heatmap Matrix */}
          {Array.isArray(res.matrix) && res.matrix.length > 0 && (
            <div className="card p-4">
              <div className="panel-header mb-3">
                <span className="text-xs font-semibold text-slate-300">Heatmap: Avg Fwd % (Threshold × Horizon)</span>
                <span className="text-xs text-slate-500 ml-2">(hover for details)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-slate-900 px-3 py-2 border border-slate-700 text-slate-400">TH \ HZ</th>
                      {res.matrix.map(row => (
                        <th key={row.hz} className="bg-slate-900 px-3 py-2 border border-slate-700 text-slate-400">
                          H{row.hz}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(res.curve || []).map((thRow, idxTh) => (
                      <tr key={thRow.th}>
                        <td className="px-3 py-2 border border-slate-800 text-slate-300 font-semibold bg-slate-900/50">
                          {thRow.th}
                        </td>
                        {res.matrix.map(row => {
                          const cell = row.curve[idxTh]
                          const v = cell ? cell.avgFwd : 0
                          const val = typeof v === 'number' ? v : 0
                          const up = val >= 0
                          const mag = Math.min(1, Math.abs(val) / 5)
                          const bg = up ? `rgba(16,185,129,${0.15+mag*0.35})` : `rgba(239,68,68,${0.15+mag*0.35})`
                          const tip = cell ? `H${row.hz} · TH ${thRow.th} → avg ${val.toFixed(2)}% · med ${(cell.medianFwd ?? 0).toFixed(2)}% · win ${cell.winRate}% · n=${cell.events}` : ''
                          return (
                            <td
                              key={row.hz}
                              className="px-3 py-2 border border-slate-800 text-center font-mono text-xs"
                              style={{ background:bg }}
                              title={tip}
                            >
                              {val.toFixed(2)}%
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Regime Comparison */}
          {Array.isArray(res.curveBull) && Array.isArray(res.curveBear) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-4">
                <div className="panel-header mb-3">
                  <span className="text-xs font-semibold text-emerald-400">Bull Regime</span>
                </div>
                <div className="h-24 flex items-end gap-2 overflow-x-auto">
                  {res.curveBull.map((p, i) => {
                    const h = Math.max(2, Math.min(80, Math.round(Math.abs(p.avgFwd) * 1.5)))
                    const up = p.avgFwd >= 0
                    const color = up ? 'bg-emerald-500/70' : 'bg-rose-500/70'
                    return (
                      <div key={i} className="text-center flex-shrink-0">
                        <div
                          className={`w-6 ${color} rounded-t`}
                          style={{ height: h }}
                          title={`TH ${p.th}: avg ${p.avgFwd}% · med ${p.medianFwd ?? '—'}% · win ${p.winRate}% · n=${p.events}`}
                        />
                        <div className="text-[10px] text-slate-400 mt-1">{p.th}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card p-4">
                <div className="panel-header mb-3">
                  <span className="text-xs font-semibold text-rose-400">Bear Regime</span>
                </div>
                <div className="h-24 flex items-end gap-2 overflow-x-auto">
                  {res.curveBear.map((p, i) => {
                    const h = Math.max(2, Math.min(80, Math.round(Math.abs(p.avgFwd) * 1.5)))
                    const up = p.avgFwd >= 0
                    const color = up ? 'bg-emerald-500/70' : 'bg-rose-500/70'
                    return (
                      <div key={i} className="text-center flex-shrink-0">
                        <div
                          className={`w-6 ${color} rounded-t`}
                          style={{ height: h }}
                          title={`TH ${p.th}: avg ${p.avgFwd}% · med ${p.medianFwd ?? '—'}% · win ${p.winRate}% · n=${p.events}`}
                        />
                        <div className="text-[10px] text-slate-400 mt-1">{p.th}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Batch Backtest Options */}
          <div className="card p-4">
            <div className="panel-header mb-3">
              <span className="text-xs font-semibold text-slate-300">Batch Backtest</span>
              <InfoPopover title="Batch Backtest">
                Run backtests across multiple symbols at once. Download events or summary stats.
                Use regimes to compare bull vs bear performance.
              </InfoPopover>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs text-slate-400">Symbols:</span>
              <input
                value={batchSymbols}
                onChange={e=>setBatchSymbols(e.target.value)}
                className="input flex-1 min-w-[200px] text-sm"
                placeholder="AAPL,MSFT,NVDA,SPY"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                className="btn btn-xs"
                href={`/api/backtest_batch?symbols=${encodeURIComponent(batchSymbols)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${dailyFilter}&format=csv`}
                target="_blank"
                rel="noreferrer"
              >
                Events CSV
              </a>

              <a
                className="btn btn-xs"
                href={`/api/backtest_batch?symbols=${encodeURIComponent(batchSymbols)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${dailyFilter}&format=json`}
                target="_blank"
                rel="noreferrer"
              >
                Events JSON
              </a>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSummaryRegimes}
                  onChange={e=>setIncludeSummaryRegimes(e.target.checked)}
                  className="checkbox"
                />
                <span className="text-xs text-slate-400">Include Regimes</span>
              </label>

              <a
                className="btn btn-xs"
                href={`/api/backtest_batch?symbols=${encodeURIComponent(batchSymbols)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${dailyFilter}&format=summary&includeRegimes=${includeSummaryRegimes ? 1 : 0}`}
                target="_blank"
                rel="noreferrer"
              >
                Summary CSV
              </a>

              <a
                className="btn btn-xs"
                href={`/api/backtest_batch?symbols=${encodeURIComponent(batchSymbols)}&timeframe=${encodeURIComponent(timeframe)}&limit=1000&threshold=${threshold}&horizon=${horizon}&dailyFilter=${dailyFilter}&format=summary-json&includeRegimes=${includeSummaryRegimes ? 1 : 0}`}
                target="_blank"
                rel="noreferrer"
              >
                Summary JSON
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
