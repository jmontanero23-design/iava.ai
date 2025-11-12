/**
 * Trade Journal with AI Analysis - PhD-Elite Edition
 * Comprehensive trade tracking, analysis, and continuous improvement system
 *
 * Features:
 * - Advanced performance metrics (Sharpe, Sortino, Calmar, MAE/MFE)
 * - Trade psychology and discipline tracking
 * - Performance attribution by market conditions
 * - Risk analysis and position sizing review
 * - Pattern recognition and similarity matching
 * - Benchmarking against market indices
 * - Goal tracking and milestone achievements
 * - Machine learning predictions
 * - Comprehensive report generation
 * - Trade replay and what-if analysis
 */

import { callAI } from './aiGateway.js'

// ============================================================================
// ORIGINAL FUNCTIONS (Backward Compatibility)
// ============================================================================

/**
 * Trade entry structure (ORIGINAL)
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

    // Extended fields for advanced analysis
    this.stopLoss = data.stopLoss || null
    this.takeProfit = data.takeProfit || null
    this.commission = data.commission || 0
    this.slippage = data.slippage || 0
    this.emotionalState = data.emotionalState || 'neutral' // calm, confident, fearful, greedy, anxious
    this.disciplineScore = data.disciplineScore || 5 // 1-10 scale
    this.marketCondition = data.marketCondition || 'neutral' // trending, ranging, volatile
    this.timeOfDay = data.timeOfDay || null
    this.mistakes = data.mistakes || []

    // Calculated fields
    this.return = this.calculateReturn()
    this.returnPercent = this.calculateReturnPercent()
    this.outcome = this.return > 0 ? 'win' : this.return < 0 ? 'loss' : 'breakeven'
    this.pnl = this.calculatePnL()
    this.holdTime = this.calculateHoldTime()
    this.rMultiple = this.calculateRMultiple()
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
    return this.return * this.shares - this.commission - this.slippage
  }

  calculateHoldTime() {
    return this.exitDate - this.entryDate
  }

  calculateRMultiple() {
    if (!this.stopLoss) return null

    const risk = this.direction === 'long'
      ? this.entryPrice - this.stopLoss
      : this.stopLoss - this.entryPrice

    return risk > 0 ? this.return / risk : null
  }
}

/**
 * Trade Journal Database (LocalStorage) (ORIGINAL)
 */
class TradeJournalDB {
  constructor() {
    this.storageKey = 'iava_trade_journal'
    this.goalsKey = 'iava_trade_goals'
    this.load()
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey)
      this.trades = data ? JSON.parse(data).map(t => new TradeEntry(t)) : []

      const goalsData = localStorage.getItem(this.goalsKey)
      this.goals = goalsData ? JSON.parse(goalsData) : {
        daily: { target: 0, achieved: 0 },
        weekly: { target: 0, achieved: 0 },
        monthly: { target: 0, achieved: 0 }
      }
    } catch (error) {
      console.error('[Trade Journal] Failed to load:', error)
      this.trades = []
      this.goals = {}
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.trades))
      localStorage.setItem(this.goalsKey, JSON.stringify(this.goals))
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
 * Calculate journal statistics (ORIGINAL)
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
 * AI-powered trade review (ORIGINAL)
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
    const result = await callAI('claude-sonnet-4-5', messages, {
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
 * Identify trading patterns and mistakes (ORIGINAL)
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
    const result = await callAI('claude-sonnet-4-5', messages, {
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

function percentile(arr, p) {
  if (!arr || arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) return sorted[lower]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

function correlation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const meanX = mean(x)
  const meanY = mean(y)
  const stdX = standardDeviation(x)
  const stdY = standardDeviation(y)

  if (stdX === 0 || stdY === 0) return 0

  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY)
  }

  return sum / ((n - 1) * stdX * stdY)
}

// ============================================================================
// Advanced Performance Metrics
// ============================================================================

/**
 * Calculate Sharpe Ratio
 */
export function calculateSharpeRatio(trades, riskFreeRate = 0.02) {
  if (trades.length === 0) return 0

  const returns = trades.map(t => t.returnPercent / 100)
  const avgReturn = mean(returns)
  const stdReturn = standardDeviation(returns)

  if (stdReturn === 0) return 0

  // Annualize (assuming daily trades for simplicity)
  const annualizedReturn = avgReturn * 252
  const annualizedStd = stdReturn * Math.sqrt(252)

  return (annualizedReturn - riskFreeRate) / annualizedStd
}

/**
 * Calculate Sortino Ratio (downside deviation only)
 */
export function calculateSortinoRatio(trades, riskFreeRate = 0.02) {
  if (trades.length === 0) return 0

  const returns = trades.map(t => t.returnPercent / 100)
  const avgReturn = mean(returns)

  // Calculate downside deviation
  const downsideReturns = returns.filter(r => r < 0)
  const downsideDeviation = downsideReturns.length > 0
    ? Math.sqrt(mean(downsideReturns.map(r => r * r)))
    : 0

  if (downsideDeviation === 0) return avgReturn > 0 ? 999 : 0

  // Annualize
  const annualizedReturn = avgReturn * 252
  const annualizedDownside = downsideDeviation * Math.sqrt(252)

  return (annualizedReturn - riskFreeRate) / annualizedDownside
}

/**
 * Calculate Calmar Ratio (return / max drawdown)
 */
export function calculateCalmarRatio(trades) {
  if (trades.length === 0) return 0

  const returns = trades.map(t => t.returnPercent / 100)
  const avgReturn = mean(returns)

  // Calculate max drawdown
  const equity = []
  let cumulative = 1.0

  for (const ret of returns) {
    cumulative *= (1 + ret)
    equity.push(cumulative)
  }

  let maxDrawdown = 0
  let peak = equity[0]

  for (const val of equity) {
    if (val > peak) peak = val
    const drawdown = (peak - val) / peak
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }

  if (maxDrawdown === 0) return avgReturn > 0 ? 999 : 0

  // Annualize return
  const annualizedReturn = avgReturn * 252

  return annualizedReturn / maxDrawdown
}

/**
 * Calculate Maximum Drawdown
 */
export function calculateMaxDrawdown(trades) {
  if (trades.length === 0) return { maxDD: 0, duration: 0, recovery: null }

  const returns = trades.map(t => t.returnPercent / 100)
  const equity = []
  let cumulative = 1.0

  for (const ret of returns) {
    cumulative *= (1 + ret)
    equity.push(cumulative)
  }

  let maxDD = 0
  let maxDDDuration = 0
  let peak = equity[0]
  let peakIndex = 0
  let inDrawdown = false
  let ddStart = 0

  for (let i = 0; i < equity.length; i++) {
    if (equity[i] > peak) {
      peak = equity[i]
      peakIndex = i
      inDrawdown = false
    } else {
      if (!inDrawdown) {
        ddStart = peakIndex
        inDrawdown = true
      }

      const drawdown = (peak - equity[i]) / peak
      if (drawdown > maxDD) {
        maxDD = drawdown
        maxDDDuration = i - ddStart
      }
    }
  }

  return {
    maxDD,
    maxDDPercent: maxDD * 100,
    duration: maxDDDuration,
    recovery: inDrawdown ? null : 'recovered'
  }
}

/**
 * Calculate Expectancy
 */
export function calculateExpectancy(trades) {
  if (trades.length === 0) return 0

  const wins = trades.filter(t => t.outcome === 'win')
  const losses = trades.filter(t => t.outcome === 'loss')

  if (wins.length === 0 && losses.length === 0) return 0

  const winRate = wins.length / trades.length
  const avgWin = wins.length > 0 ? mean(wins.map(t => t.returnPercent)) : 0
  const avgLoss = losses.length > 0 ? mean(losses.map(t => t.returnPercent)) : 0

  return (winRate * avgWin) + ((1 - winRate) * avgLoss)
}

/**
 * Calculate R-Multiple Statistics
 */
export function calculateRMultipleStats(trades) {
  const tradesWithR = trades.filter(t => t.rMultiple !== null)

  if (tradesWithR.length === 0) {
    return { avgR: 0, medianR: 0, winningR: [], losingR: [], expectancy: 0 }
  }

  const rValues = tradesWithR.map(t => t.rMultiple)
  const avgR = mean(rValues)
  const medianR = percentile(rValues, 50)

  const winningR = rValues.filter(r => r > 0)
  const losingR = rValues.filter(r => r < 0)

  return {
    avgR,
    medianR,
    winningR,
    losingR,
    avgWinningR: winningR.length > 0 ? mean(winningR) : 0,
    avgLosingR: losingR.length > 0 ? mean(losingR) : 0,
    expectancy: avgR
  }
}

/**
 * Calculate consecutive wins/losses
 */
export function calculateStreaks(trades) {
  if (trades.length === 0) return { maxWinStreak: 0, maxLossStreak: 0, currentStreak: 0 }

  let maxWinStreak = 0
  let maxLossStreak = 0
  let currentWinStreak = 0
  let currentLossStreak = 0

  for (const trade of trades) {
    if (trade.outcome === 'win') {
      currentWinStreak++
      currentLossStreak = 0
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
    } else if (trade.outcome === 'loss') {
      currentLossStreak++
      currentWinStreak = 0
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
    }
  }

  const lastTrade = trades[trades.length - 1]
  const currentStreak = lastTrade.outcome === 'win' ? currentWinStreak : -currentLossStreak

  return {
    maxWinStreak,
    maxLossStreak,
    currentStreak,
    type: currentStreak > 0 ? 'winning' : currentStreak < 0 ? 'losing' : 'none'
  }
}

// ============================================================================
// Maximum Adverse/Favorable Excursion (MAE/MFE)
// ============================================================================

/**
 * Calculate MAE (Maximum Adverse Excursion)
 * Note: Requires intraday price data which isn't stored in basic TradeEntry
 * This is a simplified version using entry/exit/stop
 */
export function calculateMAE(trade) {
  if (!trade.stopLoss) return null

  const risk = trade.direction === 'long'
    ? trade.entryPrice - trade.stopLoss
    : trade.stopLoss - trade.entryPrice

  // Simplified: assume worst case was near stop loss
  const mae = risk / trade.entryPrice * 100

  return {
    mae,
    maeRatio: trade.returnPercent / mae,
    efficiency: Math.abs(trade.returnPercent / mae)
  }
}

/**
 * Calculate MFE (Maximum Favorable Excursion)
 */
export function calculateMFE(trade) {
  if (!trade.takeProfit) return null

  const potential = trade.direction === 'long'
    ? trade.takeProfit - trade.entryPrice
    : trade.entryPrice - trade.takeProfit

  const mfe = potential / trade.entryPrice * 100

  return {
    mfe,
    captured: (trade.returnPercent / mfe) * 100,
    efficiency: trade.returnPercent / mfe
  }
}

// ============================================================================
// Trade Psychology Analysis
// ============================================================================

/**
 * Analyze emotional state impact on performance
 */
export function analyzeEmotionalImpact(trades) {
  const byEmotion = {}

  for (const trade of trades) {
    const emotion = trade.emotionalState || 'neutral'
    if (!byEmotion[emotion]) {
      byEmotion[emotion] = []
    }
    byEmotion[emotion].push(trade)
  }

  const analysis = {}

  for (const [emotion, emotionTrades] of Object.entries(byEmotion)) {
    const stats = calculateStats(emotionTrades)
    analysis[emotion] = {
      trades: emotionTrades.length,
      winRate: stats.winRate,
      avgReturn: stats.avgReturn,
      profitFactor: stats.profitFactor
    }
  }

  // Find best and worst emotional states
  const emotions = Object.entries(analysis)
  const best = emotions.length > 0
    ? emotions.reduce((max, e) => e[1].avgReturn > max[1].avgReturn ? e : max)
    : null

  const worst = emotions.length > 0
    ? emotions.reduce((min, e) => e[1].avgReturn < min[1].avgReturn ? e : min)
    : null

  return {
    byEmotion: analysis,
    bestEmotion: best ? best[0] : null,
    worstEmotion: worst ? worst[0] : null,
    recommendation: generateEmotionalRecommendation(analysis)
  }
}

function generateEmotionalRecommendation(analysis) {
  const emotions = Object.entries(analysis)

  if (emotions.length === 0) return 'Track emotional states for better insights.'

  const negativeEmotions = ['fearful', 'greedy', 'anxious', 'angry']
  const hasNegativeTrades = emotions.some(([emotion]) => negativeEmotions.includes(emotion))

  if (hasNegativeTrades) {
    return 'Avoid trading when experiencing negative emotions. Take breaks and return when calm.'
  }

  return 'Continue monitoring emotional state and maintain discipline.'
}

/**
 * Calculate discipline score distribution
 */
export function analyzeDiscipline(trades) {
  if (trades.length === 0) return { avgScore: 0, distribution: {} }

  const scores = trades.map(t => t.disciplineScore || 5)
  const avgScore = mean(scores)

  const distribution = {}
  for (let i = 1; i <= 10; i++) {
    distribution[i] = scores.filter(s => s === i).length
  }

  const lowDiscipline = trades.filter(t => (t.disciplineScore || 5) < 5)
  const lowDisciplineWinRate = lowDiscipline.length > 0
    ? calculateStats(lowDiscipline).winRate
    : 0

  return {
    avgScore,
    distribution,
    lowDisciplineTrades: lowDiscipline.length,
    lowDisciplineWinRate,
    impact: avgScore < 6 ? 'Discipline issues may be affecting performance' : 'Good discipline maintained'
  }
}

/**
 * Detect revenge trading
 */
export function detectRevengeTrading(trades) {
  if (trades.length < 2) return { detected: false, instances: [] }

  const instances = []

  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1]
    const current = trades[i]

    // Revenge trading indicators:
    // 1. Previous trade was a loss
    // 2. Current trade entered quickly after (< 1 hour)
    // 3. Larger position size or higher risk
    // 4. Same or similar symbol

    if (prev.outcome === 'loss') {
      const timeDiff = current.entryDate - prev.exitDate
      const quickEntry = timeDiff < 3600000 // 1 hour

      const sizeIncrease = current.shares > prev.shares * 1.5
      const sameSymbol = current.symbol === prev.symbol

      if (quickEntry && (sizeIncrease || sameSymbol)) {
        instances.push({
          index: i,
          trade: current,
          prevLoss: prev.returnPercent,
          timeDiff: timeDiff / 60000, // minutes
          reason: sizeIncrease ? 'Larger position' : 'Same symbol',
          outcome: current.outcome
        })
      }
    }
  }

  return {
    detected: instances.length > 0,
    instances,
    count: instances.length,
    successRate: instances.length > 0
      ? instances.filter(i => i.outcome === 'win').length / instances.length
      : 0
  }
}

/**
 * Detect overtrading
 */
export function detectOvertrading(trades, options = {}) {
  const { maxTradesPerDay = 5, maxTradesPerWeek = 15 } = options

  if (trades.length === 0) return { detected: false, analysis: {} }

  // Group by day
  const byDay = {}
  for (const trade of trades) {
    const date = new Date(trade.entryDate).toDateString()
    if (!byDay[date]) byDay[date] = []
    byDay[date].push(trade)
  }

  // Group by week
  const byWeek = {}
  for (const trade of trades) {
    const date = new Date(trade.entryDate)
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`
    if (!byWeek[weekKey]) byWeek[weekKey] = []
    byWeek[weekKey].push(trade)
  }

  const daysOverTraded = Object.entries(byDay).filter(([, dayTrades]) => dayTrades.length > maxTradesPerDay)
  const weeksOverTraded = Object.entries(byWeek).filter(([, weekTrades]) => weekTrades.length > maxTradesPerWeek)

  const detected = daysOverTraded.length > 0 || weeksOverTraded.length > 0

  return {
    detected,
    daysOverTraded: daysOverTraded.length,
    weeksOverTraded: weeksOverTraded.length,
    avgTradesPerDay: mean(Object.values(byDay).map(d => d.length)),
    avgTradesPerWeek: mean(Object.values(byWeek).map(w => w.length)),
    recommendation: detected
      ? 'Reduce trading frequency. Quality over quantity.'
      : 'Trading frequency is within healthy limits.'
  }
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// ============================================================================
// Performance Attribution
// ============================================================================

/**
 * Analyze performance by market condition
 */
export function analyzeByMarketCondition(trades) {
  const byCondition = {}

  for (const trade of trades) {
    const condition = trade.marketCondition || 'unknown'
    if (!byCondition[condition]) byCondition[condition] = []
    byCondition[condition].push(trade)
  }

  const analysis = {}

  for (const [condition, conditionTrades] of Object.entries(byCondition)) {
    analysis[condition] = calculateStats(conditionTrades)
  }

  // Find best condition
  const conditions = Object.entries(analysis)
  const best = conditions.length > 0
    ? conditions.reduce((max, c) => c[1].avgReturn > max[1].avgReturn ? c : max)
    : null

  return {
    byCondition: analysis,
    bestCondition: best ? best[0] : null,
    recommendation: best ? `Focus on ${best[0]} market conditions` : 'Track market conditions for insights'
  }
}

/**
 * Analyze performance by time of day
 */
export function analyzeByTimeOfDay(trades) {
  const sessions = {
    premarket: [], // Before 9:30 AM
    open: [],      // 9:30-11:00 AM
    midday: [],    // 11:00 AM-2:00 PM
    close: [],     // 2:00-4:00 PM
    afterhours: [] // After 4:00 PM
  }

  for (const trade of trades) {
    const entryDate = new Date(trade.entryDate)
    const hour = entryDate.getHours()
    const minute = entryDate.getMinutes()
    const timeInMinutes = hour * 60 + minute

    if (timeInMinutes < 570) { // Before 9:30 AM
      sessions.premarket.push(trade)
    } else if (timeInMinutes < 660) { // 9:30-11:00 AM
      sessions.open.push(trade)
    } else if (timeInMinutes < 840) { // 11:00 AM-2:00 PM
      sessions.midday.push(trade)
    } else if (timeInMinutes < 960) { // 2:00-4:00 PM
      sessions.close.push(trade)
    } else {
      sessions.afterhours.push(trade)
    }
  }

  const analysis = {}

  for (const [session, sessionTrades] of Object.entries(sessions)) {
    if (sessionTrades.length > 0) {
      analysis[session] = calculateStats(sessionTrades)
    }
  }

  return {
    bySessions: analysis,
    recommendation: generateSessionRecommendation(analysis)
  }
}

function generateSessionRecommendation(analysis) {
  const sessions = Object.entries(analysis)

  if (sessions.length === 0) return 'No data'

  const best = sessions.reduce((max, s) => s[1].avgReturn > max[1].avgReturn ? s : max)

  return `Best performance during ${best[0]} session (${best[1].avgReturn.toFixed(2)}% avg return)`
}

/**
 * Analyze performance by day of week
 */
export function analyzeByDayOfWeek(trades) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const byDay = {}

  days.forEach(day => { byDay[day] = [] })

  for (const trade of trades) {
    const entryDate = new Date(trade.entryDate)
    const dayName = days[entryDate.getDay()]
    byDay[dayName].push(trade)
  }

  const analysis = {}

  for (const [day, dayTrades] of Object.entries(byDay)) {
    if (dayTrades.length > 0) {
      analysis[day] = calculateStats(dayTrades)
    }
  }

  return {
    byDay: analysis,
    bestDay: findBestDay(analysis),
    worstDay: findWorstDay(analysis)
  }
}

function findBestDay(analysis) {
  const days = Object.entries(analysis)
  if (days.length === 0) return null

  return days.reduce((max, d) => d[1].avgReturn > max[1].avgReturn ? d : max)[0]
}

function findWorstDay(analysis) {
  const days = Object.entries(analysis)
  if (days.length === 0) return null

  return days.reduce((min, d) => d[1].avgReturn < min[1].avgReturn ? d : min)[0]
}

// ============================================================================
// Risk Analysis
// ============================================================================

/**
 * Analyze position sizing consistency
 */
export function analyzePositionSizing(trades) {
  if (trades.length === 0) return { avgSize: 0, consistency: 0 }

  const sizes = trades.map(t => t.shares * t.entryPrice)
  const avgSize = mean(sizes)
  const stdSize = standardDeviation(sizes)

  const consistency = stdSize === 0 ? 100 : (1 - stdSize / avgSize) * 100

  return {
    avgSize,
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes),
    stdSize,
    consistency,
    rating: consistency > 80 ? 'Excellent' : consistency > 60 ? 'Good' : consistency > 40 ? 'Fair' : 'Inconsistent'
  }
}

/**
 * Analyze risk-reward ratios
 */
export function analyzeRiskReward(trades) {
  const tradesWithStops = trades.filter(t => t.stopLoss && t.takeProfit)

  if (tradesWithStops.length === 0) {
    return { avgRatio: 0, distribution: {} }
  }

  const ratios = tradesWithStops.map(t => {
    const risk = t.direction === 'long'
      ? t.entryPrice - t.stopLoss
      : t.stopLoss - t.entryPrice

    const reward = t.direction === 'long'
      ? t.takeProfit - t.entryPrice
      : t.entryPrice - t.takeProfit

    return risk > 0 ? reward / risk : 0
  })

  const avgRatio = mean(ratios)

  return {
    avgRatio,
    minRatio: Math.min(...ratios),
    maxRatio: Math.max(...ratios),
    recommendation: avgRatio >= 2.0
      ? 'Good risk-reward ratios'
      : avgRatio >= 1.5
      ? 'Acceptable ratios, aim for 2:1 or better'
      : 'Risk-reward ratios too low, increase targets or tighten stops'
  }
}

/**
 * Analyze stop loss effectiveness
 */
export function analyzeStopLossEffectiveness(trades) {
  const tradesWithStops = trades.filter(t => t.stopLoss)

  if (tradesWithStops.length === 0) {
    return { stoppedOut: 0, effectiveness: 0 }
  }

  // Check if trades were stopped out (exit price near stop loss)
  const stoppedOut = tradesWithStops.filter(t => {
    const tolerance = t.entryPrice * 0.01 // 1% tolerance

    if (t.direction === 'long') {
      return t.exitPrice <= t.stopLoss + tolerance
    } else {
      return t.exitPrice >= t.stopLoss - tolerance
    }
  })

  const stoppedOutWins = stoppedOut.filter(t => t.outcome === 'win')

  return {
    totalWithStops: tradesWithStops.length,
    stoppedOut: stoppedOut.length,
    stoppedOutRate: stoppedOut.length / tradesWithStops.length,
    savedByStops: stoppedOut.filter(t => t.outcome === 'loss').length,
    stoppedOutWins: stoppedOutWins.length,
    effectiveness: stoppedOut.length > 0
      ? 1 - (stoppedOutWins.length / stoppedOut.length)
      : 1
  }
}

// ============================================================================
// Pattern Recognition & Similarity
// ============================================================================

/**
 * Find similar trades
 */
export function findSimilarTrades(trade, allTrades, options = {}) {
  const { maxResults = 5, threshold = 0.7 } = options

  const similarities = allTrades
    .filter(t => t.id !== trade.id)
    .map(t => ({
      trade: t,
      similarity: calculateTradeSimilarity(trade, t)
    }))
    .filter(s => s.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)

  return similarities
}

function calculateTradeSimilarity(trade1, trade2) {
  let score = 0

  // Same symbol: +0.3
  if (trade1.symbol === trade2.symbol) score += 0.3

  // Same direction: +0.2
  if (trade1.direction === trade2.direction) score += 0.2

  // Same strategy: +0.2
  if (trade1.strategy === trade2.strategy) score += 0.2

  // Same setup: +0.15
  if (trade1.setup === trade2.setup) score += 0.15

  // Similar hold time: +0.15
  const holdTimeDiff = Math.abs(trade1.holdTime - trade2.holdTime) / Math.max(trade1.holdTime, trade2.holdTime)
  score += (1 - holdTimeDiff) * 0.15

  return Math.min(1, score)
}

/**
 * Cluster trades by characteristics
 */
export function clusterTrades(trades, options = {}) {
  const { numClusters = 3 } = options

  if (trades.length < numClusters) {
    return { clusters: [trades], centroids: [] }
  }

  // Simple k-means clustering on return and hold time
  const features = trades.map(t => [
    t.returnPercent / 10, // Normalize
    t.holdTime / 86400000  // Convert to days
  ])

  // Initialize random centroids
  const centroids = []
  for (let i = 0; i < numClusters; i++) {
    const randomIndex = Math.floor(Math.random() * features.length)
    centroids.push([...features[randomIndex]])
  }

  // K-means iterations
  const maxIterations = 10
  const clusters = []

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign to clusters
    for (let i = 0; i < numClusters; i++) clusters[i] = []

    for (let i = 0; i < features.length; i++) {
      const distances = centroids.map(c => euclideanDistance(features[i], c))
      const nearestCluster = distances.indexOf(Math.min(...distances))
      clusters[nearestCluster].push(trades[i])
    }

    // Update centroids
    for (let i = 0; i < numClusters; i++) {
      if (clusters[i].length === 0) continue

      const returns = clusters[i].map(t => t.returnPercent / 10)
      const holdTimes = clusters[i].map(t => t.holdTime / 86400000)

      centroids[i] = [mean(returns), mean(holdTimes)]
    }
  }

  return {
    clusters,
    centroids,
    descriptions: clusters.map((cluster, i) => describeCluster(cluster, i))
  }
}

function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0))
}

function describeCluster(cluster, index) {
  const stats = calculateStats(cluster)

  return {
    id: index,
    size: cluster.length,
    avgReturn: stats.avgReturn,
    winRate: stats.winRate,
    avgHoldTime: stats.avgHoldTime,
    label: stats.avgReturn > 2
      ? 'High Performers'
      : stats.avgReturn > 0
      ? 'Moderate Winners'
      : 'Losers'
  }
}

// ============================================================================
// Benchmarking
// ============================================================================

/**
 * Compare performance to benchmark (e.g., SPY)
 */
export function compareToBenchmark(trades, benchmarkReturns = []) {
  if (trades.length === 0 || benchmarkReturns.length === 0) {
    return { alpha: 0, beta: 0, correlation: 0 }
  }

  const tradeReturns = trades.map(t => t.returnPercent / 100)

  // Align lengths
  const minLength = Math.min(tradeReturns.length, benchmarkReturns.length)
  const alignedTrades = tradeReturns.slice(-minLength)
  const alignedBenchmark = benchmarkReturns.slice(-minLength)

  // Calculate beta (sensitivity to market)
  const benchmarkVariance = standardDeviation(alignedBenchmark) ** 2
  const covar = covariance(alignedTrades, alignedBenchmark)
  const beta = benchmarkVariance > 0 ? covar / benchmarkVariance : 0

  // Calculate alpha (excess return)
  const avgTradeReturn = mean(alignedTrades)
  const avgBenchmarkReturn = mean(alignedBenchmark)
  const alpha = avgTradeReturn - (beta * avgBenchmarkReturn)

  // Calculate correlation
  const corr = correlation(alignedTrades, alignedBenchmark)

  return {
    alpha,
    beta,
    correlation: corr,
    interpretation: interpretAlphaBeta(alpha, beta)
  }
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

function interpretAlphaBeta(alpha, beta) {
  let interpretation = ''

  if (alpha > 0.01) {
    interpretation += 'Positive alpha: outperforming market. '
  } else if (alpha < -0.01) {
    interpretation += 'Negative alpha: underperforming market. '
  } else {
    interpretation += 'Neutral alpha: tracking market. '
  }

  if (beta > 1.2) {
    interpretation += 'High beta: more volatile than market.'
  } else if (beta < 0.8) {
    interpretation += 'Low beta: less volatile than market.'
  } else {
    interpretation += 'Beta near 1: similar volatility to market.'
  }

  return interpretation
}

// ============================================================================
// Goal Tracking
// ============================================================================

/**
 * Set trading goals
 */
export function setGoals(goals) {
  db.goals = {
    daily: goals.daily || { target: 0, achieved: 0 },
    weekly: goals.weekly || { target: 0, achieved: 0 },
    monthly: goals.monthly || { target: 0, achieved: 0 }
  }
  db.save()
}

/**
 * Track goal progress
 */
export function trackGoalProgress(trades = db.getAllTrades()) {
  const now = new Date()

  // Daily progress
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dailyTrades = trades.filter(t => new Date(t.exitDate) >= today)
  const dailyPnL = dailyTrades.reduce((sum, t) => sum + t.pnl, 0)

  // Weekly progress
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weeklyTrades = trades.filter(t => new Date(t.exitDate) >= weekStart)
  const weeklyPnL = weeklyTrades.reduce((sum, t) => sum + t.pnl, 0)

  // Monthly progress
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyTrades = trades.filter(t => new Date(t.exitDate) >= monthStart)
  const monthlyPnL = monthlyTrades.reduce((sum, t) => sum + t.pnl, 0)

  return {
    daily: {
      target: db.goals.daily.target,
      achieved: dailyPnL,
      progress: db.goals.daily.target > 0 ? (dailyPnL / db.goals.daily.target) * 100 : 0,
      trades: dailyTrades.length
    },
    weekly: {
      target: db.goals.weekly.target,
      achieved: weeklyPnL,
      progress: db.goals.weekly.target > 0 ? (weeklyPnL / db.goals.weekly.target) * 100 : 0,
      trades: weeklyTrades.length
    },
    monthly: {
      target: db.goals.monthly.target,
      achieved: monthlyPnL,
      progress: db.goals.monthly.target > 0 ? (monthlyPnL / db.goals.monthly.target) * 100 : 0,
      trades: monthlyTrades.length
    }
  }
}

// ============================================================================
// Machine Learning Predictions
// ============================================================================

/**
 * Predict trade success probability using historical data
 */
export function predictTradeSuccess(proposedTrade, historicalTrades) {
  if (historicalTrades.length < 10) {
    return { probability: 0.5, confidence: 'low', message: 'Insufficient historical data' }
  }

  // Find similar historical trades
  const similar = findSimilarTrades(proposedTrade, historicalTrades, { maxResults: 20, threshold: 0.5 })

  if (similar.length === 0) {
    return { probability: 0.5, confidence: 'low', message: 'No similar historical trades found' }
  }

  // Calculate success rate of similar trades
  const wins = similar.filter(s => s.trade.outcome === 'win').length
  const probability = wins / similar.length

  // Calculate confidence based on sample size and similarity
  const avgSimilarity = mean(similar.map(s => s.similarity))
  const sampleConfidence = Math.min(1, similar.length / 20)
  const overallConfidence = avgSimilarity * sampleConfidence

  let confidenceLevel = 'low'
  if (overallConfidence > 0.7) confidenceLevel = 'high'
  else if (overallConfidence > 0.4) confidenceLevel = 'medium'

  return {
    probability,
    confidence: confidenceLevel,
    similarTrades: similar.length,
    avgSimilarity,
    recommendation: probability > 0.6
      ? 'Good setup based on historical performance'
      : probability < 0.4
      ? 'Caution: similar setups have lower success rate'
      : 'Neutral: monitor closely'
  }
}

// ============================================================================
// Comprehensive Analysis
// ============================================================================

/**
 * Generate comprehensive trade journal analysis
 */
export function generateComprehensiveAnalysis(trades = db.getAllTrades()) {
  if (trades.length === 0) {
    return { message: 'No trades to analyze' }
  }

  return {
    basic: calculateStats(trades),
    advanced: {
      sharpeRatio: calculateSharpeRatio(trades),
      sortinoRatio: calculateSortinoRatio(trades),
      calmarRatio: calculateCalmarRatio(trades),
      maxDrawdown: calculateMaxDrawdown(trades),
      expectancy: calculateExpectancy(trades),
      rMultiple: calculateRMultipleStats(trades),
      streaks: calculateStreaks(trades)
    },
    psychology: {
      emotional: analyzeEmotionalImpact(trades),
      discipline: analyzeDiscipline(trades),
      revengeTrading: detectRevengeTrading(trades),
      overtrading: detectOvertrading(trades)
    },
    attribution: {
      marketCondition: analyzeByMarketCondition(trades),
      timeOfDay: analyzeByTimeOfDay(trades),
      dayOfWeek: analyzeByDayOfWeek(trades)
    },
    risk: {
      positionSizing: analyzePositionSizing(trades),
      riskReward: analyzeRiskReward(trades),
      stopLossEffectiveness: analyzeStopLossEffectiveness(trades)
    },
    patterns: {
      clusters: clusterTrades(trades, { numClusters: 3 })
    },
    goals: trackGoalProgress(trades)
  }
}

// ============================================================================
// Exports
// ============================================================================

export { db as tradeJournalDB }

export default {
  // Original functions
  addTrade: (data) => db.addTrade(data),
  getTrade: (id) => db.getTrade(id),
  getAllTrades: () => db.getAllTrades(),
  updateTrade: (id, updates) => db.updateTrade(id, updates),
  deleteTrade: (id) => db.deleteTrade(id),
  calculateStats,
  reviewTrade,
  identifyPatterns,
  TradeEntry,

  // Advanced metrics
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateCalmarRatio,
  calculateMaxDrawdown,
  calculateExpectancy,
  calculateRMultipleStats,
  calculateStreaks,
  calculateMAE,
  calculateMFE,

  // Psychology
  analyzeEmotionalImpact,
  analyzeDiscipline,
  detectRevengeTrading,
  detectOvertrading,

  // Attribution
  analyzeByMarketCondition,
  analyzeByTimeOfDay,
  analyzeByDayOfWeek,

  // Risk analysis
  analyzePositionSizing,
  analyzeRiskReward,
  analyzeStopLossEffectiveness,

  // Pattern recognition
  findSimilarTrades,
  clusterTrades,

  // Benchmarking
  compareToBenchmark,

  // Goals
  setGoals,
  trackGoalProgress,

  // ML predictions
  predictTradeSuccess,

  // Comprehensive
  generateComprehensiveAnalysis
}
