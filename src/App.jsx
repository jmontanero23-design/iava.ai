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
import StatusBar from './components/StatusBar.jsx'
import LegendChips from './components/LegendChips.jsx'
import MarketStats from './components/MarketStats.jsx'
import UnicornCallout from './components/UnicornCallout.jsx'
import BacktestPanel from './components/BacktestPanel.jsx'
import BatchBacktestPanel from './components/BatchBacktestPanel.jsx'
import OrdersPanel from './components/OrdersPanel.jsx'
import SatyTargets from './components/SatyTargets.jsx'
import InfoPopover from './components/InfoPopover.jsx'
import SymbolSearch from './components/SymbolSearch.jsx'
import { readParams, writeParams } from './utils/urlState.js'
import SignalFeed from './components/SignalFeed.jsx'
import OverlayChips from './components/OverlayChips.jsx'
import useStreamingBars from './hooks/useStreamingBars.js'
import ScoreOptimizer from './components/ScoreOptimizer.jsx'
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx'
import ScannerPanel from './components/ScannerPanel.jsx'
import WatchlistPanel from './components/WatchlistPanel.jsx'
import WatchlistNavigator from './components/WatchlistNavigator.jsx'
import HelpFab from './components/HelpFab.jsx'
import RateLimitBanner from './components/RateLimitBanner.jsx'
import PresetHelp from './components/PresetHelp.jsx'
import { rateLimiter } from './utils/rateLimiter.js'

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
  const [mtfPreset, setMtfPreset] = useState('manual')
  const [signalHistory, setSignalHistory] = useState([])
  const [focusTime, setFocusTime] = useState(null)
  const [streaming, setStreaming] = useState(false)
  const [activeSection, setActiveSection] = useState('chart') // chart, analysis, portfolio, tools
  const [rateLimitUntil, setRateLimitUntil] = useState(0)

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
      setRateLimitUntil(rateLimiter.rateLimitUntil)
      const res = await fetchBarsApi(s, tf, 500)
      if (myId !== loadReq.current) return
      if (Array.isArray(res) && res.length) { setBars(res); setUsingSample(false) }
      else throw new Error('No data returned')
    } catch (e) {
      setError(e?.message || 'Failed to load data; showing sample')
      setRateLimitUntil(rateLimiter.rateLimitUntil)
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
      const qp = readParams()
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
      // Override with URL params if present
      if (qp.symbol) setSymbol(qp.symbol)
      if (qp.timeframe) setTimeframe(qp.timeframe)
      if (typeof qp.threshold === 'number') setThreshold(qp.threshold)
      if (typeof qp.enforceDaily === 'boolean') setEnforceDaily(qp.enforceDaily)
      if (typeof qp.streaming === 'boolean') setStreaming(qp.streaming)
      if (typeof qp.ema821 === 'boolean') setShowEma821(qp.ema821)
      if (typeof qp.ema512 === 'boolean') setShowEma512(qp.ema512)
      if (typeof qp.ema89 === 'boolean') setShowEma89(qp.ema89)
      if (typeof qp.ema3450 === 'boolean') setShowEma3450(qp.ema3450)
      if (typeof qp.ichi === 'boolean') setShowIchi(qp.ichi)
      if (typeof qp.ribbon === 'boolean') setShowRibbon(qp.ribbon)
      if (typeof qp.saty === 'boolean') setShowSaty(qp.saty)
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

  // Sync key UI state to URL for deep links
  useEffect(() => {
    writeParams({ symbol, timeframe, threshold, enforceDaily, streaming, showEma821, showEma512, showEma89, showEma3450, showIchi, showRibbon, showSaty })
  }, [symbol, timeframe, threshold, enforceDaily, streaming, showEma821, showEma512, showEma89, showEma3450, showIchi, showRibbon, showSaty])

  const presets = {
    manual: null,
    trendDaily: {
      showEma821: true,
      showEma512: false,
      showEma89: false,
      showEma3450: true,
      showRibbon: true,
      showIchi: true,
      enforceDaily: true,
    },
    pullbackDaily: {
      showEma821: false,
      showEma512: true,
      showEma89: true,
      showEma3450: true,
      showRibbon: true,
      showIchi: true,
      enforceDaily: true,
    },
    intradayBreakout: {
      showEma821: false,
      showEma512: true,
      showEma89: true,
      showEma3450: false,
      showRibbon: true,
      showIchi: false,
      enforceDaily: false,
    },
    dailyTrendFollow: {
      showEma821: true,
      showEma512: false,
      showEma89: false,
      showEma3450: true,
      showRibbon: true,
      showIchi: true,
      enforceDaily: true,
    },
    meanRevertIntraday: {
      showEma821: false,
      showEma512: false,
      showEma89: true,
      showEma3450: false,
      showRibbon: false,
      showIchi: false,
      enforceDaily: false,
    },
  }

  function applyPreset(id) {
    setMtfPreset(id)
    const preset = presets[id]
    if (!preset) return
    if (typeof preset.showEma821 === 'boolean') setShowEma821(preset.showEma821)
    if (typeof preset.showEma512 === 'boolean') setShowEma512(preset.showEma512)
    if (typeof preset.showEma89 === 'boolean') setShowEma89(preset.showEma89)
    if (typeof preset.showEma3450 === 'boolean') setShowEma3450(preset.showEma3450)
    if (typeof preset.showRibbon === 'boolean') setShowRibbon(preset.showRibbon)
    if (typeof preset.showIchi === 'boolean') setShowIchi(preset.showIchi)
    if (typeof preset.enforceDaily === 'boolean') setEnforceDaily(preset.enforceDaily)
  }

  // Build signal timeline: append on new last bar, include top contributors
  useEffect(() => {
    if (!bars?.length) return
    const last = bars[bars.length - 1]
    const lastTime = last.time
    setSignalHistory(prev => {
      if (prev.length && prev[0]?.time === lastTime) return prev
      const ts = new Date(lastTime * 1000)
      const timeLabel = ts.toLocaleString()
      const tags = []
      if (signalState?.pivotNow) tags.push(`Ribbon ${signalState.pivotNow}`)
      if (signalState?.satyDir) tags.push(`SATY ${signalState.satyDir}`)
      if (signalState?.sq?.fired) tags.push(`Squeeze ${signalState.sq.dir}`)
      if (dailyState?.pivotNow) tags.push(`Daily ${dailyState.pivotNow}`)
      // top 2 contributors
      try {
        const entries = Object.entries(signalState?.components || {})
          .sort((a,b) => b[1]-a[1]).slice(0,2)
        for (const [k,v] of entries) tags.push(`${k}+${v}`)
      } catch {}
      const item = { time: lastTime, timeLabel, score: Math.round(signalState?.score || 0), tags }
      const next = [item, ...prev].slice(0, 8)
      return next
    })
  }, [bars, signalState, dailyState])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => loadBars(symbol, timeframe), Math.max(5, refreshSec) * 1000)
    return () => clearInterval(id)
  }, [autoRefresh, refreshSec, symbol, timeframe])

  useEffect(() => {
    loadDaily(symbol)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  // Streaming (beta): SSE for intraday
  useStreamingBars({
    symbol,
    timeframe,
    enabled: streaming && timeframe !== '1Day',
    onBar: (bar) => {
      if (!bar) return
      setBars(prev => {
        if (!Array.isArray(prev) || prev.length === 0) return [bar]
        const last = prev[prev.length - 1]
        if (bar.time > last.time) return [...prev, bar]
        if (bar.time === last.time) return [...prev.slice(0, -1), bar]
        return prev
      })
      setUpdatedAt(Date.now())
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <RateLimitBanner until={rateLimitUntil} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Hero />

      {/* Unified Control Bar */}
      <div className="card p-3 md:p-4">
        {/* Row 1: Primary Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <SymbolSearch value={symbol} onChange={setSymbol} onSubmit={(sym) => loadBars(sym, timeframe)} />
          <select value={timeframe} onChange={e => { const tf = e.target.value; setTimeframe(tf); if (autoLoadChange) loadBars(symbol, tf) }} className="select text-sm">
            <option value="1Min">1 Min</option>
            <option value="5Min">5 Min</option>
            <option value="15Min">15 Min</option>
            <option value="1Hour">1 Hour</option>
            <option value="1Day">1 Day</option>
          </select>
          <button onClick={() => loadBars()} className="btn btn-primary px-4 py-2 text-sm font-medium" disabled={loading}>
            {loading ? 'Loading...' : 'Load Data'}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <HealthBadge />
          </div>
        </div>

        {/* Row 2: Strategy & Options */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Strategy:</span>
            <select value={mtfPreset} onChange={e => applyPreset(e.target.value)} className="select text-xs">
              <option value="manual">Manual</option>
              <option value="trendDaily">Trend Daily</option>
              <option value="pullbackDaily">Pullback Daily</option>
              <option value="intradayBreakout">Breakout</option>
              <option value="dailyTrendFollow">Trend Follow</option>
              <option value="meanRevertIntraday">Mean Revert</option>
            </select>
            <PresetHelp descriptions={{
              trendDaily: 'Best for trending markets. Uses 8-21 + 34-50 EMAs with daily confirmation.',
              pullbackDaily: 'Catches pullbacks in trends with 5-12 + 8-9 EMAs.',
              intradayBreakout: 'Fast breakout plays without daily filter.',
              dailyTrendFollow: 'Strong trend following with daily alignment.',
              meanRevertIntraday: 'Counter-trend plays on intraday timeframes.'
            }} />
          </div>

          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" className="accent-indigo-500" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} aria-label="Auto-refresh" />
            <span className="text-slate-400 text-xs">Auto</span>
          </label>

          {!autoRefresh && timeframe !== '1Day' && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" className="accent-cyan-500" checked={streaming} onChange={e => { setStreaming(e.target.checked); if (e.target.checked) setAutoRefresh(false) }} aria-label="Streaming" />
              <span className="text-slate-400 text-xs">Stream</span>
            </label>
          )}

          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" className="accent-emerald-500" checked={enforceDaily} onChange={e => setEnforceDaily(e.target.checked)} aria-label="Daily confluence" />
            <span className="text-slate-400 text-xs">Daily</span>
          </label>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Score:</span>
            <input type="number" min={0} max={100} value={threshold} onChange={e => setThreshold(parseInt(e.target.value,10)||0)} className="input w-14 text-xs text-center" />
          </div>

          {error && !loading && <span className="text-xs text-rose-400 ml-auto">{error}</span>}
        </div>
      </div>

      {/* Market Stats & Chart */}
      <MarketStats bars={bars} saty={overlays.saty} symbol={symbol} timeframe={timeframe} streaming={streaming || autoRefresh} />
      <LegendChips overlays={overlays} />
      <CandleChart bars={bars} overlays={overlays} markers={signalState.markers} loading={loading} focusTime={focusTime} />
      <OverlayChips
        showEma821={showEma821} setShowEma821={setShowEma821}
        showEma512={showEma512} setShowEma512={setShowEma512}
        showEma89={showEma89} setShowEma89={setShowEma89}
        showEma3450={showEma3450} setShowEma3450={setShowEma3450}
        showIchi={showIchi} setShowIchi={setShowIchi}
        showRibbon={showRibbon} setShowRibbon={setShowRibbon}
        showSaty={showSaty} setShowSaty={setShowSaty}
      />
      <SignalFeed items={signalHistory} onSelect={(item) => setFocusTime(item.time)} />
      <StatusBar symbol={symbol} timeframe={timeframe} bars={bars} usingSample={usingSample} updatedAt={updatedAt} stale={stale} rateLimitUntil={rateLimitUntil} />
      {/* Unicorn Signal Callout (always visible when triggered) */}
      <UnicornCallout threshold={threshold} timeframe={timeframe} state={{ ...signalState, _bars: bars.map(b => ({ ...b, symbol })), _account: account, _daily: dailyState, _enforceDaily: enforceDaily }} />

      {/* Navigation Tabs */}
      <div className="card p-1 flex gap-1">
        <button
          onClick={() => setActiveSection('chart')}
          className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${activeSection === 'chart' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          📊 Chart & Signals
        </button>
        <button
          onClick={() => setActiveSection('analysis')}
          className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${activeSection === 'analysis' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          🔬 Analysis
        </button>
        <button
          onClick={() => setActiveSection('portfolio')}
          className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${activeSection === 'portfolio' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          💼 Portfolio
        </button>
        <button
          onClick={() => setActiveSection('tools')}
          className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${activeSection === 'tools' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          🛠️ Tools
        </button>
      </div>

      {/* Chart & Signals Section */}
      {activeSection === 'chart' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showSqueeze && <SqueezePanel bars={bars} />}
            <SignalsPanel state={signalState} />
          </div>
          <SatyPanel saty={overlays.saty} trend={pivotRibbonTrend(bars.map(b => b.close))} />
          <SatyTargets saty={overlays.saty} last={bars[bars.length-1]} />
        </div>
      )}

      {/* Analysis Section */}
      {activeSection === 'analysis' && (
        <div className="space-y-4 animate-fadeIn">
          <BacktestPanel symbol={symbol} timeframe={timeframe} />
          <BatchBacktestPanel />
          <ScoreOptimizer symbol={symbol} timeframe={timeframe} />
        </div>
      )}

      {/* Portfolio Section */}
      {activeSection === 'portfolio' && (
        <div className="space-y-4 animate-fadeIn">
          <OrdersPanel symbol={symbol} lastPrice={bars[bars.length-1]?.close} />
          <AnalyticsDashboard />
        </div>
      )}

      {/* Tools Section */}
      {activeSection === 'tools' && (
        <div className="space-y-4 animate-fadeIn">
          <ScannerPanel onLoadSymbol={(sym) => { setSymbol(sym); if (autoLoadChange) loadBars(sym, timeframe) }} defaultTimeframe={timeframe} />
          <WatchlistPanel onLoadSymbol={(sym) => { setSymbol(sym); if (autoLoadChange) loadBars(sym, timeframe) }} />
          <WatchlistNavigator onLoad={(sym, tf) => { setSymbol(sym); if (tf) setTimeframe(tf); if (autoLoadChange) loadBars(sym, tf || timeframe) }} />
        </div>
      )}

      <BuildInfoFooter />
      </div>

      {/* Floating Help Button */}
      <HelpFab />
    </div>
  )
}
