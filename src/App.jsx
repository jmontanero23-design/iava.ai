import React, { useEffect, useMemo, useState } from 'react'
import Hero from './components/Hero.jsx'
import CandleChart from './components/chart/CandleChart.jsx'
import { emaCloud, ichimoku, satyAtrLevels, pivotRibbonTrend, computeStates, pivotRibbon } from './utils/indicators.js'
import SqueezePanel from './components/chart/SqueezePanel.jsx'
import SignalsPanel from './components/SignalsPanel.jsx'
import { fetchBars as fetchBarsApi } from './services/alpaca.js'
import HealthBadge from './components/HealthBadge.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'

function generateSampleOHLC(n = 200, start = Math.floor(Date.now()/1000) - n*3600, step = 3600) {
  const out = []
  let price = 100
  for (let i = 0; i < n; i++) {
    const time = start + i * step
    const drift = (Math.random() - 0.5) * 1.5
    const open = price
    const close = Math.max(1, open + drift)
    const high = Math.max(open, close) + Math.random() * 1.2
    const low = Math.min(open, close) - Math.random() * 1.2
    const volume = 100 + Math.round(Math.random() * 50)
    out.push({ time, open, high, low, close, volume })
    price = close
  }
  return out
}

export default function App() {
  const [symbol, setSymbol] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('1Min')
  const [bars, setBars] = useState(() => generateSampleOHLC())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEma821, setShowEma821] = useState(true)
  const [showEma512, setShowEma512] = useState(false)
  const [showEma89, setShowEma89] = useState(false)
  const [showEma3450, setShowEma3450] = useState(true)
  const [showIchi, setShowIchi] = useState(true)
  const [showRibbon, setShowRibbon] = useState(true)
  const [showSaty, setShowSaty] = useState(true)
  const [showSqueeze, setShowSqueeze] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshSec, setRefreshSec] = useState(15)

  const overlays = useMemo(() => {
    const close = bars.map(b => b.close)
    const base = { emaClouds: [] }
    if (showEma821) base.emaClouds.push({ key: '8-21', color: '#f59e0b', ...emaCloud(close, 8, 21) })
    if (showEma512) base.emaClouds.push({ key: '5-12', color: '#22d3ee', ...emaCloud(close, 5, 12) })
    if (showEma89) base.emaClouds.push({ key: '8-9', color: '#a78bfa', ...emaCloud(close, 8, 9) })
    if (showEma3450) base.emaClouds.push({ key: '34-50', color: '#10b981', ...emaCloud(close, 34, 50) })
    if (showIchi) base.ichimoku = ichimoku(bars)
    if (showRibbon) base.ribbon = pivotRibbon(close)
    if (showSaty) base.saty = satyAtrLevels(bars, 14)
    return base
  }, [bars, showEma821, showEma512, showEma89, showEma3450, showIchi, showSaty])

  const signalState = useMemo(() => computeStates(bars), [bars])

  async function loadBars(s = symbol, tf = timeframe) {
    try {
      setLoading(true)
      setError('')
      const res = await fetchBarsApi(s, tf, 500)
      if (Array.isArray(res) && res.length) setBars(res)
      else throw new Error('No data returned')
    } catch (e) {
      setError(e?.message || 'Failed to load data; showing sample')
      setBars(generateSampleOHLC())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => loadBars(symbol, timeframe), Math.max(5, refreshSec) * 1000)
    return () => clearInterval(id)
  }, [autoRefresh, refreshSec, symbol, timeframe])

  return (
    <div className="min-h-screen p-6 space-y-6">
      <Hero />
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol" className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm" style={{width: 90}} />
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm">
            <option value="1Min">1Min</option>
            <option value="5Min">5Min</option>
            <option value="15Min">15Min</option>
            <option value="1Hour">1Hour</option>
            <option value="1Day">1Day</option>
          </select>
          <button onClick={() => loadBars()} className="bg-indigo-600 hover:bg-indigo-500 rounded px-3 py-1 text-sm">Load</button>
          {loading && <span className="text-xs text-slate-400 ml-2">Loading…</span>}
          {error && !loading && <span className="text-xs text-rose-400 ml-2">{error}</span>}
        </div>
        <span className="text-sm text-slate-400">Overlays</span>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-indigo-500" checked={showEma821} onChange={e => setShowEma821(e.target.checked)} />
          <span>EMA 8/21</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-cyan-500" checked={showEma512} onChange={e => setShowEma512(e.target.checked)} />
          <span>EMA 5/12</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-violet-500" checked={showEma89} onChange={e => setShowEma89(e.target.checked)} />
          <span>EMA 8/9</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-emerald-500" checked={showEma3450} onChange={e => setShowEma3450(e.target.checked)} />
          <span>EMA 34/50</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-indigo-500" checked={showIchi} onChange={e => setShowIchi(e.target.checked)} />
          <span>Ichimoku</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-lime-500" checked={showRibbon} onChange={e => setShowRibbon(e.target.checked)} />
          <span>Pivot Ribbon</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-indigo-500" checked={showSaty} onChange={e => setShowSaty(e.target.checked)} />
          <span>SATY ATR Levels</span>
        </label>
        <div className="ml-auto text-sm text-slate-400">
          Trend: <span className="text-slate-200">{pivotRibbonTrend(bars.map(b => b.close))}</span>
          {showSaty && overlays.saty?.atr ? (
            <>
              <span className="mx-2">•</span>
              ATR: <span className="text-slate-200">{overlays.saty.atr.toFixed(2)}</span>
              <span className="mx-2">•</span>
              Range used: <span className="text-slate-200">{Math.round(overlays.saty.rangeUsed * 100)}%</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-indigo-500" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Auto-Refresh
          </label>
          <select value={refreshSec} onChange={e => setRefreshSec(parseInt(e.target.value,10))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm">
            <option value={5}>5s</option>
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>
        </div>
        <div className="ml-auto"><HealthBadge /></div>
      </div>
      <CandleChart bars={bars} overlays={overlays} markers={signalState.markers} />
      {showSqueeze && <SqueezePanel bars={bars} />}
      <SignalsPanel state={signalState} />
      <section className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Project Structure</h2>
        <ul className="list-disc pl-6 text-slate-300">
          <li><code>src/components</code> – UI and frontend components</li>
          <li><code>src/services</code> – API and backend-facing logic</li>
          <li><code>src/utils</code> – Utilities and shared helpers</li>
        </ul>
      </section>
      <BuildInfoFooter />
    </div>
  )
}
