/**
 * Forecast Fit Badge - AVA Mind Integration
 *
 * Shows how well a Chronos forecast aligns with the user's
 * trading personality and archetype.
 */

import React, { useState, useEffect } from 'react'
import {
  assessForecastFit,
  determineArchetype,
  TRADING_ARCHETYPES
} from '../services/avaMindPersonality.js'

/**
 * Get personality profile from localStorage
 */
function getPersonality() {
  try {
    const saved = localStorage.getItem('ava.mind.personality')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

/**
 * Compact badge showing fit score
 */
export function ForecastFitBadgeCompact({ forecast, className = '' }) {
  const [fitData, setFitData] = useState(null)

  useEffect(() => {
    const personality = getPersonality()
    if (personality && forecast) {
      const archetype = determineArchetype(personality)
      const fit = assessForecastFit(forecast, personality, archetype)
      setFitData({ ...fit, archetype })
    }
  }, [forecast])

  if (!fitData) return null

  const getFitColor = () => {
    switch (fitData.fit) {
      case 'excellent': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'good': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      case 'caution': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getFitIcon = () => {
    switch (fitData.fit) {
      case 'excellent': return '🎯'
      case 'good': return '👍'
      case 'caution': return '⚠️'
      default: return '➖'
    }
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getFitColor()} ${className}`}>
      <span className="text-sm">{getFitIcon()}</span>
      <span className="text-xs font-medium">
        {fitData.archetype?.primary?.archetype?.emoji || '🧠'} Style Fit: {fitData.score}%
      </span>
    </div>
  )
}

/**
 * Full panel showing detailed fit assessment
 */
export default function ForecastFitBadge({ forecast, showDetails = false, className = '' }) {
  const [fitData, setFitData] = useState(null)
  const [expanded, setExpanded] = useState(showDetails)

  useEffect(() => {
    const personality = getPersonality()
    if (personality && forecast) {
      const archetype = determineArchetype(personality)
      const fit = assessForecastFit(forecast, personality, archetype)
      setFitData({ ...fit, archetype, personality })
    }
  }, [forecast])

  if (!fitData) {
    return (
      <div className={`bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 ${className}`}>
        <div className="flex items-center gap-3 text-slate-500">
          <span className="text-xl">🧠</span>
          <div>
            <div className="font-medium text-slate-400">AVA Mind Not Setup</div>
            <div className="text-xs">Complete onboarding to see personalized insights</div>
          </div>
        </div>
      </div>
    )
  }

  const archetype = fitData.archetype?.primary?.archetype

  const getFitGradient = () => {
    switch (fitData.fit) {
      case 'excellent': return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
      case 'good': return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
      case 'caution': return 'from-amber-500/20 to-orange-500/20 border-amber-500/30'
      default: return 'from-slate-500/20 to-slate-600/20 border-slate-500/30'
    }
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'positive': return 'text-emerald-400'
      case 'negative': return 'text-red-400'
      case 'caution': return 'text-amber-400'
      case 'insight': return 'text-cyan-400'
      default: return 'text-slate-400'
    }
  }

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'positive': return '✓'
      case 'negative': return '✗'
      case 'caution': return '!'
      case 'insight': return '💡'
      default: return '•'
    }
  }

  return (
    <div className={`bg-gradient-to-br ${getFitGradient()} rounded-xl border backdrop-blur-sm ${className}`}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Archetype icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
              style={{
                backgroundColor: archetype ? `${archetype.color}20` : '#1e293b',
                boxShadow: archetype ? `0 0 15px ${archetype.color}30` : 'none'
              }}
            >
              {archetype?.emoji || '🧠'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  {archetype?.name || 'AVA Mind'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  fitData.fit === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' :
                  fitData.fit === 'good' ? 'bg-cyan-500/20 text-cyan-400' :
                  fitData.fit === 'caution' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {fitData.score}% Fit
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {fitData.message}
              </div>
            </div>
          </div>

          {/* Expand indicator */}
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10">
          {/* Archetype advice */}
          {fitData.advice && (
            <div className="mt-4 p-3 bg-black/20 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-lg">{archetype?.emoji}</span>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">
                    {archetype?.name} Insight
                  </div>
                  <div className="text-sm text-slate-300">
                    {fitData.advice}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fit factors */}
          {fitData.factors.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs text-slate-500 uppercase font-semibold">
                Analysis Factors
              </div>
              {fitData.factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`${getImpactColor(factor.impact)} font-bold`}>
                    {getImpactIcon(factor.impact)}
                  </span>
                  <div>
                    <span className="text-slate-300 font-medium">{factor.factor}:</span>
                    <span className="text-slate-400 ml-1">{factor.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Personality snapshot */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="text-xs text-slate-500 mb-2">Your Trading DNA</div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'riskTolerance', label: 'Risk', icon: '🎲' },
                { key: 'timeHorizon', label: 'Horizon', icon: '⏱️' },
                { key: 'emotionalControl', label: 'Control', icon: '🧘' },
                { key: 'confidenceLevel', label: 'Conviction', icon: '💪' }
              ].map(({ key, label, icon }) => (
                <div
                  key={key}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded text-xs"
                >
                  <span>{icon}</span>
                  <span className="text-slate-500">{label}:</span>
                  <span className="text-white font-medium">
                    {fitData.personality[key] || 50}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
