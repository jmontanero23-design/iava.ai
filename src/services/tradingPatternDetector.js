/**
 * Trading Pattern Detector - AI Habit Analysis
 *
 * PhD++ Quality pattern recognition for trading behavior:
 * - Exit timing analysis (early/late exits)
 * - Day of week performance
 * - Time of day patterns
 * - Symbol preferences
 * - Win/loss streaks
 * - Risk management habits
 * - Emotional trading detection
 */

const STORAGE_KEY = 'ava.trading.patterns'
const TRADES_KEY = 'ava.trading.history'

// Pattern types
export const PATTERN_TYPES = {
  EXIT_EARLY: 'exit_early',
  EXIT_LATE: 'exit_late',
  BEST_DAY: 'best_day',
  WORST_DAY: 'worst_day',
  BEST_HOUR: 'best_hour',
  OVERTRADING: 'overtrading',
  REVENGE_TRADING: 'revenge_trading',
  WINNER_SCALING: 'winner_scaling',
  LOSER_HOLDING: 'loser_holding',
  CONSISTENCY: 'consistency',
  IMPROVING: 'improving',
  DECLINING: 'declining'
}

// Insight severity
export const SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
  POSITIVE: 'positive'
}

/**
 * Load trade history
 */
function loadTrades() {
  try {
    const saved = localStorage.getItem(TRADES_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (e) {
    return []
  }
}

/**
 * Save trade to history
 */
export function recordTrade(trade) {
  const trades = loadTrades()

  const enrichedTrade = {
    ...trade,
    id: trade.id || `trade-${Date.now()}`,
    timestamp: trade.timestamp || Date.now(),
    dayOfWeek: new Date(trade.timestamp || Date.now()).getDay(),
    hourOfDay: new Date(trade.timestamp || Date.now()).getHours(),
    holdingPeriod: trade.exitTimestamp ? trade.exitTimestamp - (trade.timestamp || Date.now()) : null
  }

  trades.unshift(enrichedTrade)

  // Keep last 500 trades
  const trimmed = trades.slice(0, 500)
  localStorage.setItem(TRADES_KEY, JSON.stringify(trimmed))

  return enrichedTrade
}

/**
 * Analyze exit timing patterns
 */
function analyzeExitTiming(trades) {
  const closedTrades = trades.filter(t => t.exitPrice && t.entryPrice)
  if (closedTrades.length < 10) return null

  let earlyExits = 0
  let lateExits = 0
  let optimalExits = 0

  closedTrades.forEach(trade => {
    const pnlPercent = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100
    const isWinner = pnlPercent > 0

    // Check if there was more profit available (simplified heuristic)
    if (trade.maxPrice && isWinner) {
      const maxPotential = ((trade.maxPrice - trade.entryPrice) / trade.entryPrice) * 100
      const capturedPercent = pnlPercent / maxPotential

      if (capturedPercent < 0.5) {
        earlyExits++
      } else if (capturedPercent > 0.8) {
        optimalExits++
      }
    }

    // Check if held too long on losers
    if (trade.minPrice && !isWinner) {
      const maxLoss = ((trade.minPrice - trade.entryPrice) / trade.entryPrice) * 100
      if (pnlPercent < maxLoss * 0.5) {
        lateExits++ // Held through worst and exited late
      }
    }
  })

  const total = closedTrades.length
  const earlyRate = earlyExits / total
  const lateRate = lateExits / total

  if (earlyRate > 0.4) {
    return {
      type: PATTERN_TYPES.EXIT_EARLY,
      severity: SEVERITY.WARNING,
      title: 'Exiting Winners Too Early',
      message: `You exit winning trades early ${Math.round(earlyRate * 100)}% of the time. Consider using trailing stops to capture more profit.`,
      stat: `${earlyExits}/${total} trades`,
      suggestion: 'Try setting your take profit 20% higher and use a trailing stop.'
    }
  }

  if (lateRate > 0.3) {
    return {
      type: PATTERN_TYPES.EXIT_LATE,
      severity: SEVERITY.CRITICAL,
      title: 'Holding Losers Too Long',
      message: `You tend to hold losing trades hoping for recovery. ${Math.round(lateRate * 100)}% of losses could have been smaller.`,
      stat: `${lateExits}/${total} trades`,
      suggestion: 'Set strict stop losses and honor them. Cut losses quickly.'
    }
  }

  return null
}

/**
 * Analyze day of week patterns
 */
function analyzeDayPatterns(trades) {
  const closedTrades = trades.filter(t => t.exitPrice && t.dayOfWeek !== undefined)
  if (closedTrades.length < 20) return null

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayStats = {}

  // Initialize
  for (let i = 0; i < 7; i++) {
    dayStats[i] = { wins: 0, losses: 0, total: 0, pnl: 0 }
  }

  closedTrades.forEach(trade => {
    const day = trade.dayOfWeek
    const pnl = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100

    dayStats[day].total++
    dayStats[day].pnl += pnl
    if (pnl > 0) dayStats[day].wins++
    else dayStats[day].losses++
  })

  // Find best and worst days (min 5 trades)
  let bestDay = null
  let worstDay = null
  let bestWinRate = 0
  let worstWinRate = 100

  Object.entries(dayStats).forEach(([day, stats]) => {
    if (stats.total >= 5) {
      const winRate = (stats.wins / stats.total) * 100
      if (winRate > bestWinRate) {
        bestWinRate = winRate
        bestDay = parseInt(day)
      }
      if (winRate < worstWinRate) {
        worstWinRate = winRate
        worstDay = parseInt(day)
      }
    }
  })

  const insights = []

  if (bestDay !== null && bestWinRate > 60) {
    insights.push({
      type: PATTERN_TYPES.BEST_DAY,
      severity: SEVERITY.POSITIVE,
      title: `${dayNames[bestDay]}s Are Your Best Day`,
      message: `You have a ${Math.round(bestWinRate)}% win rate on ${dayNames[bestDay]}s. Consider focusing more trades on this day.`,
      stat: `${Math.round(bestWinRate)}% win rate`,
      suggestion: `Plan your best setups for ${dayNames[bestDay]}s.`
    })
  }

  if (worstDay !== null && worstWinRate < 40 && worstDay !== bestDay) {
    insights.push({
      type: PATTERN_TYPES.WORST_DAY,
      severity: SEVERITY.WARNING,
      title: `Avoid Trading on ${dayNames[worstDay]}s`,
      message: `Your win rate drops to ${Math.round(worstWinRate)}% on ${dayNames[worstDay]}s. Consider taking this day off.`,
      stat: `${Math.round(worstWinRate)}% win rate`,
      suggestion: `Reduce position sizes or skip ${dayNames[worstDay]}s entirely.`
    })
  }

  return insights
}

/**
 * Analyze time of day patterns
 */
function analyzeTimePatterns(trades) {
  const closedTrades = trades.filter(t => t.exitPrice && t.hourOfDay !== undefined)
  if (closedTrades.length < 20) return null

  const hourStats = {}

  closedTrades.forEach(trade => {
    const hour = trade.hourOfDay
    if (!hourStats[hour]) {
      hourStats[hour] = { wins: 0, losses: 0, total: 0 }
    }

    const pnl = trade.exitPrice - trade.entryPrice
    hourStats[hour].total++
    if (pnl > 0) hourStats[hour].wins++
    else hourStats[hour].losses++
  })

  // Find best hour (min 5 trades)
  let bestHour = null
  let bestWinRate = 0

  Object.entries(hourStats).forEach(([hour, stats]) => {
    if (stats.total >= 5) {
      const winRate = (stats.wins / stats.total) * 100
      if (winRate > bestWinRate) {
        bestWinRate = winRate
        bestHour = parseInt(hour)
      }
    }
  })

  if (bestHour !== null && bestWinRate > 65) {
    const timeStr = bestHour > 12 ? `${bestHour - 12}PM` : `${bestHour}AM`
    return {
      type: PATTERN_TYPES.BEST_HOUR,
      severity: SEVERITY.POSITIVE,
      title: `Peak Performance at ${timeStr}`,
      message: `Your win rate is ${Math.round(bestWinRate)}% for trades entered around ${timeStr}. This is your golden hour.`,
      stat: `${Math.round(bestWinRate)}% win rate`,
      suggestion: `Focus your best setups around ${timeStr}.`
    }
  }

  return null
}

/**
 * Detect overtrading
 */
function detectOvertrading(trades) {
  if (trades.length < 20) return null

  // Group trades by day
  const tradesByDay = {}
  trades.forEach(trade => {
    const day = new Date(trade.timestamp).toDateString()
    if (!tradesByDay[day]) tradesByDay[day] = []
    tradesByDay[day].push(trade)
  })

  // Find days with excessive trading
  const highTradeDays = Object.entries(tradesByDay)
    .filter(([_, dayTrades]) => dayTrades.length > 10)

  if (highTradeDays.length > 3) {
    // Check win rate on high-trade days vs normal days
    let highDayWins = 0, highDayTotal = 0
    let normalDayWins = 0, normalDayTotal = 0

    Object.entries(tradesByDay).forEach(([_, dayTrades]) => {
      const isHighDay = dayTrades.length > 10
      dayTrades.forEach(trade => {
        if (trade.exitPrice) {
          const isWin = trade.exitPrice > trade.entryPrice
          if (isHighDay) {
            highDayTotal++
            if (isWin) highDayWins++
          } else {
            normalDayTotal++
            if (isWin) normalDayWins++
          }
        }
      })
    })

    const highDayRate = highDayTotal > 0 ? (highDayWins / highDayTotal) * 100 : 0
    const normalDayRate = normalDayTotal > 0 ? (normalDayWins / normalDayTotal) * 100 : 0

    if (highDayRate < normalDayRate - 10) {
      return {
        type: PATTERN_TYPES.OVERTRADING,
        severity: SEVERITY.CRITICAL,
        title: 'Overtrading Detected',
        message: `When you make 10+ trades/day, your win rate drops from ${Math.round(normalDayRate)}% to ${Math.round(highDayRate)}%. Quality over quantity!`,
        stat: `${Math.round(normalDayRate - highDayRate)}% lower`,
        suggestion: 'Set a daily trade limit of 5-7 trades maximum.'
      }
    }
  }

  return null
}

/**
 * Detect revenge trading
 */
function detectRevengeTrading(trades) {
  if (trades.length < 20) return null

  let revengeInstances = 0
  let revengeResults = { wins: 0, losses: 0 }

  // Sort by timestamp
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp)

  for (let i = 1; i < sorted.length; i++) {
    const prevTrade = sorted[i - 1]
    const currTrade = sorted[i]

    // Check if previous trade was a loss
    if (prevTrade.exitPrice && prevTrade.exitPrice < prevTrade.entryPrice) {
      // Check if current trade happened within 5 minutes
      const timeDiff = currTrade.timestamp - prevTrade.timestamp
      if (timeDiff < 5 * 60 * 1000) {
        revengeInstances++

        if (currTrade.exitPrice) {
          if (currTrade.exitPrice > currTrade.entryPrice) {
            revengeResults.wins++
          } else {
            revengeResults.losses++
          }
        }
      }
    }
  }

  if (revengeInstances >= 5) {
    const total = revengeResults.wins + revengeResults.losses
    const winRate = total > 0 ? (revengeResults.wins / total) * 100 : 0

    if (winRate < 40) {
      return {
        type: PATTERN_TYPES.REVENGE_TRADING,
        severity: SEVERITY.CRITICAL,
        title: 'Revenge Trading Pattern',
        message: `You often trade within 5 minutes of a loss. These revenge trades have only a ${Math.round(winRate)}% win rate.`,
        stat: `${revengeInstances} instances`,
        suggestion: 'Take a 15-minute break after every losing trade. Walk away from the screen.'
      }
    }
  }

  return null
}

/**
 * Analyze trend (improving or declining)
 */
function analyzeTrend(trades) {
  if (trades.length < 30) return null

  const closedTrades = trades.filter(t => t.exitPrice)
  if (closedTrades.length < 20) return null

  // Compare last 10 trades vs previous 10
  const recent = closedTrades.slice(0, 10)
  const previous = closedTrades.slice(10, 20)

  const recentWinRate = recent.filter(t => t.exitPrice > t.entryPrice).length / recent.length
  const previousWinRate = previous.filter(t => t.exitPrice > t.entryPrice).length / previous.length

  const improvement = (recentWinRate - previousWinRate) * 100

  if (improvement > 15) {
    return {
      type: PATTERN_TYPES.IMPROVING,
      severity: SEVERITY.POSITIVE,
      title: 'Your Trading Is Improving!',
      message: `Your recent win rate is up ${Math.round(improvement)}% compared to your previous trades. Keep doing what you're doing!`,
      stat: `+${Math.round(improvement)}%`,
      suggestion: 'Document what you\'re doing differently so you can replicate it.'
    }
  }

  if (improvement < -15) {
    return {
      type: PATTERN_TYPES.DECLINING,
      severity: SEVERITY.WARNING,
      title: 'Performance Declining',
      message: `Your recent win rate has dropped ${Math.round(Math.abs(improvement))}%. Time to review your recent trades.`,
      stat: `${Math.round(improvement)}%`,
      suggestion: 'Review your last 10 trades. What changed? Consider reducing size until you recover.'
    }
  }

  return null
}

/**
 * Run all pattern analysis
 */
export function analyzePatterns() {
  const trades = loadTrades()

  if (trades.length < 10) {
    return {
      insights: [],
      summary: 'Need more trades to detect patterns. Keep trading!',
      tradesAnalyzed: trades.length
    }
  }

  const insights = []

  // Run all analyzers
  const exitTiming = analyzeExitTiming(trades)
  if (exitTiming) insights.push(exitTiming)

  const dayPatterns = analyzeDayPatterns(trades)
  if (dayPatterns) insights.push(...dayPatterns)

  const timePattern = analyzeTimePatterns(trades)
  if (timePattern) insights.push(timePattern)

  const overtrading = detectOvertrading(trades)
  if (overtrading) insights.push(overtrading)

  const revenge = detectRevengeTrading(trades)
  if (revenge) insights.push(revenge)

  const trend = analyzeTrend(trades)
  if (trend) insights.push(trend)

  // Sort by severity
  const severityOrder = {
    [SEVERITY.CRITICAL]: 0,
    [SEVERITY.WARNING]: 1,
    [SEVERITY.INFO]: 2,
    [SEVERITY.POSITIVE]: 3
  }

  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return {
    insights,
    summary: generateSummary(insights, trades),
    tradesAnalyzed: trades.length
  }
}

/**
 * Generate summary message
 */
function generateSummary(insights, trades) {
  const critical = insights.filter(i => i.severity === SEVERITY.CRITICAL).length
  const warnings = insights.filter(i => i.severity === SEVERITY.WARNING).length
  const positives = insights.filter(i => i.severity === SEVERITY.POSITIVE).length

  if (critical > 0) {
    return `⚠️ ${critical} critical pattern${critical > 1 ? 's' : ''} detected that need attention.`
  }

  if (warnings > 0 && positives > 0) {
    return `Mixed signals: ${positives} strength${positives > 1 ? 's' : ''}, ${warnings} area${warnings > 1 ? 's' : ''} to improve.`
  }

  if (positives > 0) {
    return `🌟 Great job! ${positives} positive pattern${positives > 1 ? 's' : ''} detected.`
  }

  return `Analyzed ${trades.length} trades. Keep trading to reveal more patterns.`
}

/**
 * Get trade history
 */
export function getTradeHistory(limit = 50) {
  return loadTrades().slice(0, limit)
}

/**
 * Clear trade history
 */
export function clearTradeHistory() {
  localStorage.removeItem(TRADES_KEY)
}

export default {
  recordTrade,
  analyzePatterns,
  getTradeHistory,
  clearTradeHistory,
  PATTERN_TYPES,
  SEVERITY
}
