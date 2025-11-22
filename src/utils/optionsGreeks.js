/**
 * Options Greeks Calculator - Elite PhD Level
 * Real-time calculation of Delta, Gamma, Theta, Vega, Rho
 * Using Black-Scholes model for European options
 */

// Standard normal cumulative distribution function
function normCDF(x) {
  const a1 = 0.31938153
  const a2 = -0.356563782
  const a3 = 1.781477937
  const a4 = -1.821255978
  const a5 = 1.330274429
  const p = 0.2316419

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)

  const t = 1 / (1 + p * x)
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return 0.5 * (1 + sign * y)
}

// Standard normal probability density function
function normPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

/**
 * Black-Scholes Options Pricing Model
 * @param {Object} params - Option parameters
 * @returns {Object} Option price and Greeks
 */
export function calculateBlackScholes({
  spotPrice,      // Current price of underlying
  strikePrice,    // Strike price of option
  timeToExpiry,   // Time to expiration in years
  volatility,     // Implied volatility (annualized)
  riskFreeRate,   // Risk-free interest rate
  dividendYield = 0, // Dividend yield
  optionType = 'call' // 'call' or 'put'
}) {
  // Validate inputs
  if (timeToExpiry <= 0) {
    return {
      price: optionType === 'call' ?
        Math.max(0, spotPrice - strikePrice) :
        Math.max(0, strikePrice - spotPrice),
      delta: optionType === 'call' ? (spotPrice >= strikePrice ? 1 : 0) : (spotPrice <= strikePrice ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0
    }
  }

  const S = spotPrice
  const K = strikePrice
  const T = timeToExpiry
  const r = riskFreeRate
  const q = dividendYield
  const σ = volatility
  const sqrt_T = Math.sqrt(T)

  // Calculate d1 and d2
  const d1 = (Math.log(S / K) + (r - q + 0.5 * σ * σ) * T) / (σ * sqrt_T)
  const d2 = d1 - σ * sqrt_T

  // Pre-calculate frequently used values
  const Nd1 = normCDF(d1)
  const Nd2 = normCDF(d2)
  const Nminusd1 = normCDF(-d1)
  const Nminusd2 = normCDF(-d2)
  const nd1 = normPDF(d1)
  const nd2 = normPDF(d2)

  const exp_neg_qT = Math.exp(-q * T)
  const exp_neg_rT = Math.exp(-r * T)

  let price, delta, gamma, theta, vega, rho

  if (optionType === 'call') {
    // Call option price
    price = S * exp_neg_qT * Nd1 - K * exp_neg_rT * Nd2

    // Call Greeks
    delta = exp_neg_qT * Nd1
    gamma = exp_neg_qT * nd1 / (S * σ * sqrt_T)
    theta = (-S * nd1 * σ * exp_neg_qT / (2 * sqrt_T)
            - r * K * exp_neg_rT * Nd2
            + q * S * exp_neg_qT * Nd1) / 365 // Convert to daily theta
    vega = S * exp_neg_qT * nd1 * sqrt_T / 100 // Divide by 100 for 1% vol move
    rho = K * T * exp_neg_rT * Nd2 / 100 // Divide by 100 for 1% rate move

  } else {
    // Put option price
    price = K * exp_neg_rT * Nminusd2 - S * exp_neg_qT * Nminusd1

    // Put Greeks
    delta = -exp_neg_qT * Nminusd1
    gamma = exp_neg_qT * nd1 / (S * σ * sqrt_T)
    theta = (-S * nd1 * σ * exp_neg_qT / (2 * sqrt_T)
            + r * K * exp_neg_rT * Nminusd2
            - q * S * exp_neg_qT * Nminusd1) / 365 // Convert to daily theta
    vega = S * exp_neg_qT * nd1 * sqrt_T / 100 // Same as call
    rho = -K * T * exp_neg_rT * Nminusd2 / 100 // Negative for puts
  }

  return {
    price: Math.max(0, price),
    delta,
    gamma,
    theta,
    vega,
    rho,
    // Additional analytics
    intrinsicValue: optionType === 'call' ?
      Math.max(0, S - K) :
      Math.max(0, K - S),
    timeValue: Math.max(0, price - (optionType === 'call' ?
      Math.max(0, S - K) :
      Math.max(0, K - S))),
    moneyness: S / K,
    breakeven: optionType === 'call' ? K + price : K - price
  }
}

/**
 * Calculate implied volatility using Newton-Raphson method
 * @param {Object} params - Market parameters
 * @returns {number} Implied volatility
 */
export function calculateImpliedVolatility({
  optionPrice,
  spotPrice,
  strikePrice,
  timeToExpiry,
  riskFreeRate,
  dividendYield = 0,
  optionType = 'call'
}) {
  let σ = 0.2 // Initial guess 20% volatility
  const tolerance = 0.00001
  const maxIterations = 100

  for (let i = 0; i < maxIterations; i++) {
    const bs = calculateBlackScholes({
      spotPrice,
      strikePrice,
      timeToExpiry,
      volatility: σ,
      riskFreeRate,
      dividendYield,
      optionType
    })

    const diff = bs.price - optionPrice

    if (Math.abs(diff) < tolerance) {
      return σ
    }

    // Vega is the derivative of price with respect to volatility
    const vega = bs.vega * 100 // Multiply back since we divided by 100

    if (Math.abs(vega) < 0.00001) {
      break // Vega too small, can't continue
    }

    σ = σ - diff / vega

    // Keep volatility in reasonable range
    σ = Math.max(0.001, Math.min(5, σ))
  }

  return σ
}

/**
 * Calculate portfolio Greeks for multiple options positions
 * @param {Array} positions - Array of option positions
 * @returns {Object} Portfolio-level Greeks
 */
export function calculatePortfolioGreeks(positions) {
  const portfolio = {
    totalDelta: 0,
    totalGamma: 0,
    totalTheta: 0,
    totalVega: 0,
    totalRho: 0,
    totalValue: 0,
    positions: []
  }

  positions.forEach(position => {
    const greeks = calculateBlackScholes({
      spotPrice: position.spotPrice,
      strikePrice: position.strikePrice,
      timeToExpiry: position.timeToExpiry,
      volatility: position.volatility,
      riskFreeRate: position.riskFreeRate,
      dividendYield: position.dividendYield || 0,
      optionType: position.optionType
    })

    const quantity = position.quantity || 1
    const multiplier = position.multiplier || 100 // Standard option multiplier

    // Add to portfolio totals
    portfolio.totalDelta += greeks.delta * quantity * multiplier
    portfolio.totalGamma += greeks.gamma * quantity * multiplier
    portfolio.totalTheta += greeks.theta * quantity * multiplier
    portfolio.totalVega += greeks.vega * quantity * multiplier
    portfolio.totalRho += greeks.rho * quantity * multiplier
    portfolio.totalValue += greeks.price * quantity * multiplier

    // Store individual position Greeks
    portfolio.positions.push({
      ...position,
      greeks,
      positionDelta: greeks.delta * quantity * multiplier,
      positionValue: greeks.price * quantity * multiplier
    })
  })

  return portfolio
}

/**
 * Calculate Greeks sensitivities (how Greeks change with underlying)
 * @param {Object} params - Option parameters
 * @returns {Object} Greeks sensitivities
 */
export function calculateGreeksSensitivities(params) {
  const baseGreeks = calculateBlackScholes(params)
  const spotShift = params.spotPrice * 0.01 // 1% move

  // Calculate Greeks at different spot prices
  const greeksUp = calculateBlackScholes({
    ...params,
    spotPrice: params.spotPrice + spotShift
  })

  const greeksDown = calculateBlackScholes({
    ...params,
    spotPrice: params.spotPrice - spotShift
  })

  return {
    base: baseGreeks,
    deltaChange: (greeksUp.delta - greeksDown.delta) / (2 * spotShift),
    gammaChange: (greeksUp.gamma - greeksDown.gamma) / (2 * spotShift),
    vegaChange: (greeksUp.vega - greeksDown.vega) / (2 * spotShift),
    // Speed (rate of change of gamma)
    speed: (greeksUp.gamma - greeksDown.gamma) / (2 * spotShift),
    // Charm (delta decay)
    charm: -(greeksUp.delta - baseGreeks.delta) / (params.timeToExpiry / 365),
    // Color (gamma decay)
    color: -(greeksUp.gamma - baseGreeks.gamma) / (params.timeToExpiry / 365)
  }
}

/**
 * Options strategies analyzer
 * @param {string} strategy - Strategy type
 * @param {Object} params - Strategy parameters
 * @returns {Object} Strategy analysis
 */
export function analyzeOptionsStrategy(strategy, params) {
  const strategies = {
    'covered-call': (p) => {
      // Long stock + short call
      return [
        { type: 'stock', quantity: 100 },
        {
          ...p,
          optionType: 'call',
          quantity: -1,
          strikePrice: p.spotPrice * (1 + p.otmPercent / 100)
        }
      ]
    },
    'protective-put': (p) => {
      // Long stock + long put
      return [
        { type: 'stock', quantity: 100 },
        {
          ...p,
          optionType: 'put',
          quantity: 1,
          strikePrice: p.spotPrice * (1 - p.otmPercent / 100)
        }
      ]
    },
    'bull-call-spread': (p) => {
      // Long lower strike call + short higher strike call
      return [
        {
          ...p,
          optionType: 'call',
          quantity: 1,
          strikePrice: p.lowerStrike
        },
        {
          ...p,
          optionType: 'call',
          quantity: -1,
          strikePrice: p.upperStrike
        }
      ]
    },
    'bear-put-spread': (p) => {
      // Long higher strike put + short lower strike put
      return [
        {
          ...p,
          optionType: 'put',
          quantity: 1,
          strikePrice: p.upperStrike
        },
        {
          ...p,
          optionType: 'put',
          quantity: -1,
          strikePrice: p.lowerStrike
        }
      ]
    },
    'iron-condor': (p) => {
      // Short OTM call spread + short OTM put spread
      return [
        {
          ...p,
          optionType: 'put',
          quantity: -1,
          strikePrice: p.putShortStrike
        },
        {
          ...p,
          optionType: 'put',
          quantity: 1,
          strikePrice: p.putLongStrike
        },
        {
          ...p,
          optionType: 'call',
          quantity: -1,
          strikePrice: p.callShortStrike
        },
        {
          ...p,
          optionType: 'call',
          quantity: 1,
          strikePrice: p.callLongStrike
        }
      ]
    },
    'straddle': (p) => {
      // Long call + long put at same strike
      return [
        {
          ...p,
          optionType: 'call',
          quantity: 1
        },
        {
          ...p,
          optionType: 'put',
          quantity: 1
        }
      ]
    },
    'strangle': (p) => {
      // Long OTM call + long OTM put
      return [
        {
          ...p,
          optionType: 'call',
          quantity: 1,
          strikePrice: p.callStrike
        },
        {
          ...p,
          optionType: 'put',
          quantity: 1,
          strikePrice: p.putStrike
        }
      ]
    }
  }

  const positions = strategies[strategy] ? strategies[strategy](params) : []
  const optionPositions = positions.filter(p => p.type !== 'stock')
  const portfolio = calculatePortfolioGreeks(optionPositions)

  // Calculate P&L at different spot prices
  const spotRange = []
  const plRange = []
  const baseSpot = params.spotPrice

  for (let i = 0.5; i <= 1.5; i += 0.02) {
    const spot = baseSpot * i
    let totalPL = 0

    positions.forEach(position => {
      if (position.type === 'stock') {
        totalPL += (spot - baseSpot) * position.quantity
      } else {
        const greeks = calculateBlackScholes({
          ...position,
          spotPrice: spot
        })
        const initialGreeks = calculateBlackScholes(position)
        totalPL += (greeks.price - initialGreeks.price) *
                   position.quantity * (position.multiplier || 100)
      }
    })

    spotRange.push(spot)
    plRange.push(totalPL)
  }

  // Find breakeven points
  const breakevens = []
  for (let i = 1; i < plRange.length; i++) {
    if ((plRange[i-1] < 0 && plRange[i] >= 0) ||
        (plRange[i-1] >= 0 && plRange[i] < 0)) {
      breakevens.push(spotRange[i])
    }
  }

  return {
    strategy,
    positions,
    portfolio,
    payoffProfile: { spotRange, plRange },
    breakevens,
    maxProfit: Math.max(...plRange),
    maxLoss: Math.min(...plRange),
    profitProbability: calculateProfitProbability(params, breakevens)
  }
}

/**
 * Calculate probability of profit using normal distribution
 * @param {Object} params - Option parameters
 * @param {Array} breakevens - Breakeven points
 * @returns {number} Probability of profit (0-1)
 */
function calculateProfitProbability(params, breakevens) {
  if (breakevens.length === 0) return 0.5

  const { spotPrice, volatility, timeToExpiry } = params
  const σ = volatility * Math.sqrt(timeToExpiry)

  let probability = 0

  if (breakevens.length === 1) {
    // Single breakeven
    const z = (Math.log(breakevens[0] / spotPrice)) / σ
    probability = breakevens[0] > spotPrice ?
      normCDF(-z) : normCDF(z)
  } else if (breakevens.length === 2) {
    // Two breakevens (e.g., iron condor)
    const z1 = (Math.log(breakevens[0] / spotPrice)) / σ
    const z2 = (Math.log(breakevens[1] / spotPrice)) / σ
    probability = normCDF(z2) - normCDF(z1)
  }

  return probability
}

/**
 * Format Greeks for display
 * @param {Object} greeks - Greeks object
 * @returns {Object} Formatted Greeks
 */
export function formatGreeks(greeks) {
  return {
    price: `$${greeks.price.toFixed(2)}`,
    delta: greeks.delta.toFixed(3),
    gamma: greeks.gamma.toFixed(4),
    theta: `$${greeks.theta.toFixed(2)}/day`,
    vega: `$${greeks.vega.toFixed(2)}`,
    rho: `$${greeks.rho.toFixed(2)}`,
    intrinsic: `$${greeks.intrinsicValue.toFixed(2)}`,
    timeValue: `$${greeks.timeValue.toFixed(2)}`,
    breakeven: `$${greeks.breakeven.toFixed(2)}`,
    moneyness: greeks.moneyness > 1.02 ? 'ITM' :
               greeks.moneyness < 0.98 ? 'OTM' : 'ATM'
  }
}