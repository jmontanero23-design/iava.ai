// Basic indicator utilities for OHLCV arrays
// Bar format: { time: string | number, open, high, low, close, volume }

export function sma(values, period) {
  const out = new Array(values.length).fill(null)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

export function ema(values, period) {
  const out = new Array(values.length).fill(null)
  const k = 2 / (period + 1)
  let prev = null
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (prev == null) {
      // seed with SMA of first period
      if (i >= period - 1) {
        let sum = 0
        for (let j = i - (period - 1); j <= i; j++) sum += values[j]
        prev = sum / period
        out[i] = prev
      }
    } else {
      prev = v * k + prev * (1 - k)
      out[i] = prev
    }
  }
  return out
}

// Ripster-style EMA cloud between two EMAs
export function emaCloud(values, fast = 8, slow = 21) {
  const fastEma = ema(values, fast)
  const slowEma = ema(values, slow)
  return { fast: fastEma, slow: slowEma }
}

// Average True Range
export function atr(bars, period = 14) {
  if (!bars?.length) return []
  const out = new Array(bars.length).fill(null)
  let prevClose = bars[0].close
  const trs = []
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i]
    const tr = Math.max(
      b.high - b.low,
      Math.abs(b.high - prevClose),
      Math.abs(b.low - prevClose)
    )
    trs.push(tr)
    prevClose = b.close
    if (trs.length >= period) {
      const start = trs.length - period
      let sum = 0
      for (let j = start; j < trs.length; j++) sum += trs[j]
      out[i] = sum / period
    }
  }
  return out
}

// SATY ATR Levels derived from last ATR and prior close pivot
export function satyAtrLevels(bars, lookback = 14) {
  if (!bars?.length) return null
  const a = atr(bars, lookback)
  const lastIdx = bars.length - 1
  const lastAtr = a[lastIdx]
  const pivot = bars[lastIdx - 1]?.close ?? bars[lastIdx].close
  if (lastAtr == null) return { pivot, atr: null }
  const mk = (mul) => ({ up: pivot + mul * lastAtr, dn: pivot - mul * lastAtr })
  const levels = {
    t0236: mk(0.236),
    t0618: mk(0.618),
    t1000: mk(1.0),
    t1236: mk(1.236),
    t1618: mk(1.618),
  }
  const lastClose = bars[lastIdx].close
  const rangeUsed = Math.abs(lastClose - pivot) / lastAtr // in ATRs
  return { pivot, atr: lastAtr, rangeUsed, levels }
}

// Simple trend from EMA ribbon (8 vs 34)
export function pivotRibbonTrend(values, fast = 8, slow = 34) {
  const eFast = ema(values, fast)
  const eSlow = ema(values, slow)
  const i = values.length - 1
  if (eFast[i] == null || eSlow[i] == null) return 'neutral'
  return eFast[i] > eSlow[i] ? 'bullish' : eFast[i] < eSlow[i] ? 'bearish' : 'neutral'
}

// Ichimoku Cloud (standard: 9, 26, 52)
export function ichimoku(bars, pTenkan = 9, pKijun = 26, pSenkouB = 52) {
  const high = bars.map(b => b.high)
  const low = bars.map(b => b.low)
  const close = bars.map(b => b.close)

  const mid = (h, l) => (h + l) / 2
  const rollingMid = (arrH, arrL, period) => {
    const out = new Array(arrH.length).fill(null)
    for (let i = 0; i < arrH.length; i++) {
      const s = i - period + 1
      if (s < 0) continue
      let hi = -Infinity, lo = Infinity
      for (let j = s; j <= i; j++) {
        if (arrH[j] > hi) hi = arrH[j]
        if (arrL[j] < lo) lo = arrL[j]
      }
      out[i] = mid(hi, lo)
    }
    return out
  }

  const tenkan = rollingMid(high, low, pTenkan)
  const kijun = rollingMid(high, low, pKijun)
  const spanA = tenkan.map((v, i) => (v != null && kijun[i] != null ? (v + kijun[i]) / 2 : null))
  const spanB = rollingMid(high, low, pSenkouB)

  // Shift Span A/B forward by Kijun period for visualization purposes
  const shift = pKijun
  const fA = new Array(bars.length + shift).fill(null)
  const fB = new Array(bars.length + shift).fill(null)
  for (let i = 0; i < bars.length; i++) {
    fA[i + shift] = spanA[i]
    fB[i + shift] = spanB[i]
  }

  // Chikou Span is close shifted back by Kijun period
  const chikou = new Array(bars.length).fill(null)
  for (let i = 0; i < bars.length; i++) {
    if (i - shift >= 0) chikou[i - shift] = close[i]
  }

  return { tenkan, kijun, spanA: fA, spanB: fB, chikou, shift }
}

// TTM Squeeze approximation using Bollinger Bands vs Keltner Channels
export function ttmSqueeze(close, high, low, period = 20, multBB = 2, multKC = 1.5) {
  const out = new Array(close.length).fill(null)
  const ma = sma(close, period)
  // rolling stddev
  const std = (arr, start, end) => {
    const n = end - start + 1
    if (n <= 1) return 0
    let mean = 0
    for (let i = start; i <= end; i++) mean += arr[i]
    mean /= n
    let v = 0
    for (let i = start; i <= end; i++) {
      const d = arr[i] - mean
      v += d * d
    }
    return Math.sqrt(v / n)
  }
  for (let i = 0; i < close.length; i++) {
    const s = i - period + 1
    if (s < 0) continue
    const dev = std(close, s, i)
    const upperBB = ma[i] + multBB * dev
    const lowerBB = ma[i] - multBB * dev
    // ATR-like range for Keltner
    let trSum = 0
    for (let j = s; j <= i; j++) {
      const r = high[j] - low[j]
      trSum += r
    }
    const atr = trSum / period
    const upperKC = ma[i] + multKC * atr
    const lowerKC = ma[i] - multKC * atr
    const squeezeOn = upperBB <= upperKC && lowerBB >= lowerKC
    out[i] = squeezeOn ? 1 : 0
  }
  return out
}

// Linear regression slope momentum (approx for TTM histogram)
export function linregMomentum(values, period = 20) {
  const n = values.length
  const out = new Array(n).fill(null)
  const sumX = (period * (period - 1)) / 2
  const sumX2 = ((period - 1) * period * (2 * period - 1)) / 6
  for (let i = period - 1; i < n; i++) {
    let sumY = 0
    let sumXY = 0
    for (let k = 0; k < period; k++) {
      const y = values[i - (period - 1) + k]
      sumY += y
      sumXY += k * y
    }
    const denom = period * sumX2 - sumX * sumX
    const slope = denom !== 0 ? (period * sumXY - sumX * sumY) / denom : 0
    out[i] = slope
  }
  return out
}
