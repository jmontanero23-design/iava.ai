/**
 * Risk Controls - PhD++ Position Sizing & Exposure Management
 *
 * Blueprint Reference: docs/blueprint.md (Risk Management & Safeguards section)
 *
 * Core Risk Rules:
 * 1. Per-Trade Risk: 0.25-1.0% of account equity (default 0.5%)
 * 2. Daily Loss Limit: ≥2% triggers trading halt
 * 3. Max Concurrent Risk: 1.5-2% total exposure
 * 4. Correlation Limits: Max exposure per sector/asset class
 * 5. Cooldown Mechanisms: Prevent overtrading
 */

const DEFAULT_RISK_CONFIG = {
  // Per-trade risk
  perTradeRiskPct: 0.5,         // 0.5% of account per trade
  minRiskPct: 0.25,              // Minimum allowed
  maxRiskPct: 1.0,               // Maximum allowed

  // Position sizing
  maxPositionSizePct: 10,        // Max 10% of account per position
  minPositionSizeDollars: 100,   // Minimum position size

  // Daily limits
  dailyLossLimitPct: 2.0,        // Stop trading if down 2%
  dailyMaxTrades: 6,             // Max trades per day

  // Exposure management
  maxConcurrentPositions: 4,     // Max open positions
  maxTotalExposurePct: 40,       // Max 40% of account deployed
  maxConcurrentRiskPct: 2.0,     // Max 2% total at-risk

  // Sector/correlation limits
  maxSectorExposurePct: 15,      // Max 15% per sector
  maxCorrelatedExposurePct: 20,  // Max 20% in correlated assets

  // Cooldown mechanisms
  cooldownAfterLossSec: 300,     // 5 min cooldown after loss
  cooldownAfterWinSec: 0,        // No cooldown after win
  minTimeBetweenTradesSec: 60,   // At least 1 min between trades

  // Trading hours
  allowPreMarket: false,
  allowAfterHours: false,
  tradingStartHour: 9,           // 9:30 AM ET (9.5)
  tradingStartMin: 30,
  tradingEndHour: 16,            // 4:00 PM ET
  tradingEndMin: 0,

  // Emergency controls
  haltTrading: false,            // Manual halt switch
  paperTradingOnly: true,        // Safety: default to paper
}

/**
 * Load risk configuration from localStorage
 */
export function getRiskConfig() {
  try {
    const stored = localStorage.getItem('iava.riskConfig')
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_RISK_CONFIG, ...parsed }
    }
  } catch (e) {
    console.warn('[Risk] Failed to load config:', e)
  }
  return { ...DEFAULT_RISK_CONFIG }
}

/**
 * Save risk configuration to localStorage
 */
export function saveRiskConfig(config) {
  try {
    const merged = { ...DEFAULT_RISK_CONFIG, ...config }
    localStorage.setItem('iava.riskConfig', JSON.stringify(merged))
    return merged
  } catch (e) {
    console.error('[Risk] Failed to save config:', e)
    return null
  }
}

/**
 * Reset to default configuration
 */
export function resetRiskConfig() {
  try {
    localStorage.removeItem('iava.riskConfig')
    return { ...DEFAULT_RISK_CONFIG }
  } catch (e) {
    console.error('[Risk] Failed to reset config:', e)
    return null
  }
}

/**
 * Calculate position size based on risk parameters
 * Formula: qty = (riskPct × equity) / |entry – stop|
 */
export function calculatePositionSize({ entry, stop, equity, riskPct, maxPositionPct }) {
  if (!entry || !stop || !equity || entry === stop) {
    return { qty: 0, error: 'Invalid parameters' }
  }

  const riskDollars = equity * (riskPct / 100)
  const stopDistance = Math.abs(entry - stop)

  if (stopDistance === 0) {
    return { qty: 0, error: 'Stop distance is zero' }
  }

  // Calculate qty based on risk
  let qty = Math.floor(riskDollars / stopDistance)

  // Apply max position size constraint
  const maxPositionDollars = equity * (maxPositionPct / 100)
  const maxQty = Math.floor(maxPositionDollars / entry)

  if (qty > maxQty) {
    qty = maxQty
    return {
      qty,
      riskDollars: qty * stopDistance,
      riskPct: (qty * stopDistance / equity) * 100,
      positionValue: qty * entry,
      warning: `Position size limited by max position constraint (${maxPositionPct}%)`
    }
  }

  return {
    qty,
    riskDollars,
    riskPct,
    positionValue: qty * entry,
    stopDistance,
    rValue: stopDistance
  }
}

/**
 * Get daily trading statistics from localStorage
 */
export function getDailyStats() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const stored = localStorage.getItem(`iava.dailyStats.${today}`)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('[Risk] Failed to load daily stats:', e)
  }

  return {
    date: new Date().toISOString().split('T')[0],
    tradesCount: 0,
    realizedPnL: 0,
    realizedPnLPct: 0,
    wins: 0,
    losses: 0,
    lastTradeTime: null,
    lastLossTime: null,
    lastWinTime: null
  }
}

/**
 * Update daily trading statistics
 */
export function updateDailyStats(update) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const current = getDailyStats()
    const updated = { ...current, ...update, date: today }
    localStorage.setItem(`iava.dailyStats.${today}`, JSON.stringify(updated))
    return updated
  } catch (e) {
    console.error('[Risk] Failed to update daily stats:', e)
    return null
  }
}

/**
 * Validate if a new trade is allowed based on risk controls
 */
export function validateTrade({
  symbol,
  side,
  entry,
  stop,
  equity,
  currentPositions = [],
  sector = null,
  config = null
}) {
  const riskConfig = config || getRiskConfig()
  const dailyStats = getDailyStats()
  const now = Date.now()

  const violations = []
  const warnings = []

  // 1. Check if trading is halted
  if (riskConfig.haltTrading) {
    violations.push({
      rule: 'Trading Halted',
      message: 'Manual trading halt is active. Disable in Risk Controls to resume.'
    })
  }

  // 2. Check daily loss limit
  if (dailyStats.realizedPnLPct <= -riskConfig.dailyLossLimitPct) {
    violations.push({
      rule: 'Daily Loss Limit',
      message: `Daily loss limit of ${riskConfig.dailyLossLimitPct}% exceeded (${dailyStats.realizedPnLPct.toFixed(2)}%). Trading halted for today.`
    })
  }

  // 3. Check max trades per day
  if (dailyStats.tradesCount >= riskConfig.dailyMaxTrades) {
    violations.push({
      rule: 'Max Daily Trades',
      message: `Maximum ${riskConfig.dailyMaxTrades} trades per day reached. No more trades allowed today.`
    })
  }

  // 4. Check cooldown period
  if (dailyStats.lastTradeTime) {
    const timeSinceLastTrade = (now - new Date(dailyStats.lastTradeTime).getTime()) / 1000
    if (timeSinceLastTrade < riskConfig.minTimeBetweenTradesSec) {
      violations.push({
        rule: 'Trade Cooldown',
        message: `Must wait ${riskConfig.minTimeBetweenTradesSec}s between trades (${Math.ceil(riskConfig.minTimeBetweenTradesSec - timeSinceLastTrade)}s remaining)`
      })
    }
  }

  // 5. Check loss cooldown
  if (dailyStats.lastLossTime) {
    const timeSinceLoss = (now - new Date(dailyStats.lastLossTime).getTime()) / 1000
    if (timeSinceLoss < riskConfig.cooldownAfterLossSec) {
      violations.push({
        rule: 'Loss Cooldown',
        message: `Cooldown active after loss (${Math.ceil(riskConfig.cooldownAfterLossSec - timeSinceLoss)}s remaining)`
      })
    }
  }

  // 6. Check max concurrent positions
  if (currentPositions.length >= riskConfig.maxConcurrentPositions) {
    violations.push({
      rule: 'Max Positions',
      message: `Maximum ${riskConfig.maxConcurrentPositions} concurrent positions reached`
    })
  }

  // 7. Check if already have a position in this symbol
  const existingPosition = currentPositions.find(p => p.symbol === symbol)
  if (existingPosition) {
    warnings.push({
      rule: 'Duplicate Symbol',
      message: `Already have a ${existingPosition.side} position in ${symbol}`
    })
  }

  // 8. Calculate and validate position size
  const sizing = calculatePositionSize({
    entry,
    stop,
    equity,
    riskPct: riskConfig.perTradeRiskPct,
    maxPositionPct: riskConfig.maxPositionSizePct
  })

  if (sizing.error) {
    violations.push({
      rule: 'Position Sizing Error',
      message: sizing.error
    })
  }

  if (sizing.warning) {
    warnings.push({
      rule: 'Position Size Warning',
      message: sizing.warning
    })
  }

  if (sizing.qty === 0) {
    violations.push({
      rule: 'Zero Quantity',
      message: 'Calculated position size is 0 shares/contracts'
    })
  }

  if (sizing.positionValue < riskConfig.minPositionSizeDollars) {
    violations.push({
      rule: 'Minimum Position Size',
      message: `Position value $${sizing.positionValue.toFixed(2)} below minimum $${riskConfig.minPositionSizeDollars}`
    })
  }

  // 9. Check total exposure
  const currentExposure = currentPositions.reduce((sum, p) => {
    return sum + (parseFloat(p.market_value || p.marketValue || 0))
  }, 0)

  const newExposure = currentExposure + sizing.positionValue
  const exposurePct = (newExposure / equity) * 100

  if (exposurePct > riskConfig.maxTotalExposurePct) {
    violations.push({
      rule: 'Max Total Exposure',
      message: `Total exposure ${exposurePct.toFixed(1)}% exceeds limit ${riskConfig.maxTotalExposurePct}%`
    })
  }

  // 10. Check total concurrent risk
  const currentRisk = currentPositions.reduce((sum, p) => {
    // Estimate risk as position value * 0.5% (conservative)
    const posValue = parseFloat(p.market_value || p.marketValue || 0)
    return sum + (posValue * 0.005)
  }, 0)

  const totalRisk = currentRisk + sizing.riskDollars
  const totalRiskPct = (totalRisk / equity) * 100

  if (totalRiskPct > riskConfig.maxConcurrentRiskPct) {
    violations.push({
      rule: 'Max Concurrent Risk',
      message: `Total risk ${totalRiskPct.toFixed(2)}% exceeds limit ${riskConfig.maxConcurrentRiskPct}%`
    })
  }

  // 11. Check sector exposure (if sector provided)
  if (sector) {
    const sectorExposure = currentPositions
      .filter(p => p.sector === sector)
      .reduce((sum, p) => sum + (parseFloat(p.market_value || p.marketValue || 0)), 0)

    const sectorExposurePct = ((sectorExposure + sizing.positionValue) / equity) * 100

    if (sectorExposurePct > riskConfig.maxSectorExposurePct) {
      warnings.push({
        rule: 'Sector Concentration',
        message: `${sector} exposure ${sectorExposurePct.toFixed(1)}% exceeds recommended limit ${riskConfig.maxSectorExposurePct}%`
      })
    }
  }

  // 12. Check trading hours (for stocks)
  const currentHour = new Date().getHours()
  const currentMin = new Date().getMinutes()
  const currentTimeDecimal = currentHour + (currentMin / 60)
  const startTime = riskConfig.tradingStartHour + (riskConfig.tradingStartMin / 60)
  const endTime = riskConfig.tradingEndHour + (riskConfig.tradingEndMin / 60)

  const isMarketHours = currentTimeDecimal >= startTime && currentTimeDecimal < endTime

  if (!isMarketHours && !riskConfig.allowPreMarket && !riskConfig.allowAfterHours) {
    warnings.push({
      rule: 'Market Hours',
      message: 'Outside regular trading hours. Enable extended hours in Risk Controls if intended.'
    })
  }

  return {
    allowed: violations.length === 0,
    violations,
    warnings,
    sizing,
    metrics: {
      currentPositions: currentPositions.length,
      currentExposure,
      currentExposurePct: (currentExposure / equity) * 100,
      newExposure,
      newExposurePct: exposurePct,
      currentRisk,
      currentRiskPct: (currentRisk / equity) * 100,
      totalRisk,
      totalRiskPct,
      dailyPnL: dailyStats.realizedPnL,
      dailyPnLPct: dailyStats.realizedPnLPct,
      tradesRemaining: Math.max(0, riskConfig.dailyMaxTrades - dailyStats.tradesCount)
    }
  }
}

/**
 * Record a completed trade for daily stats
 */
export function recordTrade({ pnl, pnlPct, equity }) {
  const dailyStats = getDailyStats()
  const now = new Date().toISOString()

  const updated = {
    tradesCount: dailyStats.tradesCount + 1,
    realizedPnL: dailyStats.realizedPnL + pnl,
    realizedPnLPct: dailyStats.realizedPnLPct + pnlPct,
    wins: pnl > 0 ? dailyStats.wins + 1 : dailyStats.wins,
    losses: pnl < 0 ? dailyStats.losses + 1 : dailyStats.losses,
    lastTradeTime: now,
    lastWinTime: pnl > 0 ? now : dailyStats.lastWinTime,
    lastLossTime: pnl < 0 ? now : dailyStats.lastLossTime
  }

  return updateDailyStats(updated)
}

/**
 * Clear daily stats (call at start of new trading day)
 */
export function clearDailyStats() {
  try {
    const today = new Date().toISOString().split('T')[0]
    localStorage.removeItem(`iava.dailyStats.${today}`)
    return getDailyStats()
  } catch (e) {
    console.error('[Risk] Failed to clear daily stats:', e)
    return null
  }
}

export default {
  getRiskConfig,
  saveRiskConfig,
  resetRiskConfig,
  calculatePositionSize,
  validateTrade,
  getDailyStats,
  updateDailyStats,
  recordTrade,
  clearDailyStats,
  DEFAULT_RISK_CONFIG
}
