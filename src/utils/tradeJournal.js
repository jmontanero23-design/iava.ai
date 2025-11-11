/**
 * Trade Journal with AI Analysis
 * Post-trade analysis with AI-powered improvement suggestions
 *
 * Features:
 * - Trade recording and history
 * - Performance analytics
 * - AI-powered trade review
 * - Pattern recognition in trading behavior
 * - Mistake identification and learning
 * - Personalized improvement suggestions
 */

import { callAI } from './aiGateway.js'

/**
 * Trade entry structure
 */
export class TradeEntry {
  constructor(data) {
    this.id = data.id || Date.now().toString()
    this.symbol = data.symbol
    this.direction = data.direction // 'long' or 'short'
    this.entryPrice = data.entryPrice
    this.exitPrice = data.exitPrice
    this.shares = data.shares
    this.entryDate = data.entryDate
    this.exitDate = data.exitDate
    this.strategy = data.strategy
    this.setup = data.setup
    this.notes = data.notes || ''
    this.tags = data.tags || []
    this.screenshots = data.screenshots || []

    // Calculated fields
    this.return = this.calculateReturn()
    this.returnPercent = this.calculateReturnPercent()
    this.outcome = this.return > 0 ? 'win' : this.return < 0 ? 'loss' : 'breakeven'
    this.pnl = this.calculatePnL()
    this.holdTime = this.calculateHoldTime()
  }

  calculateReturn() {
    if (this.direction === 'long') {
      return this.exitPrice - this.entryPrice
    } else {
      return this.entryPrice - this.exitPrice
    }
  }

  calculateReturnPercent() {
    return (this.return / this.entryPrice) * 100
  }

  calculatePnL() {
    return this.return * this.shares
  }

  calculateHoldTime() {
    return this.exitDate - this.entryDate
  }
}

/**
 * Trade Journal Database (LocalStorage)
 */
class TradeJournalDB {
  constructor() {
    this.storageKey = 'iava_trade_journal'
    this.load()
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey)
      this.trades = data ? JSON.parse(data).map(t => new TradeEntry(t)) : []
    } catch (error) {
      console.error('[Trade Journal] Failed to load:', error)
      this.trades = []
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.trades))
    } catch (error) {
      console.error('[Trade Journal] Failed to save:', error)
    }
  }

  addTrade(tradeData) {
    const trade = new TradeEntry(tradeData)
    this.trades.push(trade)
    this.save()
    return trade
  }

  getTrade(id) {
    return this.trades.find(t => t.id === id)
  }

  getAllTrades() {
    return this.trades
  }

  getTradesBySymbol(symbol) {
    return this.trades.filter(t => t.symbol === symbol)
  }

  getTradesByStrategy(strategy) {
    return this.trades.filter(t => t.strategy === strategy)
  }

  deleteTrade(id) {
    this.trades = this.trades.filter(t => t.id !== id)
    this.save()
  }

  updateTrade(id, updates) {
    const index = this.trades.findIndex(t => t.id === id)
    if (index !== -1) {
      this.trades[index] = new TradeEntry({ ...this.trades[index], ...updates })
      this.save()
      return this.trades[index]
    }
    return null
  }
}

// Singleton instance
const db = new TradeJournalDB()

/**
 * Calculate journal statistics
 */
export function calculateStats(trades = db.getAllTrades()) {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgReturn: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      totalPnL: 0,
      largestWin: 0,
      largestLoss: 0,
      avgHoldTime: 0
    }
  }

  const wins = trades.filter(t => t.outcome === 'win')
  const losses = trades.filter(t => t.outcome === 'loss')

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0)
  const avgReturn = trades.reduce((sum, t) => sum + t.returnPercent, 0) / trades.length

  const avgWin = wins.length > 0
    ? wins.reduce((sum, t) => sum + t.returnPercent, 0) / wins.length
    : 0

  const avgLoss = losses.length > 0
    ? losses.reduce((sum, t) => sum + t.returnPercent, 0) / losses.length
    : 0

  const totalGains = wins.reduce((sum, t) => sum + t.pnl, 0)
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0))

  const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? 999 : 0

  const largestWin = wins.length > 0
    ? Math.max(...wins.map(t => t.returnPercent))
    : 0

  const largestLoss = losses.length > 0
    ? Math.min(...losses.map(t => t.returnPercent))
    : 0

  const avgHoldTime = trades.reduce((sum, t) => sum + t.holdTime, 0) / trades.length

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: wins.length / trades.length,
    avgReturn,
    avgWin,
    avgLoss,
    profitFactor,
    totalPnL,
    largestWin,
    largestLoss,
    avgHoldTime
  }
}

/**
 * AI-powered trade review
 */
export async function reviewTrade(trade) {
  const messages = [
    {
      role: 'system',
      content: 'You are a professional trading coach. Analyze trades and provide constructive feedback focusing on process, not just outcome. Be specific and actionable.'
    },
    {
      role: 'user',
      content: `Review this trade:

Symbol: ${trade.symbol}
Direction: ${trade.direction}
Entry: $${trade.entryPrice}
Exit: $${trade.exitPrice}
Return: ${trade.returnPercent.toFixed(2)}%
Outcome: ${trade.outcome}
Strategy: ${trade.strategy}
Setup: ${trade.setup}
Hold Time: ${(trade.holdTime / 3600000).toFixed(1)} hours
Notes: ${trade.notes || 'None'}

Provide analysis in the following format:
1. What went well (even if it was a loss)
2. What could be improved
3. Key lesson from this trade
4. Specific action item for next trade

Be concise but insightful (3-4 sentences total).`
    }
  ]

  try {
    const result = await callAI('gpt-4o-mini', messages, {
      temperature: 0.6,
      max_tokens: 400,
      cache: false // Don't cache reviews - each trade is unique
    })

    return {
      review: result.content,
      latency: result.latency,
      cost: result.cost
    }
  } catch (error) {
    console.error('[Trade Journal] AI review error:', error)
    return {
      review: 'Unable to generate AI review at this time. Please review the trade manually based on your strategy rules.',
      error: error.message
    }
  }
}

/**
 * Identify trading patterns and mistakes
 */
export async function identifyPatterns(trades = db.getAllTrades()) {
  if (trades.length < 5) {
    return {
      patterns: [],
      message: 'Need at least 5 trades to identify patterns'
    }
  }

  const stats = calculateStats(trades)

  // Analyze by strategy
  const byStrategy = {}
  trades.forEach(t => {
    if (!byStrategy[t.strategy]) {
      byStrategy[t.strategy] = []
    }
    byStrategy[t.strategy].push(t)
  })

  const strategyStats = Object.fromEntries(
    Object.entries(byStrategy).map(([strategy, stratTrades]) => [
      strategy,
      calculateStats(stratTrades)
    ])
  )

  const messages = [
    {
      role: 'system',
      content: 'You are a trading psychology and performance analyst. Identify patterns, strengths, and areas for improvement in trading behavior.'
    },
    {
      role: 'user',
      content: `Analyze this trading history:

Overall Stats:
- Total Trades: ${stats.totalTrades}
- Win Rate: ${(stats.winRate * 100).toFixed(1)}%
- Avg Return: ${stats.avgReturn.toFixed(2)}%
- Profit Factor: ${stats.profitFactor.toFixed(2)}

By Strategy:
${Object.entries(strategyStats).map(([strategy, s]) =>
  `${strategy}: ${s.totalTrades} trades, ${(s.winRate * 100).toFixed(1)}% win rate, ${s.avgReturn.toFixed(2)}% avg return`
).join('\n')}

Recent Trades (last 5):
${trades.slice(-5).map(t =>
  `${t.symbol} ${t.direction} ${t.outcome} (${t.returnPercent.toFixed(2)}%) - ${t.strategy}`
).join('\n')}

Identify:
1. Top 2 strengths in this trading approach
2. Top 2 areas for improvement
3. Any concerning patterns or biases
4. One specific actionable recommendation

Return JSON only:
{
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "patterns": ["..."],
  "recommendation": "..."
}`
    }
  ]

  try {
    const result = await callAI('gpt-4o-mini', messages, {
      temperature: 0.4,
      max_tokens: 500,
      json: true,
      cache: true,
      cacheTTL: 1800 // 30 min
    })

    return JSON.parse(result.content)
  } catch (error) {
    console.error('[Trade Journal] Pattern analysis error:', error)
    return {
      strengths: [],
      improvements: [],
      patterns: [],
      recommendation: 'Unable to analyze patterns at this time.'
    }
  }
}

export { db as tradeJournalDB }

export default {
  addTrade: (data) => db.addTrade(data),
  getTrade: (id) => db.getTrade(id),
  getAllTrades: () => db.getAllTrades(),
  updateTrade: (id, updates) => db.updateTrade(id, updates),
  deleteTrade: (id) => db.deleteTrade(id),
  calculateStats,
  reviewTrade,
  identifyPatterns,
  TradeEntry
}
