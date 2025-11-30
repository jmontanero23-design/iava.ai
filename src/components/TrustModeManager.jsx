/**
 * TrustModeManager - Elite Trust Mode Control System
 *
 * A comprehensive trust mode management component that provides:
 * - Clear visual toggle with state indicators
 * - Execution history with audit log
 * - Undo/cancel window for recent trades
 * - Safety confirmations for high-risk actions
 * - Real-time status monitoring
 *
 * Trust Mode allows AVA to execute trades automatically based on
 * AI recommendations, with full transparency and control.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  logAuditEvent,
  isTradingAllowed,
  isEmergencyStopActive,
  assessTradeRisk,
  AUDIT_EVENTS
} from '../services/safetyManager.js'
import { EmergencyStopButton, CircuitBreakerStatus } from './SafetyDashboard.jsx'

// Trust Mode levels with detailed descriptions
const TRUST_LEVELS = {
  OFF: {
    id: 'off',
    name: 'Safe Mode',
    icon: '🛡️',
    color: '#64748B',
    description: 'All trades require manual confirmation',
    autoExecute: false
  },
  CONFIRM: {
    id: 'confirm',
    name: 'Confirm Mode',
    icon: '✅',
    color: '#10B981',
    description: 'AI suggests, you confirm with one click',
    autoExecute: false
  },
  TRUST: {
    id: 'trust',
    name: 'Trust Mode',
    icon: '⚡',
    color: '#F59E0B',
    description: 'AI executes automatically (with limits)',
    autoExecute: true
  },
  AUTOPILOT: {
    id: 'autopilot',
    name: 'Autopilot',
    icon: '🚀',
    color: '#EF4444',
    description: 'Full autonomous trading (experts only)',
    autoExecute: true
  }
}

// Storage keys
const STORAGE_KEYS = {
  LEVEL: 'ava.trust.level',
  HISTORY: 'ava.trust.history',
  LIMITS: 'ava.trust.limits',
  PAUSED: 'ava.trust.paused'
}

// Default trading limits
const DEFAULT_LIMITS = {
  maxPositionSize: 1000, // Max $ per trade
  maxDailyTrades: 10,
  maxDailyLoss: 500,
  allowedSymbols: [], // Empty = all allowed
  allowedHours: { start: 9, end: 16 }, // Market hours only
  requireHighConfidence: true // Only execute on 70%+ confidence
}

export default function TrustModeManager({
  compact = false,
  showHistory = true,
  onExecute,
  className = ''
}) {
  const [trustLevel, setTrustLevel] = useState('off')
  const [isPaused, setIsPaused] = useState(false)
  const [limits, setLimits] = useState(DEFAULT_LIMITS)
  const [executionHistory, setExecutionHistory] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(null)
  const [pendingUndo, setPendingUndo] = useState(null)
  const [dailyStats, setDailyStats] = useState({ trades: 0, pnl: 0 })

  // Load from localStorage
  useEffect(() => {
    try {
      const savedLevel = localStorage.getItem(STORAGE_KEYS.LEVEL)
      if (savedLevel && TRUST_LEVELS[savedLevel.toUpperCase()]) {
        setTrustLevel(savedLevel)
      }

      const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        // Only keep last 24 hours
        const recent = parsed.filter(h => Date.now() - h.timestamp < 24 * 60 * 60 * 1000)
        setExecutionHistory(recent)
      }

      const savedLimits = localStorage.getItem(STORAGE_KEYS.LIMITS)
      if (savedLimits) {
        setLimits({ ...DEFAULT_LIMITS, ...JSON.parse(savedLimits) })
      }

      const savedPaused = localStorage.getItem(STORAGE_KEYS.PAUSED)
      setIsPaused(savedPaused === 'true')
    } catch (e) {
      console.error('[TrustMode] Error loading state:', e)
    }
  }, [])

  // Calculate daily stats
  useEffect(() => {
    const today = new Date().toDateString()
    const todayTrades = executionHistory.filter(h =>
      new Date(h.timestamp).toDateString() === today
    )
    const trades = todayTrades.length
    const pnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    setDailyStats({ trades, pnl })
  }, [executionHistory])

  // Save trust level
  const handleLevelChange = useCallback((newLevel) => {
    // Require confirmation for high-risk levels
    if (newLevel === 'trust' || newLevel === 'autopilot') {
      setShowConfirmDialog({
        level: newLevel,
        message: newLevel === 'autopilot'
          ? 'Autopilot Mode allows AVA to trade with full autonomy. This is for experienced traders only. Are you sure?'
          : 'Trust Mode allows AVA to execute trades automatically within your limits. Continue?'
      })
      return
    }

    applyLevelChange(newLevel)
  }, [])

  const applyLevelChange = (newLevel) => {
    const oldLevel = trustLevel
    setTrustLevel(newLevel)
    localStorage.setItem(STORAGE_KEYS.LEVEL, newLevel)
    setShowConfirmDialog(null)

    // Log audit event
    logAuditEvent(AUDIT_EVENTS.TRUST_MODE_CHANGED, {
      from: oldLevel,
      to: newLevel,
      autoExecute: TRUST_LEVELS[newLevel.toUpperCase()]?.autoExecute
    })

    // Emit event for other components
    window.dispatchEvent(new CustomEvent('ava.trustModeChanged', {
      detail: { level: newLevel, autoExecute: TRUST_LEVELS[newLevel.toUpperCase()]?.autoExecute }
    }))

    // Show toast
    const levelInfo = TRUST_LEVELS[newLevel.toUpperCase()]
    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: {
        text: `${levelInfo.icon} ${levelInfo.name} activated`,
        type: levelInfo.autoExecute ? 'warning' : 'info'
      }
    }))
  }

  // Toggle pause
  const togglePause = useCallback(() => {
    const newPaused = !isPaused
    setIsPaused(newPaused)
    localStorage.setItem(STORAGE_KEYS.PAUSED, String(newPaused))

    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: {
        text: newPaused ? '⏸️ Trust Mode paused' : '▶️ Trust Mode resumed',
        type: 'info'
      }
    }))
  }, [isPaused])

  // Record execution
  const recordExecution = useCallback((execution) => {
    const record = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      ...execution,
      canUndo: true, // Enable undo for 30 seconds
      undoDeadline: Date.now() + 30000
    }

    setExecutionHistory(prev => {
      const updated = [record, ...prev].slice(0, 100) // Keep last 100
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated))
      return updated
    })

    // Set pending undo
    setPendingUndo(record)

    // Clear undo after 30 seconds
    setTimeout(() => {
      setPendingUndo(prev => prev?.id === record.id ? null : prev)
      setExecutionHistory(prev =>
        prev.map(h => h.id === record.id ? { ...h, canUndo: false } : h)
      )
    }, 30000)

    return record
  }, [])

  // Undo last execution
  const undoExecution = useCallback((executionId) => {
    const execution = executionHistory.find(h => h.id === executionId)
    if (!execution || !execution.canUndo) return false

    // Dispatch undo event
    window.dispatchEvent(new CustomEvent('ava.undoTrade', {
      detail: execution
    }))

    // Mark as undone
    setExecutionHistory(prev =>
      prev.map(h => h.id === executionId ? { ...h, undone: true, canUndo: false } : h)
    )

    setPendingUndo(null)

    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: { text: '↩️ Trade cancelled', type: 'success' }
    }))

    return true
  }, [executionHistory])

  // Check if execution is allowed
  const canExecute = useCallback((trade) => {
    // Check emergency stop first
    if (isEmergencyStopActive()) {
      logAuditEvent(AUDIT_EVENTS.TRADE_REJECTED, {
        reason: 'Emergency stop active',
        trade
      })
      return { allowed: false, reason: 'Emergency stop is active', severity: 'critical' }
    }

    if (isPaused) return { allowed: false, reason: 'Trust Mode is paused' }

    const level = TRUST_LEVELS[trustLevel.toUpperCase()]
    if (!level?.autoExecute) return { allowed: false, reason: 'Auto-execution disabled' }

    // Check global safety status
    const tradingStats = {
      drawdownPercent: dailyStats.pnl < 0 ? Math.abs(dailyStats.pnl / limits.maxDailyLoss) * 5 : 0,
      consecutiveLosses: 0, // Would need more tracking
      totalTrades: dailyStats.trades,
      errorCount: 0
    }
    const safetyCheck = isTradingAllowed(trade, tradingStats)
    if (!safetyCheck.allowed) {
      logAuditEvent(AUDIT_EVENTS.TRADE_REJECTED, {
        reason: safetyCheck.reason,
        trade
      })
      return safetyCheck
    }

    // Check limits
    if (trade.value > limits.maxPositionSize) {
      logAuditEvent(AUDIT_EVENTS.LIMIT_EXCEEDED, {
        limit: 'maxPositionSize',
        value: trade.value,
        max: limits.maxPositionSize
      })
      return { allowed: false, reason: `Exceeds max position size ($${limits.maxPositionSize})` }
    }

    if (dailyStats.trades >= limits.maxDailyTrades) {
      logAuditEvent(AUDIT_EVENTS.LIMIT_EXCEEDED, {
        limit: 'maxDailyTrades',
        value: dailyStats.trades,
        max: limits.maxDailyTrades
      })
      return { allowed: false, reason: `Daily trade limit reached (${limits.maxDailyTrades})` }
    }

    if (dailyStats.pnl < -limits.maxDailyLoss) {
      logAuditEvent(AUDIT_EVENTS.LIMIT_EXCEEDED, {
        limit: 'maxDailyLoss',
        value: dailyStats.pnl,
        max: limits.maxDailyLoss
      })
      return { allowed: false, reason: `Daily loss limit reached ($${limits.maxDailyLoss})` }
    }

    if (limits.requireHighConfidence && trade.confidence < 70) {
      return { allowed: false, reason: 'Confidence too low (requires 70%+)' }
    }

    // Check allowed symbols
    if (limits.allowedSymbols.length > 0 && !limits.allowedSymbols.includes(trade.symbol)) {
      return { allowed: false, reason: `${trade.symbol} not in allowed list` }
    }

    // Check market hours
    const hour = new Date().getHours()
    if (hour < limits.allowedHours.start || hour >= limits.allowedHours.end) {
      return { allowed: false, reason: 'Outside allowed trading hours' }
    }

    // Assess trade risk
    const riskAssessment = assessTradeRisk(trade)
    if (riskAssessment.level.id === 'extreme') {
      logAuditEvent(AUDIT_EVENTS.TRADE_REJECTED, {
        reason: 'Extreme risk level',
        riskScore: riskAssessment.score,
        trade
      })
      return { allowed: false, reason: 'Trade risk too high', riskAssessment }
    }

    return { allowed: true, riskAssessment }
  }, [isPaused, trustLevel, limits, dailyStats])

  // Get current level info
  const currentLevel = TRUST_LEVELS[trustLevel.toUpperCase()] || TRUST_LEVELS.OFF

  // Compact mode for embedding in other components
  if (compact) {
    return (
      <>
        <div className={`flex items-center gap-2 ${className}`}>
          <button
            onClick={() => handleLevelChange(trustLevel === 'off' ? 'trust' : 'off')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
              currentLevel.autoExecute
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <span>{currentLevel.icon}</span>
            <span>{currentLevel.name}</span>
            {isPaused && <span className="text-rose-400">⏸</span>}
          </button>

          {currentLevel.autoExecute && (
            <button
              onClick={togglePause}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isPaused ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? '▶️' : '⏸️'}
            </button>
          )}
        </div>

        {/* Confirmation dialog for compact mode */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
              <div className="text-center">
                <div className="text-4xl mb-4">
                  {TRUST_LEVELS[showConfirmDialog.level.toUpperCase()].icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Enable {TRUST_LEVELS[showConfirmDialog.level.toUpperCase()].name}?
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  {showConfirmDialog.message}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmDialog(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => applyLevelChange(showConfirmDialog.level)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${currentLevel.color}20` }}
            >
              {currentLevel.icon}
            </div>
            <div>
              <h3 className="text-white font-semibold">Trust Mode</h3>
              <p className="text-xs text-slate-400">{currentLevel.description}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            {currentLevel.autoExecute && (
              <button
                onClick={togglePause}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isPaused
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                }`}
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              ⚙️
            </button>
            <EmergencyStopButton size="small" />
          </div>
        </div>
      </div>

      {/* Circuit Breaker Status */}
      <div className="px-4 pt-4">
        <CircuitBreakerStatus compact />
      </div>

      {/* Level selector */}
      <div className="p-4 grid grid-cols-4 gap-2">
        {Object.values(TRUST_LEVELS).map(level => (
          <button
            key={level.id}
            onClick={() => handleLevelChange(level.id)}
            className={`p-3 rounded-xl transition-all ${
              trustLevel === level.id
                ? 'ring-2 ring-offset-2 ring-offset-slate-900'
                : 'hover:bg-slate-800/50'
            }`}
            style={{
              backgroundColor: trustLevel === level.id ? `${level.color}20` : undefined,
              ringColor: level.color
            }}
          >
            <div className="text-2xl mb-1">{level.icon}</div>
            <div className="text-xs font-medium text-white">{level.name}</div>
          </button>
        ))}
      </div>

      {/* Status bar */}
      {currentLevel.autoExecute && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400">Today:</span>
                  <span className="ml-2 text-white font-medium">{dailyStats.trades} trades</span>
                </div>
                <div>
                  <span className="text-slate-400">P&L:</span>
                  <span className={`ml-2 font-medium ${dailyStats.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {dailyStats.pnl >= 0 ? '+' : ''}${dailyStats.pnl.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${isPaused ? 'text-rose-400' : 'text-emerald-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-xs font-medium">{isPaused ? 'PAUSED' : 'ACTIVE'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending undo */}
      {pendingUndo && (
        <div className="mx-4 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-amber-300">
                {pendingUndo.action} {pendingUndo.symbol}
              </div>
              <div className="text-xs text-amber-400/70">
                Undo available for {Math.ceil((pendingUndo.undoDeadline - Date.now()) / 1000)}s
              </div>
            </div>
            <button
              onClick={() => undoExecution(pendingUndo.id)}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm font-medium transition-colors"
            >
              ↩️ Undo
            </button>
          </div>
        </div>
      )}

      {/* Execution history */}
      {showHistory && executionHistory.length > 0 && (
        <div className="border-t border-slate-800/50">
          <div className="p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Recent Executions</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {executionHistory.slice(0, 10).map(exec => (
                <div
                  key={exec.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    exec.undone ? 'bg-slate-800/30 opacity-50' : 'bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      exec.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {exec.action}
                    </span>
                    <span className="text-white">{exec.symbol}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(exec.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {exec.undone && (
                      <span className="text-xs text-slate-500">Cancelled</span>
                    )}
                    {exec.canUndo && !exec.undone && (
                      <button
                        onClick={() => undoExecution(exec.id)}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        Undo
                      </button>
                    )}
                    {exec.confidence && (
                      <span className="text-xs text-slate-400">{exec.confidence}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="border-t border-slate-800/50 p-4">
          <h4 className="text-sm font-medium text-white mb-4">Trading Limits</h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400">Max Position Size ($)</label>
              <input
                type="number"
                value={limits.maxPositionSize}
                onChange={(e) => {
                  const newLimits = { ...limits, maxPositionSize: parseInt(e.target.value) || 0 }
                  setLimits(newLimits)
                  localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(newLimits))
                }}
                className="w-full mt-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Max Daily Trades</label>
              <input
                type="number"
                value={limits.maxDailyTrades}
                onChange={(e) => {
                  const newLimits = { ...limits, maxDailyTrades: parseInt(e.target.value) || 0 }
                  setLimits(newLimits)
                  localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(newLimits))
                }}
                className="w-full mt-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Max Daily Loss ($)</label>
              <input
                type="number"
                value={limits.maxDailyLoss}
                onChange={(e) => {
                  const newLimits = { ...limits, maxDailyLoss: parseInt(e.target.value) || 0 }
                  setLimits(newLimits)
                  localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(newLimits))
                }}
                className="w-full mt-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={limits.requireHighConfidence}
                onChange={(e) => {
                  const newLimits = { ...limits, requireHighConfidence: e.target.checked }
                  setLimits(newLimits)
                  localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(newLimits))
                }}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600"
              />
              <span className="text-sm text-slate-300">Require 70%+ confidence</span>
            </label>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">
                {TRUST_LEVELS[showConfirmDialog.level.toUpperCase()].icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Enable {TRUST_LEVELS[showConfirmDialog.level.toUpperCase()].name}?
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                {showConfirmDialog.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyLevelChange(showConfirmDialog.level)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-colors"
                >
                  Enable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact toggle for header/nav use
export function TrustModeToggle({ className = '' }) {
  return <TrustModeManager compact className={className} />
}

// Hook for other components to check trust mode
export function useTrustMode() {
  const [state, setState] = useState({
    level: 'off',
    autoExecute: false,
    isPaused: false
  })

  useEffect(() => {
    const updateState = () => {
      try {
        const level = localStorage.getItem(STORAGE_KEYS.LEVEL) || 'off'
        const isPaused = localStorage.getItem(STORAGE_KEYS.PAUSED) === 'true'
        const levelInfo = TRUST_LEVELS[level.toUpperCase()]
        setState({
          level,
          autoExecute: levelInfo?.autoExecute || false,
          isPaused
        })
      } catch (e) {
        console.error('[useTrustMode] Error:', e)
      }
    }

    updateState()

    const handleChange = () => updateState()
    window.addEventListener('ava.trustModeChanged', handleChange)
    window.addEventListener('storage', handleChange)

    return () => {
      window.removeEventListener('ava.trustModeChanged', handleChange)
      window.removeEventListener('storage', handleChange)
    }
  }, [])

  return state
}
