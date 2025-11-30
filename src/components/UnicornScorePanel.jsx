/**
 * Unicorn Score Overlay Panel
 *
 * Displays iAVA's proprietary Unicorn Score (0-100) as a persistent overlay
 * on the TradingView chart. Shows real-time confluence quality and
 * indicator breakdown.
 *
 * NOW INTEGRATED with PersonalizedScoreService for:
 * - Archetype badge showing trading personality
 * - Personalized position sizing recommendations
 * - Emotional state warnings
 * - Entry strategy suggestions
 *
 * This is different from UnicornCallout which only shows on signal fires.
 * This panel is always visible showing current score.
 */

import React, { useEffect, useRef, useState } from 'react'
import { personalizedScoreService, ARCHETYPE_MESSAGES } from '../services/ai/PersonalizedScoreService.js'

export default function UnicornScorePanel({ state, symbol = 'SPY' }) {
  const [personalizedSignal, setPersonalizedSignal] = useState(null)
  const [showPersonalized, setShowPersonalized] = useState(true)
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

  // Get personalized signal when state changes
  useEffect(() => {
    if (state?.score != null) {
      try {
        const signal = personalizedScoreService.getPersonalizedSignal(
          {
            ultraUnicornScore: Math.round(state.score),
            direction: state.rawScore >= 0 ? 'LONG' : 'SHORT',
            classification: getClassification(state.score),
            components: state.components || {},
            bonuses: {},
            aiComponents: {}
          },
          symbol,
          0
        )
        setPersonalizedSignal(signal)
      } catch (e) {
        console.warn('[UnicornScorePanel] PersonalizedScoreService error:', e)
      }
    }
  }, [state?.score, symbol])

  // Helper to get classification from score
  function getClassification(score) {
    if (score >= 95) return 'Ultra Elite'
    if (score >= 90) return 'Elite'
    if (score >= 80) return 'Strong'
    if (score >= 65) return 'Moderate'
    if (score >= 50) return 'Weak'
    return 'Avoid'
  }

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
      {/* Header with Archetype Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦄</span>
          <span className="text-sm font-semibold text-slate-300">Unicorn Score</span>
        </div>
        {/* Archetype Badge */}
        {personalizedSignal && (
          <button
            onClick={() => setShowPersonalized(!showPersonalized)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
            title={`Trading Archetype: ${personalizedSignal.context.archetype} (click to toggle insights)`}
          >
            <span>{personalizedSignal.context.archetypeIcon}</span>
            <span className="text-xs text-purple-300 font-medium hidden sm:inline">
              {personalizedSignal.context.archetype}
            </span>
          </button>
        )}
      </div>

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

      {/* Personalized Insights Section */}
      {personalizedSignal && showPersonalized && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="space-y-3">
            {/* Archetype Message */}
            <div className="p-3 bg-slate-800/50 rounded-lg border border-purple-500/20">
              <div className="flex items-start gap-2">
                <span className="text-lg">{personalizedSignal.context.archetypeIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {personalizedSignal.avaMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* Position & Risk Recommendations */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-slate-800/30 rounded">
                <div className="text-slate-500 mb-0.5">Position</div>
                <div className="text-emerald-400 font-bold">
                  {personalizedSignal.personalized.positionPercent}
                </div>
              </div>
              <div className="text-center p-2 bg-slate-800/30 rounded">
                <div className="text-slate-500 mb-0.5">Stop</div>
                <div className="text-red-400 font-bold">
                  {personalizedSignal.personalized.stopLossPercent}
                </div>
              </div>
              <div className="text-center p-2 bg-slate-800/30 rounded">
                <div className="text-slate-500 mb-0.5">Target</div>
                <div className="text-cyan-400 font-bold">
                  {personalizedSignal.personalized.takeProfitPercent}
                </div>
              </div>
            </div>

            {/* Entry Strategy */}
            <div className="text-xs p-2 bg-indigo-500/10 rounded border border-indigo-500/20">
              <span className="text-indigo-400 font-medium">
                {personalizedSignal.personalized.entryStrategy?.name}:
              </span>
              <span className="text-slate-400 ml-1">
                {personalizedSignal.personalized.entryStrategy?.waitFor || 'Execute when ready'}
              </span>
            </div>

            {/* Warnings */}
            {personalizedSignal.personalized.warnings.length > 0 && (
              <div className="space-y-1">
                {personalizedSignal.personalized.warnings.slice(0, 2).map((warning, i) => (
                  <div
                    key={i}
                    className={`text-xs p-2 rounded flex items-start gap-2 ${
                      warning.severity === 'high'
                        ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}
                  >
                    <span>{warning.severity === 'high' ? '⚠️' : '⚡'}</span>
                    <span className="line-clamp-2">{warning.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Encouragements */}
            {personalizedSignal.personalized.encouragements.length > 0 && (
              <div className="text-xs p-2 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20 flex items-start gap-2">
                <span>✅</span>
                <span>{personalizedSignal.personalized.encouragements[0]?.message}</span>
              </div>
            )}

            {/* Emotional State */}
            {personalizedSignal.context.emotionalState !== 'Neutral' && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Current State:</span>
                <span className={`font-medium ${
                  personalizedSignal.context.emotionalState === 'Confident' ? 'text-emerald-400' :
                  personalizedSignal.context.emotionalState === 'Frustrated' ? 'text-red-400' :
                  personalizedSignal.context.emotionalState === 'Greedy' ? 'text-yellow-400' :
                  'text-amber-400'
                }`}>
                  {personalizedSignal.context.emotionalState}
                </span>
              </div>
            )}

            {/* Action Recommendation */}
            <div className={`text-center text-xs font-bold py-2 rounded-lg ${
              personalizedSignal.action.type === 'EXECUTE' ? 'bg-emerald-500/20 text-emerald-300' :
              personalizedSignal.action.type === 'CAUTION' ? 'bg-amber-500/20 text-amber-300' :
              personalizedSignal.action.type === 'AVOID' ? 'bg-red-500/20 text-red-300' :
              'bg-slate-500/20 text-slate-300'
            }`}>
              {personalizedSignal.action.type}: {personalizedSignal.action.reason}
            </div>
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
