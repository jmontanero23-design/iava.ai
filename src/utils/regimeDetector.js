/**
 * Market Regime Detector
 * Classifies current market state based on multiple factors
 *
 * Regimes:
 * - trending_bull: Strong uptrend with aligned indicators
 * - trending_bear: Strong downtrend with aligned indicators
 * - ranging: Choppy, sideways movement
 * - high_volatility: Erratic price action, wide ranges
 * - low_liquidity: Below-average volume
 */

import { ema } from './indicators.js'

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
 * Detect current market regime
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
