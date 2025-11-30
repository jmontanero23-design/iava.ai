/**
 * TrustModeOrderConfirm - Elite Order Confirmation with Personality Insights
 * 
 * NEW FILE - Add to src/components/
 * 
 * Features:
 * - Beautiful order preview with risk visualization
 * - Trust mode level indicator
 * - Personality alignment check
 * - Emotional state warning
 * - One-click confirm or AVA auto-execute
 * - Undo window after execution
 * 
 * INTEGRATES WITH: TrustModeManager.jsx, avaMindPersonality.js
 */

import React, { useState, useEffect } from 'react'
import { checkPersonalityAlignment, getPersonalitySummary } from '../utils/aiPersonalityBridge.js'
import { EMOTIONAL_STATES, determineArchetype } from '../services/avaMindPersonality.js'

// Trust level configurations
const TRUST_LEVELS = {
  off: { name: 'Safe Mode', emoji: '🛡️', color: '#64748B', autoExecute: false },
  confirm: { name: 'Confirm Mode', emoji: '✅', color: '#10B981', autoExecute: false },
  trust: { name: 'Trust Mode', emoji: '⚡', color: '#F59E0B', autoExecute: true },
  autopilot: { name: 'Autopilot', emoji: '🚀', color: '#EF4444', autoExecute: true }
}

export default function TrustModeOrderConfirm({
  order,
  onConfirm,
  onCancel,
  onModify,
  trustLevel = 'confirm',
  autoExecuteCountdown = 5
}) {
  const [countdown, setCountdown] = useState(autoExecuteCountdown)
  const [isPaused, setIsPaused] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [personalitySummary, setPersonalitySummary] = useState(null)
  const [alignmentCheck, setAlignmentCheck] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  
  const trustConfig = TRUST_LEVELS[trustLevel] || TRUST_LEVELS.confirm
  const shouldAutoExecute = trustConfig.autoExecute && !isPaused
  
  // Load personality data
  useEffect(() => {
    const summary = getPersonalitySummary()
    setPersonalitySummary(summary)
    
    // Check alignment
    if (order) {
      const check = checkPersonalityAlignment(order.side, {
        positionPercent: order.positionPercent || 0,
        againstTrend: order.againstTrend || false
      })
      setAlignmentCheck(check)
    }
  }, [order])
  
  // Auto-execute countdown
  useEffect(() => {
    if (!shouldAutoExecute || countdown <= 0) return
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleConfirm()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [shouldAutoExecute, countdown])
  
  // Pause on any interaction
  const handlePause = () => {
    setIsPaused(true)
  }
  
  const handleConfirm = async () => {
    setIsExecuting(true)
    try {
      await onConfirm?.(order)
    } finally {
      setIsExecuting(false)
    }
  }
  
  if (!order) return null
  
  const isBuy = order.side?.toLowerCase() === 'buy'
  const sideColor = isBuy ? '#10B981' : '#EF4444'
  const hasWarnings = alignmentCheck?.warnings?.length > 0
  const emotionalState = personalitySummary?.emotionalState
  const isConcerningEmotion = emotionalState && ['fearful', 'frustrated', 'greedy'].includes(emotionalState.id)
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handlePause}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md bg-slate-900 rounded-2xl border overflow-hidden"
        style={{ borderColor: `${trustConfig.color}40` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Trust Mode Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: `${trustConfig.color}15` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{trustConfig.emoji}</span>
            <span className="font-semibold" style={{ color: trustConfig.color }}>
              {trustConfig.name}
            </span>
          </div>
          
          {shouldAutoExecute && countdown > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Auto-execute in</span>
              <span 
                className="text-lg font-bold"
                style={{ color: trustConfig.color }}
              >
                {countdown}s
              </span>
            </div>
          )}
          
          {isPaused && shouldAutoExecute && (
            <span className="text-xs text-slate-500">⏸ Paused</span>
          )}
        </div>
        
        {/* Order Details */}
        <div className="p-6">
          {/* Main Order Info */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-3xl font-bold text-white mb-1">
                {order.symbol}
              </div>
              <div 
                className="text-lg font-semibold"
                style={{ color: sideColor }}
              >
                {order.side?.toUpperCase()} {order.quantity} shares
              </div>
            </div>
            
            {/* Side indicator */}
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ 
                backgroundColor: `${sideColor}20`,
                border: `2px solid ${sideColor}40`
              }}
            >
              {isBuy ? '📈' : '📉'}
            </div>
          </div>
          
          {/* Price & Value */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">
                {order.type === 'market' ? 'Market Price' : 'Limit Price'}
              </div>
              <div className="text-xl font-bold text-white">
                ${order.price?.toFixed(2) || 'MKT'}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">Est. Value</div>
              <div className="text-xl font-bold text-white">
                ${((order.price || 0) * (order.quantity || 0)).toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Personality Section */}
          {personalitySummary?.archetype && (
            <div 
              className="mb-4 p-3 rounded-xl flex items-center gap-3"
              style={{ 
                backgroundColor: `${personalitySummary.archetype.color}10`,
                border: `1px solid ${personalitySummary.archetype.color}30`
              }}
            >
              <span className="text-2xl">{personalitySummary.archetype.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: personalitySummary.archetype.color }}>
                  {personalitySummary.archetype.name}
                </div>
                <div className="text-xs text-slate-400">
                  {alignmentCheck?.aligned 
                    ? '✅ Trade aligns with your style'
                    : '⚠️ Review personality alignment below'
                  }
                </div>
              </div>
              
              {/* Emotional state badge */}
              {emotionalState && (
                <div 
                  className="px-2 py-1 rounded-full text-xs flex items-center gap-1"
                  style={{ 
                    backgroundColor: `${emotionalState.color}20`,
                    color: emotionalState.color
                  }}
                >
                  <span>{emotionalState.emoji}</span>
                  <span>{emotionalState.name}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Warnings */}
          {hasWarnings && (
            <div className="mb-4 space-y-2">
              {alignmentCheck.warnings.map((warning, i) => (
                <div 
                  key={i}
                  className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2"
                >
                  <span className="text-amber-400">⚠️</span>
                  <span className="text-sm text-amber-200">{warning.message}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Emotional state warning */}
          {isConcerningEmotion && personalitySummary.emotionalIntensity > 0.5 && (
            <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-start gap-2">
                <span className="text-xl">{emotionalState.emoji}</span>
                <div>
                  <div className="text-sm font-medium text-orange-300">
                    Emotional State Check
                  </div>
                  <div className="text-xs text-orange-200/70 mt-1">
                    {emotionalState.advice}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Confirmations (positive) */}
          {alignmentCheck?.confirmations?.length > 0 && (
            <div className="mb-4 space-y-2">
              {alignmentCheck.confirmations.map((conf, i) => (
                <div 
                  key={i}
                  className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2"
                >
                  <span className="text-emerald-400">✅</span>
                  <span className="text-sm text-emerald-200">{conf.message}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* AVA's Take */}
          {order.avaComment && (
            <div className="mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="text-xs text-violet-400 mb-1">AVA's Take</div>
              <div className="text-sm text-slate-300">{order.avaComment}</div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={isExecuting}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all relative overflow-hidden"
              style={{ 
                backgroundColor: sideColor,
                boxShadow: `0 4px 20px ${sideColor}40`
              }}
            >
              {isExecuting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Executing...
                </span>
              ) : (
                <span>
                  {isBuy ? '🚀 Confirm Buy' : '📉 Confirm Sell'}
                </span>
              )}
              
              {/* Auto-execute progress bar */}
              {shouldAutoExecute && countdown > 0 && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all"
                  style={{ 
                    width: `${(countdown / autoExecuteCountdown) * 100}%`
                  }}
                />
              )}
            </button>
          </div>
          
          {/* Modify link */}
          {onModify && (
            <button
              onClick={onModify}
              className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Modify Order →
            </button>
          )}
        </div>
        
        {/* Footer - Risk Reminder */}
        <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Risk: {order.riskLevel || 'Standard'}</span>
            <span>Est. commission: ${order.commission?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Post-execution undo banner
 */
export function UndoBanner({ order, onUndo, expiresIn = 30 }) {
  const [timeLeft, setTimeLeft] = useState(expiresIn)
  const [isUndoing, setIsUndoing] = useState(false)
  
  useEffect(() => {
    if (timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timeLeft])
  
  const handleUndo = async () => {
    setIsUndoing(true)
    try {
      await onUndo?.(order)
    } finally {
      setIsUndoing(false)
    }
  }
  
  if (timeLeft <= 0) return null
  
  const isBuy = order?.side?.toLowerCase() === 'buy'
  const sideColor = isBuy ? '#10B981' : '#EF4444'
  
  return (
    <div 
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px]"
      style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: `1px solid ${sideColor}40`
      }}
    >
      <div className="flex-1">
        <div className="text-sm text-slate-300">
          <span style={{ color: sideColor }}>{order?.side?.toUpperCase()}</span>
          {' '}{order?.quantity} {order?.symbol} executed
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          Undo available for {timeLeft}s
        </div>
      </div>
      
      <button
        onClick={handleUndo}
        disabled={isUndoing}
        className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-all"
      >
        {isUndoing ? '...' : '↩ Undo'}
      </button>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 rounded-b-xl overflow-hidden">
        <div 
          className="h-full transition-all duration-1000"
          style={{ 
            width: `${(timeLeft / expiresIn) * 100}%`,
            backgroundColor: sideColor
          }}
        />
      </div>
    </div>
  )
}

export { TRUST_LEVELS }
