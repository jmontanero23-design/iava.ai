/**
 * Chronos-Copilot Bridge
 *
 * Connects Chronos forecasts to the AI Copilot for proactive alerts.
 * Enables actionable predictions that users can act on immediately.
 *
 * Features:
 * - Real-time forecast monitoring
 * - Proactive alerts when predictions change
 * - "Set alert at prediction" functionality
 * - "Create order at prediction" functionality
 * - Historical accuracy tracking
 */

const STORAGE_KEYS = {
  FORECAST_CACHE: 'ava.chronos.cache',
  ACCURACY_HISTORY: 'ava.chronos.accuracy',
  ALERTS: 'ava.chronos.alerts'
}

// Forecast cache for quick access
let forecastCache = {}

// Accuracy tracking
let accuracyHistory = []

/**
 * Initialize the bridge - load cached data
 */
export function initChronosBridge() {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.FORECAST_CACHE)
    if (cached) {
      forecastCache = JSON.parse(cached)
      // Clean old forecasts (older than 24h)
      const now = Date.now()
      Object.keys(forecastCache).forEach(key => {
        if (now - forecastCache[key].timestamp > 24 * 60 * 60 * 1000) {
          delete forecastCache[key]
        }
      })
    }

    const accuracy = localStorage.getItem(STORAGE_KEYS.ACCURACY_HISTORY)
    if (accuracy) {
      accuracyHistory = JSON.parse(accuracy)
    }
  } catch (e) {
    console.error('[ChronosBridge] Init error:', e)
  }
}

/**
 * Cache a forecast for a symbol
 */
export function cacheForecast(symbol, forecast) {
  const entry = {
    symbol,
    forecast,
    timestamp: Date.now()
  }

  forecastCache[symbol] = entry

  try {
    localStorage.setItem(STORAGE_KEYS.FORECAST_CACHE, JSON.stringify(forecastCache))
  } catch (e) {
    console.error('[ChronosBridge] Cache error:', e)
  }

  // Check if this forecast warrants an alert
  checkForecastAlert(symbol, forecast)

  return entry
}

/**
 * Get cached forecast for a symbol
 */
export function getCachedForecast(symbol) {
  const entry = forecastCache[symbol]
  if (!entry) return null

  // Check if still valid (less than 1 hour old)
  if (Date.now() - entry.timestamp > 60 * 60 * 1000) {
    return null
  }

  return entry.forecast
}

/**
 * Check if forecast warrants a Copilot alert
 */
function checkForecastAlert(symbol, forecast) {
  if (!forecast) return

  const {
    direction,
    confidence,
    percentChange,
    targetPrice,
    horizon
  } = forecast

  // Generate alert if high confidence prediction
  if (confidence >= 70) {
    const alert = {
      id: `chronos-${symbol}-${Date.now()}`,
      type: 'forecast',
      symbol,
      priority: confidence >= 85 ? 'high' : 'medium',
      title: `AVA Predicts ${symbol} ${direction === 'bullish' ? '📈' : direction === 'bearish' ? '📉' : '➡️'}`,
      message: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}% in ${horizon}h (${confidence}% confident)`,
      targetPrice,
      confidence,
      direction,
      timestamp: Date.now(),
      actionable: true,
      actions: [
        {
          id: 'set_alert',
          label: 'Set Price Alert',
          icon: '🔔'
        },
        {
          id: 'view_chart',
          label: 'View Chart',
          icon: '📊'
        }
      ]
    }

    // Add order action for high confidence
    if (confidence >= 80 && direction !== 'neutral') {
      alert.actions.unshift({
        id: 'create_order',
        label: direction === 'bullish' ? 'Quick Buy' : 'Quick Sell',
        icon: direction === 'bullish' ? '🟢' : '🔴'
      })
    }

    // Dispatch to Copilot
    window.dispatchEvent(new CustomEvent('ava.chronosAlert', { detail: alert }))

    return alert
  }

  return null
}

/**
 * Generate Copilot-formatted prediction message
 */
export function formatPredictionForCopilot(forecast, symbol) {
  if (!forecast) return null

  const {
    direction,
    confidence,
    percentChange,
    targetPrice,
    horizon
  } = forecast

  const directionEmoji = direction === 'bullish' ? '📈' : direction === 'bearish' ? '📉' : '➡️'
  const directionText = direction.charAt(0).toUpperCase() + direction.slice(1)

  return {
    title: `Chronos Forecast: ${symbol}`,
    emoji: directionEmoji,
    direction: directionText,
    confidence,
    change: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`,
    target: targetPrice ? `$${targetPrice.toFixed(2)}` : 'N/A',
    horizon: `${horizon}h`,
    timestamp: Date.now()
  }
}

/**
 * Create alert at predicted target
 */
export function createPriceAlert(symbol, targetPrice, direction) {
  const alert = {
    id: `price-alert-${symbol}-${Date.now()}`,
    symbol,
    targetPrice,
    direction,
    createdAt: Date.now(),
    triggered: false
  }

  // Dispatch event to create the alert
  window.dispatchEvent(new CustomEvent('ava.createPriceAlert', { detail: alert }))

  // Show confirmation
  window.dispatchEvent(new CustomEvent('iava.toast', {
    detail: {
      text: `🔔 Alert set for ${symbol} at $${targetPrice.toFixed(2)}`,
      type: 'success'
    }
  }))

  return alert
}

/**
 * Create order at predicted target
 */
export function createOrderAtPrediction(symbol, targetPrice, direction, quantity = 1) {
  const order = {
    symbol,
    side: direction === 'bullish' ? 'buy' : 'sell',
    type: 'limit',
    limitPrice: targetPrice,
    quantity,
    source: 'chronos',
    timestamp: Date.now()
  }

  // Dispatch to order panel
  window.dispatchEvent(new CustomEvent('ai-trade-setup', { detail: order }))

  return order
}

/**
 * Record forecast accuracy for historical tracking
 */
export function recordAccuracy(symbol, forecast, actualOutcome) {
  const record = {
    symbol,
    forecast: {
      direction: forecast.direction,
      percentChange: forecast.percentChange,
      confidence: forecast.confidence
    },
    actual: {
      direction: actualOutcome.direction,
      percentChange: actualOutcome.percentChange
    },
    correct: forecast.direction === actualOutcome.direction,
    timestamp: Date.now()
  }

  accuracyHistory.push(record)

  // Keep last 100 records
  if (accuracyHistory.length > 100) {
    accuracyHistory = accuracyHistory.slice(-100)
  }

  try {
    localStorage.setItem(STORAGE_KEYS.ACCURACY_HISTORY, JSON.stringify(accuracyHistory))
  } catch (e) {
    console.error('[ChronosBridge] Accuracy save error:', e)
  }

  return record
}

/**
 * Get historical accuracy stats
 */
export function getAccuracyStats() {
  if (accuracyHistory.length === 0) {
    return { total: 0, correct: 0, accuracy: 0, byConfidence: {} }
  }

  const total = accuracyHistory.length
  const correct = accuracyHistory.filter(r => r.correct).length
  const accuracy = (correct / total) * 100

  // Group by confidence level
  const byConfidence = {}
  const confidenceBuckets = [60, 70, 80, 90]

  confidenceBuckets.forEach(bucket => {
    const inBucket = accuracyHistory.filter(r =>
      r.forecast.confidence >= bucket && r.forecast.confidence < bucket + 10
    )
    if (inBucket.length > 0) {
      const bucketCorrect = inBucket.filter(r => r.correct).length
      byConfidence[`${bucket}-${bucket + 9}%`] = {
        total: inBucket.length,
        correct: bucketCorrect,
        accuracy: (bucketCorrect / inBucket.length) * 100
      }
    }
  })

  return { total, correct, accuracy, byConfidence }
}

/**
 * Voice announcement for forecast
 */
export function announceforecast(symbol, forecast) {
  if (!forecast || forecast.confidence < 70) return

  const { direction, percentChange, confidence, horizon } = forecast

  const message = `AVA predicts ${symbol} will ${
    direction === 'bullish' ? 'rise' : direction === 'bearish' ? 'fall' : 'stay flat'
  } ${Math.abs(percentChange).toFixed(1)} percent in the next ${horizon} hours. Confidence ${confidence} percent.`

  // Use voice synthesis
  window.dispatchEvent(new CustomEvent('ava.speak', { detail: { text: message } }))
}

// Initialize on import
initChronosBridge()

export default {
  cacheForecast,
  getCachedForecast,
  formatPredictionForCopilot,
  createPriceAlert,
  createOrderAtPrediction,
  recordAccuracy,
  getAccuracyStats,
  announceforecast
}
