/**
 * Multi-Timeframe Analysis System - PhD++ Elite Quality
 *
 * Analyzes ALL timeframes simultaneously to provide comprehensive market picture
 * instead of just looking at one timeframe in isolation.
 *
 * Key Concepts:
 * - Top-Down Analysis: Higher timeframes define trend, lower TFs for entry
 * - Confluence: Best trades when all timeframes align
 * - Divergence Detection: When TFs disagree (warning sign)
 * - Optimal Entry TF: Which timeframe gives best R:R for entry
 */

import { fetchBars } from '../services/yahooFinance.js'

export const TIMEFRAMES = ['1Min', '5Min', '15Min', '1Hour', '1Day']

const TIMEFRAME_WEIGHTS = {
  '1Day': 1.0,    // Highest weight - defines overall trend
  '1Hour': 0.8,   // Strong weight - intermediate trend
  '15Min': 0.6,   // Medium weight - entry timing
  '5Min': 0.4,    // Lower weight - precise entry
  '1Min': 0.2     // Lowest weight - noise filtering
}

/**
 * Fetch bars for all timeframes - PhD++ FIXED: Now uses Yahoo Finance!
 */
export async function fetchAllTimeframes(symbol, limit = 500) {
  const results = {}

  try {
    // PhD++ CRITICAL FIX: Use Yahoo Finance instead of broken Alpaca bars API
    // Alpaca is now ONLY for trading, Yahoo Finance for data!
    const promises = TIMEFRAMES.map(async (tf) => {
      try {
        const bars = await fetchBars(symbol, tf, limit)

        if (!bars || bars.length === 0) {
          console.warn(`[Multi-TF] No data for ${tf} - ${symbol}`)
          return { tf, bars: [] }
        }

        return { tf, bars }
      } catch (e) {
        console.error(`[Multi-TF] Error fetching ${tf}:`, e)
        return { tf, bars: [] }
      }
    })

    const allResults = await Promise.all(promises)

    allResults.forEach(({ tf, bars }) => {
      results[tf] = bars
    })

    return results
  } catch (e) {
    console.error('[Multi-TF] Fatal error:', e)
    return {}
  }
}

/**
 * Analyze all timeframes and compute comprehensive Unicorn Score
 */
export async function analyzeAllTimeframes(symbol) {
  try {
    // Fetch all timeframes
    const allBars = await fetchAllTimeframes(symbol)

    // Import indicators
    const { computeStates } = await import('./indicators.js')

    const analysis = {
      symbol,
      timestamp: Date.now(),
      timeframes: {},
      consensus: null,
      weightedScore: 0,
      recommendation: null,
      bestEntryTimeframe: null,
      warnings: []
    }

    let totalWeight = 0
    let weightedScoreSum = 0
    let bullishCount = 0
    let bearishCount = 0
    let neutralCount = 0

    // Analyze each timeframe
    for (const tf of TIMEFRAMES) {
      const bars = allBars[tf]

      if (!bars || bars.length < 100) {
        analysis.timeframes[tf] = {
          available: false,
          reason: 'Insufficient data'
        }
        continue
      }

      // Compute indicators and score
      const state = computeStates(bars)

      const tfAnalysis = {
        available: true,
        score: state.score || 0,
        rawScore: state.rawScore || 0,
        regime: state.regime || 'neutral',
        pivotNow: state.pivotNow || 'neutral',
        ichiRegime: state.ichiRegime || 'neutral',
        satyDir: state.satyDir || null,
        rsi: state.rsi || 50,
        relativeVolume: state.relativeVolume || 1.0,
        volatilityRegime: state.volatilityRegime || 'normal',
        squeeze: state.sq?.fired ? 'fired' : state.sq?.on ? 'on' : 'off',
        currentPrice: bars[bars.length - 1]?.close,
        atr: state.saty?.atr,
        components: state.components
      }

      analysis.timeframes[tf] = tfAnalysis

      // Calculate weighted score
      const weight = TIMEFRAME_WEIGHTS[tf] || 0.5
      weightedScoreSum += (state.score || 0) * weight
      totalWeight += weight

      // Count regime directions
      if (state.regime === 'bullish' || state.regime === 'mildly bullish') {
        bullishCount++
      } else if (state.regime === 'bearish' || state.regime === 'mildly bearish') {
        bearishCount++
      } else {
        neutralCount++
      }
    }

    // Calculate weighted consensus score
    analysis.weightedScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 0

    // Determine consensus
    const totalTFs = TIMEFRAMES.length
    const bullishPct = (bullishCount / totalTFs) * 100
    const bearishPct = (bearishCount / totalTFs) * 100

    if (bullishPct >= 80) {
      analysis.consensus = 'strong_bullish'
    } else if (bullishPct >= 60) {
      analysis.consensus = 'bullish'
    } else if (bearishPct >= 80) {
      analysis.consensus = 'strong_bearish'
    } else if (bearishPct >= 60) {
      analysis.consensus = 'bearish'
    } else if (bullishPct >= 40 && bearishPct < 40) {
      analysis.consensus = 'mildly_bullish'
    } else if (bearishPct >= 40 && bullishPct < 40) {
      analysis.consensus = 'mildly_bearish'
    } else {
      analysis.consensus = 'mixed'
    }

    // Generate recommendation
    analysis.recommendation = generateRecommendation(analysis)

    // Determine best entry timeframe
    analysis.bestEntryTimeframe = findBestEntryTimeframe(analysis)

    // Check for warnings/divergences
    analysis.warnings = detectWarnings(analysis)

    return analysis
  } catch (e) {
    console.error('[Multi-TF] Analysis error:', e)
    return {
      symbol,
      error: e.message,
      timestamp: Date.now()
    }
  }
}

/**
 * Generate trading recommendation based on multi-TF analysis
 */
function generateRecommendation(analysis) {
  const { consensus, weightedScore, timeframes } = analysis

  // Check if daily is available and bullish/bearish
  const daily = timeframes['1Day']
  const hourly = timeframes['1Hour']
  const fifteenMin = timeframes['15Min']

  const recommendations = []

  // Strong consensus scenarios
  if (consensus === 'strong_bullish' && weightedScore >= 75) {
    recommendations.push({
      type: 'strong_buy',
      confidence: 'very_high',
      message: `STRONG BUY - All timeframes aligned bullish (${weightedScore.toFixed(0)}/100)`,
      rationale: 'Perfect multi-timeframe alignment. Daily, Hourly, and intraday all bullish.',
      riskLevel: 'low'
    })
  } else if (consensus === 'strong_bearish' && weightedScore <= 25) {
    recommendations.push({
      type: 'strong_sell',
      confidence: 'very_high',
      message: `STRONG SELL / SHORT - All timeframes aligned bearish (${weightedScore.toFixed(0)}/100)`,
      rationale: 'Perfect bearish alignment across all timeframes.',
      riskLevel: 'low'
    })
  }

  // Bullish with daily confirmation
  else if (consensus === 'bullish' && daily?.regime === 'bullish' && weightedScore >= 65) {
    recommendations.push({
      type: 'buy',
      confidence: 'high',
      message: `BUY - Bullish trend confirmed on daily (${weightedScore.toFixed(0)}/100)`,
      rationale: 'Daily timeframe bullish provides strong support. Intraday confirms.',
      riskLevel: 'medium'
    })
  }

  // Counter-trend warning
  else if (daily?.regime === 'bullish' && fifteenMin?.regime === 'bearish') {
    recommendations.push({
      type: 'caution',
      confidence: 'low',
      message: 'CAUTION - Intraday bearish vs Daily bullish',
      rationale: 'Possible pullback within uptrend. Wait for alignment or trade small.',
      riskLevel: 'high'
    })
  }

  // Mixed signals - stay out
  else if (consensus === 'mixed') {
    recommendations.push({
      type: 'neutral',
      confidence: 'low',
      message: 'NEUTRAL - Mixed signals across timeframes',
      rationale: 'No clear direction. Wait for alignment before entering.',
      riskLevel: 'very_high'
    })
  }

  // Default: based on weighted score
  else if (weightedScore >= 70) {
    recommendations.push({
      type: 'buy',
      confidence: 'medium',
      message: `BUY - Weighted score ${weightedScore.toFixed(0)}/100`,
      rationale: 'Overall bullish lean, but some timeframes disagree.',
      riskLevel: 'medium'
    })
  } else if (weightedScore <= 30) {
    recommendations.push({
      type: 'sell',
      confidence: 'medium',
      message: `SELL - Weighted score ${weightedScore.toFixed(0)}/100`,
      rationale: 'Overall bearish lean, but some timeframes disagree.',
      riskLevel: 'medium'
    })
  } else {
    recommendations.push({
      type: 'neutral',
      confidence: 'low',
      message: 'NEUTRAL - No clear setup',
      rationale: 'Score in neutral zone. Wait for clearer signal.',
      riskLevel: 'high'
    })
  }

  return recommendations[0] || { type: 'neutral', confidence: 'low', message: 'No recommendation' }
}

/**
 * Find the best timeframe for trade entry
 */
function findBestEntryTimeframe(analysis) {
  const { timeframes, consensus } = analysis

  // For bullish setups, look for lower TF pullback into higher TF trend
  if (consensus.includes('bullish')) {
    // Check if 15Min is bullish but 5Min is neutral/bearish (pullback)
    if (timeframes['15Min']?.regime === 'bullish' &&
        (timeframes['5Min']?.regime === 'neutral' || timeframes['5Min']?.regime === 'bearish')) {
      return {
        timeframe: '5Min',
        reason: 'Pullback on 5Min within 15Min uptrend - ideal entry',
        strategy: 'Wait for 5Min to turn bullish, enter on confirmation'
      }
    }

    // Otherwise, use 15Min for entry
    if (timeframes['15Min']?.available) {
      return {
        timeframe: '15Min',
        reason: 'Standard entry timeframe with good R:R',
        strategy: 'Enter on 15Min bullish signal with daily support'
      }
    }
  }

  // For bearish setups
  else if (consensus.includes('bearish')) {
    if (timeframes['15Min']?.regime === 'bearish' &&
        (timeframes['5Min']?.regime === 'neutral' || timeframes['5Min']?.regime === 'bullish')) {
      return {
        timeframe: '5Min',
        reason: 'Bounce on 5Min within 15Min downtrend - ideal short entry',
        strategy: 'Wait for 5Min to turn bearish, enter short on confirmation'
      }
    }

    if (timeframes['15Min']?.available) {
      return {
        timeframe: '15Min',
        reason: 'Standard entry timeframe for shorts',
        strategy: 'Enter on 15Min bearish signal with daily resistance'
      }
    }
  }

  // Default to 15Min
  return {
    timeframe: '15Min',
    reason: 'Default entry timeframe - balanced view',
    strategy: 'Standard entry approach'
  }
}

/**
 * Detect warnings and divergences
 */
function detectWarnings(analysis) {
  const warnings = []
  const { timeframes } = analysis

  const daily = timeframes['1Day']
  const hourly = timeframes['1Hour']
  const fifteenMin = timeframes['15Min']
  const fiveMin = timeframes['5Min']

  // Daily vs Intraday divergence
  if (daily?.regime === 'bullish' && fifteenMin?.regime === 'bearish') {
    warnings.push({
      severity: 'high',
      type: 'divergence',
      message: 'Daily bullish but 15Min bearish - potential pullback or reversal'
    })
  }

  if (daily?.regime === 'bearish' && fifteenMin?.regime === 'bullish') {
    warnings.push({
      severity: 'high',
      type: 'divergence',
      message: 'Daily bearish but 15Min bullish - likely a bounce, not reversal'
    })
  }

  // Hourly momentum loss
  if (hourly?.regime === 'bullish' && hourly?.rsi < 40) {
    warnings.push({
      severity: 'medium',
      type: 'momentum',
      message: 'Hourly bullish but RSI weak - momentum fading'
    })
  }

  // Squeeze across multiple timeframes (volatility compression)
  const squeezeCount = TIMEFRAMES.reduce((count, tf) => {
    return count + (timeframes[tf]?.squeeze === 'on' ? 1 : 0)
  }, 0)

  if (squeezeCount >= 3) {
    warnings.push({
      severity: 'low',
      type: 'volatility',
      message: `Squeeze active on ${squeezeCount} timeframes - big move coming`
    })
  }

  // Volume divergence
  if (fifteenMin?.relativeVolume < 0.5) {
    warnings.push({
      severity: 'medium',
      type: 'volume',
      message: 'Low volume on 15Min - moves may not sustain'
    })
  }

  return warnings
}

/**
 * Format analysis for display
 */
export function formatMultiTFAnalysis(analysis) {
  if (analysis.error) {
    return {
      summary: `Error: ${analysis.error}`,
      details: []
    }
  }

  const lines = []

  lines.push(`📊 **Multi-Timeframe Analysis: ${analysis.symbol}**`)
  lines.push(``)
  lines.push(`**Consensus:** ${analysis.consensus.toUpperCase().replace(/_/g, ' ')}`)
  lines.push(`**Weighted Score:** ${analysis.weightedScore.toFixed(1)}/100`)
  lines.push(``)

  lines.push(`**Timeframe Breakdown:**`)
  TIMEFRAMES.forEach(tf => {
    const data = analysis.timeframes[tf]
    if (!data?.available) {
      lines.push(`  ${tf}: ❌ Not available`)
      return
    }

    const icon = data.regime.includes('bullish') ? '🟢' :
                 data.regime.includes('bearish') ? '🔴' : '⚪'

    lines.push(`  ${icon} ${tf}: ${data.score.toFixed(0)}/100 (${data.regime}) - RSI: ${data.rsi?.toFixed(0) || 'N/A'}`)
  })

  lines.push(``)
  lines.push(`**📈 Recommendation:** ${analysis.recommendation.message}`)
  lines.push(`**Confidence:** ${analysis.recommendation.confidence.toUpperCase().replace(/_/g, ' ')}`)
  lines.push(`**Risk Level:** ${analysis.recommendation.riskLevel.toUpperCase().replace(/_/g, ' ')}`)

  if (analysis.bestEntryTimeframe) {
    lines.push(``)
    lines.push(`**🎯 Best Entry:** ${analysis.bestEntryTimeframe.timeframe}`)
    lines.push(`**Reason:** ${analysis.bestEntryTimeframe.reason}`)
  }

  if (analysis.warnings.length > 0) {
    lines.push(``)
    lines.push(`**⚠️ Warnings:**`)
    analysis.warnings.forEach(w => {
      lines.push(`  • ${w.message}`)
    })
  }

  return {
    summary: lines.join('\n'),
    analysis
  }
}

export default {
  fetchAllTimeframes,
  analyzeAllTimeframes,
  formatMultiTFAnalysis,
  TIMEFRAMES
}
