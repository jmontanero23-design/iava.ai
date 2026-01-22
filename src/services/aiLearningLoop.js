/**
 * AI Learning Loop
 * Feeds trade outcomes back into AI to improve predictions over time
 * Uses AVA Mind trade history to personalize recommendations
 */

import avaMindService from './avaMindService.js'

/**
 * Generate personalized AI context from user's trade history
 * This is fed into AI prompts to improve predictions
 */
export function generateLearningContext(symbol = null) {
  try {
    const learning = avaMindService.getLearning()
    const patterns = avaMindService.getPatterns()
    const recentTrades = avaMindService.getRecentTrades(20)

    // Filter for symbol-specific data if provided
    const symbolTrades = symbol
      ? recentTrades.filter(t => t.symbol === symbol)
      : []

    // Build context object
    const context = {
      // Overall performance
      overallStats: {
        totalTrades: learning?.totalTrades || 0,
        winRate: learning?.winRate || 0,
        profitFactor: learning?.profitFactor || 0,
        currentStreak: learning?.currentStreak || 0
      },

      // Symbol-specific performance
      symbolStats: symbol && symbolTrades.length > 0 ? {
        trades: symbolTrades.length,
        wins: symbolTrades.filter(t => t.outcome === 'WIN').length,
        winRate: symbolTrades.length > 0
          ? (symbolTrades.filter(t => t.outcome === 'WIN').length / symbolTrades.length) * 100
          : 0,
        avgHold: symbolTrades.reduce((sum, t) => sum + (t.holdDuration || 0), 0) / symbolTrades.length,
        bestSetup: findBestSetup(symbolTrades)
      } : null,

      // Best dimensions
      bestDimensions: {
        symbol: learning?.bestSymbol,
        dayOfWeek: learning?.bestDay,
        hourOfDay: learning?.bestHour
      },

      // Detected patterns
      topPatterns: patterns?.slice(0, 5).map(p => ({
        type: p.dimension,
        winRate: p.winRate,
        strength: p.strength
      })) || [],

      // Recent outcomes (for quick learning)
      recentOutcomes: recentTrades.slice(0, 5).map(t => ({
        symbol: t.symbol,
        outcome: t.outcome,
        setup: t.setupType,
        pnl: t.pnlPercent
      })),

      // Trading personality
      archetype: learning?.archetype || 'Unknown',
      emotionalState: learning?.emotionalState || 'Neutral'
    }

    return context
  } catch (error) {
    console.error('[Learning Loop] Error generating context:', error)
    return null
  }
}

/**
 * Build enhanced AI prompt with learning context
 */
export function buildLearningPrompt(basePrompt, symbol, action) {
  const context = generateLearningContext(symbol)

  if (!context || context.overallStats.totalTrades < 5) {
    // Not enough data yet, return base prompt
    return basePrompt
  }

  // Build personalized context string
  let personalizedContext = `\n\n## PERSONALIZED TRADING CONTEXT\n`

  // Overall performance
  if (context.overallStats.totalTrades > 0) {
    personalizedContext += `**Overall Performance:** ${context.overallStats.totalTrades} trades, ${context.overallStats.winRate.toFixed(1)}% win rate`

    if (context.overallStats.currentStreak !== 0) {
      const streakType = context.overallStats.currentStreak > 0 ? 'winning' : 'losing'
      personalizedContext += `, currently on ${Math.abs(context.overallStats.currentStreak)}-trade ${streakType} streak`
    }
    personalizedContext += `.\n`
  }

  // Symbol-specific insights
  if (context.symbolStats && context.symbolStats.trades >= 3) {
    personalizedContext += `**${symbol} History:** ${context.symbolStats.trades} trades, ${context.symbolStats.winRate.toFixed(1)}% win rate`

    if (context.symbolStats.bestSetup) {
      personalizedContext += `, best setup: ${context.symbolStats.bestSetup.setup} (${context.symbolStats.bestSetup.winRate.toFixed(0)}% wins)`
    }
    personalizedContext += `.\n`
  }

  // Best dimensions
  if (context.bestDimensions.dayOfWeek) {
    personalizedContext += `**Optimal Trading Times:** Best day: ${context.bestDimensions.dayOfWeek}, best hour: ${context.bestDimensions.hourOfDay}:00.\n`
  }

  // Patterns
  if (context.topPatterns.length > 0) {
    const topPattern = context.topPatterns[0]
    personalizedContext += `**Detected Pattern:** You perform best when trading ${topPattern.type} (${topPattern.winRate.toFixed(0)}% win rate).\n`
  }

  // Recent outcomes (teach AI what's working/not working)
  if (context.recentOutcomes.length >= 3) {
    const recentWins = context.recentOutcomes.filter(o => o.outcome === 'WIN')
    const recentLosses = context.recentOutcomes.filter(o => o.outcome === 'LOSS')

    if (recentWins.length > 0) {
      const winningSetups = [...new Set(recentWins.map(w => w.setup))].join(', ')
      personalizedContext += `**Recent Wins:** ${winningSetups} setups working well recently.\n`
    }

    if (recentLosses.length > 0) {
      const losingSetups = [...new Set(recentLosses.map(l => l.setup))].join(', ')
      personalizedContext += `**Recent Losses:** ${losingSetups} setups not working recently - recommend caution.\n`
    }
  }

  // Trading personality
  personalizedContext += `**Trading Style:** ${context.archetype} trader, currently ${context.emotionalState}.\n`

  // Actionable recommendation
  personalizedContext += `\n**IMPORTANT:** Use this historical data to inform your analysis. Recommend setups that have worked for this specific trader. Warn against patterns that historically lose.`

  return basePrompt + personalizedContext
}

/**
 * Get AI-enhanced trade suggestion with learning
 */
export async function getPersonalizedSuggestion(symbol, marketData, indicators) {
  try {
    const context = generateLearningContext(symbol)

    // Build suggestion based on what works for this user
    const suggestion = {
      symbol,
      confidence: 0,
      reasoning: '',
      action: 'HOLD',
      setup: null,
      warnings: [],
      encouragements: []
    }

    // Not enough data yet
    if (!context || context.overallStats.totalTrades < 5) {
      suggestion.reasoning = 'Building your trading profile... Need at least 5 trades to personalize recommendations.'
      return suggestion
    }

    // Check symbol-specific performance
    if (context.symbolStats && context.symbolStats.trades >= 3) {
      if (context.symbolStats.winRate < 40) {
        suggestion.warnings.push(`Your win rate on ${symbol} is only ${context.symbolStats.winRate.toFixed(0)}%. Consider reducing position size.`)
        suggestion.confidence -= 20
      } else if (context.symbolStats.winRate > 70) {
        suggestion.encouragements.push(`Strong track record on ${symbol} (${context.symbolStats.winRate.toFixed(0)}% wins)!`)
        suggestion.confidence += 15
      }
    }

    // Check current streak
    if (context.overallStats.currentStreak <= -3) {
      suggestion.warnings.push(`You're on a ${Math.abs(context.overallStats.currentStreak)}-trade losing streak. Consider taking a break.`)
      suggestion.action = 'PAUSE'
      suggestion.confidence = 90
      suggestion.reasoning = 'Revenge trading often makes streaks worse. Reset before continuing.'
      return suggestion
    } else if (context.overallStats.currentStreak >= 5) {
      suggestion.warnings.push(`You're on a ${context.overallStats.currentStreak}-trade winning streak. Don't get overconfident.`)
    }

    // Check if current setup matches winning patterns
    if (context.symbolStats && context.symbolStats.bestSetup) {
      const currentSetup = indicators?.setup || 'unknown'
      if (currentSetup === context.symbolStats.bestSetup.setup) {
        suggestion.encouragements.push(`This ${currentSetup} setup has a ${context.symbolStats.bestSetup.winRate.toFixed(0)}% win rate for you on ${symbol}!`)
        suggestion.confidence += 25
      }
    }

    // Check time-of-day patterns
    const now = new Date()
    const currentHour = now.getHours()
    if (context.bestDimensions.hourOfDay && Math.abs(currentHour - context.bestDimensions.hourOfDay) <= 1) {
      suggestion.encouragements.push(`You're most profitable trading around ${context.bestDimensions.hourOfDay}:00!`)
      suggestion.confidence += 10
    }

    // Determine action based on confidence and warnings
    if (suggestion.confidence >= 70 && suggestion.warnings.length === 0) {
      suggestion.action = 'EXECUTE'
      suggestion.reasoning = 'Setup aligns with your historical success patterns.'
    } else if (suggestion.confidence >= 40) {
      suggestion.action = 'CAUTION'
      suggestion.reasoning = 'Moderate confidence. Size down if unsure.'
    } else {
      suggestion.action = 'AVOID'
      suggestion.reasoning = 'Doesn't match your winning patterns. Consider waiting.'
    }

    return suggestion
  } catch (error) {
    console.error('[Learning Loop] Error generating suggestion:', error)
    return null
  }
}

/**
 * Find best performing setup for a symbol
 */
function findBestSetup(trades) {
  const setups = {}

  trades.forEach(t => {
    const setup = t.setupType || 'unknown'
    if (!setups[setup]) {
      setups[setup] = { wins: 0, total: 0 }
    }
    setups[setup].total++
    if (t.outcome === 'WIN') {
      setups[setup].wins++
    }
  })

  let best = null
  let bestWinRate = 0

  Object.keys(setups).forEach(setup => {
    const data = setups[setup]
    if (data.total >= 2) { // Need at least 2 trades
      const winRate = (data.wins / data.total) * 100
      if (winRate > bestWinRate) {
        bestWinRate = winRate
        best = { setup, winRate, trades: data.total }
      }
    }
  })

  return best
}

/**
 * Update AI model context after trade closes
 * This is the core of the learning loop
 */
export function recordTradeOutcome(trade) {
  try {
    console.log('[Learning Loop] Recording trade outcome for learning:', {
      symbol: trade.symbol,
      outcome: trade.outcome,
      setup: trade.setupType,
      pnl: trade.pnlPercent
    })

    // Record in AVA Mind (already happens in avaMindService)
    // This function is for additional AI-specific tracking

    // TODO: In future, send to backend to update ML model weights
    // For now, the learning happens through context injection in prompts

    return true
  } catch (error) {
    console.error('[Learning Loop] Error recording outcome:', error)
    return false
  }
}
