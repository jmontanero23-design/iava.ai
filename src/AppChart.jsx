import React, { useEffect, useMemo, useRef, useState } from 'react'
import TradingViewChartEmbed from './components/TradingViewChartEmbed.jsx'
import { emaCloud, ichimoku, satyAtrLevels, pivotRibbonTrend, computeStates, pivotRibbon, ttmBands, ttmSqueeze } from './utils/indicators.js'
import { useMarketData } from './contexts/MarketDataContext.jsx'
import SqueezePanel from './components/chart/SqueezePanel.jsx'
import SignalsPanel from './components/SignalsPanel.jsx'
import SatyPanel from './components/SatyPanel.jsx'
import { fetchBars } from './services/yahooFinance.js' // Yahoo Finance - FREE unlimited data!
import HealthBadge from './components/HealthBadge.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'
import Presets from './components/Presets.jsx'
import PresetHelp from './components/PresetHelp.jsx'
import StatusBar from './components/StatusBar.jsx'
import LegendChips from './components/LegendChips.jsx'
import MarketStats from './components/MarketStats.jsx'
import UnicornCallout from './components/UnicornCallout.jsx'
import UnicornScorePanel from './components/UnicornScorePanel.jsx'
import SatyLevelsOverlay from './components/SatyLevelsOverlay.jsx'
import BacktestPanel from './components/BacktestPanel.jsx'
import RateLimitBanner from './components/RateLimitBanner.jsx'
import HelpFab from './components/HelpFab.jsx'
import OrdersPanel from './components/OrdersPanel.jsx'
import SatyTargets from './components/SatyTargets.jsx'
import InfoPopover from './components/InfoPopover.jsx'
import SymbolSearch from './components/SymbolSearch.jsx'
import { readParams, writeParams } from './utils/urlState.js'
import OverlayChips from './components/OverlayChips.jsx'
import useStreamingBars from './hooks/useStreamingBars.js'
import WatchlistPanel from './components/WatchlistPanel.jsx'
import WatchlistNavigator from './components/WatchlistNavigator.jsx'
import ScannerPanel from './components/ScannerPanel.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import AIInsightsPanel from './components/AIInsightsPanel.jsx'
// QueueMonitor removed - dev tool not needed for users

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

// PhD++ FIX: Get saved symbol from localStorage immediately (prevents AAPL default flash)
const getInitialSymbol = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('iava.settings') || '{}')
    return saved.symbol || 'SPY' // Default to SPY if nothing saved (market index)
  } catch {
    return 'SPY'
  }
}

const getInitialTimeframe = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('iava.settings') || '{}')
    return saved.timeframe || '1Min'
  } catch {
    return '1Min'
  }
}

export default function AppChart() {
  const { updateMarketData } = useMarketData()
  const [symbol, setSymbol] = useState(getInitialSymbol)
  const [timeframe, setTimeframe] = useState(getInitialTimeframe)
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
  const streamingAllowed = (import.meta.env.VITE_STREAMING_ALLOWED || 'true').toString().toLowerCase() === 'true'
  const [streaming, setStreaming] = useState(false)
  const [hud, setHud] = useState('')
  const symbolDebounceTimer = useRef(null)
  const [secBars, setSecBars] = useState([])
  const [consensus, setConsensus] = useState(null)
  const [consensusBonus, setConsensusBonus] = useState(false)
  const [presetSuggesting, setPresetSuggesting] = useState(false)
  const [presetSuggestErr, setPresetSuggestErr] = useState('')
  const [llmReady, setLlmReady] = useState(null)
  const [rateLimitUntil, setRateLimitUntil] = useState(0)
  const showRateBanner = (import.meta.env.VITE_SHOW_RATE_BANNER || 'false').toString().toLowerCase() === 'true'
  const [bottomTab, setBottomTab] = useState('discover')
  // Keyboard shortcuts (presets and nav)
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : ''
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)
      if (isTyping) return
      // Number keys map to presets (skip manual)
      const presetOrder = ['trendDaily','pullbackDaily','intradayBreakout','dailyTrendFollow','meanRevertIntraday','breakoutDailyStrong','momentumContinuation']
      const n = parseInt(e.key, 10)
      if (!isNaN(n) && n >= 1 && n <= presetOrder.length) {
        const id = presetOrder[n - 1]
        applyPreset(id)
      }
      // Quick nav: left/right arrows to move visible range by small step when chart focused (handled inside chart), here we keep for future
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // AI-triggered symbol loading - allow AI to auto-load stocks for analysis
  useEffect(() => {
    const handler = (e) => {
      const { symbol: newSymbol, timeframe: newTimeframe } = e.detail || {}

      if (newSymbol) {
        setSymbol(newSymbol)

        if (newTimeframe) {
          setTimeframe(newTimeframe)
        }

        // loadBars will be called after state updates
        const tfToUse = newTimeframe || timeframe
        setTimeout(() => {
          loadBars(newSymbol, tfToUse)
        }, 50)
      }
    }
    window.addEventListener('iava.loadSymbol', handler)
    return () => {
      window.removeEventListener('iava.loadSymbol', handler)
    }
  }, [timeframe, symbol])

  function mlabel(id) {
    const map = {
      trendDaily: 'Trend+Daily',
      pullbackDaily: 'Pullback+Daily',
      intradayBreakout: 'Breakout (Intra)',
      dailyTrendFollow: 'Daily Trend',
      meanRevertIntraday: 'Mean Revert',
      breakoutDailyStrong: 'Breakout Strong',
      momentumContinuation: 'Momentum Cont',
    }
    return map[id] || id
  }

  // Suggest backtest params based on selected preset
  const backtestPreset = useMemo(() => {
    const map = {
      trendDaily: { th: 70, hz: 10, regime: 'bull' },
      pullbackDaily: { th: 65, hz: 20, regime: 'bull' },
      intradayBreakout: { th: 75, hz: 8, regime: 'none' },
      dailyTrendFollow: { th: 70, hz: 20, regime: 'bull' },
      meanRevertIntraday: { th: 55, hz: 5, regime: 'bear' },
      breakoutDailyStrong: { th: 80, hz: 12, regime: 'bull' },
      momentumContinuation: { th: 70, hz: 10, regime: 'none' },
    }
    return map[mtfPreset] || null
  }, [mtfPreset])

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
    // Provide squeeze bands + ON map for visual confirmation (shares toggle with panel)
    if (showSqueeze) {
      base.squeezeBands = ttmBands(bars, 20, 2, 1.5)
      base.squeezeOn = ttmSqueeze(bars.map(b=>b.close), bars.map(b=>b.high), bars.map(b=>b.low), 20, 2, 1.5)
    }
    return base
  }, [bars, showEma821, showEma512, showEma89, showEma3450, showIchi, showSaty, showSqueeze])

  // Preset configs (used by hints, applyPreset, and AI suggestions)
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
    breakoutDailyStrong: {
      showEma821: true,
      showEma512: true,
      showEma89: false,
      showEma3450: true,
      showRibbon: true,
      showIchi: true,
      enforceDaily: true,
    },
    momentumContinuation: {
      showEma821: true,
      showEma512: false,
      showEma89: true,
      showEma3450: false,
      showRibbon: true,
      showIchi: false,
      enforceDaily: false,
    },
  }

  const presetDescriptions = {
    manual: 'Customize overlays, gating, and parameters manually. Hint: red chips on the chart show overlays a preset expects that are currently OFF.',
    trendDaily: 'Trend-following with EMA 8/21/34 + Ichimoku; Daily confluence ON. Use for aligned trends. Hint: red chips on chart indicate expected overlays are OFF.',
    pullbackDaily: 'Pullbacks with EMA 5/12 and 8/9 in trend context; Daily confluence ON. Hint: red chips on chart indicate expected overlays are OFF.',
    intradayBreakout: 'Intraday momentum breakouts; lighter regime filter. Best on liquid names during session. Hint: red chips on chart indicate expected overlays are OFF.',
    dailyTrendFollow: 'Swing trend entries with Daily alignment; higher conviction, slower cadence. Hint: red chips on chart indicate expected overlays are OFF.',
    meanRevertIntraday: 'Counter‑trend fades on intraday extremes; use smaller risk and tighter stops. Hint: red chips on chart indicate expected overlays are OFF.',
    breakoutDailyStrong: 'Stronger breakout stack (EMAs + Ichimoku) with Daily confluence ON. Hint: red chips on chart indicate expected overlays are OFF.',
    momentumContinuation: 'Continuation after initial push; ribbon + fast EMA cloud for momentum. Hint: red chips on chart indicate expected overlays are OFF.',
  }

  // Preset overlay expectations vs current state (for gentle hints)
  const presetExpected = useMemo(() => {
    if (mtfPreset === 'manual') return null
    const p = presets[mtfPreset]
    if (!p) return null
    return {
      ema821: !!p.showEma821,
      ema512: !!p.showEma512,
      ema89: !!p.showEma89,
      ema3450: !!p.showEma3450,
      ribbon: !!p.showRibbon,
      ichi: !!p.showIchi,
    }
  }, [mtfPreset])
  const currentOverlay = useMemo(() => ({
    ema821: !!showEma821,
    ema512: !!showEma512,
    ema89: !!showEma89,
    ema3450: !!showEma3450,
    ribbon: !!showRibbon,
    ichi: !!showIchi,
  }), [showEma821, showEma512, showEma89, showEma3450, showRibbon, showIchi])

  const [account, setAccount] = useState(null)
  const signalState = useMemo(() => computeStates(bars), [bars])
  const dailyState = useMemo(() => (dailyBars?.length ? computeStates(dailyBars) : null), [dailyBars])

  // ULTRA ELITE AI INTEGRATION - Backend API call (environment variables accessible on server)
  const [aiScore, setAiScore] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Calculate Ultra Elite AI Score when symbol or bars change
  useEffect(() => {
    if (!bars || bars.length < 50 || !symbol) return

    let cancelled = false
    setAiLoading(true)

    // Prepare data for AI analysis
    const prepareAIData = () => {
      const closes = bars.map(b => b.close)
      const candles = bars.slice(-100).map(b => ({
        time: b.time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume
      }))

      return {
        prices: closes,
        candles: candles,
        news: `${symbol} stock market analysis`,  // Could integrate real news API
        state: signalState,
        technicals: signalState
      }
    }

    // Call backend API to calculate AI score (AVA Sentiment engine)
    const calculateAI = async () => {
      try {
        const aiData = prepareAIData()

        // Call backend API endpoint with gated bonus settings
        const response = await fetch('/api/ai/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            data: aiData,
            settings: {
              enforceDaily,
              consensusBonus,
              dailyState,
              consensus
            }
          })
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const { success, score } = await response.json()

        if (!cancelled && success) {
          setAiScore(score)
          console.log('🦄 Ultra Elite AI Score:', score)
        }
      } catch (error) {
        console.error('AI Score calculation error:', error)
        if (!cancelled) {
          setAiScore(null)
        }
      } finally {
        if (!cancelled) {
          setAiLoading(false)
        }
      }
    }

    calculateAI()

    return () => {
      cancelled = true
    }
  }, [symbol, bars, signalState, enforceDaily, consensusBonus, dailyState, consensus])

  // Publish market data to context for AI Chat and other features
  useEffect(() => {
    // PhD++ CRITICAL FIX: Only update context when bars actually change
    // DO NOT trigger on symbol/timeframe change to avoid race condition
    // where NEW symbol + OLD bars creates mismatched data
    if (!bars || bars.length === 0) {
      return
    }

    const currentPrice = bars[bars.length - 1]?.close

    // PhD++ CRITICAL: Verify bars match current symbol before publishing
    // This prevents stale data from being published during symbol transitions
    updateMarketData({
      symbol,
      timeframe,
      currentPrice,
      bars,
      signalState,
      dailyState,
      overlays,
      threshold,
      enforceDaily,
      consensusBonus,
      consensus,
      account,
      usingSample,
      unicornScore: aiScore,  // Ultra Unicorn Score (50% tech + 25% sentiment + 25% forecast)
      isLoading: false        // PhD++ Mark loading complete - safe to read data now
    })

    // Notify components that symbol has loaded
    window.dispatchEvent(new CustomEvent('iava.symbolLoaded', {
      detail: { symbol, timeframe, bars: bars.length, currentPrice }
    }))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bars, signalState, dailyState, overlays, threshold, enforceDaily, consensusBonus, consensus, account, usingSample, aiScore])

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

      // PhD++ CRITICAL FIX: Mark as loading IMMEDIATELY to prevent stale reads
      // This tells Copilot/Forecast to wait for fresh data
      updateMarketData({
        isLoading: true,
        symbol: s,        // Update symbol immediately so components know what's loading
        timeframe: tf
      })

      // Yahoo Finance - FREE unlimited data, no rate limits!
      const res = await fetchBars(s, tf, 500)
      if (myId !== loadReq.current) {
        return
      }
      if (Array.isArray(res) && res.length) {
        setBars(res)
        setUsingSample(false)
      }
      else throw new Error('No data returned')
    } catch (e) {
      console.error('[AppChart] loadBars error:', e)
      if (e && e.code === 'RATE_LIMIT') {
        if (showRateBanner) {
          const secs = Math.max(3, parseInt(e.retryAfter || '0', 10) || 5)
          setRateLimitUntil(Date.now() + secs * 1000)
          setError('Rate limit hit. Using current data…')
        } else {
          setError('')
        }
      } else {
        setError(e?.message || 'Failed to load data; using sample if empty')
      }
      // Only fall back to sample if we have nothing to show yet; otherwise keep current bars
      setBars(prev => (Array.isArray(prev) && prev.length) ? prev : generateSampleOHLC())
      setUsingSample(prev => (Array.isArray(bars) && bars.length) ? prev : true)
    } finally {
      setLoading(false)
      setUpdatedAt(Date.now())
    }
  }

  async function loadDaily(s = symbol) {
    try {
      // Yahoo Finance - Daily bars for regime detection
      const res = await fetchBars(s, '1Day', 400)
      if (Array.isArray(res) && res.length) setDailyBars(res)
    } catch {}
  }

  // Load secondary timeframe for consensus (e.g., 1Min->5Min, 5Min->15Min, 15Min->1Hour)
  function mapSecondary(tf) {
    const t = (tf || '').toLowerCase()
    if (t.includes('1min')) return '5Min'
    if (t.includes('5min')) return '15Min'
    if (t.includes('15min')) return '1Hour'
    return null
  }

  async function loadSecondary(s = symbol, tf = timeframe) {
    const sec = mapSecondary(tf)
    if (!sec) { setSecBars([]); setConsensus(null); return }
    try {
      // Yahoo Finance - Secondary timeframe for consensus
      const res = await fetchBars(s, sec, 500)
      setSecBars(Array.isArray(res) ? res : [])
    } catch { setSecBars([]) }
  }

  useEffect(() => {
    // Load persisted settings
    // PhD++ NOTE: symbol & timeframe are now read at initialization (getInitialSymbol/getInitialTimeframe)
    // This prevents the "flash" where AAPL loads first before localStorage value is applied
    try {
      const saved = JSON.parse(localStorage.getItem('iava.settings') || '{}')
      const qp = readParams()
      // Symbol & timeframe already initialized from localStorage, only override with URL params
      if (typeof saved.autoRefresh === 'boolean') setAutoRefresh(saved.autoRefresh)
      if (typeof saved.refreshSec === 'number') setRefreshSec(saved.refreshSec)
      if (typeof saved.streaming === 'boolean') setStreaming(saved.streaming)
      if (typeof saved.consensusBonus === 'boolean') setConsensusBonus(saved.consensusBonus)
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
      if (typeof qp.consensusBonus === 'boolean') setConsensusBonus(qp.consensusBonus)
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
    if (consensusBonus) loadSecondary()
    // Fetch account once for trade sizing
    fetch('/api/alpaca/account').then(r => r.json()).then(setAccount).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
  const prefs = {
      symbol, timeframe, autoRefresh, refreshSec,
      showIchi, showRibbon, showSaty, showSqueeze,
      showEma821, showEma512, showEma89, showEma3450,
      autoLoadChange, streaming, consensusBonus,
    }
    try { localStorage.setItem('iava.settings', JSON.stringify(prefs)) } catch {}
  }, [symbol, timeframe, autoRefresh, refreshSec, showIchi, showRibbon, showSaty, showSqueeze, showEma821, showEma512, showEma89, showEma3450, autoLoadChange])

  // Sync key UI state to URL for deep links
  useEffect(() => {
    writeParams({ symbol, timeframe, threshold, enforceDaily, streaming, consensusBonus, showEma821, showEma512, showEma89, showEma3450, showIchi, showRibbon, showSaty })
  }, [symbol, timeframe, threshold, enforceDaily, streaming, consensusBonus, showEma821, showEma512, showEma89, showEma3450, showIchi, showRibbon, showSaty])


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

  // Detect LLM availability for Suggest Preset (AI) enable/disable
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/health')
        const j = await r.json()
        if (mounted) setLlmReady(Boolean(j?.api?.llm?.configured))
      } catch { if (mounted) setLlmReady(false) }
    })()
    return () => { mounted = false }
  }, [])

  async function suggestPresetAI() {
    try {
      setPresetSuggesting(true); setPresetSuggestErr('')
      const statePayload = { ...signalState, _bars: bars.map(b => ({ ...b, symbol })), _daily: dailyState, _timeframe: timeframe }
      const allowed = Object.keys(presets).filter(k => k !== 'manual')
      const r = await fetch('/api/llm/preset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: statePayload, presets: allowed }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      const label = mlabel(j.presetId || '')
      const reason = j.reason || 'AI suggestion'
      const apply = window.confirm(`AI suggests: ${label}\nReason: ${reason}\nApply this preset and parameters?`)
      if (apply && j.presetId && presets[j.presetId]) {
        applyPreset(j.presetId)
        if (j.params && typeof j.params.th === 'number') setThreshold(Math.max(0, Math.min(100, Math.round(j.params.th))))
      }
    } catch (e) {
      setPresetSuggestErr(String(e.message || e))
    } finally {
      setPresetSuggesting(false)
    }
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
    // Debounce symbol changes to prevent rapid-fire requests
    if (symbolDebounceTimer.current) {
      clearTimeout(symbolDebounceTimer.current)
    }

    symbolDebounceTimer.current = setTimeout(() => {
      loadDaily(symbol)
      loadSecondary(symbol, timeframe)
    }, 300) // Wait 300ms after last change before fetching

    return () => {
      if (symbolDebounceTimer.current) {
        clearTimeout(symbolDebounceTimer.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  useEffect(() => { if (consensusBonus) loadSecondary(symbol, timeframe); else { setSecBars([]); setConsensus(null) } /* eslint-disable-line react-hooks/exhaustive-deps */ }, [timeframe, consensusBonus])

  // Compute consensus with secondary timeframe
  useEffect(() => {
    const secTf = mapSecondary(timeframe)
    if (!secTf || !secBars?.length || !bars?.length) { setConsensus(null); return }
    try {
      const primary = computeStates(bars)
      const secondary = computeStates(secBars)
      const align = (primary.pivotNow === secondary.pivotNow) && primary.pivotNow !== 'neutral'
      setConsensus({ secTf, align, primary, secondary })
    } catch { setConsensus(null) }
  }, [bars, secBars, timeframe])

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
    <div className="min-h-screen bg-transparent text-slate-100 bg-grid">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {showRateBanner && <RateLimitBanner until={rateLimitUntil} />}

        {/* Workflow rail – core superpowers */}
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
          <div className="pill-chip">
            <span className="pill-dot" />
            <span>Understand Setup (Chart + AI)</span>
          </div>
          <div className="pill-chip">
            <span className="pill-dot" />
            <span>Scan & Build Watchlists</span>
          </div>
          <div className="pill-chip">
            <span className="pill-dot" />
            <span>Backtest & Tune Thresholds</span>
          </div>
          <div className="pill-chip">
            <span className="pill-dot" />
            <span>Execute & Journal</span>
          </div>
        </div>

        {/* Floor 1 – Global control rail */}
        <div className="card overflow-hidden">
          <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative space-y-4">
            {/* Symbol / timeframe / preset rail */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-50 animate-pulse" />
                  <span className="relative text-2xl filter drop-shadow-lg">📈</span>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text text-transparent">
                  Chart Controls
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <SymbolSearch value={symbol} onChange={setSymbol} onSubmit={(sym) => loadBars(sym, timeframe)} />
                <select value={timeframe} onChange={e => { const tf = e.target.value; setTimeframe(tf); if (autoLoadChange) loadBars(symbol, tf) }} className="select bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all">
                  <option value="1Min">1Min</option>
                  <option value="5Min">5Min</option>
                  <option value="15Min">15Min</option>
                  <option value="1Hour">1Hour</option>
                  <option value="1Day">1Day</option>
                </select>
                <button onClick={() => loadBars()} className="relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                  <span className="relative text-white">Load</span>
                </button>
                {loading && <span className="text-xs text-slate-400">Loading…</span>}
                {error && !loading && <span className="text-xs text-rose-400">{error}</span>}
              </div>
            </div>

            {/* Strategy presets row */}
            <div className="w-full">
              <Presets symbol={symbol} setSymbol={setSymbol} timeframe={timeframe} setTimeframe={setTimeframe} onLoad={(s, tf) => loadBars(s, tf)} />
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>⌨️</span>
              <span>Shortcuts: 1–7 switch presets · ←/→ navigate watchlist · Space toggle Auto</span>
            </div>
          </div>
          </div>

          {/* Floor 1 – Strategy, overlays, gating & status */}
          <div className="p-5 space-y-4">
          {/* Strategy Preset Section */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <div className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Strategy Preset</div>
              <InfoPopover title="Overlays">Toggle EMA Clouds (pullback/trend), Ichimoku (regime), Pivot Ribbon (8/21/34) and SATY ATR levels (targets).</InfoPopover>
              <button onClick={() => { try { window.dispatchEvent(new CustomEvent('iava.help', { detail: { question: 'Which overlays should I enable for this setup?', context: { overlays: { showEma821, showEma512, showEma89, showEma3450, showIchi, showRibbon, showSaty, showSqueeze }, timeframe, symbol } } })) } catch {} }} className="text-xs text-purple-400 hover:text-purple-300 underline transition-colors">Ask AI</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={mtfPreset} onChange={e => applyPreset(e.target.value)} className="select bg-slate-800/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all">
                <option value="manual">Manual</option>
                <option value="trendDaily">Trend + Daily Confluence</option>
                <option value="pullbackDaily">Pullback + Daily Confluence</option>
                <option value="intradayBreakout">Intraday Breakout</option>
                <option value="dailyTrendFollow">Daily Trend Follow</option>
                <option value="meanRevertIntraday">Mean Revert (Intra)</option>
                <option value="breakoutDailyStrong">Breakout (Daily, Strong)</option>
                <option value="momentumContinuation">Momentum Continuation</option>
              </select>
              <InfoPopover title="Preset Guidance">{presetDescriptions[mtfPreset] || "Strategy-driven overlay & gating configuration."}</InfoPopover>
              <PresetHelp descriptions={presetDescriptions} />
              <button onClick={suggestPresetAI} disabled={presetSuggesting || llmReady === false} title={llmReady === false ? 'LLM not configured' : ''} className="relative group px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden disabled:opacity-50">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all" />
                <span className="relative text-white">
                  {presetSuggesting ? 'Suggesting…' : '🤖 Suggest Preset'}
                </span>
              </button>
              {presetSuggestErr && <span className="text-xs text-rose-400">{presetSuggestErr}</span>}
            </div>
          </div>

          {/* Overlays Section */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">📊</span>
              <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Technical Overlays</div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30" checked={showEma821} onChange={e => setShowEma821(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-indigo-300 transition-colors">EMA 8/21</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/30" checked={showEma512} onChange={e => setShowEma512(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-cyan-300 transition-colors">EMA 5/12</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-violet-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-violet-500 focus:ring-2 focus:ring-violet-500/30" checked={showEma89} onChange={e => setShowEma89(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-violet-300 transition-colors">EMA 8/9</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-emerald-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500/30" checked={showEma3450} onChange={e => setShowEma3450(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-emerald-300 transition-colors">EMA 34/50</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30" checked={showIchi} onChange={e => setShowIchi(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-indigo-300 transition-colors">Ichimoku</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-lime-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-lime-500 focus:ring-2 focus:ring-lime-500/30" checked={showRibbon} onChange={e => setShowRibbon(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-lime-300 transition-colors">Pivot Ribbon</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30" checked={showSaty} onChange={e => setShowSaty(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-indigo-300 transition-colors">SATY ATR Levels</span>
              </label>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/30 text-sm text-slate-400 flex items-center gap-4 flex-wrap">
              <div>Trend: <span className="text-slate-200 font-semibold">{pivotRibbonTrend(bars.map(b => b.close))}</span></div>
              {showSaty && overlays.saty?.atr && (
                <>
                  <div>ATR: <span className="text-slate-200 font-semibold">{overlays.saty.atr.toFixed(2)}</span></div>
                  <div>Range used: <span className="text-slate-200 font-semibold">{Math.round(overlays.saty.rangeUsed * 100)}%</span></div>
                </>
              )}
            </div>
          </div>

          {/* Settings & Automation Section */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">⚙️</span>
              <div className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">Settings & Automation</div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-indigo-300 transition-colors">Auto-Refresh</span>
              </label>
              <select value={refreshSec} onChange={e => setRefreshSec(parseInt(e.target.value,10))} className="select bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm">
                <option value={5}>5s</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
              {streamingAllowed && (
                <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/30 transition-all" title={timeframe==='1Day' ? 'Streaming disabled on Daily' : ''}>
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/30" checked={streaming} disabled={timeframe==='1Day'} onChange={e => { setStreaming(e.target.checked); if (e.target.checked) setAutoRefresh(false) }} />
                  <span className="text-sm text-slate-300 group-hover:text-cyan-300 transition-colors">Streaming (beta)</span>
                  <InfoPopover title="Streaming (beta)">Live bars via SSE. Use for intraday. Falls back to polling when off.</InfoPopover>
                </label>
              )}
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30" checked={autoLoadChange} onChange={e => setAutoLoadChange(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-indigo-300 transition-colors">Auto-Load on Change</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30" checked={enforceDaily} onChange={e => setEnforceDaily(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-indigo-300 transition-colors">Enforce Daily Confluence</span>
                <InfoPopover title="Daily Confluence">Requires Daily Pivot + Ichimoku agreement with your direction (bull for longs, bear for shorts). Use for higher conviction; toggle off to explore setups with soft risk.</InfoPopover>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-2 focus:ring-indigo-500/30" checked={consensusBonus} onChange={e => setConsensusBonus(e.target.checked)} />
                <span className="text-sm text-slate-300 group-hover:text-indigo-300 transition-colors">Consensus Bonus</span>
                <InfoPopover title="Consensus Bonus">Adds +10 to displayed score when primary TF trend matches the secondary TF (e.g., 5→15Min). Use as a visual nudge; does not change API backtests unless you enable consensus server-side.</InfoPopover>
              </label>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center gap-3">
              <span className="text-sm text-slate-400 font-semibold">Threshold</span>
              <InfoPopover title="Threshold">Minimum Unicorn Score to consider a setup. Raise to be more selective; lower to explore more candidates. Scanner applies threshold after gating.</InfoPopover>
              <input aria-label="Threshold slider" type="range" min={0} max={100} value={threshold} onChange={e => setThreshold(parseInt(e.target.value,10))} className="flex-1 max-w-xs accent-indigo-500" />
              <input aria-label="Threshold value" type="number" min={0} max={100} value={threshold} onChange={e => setThreshold(parseInt(e.target.value,10)||0)} className="input w-16 bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
            </div>
          </div>

          {/* Status & sharing */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <HealthBadge />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded-full bg-slate-800/70 border border-slate-600/70">Paper / Live via Alpaca &amp; Yahoo</span>
              <button onClick={() => { try { navigator.clipboard.writeText(window.location.href); window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Link copied', type: 'success' } })) } catch(_) {} }} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all">
              🔗 Copy Link
            </button>
            </div>
          </div>
        </div>
        </div>

        {/* Floor 2 – Live symbol view: chart + AI + trade */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left: Chart + stats + signals */}
          <div className="xl:col-span-2 space-y-4">
            <MarketStats bars={bars} saty={overlays.saty} symbol={symbol} timeframe={timeframe} streaming={streaming || autoRefresh} consensus={consensus} threshold={threshold} />
            <LegendChips overlays={overlays} />
            <div className="relative w-full" style={{ height: '600px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 z-10">
            <div className="text-slate-400">Loading {symbol}...</div>
          </div>
        )}
        <TradingViewChartEmbed />

        {/* Preset label overlay */}
        {mtfPreset !== 'manual' && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-xs text-indigo-200">
            {mlabel(mtfPreset)}
          </div>
        )}

            {/* AI-powered overlays on chart */}
            {/* iAVA Unicorn Score Overlay */}
            <div className="absolute top-4 right-4 z-20">
              <UnicornScorePanel state={signalState.state} />
            </div>

            {/* SATY Levels Overlay */}
            <div className="absolute top-[280px] right-4 z-20">
              <SatyLevelsOverlay
                saty={signalState.state?.saty}
                currentPrice={bars[bars.length - 1]?.close}
              />
            </div>

          </div>

            {/* Signals & squeeze */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <SignalsPanel bars={bars} state={{ ...signalState, score: (signalState?.score || 0) + ((consensusBonus && consensus?.align) ? 10 : 0), components: { ...(signalState?.components||{}), ...(consensusBonus && consensus?.align ? { consensus: 10 } : {}) } }} symbol={symbol} onRefresh={() => loadBars()} onClear={() => setSignalHistory([])} />
              {showSqueeze && <SqueezePanel bars={bars} />}
            </div>
            <StatusBar symbol={symbol} timeframe={timeframe} bars={bars} usingSample={usingSample} updatedAt={updatedAt} stale={stale} rateLimitUntil={rateLimitUntil} />
          </div>

          {/* Right: AI insights + trade controls */}
          <div className="space-y-4">
            <AIInsightsPanel
              signal={signalState}
              bars={bars}
              symbol={symbol}
              timeframe={timeframe}
              account={account}
              aiScore={aiScore}
              aiLoading={aiLoading}
            />
            <UnicornCallout threshold={threshold} state={{ ...signalState, score: (signalState?.score || 0) + ((consensusBonus && consensus?.align) ? 10 : 0), _bars: bars.map(b => ({ ...b, symbol })), _account: account, _daily: dailyState, _enforceDaily: enforceDaily, _consensus: consensus, _timeframe: timeframe }} />
            <OrdersPanel symbol={symbol} lastPrice={bars[bars.length-1]?.close} saty={overlays.saty} />
          </div>
        </div>

        {/* Floor 3 – Discovery, testing & helpers */}
        <div className="mt-6 space-y-4">
          {/* Bottom tab nav */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setBottomTab('discover')}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1 transition-colors ${bottomTab === 'discover' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-900/70 text-slate-300 border-slate-700 hover:border-slate-500'}`}
            >
              <span>🔍</span>
              <span>Discover (Scan & Watchlists)</span>
            </button>
            <button
              onClick={() => setBottomTab('backtest')}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1 transition-colors ${bottomTab === 'backtest' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900/70 text-slate-300 border-slate-700 hover:border-slate-500'}`}
            >
              <span>📈</span>
              <span>Backtest & SATY</span>
            </button>
          </div>

          {bottomTab === 'discover' && (
            <section className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-200">Find Setups</h2>
                <span className="text-[11px] text-slate-400">Scanner · Smart Watchlists</span>
              </div>
              <ScannerPanel
                onLoadSymbol={(sym, tf) => { setSymbol(sym); setTimeframe(tf || timeframe); setHud(`${sym} · ${tf || timeframe}`); setTimeout(()=>setHud(''), 1500); loadBars(sym, tf || timeframe) }}
                defaultTimeframe={timeframe}
                currentTimeframe={timeframe}
                currentEnforceDaily={enforceDaily}
                currentConsensusBonus={consensusBonus}
              />
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <WatchlistNavigator onLoadSymbol={(sym, tf) => { setSymbol(sym); setHud(`${sym} · ${tf || timeframe}`); setTimeout(()=>setHud(''), 1500); loadBars(sym, tf || timeframe) }} timeframe={timeframe} />
                <WatchlistPanel onLoadSymbol={(sym) => { setSymbol(sym); loadBars(sym, timeframe) }} />
              </div>
            </section>
          )}

          {bottomTab === 'backtest' && (
            <section className="card p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-slate-200">Test & Tune</h2>
                <span className="text-[11px] text-slate-400">Backtests · Thresholds · SATY</span>
              </div>
              <BacktestPanel symbol={symbol} timeframe={timeframe} preset={backtestPreset} chartThreshold={threshold} chartConsensusBonus={consensusBonus} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SatyPanel saty={overlays.saty} trend={pivotRibbonTrend(bars.map(b => b.close))} />
                <SatyTargets saty={overlays.saty} last={bars[bars.length-1]} />
              </div>
            </section>
          )}

          {hud && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-md border border-slate-700 bg-slate-900/80 text-slate-100 text-sm shadow">
              {hud}
            </div>
          )}

          <StatusBar symbol={symbol} timeframe={timeframe} bars={bars} usingSample={usingSample} updatedAt={updatedAt} stale={stale} rateLimitUntil={rateLimitUntil} />
        </div>

        {/* Global helpers */}
        <OverlayChips
          showEma821={showEma821} setShowEma821={setShowEma821}
          showEma512={showEma512} setShowEma512={setShowEma512}
          showEma89={showEma89} setShowEma89={setShowEma89}
          showEma3450={showEma3450} setShowEma3450={setShowEma3450}
          showIchi={showIchi} setShowIchi={setShowIchi}
          showRibbon={showRibbon} setShowRibbon={setShowRibbon}
          showSaty={showSaty} setShowSaty={setShowSaty}
        />
        <HelpFab context={{ symbol, timeframe, enforceDaily, consensus: consensus?.align || false, overlays: { showEma821, showEma512, showEma89, showEma3450, showIchi, showRibbon, showSaty, showSqueeze }, score: Math.round((signalState?.score || 0) + ((consensusBonus && consensus?.align) ? 10 : 0)), daily: dailyState ? { pivot: dailyState.pivotNow, ichi: dailyState.ichiRegime } : null }} />
        <CommandPalette
          symbol={symbol}
          setSymbol={(s)=>{ setSymbol(s); loadBars(s, timeframe) }}
          loadBars={(s, tf)=>loadBars(s, tf)}
          timeframe={timeframe}
          setTimeframe={(tf)=>{ setTimeframe(tf); loadBars(symbol, tf) }}
          overlayState={{
            ema821: showEma821,
            ema512: showEma512,
            ema89: showEma89,
            ema3450: showEma3450,
            ribbon: showRibbon,
            ichi: showIchi,
            saty: showSaty,
            squeeze: showSqueeze,
          }}
          overlayToggles={{
            ema821: () => setShowEma821(v => !v),
            ema512: () => setShowEma512(v => !v),
            ema89: () => setShowEma89(v => !v),
            ema3450: () => setShowEma3450(v => !v),
            ribbon: () => setShowRibbon(v => !v),
            ichi: () => setShowIchi(v => !v),
            saty: () => setShowSaty(v => !v),
            squeeze: () => setShowSqueeze(v => !v),
          }}
          applyPreset={applyPreset}
        />
        <BuildInfoFooter />
      </div>
    </div>
  )
}
