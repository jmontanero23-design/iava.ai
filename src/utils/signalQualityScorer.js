/**
 * Signal Quality Scorer
 * Tracks historical performance of signals and assigns quality ratings
 *
 * Features:
 * - Win rate tracking per signal type
 * - Performance metrics (avg gain/loss, sharpe ratio)
 * - Quality score (0-100) based on multiple factors
 * - Signal type classification
 * - Time-weighted scoring (recent performance matters more)
 */

const SIGNAL_TYPES = {
  UNICORN: 'unicorn',           // High-confluence multi-indicator
  BREAKOUT: 'breakout',         // Price breakout patterns
  PULLBACK: 'pullback',         // Retracement entries
  REVERSAL: 'reversal',         // Trend reversal signals
  CONTINUATION: 'continuation', // Trend continuation
  MOMENTUM: 'momentum',         // Strong momentum plays
  MEAN_REVERSION: 'mean_reversion' // Oversold/overbought reversals
}

/**
 * Classify signal type based on indicators and context
 */
export function classifySignal(signal) {
  const { indicators = {}, pattern, trend } = signal

  // Unicorn = high confluence (3+ confirming indicators)
  let confirmingCount = 0
  if (indicators.saty?.signal) confirmingCount++
  if (indicators.ripster?.signal) confirmingCount++
  if (indicators.ichimoku?.signal) confirmingCount++
  if (indicators.ttmSqueeze?.signal) confirmingCount++
  if (indicators.pivotRibbon?.signal) confirmingCount++

  if (confirmingCount >= 3) {
    return SIGNAL_TYPES.UNICORN
  }

  // Breakout patterns
  if (pattern === 'breakout' || indicators.breakout) {
    return SIGNAL_TYPES.BREAKOUT
  }

  // Pullback = retracement in existing trend
  if (pattern === 'pullback' || (trend && signal.direction === trend)) {
    return SIGNAL_TYPES.PULLBACK
  }

  // Reversal = counter-trend
  if (pattern === 'reversal' || (trend && signal.direction !== trend)) {
    return SIGNAL_TYPES.REVERSAL
  }

  // Momentum = strong directional move
  if (indicators.adx?.value > 25 || indicators.momentum) {
    return SIGNAL_TYPES.MOMENTUM
  }

  // Mean reversion = oversold/overbought
  if (indicators.rsi?.value < 30 || indicators.rsi?.value > 70 || indicators.meanReversion) {
    return SIGNAL_TYPES.MEAN_REVERSION
  }

  // Default to continuation
  return SIGNAL_TYPES.CONTINUATION
}

/**
 * In-memory performance database
 * In production, this would be stored in a real database
 */
class PerformanceDB {
  constructor() {
    this.signals = new Map() // signalId -> performance data
    this.typeStats = new Map() // signalType -> aggregate stats
    this.load()
  }

  load() {
    // Try to load from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('iava_signal_performance')
        if (saved) {
          const data = JSON.parse(saved)
          this.signals = new Map(data.signals || [])
          this.typeStats = new Map(data.typeStats || [])
        }
      } catch (error) {
        console.error('[Signal Quality] Failed to load performance data:', error)
      }
    }
  }

  save() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('iava_signal_performance', JSON.stringify({
          signals: Array.from(this.signals.entries()),
          typeStats: Array.from(this.typeStats.entries()),
          savedAt: new Date().toISOString()
        }))
      } catch (error) {
        console.error('[Signal Quality] Failed to save performance data:', error)
      }
    }
  }

  /**
   * Record a signal outcome
   */
  recordOutcome(signalId, outcome) {
    const existing = this.signals.get(signalId) || {}
    this.signals.set(signalId, {
      ...existing,
      ...outcome,
      recordedAt: Date.now()
    })
    this.save()
  }

  /**
   * Get signal performance
   */
  getSignalPerformance(signalId) {
    return this.signals.get(signalId) || null
  }

  /**
   * Get all signals by type
   */
  getSignalsByType(type) {
    const signals = []
    for (const [id, data] of this.signals.entries()) {
      if (data.type === type) {
        signals.push({ id, ...data })
      }
    }
    return signals
  }

  /**
   * Calculate aggregate stats for a signal type
   */
  getTypeStats(type) {
    const signals = this.getSignalsByType(type)
    if (signals.length === 0) {
      return {
        type,
        count: 0,
        winRate: 0,
        avgReturn: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        sharpe: 0,
        qualityScore: 50 // Neutral score for new types
      }
    }

    const wins = signals.filter(s => s.return > 0)
    const losses = signals.filter(s => s.return <= 0)

    const winRate = wins.length / signals.length
    const avgReturn = signals.reduce((sum, s) => sum + s.return, 0) / signals.length
    const avgWin = wins.length > 0 ? wins.reduce((sum, s) => sum + s.return, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, s) => sum + s.return, 0) / losses.length) : 0

    const totalGain = wins.reduce((sum, s) => sum + s.return, 0)
    const totalLoss = Math.abs(losses.reduce((sum, s) => sum + s.return, 0))
    const profitFactor = totalLoss > 0 ? totalGain / totalLoss : totalGain > 0 ? 999 : 0

    // Calculate Sharpe ratio (simplified)
    const returns = signals.map(s => s.return)
    const mean = avgReturn
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)
    const sharpe = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0 // Annualized

    // Calculate quality score (0-100)
    const qualityScore = calculateQualityScore({
      winRate,
      avgReturn,
      profitFactor,
      sharpe,
      sampleSize: signals.length
    })

    return {
      type,
      count: signals.length,
      winRate,
      avgReturn,
      avgWin,
      avgLoss,
      profitFactor,
      sharpe,
      qualityScore
    }
  }

  /**
   * Get all type stats
   */
  getAllTypeStats() {
    const stats = {}
    for (const type of Object.values(SIGNAL_TYPES)) {
      stats[type] = this.getTypeStats(type)
    }
    return stats
  }
}

/**
 * Calculate quality score (0-100) based on multiple factors
 */
function calculateQualityScore(metrics) {
  const { winRate, avgReturn, profitFactor, sharpe, sampleSize } = metrics

  // Component scores
  const winRateScore = winRate * 100 // 0-100
  const returnScore = Math.min(100, Math.max(0, 50 + avgReturn * 1000)) // Center at 50
  const profitFactorScore = Math.min(100, (profitFactor / 3) * 100) // PF of 3.0 = 100
  const sharpeScore = Math.min(100, Math.max(0, 50 + sharpe * 20)) // Center at 50

  // Sample size confidence adjustment (less confident with fewer samples)
  const confidenceMultiplier = Math.min(1, sampleSize / 30) // Full confidence at 30+ trades

  // Weighted average
  const rawScore = (
    winRateScore * 0.3 +
    returnScore * 0.25 +
    profitFactorScore * 0.25 +
    sharpeScore * 0.20
  )

  // Apply confidence multiplier
  const finalScore = rawScore * confidenceMultiplier + 50 * (1 - confidenceMultiplier)

  return Math.round(Math.min(100, Math.max(0, finalScore)))
}

/**
 * Get quality rating label from score
 */
export function getQualityRating(score) {
  if (score >= 80) return { label: 'Elite', color: 'emerald', icon: '💎' }
  if (score >= 70) return { label: 'Excellent', color: 'cyan', icon: '⭐' }
  if (score >= 60) return { label: 'Good', color: 'blue', icon: '✓' }
  if (score >= 50) return { label: 'Average', color: 'slate', icon: '○' }
  if (score >= 40) return { label: 'Below Average', color: 'yellow', icon: '⚠' }
  return { label: 'Poor', color: 'rose', icon: '✕' }
}

/**
 * Singleton database instance
 */
const db = new PerformanceDB()

/**
 * Score a signal based on its type and historical performance
 */
export function scoreSignal(signal) {
  const type = classifySignal(signal)
  const typeStats = db.getTypeStats(type)

  return {
    type,
    qualityScore: typeStats.qualityScore,
    rating: getQualityRating(typeStats.qualityScore),
    stats: typeStats,
    confidence: typeStats.count >= 10 ? 'high' : typeStats.count >= 5 ? 'medium' : 'low'
  }
}

/**
 * Record the outcome of a signal
 */
export function recordSignalOutcome(signalId, outcome) {
  const { symbol, type, entryPrice, exitPrice, direction, exitedAt } = outcome

  const return_pct = direction === 'long'
    ? (exitPrice - entryPrice) / entryPrice
    : (entryPrice - exitPrice) / entryPrice

  db.recordOutcome(signalId, {
    symbol,
    type,
    entryPrice,
    exitPrice,
    direction,
    return: return_pct,
    exitedAt,
    outcome: return_pct > 0 ? 'win' : 'loss'
  })

  console.log('[Signal Quality] Recorded outcome:', signalId, {
    type,
    return: (return_pct * 100).toFixed(2) + '%',
    outcome: return_pct > 0 ? 'win' : 'loss'
  })
}

/**
 * Get performance dashboard data
 */
export function getPerformanceDashboard() {
  const allStats = db.getAllTypeStats()

  // Overall stats across all types
  const allSignals = []
  for (const type of Object.values(SIGNAL_TYPES)) {
    allSignals.push(...db.getSignalsByType(type))
  }

  const wins = allSignals.filter(s => s.return > 0)
  const losses = allSignals.filter(s => s.return <= 0)

  const overall = {
    totalSignals: allSignals.length,
    winRate: allSignals.length > 0 ? wins.length / allSignals.length : 0,
    avgReturn: allSignals.length > 0
      ? allSignals.reduce((sum, s) => sum + s.return, 0) / allSignals.length
      : 0,
    totalGain: wins.reduce((sum, s) => sum + s.return, 0),
    totalLoss: Math.abs(losses.reduce((sum, s) => sum + s.return, 0))
  }

  // Best and worst performing types
  const typeList = Object.values(allStats).filter(s => s.count > 0)
  const bestTypes = typeList.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, 3)
  const worstTypes = typeList.sort((a, b) => a.qualityScore - b.qualityScore).slice(0, 3)

  return {
    overall,
    byType: allStats,
    bestTypes,
    worstTypes
  }
}

/**
 * Get real-time signal recommendations based on quality scores
 */
export function filterHighQualitySignals(signals) {
  return signals
    .map(signal => ({
      ...signal,
      quality: scoreSignal(signal)
    }))
    .filter(s => s.quality.qualityScore >= 60) // Only return "Good" or better signals
    .sort((a, b) => b.quality.qualityScore - a.quality.qualityScore)
}

// Export database for advanced usage
export { db as performanceDB }

export default {
  classifySignal,
  scoreSignal,
  recordSignalOutcome,
  getPerformanceDashboard,
  filterHighQualitySignals,
  getQualityRating,
  SIGNAL_TYPES
}
