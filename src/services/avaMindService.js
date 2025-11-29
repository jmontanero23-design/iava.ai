/**
 * AVA Mind Service
 *
 * The brain behind AVA Mind - handles real learning, pattern recognition,
 * and intelligent suggestion generation.
 *
 * This service provides:
 * - Trade history tracking and analysis
 * - Pattern recognition across multiple dimensions
 * - Win rate calculation by various factors
 * - Proactive suggestion generation
 * - Integration with AI Gateway for advanced analysis
 *
 * Storage Keys:
 * - ava.mind.trades: Array of trade records
 * - ava.mind.personality: User personality profile
 * - ava.mind.learning: Learning statistics
 * - ava.mind.patterns: Recognized patterns
 */

const STORAGE_KEYS = {
  TRADES: 'ava.mind.trades',
  PERSONALITY: 'ava.mind.personality',
  LEARNING: 'ava.mind.learning',
  PATTERNS: 'ava.mind.patterns',
  SESSIONS: 'ava.mind.sessions'
}

const MAX_TRADES_STORED = 500
const MIN_TRADES_FOR_PATTERN = 5

/**
 * Trade record structure
 * @typedef {Object} TradeRecord
 * @property {string} id - Unique trade ID
 * @property {string} symbol - Traded symbol
 * @property {string} action - BUY or SELL
 * @property {number} entryPrice - Entry price
 * @property {number} exitPrice - Exit price (if closed)
 * @property {number} quantity - Number of shares
 * @property {string} outcome - WIN, LOSS, or OPEN
 * @property {number} pnl - Profit/loss amount
 * @property {number} pnlPercent - Profit/loss percentage
 * @property {string} timeframe - Trading timeframe
 * @property {string} setupType - Type of setup (breakout, pullback, etc.)
 * @property {Object} indicators - Indicator values at entry
 * @property {string} marketCondition - Bull, Bear, Sideways
 * @property {number} entryTime - Entry timestamp
 * @property {number} exitTime - Exit timestamp
 * @property {number} holdDuration - Duration in minutes
 * @property {string} dayOfWeek - Day of week
 * @property {number} hourOfDay - Hour of day (0-23)
 */

class AVAMindService {
  constructor() {
    this.trades = []
    this.personality = null
    this.learning = null
    this.patterns = null
    this.loadFromStorage()
  }

  /**
   * Load all data from localStorage
   */
  loadFromStorage() {
    try {
      const tradesStr = localStorage.getItem(STORAGE_KEYS.TRADES)
      this.trades = tradesStr ? JSON.parse(tradesStr) : []

      const personalityStr = localStorage.getItem(STORAGE_KEYS.PERSONALITY)
      this.personality = personalityStr ? JSON.parse(personalityStr) : null

      const learningStr = localStorage.getItem(STORAGE_KEYS.LEARNING)
      this.learning = learningStr ? JSON.parse(learningStr) : this.initializeLearning()

      const patternsStr = localStorage.getItem(STORAGE_KEYS.PATTERNS)
      this.patterns = patternsStr ? JSON.parse(patternsStr) : {}
    } catch (error) {
      console.error('[AVAMind] Error loading from storage:', error)
      this.trades = []
      this.learning = this.initializeLearning()
      this.patterns = {}
    }
  }

  /**
   * Initialize learning statistics structure
   */
  initializeLearning() {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      bestSymbol: null,
      worstSymbol: null,
      bestTimeframe: null,
      bestDayOfWeek: null,
      bestHourOfDay: null,
      streakCurrent: 0,
      streakBest: 0,
      lastUpdated: null
    }
  }

  /**
   * Record a new trade
   * @param {Partial<TradeRecord>} trade - Trade data
   */
  recordTrade(trade) {
    const tradeRecord = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: trade.symbol?.toUpperCase(),
      action: trade.action?.toUpperCase(),
      entryPrice: parseFloat(trade.entryPrice) || 0,
      exitPrice: parseFloat(trade.exitPrice) || null,
      quantity: parseFloat(trade.quantity) || 0,
      outcome: trade.exitPrice ? this.calculateOutcome(trade) : 'OPEN',
      pnl: trade.exitPrice ? this.calculatePnL(trade) : 0,
      pnlPercent: trade.exitPrice ? this.calculatePnLPercent(trade) : 0,
      timeframe: trade.timeframe || '5Min',
      setupType: trade.setupType || 'unknown',
      indicators: trade.indicators || {},
      marketCondition: trade.marketCondition || 'unknown',
      entryTime: trade.entryTime || Date.now(),
      exitTime: trade.exitTime || null,
      holdDuration: trade.exitTime ? (trade.exitTime - trade.entryTime) / 60000 : null,
      dayOfWeek: new Date(trade.entryTime || Date.now()).toLocaleDateString('en-US', { weekday: 'long' }),
      hourOfDay: new Date(trade.entryTime || Date.now()).getHours()
    }

    this.trades.unshift(tradeRecord)

    // Keep only last MAX_TRADES_STORED
    if (this.trades.length > MAX_TRADES_STORED) {
      this.trades = this.trades.slice(0, MAX_TRADES_STORED)
    }

    this.saveToStorage()
    this.updateLearning()
    this.detectPatterns()

    return tradeRecord
  }

  /**
   * Update an existing trade (e.g., when closing)
   * @param {string} tradeId - Trade ID to update
   * @param {Object} updates - Fields to update
   */
  updateTrade(tradeId, updates) {
    const index = this.trades.findIndex(t => t.id === tradeId)
    if (index === -1) return null

    const trade = this.trades[index]
    const updatedTrade = {
      ...trade,
      ...updates,
      exitPrice: updates.exitPrice || trade.exitPrice,
      exitTime: updates.exitTime || Date.now()
    }

    // Recalculate outcome and P&L
    if (updatedTrade.exitPrice) {
      updatedTrade.outcome = this.calculateOutcome(updatedTrade)
      updatedTrade.pnl = this.calculatePnL(updatedTrade)
      updatedTrade.pnlPercent = this.calculatePnLPercent(updatedTrade)
      updatedTrade.holdDuration = (updatedTrade.exitTime - updatedTrade.entryTime) / 60000
    }

    this.trades[index] = updatedTrade
    this.saveToStorage()
    this.updateLearning()
    this.detectPatterns()

    return updatedTrade
  }

  /**
   * Calculate trade outcome
   */
  calculateOutcome(trade) {
    const direction = trade.action === 'BUY' ? 1 : -1
    const diff = (trade.exitPrice - trade.entryPrice) * direction
    return diff > 0 ? 'WIN' : 'LOSS'
  }

  /**
   * Calculate P&L
   */
  calculatePnL(trade) {
    const direction = trade.action === 'BUY' ? 1 : -1
    return (trade.exitPrice - trade.entryPrice) * trade.quantity * direction
  }

  /**
   * Calculate P&L percentage
   */
  calculatePnLPercent(trade) {
    const direction = trade.action === 'BUY' ? 1 : -1
    return ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * direction
  }

  /**
   * Update learning statistics
   */
  updateLearning() {
    const closedTrades = this.trades.filter(t => t.outcome !== 'OPEN')
    const wins = closedTrades.filter(t => t.outcome === 'WIN')
    const losses = closedTrades.filter(t => t.outcome === 'LOSS')

    this.learning = {
      totalTrades: closedTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      avgWin: wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnlPercent, 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnlPercent, 0) / losses.length) : 0,
      profitFactor: this.calculateProfitFactor(wins, losses),
      bestSymbol: this.findBestDimension('symbol'),
      worstSymbol: this.findWorstDimension('symbol'),
      bestTimeframe: this.findBestDimension('timeframe'),
      bestDayOfWeek: this.findBestDimension('dayOfWeek'),
      bestHourOfDay: this.findBestDimension('hourOfDay'),
      streakCurrent: this.calculateCurrentStreak(),
      streakBest: this.calculateBestStreak(),
      lastUpdated: Date.now()
    }

    localStorage.setItem(STORAGE_KEYS.LEARNING, JSON.stringify(this.learning))
  }

  /**
   * Calculate profit factor
   */
  calculateProfitFactor(wins, losses) {
    const totalWin = wins.reduce((sum, t) => sum + t.pnl, 0)
    const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0))
    return totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? Infinity : 0
  }

  /**
   * Find best performing dimension
   */
  findBestDimension(dimension) {
    const closedTrades = this.trades.filter(t => t.outcome !== 'OPEN')
    if (closedTrades.length < MIN_TRADES_FOR_PATTERN) return null

    const groups = {}
    closedTrades.forEach(trade => {
      const key = trade[dimension]
      if (!key) return
      if (!groups[key]) {
        groups[key] = { wins: 0, total: 0, pnl: 0 }
      }
      groups[key].total++
      groups[key].pnl += trade.pnl
      if (trade.outcome === 'WIN') groups[key].wins++
    })

    let best = null
    let bestWinRate = 0
    Object.entries(groups).forEach(([key, stats]) => {
      if (stats.total >= MIN_TRADES_FOR_PATTERN) {
        const winRate = stats.wins / stats.total
        if (winRate > bestWinRate) {
          bestWinRate = winRate
          best = { key, winRate: winRate * 100, trades: stats.total, pnl: stats.pnl }
        }
      }
    })

    return best
  }

  /**
   * Find worst performing dimension
   */
  findWorstDimension(dimension) {
    const closedTrades = this.trades.filter(t => t.outcome !== 'OPEN')
    if (closedTrades.length < MIN_TRADES_FOR_PATTERN) return null

    const groups = {}
    closedTrades.forEach(trade => {
      const key = trade[dimension]
      if (!key) return
      if (!groups[key]) {
        groups[key] = { wins: 0, total: 0, pnl: 0 }
      }
      groups[key].total++
      groups[key].pnl += trade.pnl
      if (trade.outcome === 'WIN') groups[key].wins++
    })

    let worst = null
    let worstWinRate = 100
    Object.entries(groups).forEach(([key, stats]) => {
      if (stats.total >= MIN_TRADES_FOR_PATTERN) {
        const winRate = stats.wins / stats.total
        if (winRate < worstWinRate) {
          worstWinRate = winRate
          worst = { key, winRate: winRate * 100, trades: stats.total, pnl: stats.pnl }
        }
      }
    })

    return worst
  }

  /**
   * Calculate current win/loss streak
   */
  calculateCurrentStreak() {
    const closedTrades = this.trades.filter(t => t.outcome !== 'OPEN')
    if (closedTrades.length === 0) return 0

    let streak = 0
    const firstOutcome = closedTrades[0].outcome
    for (const trade of closedTrades) {
      if (trade.outcome === firstOutcome) {
        streak++
      } else {
        break
      }
    }
    return firstOutcome === 'WIN' ? streak : -streak
  }

  /**
   * Calculate best streak ever
   */
  calculateBestStreak() {
    const closedTrades = this.trades.filter(t => t.outcome !== 'OPEN')
    if (closedTrades.length === 0) return 0

    let bestStreak = 0
    let currentStreak = 0
    let lastOutcome = null

    for (const trade of [...closedTrades].reverse()) {
      if (trade.outcome === 'WIN') {
        if (lastOutcome === 'WIN') {
          currentStreak++
        } else {
          currentStreak = 1
        }
        bestStreak = Math.max(bestStreak, currentStreak)
      }
      lastOutcome = trade.outcome
    }

    return bestStreak
  }

  /**
   * Detect patterns in trading history
   */
  detectPatterns() {
    const closedTrades = this.trades.filter(t => t.outcome !== 'OPEN')
    if (closedTrades.length < MIN_TRADES_FOR_PATTERN) return

    this.patterns = {
      // Symbol patterns
      symbols: this.analyzeByDimension('symbol'),
      // Timeframe patterns
      timeframes: this.analyzeByDimension('timeframe'),
      // Day of week patterns
      daysOfWeek: this.analyzeByDimension('dayOfWeek'),
      // Hour of day patterns
      hoursOfDay: this.analyzeByDimension('hourOfDay'),
      // Setup type patterns
      setupTypes: this.analyzeByDimension('setupType'),
      // Market condition patterns
      marketConditions: this.analyzeByDimension('marketCondition'),
      // Combined patterns (e.g., symbol + timeframe)
      combined: this.analyzeCombinedPatterns(),
      lastUpdated: Date.now()
    }

    localStorage.setItem(STORAGE_KEYS.PATTERNS, JSON.stringify(this.patterns))
  }

  /**
   * Analyze trades by a single dimension
   */
  analyzeByDimension(dimension) {
    const closedTrades = this.trades.filter(t => t.outcome !== 'OPEN')
    const groups = {}

    closedTrades.forEach(trade => {
      const key = String(trade[dimension] || 'unknown')
      if (!groups[key]) {
        groups[key] = { wins: 0, losses: 0, totalPnl: 0, avgPnlPercent: 0 }
      }
      if (trade.outcome === 'WIN') {
        groups[key].wins++
      } else {
        groups[key].losses++
      }
      groups[key].totalPnl += trade.pnl
    })

    // Calculate derived metrics
    Object.entries(groups).forEach(([key, stats]) => {
      const total = stats.wins + stats.losses
      stats.total = total
      stats.winRate = total > 0 ? (stats.wins / total) * 100 : 0
      stats.avgPnl = total > 0 ? stats.totalPnl / total : 0
    })

    return groups
  }

  /**
   * Analyze combined patterns (e.g., AAPL + 5Min)
   */
  analyzeCombinedPatterns() {
    const closedTrades = this.trades.filter(t => t.outcome !== 'OPEN')
    const combined = {}

    closedTrades.forEach(trade => {
      const key = `${trade.symbol}_${trade.timeframe}`
      if (!combined[key]) {
        combined[key] = { symbol: trade.symbol, timeframe: trade.timeframe, wins: 0, losses: 0, totalPnl: 0 }
      }
      if (trade.outcome === 'WIN') {
        combined[key].wins++
      } else {
        combined[key].losses++
      }
      combined[key].totalPnl += trade.pnl
    })

    // Filter to only patterns with enough data
    const significant = {}
    Object.entries(combined).forEach(([key, stats]) => {
      const total = stats.wins + stats.losses
      if (total >= MIN_TRADES_FOR_PATTERN) {
        significant[key] = {
          ...stats,
          total,
          winRate: (stats.wins / total) * 100
        }
      }
    })

    return significant
  }

  /**
   * Generate suggestions based on current context
   * @param {Object} context - Current trading context
   * @returns {Array} Array of suggestions
   */
  generateSuggestions(context = {}) {
    const suggestions = []
    const { symbol, timeframe, indicators, marketCondition } = context

    if (!symbol) return suggestions

    // Check if we have pattern data for this symbol
    const symbolPattern = this.patterns?.symbols?.[symbol]
    const timeframePattern = this.patterns?.timeframes?.[timeframe]
    const combinedKey = `${symbol}_${timeframe}`
    const combinedPattern = this.patterns?.combined?.[combinedKey]

    // Generate suggestion based on historical performance
    if (combinedPattern && combinedPattern.total >= MIN_TRADES_FOR_PATTERN) {
      const confidence = Math.min(
        combinedPattern.winRate,
        50 + (combinedPattern.total / 2) // More trades = more confidence
      )

      if (combinedPattern.winRate >= 60) {
        suggestions.push({
          id: `suggestion_${Date.now()}`,
          type: 'historical_edge',
          action: combinedPattern.totalPnl > 0 ? 'CONSIDER' : 'CAUTION',
          symbol,
          confidence: Math.round(confidence),
          reasoning: `You have ${combinedPattern.winRate.toFixed(0)}% win rate on ${symbol} with ${timeframe} timeframe (${combinedPattern.total} trades)`,
          risk: combinedPattern.winRate >= 70 ? 'LOW' : 'MEDIUM',
          source: 'pattern_recognition'
        })
      } else if (combinedPattern.winRate < 40) {
        suggestions.push({
          id: `suggestion_${Date.now()}_warning`,
          type: 'historical_warning',
          action: 'AVOID',
          symbol,
          confidence: Math.round(100 - combinedPattern.winRate),
          reasoning: `Historical win rate is only ${combinedPattern.winRate.toFixed(0)}% for ${symbol} on ${timeframe} (${combinedPattern.total} trades)`,
          risk: 'HIGH',
          source: 'pattern_recognition'
        })
      }
    }

    // Check day/time patterns
    const now = new Date()
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
    const hourOfDay = now.getHours()

    const dayPattern = this.patterns?.daysOfWeek?.[dayOfWeek]
    const hourPattern = this.patterns?.hoursOfDay?.[hourOfDay]

    if (dayPattern && dayPattern.total >= MIN_TRADES_FOR_PATTERN && dayPattern.winRate < 40) {
      suggestions.push({
        id: `suggestion_${Date.now()}_day`,
        type: 'timing_warning',
        action: 'CAUTION',
        symbol: null,
        confidence: Math.round(100 - dayPattern.winRate),
        reasoning: `Your win rate on ${dayOfWeek}s is only ${dayPattern.winRate.toFixed(0)}%. Consider reduced position size.`,
        risk: 'MEDIUM',
        source: 'timing_analysis'
      })
    }

    // Streak-based suggestions
    if (this.learning.streakCurrent <= -3) {
      suggestions.push({
        id: `suggestion_${Date.now()}_streak`,
        type: 'streak_warning',
        action: 'PAUSE',
        symbol: null,
        confidence: 90,
        reasoning: `You're on a ${Math.abs(this.learning.streakCurrent)}-trade losing streak. Consider taking a break.`,
        risk: 'HIGH',
        source: 'streak_analysis'
      })
    } else if (this.learning.streakCurrent >= 3) {
      suggestions.push({
        id: `suggestion_${Date.now()}_streak_good`,
        type: 'streak_info',
        action: 'MAINTAIN',
        symbol: null,
        confidence: 70,
        reasoning: `You're on a ${this.learning.streakCurrent}-trade winning streak! Stay disciplined.`,
        risk: 'LOW',
        source: 'streak_analysis'
      })
    }

    return suggestions
  }

  /**
   * Get learning summary for display
   */
  getLearning() {
    return this.learning
  }

  /**
   * Get patterns for display
   */
  getPatterns() {
    return this.patterns
  }

  /**
   * Get recent trades
   */
  getRecentTrades(limit = 10) {
    return this.trades.slice(0, limit)
  }

  /**
   * Get trades by symbol
   */
  getTradesBySymbol(symbol) {
    return this.trades.filter(t => t.symbol === symbol.toUpperCase())
  }

  /**
   * Save to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(this.trades))
    } catch (error) {
      console.error('[AVAMind] Error saving to storage:', error)
    }
  }

  /**
   * Clear all AVA Mind data (for reset)
   */
  clearAllData() {
    this.trades = []
    this.learning = this.initializeLearning()
    this.patterns = {}
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  }

  /**
   * Export data for backup
   */
  exportData() {
    return {
      trades: this.trades,
      learning: this.learning,
      patterns: this.patterns,
      personality: this.personality,
      exportDate: new Date().toISOString(),
      version: 1
    }
  }

  /**
   * Import data from backup
   */
  importData(data) {
    if (data.version !== 1) {
      throw new Error('Unsupported data version')
    }
    this.trades = data.trades || []
    this.learning = data.learning || this.initializeLearning()
    this.patterns = data.patterns || {}
    if (data.personality) {
      this.personality = data.personality
      localStorage.setItem(STORAGE_KEYS.PERSONALITY, JSON.stringify(data.personality))
    }
    this.saveToStorage()
    localStorage.setItem(STORAGE_KEYS.LEARNING, JSON.stringify(this.learning))
    localStorage.setItem(STORAGE_KEYS.PATTERNS, JSON.stringify(this.patterns))
  }
}

// Singleton instance
const avaMindService = new AVAMindService()

export default avaMindService

// Named exports for specific functions
export const recordTrade = (trade) => avaMindService.recordTrade(trade)
export const updateTrade = (id, updates) => avaMindService.updateTrade(id, updates)
export const generateSuggestions = (context) => avaMindService.generateSuggestions(context)
export const getLearning = () => avaMindService.getLearning()
export const getPatterns = () => avaMindService.getPatterns()
export const getRecentTrades = (limit) => avaMindService.getRecentTrades(limit)
export const clearAllData = () => avaMindService.clearAllData()
