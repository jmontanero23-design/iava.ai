/**
 * Unicorn Score Overlay Panel
 *
 * Displays iAVA's proprietary Unicorn Score (0-100) as a persistent overlay
 * on the TradingView chart. Shows real-time confluence quality and
 * indicator breakdown.
 *
 * This is different from UnicornCallout which only shows on signal fires.
 * This panel is always visible showing current score.
 */

import React, { useEffect, useRef, useState } from 'react'

export default function UnicornScorePanel({ state }) {
  const [isPulsing, setIsPulsing] = useState(false)
  const prevScoreRef = useRef(null)

  // Detect score changes and trigger pulse animation
  useEffect(() => {
    if (state?.score != null) {
      const currentScore = Math.round(state.score)

      // Trigger pulse only if score actually changed
      if (prevScoreRef.current !== null && prevScoreRef.current !== currentScore) {
        setIsPulsing(true)
        setTimeout(() => setIsPulsing(false), 600) // Match animation duration
      }

      prevScoreRef.current = currentScore
    }
  }, [state?.score])

  if (!state || state.score == null) {
    return (
      <div className="glass-panel p-4 min-w-[200px]">
        <div className="text-center text-slate-400 text-sm">
          Loading...
        </div>
      </div>
    )
  }

  const score = Math.round(state.score)
  const rawScore = state.rawScore || 0
  const regime = state.regime || 'neutral'
  const quality = getScoreQuality(score)
  const qualityColor = getScoreColor(score)

  // PhD++ FIX: Determine regime color based on rawScore direction
  const regimeColor = rawScore >= 70 ? 'text-green-400' :
                      rawScore <= -70 ? 'text-red-400' :
                      rawScore >= 35 ? 'text-lime-400' :
                      rawScore <= -35 ? 'text-orange-400' : 'text-slate-400'
  const regimeText = rawScore >= 70 ? 'BULLISH' :
                     rawScore <= -70 ? 'BEARISH' :
                     rawScore >= 35 ? 'MILDLY BULLISH' :
                     rawScore <= -35 ? 'MILDLY BEARISH' : 'NEUTRAL'

  // Extract indicator states
  const emaCloud = state.emaCloudNow || 'neutral'
  const pivotRibbon = state.pivotNow || 'neutral'
  const ichimoku = state.ichiRegime || 'neutral'
  const satyDir = state.satyDir || 'neutral'
  const squeeze = state.sq?.fired ? `${state.sq.dir}` : 'waiting'

  return (
    <div className="glass-panel p-4 min-w-[240px] space-y-4">
      {/* Score Display with pulse on update */}
      <div className="text-center">
        <div className={`relative inline-block ${isPulsing ? 'pulse-ring' : ''}`}>
          {/* Glow effect for high scores */}
          {score >= 70 && (
            <div className={`absolute inset-0 ${rawScore >= 0 ? 'bg-emerald-500' : 'bg-red-500'} blur-2xl opacity-30 animate-pulse`} />
          )}
          <div className={`relative text-6xl font-black text-white transition-all duration-300 ${isPulsing ? 'scale-110' : 'scale-100'}`}>
            {score}
            <span className="text-2xl text-slate-400 font-normal">/100</span>
          </div>
        </div>
        <div className={`mt-2 text-sm font-bold uppercase tracking-wider ${regimeColor}`}>
          {regimeText}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Signal Strength
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* Indicator Breakdown */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Indicators
        </div>

        <IndicatorRow
          label="EMA Cloud"
          value={emaCloud}
          icon="☁️"
        />

        <IndicatorRow
          label="Pivot Ribbon"
          value={pivotRibbon}
          icon="📊"
        />

        <IndicatorRow
          label="Ichimoku"
          value={ichimoku}
          icon="🌊"
        />

        <IndicatorRow
          label="SATY"
          value={satyDir}
          icon="🎯"
        />

        <IndicatorRow
          label="Squeeze"
          value={squeeze}
          icon={state.sq?.fired ? "🔥" : "⏳"}
        />
      </div>

      {/* Score Components (if available) - PhD++ FIX: Show ALL components */}
      {state.components && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <div className="text-xs font-mono flex flex-wrap gap-1">
            {(() => {
              try {
                const entries = Object.entries(state.components).filter(([,v]) => v !== 0)
                if (entries.length === 0) return <span className="text-slate-400">All neutral</span>
                return entries.map(([k,v], idx) => {
                  const sign = v > 0 ? '+' : ''
                  const color = v > 0 ? 'text-green-400' : 'text-red-400'
                  return (
                    <span key={k} className={color}>
                      {k}:{sign}{v}{idx < entries.length - 1 ? '' : ''}
                    </span>
                  )
                })
              } catch {
                return <span className="text-slate-400">Calculating...</span>
              }
            })()}
            {state._consensus?.align && <span className="text-green-400">consensus:+10</span>}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Individual indicator row with colored status and pulse on change
 */
function IndicatorRow({ label, value, icon }) {
  const [isPulsing, setIsPulsing] = useState(false)
  const prevValueRef = useRef(null)

  // Detect value changes and trigger pulse
  useEffect(() => {
    if (value && prevValueRef.current !== null && prevValueRef.current !== value) {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), 400)
    }
    prevValueRef.current = value
  }, [value])

  const color = getIndicatorColor(value)
  const displayValue = value.charAt(0).toUpperCase() + value.slice(1)

  return (
    <div className={`flex items-center justify-between text-xs transition-all ${isPulsing ? 'pulse-data' : ''}`}>
      <span className="text-slate-400 flex items-center gap-1.5">
        <span className={isPulsing ? 'icon-bounce-hover' : ''}>{icon}</span>
        <span>{label}</span>
      </span>
      <span className={`font-semibold ${color} transition-all`}>
        {displayValue}
      </span>
    </div>
  )
}

/**
 * Get quality label from score
 */
function getScoreQuality(score) {
  if (score >= 80) return 'EXCELLENT'
  if (score >= 70) return 'HIGH QUALITY'
  if (score >= 60) return 'GOOD'
  if (score >= 40) return 'MODERATE'
  return 'LOW'
}

/**
 * Get color class for score
 */
function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 70) return 'text-green-400'
  if (score >= 60) return 'text-lime-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-slate-400'
}

/**
 * Get color for individual indicators
 */
function getIndicatorColor(value) {
  const v = value.toLowerCase()
  if (v === 'bullish' || v === 'long' || v === 'up') return 'text-green-400'
  if (v === 'bearish' || v === 'short' || v === 'down') return 'text-red-400'
  if (v.includes('fire') || v.includes('squeeze')) return 'text-orange-400'
  return 'text-slate-400'
}
