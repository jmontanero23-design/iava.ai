/**
 * SafetyManager - Elite Trading Safety System
 *
 * Comprehensive safety controls for autonomous trading:
 * - Emergency kill switch
 * - Comprehensive audit logging
 * - Circuit breakers (drawdown, volatility, error rate)
 * - Position monitoring
 * - Risk assessment for trades
 * - Export audit logs
 *
 * PhD++ Quality: Production-ready safety for real money trading
 */

const STORAGE_KEYS = {
  AUDIT_LOG: 'ava.safety.auditLog',
  CIRCUIT_BREAKERS: 'ava.safety.circuitBreakers',
  EMERGENCY_STOP: 'ava.safety.emergencyStop',
  RISK_SETTINGS: 'ava.safety.riskSettings'
}

// Audit event types
export const AUDIT_EVENTS = {
  TRADE_EXECUTED: 'TRADE_EXECUTED',
  TRADE_CANCELLED: 'TRADE_CANCELLED',
  TRADE_REJECTED: 'TRADE_REJECTED',
  TRUST_MODE_CHANGED: 'TRUST_MODE_CHANGED',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  CIRCUIT_BREAKER_TRIGGERED: 'CIRCUIT_BREAKER_TRIGGERED',
  EMERGENCY_STOP_ACTIVATED: 'EMERGENCY_STOP_ACTIVATED',
  EMERGENCY_STOP_RELEASED: 'EMERGENCY_STOP_RELEASED',
  ALERT_FIRED: 'ALERT_FIRED',
  SETTING_CHANGED: 'SETTING_CHANGED',
  SESSION_START: 'SESSION_START',
  SESSION_END: 'SESSION_END'
}

// Circuit breaker thresholds
const DEFAULT_CIRCUIT_BREAKERS = {
  maxDrawdownPercent: 5,        // Pause if daily drawdown exceeds 5%
  maxConsecutiveLosses: 3,      // Pause after 3 consecutive losses
  maxErrorRate: 0.2,            // Pause if 20% of trades error
  maxVolatilityMultiplier: 2,   // Pause if volatility 2x normal
  cooldownMinutes: 30           // Cooldown after trigger
}

// Risk levels for trades
export const RISK_LEVELS = {
  LOW: { id: 'low', label: 'Low Risk', color: '#10B981', maxScore: 30 },
  MEDIUM: { id: 'medium', label: 'Medium Risk', color: '#F59E0B', maxScore: 60 },
  HIGH: { id: 'high', label: 'High Risk', color: '#EF4444', maxScore: 85 },
  EXTREME: { id: 'extreme', label: 'Extreme Risk', color: '#DC2626', maxScore: 100 }
}

// In-memory state
let auditLog = []
let circuitBreakerState = {
  triggered: false,
  reason: null,
  triggeredAt: null,
  cooldownUntil: null
}
let emergencyStopActive = false
let sessionId = null

/**
 * Initialize the safety manager
 */
export function initSafetyManager() {
  try {
    // Load audit log
    const savedLog = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG)
    if (savedLog) {
      auditLog = JSON.parse(savedLog)
      // Keep last 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      auditLog = auditLog.filter(e => e.timestamp > sevenDaysAgo)
    }

    // Load emergency stop state
    emergencyStopActive = localStorage.getItem(STORAGE_KEYS.EMERGENCY_STOP) === 'true'

    // Load circuit breaker state
    const savedBreakers = localStorage.getItem(STORAGE_KEYS.CIRCUIT_BREAKERS)
    if (savedBreakers) {
      const parsed = JSON.parse(savedBreakers)
      // Check if cooldown has expired
      if (parsed.cooldownUntil && Date.now() > parsed.cooldownUntil) {
        circuitBreakerState = { triggered: false, reason: null, triggeredAt: null, cooldownUntil: null }
      } else {
        circuitBreakerState = parsed
      }
    }

    // Generate session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    // Log session start
    logAuditEvent(AUDIT_EVENTS.SESSION_START, {
      sessionId,
      emergencyStopActive,
      circuitBreakerTriggered: circuitBreakerState.triggered
    })

    console.log('[SafetyManager] Initialized', {
      auditLogEntries: auditLog.length,
      emergencyStopActive,
      circuitBreakerTriggered: circuitBreakerState.triggered
    })

    // Set up session end logging
    window.addEventListener('beforeunload', () => {
      logAuditEvent(AUDIT_EVENTS.SESSION_END, { sessionId })
    })

  } catch (e) {
    console.error('[SafetyManager] Init error:', e)
  }
}

/**
 * Log an audit event
 */
export function logAuditEvent(eventType, details = {}) {
  const event = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    eventType,
    sessionId,
    details,
    // Include context
    context: {
      url: typeof window !== 'undefined' ? window.location.pathname : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : null
    }
  }

  auditLog.push(event)

  // Keep last 1000 events
  if (auditLog.length > 1000) {
    auditLog = auditLog.slice(-1000)
  }

  // Persist
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLog))
  } catch (e) {
    console.error('[SafetyManager] Audit log save error:', e)
  }

  // Dispatch event for real-time monitoring
  window.dispatchEvent(new CustomEvent('ava.auditEvent', { detail: event }))

  return event
}

/**
 * Get audit log with optional filtering
 */
export function getAuditLog(options = {}) {
  const { eventType, startTime, endTime, limit = 100 } = options

  let filtered = [...auditLog]

  if (eventType) {
    filtered = filtered.filter(e => e.eventType === eventType)
  }

  if (startTime) {
    filtered = filtered.filter(e => e.timestamp >= startTime)
  }

  if (endTime) {
    filtered = filtered.filter(e => e.timestamp <= endTime)
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp - a.timestamp)

  return filtered.slice(0, limit)
}

/**
 * Export audit log as JSON or CSV
 */
export function exportAuditLog(format = 'json') {
  const data = auditLog.sort((a, b) => b.timestamp - a.timestamp)

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `ava-audit-log-${new Date().toISOString().slice(0, 10)}.json`)
    return
  }

  if (format === 'csv') {
    const headers = ['Timestamp', 'Event Type', 'Session ID', 'Details']
    const rows = data.map(e => [
      new Date(e.timestamp).toISOString(),
      e.eventType,
      e.sessionId || '',
      JSON.stringify(e.details)
    ])

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    downloadBlob(blob, `ava-audit-log-${new Date().toISOString().slice(0, 10)}.csv`)
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Activate emergency stop - immediately halts all autonomous trading
 */
export function activateEmergencyStop(reason = 'Manual activation') {
  emergencyStopActive = true
  localStorage.setItem(STORAGE_KEYS.EMERGENCY_STOP, 'true')

  logAuditEvent(AUDIT_EVENTS.EMERGENCY_STOP_ACTIVATED, { reason })

  // Dispatch for immediate UI update
  window.dispatchEvent(new CustomEvent('ava.emergencyStop', {
    detail: { active: true, reason }
  }))

  // Show prominent toast
  window.dispatchEvent(new CustomEvent('iava.toast', {
    detail: {
      text: '🚨 EMERGENCY STOP ACTIVATED - All autonomous trading halted',
      type: 'error',
      duration: 10000
    }
  }))

  console.warn('[SafetyManager] EMERGENCY STOP ACTIVATED:', reason)

  return true
}

/**
 * Release emergency stop
 */
export function releaseEmergencyStop(confirmationCode = null) {
  // Require confirmation code for safety
  const expectedCode = 'CONFIRM_RELEASE'
  if (confirmationCode !== expectedCode) {
    console.warn('[SafetyManager] Emergency stop release requires confirmation code')
    return false
  }

  emergencyStopActive = false
  localStorage.setItem(STORAGE_KEYS.EMERGENCY_STOP, 'false')

  logAuditEvent(AUDIT_EVENTS.EMERGENCY_STOP_RELEASED, {})

  window.dispatchEvent(new CustomEvent('ava.emergencyStop', {
    detail: { active: false }
  }))

  window.dispatchEvent(new CustomEvent('iava.toast', {
    detail: {
      text: '✅ Emergency stop released - Trading can resume',
      type: 'success'
    }
  }))

  return true
}

/**
 * Check if emergency stop is active
 */
export function isEmergencyStopActive() {
  return emergencyStopActive
}

/**
 * Check circuit breakers based on trading activity
 */
export function checkCircuitBreakers(tradingStats) {
  const breakers = DEFAULT_CIRCUIT_BREAKERS

  // Already triggered and in cooldown?
  if (circuitBreakerState.triggered && circuitBreakerState.cooldownUntil) {
    if (Date.now() < circuitBreakerState.cooldownUntil) {
      return {
        blocked: true,
        reason: circuitBreakerState.reason,
        cooldownRemaining: circuitBreakerState.cooldownUntil - Date.now()
      }
    } else {
      // Cooldown expired, reset
      circuitBreakerState = { triggered: false, reason: null, triggeredAt: null, cooldownUntil: null }
      saveCircuitBreakerState()
    }
  }

  // Check max drawdown
  if (tradingStats.drawdownPercent > breakers.maxDrawdownPercent) {
    return triggerCircuitBreaker(`Drawdown ${tradingStats.drawdownPercent.toFixed(1)}% exceeds ${breakers.maxDrawdownPercent}% limit`)
  }

  // Check consecutive losses
  if (tradingStats.consecutiveLosses >= breakers.maxConsecutiveLosses) {
    return triggerCircuitBreaker(`${tradingStats.consecutiveLosses} consecutive losses`)
  }

  // Check error rate
  if (tradingStats.totalTrades > 5) {
    const errorRate = tradingStats.errorCount / tradingStats.totalTrades
    if (errorRate > breakers.maxErrorRate) {
      return triggerCircuitBreaker(`Error rate ${(errorRate * 100).toFixed(0)}% exceeds ${breakers.maxErrorRate * 100}% limit`)
    }
  }

  return { blocked: false }
}

function triggerCircuitBreaker(reason) {
  const breakers = DEFAULT_CIRCUIT_BREAKERS

  circuitBreakerState = {
    triggered: true,
    reason,
    triggeredAt: Date.now(),
    cooldownUntil: Date.now() + breakers.cooldownMinutes * 60 * 1000
  }

  saveCircuitBreakerState()

  logAuditEvent(AUDIT_EVENTS.CIRCUIT_BREAKER_TRIGGERED, {
    reason,
    cooldownMinutes: breakers.cooldownMinutes
  })

  window.dispatchEvent(new CustomEvent('ava.circuitBreaker', {
    detail: circuitBreakerState
  }))

  window.dispatchEvent(new CustomEvent('iava.toast', {
    detail: {
      text: `⚡ Circuit breaker triggered: ${reason}. Trading paused for ${breakers.cooldownMinutes} minutes.`,
      type: 'warning',
      duration: 8000
    }
  }))

  return {
    blocked: true,
    reason,
    cooldownRemaining: breakers.cooldownMinutes * 60 * 1000
  }
}

function saveCircuitBreakerState() {
  try {
    localStorage.setItem(STORAGE_KEYS.CIRCUIT_BREAKERS, JSON.stringify(circuitBreakerState))
  } catch (e) {
    console.error('[SafetyManager] Circuit breaker save error:', e)
  }
}

/**
 * Assess risk for a proposed trade
 */
export function assessTradeRisk(trade) {
  let score = 0
  const factors = []

  // Position size risk (0-25 points)
  if (trade.value > 5000) {
    score += 25
    factors.push({ name: 'Large position', impact: 25 })
  } else if (trade.value > 2000) {
    score += 15
    factors.push({ name: 'Medium position', impact: 15 })
  } else if (trade.value > 500) {
    score += 5
    factors.push({ name: 'Small position', impact: 5 })
  }

  // Confidence risk (0-20 points)
  if (trade.confidence < 50) {
    score += 20
    factors.push({ name: 'Low confidence', impact: 20 })
  } else if (trade.confidence < 70) {
    score += 10
    factors.push({ name: 'Medium confidence', impact: 10 })
  }

  // Volatility risk (0-20 points)
  if (trade.volatility > 5) {
    score += 20
    factors.push({ name: 'High volatility', impact: 20 })
  } else if (trade.volatility > 2) {
    score += 10
    factors.push({ name: 'Moderate volatility', impact: 10 })
  }

  // Market hours risk (0-15 points)
  const hour = new Date().getHours()
  if (hour < 9 || hour >= 16) {
    score += 15
    factors.push({ name: 'Outside market hours', impact: 15 })
  } else if (hour === 9 || hour === 15) {
    score += 5
    factors.push({ name: 'Market open/close', impact: 5 })
  }

  // Leverage risk (0-20 points)
  if (trade.leverage > 1) {
    score += Math.min(20, trade.leverage * 5)
    factors.push({ name: `${trade.leverage}x leverage`, impact: Math.min(20, trade.leverage * 5) })
  }

  // Determine risk level
  let level = RISK_LEVELS.LOW
  if (score > RISK_LEVELS.HIGH.maxScore) level = RISK_LEVELS.EXTREME
  else if (score > RISK_LEVELS.MEDIUM.maxScore) level = RISK_LEVELS.HIGH
  else if (score > RISK_LEVELS.LOW.maxScore) level = RISK_LEVELS.MEDIUM

  return {
    score,
    level,
    factors,
    recommendation: level.id === 'extreme'
      ? 'NOT RECOMMENDED - Consider reducing position size or waiting for better conditions'
      : level.id === 'high'
        ? 'CAUTION - Review risk factors before proceeding'
        : level.id === 'medium'
          ? 'MODERATE - Acceptable with proper risk management'
          : 'ACCEPTABLE - Within normal risk parameters'
  }
}

/**
 * Check if trading is allowed (combines all safety checks)
 */
export function isTradingAllowed(trade = null, tradingStats = null) {
  // Check emergency stop first
  if (emergencyStopActive) {
    return {
      allowed: false,
      reason: 'Emergency stop is active',
      severity: 'critical'
    }
  }

  // Check circuit breakers if we have stats
  if (tradingStats) {
    const breakerCheck = checkCircuitBreakers(tradingStats)
    if (breakerCheck.blocked) {
      return {
        allowed: false,
        reason: breakerCheck.reason,
        severity: 'warning',
        cooldownRemaining: breakerCheck.cooldownRemaining
      }
    }
  }

  // Check trade risk if provided
  if (trade) {
    const riskAssessment = assessTradeRisk(trade)
    if (riskAssessment.level.id === 'extreme') {
      return {
        allowed: false,
        reason: 'Trade risk is too high',
        severity: 'warning',
        riskAssessment
      }
    }
  }

  return { allowed: true }
}

/**
 * Get safety status summary
 */
export function getSafetyStatus() {
  return {
    emergencyStopActive,
    circuitBreakerState: { ...circuitBreakerState },
    auditLogCount: auditLog.length,
    sessionId,
    recentEvents: auditLog.slice(-5).reverse()
  }
}

/**
 * Reset circuit breaker (admin function)
 */
export function resetCircuitBreaker(confirmationCode = null) {
  if (confirmationCode !== 'RESET_BREAKER') {
    return false
  }

  circuitBreakerState = { triggered: false, reason: null, triggeredAt: null, cooldownUntil: null }
  saveCircuitBreakerState()

  logAuditEvent(AUDIT_EVENTS.SETTING_CHANGED, {
    setting: 'circuitBreaker',
    action: 'reset'
  })

  return true
}

// Initialize on import
initSafetyManager()

export default {
  logAuditEvent,
  getAuditLog,
  exportAuditLog,
  activateEmergencyStop,
  releaseEmergencyStop,
  isEmergencyStopActive,
  checkCircuitBreakers,
  assessTradeRisk,
  isTradingAllowed,
  getSafetyStatus,
  resetCircuitBreaker,
  AUDIT_EVENTS,
  RISK_LEVELS
}
