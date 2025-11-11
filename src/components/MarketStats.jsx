import React, { useMemo } from 'react'
import { computeStates } from '../utils/indicators.js'

export default function MarketStats({ bars = [], saty, symbol, timeframe, streaming, consensus, threshold = 70 }) {
  const stats = useMemo(() => {
    if (!bars.length) return null
    const last = bars[bars.length - 1]
    const prev = bars[bars.length - 2] || last
    const close = last.close
    const change = close - prev.close
    const changePct = prev.close ? (change / prev.close) * 100 : 0
    const atr = saty?.atr || 0
    const rangePct = saty?.rangeUsed ? saty.rangeUsed * 100 : 0
    return { close, change, changePct, atr, rangePct }
  }, [bars, saty])

  // Market Regime Detection (AI Feature #3)
  const regime = useMemo(() => {
    if (!bars?.length) return 'unknown'
    const state = computeStates(bars)
    const ichiRegime = state?.ichiRegime || 'neutral'
    const pivotRegime = state?.pivotNow || 'neutral'

    // Combined regime analysis
    if (ichiRegime === 'bullish' && pivotRegime === 'bullish') return 'trending-up'
    if (ichiRegime === 'bearish' && pivotRegime === 'bearish') return 'trending-down'
    if (state?.sq?.on) return 'ranging'
    return 'volatile'
  }, [bars])

  const regimeConfig = {
    'trending-up': { label: 'Trending Up', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: '📈' },
    'trending-down': { label: 'Trending Down', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30', icon: '📉' },
    'ranging': { label: 'Ranging', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', icon: '↔️' },
    'volatile': { label: 'Volatile', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', icon: '⚡' },
    'unknown': { label: 'Loading', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30', icon: '⏳' },
  }

  if (!stats) return null

  // Score sparkline
  const scoreData = useMemo(() => {
    try {
      const N = Math.min(40, Math.max(0, bars.length))
      const start = bars.length - N
      const arr = []
      for (let i = start; i < bars.length; i++) {
        const slice = bars.slice(0, i + 1)
        const st = computeStates(slice)
        arr.push({ t: slice[slice.length - 1].time, v: st.score })
      }
      return arr
    } catch { return [] }
  }, [bars])

  const lastScore = scoreData.length ? Math.round(scoreData[scoreData.length - 1].v || 0) : null

  const spark = (() => {
    if (!scoreData.length) return null
    const w = 140, h = 32, pad = 2
    let min = Infinity, max = -Infinity
    for (const p of scoreData) { if (p.v < min) min = p.v; if (p.v > max) max = p.v }
    if (!isFinite(min) || !isFinite(max)) return null
    if (min === max) { min -= 1; max += 1 }
    const toX = (i) => pad + (i * (w - pad * 2)) / Math.max(1, scoreData.length - 1)
    const toY = (v) => pad + (h - pad * 2) * (1 - (v - min) / (max - min))
    const pts = scoreData.map((p, i) => `${Math.round(toX(i))},${Math.round(toY(p.v))}`).join(' ')
    const last = scoreData[scoreData.length - 1]
    return (
      <svg width={w} height={h} className="block">
        <polyline fill="none" stroke="#22c55e" strokeWidth="2" points={pts} />
        <circle cx={Math.round(toX(scoreData.length - 1))} cy={Math.round(toY(last.v))} r="3" fill="#22c55e" />
      </svg>
    )
  })()

  const regimeStyle = regimeConfig[regime]

  return (
    <section className="card p-4">
      {/* Header with Symbol and Market Regime Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              {symbol} · {timeframe}
            </h3>
            <p className="text-xs text-slate-400">Market statistics and AI regime detection</p>
          </div>
        </div>

        {/* Market Regime Badge (AI Feature #3) */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${regimeStyle.bg} border ${regimeStyle.border}`}>
          <span className="text-xl">{regimeStyle.icon}</span>
          <div>
            <div className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Market Regime</div>
            <div className={`text-sm font-bold ${regimeStyle.color}`}>{regimeStyle.label}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Last Price */}
        <div className="stat-tile">
          <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
            <span className="text-lg">💵</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400">Last</div>
            <div className="stat-value text-sm text-slate-100">${stats.close.toFixed(2)}</div>
          </div>
        </div>

        {/* Change */}
        <div className="stat-tile">
          <div className={`stat-icon bg-gradient-to-br ${stats.change >= 0 ? 'from-emerald-500/20 to-emerald-600/20' : 'from-rose-500/20 to-rose-600/20'}`}>
            <span className="text-lg">{stats.change >= 0 ? '📈' : '📉'}</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400">Change</div>
            <div className={`stat-value text-sm ${stats.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}
            </div>
            <div className={`text-[10px] ${stats.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ({stats.changePct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* ATR */}
        <div className="stat-tile">
          <div className="stat-icon bg-gradient-to-br from-violet-500/20 to-violet-600/20">
            <span className="text-lg">📊</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400">ATR₁₄</div>
            <div className="stat-value text-sm text-violet-400">${stats.atr ? stats.atr.toFixed(2) : '—'}</div>
          </div>
        </div>

        {/* Range Used */}
        <div className="stat-tile">
          <div className="stat-icon bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
            <span className="text-lg">📏</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400">Range</div>
            <div className="stat-value text-sm text-cyan-400">{stats.rangePct ? `${stats.rangePct.toFixed(0)}%` : '—'}</div>
          </div>
        </div>

        {/* Mode */}
        <div className="stat-tile">
          <div className={`stat-icon bg-gradient-to-br ${streaming ? 'from-emerald-500/20 to-emerald-600/20' : 'from-slate-500/20 to-slate-600/20'}`}>
            <span className="text-lg">{streaming ? '⚡' : '📸'}</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400">Mode</div>
            <div className={`stat-value text-sm ${streaming ? 'text-emerald-400' : 'text-slate-300'}`}>
              {streaming ? 'Live' : 'Snap'}
            </div>
          </div>
        </div>

        {/* Score with Sparkline */}
        {lastScore != null && (
          <div className="stat-tile">
            <div className={`stat-icon bg-gradient-to-br ${lastScore >= threshold ? 'from-emerald-500/20 to-emerald-600/20' : 'from-amber-500/20 to-amber-600/20'}`}>
              <span className="text-lg">🦄</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400">Score</div>
              <div className={`stat-value text-sm ${lastScore >= threshold ? 'text-emerald-400' : 'text-amber-400'}`}>
                {lastScore}
              </div>
              {spark && <div className="mt-1 opacity-60">{spark}</div>}
            </div>
          </div>
        )}

        {/* Consensus (if available) */}
        {consensus && consensus.secTf && (
          <div className="stat-tile">
            <div className={`stat-icon bg-gradient-to-br ${consensus.align ? 'from-emerald-500/20 to-emerald-600/20' : 'from-slate-500/20 to-slate-600/20'}`}>
              <span className="text-lg">{consensus.align ? '✓' : '✗'}</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400">{consensus.secTf}</div>
              <div className={`stat-value text-sm ${consensus.align ? 'text-emerald-400' : 'text-slate-400'}`}>
                {consensus.align ? 'Aligned' : 'Mixed'}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
