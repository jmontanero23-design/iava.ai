/**
 * Harmonic Pattern Detection - Elite PhD Level Trading Patterns
 * Uses Fibonacci retracements to identify advanced price structures
 *
 * Patterns Detected:
 * - Gartley (222) - Most famous harmonic pattern
 * - Butterfly - Extended version of Gartley
 * - Bat - Precise Fibonacci measurements
 * - Crab - Deep retracement pattern
 * - Shark - 5-0 Pattern variant
 * - Cypher - Modern harmonic pattern
 * - ABCD - Foundation pattern
 * - Three Drives - Symmetrical pattern
 */

// Fibonacci ratios for harmonic patterns
const FIB_RATIOS = {
  0.236: 0.236,
  0.382: 0.382,
  0.500: 0.500,
  0.618: 0.618,
  0.786: 0.786,
  0.886: 0.886,
  1.000: 1.000,
  1.272: 1.272,
  1.414: 1.414,
  1.618: 1.618,
  2.000: 2.000,
  2.240: 2.240,
  2.618: 2.618,
  3.618: 3.618
}

// Pattern specifications with Fibonacci requirements
const HARMONIC_PATTERNS = {
  gartley: {
    name: 'Gartley 222',
    XB: { min: 0.600, max: 0.640 }, // 0.618
    AC: { min: 0.370, max: 0.900 }, // 0.382 to 0.886
    BD: { min: 1.100, max: 1.300 }, // 1.13 to 1.272
    XD: { min: 0.770, max: 0.800 }, // 0.786
    confidence: 85
  },
  butterfly: {
    name: 'Butterfly',
    XB: { min: 0.770, max: 0.800 }, // 0.786
    AC: { min: 0.370, max: 0.900 }, // 0.382 to 0.886
    BD: { min: 1.600, max: 2.700 }, // 1.618 to 2.618
    XD: { min: 1.250, max: 1.280 }, // 1.272
    confidence: 82
  },
  bat: {
    name: 'Bat',
    XB: { min: 0.370, max: 0.520 }, // 0.382 to 0.500
    AC: { min: 0.370, max: 0.900 }, // 0.382 to 0.886
    BD: { min: 1.600, max: 2.700 }, // 1.618 to 2.618
    XD: { min: 0.870, max: 0.900 }, // 0.886
    confidence: 88
  },
  crab: {
    name: 'Crab',
    XB: { min: 0.370, max: 0.640 }, // 0.382 to 0.618
    AC: { min: 0.370, max: 0.900 }, // 0.382 to 0.886
    BD: { min: 2.200, max: 3.700 }, // 2.24 to 3.618
    XD: { min: 1.600, max: 1.650 }, // 1.618
    confidence: 90
  },
  shark: {
    name: 'Shark',
    XB: { min: 0.440, max: 0.650 }, // No specific XB
    AC: { min: 1.100, max: 1.650 }, // 1.13 to 1.618
    BD: { min: 1.600, max: 2.300 }, // 1.618 to 2.24
    XD: { min: 0.870, max: 1.150 }, // 0.886 to 1.13
    confidence: 75
  },
  cypher: {
    name: 'Cypher',
    XB: { min: 0.370, max: 0.640 }, // 0.382 to 0.618
    AC: { min: 1.250, max: 1.450 }, // 1.272 to 1.414
    BD: { min: 1.250, max: 2.050 }, // 1.272 to 2.000
    XD: { min: 0.770, max: 0.800 }, // 0.786
    confidence: 78
  }
}

// Find swing points (peaks and troughs)
export function findSwingPoints(chart, lookback = 5) {
  const swings = []

  for (let i = lookback; i < chart.length - lookback; i++) {
    const current = chart[i]
    const prevBars = chart.slice(i - lookback, i)
    const nextBars = chart.slice(i + 1, i + lookback + 1)

    // Check for swing high
    const isSwingHigh = prevBars.every(bar => bar.high <= current.high) &&
                        nextBars.every(bar => bar.high <= current.high)

    // Check for swing low
    const isSwingLow = prevBars.every(bar => bar.low >= current.low) &&
                       nextBars.every(bar => bar.low >= current.low)

    if (isSwingHigh) {
      swings.push({
        index: i,
        type: 'high',
        price: current.high,
        time: current.time
      })
    }

    if (isSwingLow) {
      swings.push({
        index: i,
        type: 'low',
        price: current.low,
        time: current.time
      })
    }
  }

  return swings
}

// Calculate Fibonacci ratio between two price levels
export function calculateFibRatio(start, end, reference) {
  const move = end - start
  const retracement = Math.abs(reference - end)
  return Math.abs(retracement / move)
}

// Check if ratio is within tolerance
function isRatioValid(ratio, min, max, tolerance = 0.05) {
  const adjustedMin = min * (1 - tolerance)
  const adjustedMax = max * (1 + tolerance)
  return ratio >= adjustedMin && ratio <= adjustedMax
}

// Detect XABCD harmonic pattern
export function detectHarmonicPattern(X, A, B, C, D, patternType = 'all') {
  const patterns = []

  // Calculate ratios
  const XB = Math.abs((B.price - X.price) / (A.price - X.price))
  const AC = Math.abs((C.price - A.price) / (B.price - A.price))
  const BD = Math.abs((D.price - B.price) / (C.price - B.price))
  const XD = Math.abs((D.price - X.price) / (A.price - X.price))

  // Determine if bullish or bearish
  const isBullish = X.type === 'low' && A.type === 'high' && B.type === 'low' &&
                    C.type === 'high' && D.type === 'low'
  const isBearish = X.type === 'high' && A.type === 'low' && B.type === 'high' &&
                    C.type === 'low' && D.type === 'high'

  if (!isBullish && !isBearish) return patterns

  // Check each pattern
  const patternsToCheck = patternType === 'all' ? Object.keys(HARMONIC_PATTERNS) : [patternType]

  for (const pattern of patternsToCheck) {
    const spec = HARMONIC_PATTERNS[pattern]
    if (!spec) continue

    // Check if all ratios match the pattern
    if (isRatioValid(XB, spec.XB.min, spec.XB.max) &&
        isRatioValid(AC, spec.AC.min, spec.AC.max) &&
        isRatioValid(BD, spec.BD.min, spec.BD.max) &&
        isRatioValid(XD, spec.XD.min, spec.XD.max)) {

      patterns.push({
        pattern: spec.name,
        type: isBullish ? 'bullish' : 'bearish',
        points: { X, A, B, C, D },
        ratios: {
          XB: XB.toFixed(3),
          AC: AC.toFixed(3),
          BD: BD.toFixed(3),
          XD: XD.toFixed(3)
        },
        confidence: spec.confidence,
        prz: D.price, // Potential Reversal Zone
        target1: isBullish ? D.price + (A.price - D.price) * 0.382 :
                            D.price - (D.price - A.price) * 0.382,
        target2: isBullish ? D.price + (A.price - D.price) * 0.618 :
                            D.price - (D.price - A.price) * 0.618,
        stopLoss: isBullish ? D.price - (D.price - X.price) * 0.1 :
                             D.price + (X.price - D.price) * 0.1
      })
    }
  }

  return patterns
}

// Detect ABCD pattern (simpler harmonic pattern)
export function detectABCDPattern(A, B, C, D) {
  // ABCD ratios
  const BC = Math.abs((C.price - B.price) / (B.price - A.price))
  const CD = Math.abs((D.price - C.price) / (C.price - B.price))

  // Check for valid ABCD pattern
  const isValidABCD = (
    (isRatioValid(BC, 0.600, 0.800) && isRatioValid(CD, 1.250, 1.650)) || // 0.618/1.272
    (isRatioValid(BC, 0.770, 0.800) && isRatioValid(CD, 1.000, 1.280)) || // 0.786/1.272
    (isRatioValid(BC, 0.870, 0.900) && isRatioValid(CD, 1.000, 1.150))    // 0.886/1.13
  )

  if (!isValidABCD) return null

  const isBullish = A.type === 'low' && B.type === 'high' && C.type === 'low' && D.type === 'high'
  const isBearish = A.type === 'high' && B.type === 'low' && C.type === 'high' && D.type === 'low'

  if (!isBullish && !isBearish) return null

  return {
    pattern: 'ABCD',
    type: isBullish ? 'bullish' : 'bearish',
    points: { A, B, C, D },
    ratios: {
      BC: BC.toFixed(3),
      CD: CD.toFixed(3)
    },
    confidence: 75,
    prz: D.price,
    target1: isBullish ? D.price + (B.price - D.price) * 0.382 :
                        D.price - (D.price - B.price) * 0.382,
    target2: isBullish ? D.price + (B.price - D.price) * 0.618 :
                        D.price - (D.price - B.price) * 0.618,
    stopLoss: isBullish ? C.price - (C.price - A.price) * 0.1 :
                         C.price + (A.price - C.price) * 0.1
  }
}

// Main function to scan for all harmonic patterns
export function scanForHarmonicPatterns(chart, minSwingSize = 0.01) {
  if (!chart || chart.length < 50) return []

  const patterns = []
  const swings = findSwingPoints(chart, 3)

  // Need at least 5 swing points for XABCD pattern
  if (swings.length < 5) return patterns

  // Filter out minor swings
  const significantSwings = swings.filter((swing, i) => {
    if (i === 0) return true
    const prevSwing = swings[i - 1]
    const priceChange = Math.abs(swing.price - prevSwing.price) / prevSwing.price
    return priceChange >= minSwingSize
  })

  // Look for XABCD patterns
  for (let i = 0; i <= significantSwings.length - 5; i++) {
    const X = significantSwings[i]
    const A = significantSwings[i + 1]
    const B = significantSwings[i + 2]
    const C = significantSwings[i + 3]
    const D = significantSwings[i + 4]

    // Must alternate between highs and lows
    if (X.type === A.type || A.type === B.type || B.type === C.type || C.type === D.type) {
      continue
    }

    // Detect harmonic patterns
    const harmonics = detectHarmonicPattern(X, A, B, C, D)
    patterns.push(...harmonics)

    // Also check for ABCD pattern
    const abcd = detectABCDPattern(A, B, C, D)
    if (abcd) patterns.push(abcd)
  }

  // Sort by confidence
  patterns.sort((a, b) => b.confidence - a.confidence)

  // Return top patterns (limit to prevent clutter)
  return patterns.slice(0, 3)
}

// Get pattern description
export function getHarmonicDescription(pattern) {
  const direction = pattern.type === 'bullish' ? '📈 Bullish' : '📉 Bearish'
  const prz = pattern.prz.toFixed(2)
  const target1 = pattern.target1.toFixed(2)
  const target2 = pattern.target2.toFixed(2)
  const stop = pattern.stopLoss.toFixed(2)

  return {
    title: `${direction} ${pattern.pattern}`,
    description: `PRZ at $${prz} with Fibonacci confluence`,
    action: pattern.type === 'bullish' ?
      `Buy near $${prz}, targets $${target1}/$${target2}, stop $${stop}` :
      `Sell near $${prz}, targets $${target1}/$${target2}, stop $${stop}`,
    ratios: `XB: ${pattern.ratios.XB}, AC: ${pattern.ratios.AC}, BD: ${pattern.ratios.BD}, XD: ${pattern.ratios.XD}`
  }
}

// Three Drives Pattern Detection
export function detectThreeDrives(chart) {
  const swings = findSwingPoints(chart, 4)
  if (swings.length < 7) return null

  // Need 3 drives and 2 retracements
  const drives = []
  const retracements = []

  for (let i = 0; i < swings.length; i++) {
    if (i % 2 === 0) {
      drives.push(swings[i])
    } else {
      retracements.push(swings[i])
    }
  }

  if (drives.length < 3 || retracements.length < 2) return null

  // Check for symmetry (1.272 or 1.618 extensions)
  const drive1 = Math.abs(drives[1].price - drives[0].price)
  const drive2 = Math.abs(drives[2].price - drives[1].price)
  const ratio = drive2 / drive1

  if (isRatioValid(ratio, 1.250, 1.650)) {
    return {
      pattern: 'Three Drives',
      type: drives[0].type === 'low' ? 'bullish' : 'bearish',
      confidence: 72,
      prz: drives[2].price,
      description: 'Symmetrical exhaustion pattern detected'
    }
  }

  return null
}