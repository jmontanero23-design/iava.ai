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
    this.isLoadingFromDB = false
    this.dbLoaded = false // Track if DB has finished loading
    this.dbSyncQueue = [] // Queue trades for DB sync
    this.dbSyncTimer = null
    this.loadFromStorage()
    this.loadFromDatabase() // 🔥 NEW: Load from database (async)
  }

  /**
   * Load all data from localStorage (fallback/cache)
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
   * 🔥 NEW: Load from database (hybrid approach)
   * Keeps recent 100 trades in memory, rest in DB
   */
  async loadFromDatabase() {
    if (this.isLoadingFromDB) return
    this.isLoadingFromDB = true

    try {
      // Load recent trades and learning stats from DB
      const [tradesRes, learningRes] = await Promise.all([
        fetch('/api/ava-mind/trades?limit=100'),
        fetch('/api/ava-mind/learning')
      ])

      if (tradesRes.ok) {
        const { trades } = await tradesRes.json()
        if (trades && trades.length > 0) {
          // Convert DB format to service format
          this.trades = trades.map(t => ({
            id: t.id,
            symbol: t.symbol,
            action: t.side?.toUpperCase() || 'BUY',
            entryPrice: parseFloat(t.entry_price) || 0,
            exitPrice: t.exit_price ? parseFloat(t.exit_price) : null,
            quantity: parseFloat(t.quantity) || 0,
            outcome: t.outcome || 'OPEN',
            pnl: t.pnl ? parseFloat(t.pnl) : 0,
            pnlPercent: t.pnl_percent ? parseFloat(t.pnl_percent) : 0,
            timeframe: t.timeframe || '5Min',
            setupType: t.setup_type || 'unknown',
            indicators: t.indicators || {},
            marketCondition: t.market_condition || 'unknown',
            entryTime: new Date(t.entry_time).getTime(),
            exitTime: t.exit_time ? new Date(t.exit_time).getTime() : null,
            holdDuration: t.hold_duration_minutes || null,
            dayOfWeek: t.day_of_week || null,
            hourOfDay: t.hour_of_day || null,
            stopLoss: t.stop_loss ? parseFloat(t.stop_loss) : null,
            takeProfit: t.take_profit ? parseFloat(t.take_profit) : null
          }))
          console.log('[AVAMind] Loaded', this.trades.length, 'trades from database')
        }
      }

      if (learningRes.ok) {
        const { learning, patterns } = await learningRes.json()
        if (learning) {
          this.learning = {
            totalTrades: learning.total_trades || 0,
            wins: learning.winning_trades || 0,
            losses: learning.losing_trades || 0,
            winRate: parseFloat(learning.win_rate) || 0,
            avgWin: parseFloat(learning.average_win) || 0,
            avgLoss: parseFloat(learning.average_loss) || 0,
            profitFactor: parseFloat(learning.profit_factor) || 0,
            bestSymbol: learning.best_symbol || null,
            bestDay: learning.best_day_of_week || null,
            bestHour: learning.best_hour_of_day || null,
            currentStreak: learning.current_streak || 0,
            bestStreak: learning.best_streak || 0,
            worstStreak: learning.worst_streak || 0,
            archetype: learning.archetype || null,
            emotionalState: learning.emotional_state || 'Neutral',
            lastUpdated: learning.last_updated
          }
          console.log('[AVAMind] Loaded learning stats from database')
        }

        if (patterns && patterns.length > 0) {
          // Convert patterns array to object format
          this.patterns = patterns.reduce((acc, p) => {
            const key = `${p.pattern_type}_${p.dimension}`
            acc[key] = {
              type: p.pattern_type,
              dimension: p.dimension,
              winRate: parseFloat(p.win_rate) || 0,
              tradeCount: p.trade_count || 0,
              strength: p.sample_size_adequate ? 'strong' : 'weak'
            }
            return acc
          }, {})
          console.log('[AVAMind] Loaded', patterns.length, 'patterns from database')
        }
      }

      // Sync to localStorage as cache
      this.saveToStorage()

    } catch (error) {
      console.error('[AVAMind] Error loading from database:', error)
      // Fallback to localStorage data already loaded
      console.log('[AVAMind] Falling back to localStorage data')
    } finally {
      this.isLoadingFromDB = false
      this.dbLoaded = true

      // Dispatch event to notify components that data is ready
      window.dispatchEvent(new CustomEvent('ava.mind.dataLoaded', {
        detail: {
          tradesCount: this.trades.length,
          hasLearning: !!this.learning,
          patternsCount: Object.keys(this.patterns || {}).length
        }
      }))
      console.log('[AVAMind] Database loading complete, data ready')
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
      hourOfDay: new Date(trade.entryTime || Date.now()).getHours(),
      stopLoss: trade.stopLoss || null, // Track stop loss for risk management
      takeProfit: trade.takeProfit || null
    }

    this.trades.unshift(tradeRecord)

    // Keep only last MAX_TRADES_STORED
    if (this.trades.length > MAX_TRADES_STORED) {
      this.trades = this.trades.slice(0, MAX_TRADES_STORED)
    }

    this.saveToStorage()
    this.updateLearning()
    this.detectPatterns()

    // 🔥 NEW: Sync to database (queued to avoid rate limiting)
    this.queueDatabaseSync(tradeRecord)

    // Check for risk-manager achievement (10 consecutive trades with stop loss)
    if (trade.stopLoss && typeof window !== 'undefined') {
      const recent10 = this.trades.slice(0, 10)
      if (recent10.length >= 10 && recent10.every(t => t.stopLoss)) {
        window.dispatchEvent(new CustomEvent('iava.achievement', {
          detail: { achievementId: 'risk-manager' }
        }))
      }
    }

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

    // Check for diamond-hands achievement (30+ day winning hold)
    if (updatedTrade.holdDuration && updatedTrade.outcome === 'WIN' && typeof window !== 'undefined') {
      const daysHeld = updatedTrade.holdDuration / 1440 // Convert minutes to days
      if (daysHeld >= 30) {
        window.dispatchEvent(new CustomEvent('iava.achievement', {
          detail: { achievementId: 'diamond-hands' }
        }))
      }
    }

    // Check for volatility-surfer achievement (profit during high volatility)
    // Proxy: Winning trade with >5% gain in <60 minutes (quick, volatile move)
    if (updatedTrade.outcome === 'WIN' && typeof window !== 'undefined') {
      const pnlPercent = Math.abs(updatedTrade.pnlPercent || 0)
      const holdMinutes = updatedTrade.holdDuration || 0

      if (pnlPercent >= 5 && holdMinutes <= 60 && holdMinutes > 0) {
        window.dispatchEvent(new CustomEvent('iava.achievement', {
          detail: { achievementId: 'volatility-surfer' }
        }))
      }
    }

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

    // Check for streak-master achievement (5 wins in a row)
    if (this.learning.streakCurrent >= 5 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('iava.achievement', {
        detail: { achievementId: 'streak-master' }
      }))
    }

    // Check for profitable-week achievement (positive weekly P&L)
    if (typeof window !== 'undefined') {
      const now = Date.now()
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000)
      const weekTrades = closedTrades.filter(t => t.exitTime >= oneWeekAgo)

      if (weekTrades.length >= 3) { // Need at least 3 trades in the week
        const weekPnL = weekTrades.reduce((sum, t) => sum + t.pnl, 0)
        if (weekPnL > 0) {
          window.dispatchEvent(new CustomEvent('iava.achievement', {
            detail: { achievementId: 'profitable-week' }
          }))
        }
      }
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
    // If database is still loading, return loading indicator
    if (!this.dbLoaded) {
      return {
        ...this.initializeLearning(),
        isLoading: true,
        message: 'Loading from database...'
      }
    }
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
   * 🔥 NEW: Queue trade for database sync (debounced)
   * Batches multiple trades into single API call
   */
  queueDatabaseSync(trade) {
    this.dbSyncQueue.push(trade)

    // Clear existing timer
    if (this.dbSyncTimer) {
      clearTimeout(this.dbSyncTimer)
    }

    // Debounce: sync after 3 seconds of inactivity OR queue reaches 10 trades
    if (this.dbSyncQueue.length >= 10) {
      this.syncToDatabase()
    } else {
      this.dbSyncTimer = setTimeout(() => this.syncToDatabase(), 3000)
    }
  }

  /**
   * 🔥 NEW: Sync queued trades to database
   */
  async syncToDatabase() {
    if (this.dbSyncQueue.length === 0) return

    const tradesToSync = [...this.dbSyncQueue]
    this.dbSyncQueue = []

    try {
      // Convert to database format
      const dbTrades = tradesToSync.map(t => ({
        symbol: t.symbol,
        side: t.action?.toLowerCase(),
        quantity: t.quantity,
        entry_price: t.entryPrice,
        exit_price: t.exitPrice,
        outcome: t.outcome,
        pnl: t.pnl,
        pnl_percent: t.pnlPercent,
        entry_time: new Date(t.entryTime).toISOString(),
        exit_time: t.exitTime ? new Date(t.exitTime).toISOString() : null,
        hold_duration_minutes: t.holdDuration,
        day_of_week: t.dayOfWeek,
        hour_of_day: t.hourOfDay,
        timeframe: t.timeframe,
        setup_type: t.setupType,
        market_condition: t.marketCondition,
        indicators: t.indicators,
        stop_loss: t.stopLoss,
        take_profit: t.takeProfit
      }))

      // Batch create trades
      for (const trade of dbTrades) {
        const res = await fetch('/api/ava-mind/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trade)
        })

        if (!res.ok) {
          console.error('[AVAMind] Failed to sync trade:', await res.text())
        }
      }

      console.log('[AVAMind] Synced', tradesToSync.length, 'trades to database')
    } catch (error) {
      console.error('[AVAMind] Database sync error:', error)
      // Re-queue failed trades
      this.dbSyncQueue.unshift(...tradesToSync)
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
