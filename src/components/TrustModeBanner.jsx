/**
 * TrustModeBanner - Global "AVA is Trading" Banner
 *
 * PhD++ Quality: A persistent, non-intrusive banner that appears
 * when Trust Mode is active (auto-execute enabled), showing:
 * - Current trust level and status
 * - Quick pause/resume control
 * - Recent autonomous actions count
 * - Quick access to audit log
 *
 * Designed to give traders constant awareness and confidence
 * that AVA is trading on their behalf with full transparency.
 */

import React, { useState, useEffect } from 'react'
import { useTrustMode } from './TrustModeManager.jsx'
import { getAuditLog, getAuditStats } from '../services/safetyManager.js'

// Storage key for paused state
const PAUSED_KEY = 'ava.trust.paused'

export default function TrustModeBanner({ onViewAuditLog, onNavigateToSafety }) {
  const trustMode = useTrustMode()
  const [isExpanded, setIsExpanded] = useState(false)
  const [recentActions, setRecentActions] = useState([])
  const [stats, setStats] = useState({ todayTrades: 0, todayPnL: 0 })
  const [isPaused, setIsPaused] = useState(false)

  // Load paused state and recent actions
  useEffect(() => {
    const updateData = () => {
      try {
        // Get paused state
        setIsPaused(localStorage.getItem(PAUSED_KEY) === 'true')

        // Get recent audit log entries (last 5 trades)
        const log = getAuditLog ? getAuditLog() : []
        const trades = log
          .filter(e => e.event === 'TRADE_EXECUTED')
          .slice(0, 5)
        setRecentActions(trades)

        // Get today's stats
        const auditStats = getAuditStats ? getAuditStats() : {}
        setStats({
          todayTrades: auditStats.todayTrades || 0,
          todayPnL: auditStats.todayPnL || 0
        })
      } catch (e) {
        console.error('[TrustModeBanner] Error loading data:', e)
      }
    }

    updateData()

    // Listen for trust mode changes
    const handleChange = () => updateData()
    window.addEventListener('ava.trustModeChanged', handleChange)
    window.addEventListener('ava.tradeExecuted', handleChange)
    window.addEventListener('storage', handleChange)

    // Poll for updates every 10 seconds
    const interval = setInterval(updateData, 10000)

    return () => {
      window.removeEventListener('ava.trustModeChanged', handleChange)
      window.removeEventListener('ava.tradeExecuted', handleChange)
      window.removeEventListener('storage', handleChange)
      clearInterval(interval)
    }
  }, [])

  // Toggle pause
  const togglePause = () => {
    const newPaused = !isPaused
    setIsPaused(newPaused)
    localStorage.setItem(PAUSED_KEY, newPaused.toString())
    window.dispatchEvent(new CustomEvent('ava.trustModeChanged'))

    // Toast notification
    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: {
        text: newPaused ? 'AVA Trading Paused' : 'AVA Trading Resumed',
        type: newPaused ? 'warning' : 'success'
      }
    }))
  }

  // Only show if auto-execute is enabled
  if (!trustMode.autoExecute) {
    return null
  }

  // Determine banner color based on status
  const getBannerStyle = () => {
    if (isPaused) {
      return {
        bg: 'from-rose-900/90 to-rose-800/90',
        border: 'border-rose-500/50',
        glow: 'shadow-rose-500/20',
        text: 'text-rose-200',
        accent: 'text-rose-400'
      }
    }
    if (trustMode.level === 'autopilot') {
      return {
        bg: 'from-red-900/90 to-orange-900/90',
        border: 'border-orange-500/50',
        glow: 'shadow-orange-500/20',
        text: 'text-orange-200',
        accent: 'text-orange-400'
      }
    }
    return {
      bg: 'from-amber-900/90 to-yellow-900/90',
      border: 'border-amber-500/50',
      glow: 'shadow-amber-500/20',
      text: 'text-amber-200',
      accent: 'text-amber-400'
    }
  }

  const style = getBannerStyle()

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50
      bg-gradient-to-r ${style.bg} backdrop-blur-xl
      border-b ${style.border}
      shadow-lg ${style.glow}
      transition-all duration-300
    `}>
      {/* Main Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Status */}
          <div className="flex items-center gap-3">
            {/* Animated indicator */}
            <div className="relative">
              <div className={`
                w-3 h-3 rounded-full
                ${isPaused ? 'bg-rose-500' : 'bg-emerald-500'}
              `} />
              {!isPaused && (
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
              )}
            </div>

            {/* Status text */}
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {isPaused ? '⏸️' : trustMode.level === 'autopilot' ? '🚀' : '⚡'}
              </span>
              <span className={`font-bold ${style.text}`}>
                {isPaused ? 'AVA PAUSED' : 'AVA IS TRADING'}
              </span>
              <span className={`text-xs ${style.accent} hidden sm:inline`}>
                {trustMode.level === 'autopilot' ? 'Full Autopilot' : 'Trust Mode'}
              </span>
            </div>

            {/* Today's stats */}
            {!isPaused && stats.todayTrades > 0 && (
              <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
                <span className="text-xs text-white/70">
                  Today: <span className="font-bold text-white">{stats.todayTrades}</span> trades
                </span>
                {stats.todayPnL !== 0 && (
                  <span className={`text-xs font-bold ${
                    stats.todayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {stats.todayPnL >= 0 ? '+' : ''}{stats.todayPnL.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Expand button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/80"
              title={isExpanded ? 'Collapse' : 'Show recent actions'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* View Audit Log */}
            <button
              onClick={() => {
                if (onNavigateToSafety) onNavigateToSafety()
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/90 text-xs font-medium"
              title="View full audit log"
            >
              <span>📋</span>
              <span>Audit Log</span>
            </button>

            {/* Pause/Resume Button */}
            <button
              onClick={togglePause}
              className={`
                flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all
                ${isPaused
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-rose-500/80 hover:bg-rose-600 text-white'
                }
              `}
            >
              <span>{isPaused ? '▶️' : '⏸️'}</span>
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Panel - Recent Actions */}
      {isExpanded && (
        <div className="border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              {/* Recent Actions */}
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Recent Autonomous Actions
                </h4>
                {recentActions.length > 0 ? (
                  <div className="space-y-1">
                    {recentActions.map((action, idx) => (
                      <div
                        key={action.id || idx}
                        className="flex items-center gap-3 text-xs bg-white/5 rounded-lg px-3 py-2"
                      >
                        <span className={action.data?.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}>
                          {action.data?.side === 'buy' ? '📈' : '📉'}
                        </span>
                        <span className="text-white font-medium">
                          {action.data?.side?.toUpperCase()} {action.data?.qty} {action.data?.symbol}
                        </span>
                        <span className="text-white/50">
                          @ ${action.data?.price?.toFixed(2) || 'Market'}
                        </span>
                        <span className="text-white/40 ml-auto">
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40 italic">
                    No autonomous trades yet. AVA is monitoring for opportunities...
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:block w-48 pl-4 border-l border-white/10">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Session Stats
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Trades</span>
                    <span className="text-white font-bold">{stats.todayTrades}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">P&L</span>
                    <span className={`font-bold ${stats.todayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stats.todayPnL >= 0 ? '+' : ''}{stats.todayPnL.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Status</span>
                    <span className={isPaused ? 'text-rose-400' : 'text-emerald-400'}>
                      {isPaused ? 'Paused' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact version for inline use in other components
 */
export function TrustModeBannerCompact({ className = '' }) {
  const trustMode = useTrustMode()
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const updatePaused = () => {
      setIsPaused(localStorage.getItem(PAUSED_KEY) === 'true')
    }
    updatePaused()
    window.addEventListener('ava.trustModeChanged', updatePaused)
    window.addEventListener('storage', updatePaused)
    return () => {
      window.removeEventListener('ava.trustModeChanged', updatePaused)
      window.removeEventListener('storage', updatePaused)
    }
  }, [])

  if (!trustMode.autoExecute) return null

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-lg
      ${isPaused
        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      }
      ${className}
    `}>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-rose-500' : 'bg-emerald-500'}`} />
        {!isPaused && <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />}
      </div>
      <span className="text-xs font-medium">
        {isPaused ? 'AVA Paused' : 'AVA Trading'}
      </span>
    </div>
  )
}
