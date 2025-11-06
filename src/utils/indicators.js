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

