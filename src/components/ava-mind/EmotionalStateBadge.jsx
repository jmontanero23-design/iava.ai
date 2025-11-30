/**
 * EmotionalStateBadge - Real-time Emotional State Display
 * 
 * NEW FILE - Add to src/components/ava-mind/
 * 
 * Shows current detected emotional state with:
 * - Visual badge with emoji and color
 * - Intensity indicator
 * - Helpful advice on hover/click
 * - Integration with avaMindPersonality detection
 */

import React, { useState, useEffect } from 'react'
import { detectEmotionalState, EMOTIONAL_STATES } from '../../services/avaMindPersonality.js'
import avaMindService from '../../services/avaMindService.js'

export default function EmotionalStateBadge({ 
  compact = false,
  showAdvice = true,
  className = '' 
}) {
  const [emotionalState, setEmotionalState] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [activityChecks, setActivityChecks] = useState(0)
  
  // Track activity (portfolio checks)
  useEffect(() => {
    const handleActivity = () => {
      setActivityChecks(prev => prev + 1)
    }
    
    // Listen for portfolio checks, chart loads, etc.
    window.addEventListener('iava.loadSymbol', handleActivity)
    window.addEventListener('iava.portfolioCheck', handleActivity)
    
    // Reset counter every 30 minutes
    const resetInterval = setInterval(() => {
      setActivityChecks(0)
    }, 30 * 60 * 1000)
    
    return () => {
      window.removeEventListener('iava.loadSymbol', handleActivity)
      window.removeEventListener('iava.portfolioCheck', handleActivity)
      clearInterval(resetInterval)
    }
  }, [])
  
  // Update emotional state periodically
  useEffect(() => {
    const updateState = () => {
      try {
        const recentTrades = avaMindService.getRecentTrades(5)
        const state = detectEmotionalState(
          recentTrades,
          { checksLast30Min: activityChecks },
          {} // Market conditions could be added here
        )
        setEmotionalState(state)
      } catch (e) {
        // Default to neutral if service not available
        setEmotionalState({
          state: EMOTIONAL_STATES.neutral,
          intensity: 0.3,
          score: 20
        })
      }
    }
    
    updateState()
    const interval = setInterval(updateState, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [activityChecks])
  
  if (!emotionalState?.state) return null
  
  const state = emotionalState.state
  const intensity = emotionalState.intensity || 0.5
  
  // Compact version - just emoji and color dot
  if (compact) {
    return (
      <div 
        className={`relative cursor-pointer ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all hover:scale-105"
          style={{ backgroundColor: `${state.color}20` }}
        >
          <span className="text-sm">{state.emoji}</span>
          {/* Intensity dot */}
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: state.color,
              opacity: 0.4 + (intensity * 0.6)
            }}
          />
        </div>
        
        {/* Tooltip */}
        {showTooltip && (
          <div 
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-64 p-3 rounded-xl shadow-xl"
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: `1px solid ${state.color}40`
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{state.emoji}</span>
              <div>
                <div className="font-semibold" style={{ color: state.color }}>
                  {state.name}
                </div>
                <div className="text-xs text-slate-400">
                  {Math.round(intensity * 100)}% intensity
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-2">{state.description}</p>
            {showAdvice && (
              <div className="text-xs text-slate-400 border-t border-slate-700 pt-2 mt-2">
                💡 {state.advice}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
  
  // Full version
  return (
    <div 
      className={`rounded-xl p-4 transition-all ${className}`}
      style={{ 
        backgroundColor: `${state.color}10`,
        border: `1px solid ${state.color}30`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{state.emoji}</span>
          <div>
            <div className="font-semibold text-lg" style={{ color: state.color }}>
              {state.name}
            </div>
            <div className="text-xs text-slate-400">{state.description}</div>
          </div>
        </div>
        
        {/* Intensity meter */}
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: state.color }}>
            {Math.round(intensity * 100)}%
          </div>
          <div className="text-xs text-slate-500">intensity</div>
        </div>
      </div>
      
      {/* Intensity bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${intensity * 100}%`,
            background: `linear-gradient(90deg, ${state.color}60, ${state.color})`
          }}
        />
      </div>
      
      {/* Advice */}
      {showAdvice && (
        <div className="flex items-start gap-2 text-sm">
          <span className="text-slate-500">💡</span>
          <span className="text-slate-300">{state.advice}</span>
        </div>
      )}
      
      {/* Trading impact */}
      <div 
        className="mt-3 pt-3 border-t text-xs flex items-center justify-between"
        style={{ borderColor: `${state.color}20` }}
      >
        <span className="text-slate-500">Trading Impact</span>
        <span 
          className="font-medium"
          style={{ 
            color: state.tradingImpact?.includes('+') ? '#10B981' : 
                   state.tradingImpact?.includes('-') ? '#EF4444' : '#64748B'
          }}
        >
          {state.tradingImpact}
        </span>
      </div>
      
      {/* Secondary state if present */}
      {emotionalState.secondary && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <span>Also feeling:</span>
          <span>{emotionalState.secondary.emoji}</span>
          <span>{emotionalState.secondary.name}</span>
        </div>
      )}
    </div>
  )
}

// Mini version for nav bar
export function EmotionalStateMini({ onClick }) {
  const [state, setState] = useState(EMOTIONAL_STATES.neutral)
  
  useEffect(() => {
    const updateState = () => {
      try {
        const recentTrades = avaMindService.getRecentTrades(5)
        const result = detectEmotionalState(recentTrades, {}, {})
        if (result?.state) setState(result.state)
      } catch (e) {
        // Keep neutral
      }
    }
    
    updateState()
    const interval = setInterval(updateState, 60000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg transition-all hover:scale-110"
      style={{ backgroundColor: `${state.color}20` }}
      title={`${state.name}: ${state.advice}`}
    >
      <span className="text-lg">{state.emoji}</span>
    </button>
  )
}
