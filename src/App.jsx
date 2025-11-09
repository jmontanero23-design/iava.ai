import React, { useEffect, useMemo, useRef, useState } from 'react'
import Hero from './components/Hero.jsx'
import CandleChart from './components/chart/CandleChart.jsx'
import { emaCloud, ichimoku, satyAtrLevels, pivotRibbonTrend, computeStates, pivotRibbon } from './utils/indicators.js'
import SqueezePanel from './components/chart/SqueezePanel.jsx'
import SignalsPanel from './components/SignalsPanel.jsx'
import SatyPanel from './components/SatyPanel.jsx'
import { fetchBars as fetchBarsApi } from './services/alpaca.js'
import HealthBadge from './components/HealthBadge.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'
import Presets from './components/Presets.jsx'
import StatusBar from './components/StatusBar.jsx'
import LegendChips from './components/LegendChips.jsx'
import UnicornCallout from './components/UnicornCallout.jsx'
import BacktestPanel from './components/BacktestPanel.jsx'
import OrdersPanel from './components/OrdersPanel.jsx'
import SatyTargets from './components/SatyTargets.jsx'
import InfoPopover from './components/InfoPopover.jsx'
import SymbolSearch from './components/SymbolSearch.jsx'

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
  const [usingSample, setUsingSample] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(0)
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
  const [autoLoadChange, setAutoLoadChange] = useState(true)
  const loadReq = useRef(0)
  const [threshold, setThreshold] = useState(70)
  const [dailyBars, setDailyBars] = useState([])
  const [enforceDaily, setEnforceDaily] = useState(false)

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

  const [account, setAccount] = useState(null)
  const signalState = useMemo(() => computeStates(bars), [bars])
  const dailyState = useMemo(() => (dailyBars?.length ? computeStates(dailyBars) : null), [dailyBars])

  const stale = useMemo(() => {
    if (!bars?.length) return true
    const last = bars[bars.length - 1]?.time
    if (!last) return true
    const now = Math.floor(Date.now()/1000)
    const dt = now - last
    const tf = timeframe.toLowerCase()
    const maxAge = tf.includes('1min') ? 180 : tf.includes('5min') ? 600 : tf.includes('15min') ? 1800 : tf.includes('1hour') ? 7200 : 172800
    return dt > maxAge
  }, [bars, timeframe])

  async function loadBars(s = symbol, tf = timeframe) {
    try {
      const myId = ++loadReq.current
      setLoading(true)
      setError('')
      const res = await fetchBarsApi(s, tf, 500)
      if (myId !== loadReq.current) return
      if (Array.isArray(res) && res.length) { setBars(res); setUsingSample(false) }
      else throw new Error('No data returned')
    } catch (e) {
      setError(e?.message || 'Failed to load data; showing sample')
      setBars(generateSampleOHLC())
      setUsingSample(true)
    } finally {
      setLoading(false)
      setUpdatedAt(Date.now())
    }
  }

  async function loadDaily(s = symbol) {
    try {
      const res = await fetchBarsApi(s, '1Day', 400)
      if (Array.isArray(res) && res.length) setDailyBars(res)
    } catch {}
  }

  useEffect(() => {
    // Load persisted settings
    try {
      const saved = JSON.parse(localStorage.getItem('iava.settings') || '{}')
      if (saved.symbol) setSymbol(saved.symbol)
      if (saved.timeframe) setTimeframe(saved.timeframe)
      if (typeof saved.autoRefresh === 'boolean') setAutoRefresh(saved.autoRefresh)
      if (typeof saved.refreshSec === 'number') setRefreshSec(saved.refreshSec)
      if (typeof saved.showIchi === 'boolean') setShowIchi(saved.showIchi)
      if (typeof saved.showRibbon === 'boolean') setShowRibbon(saved.showRibbon)
      if (typeof saved.showSaty === 'boolean') setShowSaty(saved.showSaty)
      if (typeof saved.showSqueeze === 'boolean') setShowSqueeze(saved.showSqueeze)
      if (typeof saved.showEma821 === 'boolean') setShowEma821(saved.showEma821)
      if (typeof saved.showEma512 === 'boolean') setShowEma512(saved.showEma512)
      if (typeof saved.showEma89 === 'boolean') setShowEma89(saved.showEma89)
      if (typeof saved.showEma3450 === 'boolean') setShowEma3450(saved.showEma3450)
      if (typeof saved.autoLoadChange === 'boolean') setAutoLoadChange(saved.autoLoadChange)
    } catch {}
    loadBars()
    loadDaily()
    // Fetch account once for trade sizing
    fetch('/api/alpaca/account').then(r => r.json()).then(setAccount).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const prefs = {
      symbol, timeframe, autoRefresh, refreshSec,
      showIchi, showRibbon, showSaty, showSqueeze,
      showEma821, showEma512, showEma89, showEma3450,
      autoLoadChange,
    }
    try { localStorage.setItem('iava.settings', JSON.stringify(prefs)) } catch {}
  }, [symbol, timeframe, autoRefresh, refreshSec, showIchi, showRibbon, showSaty, showSqueeze, showEma821, showEma512, showEma89, showEma3450, autoLoadChange])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => loadBars(symbol, timeframe), Math.max(5, refreshSec) * 1000)
    return () => clearInterval(id)
  }, [autoRefresh, refreshSec, symbol, timeframe])

  useEffect(() => {
    loadDaily(symbol)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  return (
    <div className="min-h-screen p-6 space-y-6">
      <Hero />
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <SymbolSearch value={symbol} onChange={setSymbol} onSubmit={(sym) => loadBars(sym, timeframe)} />
          <select value={timeframe} onChange={e => { const tf = e.target.value; setTimeframe(tf); if (autoLoadChange) loadBars(symbol, tf) }} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm">
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
        <div className="w-full mt-2">
          <Presets symbol={symbol} setSymbol={setSymbol} timeframe={timeframe} setTimeframe={setTimeframe} onLoad={(s, tf) => loadBars(s, tf)} />
        </div>
        <span className="text-sm text-slate-400 inline-flex items-center gap-2">Overlays <InfoPopover title="Overlays">Toggle EMA Clouds (pullback/trend), Ichimoku (regime), Pivot Ribbon (8/21/34) and SATY ATR levels (targets).</InfoPopover></span>
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
          <label className="inline-flex items-center gap-2 text-sm ml-2">
            <input type="checkbox" className="accent-indigo-500" checked={autoLoadChange} onChange={e => setAutoLoadChange(e.target.checked)} />
            Auto-Load on Change
          </label>
          <label className="inline-flex items-center gap-2 text-sm ml-2">
            <input type="checkbox" className="accent-indigo-500" checked={enforceDaily} onChange={e => setEnforceDaily(e.target.checked)} />
            Enforce Daily Confluence
          </label>
          <label className="inline-flex items-center gap-2 text-sm ml-2">
            <span>Threshold</span>
            <input type="range" min={0} max={100} value={threshold} onChange={e => setThreshold(parseInt(e.target.value,10))} />
            <input type="number" min={0} max={100} value={threshold} onChange={e => setThreshold(parseInt(e.target.value,10)||0)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-16" />
          </label>
        </div>
        <div className="ml-auto"><HealthBadge /></div>
      </div>
      <LegendChips overlays={overlays} />
      <CandleChart bars={bars} overlays={overlays} markers={signalState.markers} loading={loading} />
      <StatusBar symbol={symbol} timeframe={timeframe} bars={bars} usingSample={usingSample} updatedAt={updatedAt} stale={stale} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showSqueeze && <SqueezePanel bars={bars} />}
        <SignalsPanel state={signalState} />
      </div>
      <BacktestPanel symbol={symbol} timeframe={timeframe} />
      <UnicornCallout threshold={threshold} state={{ ...signalState, _bars: bars.map(b => ({ ...b, symbol })), _account: account, _daily: dailyState, _enforceDaily: enforceDaily }} />
      <SatyPanel saty={overlays.saty} trend={pivotRibbonTrend(bars.map(b => b.close))} />
      <SatyTargets saty={overlays.saty} last={bars[bars.length-1]} />
      <OrdersPanel />
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
