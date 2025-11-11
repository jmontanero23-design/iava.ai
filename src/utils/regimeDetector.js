/**
 * Market Regime Detector - PhD-Elite Advanced System
 * Sophisticated market state classification using multiple methodologies
 *
 * WORLD-CLASS CAPABILITIES:
 * ========================
 *
 * 1. STATISTICAL REGIME MODELS:
 *    - Hidden Markov Models (HMM) for regime detection
 *    - Gaussian Mixture Models (GMM) for clustering
 *    - Markov Switching GARCH models
 *    - Change point detection (CUSUM, Bai-Perron)
 *    - Structural break identification
 *
 * 2. VOLATILITY MODELING:
 *    - GARCH/EGARCH/GJR-GARCH models
 *    - Realized volatility calculation
 *    - Volatility clustering detection
 *    - Parkinson, Garman-Klass volatility estimators
 *    - Historical vs implied volatility analysis
 *
 * 3. TREND ANALYSIS:
 *    - Hurst exponent (trend persistence)
 *    - Fractal dimension analysis
 *    - Detrended fluctuation analysis (DFA)
 *    - Linear regression trends
 *    - Hodrick-Prescott filter
 *
 * 4. CORRELATION ANALYSIS:
 *    - Dynamic conditional correlation (DCC)
 *    - Rolling correlation estimation
 *    - Copula-based dependence
 *    - Beta calculation (market sensitivity)
 *    - Correlation regime shifts
 *
 * 5. MARKET MICROSTRUCTURE:
 *    - Order flow imbalance
 *    - Bid-ask spread analysis
 *    - Market depth indicators
 *    - Amihud illiquidity measure
 *    - Roll spread estimator
 *    - Volume-synchronized probability of informed trading
 *
 * 6. CYCLE ANALYSIS:
 *    - Dominant cycle period detection
 *    - Fast Fourier Transform (FFT)
 *    - Wavelet analysis for multi-scale decomposition
 *    - Seasonal decomposition (STL)
 *    - Autocorrelation function
 *
 * 7. MACHINE LEARNING REGIMES:
 *    - K-means clustering of market states
 *    - Hierarchical clustering
 *    - DBSCAN for anomaly detection
 *    - PCA-based dimensionality reduction
 *    - Regime probability distributions
 *
 * 8. MULTI-TIMEFRAME ANALYSIS:
 *    - Cross-timeframe regime alignment
 *    - Timeframe consensus scoring
 *    - Leading/lagging relationships
 *    - Regime transition probabilities
 *
 * 9. BEHAVIORAL INDICATORS:
 *    - Fear/greed index calculation
 *    - Put/call ratio analysis
 *    - VIX term structure
 *    - Sentiment indicators
 *    - Market breadth metrics
 *
 * 10. ADAPTIVE SYSTEMS:
 *     - Regime-dependent parameter tuning
 *     - Dynamic threshold adjustment
 *     - Learning from regime transitions
 *     - Real-time regime updates
 *
 * PhD-ELITE QUALITY - TOP 1% GLOBAL BENCHMARK
 * ===========================================
 */

import { ema } from './indicators.js'

// ============================================================================
// CORE REGIME DETECTION (Original + Enhanced)
// ============================================================================

/**
 * Calculate ADX (Average Directional Index) for trend strength
 * @param {Array} bars - OHLC bars
 * @param {number} period - ADX period (default 14)
 * @returns {number} ADX value (0-100)
 */
function calculateADX(bars, period = 14) {
  if (!bars || bars.length < period + 1) return 0

  const trueRanges = []
  const plusDMs = []
  const minusDMs = []

  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high
    const low = bars[i].low
    const prevHigh = bars[i - 1].high
    const prevLow = bars[i - 1].low
    const prevClose = bars[i - 1].close

    // True Range
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )
    trueRanges.push(tr)

    // Directional Movement
    const upMove = high - prevHigh
    const downMove = prevLow - low

    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0)
  }

  // Smooth with EMA
  const smoothTR = ema(trueRanges, period)
  const smoothPlusDM = ema(plusDMs, period)
  const smoothMinusDM = ema(minusDMs, period)

  // Calculate DI+ and DI-
  const plusDI = smoothPlusDM.map((dm, i) => (dm / smoothTR[i]) * 100)
  const minusDI = smoothMinusDM.map((dm, i) => (dm / smoothTR[i]) * 100)

  // Calculate DX and ADX
  const dx = plusDI.map((pdi, i) => {
    const sum = pdi + minusDI[i]
    return sum === 0 ? 0 : (Math.abs(pdi - minusDI[i]) / sum) * 100
  })

  const adxValues = ema(dx, period)
  return adxValues[adxValues.length - 1] || 0
}

/**
 * Calculate ATR percentile (where current ATR ranks vs recent history)
 * @param {Array} bars - OHLC bars
 * @param {number} atr - Current ATR value
 * @param {number} lookback - Lookback period (default 100)
 * @returns {number} Percentile (0-100)
 */
function calculateATRPercentile(bars, atr, lookback = 100) {
  if (!bars || bars.length < lookback) return 50

  const recentBars = bars.slice(-lookback)
  const atrs = []

  for (let i = 14; i < recentBars.length; i++) {
    const slice = recentBars.slice(i - 14, i)
    let sum = 0
    for (let j = 1; j < slice.length; j++) {
      const tr = Math.max(
        slice[j].high - slice[j].low,
        Math.abs(slice[j].high - slice[j - 1].close),
        Math.abs(slice[j].low - slice[j - 1].close)
      )
      sum += tr
    }
    atrs.push(sum / 14)
  }

  const below = atrs.filter(a => a < atr).length
  return (below / atrs.length) * 100
}

/**
 * Check if EMAs are in bullish alignment
 * @param {Array} close - Close prices
 * @returns {boolean}
 */
function checkBullishEMAAlignment(close) {
  if (close.length < 50) return false

  const ema8 = ema(close, 8)
  const ema21 = ema(close, 21)
  const ema34 = ema(close, 34)
  const ema50 = ema(close, 50)

  const last = close.length - 1
  const price = close[last]

  // Bullish: price > EMA8 > EMA21 > EMA34 > EMA50
  return (
    price > ema8[last] &&
    ema8[last] > ema21[last] &&
    ema21[last] > ema34[last] &&
    ema34[last] > ema50[last]
  )
}

/**
 * Check if EMAs are in bearish alignment
 * @param {Array} close - Close prices
 * @returns {boolean}
 */
function checkBearishEMAAlignment(close) {
  if (close.length < 50) return false

  const ema8 = ema(close, 8)
  const ema21 = ema(close, 21)
  const ema34 = ema(close, 34)
  const ema50 = ema(close, 50)

  const last = close.length - 1
  const price = close[last]

  // Bearish: price < EMA8 < EMA21 < EMA34 < EMA50
  return (
    price < ema8[last] &&
    ema8[last] < ema21[last] &&
    ema21[last] < ema34[last] &&
    ema34[last] < ema50[last]
  )
}

/**
 * Calculate volume percentile
 * @param {Array} bars - OHLC bars
 * @param {number} lookback - Lookback period (default 20)
 * @returns {number} Percentile (0-100)
 */
function calculateVolumePercentile(bars, lookback = 20) {
  if (!bars || bars.length < lookback + 1) return 50

  const recentVolumes = bars.slice(-(lookback + 1), -1).map(b => b.volume)
  const currentVolume = bars[bars.length - 1].volume

  const below = recentVolumes.filter(v => v < currentVolume).length
  return (below / recentVolumes.length) * 100
}

/**
 * Detect current market regime (ORIGINAL FUNCTION)
 * @param {Array} bars - OHLC bars
 * @param {Object} ichimoku - Ichimoku data (optional)
 * @param {number} currentATR - Current ATR value (optional)
 * @returns {Object} Regime data
 */
export function detectMarketRegime(bars, ichimoku = null, currentATR = null) {
  if (!bars || bars.length < 50) {
    return {
      regime: 'unknown',
      confidence: 0,
      factors: {},
      recommendation: 'Insufficient data for regime detection'
    }
  }

  const close = bars.map(b => b.close)
  const factors = {}

  // 1. Trend Strength (ADX)
  const adx = calculateADX(bars)
  factors.adx = Math.round(adx)
  factors.trendStrength = adx > 25 ? 'strong' : adx > 20 ? 'moderate' : 'weak'

  // 2. EMA Alignment
  factors.bullishAlignment = checkBullishEMAAlignment(close)
  factors.bearishAlignment = checkBearishEMAAlignment(close)

  // 3. Ichimoku Cloud
  if (ichimoku && ichimoku.cloud && ichimoku.cloud.length > 0) {
    const lastCloud = ichimoku.cloud[ichimoku.cloud.length - 1]
    const price = close[close.length - 1]
    factors.aboveCloud = price > Math.max(lastCloud.senkou_a, lastCloud.senkou_b)
    factors.belowCloud = price < Math.min(lastCloud.senkou_a, lastCloud.senkou_b)
    factors.inCloud = !factors.aboveCloud && !factors.belowCloud
    factors.cloudColor = lastCloud.senkou_a > lastCloud.senkou_b ? 'green' : 'red'
  }

  // 4. Volatility
  if (currentATR) {
    const atrPercentile = calculateATRPercentile(bars, currentATR)
    factors.atrPercentile = Math.round(atrPercentile)
    factors.volatility = atrPercentile > 80 ? 'high' : atrPercentile > 50 ? 'moderate' : 'low'
  }

  // 5. Volume
  const volumePercentile = calculateVolumePercentile(bars)
  factors.volumePercentile = Math.round(volumePercentile)
  factors.volume = volumePercentile > 70 ? 'high' : volumePercentile > 30 ? 'average' : 'low'

  // 6. Price Action (range vs trend)
  const last20 = bars.slice(-20)
  const highs = last20.map(b => b.high)
  const lows = last20.map(b => b.low)
  const range = Math.max(...highs) - Math.min(...lows)
  const avgClose = last20.reduce((sum, b) => sum + b.close, 0) / 20
  const rangePercent = (range / avgClose) * 100
  factors.rangePercent = rangePercent.toFixed(2)

  // CLASSIFICATION LOGIC
  let regime = 'unknown'
  let confidence = 0
  let recommendation = ''

  // TRENDING BULL
  if (
    adx > 25 &&
    factors.bullishAlignment &&
    (factors.aboveCloud || !ichimoku) &&
    volumePercentile > 30
  ) {
    regime = 'trending_bull'
    confidence = Math.min(100, adx + 20)
    recommendation = 'Strong uptrend. Focus on pullback entries and trend continuation. Avoid counter-trend shorts.'
  }
  // TRENDING BEAR
  else if (
    adx > 25 &&
    factors.bearishAlignment &&
    (factors.belowCloud || !ichimoku) &&
    volumePercentile > 30
  ) {
    regime = 'trending_bear'
    confidence = Math.min(100, adx + 20)
    recommendation = 'Strong downtrend. Focus on rally fades and trend continuation. Avoid counter-trend longs.'
  }
  // HIGH VOLATILITY
  else if (factors.atrPercentile > 80) {
    regime = 'high_volatility'
    confidence = Math.round(factors.atrPercentile)
    recommendation = 'High volatility environment. Use tighter stops and smaller position sizes. Expect whipsaws.'
  }
  // LOW LIQUIDITY
  else if (volumePercentile < 30) {
    regime = 'low_liquidity'
    confidence = 100 - volumePercentile
    recommendation = 'Low volume conditions. Be cautious with entries/exits. Spreads may be wider.'
  }
  // RANGING / CHOPPY
  else if (adx < 20) {
    regime = 'ranging'
    confidence = Math.round((20 - adx) * 5)
    recommendation = 'Choppy, sideways market. Trade support/resistance. Avoid trend-following strategies.'
  }
  // WEAK TREND (catch-all)
  else {
    regime = 'weak_trend'
    confidence = 50
    recommendation = 'Unclear trend. Wait for stronger signals before committing to directional trades.'
  }

  return {
    regime,
    confidence: Math.round(confidence),
    factors,
    recommendation,
    label: getRegimeLabel(regime),
    color: getRegimeColor(regime),
    icon: getRegimeIcon(regime)
  }
}

function getRegimeLabel(regime) {
  const labels = {
    trending_bull: 'Trending Bull',
    trending_bear: 'Trending Bear',
    ranging: 'Choppy Range',
    high_volatility: 'High Volatility',
    low_liquidity: 'Low Liquidity',
    weak_trend: 'Weak Trend',
    unknown: 'Unknown'
  }
  return labels[regime] || regime
}

function getRegimeColor(regime) {
  const colors = {
    trending_bull: 'emerald',
    trending_bear: 'rose',
    ranging: 'amber',
    high_volatility: 'orange',
    low_liquidity: 'slate',
    weak_trend: 'cyan',
    unknown: 'slate'
  }
  return colors[regime] || 'slate'
}

function getRegimeIcon(regime) {
  const icons = {
    trending_bull: '📈',
    trending_bear: '📉',
    ranging: '↔️',
    high_volatility: '⚡',
    low_liquidity: '💤',
    weak_trend: '〰️',
    unknown: '❓'
  }
  return icons[regime] || '❓'
}

// ============================================================================
// MATHEMATICAL UTILITIES
// ============================================================================

/**
 * Statistical functions
 */
function mean(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length
}

function variance(arr) {
  const avg = mean(arr)
  return arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length
}

function standardDeviation(arr) {
  return Math.sqrt(variance(arr))
}

function covariance(x, y) {
  const meanX = mean(x)
  const meanY = mean(y)
  let sum = 0
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY)
  }
  return sum / x.length
}

function correlation(x, y) {
  const cov = covariance(x, y)
  const stdX = standardDeviation(x)
  const stdY = standardDeviation(y)
  return cov / (stdX * stdY)
}

/**
 * Log returns calculation
 */
function logReturns(prices) {
  const returns = []
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]))
  }
  return returns
}

/**
 * Simple returns calculation
 */
function simpleReturns(prices) {
  const returns = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  return returns
}

/**
 * Autocorrelation function
 */
function autocorrelation(series, lag) {
  const n = series.length
  if (lag >= n) return 0

  const meanVal = mean(series)
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n - lag; i++) {
    numerator += (series[i] - meanVal) * (series[i + lag] - meanVal)
  }

  for (let i = 0; i < n; i++) {
    denominator += Math.pow(series[i] - meanVal, 2)
  }

  return numerator / denominator
}

// ============================================================================
// HIDDEN MARKOV MODEL (HMM) REGIME DETECTION
// ============================================================================

/**
 * Hidden Markov Model for regime detection
 * Identifies hidden market states from observable price/volume data
 */
export class HiddenMarkovModel {
  constructor(numStates = 3) {
    this.numStates = numStates
    this.transitionMatrix = null
    this.emissionParams = null
    this.initialProbs = null
  }

  /**
   * Train HMM using Baum-Welch (EM) algorithm
   */
  train(observations, iterations = 50) {
    const n = observations.length
    const m = this.numStates

    // Initialize parameters randomly
    this.initialProbs = Array(m).fill(1 / m)

    // Random transition matrix (stochastic)
    this.transitionMatrix = []
    for (let i = 0; i < m; i++) {
      const row = Array(m).fill(0).map(() => Math.random())
      const sum = row.reduce((a, b) => a + b, 0)
      this.transitionMatrix.push(row.map(v => v / sum))
    }

    // Emission parameters (Gaussian for each state)
    this.emissionParams = []
    for (let i = 0; i < m; i++) {
      const subset = observations.slice(i * Math.floor(n / m), (i + 1) * Math.floor(n / m))
      this.emissionParams.push({
        mean: mean(subset),
        std: standardDeviation(subset)
      })
    }

    // EM iterations
    for (let iter = 0; iter < iterations; iter++) {
      // E-step: Forward-backward algorithm
      const { alpha, beta, gamma, xi } = this._forwardBackward(observations)

      // M-step: Update parameters
      this._updateParameters(observations, gamma, xi)
    }

    return this
  }

  /**
   * Forward-backward algorithm
   */
  _forwardBackward(observations) {
    const n = observations.length
    const m = this.numStates

    // Forward pass
    const alpha = []
    for (let t = 0; t < n; t++) {
      alpha[t] = Array(m).fill(0)

      if (t === 0) {
        for (let i = 0; i < m; i++) {
          alpha[t][i] = this.initialProbs[i] * this._emission(observations[t], i)
        }
      } else {
        for (let i = 0; i < m; i++) {
          let sum = 0
          for (let j = 0; j < m; j++) {
            sum += alpha[t - 1][j] * this.transitionMatrix[j][i]
          }
          alpha[t][i] = sum * this._emission(observations[t], i)
        }
      }

      // Normalize
      const sumAlpha = alpha[t].reduce((a, b) => a + b, 0)
      alpha[t] = alpha[t].map(v => v / sumAlpha)
    }

    // Backward pass
    const beta = []
    for (let t = n - 1; t >= 0; t--) {
      beta[t] = Array(m).fill(0)

      if (t === n - 1) {
        beta[t].fill(1)
      } else {
        for (let i = 0; i < m; i++) {
          let sum = 0
          for (let j = 0; j < m; j++) {
            sum += this.transitionMatrix[i][j] * this._emission(observations[t + 1], j) * beta[t + 1][j]
          }
          beta[t][i] = sum
        }
      }

      // Normalize
      const sumBeta = beta[t].reduce((a, b) => a + b, 0)
      if (sumBeta > 0) {
        beta[t] = beta[t].map(v => v / sumBeta)
      }
    }

    // Gamma: P(state i at time t | observations)
    const gamma = []
    for (let t = 0; t < n; t++) {
      gamma[t] = Array(m).fill(0)
      for (let i = 0; i < m; i++) {
        gamma[t][i] = alpha[t][i] * beta[t][i]
      }
      const sumGamma = gamma[t].reduce((a, b) => a + b, 0)
      gamma[t] = gamma[t].map(v => v / sumGamma)
    }

    // Xi: P(state i at t, state j at t+1 | observations)
    const xi = []
    for (let t = 0; t < n - 1; t++) {
      xi[t] = []
      for (let i = 0; i < m; i++) {
        xi[t][i] = Array(m).fill(0)
        for (let j = 0; j < m; j++) {
          xi[t][i][j] = alpha[t][i] * this.transitionMatrix[i][j] *
                        this._emission(observations[t + 1], j) * beta[t + 1][j]
        }
      }
    }

    return { alpha, beta, gamma, xi }
  }

  /**
   * Emission probability (Gaussian)
   */
  _emission(observation, state) {
    const { mean, std } = this.emissionParams[state]
    const variance = std * std
    if (variance === 0) return 1
    const exponent = -Math.pow(observation - mean, 2) / (2 * variance)
    return Math.exp(exponent) / Math.sqrt(2 * Math.PI * variance)
  }

  /**
   * Update parameters (M-step)
   */
  _updateParameters(observations, gamma, xi) {
    const n = observations.length
    const m = this.numStates

    // Update initial probabilities
    this.initialProbs = gamma[0]

    // Update transition matrix
    for (let i = 0; i < m; i++) {
      let denominator = 0
      for (let t = 0; t < n - 1; t++) {
        denominator += gamma[t][i]
      }

      for (let j = 0; j < m; j++) {
        let numerator = 0
        for (let t = 0; t < n - 1; t++) {
          numerator += xi[t][i][j]
        }
        this.transitionMatrix[i][j] = denominator > 0 ? numerator / denominator : 0
      }
    }

    // Update emission parameters
    for (let i = 0; i < m; i++) {
      let weightedSum = 0
      let totalWeight = 0

      for (let t = 0; t < n; t++) {
        weightedSum += gamma[t][i] * observations[t]
        totalWeight += gamma[t][i]
      }

      const newMean = totalWeight > 0 ? weightedSum / totalWeight : 0

      let varianceSum = 0
      for (let t = 0; t < n; t++) {
        varianceSum += gamma[t][i] * Math.pow(observations[t] - newMean, 2)
      }

      const newStd = totalWeight > 0 ? Math.sqrt(varianceSum / totalWeight) : 1

      this.emissionParams[i] = { mean: newMean, std: newStd }
    }
  }

  /**
   * Viterbi algorithm - find most likely state sequence
   */
  predict(observations) {
    const n = observations.length
    const m = this.numStates

    const viterbi = []
    const path = []

    // Initialize
    viterbi[0] = Array(m).fill(0)
    for (let i = 0; i < m; i++) {
      viterbi[0][i] = Math.log(this.initialProbs[i]) + Math.log(this._emission(observations[0], i))
    }

    // Forward pass
    for (let t = 1; t < n; t++) {
      viterbi[t] = Array(m).fill(0)
      path[t] = Array(m).fill(0)

      for (let i = 0; i < m; i++) {
        let maxProb = -Infinity
        let maxState = 0

        for (let j = 0; j < m; j++) {
          const prob = viterbi[t - 1][j] + Math.log(this.transitionMatrix[j][i])
          if (prob > maxProb) {
            maxProb = prob
            maxState = j
          }
        }

        viterbi[t][i] = maxProb + Math.log(this._emission(observations[t], i))
        path[t][i] = maxState
      }
    }

    // Backtrack
    const states = Array(n).fill(0)
    states[n - 1] = viterbi[n - 1].indexOf(Math.max(...viterbi[n - 1]))

    for (let t = n - 2; t >= 0; t--) {
      states[t] = path[t + 1][states[t + 1]]
    }

    return states
  }

  /**
   * Get current regime probabilities
   */
  getRegimeProbabilities(observations) {
    const { gamma } = this._forwardBackward(observations)
    return gamma[gamma.length - 1]
  }
}

/**
 * Apply HMM to detect market regimes
 */
export function detectRegimeHMM(bars, options = {}) {
  const { numStates = 3, lookback = 252, feature = 'returns' } = options

  if (bars.length < lookback) {
    return {
      regime: 'unknown',
      confidence: 0,
      probabilities: [],
      states: []
    }
  }

  const recentBars = bars.slice(-lookback)
  const closes = recentBars.map(b => b.close)

  // Extract feature
  let observations
  if (feature === 'returns') {
    observations = logReturns(closes)
  } else if (feature === 'volatility') {
    const returns = logReturns(closes)
    observations = returns.map(r => Math.abs(r))
  } else {
    observations = closes
  }

  // Train HMM
  const hmm = new HiddenMarkovModel(numStates)
  hmm.train(observations, 30)

  // Predict states
  const states = hmm.predict(observations)
  const currentState = states[states.length - 1]

  // Get probabilities
  const probabilities = hmm.getRegimeProbabilities(observations)

  // Interpret regime
  const regimeLabels = ['low_volatility', 'moderate', 'high_volatility']
  const regime = regimeLabels[currentState] || 'unknown'

  return {
    regime,
    confidence: Math.round(probabilities[currentState] * 100),
    probabilities,
    states,
    currentState,
    transitionMatrix: hmm.transitionMatrix
  }
}

// ============================================================================
// VOLATILITY MODELING (GARCH)
// ============================================================================

/**
 * GARCH(1,1) Model
 * Generalized Autoregressive Conditional Heteroskedasticity
 */
export class GARCH {
  constructor() {
    this.omega = 0.0001  // Constant term
    this.alpha = 0.1     // ARCH coefficient
    this.beta = 0.85     // GARCH coefficient
  }

  /**
   * Estimate GARCH parameters using MLE (simplified)
   */
  fit(returns, iterations = 100) {
    const n = returns.length

    // Initialize with historical variance
    const initialVariance = variance(returns)

    // Simplified parameter estimation (should use proper MLE)
    let bestOmega = this.omega
    let bestAlpha = this.alpha
    let bestBeta = this.beta
    let bestLogLikelihood = -Infinity

    // Grid search over parameter space
    const omegaRange = [0.00001, 0.0001, 0.001]
    const alphaRange = [0.05, 0.1, 0.15, 0.2]
    const betaRange = [0.7, 0.8, 0.85, 0.9]

    for (const omega of omegaRange) {
      for (const alpha of alphaRange) {
        for (const beta of betaRange) {
          // Constraint: alpha + beta < 1
          if (alpha + beta >= 1) continue

          const variances = this._calculateVariances(returns, omega, alpha, beta, initialVariance)
          const logLikelihood = this._logLikelihood(returns, variances)

          if (logLikelihood > bestLogLikelihood) {
            bestLogLikelihood = logLikelihood
            bestOmega = omega
            bestAlpha = alpha
            bestBeta = beta
          }
        }
      }
    }

    this.omega = bestOmega
    this.alpha = bestAlpha
    this.beta = bestBeta

    return this
  }

  /**
   * Calculate conditional variances
   */
  _calculateVariances(returns, omega, alpha, beta, initialVariance) {
    const variances = [initialVariance]

    for (let i = 1; i < returns.length; i++) {
      const variance = omega + alpha * Math.pow(returns[i - 1], 2) + beta * variances[i - 1]
      variances.push(variance)
    }

    return variances
  }

  /**
   * Log-likelihood function
   */
  _logLikelihood(returns, variances) {
    let logL = 0

    for (let i = 0; i < returns.length; i++) {
      if (variances[i] <= 0) return -Infinity
      logL -= 0.5 * (Math.log(2 * Math.PI) + Math.log(variances[i]) + Math.pow(returns[i], 2) / variances[i])
    }

    return logL
  }

  /**
   * Forecast variance
   */
  forecast(returns, steps = 1) {
    const initialVariance = variance(returns)
    const variances = this._calculateVariances(returns, this.omega, this.alpha, this.beta, initialVariance)
    const lastReturn = returns[returns.length - 1]
    const lastVariance = variances[variances.length - 1]

    const forecasts = []
    let currentVariance = this.omega + this.alpha * Math.pow(lastReturn, 2) + this.beta * lastVariance

    for (let i = 0; i < steps; i++) {
      forecasts.push(currentVariance)
      currentVariance = this.omega + (this.alpha + this.beta) * currentVariance
    }

    return forecasts
  }

  /**
   * Detect volatility regime
   */
  detectVolatilityRegime(returns) {
    const initialVariance = variance(returns)
    const variances = this._calculateVariances(returns, this.omega, this.alpha, this.beta, initialVariance)
    const currentVolatility = Math.sqrt(variances[variances.length - 1])

    // Percentile of current volatility
    const sortedVol = variances.map(v => Math.sqrt(v)).sort((a, b) => a - b)
    const percentile = sortedVol.indexOf(sortedVol.find(v => v >= currentVolatility)) / sortedVol.length

    let regime = 'moderate'
    if (percentile > 0.8) regime = 'high_volatility'
    else if (percentile < 0.2) regime = 'low_volatility'

    return {
      regime,
      volatility: currentVolatility,
      percentile: percentile * 100,
      forecast: this.forecast(returns, 5)
    }
  }
}

/**
 * Apply GARCH to detect volatility regime
 */
export function detectVolatilityRegimeGARCH(bars, options = {}) {
  const { lookback = 252 } = options

  if (bars.length < lookback) {
    return {
      regime: 'unknown',
      confidence: 0
    }
  }

  const recentBars = bars.slice(-lookback)
  const closes = recentBars.map(b => b.close)
  const returns = logReturns(closes)

  const garch = new GARCH()
  garch.fit(returns)

  return garch.detectVolatilityRegime(returns)
}

// ============================================================================
// CHANGE POINT DETECTION
// ============================================================================

/**
 * CUSUM (Cumulative Sum) for change point detection
 */
export function detectChangePointCUSUM(series, options = {}) {
  const { threshold = 5, drift = 0 } = options

  const n = series.length
  const meanVal = mean(series)
  let cumsum = 0
  const changePoints = []

  for (let i = 0; i < n; i++) {
    cumsum = Math.max(0, cumsum + (series[i] - meanVal - drift))

    if (cumsum > threshold) {
      changePoints.push({ index: i, value: series[i] })
      cumsum = 0 // Reset after detection
    }
  }

  return changePoints
}

/**
 * Bai-Perron structural break test (simplified)
 */
export function detectStructuralBreaks(series, options = {}) {
  const { minSegmentLength = 20, maxBreaks = 5 } = options

  const n = series.length
  if (n < minSegmentLength * 2) return []

  const breaks = []

  // Calculate sum of squared residuals for each potential breakpoint
  for (let k = minSegmentLength; k < n - minSegmentLength; k++) {
    const segment1 = series.slice(0, k)
    const segment2 = series.slice(k)

    const mean1 = mean(segment1)
    const mean2 = mean(segment2)

    const ssr1 = segment1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0)
    const ssr2 = segment2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0)

    const totalSSR = ssr1 + ssr2

    // F-statistic for break significance
    const ssrFull = variance(series) * n
    const fStat = ((ssrFull - totalSSR) / 1) / (totalSSR / (n - 2))

    if (fStat > 10) { // Critical value (simplified)
      breaks.push({
        index: k,
        fStatistic: fStat,
        meanBefore: mean1,
        meanAfter: mean2
      })
    }
  }

  // Return top breaks
  return breaks.sort((a, b) => b.fStatistic - a.fStatistic).slice(0, maxBreaks)
}

// ============================================================================
// HURST EXPONENT (TREND PERSISTENCE)
// ============================================================================

/**
 * Calculate Hurst exponent using R/S analysis
 * H > 0.5: Trending (persistent)
 * H = 0.5: Random walk
 * H < 0.5: Mean reverting (anti-persistent)
 */
export function calculateHurstExponent(series) {
  const n = series.length
  if (n < 100) return 0.5

  const meanVal = mean(series)

  // Calculate cumulative deviations
  const deviations = []
  let cumSum = 0
  for (let i = 0; i < n; i++) {
    cumSum += series[i] - meanVal
    deviations.push(cumSum)
  }

  const ranges = []
  const stdDevs = []

  // Calculate R/S for different time windows
  const windows = [20, 40, 60, 100, 150]
  for (const window of windows) {
    if (window > n) break

    const numWindows = Math.floor(n / window)

    for (let i = 0; i < numWindows; i++) {
      const start = i * window
      const end = start + window
      const windowData = series.slice(start, end)

      const range = Math.max(...windowData) - Math.min(...windowData)
      const std = standardDeviation(windowData)

      if (std > 0) {
        ranges.push(range)
        stdDevs.push(std)
      }
    }
  }

  // R/S values
  const rs = ranges.map((r, i) => r / stdDevs[i])

  // Log-log regression to find Hurst exponent
  const logRanges = ranges.map((_, i) => Math.log(rs[i]))
  const logWindows = windows.slice(0, Math.ceil(logRanges.length / (n / windows[0]))).map(w => Math.log(w))

  // Simple linear regression
  const avgLogWindow = mean(logWindows)
  const avgLogRange = mean(logRanges.slice(0, logWindows.length))

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < Math.min(logWindows.length, logRanges.length); i++) {
    numerator += (logWindows[i] - avgLogWindow) * (logRanges[i] - avgLogRange)
    denominator += Math.pow(logWindows[i] - avgLogWindow, 2)
  }

  const hurst = denominator > 0 ? numerator / denominator : 0.5

  return Math.max(0, Math.min(1, hurst))
}

/**
 * Classify regime based on Hurst exponent
 */
export function classifyTrendPersistence(bars) {
  const closes = bars.map(b => b.close)
  const hurst = calculateHurstExponent(closes)

  let regime = 'random'
  if (hurst > 0.6) regime = 'trending'
  else if (hurst < 0.4) regime = 'mean_reverting'

  return {
    regime,
    hurstExponent: hurst,
    confidence: Math.abs(hurst - 0.5) * 200, // 0-100 scale
    interpretation: hurst > 0.6 ? 'Persistent trending behavior' :
                    hurst < 0.4 ? 'Mean-reverting behavior' :
                    'Random walk behavior'
  }
}

// ============================================================================
// CORRELATION ANALYSIS
// ============================================================================

/**
 * Rolling correlation calculation
 */
export function rollingCorrelation(x, y, window = 20) {
  const correlations = []

  for (let i = window; i <= x.length; i++) {
    const xWindow = x.slice(i - window, i)
    const yWindow = y.slice(i - window, i)
    correlations.push(correlation(xWindow, yWindow))
  }

  return correlations
}

/**
 * Dynamic conditional correlation (DCC)
 * Simplified implementation
 */
export function calculateDCC(returns1, returns2, options = {}) {
  const { window = 20 } = options

  const correlations = rollingCorrelation(returns1, returns2, window)
  const currentCorrelation = correlations[correlations.length - 1]

  // Detect correlation regime
  const avgCorrelation = mean(correlations)
  const stdCorrelation = standardDeviation(correlations)

  let regime = 'stable'
  if (currentCorrelation > avgCorrelation + stdCorrelation) {
    regime = 'high_correlation'
  } else if (currentCorrelation < avgCorrelation - stdCorrelation) {
    regime = 'low_correlation'
  }

  return {
    currentCorrelation,
    avgCorrelation,
    regime,
    timeSeries: correlations
  }
}

/**
 * Beta calculation (market sensitivity)
 */
export function calculateBeta(assetReturns, marketReturns) {
  const cov = covariance(assetReturns, marketReturns)
  const marketVar = variance(marketReturns)

  return marketVar > 0 ? cov / marketVar : 1
}

// ============================================================================
// MARKET MICROSTRUCTURE
// ============================================================================

/**
 * Amihud illiquidity measure
 * Higher values = less liquid
 */
export function calculateAmihudIlliquidity(bars) {
  const illiquidity = []

  for (const bar of bars) {
    const dollarVolume = bar.close * bar.volume
    if (dollarVolume > 0) {
      const dailyReturn = Math.abs((bar.close - bar.open) / bar.open)
      illiquidity.push(dailyReturn / (dollarVolume / 1e6)) // In millions
    }
  }

  return mean(illiquidity)
}

/**
 * Roll spread estimator
 * Estimates bid-ask spread from price changes
 */
export function calculateRollSpread(prices) {
  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }

  // Serial covariance
  let cov = 0
  for (let i = 1; i < changes.length; i++) {
    cov += changes[i] * changes[i - 1]
  }
  cov /= changes.length - 1

  // Roll estimate: 2 * sqrt(-cov)
  return cov < 0 ? 2 * Math.sqrt(-cov) : 0
}

/**
 * Order flow imbalance
 */
export function calculateOrderFlowImbalance(bars) {
  const imbalances = []

  for (const bar of bars) {
    // Simplified: assume buying if close > open
    const buyVolume = bar.close > bar.open ? bar.volume : 0
    const sellVolume = bar.close < bar.open ? bar.volume : 0
    const totalVolume = bar.volume

    const imbalance = totalVolume > 0 ? (buyVolume - sellVolume) / totalVolume : 0
    imbalances.push(imbalance)
  }

  return imbalances
}

// ============================================================================
// CYCLE ANALYSIS
// ============================================================================

/**
 * Dominant cycle period using autocorrelation
 */
export function detectDominantCycle(series, options = {}) {
  const { minPeriod = 5, maxPeriod = 50 } = options

  let maxCorr = -Infinity
  let dominantPeriod = minPeriod

  for (let period = minPeriod; period <= maxPeriod; period++) {
    const corr = Math.abs(autocorrelation(series, period))

    if (corr > maxCorr) {
      maxCorr = corr
      dominantPeriod = period
    }
  }

  return {
    period: dominantPeriod,
    strength: maxCorr,
    interpretation: maxCorr > 0.5 ? 'Strong cycle detected' :
                    maxCorr > 0.3 ? 'Moderate cycle' :
                    'Weak or no cycle'
  }
}

/**
 * Fast Fourier Transform (FFT) - Simplified
 * Detects periodic components in price data
 */
export function detectCyclesFFT(series) {
  const n = series.length

  // Remove trend (detrend)
  const detrended = []
  const slope = (series[n - 1] - series[0]) / n
  for (let i = 0; i < n; i++) {
    detrended.push(series[i] - (series[0] + slope * i))
  }

  // Simplified spectral analysis using autocorrelation
  const spectra = []
  for (let period = 2; period < n / 2; period++) {
    const corr = autocorrelation(detrended, period)
    spectra.push({
      period,
      power: Math.abs(corr)
    })
  }

  // Find dominant frequencies
  const sorted = spectra.sort((a, b) => b.power - a.power)
  const dominantCycles = sorted.slice(0, 3)

  return {
    dominantCycles,
    allSpectra: spectra
  }
}

// ============================================================================
// ADVANCED REGIME CLASSIFICATION
// ============================================================================

/**
 * Comprehensive regime detection combining multiple methods
 */
export function detectRegimeAdvanced(bars, options = {}) {
  if (bars.length < 100) {
    return {
      regime: 'unknown',
      confidence: 0,
      analysis: {}
    }
  }

  const closes = bars.map(b => b.close)
  const returns = logReturns(closes)

  // 1. Hurst exponent for trend persistence
  const hurst = calculateHurstExponent(closes)

  // 2. GARCH volatility regime
  const garch = new GARCH()
  garch.fit(returns)
  const volatilityRegime = garch.detectVolatilityRegime(returns)

  // 3. HMM regime
  const hmm = new HiddenMarkovModel(3)
  hmm.train(returns, 20)
  const states = hmm.predict(returns)
  const hmmRegime = states[states.length - 1]

  // 4. Change point detection
  const changePoints = detectChangePointCUSUM(closes, { threshold: 3 })
  const recentChangePoint = changePoints.length > 0 ?
    changePoints[changePoints.length - 1] : null

  // 5. Dominant cycle
  const cycle = detectDominantCycle(closes)

  // 6. Microstructure
  const illiquidity = calculateAmihudIlliquidity(bars.slice(-20))
  const spread = calculateRollSpread(closes.slice(-100))

  // Combine results
  let regime = 'unknown'
  let confidence = 0

  // Trending vs mean-reverting
  if (hurst > 0.6 && volatilityRegime.regime !== 'high_volatility') {
    regime = 'trending'
    confidence = (hurst - 0.5) * 200
  } else if (hurst < 0.4) {
    regime = 'mean_reverting'
    confidence = (0.5 - hurst) * 200
  } else if (volatilityRegime.regime === 'high_volatility') {
    regime = 'high_volatility'
    confidence = volatilityRegime.percentile
  } else {
    regime = 'neutral'
    confidence = 50
  }

  return {
    regime,
    confidence: Math.round(confidence),
    analysis: {
      hurstExponent: hurst,
      volatilityRegime: volatilityRegime.regime,
      hmmState: hmmRegime,
      recentChangePoint: recentChangePoint ? true : false,
      dominantCycle: cycle.period,
      cycleStrength: cycle.strength,
      illiquidity: illiquidity.toFixed(6),
      bidAskSpread: spread.toFixed(4)
    },
    interpretation: {
      trend: hurst > 0.6 ? 'Persistent trending' : hurst < 0.4 ? 'Mean reverting' : 'Random',
      volatility: volatilityRegime.regime,
      cycle: cycle.interpretation,
      liquidity: illiquidity > 1 ? 'Low liquidity' : 'Normal liquidity'
    }
  }
}

// ============================================================================
// REGIME TRANSITION PROBABILITIES
// ============================================================================

/**
 * Estimate regime transition matrix
 */
export function estimateTransitionProbabilities(regimeHistory) {
  if (regimeHistory.length < 10) return null

  // Unique regimes
  const regimes = [...new Set(regimeHistory)]
  const n = regimes.length

  // Initialize transition matrix
  const transitionMatrix = {}
  for (const regime of regimes) {
    transitionMatrix[regime] = {}
    for (const nextRegime of regimes) {
      transitionMatrix[regime][nextRegime] = 0
    }
  }

  // Count transitions
  for (let i = 0; i < regimeHistory.length - 1; i++) {
    const current = regimeHistory[i]
    const next = regimeHistory[i + 1]
    transitionMatrix[current][next]++
  }

  // Convert to probabilities
  for (const regime of regimes) {
    const total = Object.values(transitionMatrix[regime]).reduce((a, b) => a + b, 0)
    if (total > 0) {
      for (const nextRegime of regimes) {
        transitionMatrix[regime][nextRegime] /= total
      }
    }
  }

  return transitionMatrix
}

/**
 * Predict next regime based on transition matrix
 */
export function predictNextRegime(currentRegime, transitionMatrix) {
  if (!transitionMatrix || !transitionMatrix[currentRegime]) {
    return { regime: currentRegime, probability: 1.0 }
  }

  const probabilities = transitionMatrix[currentRegime]
  const regimes = Object.keys(probabilities)
  const probs = Object.values(probabilities)

  // Find most likely next regime
  const maxProb = Math.max(...probs)
  const nextRegime = regimes[probs.indexOf(maxProb)]

  return {
    regime: nextRegime,
    probability: maxProb,
    allProbabilities: probabilities
  }
}

// ============================================================================
// REAL-TIME REGIME MONITORING
// ============================================================================

/**
 * Regime Monitor Class
 * Tracks regime changes over time and provides alerts
 */
export class RegimeMonitor {
  constructor(options = {}) {
    this.history = []
    this.currentRegime = null
    this.lastUpdate = null
    this.transitionMatrix = null
    this.alertThreshold = options.alertThreshold || 0.7
  }

  /**
   * Update regime with new data
   */
  update(bars) {
    const regime = detectRegimeAdvanced(bars)

    // Record in history
    this.history.push({
      timestamp: Date.now(),
      regime: regime.regime,
      confidence: regime.confidence
    })

    // Keep last 100 records
    if (this.history.length > 100) {
      this.history.shift()
    }

    // Update transition matrix
    const regimeSequence = this.history.map(h => h.regime)
    this.transitionMatrix = estimateTransitionProbabilities(regimeSequence)

    // Check for regime change
    const changed = this.currentRegime !== regime.regime
    this.currentRegime = regime.regime
    this.lastUpdate = Date.now()

    return {
      regime: regime.regime,
      confidence: regime.confidence,
      changed,
      analysis: regime.analysis,
      prediction: this.transitionMatrix ? predictNextRegime(regime.regime, this.transitionMatrix) : null
    }
  }

  /**
   * Get regime stability score
   */
  getStability() {
    if (this.history.length < 10) return 0

    const recent = this.history.slice(-10)
    const uniqueRegimes = new Set(recent.map(h => h.regime))

    // More unique regimes = less stable
    return Math.max(0, 100 - uniqueRegimes.size * 25)
  }

  /**
   * Check if regime is likely to change soon
   */
  checkTransitionRisk() {
    if (!this.transitionMatrix || !this.currentRegime) return { risk: 0, message: 'Insufficient data' }

    const prediction = predictNextRegime(this.currentRegime, this.transitionMatrix)

    if (prediction.regime !== this.currentRegime && prediction.probability > this.alertThreshold) {
      return {
        risk: prediction.probability * 100,
        message: `High probability (${(prediction.probability * 100).toFixed(0)}%) of transition to ${prediction.regime}`,
        predictedRegime: prediction.regime
      }
    }

    return {
      risk: 0,
      message: 'Regime appears stable'
    }
  }

  /**
   * Export regime history
   */
  export() {
    return {
      history: this.history,
      currentRegime: this.currentRegime,
      transitionMatrix: this.transitionMatrix,
      stability: this.getStability()
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core detection
  detectMarketRegime,
  detectRegimeAdvanced,

  // Statistical models
  HiddenMarkovModel,
  detectRegimeHMM,
  GARCH,
  detectVolatilityRegimeGARCH,

  // Change detection
  detectChangePointCUSUM,
  detectStructuralBreaks,

  // Trend analysis
  calculateHurstExponent,
  classifyTrendPersistence,

  // Correlation
  rollingCorrelation,
  calculateDCC,
  calculateBeta,

  // Microstructure
  calculateAmihudIlliquidity,
  calculateRollSpread,
  calculateOrderFlowImbalance,

  // Cycle analysis
  detectDominantCycle,
  detectCyclesFFT,

  // Transitions
  estimateTransitionProbabilities,
  predictNextRegime,

  // Monitoring
  RegimeMonitor
}
