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
  const n = close.length
  const out = new Array(n).fill(null)
  const ma = sma(close, period) // Bollinger midline (SMA)
  const em = ema(close, period) // Keltner midline (EMA)
  // rolling stddev of close
  const std = (arr, start, end) => {
    const m = end - start + 1
    if (m <= 1) return 0
    let mean = 0
    for (let i = start; i <= end; i++) mean += arr[i]
    mean /= m
    let v = 0
    for (let i = start; i <= end; i++) { const d = arr[i] - mean; v += d * d }
    return Math.sqrt(v / m)
  }
  // ATR (true range) over window
  const tr = new Array(n).fill(0)
  let prevClose = close[0] ?? 0
  for (let i = 0; i < n; i++) {
    const h = high[i], l = low[i], c = close[i]
    const r = Math.max(
      (h - l),
      Math.abs(h - prevClose),
      Math.abs(l - prevClose)
    )
    tr[i] = r
    prevClose = c
  }
  const atr = new Array(n).fill(null)
  let sumTr = 0
  for (let i = 0; i < n; i++) {
    sumTr += tr[i]
    if (i >= period) sumTr -= tr[i - period]
    if (i >= period - 1) atr[i] = sumTr / period
  }
  for (let i = 0; i < n; i++) {
    const s = i - period + 1
    if (s < 0) continue
    const dev = std(close, s, i)
    const upperBB = ma[i] + multBB * dev
    const lowerBB = ma[i] - multBB * dev
    const upperKC = em[i] + multKC * (atr[i] ?? 0)
    const lowerKC = em[i] - multKC * (atr[i] ?? 0)
    const squeezeOn = upperBB <= upperKC && lowerBB >= lowerKC
    out[i] = squeezeOn ? 1 : 0
  }
  return out
}

// Full Squeeze bands for visualization
export function ttmBands(bars, period = 20, multBB = 2, multKC = 1.5) {
  const n = bars.length
  const close = bars.map(b => b.close)
  const high = bars.map(b => b.high)
  const low = bars.map(b => b.low)
  const ma = sma(close, period)
  const em = ema(close, period)
  const tr = new Array(n).fill(0)
  let prevClose = close[0] ?? 0
  for (let i = 0; i < n; i++) {
    const h = high[i], l = low[i], c = close[i]
    tr[i] = Math.max((h - l), Math.abs(h - prevClose), Math.abs(l - prevClose))
    prevClose = c
  }
  const atrArr = new Array(n).fill(null)
  let sumTr = 0
  for (let i = 0; i < n; i++) {
    sumTr += tr[i]
    if (i >= period) sumTr -= tr[i - period]
    if (i >= period - 1) atrArr[i] = sumTr / period
  }
  // rolling stddev
  const std = (arr, start, end) => {
    const m = end - start + 1
    if (m <= 1) return 0
    let mean = 0
    for (let i = start; i <= end; i++) mean += arr[i]
    mean /= m
    let v = 0
    for (let i = start; i <= end; i++) { const d = arr[i] - mean; v += d * d }
    return Math.sqrt(v / m)
  }
  const upperBB = new Array(n).fill(null)
  const lowerBB = new Array(n).fill(null)
  const upperKC = new Array(n).fill(null)
  const lowerKC = new Array(n).fill(null)
  for (let i = 0; i < n; i++) {
    const s = i - period + 1
    if (s < 0) continue
    const dev = std(close, s, i)
    upperBB[i] = ma[i] + multBB * dev
    lowerBB[i] = ma[i] - multBB * dev
    upperKC[i] = em[i] + multKC * (atrArr[i] ?? 0)
    lowerKC[i] = em[i] - multKC * (atrArr[i] ?? 0)
  }
  return { upperBB, lowerBB, upperKC, lowerKC }
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

// Pivot Ribbon (8/21/34): returns EMAs and state per index
export function pivotRibbon(values) {
  const e8 = ema(values, 8)
  const e21 = ema(values, 21)
  const e34 = ema(values, 34)
  const state = values.map((_, i) => {
    if (e8[i] == null || e21[i] == null || e34[i] == null) return 'neutral'
    if (e8[i] > e21[i] && e21[i] > e34[i]) return 'bullish'
    if (e8[i] < e21[i] && e21[i] < e34[i]) return 'bearish'
    return 'neutral'
  })
  const flips = []
  for (let i = 1; i < state.length; i++) {
    if (state[i] !== state[i - 1] && state[i] !== 'neutral' && state[i - 1] !== 'neutral') flips.push(i)
  }
  return { e8, e21, e34, state, flips }
}

export function ripsterBias3450(values) {
  const e34 = ema(values, 34)
  const e50 = ema(values, 50)
  const i = values.length - 1
  let bias = 'neutral'
  if (e34[i] != null && e50[i] != null) bias = e34[i] > e50[i] ? 'bullish' : e34[i] < e50[i] ? 'bearish' : 'neutral'
  return { e34, e50, bias }
}

export function satyTriggerDirection(bars, saty) {
  if (!bars?.length || !saty?.levels) return null
  const last = bars[bars.length - 1]
  const { t0236 } = saty.levels
  if (last.close > t0236.up) return 'long'
  if (last.close < t0236.dn) return 'short'
  return null
}

export function squeezeState(close, high, low, period = 20) {
  const sq = ttmSqueeze(close, high, low, period)
  const mom = linregMomentum(close, period)
  const i = close.length - 1
  const prev = i > 0 ? i - 1 : 0
  const on = sq[i] === 1
  const fired = sq[prev] === 1 && sq[i] === 0
  const dir = mom[i] > 0 ? 'up' : mom[i] < 0 ? 'down' : 'flat'
  // Find most recent fire index (transition 1 -> 0)
  let lastFiredIdx = -1
  for (let k = i; k > 0; k--) {
    if (sq[k - 1] === 1 && sq[k] === 0) { lastFiredIdx = k; break }
  }
  const firedBarsAgo = lastFiredIdx >= 0 ? (i - lastFiredIdx) : null
  const lastDir = lastFiredIdx >= 0 ? (mom[lastFiredIdx] > 0 ? 'up' : mom[lastFiredIdx] < 0 ? 'down' : 'flat') : null
  return { on, fired, dir, mom, sq, lastFiredIdx, firedBarsAgo, lastDir }
}

export function computeStates(bars) {
  const close = bars.map(b => b.close)
  const high = bars.map(b => b.high)
  const low = bars.map(b => b.low)
  const ribbon = pivotRibbon(close)
  const saty = satyAtrLevels(bars, 14)
  const rip = ripsterBias3450(close)
  const sq = squeezeState(close, high, low, 20)
  // Ichimoku simple regime: price vs cloud midpoint at last bar
  const ichi = ichimoku(bars)
  const i = bars.length - 1
  let ichiRegime = 'neutral'
  if (ichi?.spanA && ichi?.spanB) {
    const a = ichi.spanA[i]
    const b = ichi.spanB[i]
    const mid = (a != null && b != null) ? (a + b) / 2 : null
    if (mid != null) {
      if (close[i] > Math.max(a, b)) ichiRegime = 'bullish'
      else if (close[i] < Math.min(a, b)) ichiRegime = 'bearish'
      else ichiRegime = 'neutral'
    }
  }

  const pivotNow = ribbon.state[i]
  const satyDir = satyTriggerDirection(bars, saty)
  // Unicorn Score v1 heuristic
  let score = 0
  const components = {}
  const add = (k, v) => { components[k] = v; score += v }
  add('pivotRibbon', pivotNow === 'bullish' ? 20 : 0)
  add('ripster3450', rip.bias === 'bullish' ? 20 : 0)
  add('satyTrigger', (satyDir === 'long' && pivotNow === 'bullish') ? 20 : 0)
  // Squeeze scoring (symmetric):
  // - ON (compression building): +10
  // - Fired in the direction of prevailing regime (up for bull, down for bear): +25 (decays over 5 bars)
  let squeezeScore = 0
  if (sq.on) {
    squeezeScore = 10
  } else {
    const recent = sq.fired || (sq.firedBarsAgo != null && sq.firedBarsAgo <= 5)
    if (recent) {
      // Prevailing regime from ribbon/ichi
      const bullish = pivotNow === 'bullish' || ichiRegime === 'bullish'
      const bearish = pivotNow === 'bearish' || ichiRegime === 'bearish'
      const dirNow = sq.fired ? sq.dir : sq.lastDir
      const aligned = (dirNow === 'up' && bullish) || (dirNow === 'down' && bearish)
      if (aligned) {
        const age = sq.fired ? 0 : (sq.firedBarsAgo || 0)
        const base = 25
        const decayed = Math.max(5, base - age * 5)
        squeezeScore = decayed
      }
    }
  }
  add('squeeze', squeezeScore)
  add('ichimoku', ichiRegime === 'bullish' ? 15 : 0)

  const markers = []
  // Mark 8/21 crosses
  for (let k = 1; k < close.length; k++) {
    const prevUp = ribbon.e8[k - 1] != null && ribbon.e21[k - 1] != null && ribbon.e8[k - 1] > ribbon.e21[k - 1]
    const nowUp = ribbon.e8[k] != null && ribbon.e21[k] != null && ribbon.e8[k] > ribbon.e21[k]
    if (prevUp !== nowUp && ribbon.e8[k] != null && ribbon.e21[k] != null) {
      markers.push({
        time: bars[k].time,
        position: nowUp ? 'belowBar' : 'aboveBar',
        color: nowUp ? '#10b981' : '#ef4444',
        shape: nowUp ? 'arrowUp' : 'arrowDown',
        text: nowUp ? '8>21' : '8<21',
      })
    }
  }

  return {
    ribbon,
    saty,
    rip,
    sq,
    ichiRegime,
    pivotNow,
    satyDir,
    score,
    components,
    markers,
  }
}
