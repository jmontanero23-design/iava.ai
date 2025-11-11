import React, { useMemo, useState } from 'react'
import { computeStates } from '../utils/indicators.js'
import { detectMarketRegime } from '../utils/regimeDetector.js'

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

  if (!stats) return null

  // Market Regime Detection
  const [showRegimeDetails, setShowRegimeDetails] = useState(false)
  const regime = useMemo(() => {
    try {
      // Get ichimoku data if available (we'll pass null for now, enhance later)
      return detectMarketRegime(bars, null, stats.atr)
    } catch {
      return null
    }
  }, [bars, stats.atr])

  // Build a tiny score sparkline from recent bars (last 40 points)
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
    const w = 160, h = 36, pad = 2
    let min = Infinity, max = -Infinity
    for (const p of scoreData) { if (p.v < min) min = p.v; if (p.v > max) max = p.v }
    if (!isFinite(min) || !isFinite(max)) return null
    if (min === max) { min -= 1; max += 1 }
    const toX = (i) => pad + (i * (w - pad * 2)) / Math.max(1, scoreData.length - 1)
    const toY = (v) => pad + (h - pad * 2) * (1 - (v - min) / (max - min))
    const pts = scoreData.map((p, i) => `${Math.round(toX(i))},${Math.round(toY(p.v))}`).join(' ')
    const last = scoreData[scoreData.length - 1]
    const scoreColor = last.v >= threshold ? '#22c55e' : '#94a3b8'
    return (
      <svg width={w} height={h} className="block">
        <polyline fill="none" stroke={scoreColor} strokeWidth="2" points={pts} />
        <circle cx={Math.round(toX(scoreData.length - 1))} cy={Math.round(toY(last.v))} r="3" fill={scoreColor} />
        {/* Threshold line */}
        <line x1={pad} y1={Math.round(toY(threshold))} x2={w-pad} y2={Math.round(toY(threshold))} stroke="#6366f1" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
      </svg>
    )
  })()

  // Trend arrow helper
  const getTrendArrow = (value) => {
    if (value > 0.1) return <span className="text-emerald-400">↑</span>
    if (value < -0.1) return <span className="text-rose-400">↓</span>
    return <span className="text-slate-500">→</span>
  }

  const items = [
    {
      label: 'Last',
      value: `$${stats.close.toFixed(2)}`,
      accent: 'text-slate-100',
      icon: null
    },
    {
      label: 'Change',
      value: `${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)}`,
      subValue: `${stats.changePct >= 0 ? '+' : ''}${stats.changePct.toFixed(2)}%`,
      accent: stats.change >= 0 ? 'text-emerald-400' : 'text-rose-400',
      icon: getTrendArrow(stats.change)
    },
    {
      label: 'ATR₁₄',
      value: stats.atr ? `$${stats.atr.toFixed(2)}` : '—',
      accent: 'text-slate-200'
    },
    {
      label: 'Range Used',
      value: stats.rangePct ? `${stats.rangePct.toFixed(0)}%` : '—',
      accent: stats.rangePct > 80 ? 'text-amber-400' : stats.rangePct > 50 ? 'text-slate-200' : 'text-slate-400',
      progress: stats.rangePct || 0
    },
    {
      label: 'Mode',
      value: streaming ? 'Live' : 'Poll',
      accent: streaming ? 'text-cyan-300' : 'text-slate-300',
      icon: streaming ? <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" /> : null
    },
  ]

  if (consensus && consensus.secTf) {
    const ok = consensus.align
    items.push({
      label: `MTF ${consensus.secTf}`,
      value: ok ? 'Aligned' : 'Mixed',
      accent: ok ? 'text-emerald-300' : 'text-slate-400',
      icon: ok ? <span>✓</span> : <span>✗</span>
    })
  }

  // Add score tile with sparkline
  if (lastScore != null) {
    items.push({
      label: 'Score',
      value: `${lastScore}`,
      accent: lastScore >= threshold ? 'text-emerald-400 font-bold' : 'text-slate-200',
      spark,
      scoreBadge: lastScore >= threshold ? 'Unicorn' : null
    })
  }

  return (
    <section className="card p-5 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-slate-100">{symbol}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-sm text-slate-400">{timeframe}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Market Regime Badge */}
          {regime && (
            <div className="relative">
              <button
                onClick={() => setShowRegimeDetails(!showRegimeDetails)}
                className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                style={(() => {
                  const colorMap = {
                    emerald: { bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.4)', text: '#10b981' },
                    rose: { bg: 'rgba(244,63,94,0.2)', border: 'rgba(244,63,94,0.4)', text: '#f43f5e' },
                    amber: { bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b' },
                    orange: { bg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.4)', text: '#f97316' },
                    cyan: { bg: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.4)', text: '#22d3ee' },
                    slate: { bg: 'rgba(148,163,184,0.2)', border: 'rgba(148,163,184,0.4)', text: '#94a3b8' }
                  }
                  const colors = colorMap[regime.color] || colorMap.slate
                  return {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: colors.text
                  }
                })()}
              >
                <span>{regime.icon}</span>
                <span>{regime.label}</span>
              </button>
              {showRegimeDetails && (
                <div className="absolute top-full right-0 mt-2 w-80 p-4 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl z-50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-200">Market Regime Analysis</h4>
                    <button onClick={() => setShowRegimeDetails(false)} className="text-slate-400 hover:text-slate-200">×</button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Confidence</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={(() => {
                              const colorMap = {
                                emerald: '#10b981',
                                rose: '#f43f5e',
                                amber: '#f59e0b',
                                orange: '#f97316',
                                cyan: '#22d3ee',
                                slate: '#94a3b8'
                              }
                              return {
                                width: `${regime.confidence}%`,
                                backgroundColor: colorMap[regime.color] || colorMap.slate
                              }
                            })()}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-200">{regime.confidence}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Recommendation</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{regime.recommendation}</p>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-2">Factors</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {regime.factors.adx && (
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">ADX</div>
                            <div className="font-medium text-slate-200">{regime.factors.adx}</div>
                          </div>
                        )}
                        {regime.factors.trendStrength && (
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">Trend</div>
                            <div className="font-medium text-slate-200 capitalize">{regime.factors.trendStrength}</div>
                          </div>
                        )}
                        {regime.factors.volatility && (
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">Volatility</div>
                            <div className="font-medium text-slate-200 capitalize">{regime.factors.volatility}</div>
                          </div>
                        )}
                        {regime.factors.volume && (
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">Volume</div>
                            <div className="font-medium text-slate-200 capitalize">{regime.factors.volume}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Live/Snapshot Badge */}
          <div className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-medium flex items-center gap-1.5 ${streaming ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
            {streaming && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />}
            {streaming ? 'Live' : 'Snapshot'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 text-sm">
        {items.map(item => (
          <div
            key={item.label}
            className="bg-gradient-to-br from-slate-900/60 to-slate-900/40 rounded-lg px-3 py-2.5 border border-slate-800/80 hover:border-slate-700 hover:scale-[1.02] transition-all duration-200"
            title={item.title || ''}
          >
            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium mb-1 flex items-center justify-between">
              <span>{item.label}</span>
              {item.icon && <span className="ml-1">{item.icon}</span>}
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className={`text-lg font-semibold ${item.accent || 'text-slate-100'}`}>
                {item.value}
              </div>
              {item.subValue && (
                <div className={`text-xs ${item.accent || 'text-slate-400'}`}>
                  {item.subValue}
                </div>
              )}
              {item.scoreBadge && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.scoreBadge}
                </span>
              )}
            </div>
            {item.progress !== undefined && (
              <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${item.progress > 80 ? 'bg-amber-400' : item.progress > 50 ? 'bg-cyan-400' : 'bg-slate-600'}`}
                  style={{ width: `${Math.min(100, item.progress)}%` }}
                />
              </div>
            )}
            {item.spark && <div className="mt-2">{item.spark}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}
