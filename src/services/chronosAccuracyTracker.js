/**
 * Chronos Accuracy Tracker - Historical Prediction Tracking
 *
 * PhD++ Quality prediction accuracy tracking:
 * - Stores predictions when made
 * - Validates outcomes after time period
 * - Calculates rolling accuracy metrics
 * - Provides accuracy stats for display
 */

const STORAGE_KEY = 'chronos.predictions.history'
const MAX_HISTORY = 100 // Keep last 100 predictions

// Prediction outcome states
const OUTCOME = {
  PENDING: 'pending',
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
  PARTIAL: 'partial', // Direction correct but missed target
  EXPIRED: 'expired'  // Couldn't verify
}

/**
 * Load prediction history from localStorage
 */
function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (e) {
    console.error('Failed to load Chronos history:', e)
    return []
  }
}

/**
 * Save prediction history to localStorage
 */
function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch (e) {
    console.error('Failed to save Chronos history:', e)
  }
}

/**
 * Record a new prediction
 */
export function recordPrediction({
  symbol,
  direction,
  targetPrice,
  confidence,
  currentPrice,
  timeframeHours = 24
}) {
  const history = loadHistory()

  const prediction = {
    id: `${symbol}-${Date.now()}`,
    symbol,
    direction,
    targetPrice,
    confidence,
    priceAtPrediction: currentPrice,
    timestamp: Date.now(),
    expiresAt: Date.now() + (timeframeHours * 60 * 60 * 1000),
    outcome: OUTCOME.PENDING,
    actualPrice: null,
    verifiedAt: null
  }

  history.unshift(prediction)
  saveHistory(history)

  return prediction
}

/**
 * Verify a prediction's outcome
 */
export function verifyPrediction(predictionId, actualPrice) {
  const history = loadHistory()
  const index = history.findIndex(p => p.id === predictionId)

  if (index === -1) return null

  const prediction = history[index]

  // Calculate outcome
  const priceChange = actualPrice - prediction.priceAtPrediction
  const priceChangePercent = (priceChange / prediction.priceAtPrediction) * 100
  const directionCorrect = (
    (prediction.direction === 'bullish' && priceChange > 0) ||
    (prediction.direction === 'bearish' && priceChange < 0) ||
    (prediction.direction === 'neutral' && Math.abs(priceChangePercent) < 1)
  )

  // Check if target was hit (within 0.5%)
  const targetHit = prediction.targetPrice &&
    Math.abs(actualPrice - prediction.targetPrice) / prediction.targetPrice < 0.005

  // Determine outcome
  let outcome
  if (directionCorrect && targetHit) {
    outcome = OUTCOME.CORRECT
  } else if (directionCorrect) {
    outcome = OUTCOME.PARTIAL
  } else {
    outcome = OUTCOME.INCORRECT
  }

  // Update prediction
  history[index] = {
    ...prediction,
    outcome,
    actualPrice,
    priceChangePercent,
    verifiedAt: Date.now()
  }

  saveHistory(history)
  return history[index]
}

/**
 * Auto-verify expired predictions using current prices
 */
export function autoVerifyExpired(currentPrices = {}) {
  const history = loadHistory()
  let updated = false

  history.forEach((prediction, index) => {
    if (prediction.outcome === OUTCOME.PENDING && Date.now() > prediction.expiresAt) {
      const currentPrice = currentPrices[prediction.symbol]

      if (currentPrice) {
        // Verify with current price
        const priceChange = currentPrice - prediction.priceAtPrediction
        const priceChangePercent = (priceChange / prediction.priceAtPrediction) * 100
        const directionCorrect = (
          (prediction.direction === 'bullish' && priceChange > 0) ||
          (prediction.direction === 'bearish' && priceChange < 0) ||
          (prediction.direction === 'neutral' && Math.abs(priceChangePercent) < 1)
        )

        history[index] = {
          ...prediction,
          outcome: directionCorrect ? OUTCOME.PARTIAL : OUTCOME.INCORRECT,
          actualPrice: currentPrice,
          priceChangePercent,
          verifiedAt: Date.now()
        }
        updated = true
      } else {
        // Mark as expired if no price available
        history[index] = {
          ...prediction,
          outcome: OUTCOME.EXPIRED,
          verifiedAt: Date.now()
        }
        updated = true
      }
    }
  })

  if (updated) {
    saveHistory(history)
  }

  return history
}

/**
 * Calculate accuracy statistics
 */
export function getAccuracyStats(symbol = null) {
  const history = loadHistory()

  // Filter by symbol if provided
  const relevant = symbol
    ? history.filter(p => p.symbol === symbol)
    : history

  // Only count verified predictions
  const verified = relevant.filter(p =>
    p.outcome !== OUTCOME.PENDING && p.outcome !== OUTCOME.EXPIRED
  )

  if (verified.length === 0) {
    return {
      totalPredictions: relevant.length,
      verifiedPredictions: 0,
      correctCount: 0,
      partialCount: 0,
      incorrectCount: 0,
      accuracy: 0,
      directionAccuracy: 0,
      confidenceCorrelation: 0,
      recentAccuracy: 0,
      byConfidence: {
        high: { total: 0, correct: 0, accuracy: 0 },
        medium: { total: 0, correct: 0, accuracy: 0 },
        low: { total: 0, correct: 0, accuracy: 0 }
      }
    }
  }

  const correctCount = verified.filter(p => p.outcome === OUTCOME.CORRECT).length
  const partialCount = verified.filter(p => p.outcome === OUTCOME.PARTIAL).length
  const incorrectCount = verified.filter(p => p.outcome === OUTCOME.INCORRECT).length

  // Direction accuracy (correct + partial)
  const directionCorrect = correctCount + partialCount

  // Recent accuracy (last 20)
  const recent = verified.slice(0, 20)
  const recentCorrect = recent.filter(p =>
    p.outcome === OUTCOME.CORRECT || p.outcome === OUTCOME.PARTIAL
  ).length

  // Accuracy by confidence level
  const byConfidence = {
    high: { total: 0, correct: 0, accuracy: 0 },
    medium: { total: 0, correct: 0, accuracy: 0 },
    low: { total: 0, correct: 0, accuracy: 0 }
  }

  verified.forEach(p => {
    const level = p.confidence >= 80 ? 'high' : p.confidence >= 60 ? 'medium' : 'low'
    byConfidence[level].total++
    if (p.outcome === OUTCOME.CORRECT || p.outcome === OUTCOME.PARTIAL) {
      byConfidence[level].correct++
    }
  })

  Object.keys(byConfidence).forEach(level => {
    const { total, correct } = byConfidence[level]
    byConfidence[level].accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  })

  return {
    totalPredictions: relevant.length,
    verifiedPredictions: verified.length,
    correctCount,
    partialCount,
    incorrectCount,
    accuracy: Math.round((correctCount / verified.length) * 100),
    directionAccuracy: Math.round((directionCorrect / verified.length) * 100),
    recentAccuracy: recent.length > 0 ? Math.round((recentCorrect / recent.length) * 100) : 0,
    byConfidence
  }
}

/**
 * Get prediction history
 */
export function getPredictionHistory(symbol = null, limit = 20) {
  const history = loadHistory()

  const filtered = symbol
    ? history.filter(p => p.symbol === symbol)
    : history

  return filtered.slice(0, limit)
}

/**
 * Clear prediction history
 */
export function clearHistory(symbol = null) {
  if (symbol) {
    const history = loadHistory()
    const filtered = history.filter(p => p.symbol !== symbol)
    saveHistory(filtered)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Export outcome constants
export { OUTCOME }

// Default export with all functions
export default {
  recordPrediction,
  verifyPrediction,
  autoVerifyExpired,
  getAccuracyStats,
  getPredictionHistory,
  clearHistory,
  OUTCOME
}
