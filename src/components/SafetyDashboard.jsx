/**
 * SafetyDashboard - Elite Trading Safety Control Center
 *
 * Comprehensive safety UI component providing:
 * - Emergency stop button (kill switch)
 * - Circuit breaker status and controls
 * - Real-time audit log viewer
 * - Risk assessment display
 * - Export audit logs
 *
 * PhD++ Quality: Production-ready safety for real money trading
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  getSafetyStatus,
  getAuditLog,
  exportAuditLog,
  activateEmergencyStop,
  releaseEmergencyStop,
  resetCircuitBreaker,
  AUDIT_EVENTS,
  RISK_LEVELS
} from '../services/safetyManager.js'

// Event type display config
const EVENT_DISPLAY = {
  [AUDIT_EVENTS.TRADE_EXECUTED]: { icon: '💰', color: 'text-emerald-400', label: 'Trade Executed' },
  [AUDIT_EVENTS.TRADE_CANCELLED]: { icon: '↩️', color: 'text-amber-400', label: 'Trade Cancelled' },
  [AUDIT_EVENTS.TRADE_REJECTED]: { icon: '🚫', color: 'text-rose-400', label: 'Trade Rejected' },
  [AUDIT_EVENTS.TRUST_MODE_CHANGED]: { icon: '🔐', color: 'text-purple-400', label: 'Trust Mode Changed' },
  [AUDIT_EVENTS.LIMIT_EXCEEDED]: { icon: '⚠️', color: 'text-amber-400', label: 'Limit Exceeded' },
  [AUDIT_EVENTS.CIRCUIT_BREAKER_TRIGGERED]: { icon: '⚡', color: 'text-rose-400', label: 'Circuit Breaker' },
  [AUDIT_EVENTS.EMERGENCY_STOP_ACTIVATED]: { icon: '🚨', color: 'text-red-500', label: 'Emergency Stop' },
  [AUDIT_EVENTS.EMERGENCY_STOP_RELEASED]: { icon: '✅', color: 'text-emerald-400', label: 'Stop Released' },
  [AUDIT_EVENTS.ALERT_FIRED]: { icon: '🔔', color: 'text-cyan-400', label: 'Alert Fired' },
  [AUDIT_EVENTS.SETTING_CHANGED]: { icon: '⚙️', color: 'text-slate-400', label: 'Setting Changed' },
  [AUDIT_EVENTS.SESSION_START]: { icon: '▶️', color: 'text-slate-500', label: 'Session Start' },
  [AUDIT_EVENTS.SESSION_END]: { icon: '⏹️', color: 'text-slate-500', label: 'Session End' }
}

// Emergency Stop Button Component
export function EmergencyStopButton({ size = 'medium', className = '' }) {
  const [isActive, setIsActive] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [releaseCode, setReleaseCode] = useState('')

  useEffect(() => {
    const updateStatus = () => {
      const status = getSafetyStatus()
      setIsActive(status.emergencyStopActive)
    }

    updateStatus()

    const handleEmergencyStop = (e) => {
      setIsActive(e.detail.active)
    }

    window.addEventListener('ava.emergencyStop', handleEmergencyStop)
    return () => window.removeEventListener('ava.emergencyStop', handleEmergencyStop)
  }, [])

  const handleActivate = () => {
    activateEmergencyStop('Manual emergency stop')
    setShowConfirm(false)
  }

  const handleRelease = () => {
    if (releaseEmergencyStop(releaseCode)) {
      setReleaseCode('')
      setShowConfirm(false)
    } else {
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Invalid confirmation code', type: 'error' }
      }))
    }
  }

  const sizeClasses = {
    small: 'w-10 h-10 text-lg',
    medium: 'w-14 h-14 text-2xl',
    large: 'w-20 h-20 text-3xl'
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center transition-all
          ${isActive
            ? 'bg-gradient-to-br from-red-600 to-red-800 shadow-lg shadow-red-500/50 animate-pulse'
            : 'bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/30'
          }
          ${className}
        `}
        title={isActive ? 'Emergency Stop Active - Click to release' : 'Emergency Stop'}
      >
        {isActive ? '🔴' : '🛑'}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            {!isActive ? (
              // Activate confirmation
              <>
                <div className="text-center">
                  <div className="text-6xl mb-4">🚨</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Activate Emergency Stop?
                  </h3>
                  <p className="text-slate-400 mb-6">
                    This will immediately halt ALL autonomous trading.
                    You can release it later with a confirmation code.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActivate}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                  >
                    🛑 STOP ALL TRADING
                  </button>
                </div>
              </>
            ) : (
              // Release confirmation
              <>
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-pulse">🔴</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Release Emergency Stop?
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Type <code className="bg-slate-800 px-2 py-1 rounded text-emerald-400">CONFIRM_RELEASE</code> to re-enable trading.
                  </p>
                </div>
                <input
                  type="text"
                  value={releaseCode}
                  onChange={(e) => setReleaseCode(e.target.value)}
                  placeholder="Enter confirmation code"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center font-mono mb-4"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                  >
                    Keep Stopped
                  </button>
                  <button
                    onClick={handleRelease}
                    disabled={releaseCode !== 'CONFIRM_RELEASE'}
                    className={`flex-1 py-3 font-bold rounded-xl transition-colors ${
                      releaseCode === 'CONFIRM_RELEASE'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Release
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Circuit Breaker Status Component
export function CircuitBreakerStatus({ compact = false, className = '' }) {
  const [status, setStatus] = useState(null)
  const [showReset, setShowReset] = useState(false)
  const [resetCode, setResetCode] = useState('')

  useEffect(() => {
    const updateStatus = () => {
      const safetyStatus = getSafetyStatus()
      setStatus(safetyStatus.circuitBreakerState)
    }

    updateStatus()
    const interval = setInterval(updateStatus, 1000)

    const handleBreaker = (e) => setStatus(e.detail)
    window.addEventListener('ava.circuitBreaker', handleBreaker)

    return () => {
      clearInterval(interval)
      window.removeEventListener('ava.circuitBreaker', handleBreaker)
    }
  }, [])

  const handleReset = () => {
    if (resetCircuitBreaker(resetCode)) {
      setResetCode('')
      setShowReset(false)
      setStatus({ triggered: false })
    }
  }

  if (!status?.triggered) {
    if (compact) return null
    return (
      <div className={`flex items-center gap-2 text-emerald-400 text-sm ${className}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        Circuit Breakers OK
      </div>
    )
  }

  const cooldownMinutes = status.cooldownUntil
    ? Math.ceil((status.cooldownUntil - Date.now()) / 60000)
    : 0

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-amber-400 ${className}`}>
        <span className="animate-pulse">⚡</span>
        <span className="text-sm">Paused: {status.reason}</span>
      </div>
    )
  }

  return (
    <>
      <div className={`p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">⚡</span>
            <div>
              <div className="font-semibold text-amber-300">Circuit Breaker Triggered</div>
              <div className="text-sm text-amber-400/70">{status.reason}</div>
            </div>
          </div>
          <button
            onClick={() => setShowReset(true)}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm transition-colors"
          >
            Reset
          </button>
        </div>
        {cooldownMinutes > 0 && (
          <div className="text-sm text-amber-400">
            Auto-resume in {cooldownMinutes} minute{cooldownMinutes !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Reset Modal */}
      {showReset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="text-xl font-bold text-white">Reset Circuit Breaker?</h3>
              <p className="text-slate-400 text-sm mt-2">
                Type <code className="bg-slate-800 px-2 py-1 rounded text-amber-400">RESET_BREAKER</code> to reset.
              </p>
            </div>
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Confirmation code"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center font-mono mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetCode !== 'RESET_BREAKER'}
                className={`flex-1 py-2 rounded-lg ${
                  resetCode === 'RESET_BREAKER'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-slate-700 text-slate-500'
                }`}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Audit Log Viewer Component
export function AuditLogViewer({ limit = 50, filterType = null, className = '' }) {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState(filterType || 'all')
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    const loadEvents = () => {
      const options = { limit }
      if (filter !== 'all') {
        options.eventType = filter
      }
      setEvents(getAuditLog(options))
    }

    loadEvents()

    if (isLive) {
      const handleNewEvent = () => loadEvents()
      window.addEventListener('ava.auditEvent', handleNewEvent)
      return () => window.removeEventListener('ava.auditEvent', handleNewEvent)
    }
  }, [filter, limit, isLive])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString()
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <div className={`bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Audit Log</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isLive ? '🔴 Live' : '⏸️ Paused'}
            </button>
            <button
              onClick={() => exportAuditLog('json')}
              className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={() => exportAuditLog('csv')}
              className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filter === 'all' ? 'bg-purple-500/30 text-purple-400' : 'bg-slate-800 text-slate-400'
            }`}
          >
            All
          </button>
          {Object.entries(EVENT_DISPLAY).slice(0, 6).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filter === type ? 'bg-purple-500/30 text-purple-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <div className="text-3xl mb-2">📋</div>
            <div>No events yet</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {events.map((event) => {
              const display = EVENT_DISPLAY[event.eventType] || {
                icon: '📝',
                color: 'text-slate-400',
                label: event.eventType
              }

              return (
                <div key={event.id} className="p-3 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{display.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${display.color}`}>
                          {display.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      {event.details && Object.keys(event.details).length > 0 && (
                        <div className="text-xs text-slate-400 mt-1 truncate">
                          {Object.entries(event.details)
                            .filter(([k]) => k !== 'sessionId')
                            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                            .join(' | ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Risk Assessment Display Component
export function RiskAssessmentCard({ assessment, className = '' }) {
  if (!assessment) return null

  const { score, level, factors, recommendation } = assessment

  return (
    <div className={`p-4 rounded-xl border ${className}`} style={{
      backgroundColor: `${level.color}10`,
      borderColor: `${level.color}30`
    }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: `${level.color}20`, color: level.color }}
          >
            {score}
          </div>
          <div>
            <div className="font-semibold" style={{ color: level.color }}>
              {level.label}
            </div>
            <div className="text-xs text-slate-400">Risk Score</div>
          </div>
        </div>

        {/* Score gauge */}
        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${score}%`,
              backgroundColor: level.color
            }}
          />
        </div>
      </div>

      {/* Risk factors */}
      {factors.length > 0 && (
        <div className="space-y-1 mb-3">
          {factors.map((factor, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{factor.name}</span>
              <span style={{ color: level.color }}>+{factor.impact}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div className="text-xs text-slate-300 pt-2 border-t border-slate-800/50">
        {recommendation}
      </div>
    </div>
  )
}

// Main Safety Dashboard Component
export default function SafetyDashboard({ className = '' }) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const updateStatus = () => {
      setStatus(getSafetyStatus())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Safety Status Header */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Safety Center</h2>
            <p className="text-sm text-slate-400 mt-1">
              Monitor and control trading safety features
            </p>
          </div>
          <EmergencyStopButton size="medium" />
        </div>
      </div>

      {/* Circuit Breaker Status */}
      <CircuitBreakerStatus />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {status?.auditLogCount || 0}
          </div>
          <div className="text-xs text-slate-400">Audit Events</div>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 text-center">
          <div className={`text-2xl font-bold ${status?.emergencyStopActive ? 'text-red-400' : 'text-emerald-400'}`}>
            {status?.emergencyStopActive ? '🔴' : '🟢'}
          </div>
          <div className="text-xs text-slate-400">
            {status?.emergencyStopActive ? 'Stopped' : 'Active'}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 text-center">
          <div className={`text-2xl font-bold ${status?.circuitBreakerState?.triggered ? 'text-amber-400' : 'text-emerald-400'}`}>
            {status?.circuitBreakerState?.triggered ? '⚡' : '✓'}
          </div>
          <div className="text-xs text-slate-400">
            {status?.circuitBreakerState?.triggered ? 'Breaker On' : 'Breakers OK'}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <AuditLogViewer limit={20} />
    </div>
  )
}
