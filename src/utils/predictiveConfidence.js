/**
 * Predictive Signal Confidence
 * ML-inspired probability model for predicting trade success
 *
 * Uses a weighted scoring system based on:
 * - Indicator confluence (how many indicators agree)
 * - Market regime alignment (signal matches current regime)
 * - Historical signal quality (from signal quality scorer)
 * - Risk/reward ratio
 * - Volume confirmation
 * - Time of day / market conditions
 * - Volatility alignment
 */

import { scoreSignal } from './signalQualityScorer.js'
import { detectMarketRegime } from './regimeDetector.js'

/**
 * Calculate indicator confluence score (0-1)
 * Higher score = more indicators confirming the signal
 */
function calculateConfluenceScore(signal) {
  const { indicators = {} } = signal
  let confirming = 0
  let total = 0

  // Check each indicator
  const checks = [
    indicators.saty?.signal,
    indicators.ripster?.signal,
    indicators.ichimoku?.signal,
    indicators.ttmSqueeze?.signal,
    indicators.pivotRibbon?.signal,
    indicators.macd?.signal,
    indicators.rsi?.signal,
    indicators.adx?.signal
  ]

  for (const check of checks) {
    if (check !== undefined) {
      total++
      if (check === signal.direction || check === true) {
        confirming++
      }
    }
  }

  return total > 0 ? confirming / total : 0.5
}

/**
 * Calculate regime alignment score (0-1)
 * Higher score = signal aligns with current market regime
 */
function calculateRegimeScore(signal, regime) {
  if (!regime) return 0.5 // Neutral if no regime data

  const { regime: regimeType } = regime
  const { direction } = signal

  // Perfect alignment
  if (regimeType === 'trending_bull' && direction === 'long') return 1.0
  if (regimeType === 'trending_bear' && direction === 'short') return 1.0

  // Counter-trend (reversal plays)
  if (regimeType === 'trending_bull' && direction === 'short') return 0.3
  if (regimeType === 'trending_bear' && direction === 'long') return 0.3

  // Ranging markets (mean reversion)
  if (regimeType === 'ranging') return 0.6

  // High volatility (proceed with caution)
  if (regimeType === 'high_volatility') return 0.5

  // Low liquidity (avoid)
  if (regimeType === 'low_liquidity') return 0.2

  return 0.5
}

/**
 * Calculate risk/reward score (0-1)
 * Higher score = better risk/reward ratio
 */
function calculateRiskRewardScore(signal) {
  const { entry, target, stop } = signal

  if (!entry || !target || !stop) return 0.5 // No R:R data

  const risk = Math.abs(entry - stop)
  const reward = Math.abs(target - entry)

  if (risk === 0) return 0

  const ratio = reward / risk

  // Ideal R:R is 2:1 or better
  if (ratio >= 3) return 1.0
  if (ratio >= 2) return 0.9
  if (ratio >= 1.5) return 0.7
  if (ratio >= 1) return 0.5
  return 0.3
}

/**
 * Calculate volume confirmation score (0-1)
 * Higher score = volume supports the move
 */
function calculateVolumeScore(signal, bars) {
  if (!bars || bars.length === 0) return 0.5

  const recentBars = bars.slice(-20)
  const avgVolume = recentBars.reduce((sum, b) => sum + b.volume, 0) / recentBars.length
  const currentVolume = bars[bars.length - 1].volume

  const volumeRatio = currentVolume / avgVolume

  // High volume confirmation
  if (volumeRatio >= 2.0) return 1.0
  if (volumeRatio >= 1.5) return 0.9
  if (volumeRatio >= 1.2) return 0.8
  if (volumeRatio >= 1.0) return 0.7
  if (volumeRatio >= 0.8) return 0.5
  return 0.3 // Low volume = weak signal
}

/**
 * Calculate time-of-day score (0-1)
 * Higher score = better trading time
 */
function calculateTimeScore(timestamp) {
  const date = new Date(timestamp)
  const hour = date.getUTCHours() - 5 // Convert to EST
  const minute = date.getUTCMinutes()

  // Market hours: 9:30 AM - 4:00 PM EST
  const marketOpen = 9.5
  const marketClose = 16

  const currentTime = hour + minute / 60

  // Before market open
  if (currentTime < marketOpen) return 0.4

  // Opening hour (9:30-10:30) - high volatility
  if (currentTime >= marketOpen && currentTime < marketOpen + 1) return 0.8

  // Power hour (10:30-11:30 and 2:00-3:00) - best trading
  if ((currentTime >= 10.5 && currentTime < 11.5) ||
      (currentTime >= 14 && currentTime < 15)) return 1.0

  // Lunch hour (11:30-1:30) - lower volume
  if (currentTime >= 11.5 && currentTime < 13.5) return 0.5

  // Closing hour (3:00-4:00) - high volatility
  if (currentTime >= 15 && currentTime < marketClose) return 0.7

  // After hours
  if (currentTime >= marketClose) return 0.3

  return 0.6
}

/**
 * Calculate volatility alignment score (0-1)
 * Higher score = volatility suits the strategy
 */
function calculateVolatilityScore(signal, atr, avgPrice) {
  if (!atr || !avgPrice) return 0.5

  const atrPercent = (atr / avgPrice) * 100

  const { direction, strategy } = signal

  // Breakout strategies prefer higher volatility
  if (strategy === 'breakout' || strategy === 'momentum') {
    if (atrPercent >= 3) return 1.0
    if (atrPercent >= 2) return 0.8
    if (atrPercent >= 1) return 0.6
    return 0.4
  }

  // Mean reversion strategies prefer moderate volatility
  if (strategy === 'mean_reversion' || strategy === 'pullback') {
    if (atrPercent >= 4) return 0.4 // Too volatile
    if (atrPercent >= 2 && atrPercent < 3) return 1.0 // Ideal
    if (atrPercent >= 1 && atrPercent < 2) return 0.8
    return 0.5
  }

  // Default: moderate volatility is good
  if (atrPercent >= 1.5 && atrPercent < 3) return 0.9
  if (atrPercent >= 1 && atrPercent < 4) return 0.7
  return 0.5
}

/**
 * Main prediction function
 * Returns confidence score (0-100) and probability breakdown
 */
export function predictSignalConfidence(signal, marketContext = {}) {
  const { bars, regime, stats } = marketContext

  // Get historical quality score
  const qualityData = scoreSignal(signal)
  const historicalScore = qualityData.qualityScore / 100

  // Calculate component scores
  const confluenceScore = calculateConfluenceScore(signal)
  const regimeScore = calculateRegimeScore(signal, regime)
  const riskRewardScore = calculateRiskRewardScore(signal)
  const volumeScore = calculateVolumeScore(signal, bars)
  const timeScore = calculateTimeScore(signal.timestamp || Date.now())
  const volatilityScore = calculateVolatilityScore(
    signal,
    stats?.atr,
    bars?.[bars.length - 1]?.close
  )

  // Weighted combination (weights sum to 1.0)
  const weights = {
    historical: 0.25,    // Historical quality is important
    confluence: 0.20,    // Indicator agreement
    regime: 0.15,        // Market regime alignment
    riskReward: 0.15,    // R:R ratio
    volume: 0.10,        // Volume confirmation
    time: 0.08,          // Time of day
    volatility: 0.07     // Volatility alignment
  }

  const rawScore = (
    historicalScore * weights.historical +
    confluenceScore * weights.confluence +
    regimeScore * weights.regime +
    riskRewardScore * weights.riskReward +
    volumeScore * weights.volume +
    timeScore * weights.time +
    volatilityScore * weights.volatility
  )

  // Apply sigmoid function for probability calibration
  // This ensures scores cluster around realistic probabilities
  const calibratedScore = 1 / (1 + Math.exp(-8 * (rawScore - 0.5)))

  const confidence = Math.round(calibratedScore * 100)

  return {
    confidence,
    probability: calibratedScore,
    breakdown: {
      historical: Math.round(historicalScore * 100),
      confluence: Math.round(confluenceScore * 100),
      regime: Math.round(regimeScore * 100),
      riskReward: Math.round(riskRewardScore * 100),
      volume: Math.round(volumeScore * 100),
      time: Math.round(timeScore * 100),
      volatility: Math.round(volatilityScore * 100)
    },
    weights,
    recommendation: getRecommendation(confidence, signal)
  }
}

/**
 * Get trading recommendation based on confidence
 */
function getRecommendation(confidence, signal) {
  if (confidence >= 75) {
    return {
      action: 'strong_buy',
      label: 'Strong Signal',
      message: 'High confidence trade opportunity. Consider full position size.',
      color: 'emerald',
      icon: '🚀'
    }
  }

  if (confidence >= 60) {
    return {
      action: 'buy',
      label: 'Good Signal',
      message: 'Solid trade setup. Consider standard position size.',
      color: 'cyan',
      icon: '✓'
    }
  }

  if (confidence >= 50) {
    return {
      action: 'consider',
      label: 'Moderate Signal',
      message: 'Acceptable setup. Consider reduced position size.',
      color: 'blue',
      icon: '○'
    }
  }

  if (confidence >= 40) {
    return {
      action: 'caution',
      label: 'Weak Signal',
      message: 'Below average setup. Use caution or skip.',
      color: 'yellow',
      icon: '⚠'
    }
  }

  return {
    action: 'avoid',
    label: 'Poor Signal',
    message: 'Low confidence. Avoid this trade.',
    color: 'rose',
    icon: '✕'
  }
}

/**
 * Batch predict confidence for multiple signals
 */
export function batchPredictConfidence(signals, marketContext = {}) {
  return signals.map(signal => ({
    ...signal,
    prediction: predictSignalConfidence(signal, marketContext)
  }))
}

/**
 * Filter signals by minimum confidence threshold
 */
export function filterByConfidence(signals, marketContext, minConfidence = 60) {
  return batchPredictConfidence(signals, marketContext)
    .filter(s => s.prediction.confidence >= minConfidence)
    .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
}

export default {
  predictSignalConfidence,
  batchPredictConfidence,
  filterByConfidence
}
