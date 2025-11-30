/**
 * Voice Alert Service - PhD++ Quality
 *
 * Comprehensive voice alert system for AVA:
 * - Forecast alerts (high confidence predictions)
 * - Price alert triggers
 * - Customizable alert thresholds
 * - Quiet hours support
 * - Alert cooldown to prevent spam
 */

import { speakAlert, speakGuidance, voiceQueue } from '../utils/voiceSynthesis.js'

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: 'ava.voice.settings',
  LAST_ALERTS: 'ava.voice.lastAlerts'
}

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,

  // Alert thresholds
  forecastConfidenceMin: 75, // Only alert on 75%+ confidence
  forecastChangeMin: 2.0,   // Only alert on 2%+ predicted change

  // Alert types
  alertTypes: {
    forecast: true,        // Chronos predictions
    priceTarget: true,     // Price alerts hit
    tradeExecuted: true,   // Trust Mode trades
    positionAlert: true,   // Copilot position warnings
    dailySummary: false    // End of day summary
  },

  // Quiet hours (24h format)
  quietHours: {
    enabled: false,
    start: 22, // 10 PM
    end: 8     // 8 AM
  },

  // Cooldown (seconds between same alert type)
  cooldowns: {
    forecast: 300,      // 5 min between forecast alerts
    priceTarget: 60,    // 1 min between price alerts
    tradeExecuted: 0,   // No cooldown for trades
    positionAlert: 120  // 2 min between position alerts
  },

  // Voice preferences
  voice: {
    speed: 1.1,
    prefixWithSymbol: true // "NVDA: predicted to rise..."
  }
}

// In-memory state
let settings = { ...DEFAULT_SETTINGS }
let lastAlerts = {} // { alertType_symbol: timestamp }

/**
 * Initialize voice alert service
 */
export function initVoiceAlerts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (saved) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }

    const savedAlerts = localStorage.getItem(STORAGE_KEYS.LAST_ALERTS)
    if (savedAlerts) {
      lastAlerts = JSON.parse(savedAlerts)
    }

    console.log('[VoiceAlerts] Initialized with settings:', settings)
  } catch (e) {
    console.error('[VoiceAlerts] Init error:', e)
  }
}

/**
 * Save current settings
 */
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  } catch (e) {
    console.error('[VoiceAlerts] Save error:', e)
  }
}

/**
 * Update voice alert settings
 */
export function updateVoiceSettings(newSettings) {
  settings = { ...settings, ...newSettings }
  saveSettings()

  window.dispatchEvent(new CustomEvent('ava.voiceSettingsChanged', {
    detail: settings
  }))

  return settings
}

/**
 * Get current settings
 */
export function getVoiceSettings() {
  return { ...settings }
}

/**
 * Check if currently in quiet hours
 */
export function isQuietHours() {
  if (!settings.quietHours.enabled) return false

  const now = new Date()
  const hour = now.getHours()
  const { start, end } = settings.quietHours

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return hour >= start || hour < end
  }

  // Handle same-day quiet hours (e.g., 13:00 to 15:00)
  return hour >= start && hour < end
}

/**
 * Check if alert is on cooldown
 */
function isOnCooldown(alertType, symbol) {
  const key = `${alertType}_${symbol}`
  const lastAlert = lastAlerts[key]

  if (!lastAlert) return false

  const cooldown = settings.cooldowns[alertType] || 60
  const elapsed = (Date.now() - lastAlert) / 1000

  return elapsed < cooldown
}

/**
 * Record alert sent
 */
function recordAlert(alertType, symbol) {
  const key = `${alertType}_${symbol}`
  lastAlerts[key] = Date.now()

  // Clean up old entries (older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  Object.keys(lastAlerts).forEach(k => {
    if (lastAlerts[k] < oneHourAgo) {
      delete lastAlerts[k]
    }
  })

  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ALERTS, JSON.stringify(lastAlerts))
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Speak a forecast alert
 */
export async function speakForecastAlert(symbol, forecast) {
  if (!settings.enabled || !settings.alertTypes.forecast) {
    return false
  }

  if (isQuietHours()) {
    console.log('[VoiceAlerts] Skipping - quiet hours active')
    return false
  }

  if (isOnCooldown('forecast', symbol)) {
    console.log('[VoiceAlerts] Skipping - forecast on cooldown')
    return false
  }

  // Check thresholds
  const confidence = forecast.confidence || 0
  const change = Math.abs(forecast.percentChange || 0)

  if (confidence < settings.forecastConfidenceMin) {
    console.log(`[VoiceAlerts] Skipping - confidence ${confidence}% below threshold`)
    return false
  }

  if (change < settings.forecastChangeMin) {
    console.log(`[VoiceAlerts] Skipping - change ${change}% below threshold`)
    return false
  }

  // Build message
  const direction = forecast.direction?.toLowerCase() || 'neutral'
  const changeText = change.toFixed(1)
  const horizon = forecast.horizon || 24

  let message = settings.voice.prefixWithSymbol ? `${symbol}: ` : ''

  if (direction === 'bullish') {
    message += `AVA predicts ${symbol} will rise ${changeText} percent in the next ${horizon} hours. Confidence ${confidence} percent.`
  } else if (direction === 'bearish') {
    message += `AVA predicts ${symbol} will fall ${changeText} percent in the next ${horizon} hours. Confidence ${confidence} percent.`
  } else {
    message += `AVA predicts ${symbol} will remain neutral over the next ${horizon} hours.`
  }

  // Add target price if available
  if (forecast.targetPrice) {
    message += ` Target price: ${forecast.targetPrice.toFixed(2)} dollars.`
  }

  // Speak the alert
  recordAlert('forecast', symbol)

  const priority = confidence >= 85 ? 'high' : 'normal'
  await speakAlert(message, priority)

  // Dispatch event for UI feedback
  window.dispatchEvent(new CustomEvent('ava.voiceAlertSpoken', {
    detail: { type: 'forecast', symbol, message }
  }))

  return true
}

/**
 * Speak a price target alert
 */
export async function speakPriceTargetAlert(symbol, targetPrice, currentPrice, direction) {
  if (!settings.enabled || !settings.alertTypes.priceTarget) {
    return false
  }

  if (isQuietHours() || isOnCooldown('priceTarget', symbol)) {
    return false
  }

  const message = `${symbol} price alert! ${symbol} has ${
    direction === 'up' ? 'reached' : 'fallen to'
  } your target of ${targetPrice.toFixed(2)} dollars. Current price: ${currentPrice.toFixed(2)}.`

  recordAlert('priceTarget', symbol)
  await speakAlert(message, 'high')

  window.dispatchEvent(new CustomEvent('ava.voiceAlertSpoken', {
    detail: { type: 'priceTarget', symbol, message }
  }))

  return true
}

/**
 * Speak a trade executed alert
 */
export async function speakTradeExecutedAlert(trade) {
  if (!settings.enabled || !settings.alertTypes.tradeExecuted) {
    return false
  }

  if (isQuietHours()) {
    return false
  }

  const { symbol, side, qty, price } = trade
  const action = side === 'buy' ? 'bought' : 'sold'

  const message = `AVA has ${action} ${qty} shares of ${symbol} at ${price.toFixed(2)} dollars.`

  recordAlert('tradeExecuted', symbol)
  await speakAlert(message, 'high')

  window.dispatchEvent(new CustomEvent('ava.voiceAlertSpoken', {
    detail: { type: 'tradeExecuted', symbol, message }
  }))

  return true
}

/**
 * Speak a position alert
 */
export async function speakPositionAlert(symbol, alertType, details) {
  if (!settings.enabled || !settings.alertTypes.positionAlert) {
    return false
  }

  if (isQuietHours() || isOnCooldown('positionAlert', symbol)) {
    return false
  }

  let message = ''

  switch (alertType) {
    case 'stopHit':
      message = `Warning! ${symbol} has hit your stop loss at ${details.price.toFixed(2)} dollars.`
      break
    case 'targetHit':
      message = `${symbol} has reached your profit target at ${details.price.toFixed(2)} dollars.`
      break
    case 'largeMove':
      message = `${symbol} is ${details.direction === 'up' ? 'up' : 'down'} ${details.percent.toFixed(1)} percent. Consider ${details.direction === 'up' ? 'taking profits' : 'cutting losses'}.`
      break
    case 'riskWarning':
      message = `Risk warning for ${symbol}: ${details.reason}`
      break
    default:
      message = `Position alert for ${symbol}: ${details.message || 'Check your position'}`
  }

  recordAlert('positionAlert', symbol)
  await speakAlert(message, 'high')

  window.dispatchEvent(new CustomEvent('ava.voiceAlertSpoken', {
    detail: { type: 'positionAlert', alertType, symbol, message }
  }))

  return true
}

/**
 * Speak daily summary
 */
export async function speakDailySummary(summary) {
  if (!settings.enabled || !settings.alertTypes.dailySummary) {
    return false
  }

  if (isQuietHours()) {
    return false
  }

  const { trades, pnl, winRate, topWinner, topLoser } = summary

  let message = `End of day summary. `

  if (trades > 0) {
    message += `You made ${trades} trades today with a ${pnl >= 0 ? 'profit' : 'loss'} of ${Math.abs(pnl).toFixed(2)} percent. `
    message += `Win rate: ${winRate.toFixed(0)} percent. `

    if (topWinner) {
      message += `Top winner: ${topWinner.symbol}, up ${topWinner.percent.toFixed(1)} percent. `
    }
    if (topLoser) {
      message += `Top loser: ${topLoser.symbol}, down ${Math.abs(topLoser.percent).toFixed(1)} percent. `
    }
  } else {
    message += `No trades made today. `
  }

  await speakGuidance(message)

  return true
}

/**
 * Test voice alerts (useful for settings UI)
 */
export async function testVoiceAlert() {
  const testMessage = "This is a test of AVA voice alerts. Your settings are working correctly."
  await speakAlert(testMessage, 'normal')
  return true
}

/**
 * Set quiet hours
 */
export function setQuietHours(enabled, start = 22, end = 8) {
  settings.quietHours = { enabled, start, end }
  saveSettings()
  return settings.quietHours
}

/**
 * Set alert threshold
 */
export function setAlertThreshold(type, value) {
  if (type === 'confidence') {
    settings.forecastConfidenceMin = Math.max(0, Math.min(100, value))
  } else if (type === 'change') {
    settings.forecastChangeMin = Math.max(0, value)
  }
  saveSettings()
  return settings
}

/**
 * Toggle alert type
 */
export function toggleAlertType(type, enabled) {
  if (settings.alertTypes.hasOwnProperty(type)) {
    settings.alertTypes[type] = enabled
    saveSettings()
  }
  return settings.alertTypes
}

/**
 * Enable/disable all voice alerts
 */
export function setVoiceAlertsEnabled(enabled) {
  settings.enabled = enabled
  saveSettings()
  return settings.enabled
}

// Initialize on import
initVoiceAlerts()

// Listen for forecast updates to trigger voice alerts
window.addEventListener('ava.forecastUpdated', (event) => {
  const { symbol, forecast } = event.detail || {}
  if (symbol && forecast) {
    speakForecastAlert(symbol, forecast)
  }
})

// Listen for trade executions
window.addEventListener('ava.tradeExecuted', (event) => {
  const trade = event.detail
  if (trade) {
    speakTradeExecutedAlert(trade)
  }
})

// Listen for Chronos alerts
window.addEventListener('ava.chronosAlert', (event) => {
  const alert = event.detail
  if (alert && alert.symbol) {
    speakForecastAlert(alert.symbol, {
      direction: alert.direction,
      confidence: alert.confidence,
      percentChange: parseFloat(alert.message?.match(/[+-]?\d+\.?\d*/)?.[0]) || 0,
      targetPrice: alert.targetPrice,
      horizon: 24
    })
  }
})

export default {
  initVoiceAlerts,
  updateVoiceSettings,
  getVoiceSettings,
  isQuietHours,
  speakForecastAlert,
  speakPriceTargetAlert,
  speakTradeExecutedAlert,
  speakPositionAlert,
  speakDailySummary,
  testVoiceAlert,
  setQuietHours,
  setAlertThreshold,
  toggleAlertType,
  setVoiceAlertsEnabled
}
