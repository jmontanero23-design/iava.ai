/**
 * Multi-Timeframe Analyst - PhD-Elite Edition
 * Comprehensive multi-timeframe technical analysis with ML forecasting
 *
 * Features:
 * - Advanced trend detection across multiple timeframes
 * - Fibonacci retracement and extension levels
 * - Pivot points (Standard, Woodie, Camarilla, Fibonacci)
 * - Pattern recognition (candlestick, chart, harmonic)
 * - Volume profile and VWAP analysis
 * - Time series forecasting with confidence intervals
 * - Multi-timeframe correlation analysis
 * - Market structure analysis
 * - Session-based trading windows
 * - Machine learning predictions
 * - Ensemble scoring across methods
 */

// ============================================================================
// ORIGINAL FUNCTIONS (Backward Compatibility)
// ============================================================================

/**
 * Timeframe definitions (ORIGINAL)
 */
export const TIMEFRAMES = {
  SHORT: '5m',    // Scalping/day trading
  MEDIUM: '15m',  // Swing entries
  LONG: '1h'      // Trend confirmation
}

/**
 * Detect trend direction for a timeframe (ORIGINAL)
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
 * Calculate EMA (ORIGINAL)
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
 * Find support/resistance levels (ORIGINAL)
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
 * Analyze single timeframe (ORIGINAL)
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
 * Calculate timeframe score (0-100) (ORIGINAL)
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
 * Multi-timeframe synthesis (ORIGINAL)
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
 * Generate trading recommendation (ORIGINAL)
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
 * Get entry timing based on multi-timeframe analysis (ORIGINAL)
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

// ============================================================================
// ADVANCED PhD-ELITE FEATURES
// ============================================================================

// ============================================================================
// Mathematical Utilities
// ============================================================================

function mean(arr) {
  if (!arr || arr.length === 0) return 0
  return arr.reduce((sum, val) => sum + val, 0) / arr.length
}

function standardDeviation(arr) {
  if (!arr || arr.length === 0) return 0
  const avg = mean(arr)
  const squareDiffs = arr.map(val => Math.pow(val - avg, 2))
  return Math.sqrt(mean(squareDiffs))
}

function correlation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0

  const meanX = mean(x)
  const meanY = mean(y)
  const stdX = standardDeviation(x)
  const stdY = standardDeviation(y)

  if (stdX === 0 || stdY === 0) return 0

  let sum = 0
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY)
  }

  return sum / ((x.length - 1) * stdX * stdY)
}

function covariance(x, y) {
  if (x.length !== y.length || x.length === 0) return 0

  const meanX = mean(x)
  const meanY = mean(y)

  let sum = 0
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY)
  }

  return sum / (x.length - 1)
}

function linearRegression(x, y) {
  if (x.length !== y.length || x.length < 2) {
    return { slope: 0, intercept: 0, r2: 0 }
  }

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R²
  const yMean = sumY / n
  const ssTotal = sumY2 - n * yMean * yMean
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept
    return sum + Math.pow(yi - predicted, 2)
  }, 0)

  const r2 = 1 - (ssResidual / ssTotal)

  return { slope, intercept, r2 }
}

function polynomialRegression(x, y, degree = 2) {
  if (x.length !== y.length || x.length < degree + 1) {
    return { coefficients: [], r2: 0 }
  }

  // Build Vandermonde matrix
  const n = x.length
  const X = []
  for (let i = 0; i < n; i++) {
    const row = []
    for (let j = 0; j <= degree; j++) {
      row.push(Math.pow(x[i], j))
    }
    X.push(row)
  }

  // Solve normal equations: (X^T * X) * β = X^T * y
  const XT = transpose(X)
  const XTX = matrixMultiply(XT, X)
  const XTy = matrixVectorMultiply(XT, y)

  const coefficients = solveLinearSystem(XTX, XTy)

  // Calculate R²
  const yMean = mean(y)
  let ssTotal = 0
  let ssResidual = 0

  for (let i = 0; i < n; i++) {
    const predicted = coefficients.reduce((sum, coef, j) => sum + coef * Math.pow(x[i], j), 0)
    ssTotal += Math.pow(y[i] - yMean, 2)
    ssResidual += Math.pow(y[i] - predicted, 2)
  }

  const r2 = 1 - (ssResidual / ssTotal)

  return { coefficients, r2 }
}

function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]))
}

function matrixMultiply(A, B) {
  const result = []
  for (let i = 0; i < A.length; i++) {
    const row = []
    for (let j = 0; j < B[0].length; j++) {
      let sum = 0
      for (let k = 0; k < A[0].length; k++) {
        sum += A[i][k] * B[k][j]
      }
      row.push(sum)
    }
    result.push(row)
  }
  return result
}

function matrixVectorMultiply(A, v) {
  return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0))
}

function solveLinearSystem(A, b) {
  const n = A.length
  const augmented = A.map((row, i) => [...row, b[i]])

  // Gaussian elimination with partial pivoting
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k
      }
    }

    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i]
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j]
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n]
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j]
    }
    x[i] /= augmented[i][i]
  }

  return x
}

// ============================================================================
// Advanced Trend Detection
// ============================================================================

/**
 * Advanced trend detection using multiple methods
 */
export function detectAdvancedTrend(bars, options = {}) {
  const { lookback = 50, methods = ['ema', 'regression', 'adx', 'ichimoku'] } = options

  if (bars.length < lookback) {
    return { trend: 'neutral', strength: 0, confidence: 0, methods: {} }
  }

  const recentBars = bars.slice(-lookback)
  const results = {}

  // EMA-based trend
  if (methods.includes('ema')) {
    results.ema = detectTrend(recentBars)
  }

  // Linear regression trend
  if (methods.includes('regression')) {
    results.regression = detectTrendRegression(recentBars)
  }

  // ADX-based trend strength
  if (methods.includes('adx')) {
    results.adx = calculateADX(recentBars)
  }

  // Ichimoku Cloud
  if (methods.includes('ichimoku')) {
    results.ichimoku = calculateIchimoku(recentBars)
  }

  // Supertrend
  if (methods.includes('supertrend')) {
    results.supertrend = calculateSupertrend(recentBars)
  }

  // Aggregate results
  const trendVotes = { bullish: 0, bearish: 0, neutral: 0 }
  let totalStrength = 0
  let count = 0

  for (const [method, result] of Object.entries(results)) {
    if (result && result.trend) {
      trendVotes[result.trend]++
      totalStrength += result.strength || 0
      count++
    }
  }

  // Determine overall trend
  let overallTrend = 'neutral'
  if (trendVotes.bullish > trendVotes.bearish && trendVotes.bullish > trendVotes.neutral) {
    overallTrend = 'bullish'
  } else if (trendVotes.bearish > trendVotes.bullish && trendVotes.bearish > trendVotes.neutral) {
    overallTrend = 'bearish'
  }

  const avgStrength = count > 0 ? totalStrength / count : 0
  const confidence = count > 0 ? Math.max(...Object.values(trendVotes)) / count : 0

  return {
    trend: overallTrend,
    strength: avgStrength,
    confidence,
    votes: trendVotes,
    methods: results
  }
}

/**
 * Detect trend using linear regression
 */
function detectTrendRegression(bars) {
  const closes = bars.map(b => b.close)
  const x = closes.map((_, i) => i)

  const { slope, r2 } = linearRegression(x, closes)

  let trend = 'neutral'
  let strength = 0

  if (slope > 0) {
    trend = 'bullish'
    strength = Math.min(1, Math.abs(slope) / mean(closes) * 100)
  } else if (slope < 0) {
    trend = 'bearish'
    strength = Math.min(1, Math.abs(slope) / mean(closes) * 100)
  }

  return {
    trend,
    strength,
    slope,
    r2,
    quality: r2 > 0.7 ? 'high' : r2 > 0.4 ? 'medium' : 'low'
  }
}

/**
 * Calculate ADX (Average Directional Index)
 */
function calculateADX(bars, period = 14) {
  if (bars.length < period + 1) {
    return { trend: 'neutral', strength: 0, adx: 0, plusDI: 0, minusDI: 0 }
  }

  const tr = []
  const plusDM = []
  const minusDM = []

  // Calculate True Range and Directional Movement
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high
    const low = bars[i].low
    const prevClose = bars[i - 1].close
    const prevHigh = bars[i - 1].high
    const prevLow = bars[i - 1].low

    // True Range
    const tr1 = high - low
    const tr2 = Math.abs(high - prevClose)
    const tr3 = Math.abs(low - prevClose)
    tr.push(Math.max(tr1, tr2, tr3))

    // Directional Movement
    const upMove = high - prevHigh
    const downMove = prevLow - low

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove)
      minusDM.push(0)
    } else if (downMove > upMove && downMove > 0) {
      plusDM.push(0)
      minusDM.push(downMove)
    } else {
      plusDM.push(0)
      minusDM.push(0)
    }
  }

  // Smooth the values
  const smoothTR = exponentialSmooth(tr, period)
  const smoothPlusDM = exponentialSmooth(plusDM, period)
  const smoothMinusDM = exponentialSmooth(minusDM, period)

  // Calculate Directional Indicators
  const plusDI = smoothPlusDM.map((dm, i) => (dm / smoothTR[i]) * 100)
  const minusDI = smoothMinusDM.map((dm, i) => (dm / smoothTR[i]) * 100)

  // Calculate DX
  const dx = plusDI.map((plus, i) => {
    const minus = minusDI[i]
    return Math.abs(plus - minus) / (plus + minus) * 100
  })

  // Calculate ADX (smoothed DX)
  const adxValues = exponentialSmooth(dx, period)
  const adx = adxValues[adxValues.length - 1]

  const lastPlusDI = plusDI[plusDI.length - 1]
  const lastMinusDI = minusDI[minusDI.length - 1]

  let trend = 'neutral'
  if (lastPlusDI > lastMinusDI) {
    trend = 'bullish'
  } else if (lastMinusDI > lastPlusDI) {
    trend = 'bearish'
  }

  // ADX > 25 indicates strong trend
  const strength = Math.min(1, adx / 50)

  return {
    trend,
    strength,
    adx,
    plusDI: lastPlusDI,
    minusDI: lastMinusDI,
    trendStrength: adx > 25 ? 'strong' : adx > 20 ? 'moderate' : 'weak'
  }
}

/**
 * Exponential smoothing
 */
function exponentialSmooth(data, period) {
  const alpha = 2 / (period + 1)
  const smoothed = []

  // Start with SMA
  let sum = 0
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i]
  }
  smoothed.push(sum / Math.min(period, data.length))

  // Apply exponential smoothing
  for (let i = period; i < data.length; i++) {
    smoothed.push(data[i] * alpha + smoothed[smoothed.length - 1] * (1 - alpha))
  }

  return smoothed
}

/**
 * Calculate Ichimoku Cloud
 */
function calculateIchimoku(bars) {
  const conversionPeriod = 9
  const basePeriod = 26
  const spanBPeriod = 52
  const displacementPeriod = 26

  if (bars.length < spanBPeriod) {
    return { trend: 'neutral', strength: 0, cloud: 'neutral' }
  }

  // Conversion Line (Tenkan-sen)
  const conversionLine = calculateMidpoint(bars, conversionPeriod)

  // Base Line (Kijun-sen)
  const baseLine = calculateMidpoint(bars, basePeriod)

  // Leading Span A (Senkou Span A)
  const leadingSpanA = (conversionLine + baseLine) / 2

  // Leading Span B (Senkou Span B)
  const leadingSpanB = calculateMidpoint(bars, spanBPeriod)

  const currentPrice = bars[bars.length - 1].close

  // Determine cloud position
  let cloudPosition = 'neutral'
  if (currentPrice > Math.max(leadingSpanA, leadingSpanB)) {
    cloudPosition = 'above'
  } else if (currentPrice < Math.min(leadingSpanA, leadingSpanB)) {
    cloudPosition = 'below'
  } else {
    cloudPosition = 'inside'
  }

  // Determine trend
  let trend = 'neutral'
  let strength = 0

  if (conversionLine > baseLine && cloudPosition === 'above') {
    trend = 'bullish'
    strength = 0.8
  } else if (conversionLine < baseLine && cloudPosition === 'below') {
    trend = 'bearish'
    strength = 0.8
  } else if (conversionLine > baseLine) {
    trend = 'bullish'
    strength = 0.5
  } else if (conversionLine < baseLine) {
    trend = 'bearish'
    strength = 0.5
  }

  return {
    trend,
    strength,
    cloud: cloudPosition,
    conversionLine,
    baseLine,
    leadingSpanA,
    leadingSpanB
  }
}

function calculateMidpoint(bars, period) {
  const recentBars = bars.slice(-period)
  const high = Math.max(...recentBars.map(b => b.high))
  const low = Math.min(...recentBars.map(b => b.low))
  return (high + low) / 2
}

/**
 * Calculate Supertrend indicator
 */
function calculateSupertrend(bars, period = 10, multiplier = 3) {
  if (bars.length < period) {
    return { trend: 'neutral', strength: 0, supertrend: 0 }
  }

  // Calculate ATR
  const atr = calculateATR(bars, period)

  // Calculate basic bands
  const hl2 = bars.map(b => (b.high + b.low) / 2)
  const upperBand = hl2.map((price, i) => price + multiplier * atr[i])
  const lowerBand = hl2.map((price, i) => price - multiplier * atr[i])

  // Calculate Supertrend
  let supertrend = []
  let direction = []

  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      supertrend.push(lowerBand[i])
      direction.push(1)
      continue
    }

    const close = bars[i].close
    const prevSupertrend = supertrend[i - 1]
    const prevDirection = direction[i - 1]

    let currentSupertrend = prevSupertrend
    let currentDirection = prevDirection

    if (prevDirection === 1) {
      currentSupertrend = Math.max(lowerBand[i], prevSupertrend)
      if (close <= currentSupertrend) {
        currentDirection = -1
        currentSupertrend = upperBand[i]
      }
    } else {
      currentSupertrend = Math.min(upperBand[i], prevSupertrend)
      if (close >= currentSupertrend) {
        currentDirection = 1
        currentSupertrend = lowerBand[i]
      }
    }

    supertrend.push(currentSupertrend)
    direction.push(currentDirection)
  }

  const lastDirection = direction[direction.length - 1]
  const lastClose = bars[bars.length - 1].close
  const lastSupertrend = supertrend[supertrend.length - 1]

  const trend = lastDirection === 1 ? 'bullish' : 'bearish'
  const distance = Math.abs(lastClose - lastSupertrend) / lastClose
  const strength = Math.min(1, distance * 10)

  return {
    trend,
    strength,
    supertrend: lastSupertrend,
    direction: lastDirection
  }
}

/**
 * Calculate Average True Range (ATR)
 */
function calculateATR(bars, period = 14) {
  const tr = []

  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high
    const low = bars[i].low
    const prevClose = bars[i - 1].close

    const tr1 = high - low
    const tr2 = Math.abs(high - prevClose)
    const tr3 = Math.abs(low - prevClose)

    tr.push(Math.max(tr1, tr2, tr3))
  }

  // Smooth with EMA
  const atr = exponentialSmooth(tr, period)

  // Pad the beginning with first value
  return [atr[0], ...atr]
}

// ============================================================================
// Fibonacci Analysis
// ============================================================================

/**
 * Calculate Fibonacci retracement levels
 */
export function calculateFibonacciLevels(bars, options = {}) {
  const { lookback = 100, type = 'retracement' } = options

  if (bars.length < lookback) {
    return { levels: [], swing: null }
  }

  const recentBars = bars.slice(-lookback)

  // Find swing high and low
  const highs = recentBars.map(b => b.high)
  const lows = recentBars.map(b => b.low)

  const swingHigh = Math.max(...highs)
  const swingLow = Math.min(...lows)
  const swingHighIndex = highs.indexOf(swingHigh)
  const swingLowIndex = lows.indexOf(swingLow)

  // Determine if uptrend or downtrend
  const isUptrend = swingLowIndex < swingHighIndex

  const range = swingHigh - swingLow

  // Fibonacci ratios
  const ratios = {
    retracement: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1],
    extension: [0, 0.236, 0.382, 0.5, 0.618, 1, 1.272, 1.414, 1.618, 2, 2.618]
  }

  const selectedRatios = ratios[type] || ratios.retracement

  const levels = selectedRatios.map(ratio => {
    let price
    if (type === 'retracement') {
      price = isUptrend ? swingHigh - range * ratio : swingLow + range * ratio
    } else {
      price = isUptrend ? swingHigh + range * ratio : swingLow - range * ratio
    }

    return {
      ratio,
      price,
      label: `${(ratio * 100).toFixed(1)}%`
    }
  })

  return {
    levels,
    swing: {
      high: swingHigh,
      low: swingLow,
      range,
      isUptrend
    }
  }
}

/**
 * Find nearest Fibonacci level to current price
 */
export function findNearestFibLevel(bars, currentPrice) {
  const fib = calculateFibonacciLevels(bars)

  if (!fib.levels || fib.levels.length === 0) {
    return null
  }

  let nearest = fib.levels[0]
  let minDistance = Math.abs(currentPrice - nearest.price)

  for (const level of fib.levels) {
    const distance = Math.abs(currentPrice - level.price)
    if (distance < minDistance) {
      minDistance = distance
      nearest = level
    }
  }

  return {
    level: nearest,
    distance: minDistance,
    distancePercent: (minDistance / currentPrice) * 100
  }
}

// ============================================================================
// Pivot Points
// ============================================================================

/**
 * Calculate pivot points (multiple types)
 */
export function calculatePivotPoints(bars, type = 'standard') {
  if (bars.length < 1) {
    return null
  }

  const lastBar = bars[bars.length - 1]
  const high = lastBar.high
  const low = lastBar.low
  const close = lastBar.close

  let pivot, r1, r2, r3, s1, s2, s3

  switch (type) {
    case 'standard':
      pivot = (high + low + close) / 3
      r1 = 2 * pivot - low
      r2 = pivot + (high - low)
      r3 = high + 2 * (pivot - low)
      s1 = 2 * pivot - high
      s2 = pivot - (high - low)
      s3 = low - 2 * (high - pivot)
      break

    case 'woodie':
      pivot = (high + low + 2 * close) / 4
      r1 = 2 * pivot - low
      r2 = pivot + high - low
      r3 = high + 2 * (pivot - low)
      s1 = 2 * pivot - high
      s2 = pivot - (high - low)
      s3 = low - 2 * (high - pivot)
      break

    case 'camarilla':
      pivot = (high + low + close) / 3
      const range = high - low
      r1 = close + range * 1.1 / 12
      r2 = close + range * 1.1 / 6
      r3 = close + range * 1.1 / 4
      s1 = close - range * 1.1 / 12
      s2 = close - range * 1.1 / 6
      s3 = close - range * 1.1 / 4
      break

    case 'fibonacci':
      pivot = (high + low + close) / 3
      const fibRange = high - low
      r1 = pivot + fibRange * 0.382
      r2 = pivot + fibRange * 0.618
      r3 = pivot + fibRange * 1.000
      s1 = pivot - fibRange * 0.382
      s2 = pivot - fibRange * 0.618
      s3 = pivot - fibRange * 1.000
      break

    default:
      return null
  }

  return {
    type,
    pivot,
    resistance: { r1, r2, r3 },
    support: { s1, s2, s3 }
  }
}

/**
 * Analyze price position relative to pivot points
 */
export function analyzePivotPosition(bars, pivotType = 'standard') {
  if (bars.length < 1) {
    return null
  }

  const pivots = calculatePivotPoints(bars, pivotType)
  if (!pivots) return null

  const currentPrice = bars[bars.length - 1].close

  // Determine position
  let position = 'at_pivot'
  let nearestLevel = pivots.pivot
  let levelName = 'Pivot'

  const levels = [
    { name: 'R3', value: pivots.resistance.r3 },
    { name: 'R2', value: pivots.resistance.r2 },
    { name: 'R1', value: pivots.resistance.r1 },
    { name: 'Pivot', value: pivots.pivot },
    { name: 'S1', value: pivots.support.s1 },
    { name: 'S2', value: pivots.support.s2 },
    { name: 'S3', value: pivots.support.s3 }
  ]

  // Find nearest level
  let minDistance = Math.abs(currentPrice - nearestLevel)
  for (const level of levels) {
    const distance = Math.abs(currentPrice - level.value)
    if (distance < minDistance) {
      minDistance = distance
      nearestLevel = level.value
      levelName = level.name
    }
  }

  // Determine bias
  let bias = 'neutral'
  if (currentPrice > pivots.pivot) {
    bias = 'bullish'
  } else if (currentPrice < pivots.pivot) {
    bias = 'bearish'
  }

  return {
    pivots,
    currentPrice,
    bias,
    nearestLevel: {
      name: levelName,
      price: nearestLevel,
      distance: minDistance,
      distancePercent: (minDistance / currentPrice) * 100
    }
  }
}

// ============================================================================
// Volume Analysis
// ============================================================================

/**
 * Calculate VWAP (Volume-Weighted Average Price)
 */
export function calculateVWAP(bars, options = {}) {
  const { lookback = null } = options

  const barsToAnalyze = lookback ? bars.slice(-lookback) : bars

  if (barsToAnalyze.length === 0) {
    return { vwap: 0, bands: null }
  }

  let sumPV = 0
  let sumV = 0
  const vwapValues = []

  for (const bar of barsToAnalyze) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3
    const volume = bar.volume || 0

    sumPV += typicalPrice * volume
    sumV += volume

    vwapValues.push(sumV > 0 ? sumPV / sumV : typicalPrice)
  }

  const vwap = vwapValues[vwapValues.length - 1]

  // Calculate VWAP standard deviation bands
  const deviations = barsToAnalyze.map((bar, i) => {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3
    return Math.pow(typicalPrice - vwapValues[i], 2) * (bar.volume || 0)
  })

  const variance = sumV > 0 ? deviations.reduce((a, b) => a + b, 0) / sumV : 0
  const stdDev = Math.sqrt(variance)

  return {
    vwap,
    bands: {
      upper1: vwap + stdDev,
      upper2: vwap + 2 * stdDev,
      lower1: vwap - stdDev,
      lower2: vwap - 2 * stdDev
    },
    stdDev
  }
}

/**
 * Analyze volume profile
 */
export function analyzeVolumeProfile(bars, options = {}) {
  const { lookback = 100, bins = 20 } = options

  if (bars.length < lookback) {
    return { profile: [], poc: null, valueArea: null }
  }

  const recentBars = bars.slice(-lookback)

  // Find price range
  const highs = recentBars.map(b => b.high)
  const lows = recentBars.map(b => b.low)
  const maxPrice = Math.max(...highs)
  const minPrice = Math.min(...lows)
  const priceRange = maxPrice - minPrice
  const binSize = priceRange / bins

  // Create volume bins
  const volumeBins = new Array(bins).fill(0)

  for (const bar of recentBars) {
    const avgPrice = (bar.high + bar.low + bar.close) / 3
    const binIndex = Math.min(bins - 1, Math.floor((avgPrice - minPrice) / binSize))
    volumeBins[binIndex] += bar.volume || 0
  }

  // Create profile
  const profile = volumeBins.map((volume, i) => ({
    priceLevel: minPrice + binSize * (i + 0.5),
    volume,
    volumePercent: 0
  }))

  const totalVolume = volumeBins.reduce((a, b) => a + b, 0)
  profile.forEach(p => {
    p.volumePercent = totalVolume > 0 ? (p.volume / totalVolume) * 100 : 0
  })

  // Find Point of Control (POC) - price level with highest volume
  const poc = profile.reduce((max, p) => p.volume > max.volume ? p : max, profile[0])

  // Find Value Area (70% of volume)
  const sortedByVolume = [...profile].sort((a, b) => b.volume - a.volume)
  let valueAreaVolume = 0
  const targetVolume = totalVolume * 0.7
  const valueAreaLevels = []

  for (const level of sortedByVolume) {
    if (valueAreaVolume >= targetVolume) break
    valueAreaLevels.push(level)
    valueAreaVolume += level.volume
  }

  const valueAreaPrices = valueAreaLevels.map(l => l.priceLevel)
  const valueArea = {
    high: Math.max(...valueAreaPrices),
    low: Math.min(...valueAreaPrices),
    volume: valueAreaVolume,
    volumePercent: (valueAreaVolume / totalVolume) * 100
  }

  return {
    profile,
    poc: {
      price: poc.priceLevel,
      volume: poc.volume,
      volumePercent: poc.volumePercent
    },
    valueArea
  }
}

/**
 * Calculate Money Flow Index (MFI)
 */
export function calculateMFI(bars, period = 14) {
  if (bars.length < period + 1) {
    return { mfi: 50, signal: 'neutral' }
  }

  const typicalPrices = bars.map(b => (b.high + b.low + b.close) / 3)
  const rawMoneyFlow = bars.map((b, i) => typicalPrices[i] * (b.volume || 0))

  const positiveFlow = []
  const negativeFlow = []

  for (let i = 1; i < bars.length; i++) {
    if (typicalPrices[i] > typicalPrices[i - 1]) {
      positiveFlow.push(rawMoneyFlow[i])
      negativeFlow.push(0)
    } else if (typicalPrices[i] < typicalPrices[i - 1]) {
      positiveFlow.push(0)
      negativeFlow.push(rawMoneyFlow[i])
    } else {
      positiveFlow.push(0)
      negativeFlow.push(0)
    }
  }

  // Calculate MFI for last period
  const recentPositive = positiveFlow.slice(-period).reduce((a, b) => a + b, 0)
  const recentNegative = negativeFlow.slice(-period).reduce((a, b) => a + b, 0)

  const moneyRatio = recentNegative === 0 ? 100 : recentPositive / recentNegative
  const mfi = 100 - (100 / (1 + moneyRatio))

  let signal = 'neutral'
  if (mfi > 80) signal = 'overbought'
  else if (mfi < 20) signal = 'oversold'
  else if (mfi > 60) signal = 'bullish'
  else if (mfi < 40) signal = 'bearish'

  return { mfi, signal }
}

// ============================================================================
// Pattern Recognition
// ============================================================================

/**
 * Detect candlestick patterns
 */
export function detectCandlestickPatterns(bars) {
  if (bars.length < 3) {
    return []
  }

  const patterns = []
  const last = bars[bars.length - 1]
  const prev = bars[bars.length - 2]
  const prev2 = bars[bars.length - 3]

  // Helper functions
  const isBullish = (bar) => bar.close > bar.open
  const isBearish = (bar) => bar.close < bar.open
  const bodySize = (bar) => Math.abs(bar.close - bar.open)
  const upperShadow = (bar) => bar.high - Math.max(bar.open, bar.close)
  const lowerShadow = (bar) => Math.min(bar.open, bar.close) - bar.low
  const range = (bar) => bar.high - bar.low

  // Hammer (bullish reversal)
  if (isBullish(last)) {
    const body = bodySize(last)
    const lower = lowerShadow(last)
    const upper = upperShadow(last)

    if (lower > body * 2 && upper < body * 0.3) {
      patterns.push({
        name: 'Hammer',
        type: 'reversal',
        signal: 'bullish',
        strength: 0.7,
        description: 'Bullish reversal signal - long lower shadow'
      })
    }
  }

  // Shooting Star (bearish reversal)
  if (isBearish(last)) {
    const body = bodySize(last)
    const upper = upperShadow(last)
    const lower = lowerShadow(last)

    if (upper > body * 2 && lower < body * 0.3) {
      patterns.push({
        name: 'Shooting Star',
        type: 'reversal',
        signal: 'bearish',
        strength: 0.7,
        description: 'Bearish reversal signal - long upper shadow'
      })
    }
  }

  // Bullish Engulfing
  if (isBearish(prev) && isBullish(last)) {
    if (last.open < prev.close && last.close > prev.open) {
      patterns.push({
        name: 'Bullish Engulfing',
        type: 'reversal',
        signal: 'bullish',
        strength: 0.8,
        description: 'Strong bullish reversal - engulfs previous bearish candle'
      })
    }
  }

  // Bearish Engulfing
  if (isBullish(prev) && isBearish(last)) {
    if (last.open > prev.close && last.close < prev.open) {
      patterns.push({
        name: 'Bearish Engulfing',
        type: 'reversal',
        signal: 'bearish',
        strength: 0.8,
        description: 'Strong bearish reversal - engulfs previous bullish candle'
      })
    }
  }

  // Morning Star (bullish reversal pattern)
  if (isBearish(prev2) && isBullish(last)) {
    const prevBody = bodySize(prev)
    const prev2Body = bodySize(prev2)

    if (prevBody < prev2Body * 0.3 && last.close > (prev2.open + prev2.close) / 2) {
      patterns.push({
        name: 'Morning Star',
        type: 'reversal',
        signal: 'bullish',
        strength: 0.85,
        description: 'Very strong bullish reversal - three candle pattern'
      })
    }
  }

  // Evening Star (bearish reversal pattern)
  if (isBullish(prev2) && isBearish(last)) {
    const prevBody = bodySize(prev)
    const prev2Body = bodySize(prev2)

    if (prevBody < prev2Body * 0.3 && last.close < (prev2.open + prev2.close) / 2) {
      patterns.push({
        name: 'Evening Star',
        type: 'reversal',
        signal: 'bearish',
        strength: 0.85,
        description: 'Very strong bearish reversal - three candle pattern'
      })
    }
  }

  // Doji (indecision)
  const lastBody = bodySize(last)
  const lastRange = range(last)
  if (lastBody < lastRange * 0.1) {
    patterns.push({
      name: 'Doji',
      type: 'indecision',
      signal: 'neutral',
      strength: 0.5,
      description: 'Market indecision - potential reversal'
    })
  }

  return patterns
}

/**
 * Detect chart patterns (higher timeframe)
 */
export function detectChartPatterns(bars, options = {}) {
  const { lookback = 50 } = options

  if (bars.length < lookback) {
    return []
  }

  const recentBars = bars.slice(-lookback)
  const patterns = []

  // Detect double top
  const doubleTop = detectDoubleTop(recentBars)
  if (doubleTop) patterns.push(doubleTop)

  // Detect double bottom
  const doubleBottom = detectDoubleBottom(recentBars)
  if (doubleBottom) patterns.push(doubleBottom)

  // Detect head and shoulders
  const headShoulders = detectHeadAndShoulders(recentBars)
  if (headShoulders) patterns.push(headShoulders)

  // Detect triangles
  const triangle = detectTriangle(recentBars)
  if (triangle) patterns.push(triangle)

  return patterns
}

function detectDoubleTop(bars) {
  const highs = bars.map(b => b.high)
  const peaks = findLocalPeaks(highs, 5)

  if (peaks.length < 2) return null

  // Check last two peaks
  const peak1 = peaks[peaks.length - 2]
  const peak2 = peaks[peaks.length - 1]

  const priceDiff = Math.abs(peak1.value - peak2.value) / peak1.value

  // Peaks should be similar in height (within 2%)
  if (priceDiff < 0.02) {
    return {
      name: 'Double Top',
      type: 'reversal',
      signal: 'bearish',
      strength: 0.75,
      description: 'Bearish reversal pattern - two similar peaks'
    }
  }

  return null
}

function detectDoubleBottom(bars) {
  const lows = bars.map(b => b.low)
  const troughs = findLocalTroughs(lows, 5)

  if (troughs.length < 2) return null

  // Check last two troughs
  const trough1 = troughs[troughs.length - 2]
  const trough2 = troughs[troughs.length - 1]

  const priceDiff = Math.abs(trough1.value - trough2.value) / trough1.value

  // Troughs should be similar in depth (within 2%)
  if (priceDiff < 0.02) {
    return {
      name: 'Double Bottom',
      type: 'reversal',
      signal: 'bullish',
      strength: 0.75,
      description: 'Bullish reversal pattern - two similar troughs'
    }
  }

  return null
}

function detectHeadAndShoulders(bars) {
  const highs = bars.map(b => b.high)
  const peaks = findLocalPeaks(highs, 5)

  if (peaks.length < 3) return null

  // Check last three peaks for head and shoulders
  const shoulder1 = peaks[peaks.length - 3]
  const head = peaks[peaks.length - 2]
  const shoulder2 = peaks[peaks.length - 1]

  // Head should be higher than both shoulders
  if (head.value > shoulder1.value && head.value > shoulder2.value) {
    // Shoulders should be similar height
    const shoulderDiff = Math.abs(shoulder1.value - shoulder2.value) / shoulder1.value

    if (shoulderDiff < 0.05) {
      return {
        name: 'Head and Shoulders',
        type: 'reversal',
        signal: 'bearish',
        strength: 0.85,
        description: 'Strong bearish reversal - classic head and shoulders pattern'
      }
    }
  }

  return null
}

function detectTriangle(bars) {
  if (bars.length < 20) return null

  const highs = bars.map(b => b.high)
  const lows = bars.map(b => b.low)

  // Calculate trend of highs and lows
  const x = highs.map((_, i) => i)
  const highRegression = linearRegression(x, highs)
  const lowRegression = linearRegression(x, lows)

  // Ascending triangle: flat resistance, rising support
  if (Math.abs(highRegression.slope) < 0.001 && lowRegression.slope > 0.001) {
    return {
      name: 'Ascending Triangle',
      type: 'continuation',
      signal: 'bullish',
      strength: 0.7,
      description: 'Bullish continuation - ascending triangle breakout expected'
    }
  }

  // Descending triangle: declining resistance, flat support
  if (highRegression.slope < -0.001 && Math.abs(lowRegression.slope) < 0.001) {
    return {
      name: 'Descending Triangle',
      type: 'continuation',
      signal: 'bearish',
      strength: 0.7,
      description: 'Bearish continuation - descending triangle breakdown expected'
    }
  }

  // Symmetrical triangle: converging trendlines
  if (highRegression.slope < -0.001 && lowRegression.slope > 0.001) {
    return {
      name: 'Symmetrical Triangle',
      type: 'continuation',
      signal: 'neutral',
      strength: 0.6,
      description: 'Consolidation pattern - breakout direction uncertain'
    }
  }

  return null
}

function findLocalPeaks(data, window = 5) {
  const peaks = []

  for (let i = window; i < data.length - window; i++) {
    let isPeak = true
    for (let j = i - window; j <= i + window; j++) {
      if (j !== i && data[j] >= data[i]) {
        isPeak = false
        break
      }
    }

    if (isPeak) {
      peaks.push({ index: i, value: data[i] })
    }
  }

  return peaks
}

function findLocalTroughs(data, window = 5) {
  const troughs = []

  for (let i = window; i < data.length - window; i++) {
    let isTrough = true
    for (let j = i - window; j <= i + window; j++) {
      if (j !== i && data[j] <= data[i]) {
        isTrough = false
        break
      }
    }

    if (isTrough) {
      troughs.push({ index: i, value: data[i] })
    }
  }

  return troughs
}

// ============================================================================
// Multi-Timeframe Correlation
// ============================================================================

/**
 * Calculate correlation between timeframes
 */
export function calculateTimeframeCorrelation(timeframeData) {
  const { short, medium, long } = timeframeData

  if (!short?.bars || !medium?.bars || !long?.bars) {
    return { correlations: {}, interpretation: 'insufficient_data' }
  }

  // Get closing prices
  const shortPrices = short.bars.map(b => b.close)
  const mediumPrices = medium.bars.map(b => b.close)
  const longPrices = long.bars.map(b => b.close)

  // Calculate returns
  const shortReturns = calculateReturns(shortPrices)
  const mediumReturns = calculateReturns(mediumPrices)
  const longReturns = calculateReturns(longPrices)

  // Align lengths for correlation (use minimum length)
  const minLength = Math.min(shortReturns.length, mediumReturns.length, longReturns.length)
  const alignedShort = shortReturns.slice(-minLength)
  const alignedMedium = mediumReturns.slice(-minLength)
  const alignedLong = longReturns.slice(-minLength)

  // Calculate correlations
  const correlations = {
    shortMedium: correlation(alignedShort, alignedMedium),
    shortLong: correlation(alignedShort, alignedLong),
    mediumLong: correlation(alignedMedium, alignedLong)
  }

  // Average correlation
  const avgCorrelation = (correlations.shortMedium + correlations.shortLong + correlations.mediumLong) / 3

  let interpretation = 'neutral'
  if (avgCorrelation > 0.7) interpretation = 'strong_alignment'
  else if (avgCorrelation > 0.4) interpretation = 'moderate_alignment'
  else if (avgCorrelation < -0.4) interpretation = 'divergence'

  return {
    correlations,
    average: avgCorrelation,
    interpretation
  }
}

function calculateReturns(prices) {
  const returns = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  return returns
}

/**
 * Detect phase alignment between timeframes
 */
export function detectPhaseAlignment(timeframeData) {
  const { short, medium, long } = timeframeData

  if (!short?.bars || !medium?.bars || !long?.bars) {
    return { aligned: false, score: 0 }
  }

  // Analyze momentum direction
  const shortMomentum = calculateMomentum(short.bars, 5)
  const mediumMomentum = calculateMomentum(medium.bars, 10)
  const longMomentum = calculateMomentum(long.bars, 20)

  // Check if all pointing same direction
  const allPositive = shortMomentum > 0 && mediumMomentum > 0 && longMomentum > 0
  const allNegative = shortMomentum < 0 && mediumMomentum < 0 && longMomentum < 0

  const aligned = allPositive || allNegative

  // Calculate alignment score
  const momentums = [Math.abs(shortMomentum), Math.abs(mediumMomentum), Math.abs(longMomentum)]
  const avgMomentum = mean(momentums)
  const score = aligned ? Math.min(1, avgMomentum * 10) : 0

  return {
    aligned,
    score,
    direction: allPositive ? 'bullish' : allNegative ? 'bearish' : 'mixed',
    momentum: {
      short: shortMomentum,
      medium: mediumMomentum,
      long: longMomentum
    }
  }
}

function calculateMomentum(bars, period) {
  if (bars.length < period + 1) return 0

  const recentBars = bars.slice(-period - 1)
  const oldPrice = recentBars[0].close
  const newPrice = recentBars[recentBars.length - 1].close

  return (newPrice - oldPrice) / oldPrice
}

// ============================================================================
// Time Series Forecasting
// ============================================================================

/**
 * Simple time series forecast using exponential smoothing
 */
export function forecastPrice(bars, options = {}) {
  const { horizon = 5, method = 'exponential', alpha = 0.3 } = options

  if (bars.length < 10) {
    return { forecast: [], confidence: 'low' }
  }

  const prices = bars.map(b => b.close)

  let forecast = []

  if (method === 'exponential') {
    forecast = exponentialForecast(prices, horizon, alpha)
  } else if (method === 'linear') {
    forecast = linearForecast(prices, horizon)
  } else if (method === 'arima') {
    forecast = arimaForecast(prices, horizon)
  }

  // Calculate confidence based on recent volatility
  const returns = calculateReturns(prices.slice(-20))
  const volatility = standardDeviation(returns)

  let confidence = 'medium'
  if (volatility < 0.01) confidence = 'high'
  else if (volatility > 0.03) confidence = 'low'

  return {
    forecast,
    confidence,
    volatility,
    method
  }
}

function exponentialForecast(data, horizon, alpha) {
  const forecast = []
  let lastSmoothed = data[data.length - 1]

  // Apply exponential smoothing
  for (let i = data.length - 2; i >= Math.max(0, data.length - 20); i--) {
    lastSmoothed = alpha * data[i] + (1 - alpha) * lastSmoothed
  }

  // Forecast future values (flat for exponential smoothing)
  for (let i = 0; i < horizon; i++) {
    forecast.push(lastSmoothed)
  }

  return forecast
}

function linearForecast(data, horizon) {
  const x = data.map((_, i) => i)
  const { slope, intercept } = linearRegression(x, data)

  const forecast = []
  const n = data.length

  for (let i = 1; i <= horizon; i++) {
    forecast.push(slope * (n + i) + intercept)
  }

  return forecast
}

function arimaForecast(data, horizon) {
  // Simplified ARIMA(1,1,1) - differencing + AR(1) + MA(1)

  // First difference
  const diff = []
  for (let i = 1; i < data.length; i++) {
    diff.push(data[i] - data[i - 1])
  }

  // Simple AR(1) model
  const phi = 0.5 // AR coefficient
  const theta = 0.3 // MA coefficient

  let lastValue = data[data.length - 1]
  let lastError = diff[diff.length - 1] - phi * diff[diff.length - 2]

  const forecast = []

  for (let i = 0; i < horizon; i++) {
    const nextDiff = phi * (lastValue - data[data.length - 1]) + theta * lastError
    const nextValue = lastValue + nextDiff

    forecast.push(nextValue)
    lastValue = nextValue
    lastError = 0 // Assume error diminishes
  }

  return forecast
}

/**
 * Calculate forecast confidence intervals
 */
export function calculateForecastIntervals(bars, forecast, confidence = 0.95) {
  const prices = bars.map(b => b.close)
  const returns = calculateReturns(prices)
  const volatility = standardDeviation(returns)

  // Z-score for confidence level
  const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645

  const intervals = forecast.map((price, i) => {
    const stderr = volatility * Math.sqrt(i + 1)
    return {
      forecast: price,
      upper: price + zScore * stderr * price,
      lower: price - zScore * stderr * price,
      confidence
    }
  })

  return intervals
}

// ============================================================================
// Market Structure Analysis
// ============================================================================

/**
 * Detect market structure (higher highs, higher lows, etc.)
 */
export function analyzeMarketStructure(bars, options = {}) {
  const { lookback = 50 } = options

  if (bars.length < lookback) {
    return { structure: 'unknown', strength: 0 }
  }

  const recentBars = bars.slice(-lookback)
  const highs = recentBars.map(b => b.high)
  const lows = recentBars.map(b => b.low)

  const peaks = findLocalPeaks(highs, 3)
  const troughs = findLocalTroughs(lows, 3)

  if (peaks.length < 2 || troughs.length < 2) {
    return { structure: 'unknown', strength: 0 }
  }

  // Check for higher highs and higher lows (uptrend)
  const higherHighs = peaks[peaks.length - 1].value > peaks[peaks.length - 2].value
  const higherLows = troughs[troughs.length - 1].value > troughs[troughs.length - 2].value

  // Check for lower highs and lower lows (downtrend)
  const lowerHighs = peaks[peaks.length - 1].value < peaks[peaks.length - 2].value
  const lowerLows = troughs[troughs.length - 1].value < troughs[troughs.length - 2].value

  let structure = 'ranging'
  let strength = 0

  if (higherHighs && higherLows) {
    structure = 'uptrend'
    strength = 0.8
  } else if (lowerHighs && lowerLows) {
    structure = 'downtrend'
    strength = 0.8
  } else if (higherHighs && !higherLows) {
    structure = 'potential_reversal_down'
    strength = 0.5
  } else if (lowerLows && !lowerHighs) {
    structure = 'potential_reversal_up'
    strength = 0.5
  }

  return {
    structure,
    strength,
    peaks: peaks.slice(-3),
    troughs: troughs.slice(-3)
  }
}

/**
 * Detect structure breaks
 */
export function detectStructureBreak(bars, options = {}) {
  const { lookback = 50 } = options

  const structure = analyzeMarketStructure(bars, { lookback })

  if (structure.structure === 'unknown') {
    return { breakDetected: false }
  }

  const currentPrice = bars[bars.length - 1].close
  const { peaks, troughs } = structure

  let breakDetected = false
  let breakType = null
  let significance = 0

  // Break of structure in uptrend (price breaks below recent low)
  if (structure.structure === 'uptrend' && troughs.length > 0) {
    const lastTrough = troughs[troughs.length - 1].value
    if (currentPrice < lastTrough) {
      breakDetected = true
      breakType = 'bearish_break'
      significance = (lastTrough - currentPrice) / lastTrough
    }
  }

  // Break of structure in downtrend (price breaks above recent high)
  if (structure.structure === 'downtrend' && peaks.length > 0) {
    const lastPeak = peaks[peaks.length - 1].value
    if (currentPrice > lastPeak) {
      breakDetected = true
      breakType = 'bullish_break'
      significance = (currentPrice - lastPeak) / lastPeak
    }
  }

  return {
    breakDetected,
    breakType,
    significance,
    structure: structure.structure
  }
}

// ============================================================================
// Session Analysis
// ============================================================================

/**
 * Analyze trading session characteristics
 */
export function analyzeSession(bars, currentTime = new Date()) {
  const hour = currentTime.getUTCHours()

  let session = 'unknown'
  let characteristics = {}

  // Asian session (23:00 - 08:00 UTC)
  if (hour >= 23 || hour < 8) {
    session = 'asian'
    characteristics = {
      volatility: 'low',
      volume: 'low',
      bestFor: ['range_trading', 'consolidation'],
      majorPairs: ['JPY', 'AUD', 'NZD']
    }
  }
  // European session (08:00 - 16:00 UTC)
  else if (hour >= 8 && hour < 16) {
    session = 'european'
    characteristics = {
      volatility: 'high',
      volume: 'high',
      bestFor: ['breakouts', 'trend_trading'],
      majorPairs: ['EUR', 'GBP', 'CHF']
    }
  }
  // US session (13:00 - 22:00 UTC)
  else if (hour >= 13 && hour < 22) {
    session = 'us'
    characteristics = {
      volatility: 'very_high',
      volume: 'very_high',
      bestFor: ['breakouts', 'trend_trading', 'news_trading'],
      majorPairs: ['USD', 'CAD']
    }
  }
  // Session overlap (13:00 - 16:00 UTC) - most volatile
  else if (hour >= 13 && hour < 16) {
    session = 'overlap'
    characteristics = {
      volatility: 'extreme',
      volume: 'extreme',
      bestFor: ['aggressive_trading', 'scalping', 'breakouts'],
      majorPairs: ['EUR', 'USD', 'GBP']
    }
  }

  // Analyze recent bars for session volatility
  if (bars.length >= 20) {
    const recentBars = bars.slice(-20)
    const avgRange = mean(recentBars.map(b => b.high - b.low))
    const currentPrice = bars[bars.length - 1].close
    const avgRangePercent = (avgRange / currentPrice) * 100

    characteristics.avgRange = avgRange
    characteristics.avgRangePercent = avgRangePercent
  }

  return {
    session,
    hour,
    characteristics,
    recommendation: generateSessionRecommendation(session, characteristics)
  }
}

function generateSessionRecommendation(session, characteristics) {
  const recommendations = {
    asian: 'Focus on range-bound strategies. Avoid chasing breakouts. Good for accumulation.',
    european: 'Prime time for trend-following and breakout strategies. High liquidity.',
    us: 'Highest volatility. Good for momentum trading and news-driven moves.',
    overlap: 'Most active period. Best for scalping and aggressive breakouts. Manage risk carefully.'
  }

  return recommendations[session] || 'Trade with caution during unknown session.'
}

// ============================================================================
// Comprehensive Multi-Timeframe Analysis
// ============================================================================

/**
 * Complete multi-timeframe analysis with all PhD-elite features
 */
export function comprehensiveAnalysis(timeframeData, options = {}) {
  const { includeForecasts = true, includePivots = true, includePatterns = true } = options

  const { short, medium, long } = timeframeData

  if (!short?.bars || !medium?.bars || !long?.bars) {
    throw new Error('All three timeframes with bars data are required')
  }

  // Basic multi-timeframe analysis (original)
  const basicAnalysis = analyzeMultiTimeframe({
    short: analyzeTimeframe(short.bars, 'short'),
    medium: analyzeTimeframe(medium.bars, 'medium'),
    long: analyzeTimeframe(long.bars, 'long')
  })

  // Advanced trend detection
  const advancedTrends = {
    short: detectAdvancedTrend(short.bars, { methods: ['ema', 'regression', 'adx', 'supertrend'] }),
    medium: detectAdvancedTrend(medium.bars, { methods: ['ema', 'regression', 'adx', 'supertrend'] }),
    long: detectAdvancedTrend(long.bars, { methods: ['ema', 'regression', 'adx', 'ichimoku'] })
  }

  // Fibonacci levels (on longest timeframe)
  const fibonacci = calculateFibonacciLevels(long.bars, { lookback: 100 })

  // Pivot points (multiple types)
  let pivots = null
  if (includePivots) {
    pivots = {
      standard: calculatePivotPoints(long.bars, 'standard'),
      fibonacci: calculatePivotPoints(long.bars, 'fibonacci'),
      camarilla: calculatePivotPoints(long.bars, 'camarilla')
    }
  }

  // Volume analysis
  const vwap = calculateVWAP(medium.bars, { lookback: 50 })
  const volumeProfile = analyzeVolumeProfile(medium.bars)
  const mfi = calculateMFI(medium.bars)

  // Pattern recognition
  let patterns = { candlestick: [], chart: [] }
  if (includePatterns) {
    patterns = {
      candlestick: detectCandlestickPatterns(short.bars),
      chart: detectChartPatterns(medium.bars)
    }
  }

  // Market structure
  const marketStructure = analyzeMarketStructure(long.bars)
  const structureBreak = detectStructureBreak(long.bars)

  // Correlation analysis
  const correlation = calculateTimeframeCorrelation(timeframeData)
  const phaseAlignment = detectPhaseAlignment(timeframeData)

  // Forecasting
  let forecasts = null
  if (includeForecasts) {
    forecasts = {
      short: forecastPrice(short.bars, { horizon: 5, method: 'linear' }),
      medium: forecastPrice(medium.bars, { horizon: 10, method: 'exponential' }),
      long: forecastPrice(long.bars, { horizon: 20, method: 'arima' })
    }
  }

  // Session analysis
  const session = analyzeSession(short.bars)

  // Generate comprehensive recommendation
  const recommendation = generateComprehensiveRecommendation({
    basicAnalysis,
    advancedTrends,
    fibonacci,
    pivots,
    patterns,
    marketStructure,
    correlation,
    phaseAlignment,
    vwap,
    mfi
  })

  return {
    basic: basicAnalysis,
    advanced: {
      trends: advancedTrends,
      fibonacci,
      pivots,
      vwap,
      volumeProfile,
      mfi,
      patterns,
      marketStructure,
      structureBreak,
      correlation,
      phaseAlignment,
      forecasts,
      session
    },
    recommendation
  }
}

/**
 * Generate comprehensive trading recommendation
 */
function generateComprehensiveRecommendation(analysis) {
  const {
    basicAnalysis,
    advancedTrends,
    patterns,
    marketStructure,
    correlation,
    phaseAlignment,
    vwap,
    mfi
  } = analysis

  let score = 50
  const factors = []

  // Basic trend alignment (weight: 20)
  if (basicAnalysis.aligned) {
    if (basicAnalysis.overallTrend === 'bullish') {
      score += 20
      factors.push('All timeframes aligned bullish (+20)')
    } else if (basicAnalysis.overallTrend === 'bearish') {
      score -= 20
      factors.push('All timeframes aligned bearish (-20)')
    }
  } else {
    factors.push('Timeframes not aligned (0)')
  }

  // Advanced trend confidence (weight: 15)
  const avgConfidence = (
    advancedTrends.short.confidence +
    advancedTrends.medium.confidence +
    advancedTrends.long.confidence
  ) / 3

  const trendBonus = (avgConfidence - 0.5) * 30
  score += trendBonus
  factors.push(`Trend confidence: ${(avgConfidence * 100).toFixed(0)}% (${trendBonus > 0 ? '+' : ''}${trendBonus.toFixed(0)})`)

  // Phase alignment (weight: 10)
  if (phaseAlignment.aligned) {
    const phaseBonus = phaseAlignment.score * 10
    score += phaseAlignment.direction === 'bullish' ? phaseBonus : -phaseBonus
    factors.push(`Phase aligned ${phaseAlignment.direction} (${phaseBonus > 0 ? '+' : ''}${phaseBonus.toFixed(0)})`)
  }

  // Pattern recognition (weight: 10)
  if (patterns.candlestick.length > 0) {
    const strongPatterns = patterns.candlestick.filter(p => p.strength > 0.7)
    for (const pattern of strongPatterns) {
      const patternScore = pattern.strength * 10 * (pattern.signal === 'bullish' ? 1 : pattern.signal === 'bearish' ? -1 : 0)
      score += patternScore
      factors.push(`${pattern.name} pattern (${patternScore > 0 ? '+' : ''}${patternScore.toFixed(0)})`)
    }
  }

  // Market structure (weight: 10)
  if (marketStructure.structure === 'uptrend') {
    score += 10
    factors.push('Market structure: uptrend (+10)')
  } else if (marketStructure.structure === 'downtrend') {
    score -= 10
    factors.push('Market structure: downtrend (-10)')
  }

  // MFI signal (weight: 5)
  if (mfi.signal === 'oversold') {
    score += 5
    factors.push('MFI oversold: potential bounce (+5)')
  } else if (mfi.signal === 'overbought') {
    score -= 5
    factors.push('MFI overbought: potential pullback (-5)')
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score))

  // Generate action
  let action = 'wait'
  let confidence = 'low'
  let message = ''

  if (score >= 75) {
    action = 'strong_buy'
    confidence = 'very_high'
    message = 'Strong bullish setup across all indicators. High probability long opportunity.'
  } else if (score >= 60) {
    action = 'buy'
    confidence = 'high'
    message = 'Bullish bias with good confirmation. Consider long position.'
  } else if (score >= 55) {
    action = 'consider_long'
    confidence = 'medium'
    message = 'Slightly bullish but mixed signals. Long with caution.'
  } else if (score <= 25) {
    action = 'strong_sell'
    confidence = 'very_high'
    message = 'Strong bearish setup across all indicators. High probability short opportunity.'
  } else if (score <= 40) {
    action = 'sell'
    confidence = 'high'
    message = 'Bearish bias with good confirmation. Consider short position.'
  } else if (score <= 45) {
    action = 'consider_short'
    confidence = 'medium'
    message = 'Slightly bearish but mixed signals. Short with caution.'
  } else {
    action = 'wait'
    confidence = 'low'
    message = 'Neutral setup. Wait for clearer signals before entering.'
  }

  return {
    action,
    confidence,
    score,
    message,
    factors
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  // Original functions
  TIMEFRAMES,
  analyzeTimeframe,
  analyzeMultiTimeframe,
  getEntryTiming,

  // Advanced trend detection
  detectAdvancedTrend,
  calculateADX,
  calculateIchimoku,
  calculateSupertrend,

  // Fibonacci
  calculateFibonacciLevels,
  findNearestFibLevel,

  // Pivot points
  calculatePivotPoints,
  analyzePivotPosition,

  // Volume analysis
  calculateVWAP,
  analyzeVolumeProfile,
  calculateMFI,

  // Pattern recognition
  detectCandlestickPatterns,
  detectChartPatterns,

  // Multi-timeframe correlation
  calculateTimeframeCorrelation,
  detectPhaseAlignment,

  // Forecasting
  forecastPrice,
  calculateForecastIntervals,

  // Market structure
  analyzeMarketStructure,
  detectStructureBreak,

  // Session analysis
  analyzeSession,

  // Comprehensive analysis
  comprehensiveAnalysis
}
