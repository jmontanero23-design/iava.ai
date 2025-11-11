/**
 * Risk Advisor
 * Real-time portfolio risk analysis and position sizing recommendations
 *
 * Features:
 * - Portfolio-level risk metrics (Value at Risk, Expected Shortfall)
 * - Position sizing based on Kelly Criterion and fixed fractional
 * - Correlation-adjusted risk
 * - Maximum drawdown tracking
 * - Risk/reward analysis
 * - Real-time alerts for excessive risk exposure
 */

/**
 * Calculate portfolio Value at Risk (VaR)
 * 95% confidence level, 1-day horizon
 */
export function calculateVaR(positions, confidenceLevel = 0.95) {
  if (positions.length === 0) return { var: 0, portfolioValue: 0 }

  const portfolioValue = positions.reduce((sum, p) => sum + p.value, 0)

  // Simplified VaR calculation (assumes normal distribution)
  // In production, use historical simulation or Monte Carlo
  const returns = positions.map(p => p.expectedReturn || 0)
  const volatilities = positions.map(p => p.volatility || 0.02)

  // Portfolio volatility (simplified - assumes uncorrelated for now)
  const portfolioVolatility = Math.sqrt(
    volatilities.reduce((sum, vol, i) => {
      const weight = positions[i].value / portfolioValue
      return sum + Math.pow(weight * vol, 2)
    }, 0)
  )

  // Z-score for confidence level
  const zScores = {
    0.90: 1.28,
    0.95: 1.65,
    0.99: 2.33
  }
  const z = zScores[confidenceLevel] || 1.65

  const var1Day = portfolioValue * portfolioVolatility * z

  return {
    var: var1Day,
    portfolioValue,
    portfolioVolatility,
    varPercent: (var1Day / portfolioValue) * 100
  }
}

/**
 * Calculate Expected Shortfall (Conditional VaR)
 * Average loss beyond VaR threshold
 */
export function calculateExpectedShortfall(positions, confidenceLevel = 0.95) {
  const varResult = calculateVaR(positions, confidenceLevel)

  // ES is typically 20-30% higher than VaR for normal distribution
  const esMultiplier = 1.25

  return {
    ...varResult,
    expectedShortfall: varResult.var * esMultiplier,
    esPercent: varResult.varPercent * esMultiplier
  }
}

/**
 * Calculate optimal position size using Kelly Criterion
 */
export function calculateKellySize(winRate, avgWin, avgLoss, accountSize, maxKelly = 0.25) {
  if (avgLoss === 0) return 0

  const winLossRatio = avgWin / avgLoss
  const kellyFraction = (winRate * winLossRatio - (1 - winRate)) / winLossRatio

  // Apply maximum Kelly constraint (usually 25% or 50% of full Kelly)
  const conservativeKelly = Math.max(0, Math.min(kellyFraction * maxKelly, maxKelly))

  return {
    kellyFraction: kellyFraction,
    recommendedFraction: conservativeKelly,
    positionSize: accountSize * conservativeKelly,
    note: kellyFraction > 0.5 ? 'Very aggressive - use caution' : kellyFraction < 0 ? 'Negative expectancy - avoid trade' : 'Within normal range'
  }
}

/**
 * Calculate position size using fixed fractional risk
 */
export function calculateFixedFractionalSize(accountSize, riskPercent, entryPrice, stopPrice) {
  const riskPerShare = Math.abs(entryPrice - stopPrice)
  if (riskPerShare === 0) return 0

  const riskAmount = accountSize * (riskPercent / 100)
  const shares = Math.floor(riskAmount / riskPerShare)
  const positionValue = shares * entryPrice

  return {
    shares,
    positionValue,
    riskAmount,
    riskPerShare,
    positionPercent: (positionValue / accountSize) * 100
  }
}

/**
 * Analyze portfolio risk distribution
 */
export function analyzePortfolioRisk(positions) {
  const totalValue = positions.reduce((sum, p) => sum + p.value, 0)

  if (totalValue === 0) {
    return {
      concentration: {},
      largestPosition: null,
      riskScore: 0,
      warnings: []
    }
  }

  // Calculate position concentrations
  const concentration = positions.map(p => ({
    symbol: p.symbol,
    value: p.value,
    percent: (p.value / totalValue) * 100,
    risk: p.value * (p.volatility || 0.02)
  }))

  // Sort by size
  concentration.sort((a, b) => b.percent - a.percent)

  const largestPosition = concentration[0]
  const warnings = []

  // Risk checks
  if (largestPosition && largestPosition.percent > 25) {
    warnings.push({
      level: 'high',
      message: `Single position (${largestPosition.symbol}) exceeds 25% of portfolio`,
      recommendation: 'Consider reducing position size to improve diversification'
    })
  }

  if (concentration.length > 0 && concentration.slice(0, 3).reduce((sum, p) => sum + p.percent, 0) > 60) {
    warnings.push({
      level: 'medium',
      message: 'Top 3 positions represent >60% of portfolio',
      recommendation: 'Consider adding more positions for better diversification'
    })
  }

  // Calculate Herfindahl index (concentration measure)
  const herfindahl = concentration.reduce((sum, p) => sum + Math.pow(p.percent / 100, 2), 0)

  // Risk score (0-100, lower is better)
  // Based on concentration, largest position, and number of positions
  const riskScore = Math.min(100, (
    (largestPosition.percent / 50) * 40 +  // 40 points for concentration
    herfindahl * 100 * 30 +                 // 30 points for Herfindahl
    (1 / Math.sqrt(concentration.length)) * 30  // 30 points for diversification
  ))

  return {
    concentration,
    largestPosition,
    herfindahl,
    riskScore,
    warnings,
    recommendation: getRiskRecommendation(riskScore)
  }
}

/**
 * Get risk recommendation based on score
 */
function getRiskRecommendation(score) {
  if (score < 30) {
    return {
      level: 'low',
      label: 'Well Diversified',
      message: 'Portfolio risk is well managed',
      color: 'emerald',
      icon: '✓'
    }
  }

  if (score < 50) {
    return {
      level: 'medium',
      label: 'Moderate Risk',
      message: 'Portfolio concentration is acceptable but could be improved',
      color: 'yellow',
      icon: '⚠'
    }
  }

  if (score < 70) {
    return {
      level: 'high',
      label: 'High Concentration',
      message: 'Portfolio is heavily concentrated - consider diversification',
      color: 'orange',
      icon: '⚠'
    }
  }

  return {
    level: 'critical',
    label: 'Excessive Risk',
    message: 'Portfolio concentration is dangerously high',
    color: 'rose',
    icon: '✕'
  }
}

/**
 * Calculate maximum drawdown from equity curve
 */
export function calculateMaxDrawdown(equityCurve) {
  if (equityCurve.length === 0) return { maxDrawdown: 0, maxDrawdownPercent: 0 }

  let peak = equityCurve[0]
  let maxDD = 0
  let maxDDPercent = 0
  let peakDate = null
  let troughDate = null

  for (let i = 0; i < equityCurve.length; i++) {
    const current = equityCurve[i].value
    const date = equityCurve[i].date

    if (current > peak) {
      peak = current
      peakDate = date
    }

    const dd = peak - current
    const ddPercent = (dd / peak) * 100

    if (dd > maxDD) {
      maxDD = dd
      maxDDPercent = ddPercent
      troughDate = date
    }
  }

  return {
    maxDrawdown: maxDD,
    maxDrawdownPercent: maxDDPercent,
    peak,
    peakDate,
    troughDate,
    warning: maxDDPercent > 20 ? 'Excessive drawdown - review risk management' : null
  }
}

/**
 * Get real-time risk alerts
 */
export function getRiskAlerts(portfolio, settings = {}) {
  const {
    maxPositionSize = 25,      // Max single position %
    maxDrawdown = 20,          // Max acceptable drawdown %
    minDiversification = 5,    // Min number of positions
    maxCorrelation = 0.7       // Max correlation threshold
  } = settings

  const alerts = []
  const totalValue = portfolio.reduce((sum, p) => sum + p.value, 0)

  // Check position sizes
  for (const position of portfolio) {
    const positionPercent = (position.value / totalValue) * 100

    if (positionPercent > maxPositionSize) {
      alerts.push({
        type: 'position_size',
        level: 'high',
        symbol: position.symbol,
        message: `${position.symbol} position (${positionPercent.toFixed(1)}%) exceeds ${maxPositionSize}% limit`,
        action: 'Reduce position size'
      })
    }
  }

  // Check diversification
  if (portfolio.length < minDiversification) {
    alerts.push({
      type: 'diversification',
      level: 'medium',
      message: `Portfolio has only ${portfolio.length} positions (minimum ${minDiversification} recommended)`,
      action: 'Add more uncorrelated positions'
    })
  }

  // Check drawdown (if equity curve provided)
  if (portfolio.equityCurve) {
    const { maxDrawdownPercent } = calculateMaxDrawdown(portfolio.equityCurve)

    if (maxDrawdownPercent > maxDrawdown) {
      alerts.push({
        type: 'drawdown',
        level: 'critical',
        message: `Current drawdown (${maxDrawdownPercent.toFixed(1)}%) exceeds ${maxDrawdown}% threshold`,
        action: 'Reduce risk exposure immediately'
      })
    }
  }

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    criticalCount: alerts.filter(a => a.level === 'critical').length,
    highCount: alerts.filter(a => a.level === 'high').length
  }
}

export default {
  calculateVaR,
  calculateExpectedShortfall,
  calculateKellySize,
  calculateFixedFractionalSize,
  analyzePortfolioRisk,
  calculateMaxDrawdown,
  getRiskAlerts
}
