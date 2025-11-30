/**
 * Emotional State Badge
 *
 * Displays the user's current emotional state based on recent trading activity.
 * Part of the AVA Mind personalization system.
 *
 * States:
 * - Confident: Trading well, in sync with market
 * - Cautious: Being careful, slightly hesitant
 * - Frustrated: On a losing streak, risk of revenge trading
 * - Fearful: Avoiding trades, missing opportunities
 * - Greedy: Oversizing after wins, FOMO risk
 * - Exhausted: Too many trades, needs a break
 * - Neutral: Baseline state
 */

import React, { useState, useEffect } from 'react'
import { personalizedScoreService } from '../services/ai/PersonalizedScoreService.js'

const EMOTIONAL_STATES = {
  Confident: {
    icon: '🔥',
    color: 'emerald',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    glowClass: 'hover:shadow-emerald-500/20',
    tip: 'You\'re in the zone. Trust your analysis.'
  },
  Cautious: {
    icon: '⚠️',
    color: 'amber',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    glowClass: 'hover:shadow-amber-500/20',
    tip: 'Being careful is good. Just don\'t miss clear opportunities.'
  },
  Frustrated: {
    icon: '😤',
    color: 'red',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    glowClass: 'hover:shadow-red-500/20',
    tip: 'Take a break. Revenge trading rarely works out.'
  },
  Fearful: {
    icon: '😰',
    color: 'slate',
    bgClass: 'bg-slate-500/20',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30',
    glowClass: 'hover:shadow-slate-500/20',
    tip: 'Review your thesis. If it\'s solid, trust it.'
  },
  Greedy: {
    icon: '🤑',
    color: 'yellow',
    bgClass: 'bg-yellow-500/20',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
    glowClass: 'hover:shadow-yellow-500/20',
    tip: 'Hot streak! Stick to your sizing rules.'
  },
  Exhausted: {
    icon: '😴',
    color: 'purple',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    glowClass: 'hover:shadow-purple-500/20',
    tip: 'Many trades today. Consider taking a break.'
  },
  Neutral: {
    icon: '😐',
    color: 'slate',
    bgClass: 'bg-slate-600/20',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-600/30',
    glowClass: 'hover:shadow-slate-500/20',
    tip: 'Balanced state. Trade your plan.'
  }
}

export default function EmotionalStateBadge({ className = '', showLabel = true }) {
  const [emotionalState, setEmotionalState] = useState('Neutral')
  const [intensity, setIntensity] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)
  const [recentPerformance, setRecentPerformance] = useState(null)

  useEffect(() => {
    // Initial load
    updateState()

    // Update every 30 seconds
    const interval = setInterval(updateState, 30000)

    // Listen for trade events to trigger immediate update
    const handleTradeEvent = () => {
      setTimeout(updateState, 1000) // Slight delay to allow state to settle
    }
    window.addEventListener('ava.tradeExecuted', handleTradeEvent)
    window.addEventListener('ava.orderFilled', handleTradeEvent)

    return () => {
      clearInterval(interval)
      window.removeEventListener('ava.tradeExecuted', handleTradeEvent)
      window.removeEventListener('ava.orderFilled', handleTradeEvent)
    }
  }, [])

  function updateState() {
    try {
      // Get a dummy signal to extract emotional state
      const signal = personalizedScoreService.getPersonalizedSignal(
        { ultraUnicornScore: 50, direction: 'LONG', classification: 'Weak' },
        'SPY',
        0
      )

      setEmotionalState(signal.context.emotionalState || 'Neutral')
      setIntensity(signal.context.emotionalIntensity || 0)
      setRecentPerformance(signal.context.recentPerformance)
    } catch (e) {
      console.warn('[EmotionalStateBadge] Failed to get state:', e)
      setEmotionalState('Neutral')
    }
  }

  const stateConfig = EMOTIONAL_STATES[emotionalState] || EMOTIONAL_STATES.Neutral

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
          ${stateConfig.bgClass} ${stateConfig.borderClass}
          border transition-all hover:shadow-lg ${stateConfig.glowClass}
        `}
        title={`Emotional State: ${emotionalState}`}
      >
        <span className="text-base">{stateConfig.icon}</span>
        {showLabel && (
          <span className={`text-xs font-medium ${stateConfig.textClass}`}>
            {emotionalState}
          </span>
        )}
        {intensity > 70 && emotionalState !== 'Neutral' && emotionalState !== 'Confident' && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 z-50 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{stateConfig.icon}</span>
            <div>
              <div className={`font-semibold ${stateConfig.textClass}`}>
                {emotionalState}
              </div>
              {intensity > 0 && (
                <div className="text-xs text-slate-500">
                  Intensity: {intensity}%
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            {stateConfig.tip}
          </p>

          {recentPerformance && (
            <div className="pt-2 border-t border-slate-700/50 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Last 10:</span>{' '}
                  <span className="text-emerald-400">{recentPerformance.last10.wins}W</span>
                  <span className="text-slate-500">-</span>
                  <span className="text-red-400">{recentPerformance.last10.losses}L</span>
                </div>
                <div>
                  <span className="text-slate-500">Win Rate:</span>{' '}
                  <span className="text-white font-medium">
                    {recentPerformance.last10.winRate}
                  </span>
                </div>
              </div>
              {recentPerformance.streak.count > 0 && (
                <div className="mt-1">
                  <span className="text-slate-500">Streak:</span>{' '}
                  <span className={recentPerformance.streak.type === 'win' ? 'text-emerald-400' : 'text-red-400'}>
                    {recentPerformance.streak.count} {recentPerformance.streak.type}
                    {recentPerformance.streak.count > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {recentPerformance.todayTrades > 0 && (
                <div className="mt-1">
                  <span className="text-slate-500">Today:</span>{' '}
                  <span className={recentPerformance.todayTrades > 10 ? 'text-amber-400' : 'text-slate-300'}>
                    {recentPerformance.todayTrades} trades
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact version for tight spaces
 */
export function EmotionalStateBadgeCompact({ className = '' }) {
  return <EmotionalStateBadge className={className} showLabel={false} />
}
