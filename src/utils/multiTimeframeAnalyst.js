/**
 * Multi-Timeframe Analyst
 * Synthesizes signals and trends across multiple timeframes
 *
 * Features:
 * - 3-timeframe analysis (short/medium/long)
 * - Trend alignment scoring
 * - Support/resistance across timeframes
 * - Confluence detection
 * - Time-based trade filtering
 * - Probabilistic signal weighting by timeframe
 */

/**
 * Timeframe definitions
 */
export const TIMEFRAMES = {
  SHORT: '5m',    // Scalping/day trading
  MEDIUM: '15m',  // Swing entries
  LONG: '1h'      // Trend confirmation
}

/**
 * Detect trend direction for a timeframe
 */
function detectTrend(bars, options = {}) {
  const { emaPeriods = [8, 21, 50], minBars = 50 } = options

  if (bars.length < minBars) {
    return { trend: 'neutral', strength: 0, emas: {} }
  }

  // Calculate EMAs
  const emas = {}
  for (const period of emaPeriods) {
    emas[period] = calculateEMA(bars, period)
  }

  // Check EMA alignment
  const lastEma8 = emas[8][emas[8].length - 1]
  const lastEma21 = emas[21][emas[21].length - 1]
  const lastEma50 = emas[50][emas[50].length - 1]

  // Bullish: 8 > 21 > 50
  const bullishAlignment = lastEma8 > lastEma21 && lastEma21 > lastEma50
  // Bearish: 8 < 21 < 50
  const bearishAlignment = lastEma8 < lastEma21 && lastEma21 < lastEma50

  let trend = 'neutral'
  let strength = 0

  if (bullishAlignment) {
    trend = 'bullish'
    // Strength based on EMA separation
    const separation = ((lastEma8 - lastEma50) / lastEma50) * 100
    strength = Math.min(1, separation / 5) // Normalize to 0-1
  } else if (bearishAlignment) {
    trend = 'bearish'
    const separation = ((lastEma50 - lastEma8) / lastEma50) * 100
    strength = Math.min(1, separation / 5)
  }

  return {
    trend,
    strength,
    emas: {
      ema8: lastEma8,
      ema21: lastEma21,
      ema50: lastEma50
    }
  }
}

/**
 * Calculate EMA
 */
function calculateEMA(bars, period) {
  const k = 2 / (period + 1)
  const ema = []

  // Start with SMA
  let sum = 0
  for (let i = 0; i < period && i < bars.length; i++) {
    sum += bars[i].close
  }
  ema.push(sum / Math.min(period, bars.length))

  // Calculate EMA for rest
  for (let i = period; i < bars.length; i++) {
    ema.push(bars[i].close * k + ema[ema.length - 1] * (1 - k))
  }

  return ema
}

/**
 * Find support/resistance levels
 */
function findKeyLevels(bars, options = {}) {
  const { lookback = 50, threshold = 0.005 } = options

  if (bars.length < lookback) {
    return { support: [], resistance: [] }
  }

  const recentBars = bars.slice(-lookback)
  const currentPrice = recentBars[recentBars.length - 1].close

  // Find local highs and lows
  const highs = []
  const lows = []

  for (let i = 2; i < recentBars.length - 2; i++) {
    const bar = recentBars[i]

    // Local high (higher than 2 bars on each side)
    if (
      bar.high > recentBars[i - 1].high &&
      bar.high > recentBars[i - 2].high &&
      bar.high > recentBars[i + 1].high &&
      bar.high > recentBars[i + 2].high
    ) {
      highs.push(bar.high)
    }

    // Local low
    if (
      bar.low < recentBars[i - 1].low &&
      bar.low < recentBars[i - 2].low &&
      bar.low < recentBars[i + 1].low &&
      bar.low < recentBars[i + 2].low
    ) {
      lows.push(bar.low)
    }
  }

  // Cluster nearby levels
  const clusterLevels = (levels) => {
    if (levels.length === 0) return []

    const sorted = [...levels].sort((a, b) => a - b)
    const clustered = []
    let currentCluster = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.abs(sorted[i] - currentCluster[0]) / currentCluster[0]

      if (diff < threshold) {
        currentCluster.push(sorted[i])
      } else {
        // Average the cluster
        const avg = currentCluster.reduce((sum, v) => sum + v, 0) / currentCluster.length
        clustered.push({
          price: avg,
          touches: currentCluster.length,
          strength: currentCluster.length / lookback
        })
        currentCluster = [sorted[i]]
      }
    }

    // Don't forget last cluster
    if (currentCluster.length > 0) {
      const avg = currentCluster.reduce((sum, v) => sum + v, 0) / currentCluster.length
      clustered.push({
        price: avg,
        touches: currentCluster.length,
        strength: currentCluster.length / lookback
      })
    }

    return clustered.sort((a, b) => b.strength - a.strength)
  }

  const resistance = clusterLevels(highs).filter(level => level.price > currentPrice)
  const support = clusterLevels(lows).filter(level => level.price < currentPrice)

  return { support, resistance }
}

/**
 * Analyze single timeframe
 */
export function analyzeTimeframe(bars, timeframe, options = {}) {
  const trendAnalysis = detectTrend(bars, options)
  const levels = findKeyLevels(bars, options)

  const currentPrice = bars[bars.length - 1]?.close || 0
  const nearestSupport = levels.support[0]
  const nearestResistance = levels.resistance[0]

  return {
    timeframe,
    trend: trendAnalysis.trend,
    strength: trendAnalysis.strength,
    emas: trendAnalysis.emas,
    support: levels.support,
    resistance: levels.resistance,
    nearestSupport,
    nearestResistance,
    currentPrice,
    score: calculateTimeframeScore(trendAnalysis, levels, currentPrice)
  }
}

/**
 * Calculate timeframe score (0-100)
 */
function calculateTimeframeScore(trendAnalysis, levels, currentPrice) {
  const { trend, strength } = trendAnalysis

  let score = 50 // Neutral

  // Trend contribution
  if (trend === 'bullish') {
    score += strength * 30
  } else if (trend === 'bearish') {
    score -= strength * 30
  }

  // Support/resistance contribution
  const nearestSupport = levels.support[0]
  const nearestResistance = levels.resistance[0]

  if (nearestSupport && nearestResistance) {
    const range = nearestResistance.price - nearestSupport.price
    const position = (currentPrice - nearestSupport.price) / range

    // Higher score if closer to support, lower if closer to resistance
    score += (0.5 - position) * 20
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Multi-timeframe synthesis
 */
export function analyzeMultiTimeframe(timeframeData) {
  const { short, medium, long } = timeframeData

  if (!short || !medium || !long) {
    throw new Error('All three timeframes (short, medium, long) are required')
  }

  // Check trend alignment
  const allBullish = short.trend === 'bullish' && medium.trend === 'bullish' && long.trend === 'bullish'
  const allBearish = short.trend === 'bearish' && medium.trend === 'bearish' && long.trend === 'bearish'
  const aligned = allBullish || allBearish

  // Calculate confluence score
  const trends = [short.trend, medium.trend, long.trend]
  const bullishCount = trends.filter(t => t === 'bullish').length
  const bearishCount = trends.filter(t => t === 'bearish').length

  let overallTrend = 'neutral'
  let confluence = 0

  if (bullishCount >= 2) {
    overallTrend = 'bullish'
    confluence = bullishCount / 3
  } else if (bearishCount >= 2) {
    overallTrend = 'bearish'
    confluence = bearishCount / 3
  }

  // Weighted score (long-term carries more weight)
  const weights = { short: 0.25, medium: 0.35, long: 0.40 }
  const weightedScore = (
    short.score * weights.short +
    medium.score * weights.medium +
    long.score * weights.long
  )

  // Generate recommendation
  const recommendation = generateRecommendation({
    aligned,
    overallTrend,
    confluence,
    weightedScore,
    short,
    medium,
    long
  })

  return {
    aligned,
    overallTrend,
    confluence,
    weightedScore,
    timeframes: {
      short,
      medium,
      long
    },
    recommendation,
    signals: {
      bullish: bullishCount,
      bearish: bearishCount,
      neutral: 3 - bullishCount - bearishCount
    }
  }
}

/**
 * Generate trading recommendation
 */
function generateRecommendation(analysis) {
  const { aligned, overallTrend, confluence, weightedScore } = analysis

  if (aligned && confluence === 1.0) {
    return {
      action: overallTrend === 'bullish' ? 'strong_buy' : 'strong_sell',
      confidence: 'very_high',
      message: `All timeframes aligned ${overallTrend}. Strong ${overallTrend === 'bullish' ? 'long' : 'short'} opportunity.`,
      score: overallTrend === 'bullish' ? weightedScore : 100 - weightedScore,
      color: overallTrend === 'bullish' ? 'emerald' : 'rose',
      icon: overallTrend === 'bullish' ? '🚀' : '📉'
    }
  }

  if (confluence >= 0.66) {
    return {
      action: overallTrend === 'bullish' ? 'buy' : 'sell',
      confidence: 'high',
      message: `Majority of timeframes ${overallTrend}. Good ${overallTrend === 'bullish' ? 'long' : 'short'} setup.`,
      score: overallTrend === 'bullish' ? weightedScore : 100 - weightedScore,
      color: overallTrend === 'bullish' ? 'cyan' : 'orange',
      icon: overallTrend === 'bullish' ? '✓' : '✓'
    }
  }

  if (weightedScore > 60) {
    return {
      action: 'consider_long',
      confidence: 'medium',
      message: 'Mixed timeframe signals but bias is bullish. Consider long with caution.',
      score: weightedScore,
      color: 'blue',
      icon: '○'
    }
  }

  if (weightedScore < 40) {
    return {
      action: 'consider_short',
      confidence: 'medium',
      message: 'Mixed timeframe signals but bias is bearish. Consider short with caution.',
      score: 100 - weightedScore,
      color: 'yellow',
      icon: '○'
    }
  }

  return {
    action: 'wait',
    confidence: 'low',
    message: 'Conflicting timeframe signals. Wait for better alignment.',
    score: 50,
    color: 'slate',
    icon: '⏸'
  }
}

/**
 * Get entry timing based on multi-timeframe analysis
 */
export function getEntryTiming(analysis) {
  const { short, medium, long } = analysis.timeframes

  if (!analysis.aligned) {
    return {
      timing: 'wait',
      message: 'Wait for timeframe alignment before entering',
      color: 'yellow'
    }
  }

  // Check if short-term is pulling back in direction of overall trend
  if (analysis.overallTrend === 'bullish' && short.trend === 'neutral') {
    return {
      timing: 'ideal',
      message: 'Pullback in uptrend - ideal entry opportunity',
      color: 'emerald'
    }
  }

  if (analysis.overallTrend === 'bearish' && short.trend === 'neutral') {
    return {
      timing: 'ideal',
      message: 'Bounce in downtrend - ideal short entry',
      color: 'emerald'
    }
  }

  if (short.trend === analysis.overallTrend) {
    return {
      timing: 'good',
      message: 'All timeframes moving in same direction',
      color: 'cyan'
    }
  }

  return {
    timing: 'acceptable',
    message: 'Entry acceptable but not optimal',
    color: 'blue'
  }
}

export default {
  TIMEFRAMES,
  analyzeTimeframe,
  analyzeMultiTimeframe,
  getEntryTiming
}
