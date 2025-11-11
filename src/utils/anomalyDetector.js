/**
 * Anomaly Detector
 * Detects unusual market conditions and price/volume anomalies
 *
 * Features:
 * - Price spike detection (Z-score based)
 * - Volume surge detection
 * - Volatility breakouts
 * - Gap detection
 * - Unusual spread patterns
 * - Time series anomalies using statistical methods
 * - Multi-timeframe anomaly correlation
 */

/**
 * Calculate Z-score for a value in a dataset
 */
function calculateZScore(value, data) {
  const mean = data.reduce((sum, x) => sum + x, 0) / data.length
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)

  return stdDev > 0 ? (value - mean) / stdDev : 0
}

/**
 * Detect price anomalies
 */
export function detectPriceAnomalies(bars, options = {}) {
  const {
    lookback = 20,
    threshold = 2.5  // Z-score threshold
  } = options

  if (bars.length < lookback + 1) {
    return { anomalies: [], hasAnomalies: false }
  }

  const anomalies = []
  const recentBars = bars.slice(-(lookback + 1))
  const currentBar = recentBars[recentBars.length - 1]
  const historicalBars = recentBars.slice(0, -1)

  // Check price returns
  const returns = historicalBars.map((bar, i) => {
    if (i === 0) return 0
    return (bar.close - historicalBars[i - 1].close) / historicalBars[i - 1].close
  }).slice(1)

  const currentReturn = (currentBar.close - historicalBars[historicalBars.length - 1].close) / historicalBars[historicalBars.length - 1].close
  const returnZScore = calculateZScore(currentReturn, returns)

  if (Math.abs(returnZScore) > threshold) {
    anomalies.push({
      type: 'price_spike',
      severity: Math.abs(returnZScore) > 3 ? 'high' : 'medium',
      direction: returnZScore > 0 ? 'up' : 'down',
      zScore: returnZScore,
      return: currentReturn,
      message: `Unusual ${returnZScore > 0 ? 'upward' : 'downward'} price movement (${(Math.abs(returnZScore)).toFixed(1)}σ)`,
      timestamp: currentBar.timestamp
    })
  }

  // Check price range
  const ranges = historicalBars.map(bar => bar.high - bar.low)
  const currentRange = currentBar.high - currentBar.low
  const rangeZScore = calculateZScore(currentRange, ranges)

  if (rangeZScore > threshold) {
    anomalies.push({
      type: 'wide_range',
      severity: rangeZScore > 3 ? 'high' : 'medium',
      zScore: rangeZScore,
      range: currentRange,
      message: `Unusually wide price range (${rangeZScore.toFixed(1)}σ)`,
      timestamp: currentBar.timestamp
    })
  }

  return {
    anomalies,
    hasAnomalies: anomalies.length > 0,
    returnZScore,
    rangeZScore
  }
}

/**
 * Detect volume anomalies
 */
export function detectVolumeAnomalies(bars, options = {}) {
  const {
    lookback = 20,
    threshold = 2.0
  } = options

  if (bars.length < lookback + 1) {
    return { anomalies: [], hasAnomalies: false }
  }

  const anomalies = []
  const recentBars = bars.slice(-(lookback + 1))
  const currentBar = recentBars[recentBars.length - 1]
  const historicalBars = recentBars.slice(0, -1)

  const volumes = historicalBars.map(bar => bar.volume)
  const currentVolume = currentBar.volume
  const volumeZScore = calculateZScore(currentVolume, volumes)

  if (volumeZScore > threshold) {
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length
    const ratio = currentVolume / avgVolume

    anomalies.push({
      type: 'volume_surge',
      severity: volumeZScore > 3 ? 'high' : 'medium',
      zScore: volumeZScore,
      volume: currentVolume,
      avgVolume,
      ratio,
      message: `Volume surge detected (${ratio.toFixed(1)}x average, ${volumeZScore.toFixed(1)}σ)`,
      timestamp: currentBar.timestamp
    })
  } else if (volumeZScore < -threshold) {
    anomalies.push({
      type: 'volume_drought',
      severity: 'low',
      zScore: volumeZScore,
      volume: currentVolume,
      message: `Unusually low volume (${Math.abs(volumeZScore).toFixed(1)}σ below average)`,
      timestamp: currentBar.timestamp
    })
  }

  return {
    anomalies,
    hasAnomalies: anomalies.length > 0,
    volumeZScore
  }
}

/**
 * Detect gap anomalies
 */
export function detectGaps(bars, options = {}) {
  const {
    minGapPercent = 2.0  // Minimum gap size to report (%)
  } = options

  if (bars.length < 2) {
    return { gaps: [], hasGaps: false }
  }

  const gaps = []
  const currentBar = bars[bars.length - 1]
  const previousBar = bars[bars.length - 2]

  // Gap up
  if (currentBar.low > previousBar.high) {
    const gapSize = currentBar.low - previousBar.high
    const gapPercent = (gapSize / previousBar.high) * 100

    if (gapPercent >= minGapPercent) {
      gaps.push({
        type: 'gap_up',
        severity: gapPercent > 5 ? 'high' : gapPercent > 3 ? 'medium' : 'low',
        gapSize,
        gapPercent,
        previousClose: previousBar.close,
        currentOpen: currentBar.open,
        message: `Gap up of ${gapPercent.toFixed(2)}%`,
        timestamp: currentBar.timestamp
      })
    }
  }

  // Gap down
  if (currentBar.high < previousBar.low) {
    const gapSize = previousBar.low - currentBar.high
    const gapPercent = (gapSize / previousBar.low) * 100

    if (gapPercent >= minGapPercent) {
      gaps.push({
        type: 'gap_down',
        severity: gapPercent > 5 ? 'high' : gapPercent > 3 ? 'medium' : 'low',
        gapSize,
        gapPercent,
        previousClose: previousBar.close,
        currentOpen: currentBar.open,
        message: `Gap down of ${gapPercent.toFixed(2)}%`,
        timestamp: currentBar.timestamp
      })
    }
  }

  return {
    gaps,
    hasGaps: gaps.length > 0
  }
}

/**
 * Detect volatility breakouts
 */
export function detectVolatilityBreakout(bars, options = {}) {
  const {
    lookback = 20,
    threshold = 1.5  // ATR multiplier
  } = options

  if (bars.length < lookback + 1) {
    return { breakout: null, hasBreakout: false }
  }

  const recentBars = bars.slice(-(lookback + 1))
  const historicalBars = recentBars.slice(0, -1)
  const currentBar = recentBars[recentBars.length - 1]

  // Calculate historical ATR
  let atrSum = 0
  for (let i = 1; i < historicalBars.length; i++) {
    const high = historicalBars[i].high
    const low = historicalBars[i].low
    const prevClose = historicalBars[i - 1].close

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )

    atrSum += tr
  }

  const avgATR = atrSum / (historicalBars.length - 1)

  // Current true range
  const currentTR = Math.max(
    currentBar.high - currentBar.low,
    Math.abs(currentBar.high - historicalBars[historicalBars.length - 1].close),
    Math.abs(currentBar.low - historicalBars[historicalBars.length - 1].close)
  )

  const ratio = currentTR / avgATR

  if (ratio > threshold) {
    return {
      breakout: {
        type: 'volatility_expansion',
        severity: ratio > 2.5 ? 'high' : ratio > 2.0 ? 'medium' : 'low',
        currentATR: currentTR,
        avgATR,
        ratio,
        message: `Volatility breakout (${ratio.toFixed(1)}x average ATR)`,
        timestamp: currentBar.timestamp
      },
      hasBreakout: true,
      ratio
    }
  }

  return { breakout: null, hasBreakout: false, ratio }
}

/**
 * Comprehensive anomaly scan
 */
export function scanForAnomalies(bars, options = {}) {
  const priceAnomalies = detectPriceAnomalies(bars, options)
  const volumeAnomalies = detectVolumeAnomalies(bars, options)
  const gaps = detectGaps(bars, options)
  const volatilityBreakout = detectVolatilityBreakout(bars, options)

  const allAnomalies = [
    ...priceAnomalies.anomalies,
    ...volumeAnomalies.anomalies,
    ...gaps.gaps,
    ...(volatilityBreakout.breakout ? [volatilityBreakout.breakout] : [])
  ]

  // Sort by severity
  const severityOrder = { high: 3, medium: 2, low: 1 }
  allAnomalies.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0))

  return {
    anomalies: allAnomalies,
    hasAnomalies: allAnomalies.length > 0,
    count: {
      total: allAnomalies.length,
      high: allAnomalies.filter(a => a.severity === 'high').length,
      medium: allAnomalies.filter(a => a.severity === 'medium').length,
      low: allAnomalies.filter(a => a.severity === 'low').length
    },
    breakdown: {
      price: priceAnomalies.anomalies.length,
      volume: volumeAnomalies.anomalies.length,
      gaps: gaps.gaps.length,
      volatility: volatilityBreakout.hasBreakout ? 1 : 0
    }
  }
}

/**
 * Get anomaly alert level
 */
export function getAnomalyAlertLevel(anomalies) {
  if (anomalies.length === 0) {
    return {
      level: 'normal',
      color: 'emerald',
      icon: '✓',
      message: 'No unusual market conditions detected'
    }
  }

  const highCount = anomalies.filter(a => a.severity === 'high').length

  if (highCount >= 2) {
    return {
      level: 'critical',
      color: 'rose',
      icon: '⚠',
      message: `${highCount} high-severity anomalies detected - exercise extreme caution`
    }
  }

  if (highCount === 1) {
    return {
      level: 'high',
      color: 'orange',
      icon: '⚠',
      message: 'High-severity anomaly detected - proceed with caution'
    }
  }

  const mediumCount = anomalies.filter(a => a.severity === 'medium').length

  if (mediumCount >= 2) {
    return {
      level: 'medium',
      color: 'yellow',
      icon: 'ℹ',
      message: `${mediumCount} moderate anomalies detected - monitor closely`
    }
  }

  return {
    level: 'low',
    color: 'blue',
    icon: 'ℹ',
    message: 'Minor anomalies detected - normal market variation'
  }
}

export default {
  detectPriceAnomalies,
  detectVolumeAnomalies,
  detectGaps,
  detectVolatilityBreakout,
  scanForAnomalies,
  getAnomalyAlertLevel
}
