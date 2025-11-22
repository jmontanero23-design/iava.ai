/**
 * Volume Profile Analysis - Elite PhD Level
 * TPO (Time Price Opportunity), VWAP, POC (Point of Control)
 * Market Profile and Volume Distribution Analysis
 */

/**
 * Calculate Volume Profile from price and volume data
 * @param {Array} bars - Array of OHLCV bars
 * @param {number} bins - Number of price levels
 * @returns {Object} Volume profile data
 */
export function calculateVolumeProfile(bars, bins = 30) {
  if (!bars || bars.length === 0) return null

  // Find price range
  const highs = bars.map(b => b.high)
  const lows = bars.map(b => b.low)
  const maxPrice = Math.max(...highs)
  const minPrice = Math.min(...lows)
  const priceRange = maxPrice - minPrice

  if (priceRange <= 0) return null

  // Initialize bins
  const binSize = priceRange / bins
  const volumeProfile = []

  for (let i = 0; i < bins; i++) {
    const binLow = minPrice + (i * binSize)
    const binHigh = binLow + binSize
    const binMid = (binLow + binHigh) / 2

    volumeProfile.push({
      price: binMid,
      priceLow: binLow,
      priceHigh: binHigh,
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
      trades: 0,
      time: 0,
      tpo: [] // Time Price Opportunities
    })
  }

  // Distribute volume across bins
  bars.forEach((bar, barIndex) => {
    const barVolume = bar.volume || 0
    const barHigh = bar.high
    const barLow = bar.low
    const barMid = (bar.high + bar.low + bar.close) / 3 // Typical price

    // Determine if buying or selling pressure
    const isBullish = bar.close >= bar.open

    // Find bins that this bar overlaps
    volumeProfile.forEach(bin => {
      if (barHigh >= bin.priceLow && barLow <= bin.priceHigh) {
        // Calculate overlap percentage
        const overlapHigh = Math.min(barHigh, bin.priceHigh)
        const overlapLow = Math.max(barLow, bin.priceLow)
        const overlapRange = overlapHigh - overlapLow
        const barRange = barHigh - barLow || 1
        const overlapPercent = overlapRange / barRange

        // Distribute volume proportionally
        const distributedVolume = barVolume * overlapPercent
        bin.volume += distributedVolume
        bin.trades++

        if (isBullish) {
          bin.buyVolume += distributedVolume * 0.6
          bin.sellVolume += distributedVolume * 0.4
        } else {
          bin.sellVolume += distributedVolume * 0.6
          bin.buyVolume += distributedVolume * 0.4
        }

        // Add TPO (30-min periods)
        const tpoPeriod = Math.floor(barIndex / 30) // Assuming 1-min bars
        if (!bin.tpo.includes(tpoPeriod)) {
          bin.tpo.push(tpoPeriod)
        }
        bin.time = bin.tpo.length
      }
    })
  })

  // Calculate statistics
  const totalVolume = volumeProfile.reduce((sum, bin) => sum + bin.volume, 0)
  const maxBinVolume = Math.max(...volumeProfile.map(b => b.volume))

  // Find POC (Point of Control) - highest volume node
  const pocBin = volumeProfile.reduce((max, bin) =>
    bin.volume > max.volume ? bin : max
  )

  // Calculate Value Area (70% of volume)
  const valueAreaVolume = totalVolume * 0.7
  let vaVolume = pocBin.volume
  let vaHigh = pocBin.price
  let vaLow = pocBin.price

  // Expand from POC until we have 70% of volume
  const pocIndex = volumeProfile.findIndex(b => b.price === pocBin.price)
  let upperIndex = pocIndex + 1
  let lowerIndex = pocIndex - 1

  while (vaVolume < valueAreaVolume) {
    let upperVolume = upperIndex < volumeProfile.length ? volumeProfile[upperIndex].volume : 0
    let lowerVolume = lowerIndex >= 0 ? volumeProfile[lowerIndex].volume : 0

    if (upperVolume >= lowerVolume && upperIndex < volumeProfile.length) {
      vaVolume += upperVolume
      vaHigh = volumeProfile[upperIndex].price
      upperIndex++
    } else if (lowerIndex >= 0) {
      vaVolume += lowerVolume
      vaLow = volumeProfile[lowerIndex].price
      lowerIndex--
    } else {
      break
    }
  }

  // Calculate percentages and normalize
  volumeProfile.forEach(bin => {
    bin.percentage = (bin.volume / maxBinVolume) * 100
    bin.volumePercent = (bin.volume / totalVolume) * 100
    bin.delta = bin.buyVolume - bin.sellVolume
    bin.deltaPercent = bin.volume > 0 ? (bin.delta / bin.volume) * 100 : 0
  })

  return {
    profile: volumeProfile,
    poc: pocBin.price,
    pocVolume: pocBin.volume,
    valueAreaHigh: vaHigh,
    valueAreaLow: vaLow,
    valueAreaVolume: vaVolume,
    totalVolume,
    maxBinVolume,
    priceRange: { min: minPrice, max: maxPrice }
  }
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 * @param {Array} bars - Array of OHLCV bars
 * @returns {Array} VWAP values
 */
export function calculateVWAP(bars) {
  if (!bars || bars.length === 0) return []

  const vwap = []
  let cumulativeTPV = 0 // Typical Price * Volume
  let cumulativeVolume = 0

  bars.forEach((bar, index) => {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3
    const volume = bar.volume || 0

    cumulativeTPV += typicalPrice * volume
    cumulativeVolume += volume

    const vwapValue = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice

    // Calculate standard deviation bands
    let sumSquaredDiff = 0
    for (let i = 0; i <= index; i++) {
      const tp = (bars[i].high + bars[i].low + bars[i].close) / 3
      sumSquaredDiff += Math.pow(tp - vwapValue, 2) * bars[i].volume
    }

    const variance = cumulativeVolume > 0 ? sumSquaredDiff / cumulativeVolume : 0
    const stdDev = Math.sqrt(variance)

    vwap.push({
      time: bar.time,
      vwap: vwapValue,
      upper1: vwapValue + stdDev,
      upper2: vwapValue + (2 * stdDev),
      upper3: vwapValue + (3 * stdDev),
      lower1: vwapValue - stdDev,
      lower2: vwapValue - (2 * stdDev),
      lower3: vwapValue - (3 * stdDev),
      volume: cumulativeVolume
    })
  })

  return vwap
}

/**
 * Calculate Market Profile (TPO - Time Price Opportunity)
 * @param {Array} bars - Array of OHLCV bars
 * @param {number} periodMinutes - TPO period in minutes (usually 30)
 * @returns {Object} Market profile data
 */
export function calculateMarketProfile(bars, periodMinutes = 30) {
  if (!bars || bars.length === 0) return null

  const profile = {}
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let currentPeriod = 0
  let periodStart = 0

  // Group bars into TPO periods
  bars.forEach((bar, index) => {
    // Check if we need to start a new period
    if (index - periodStart >= periodMinutes) {
      currentPeriod++
      periodStart = index
    }

    const letter = letters[currentPeriod % letters.length]
    const high = Math.round(bar.high * 100) / 100
    const low = Math.round(bar.low * 100) / 100

    // Mark all prices in range with the period letter
    for (let price = low; price <= high; price += 0.01) {
      const priceKey = price.toFixed(2)
      if (!profile[priceKey]) {
        profile[priceKey] = {
          price: price,
          tpo: [],
          volume: 0,
          firstPeriod: currentPeriod,
          lastPeriod: currentPeriod
        }
      }

      if (!profile[priceKey].tpo.includes(letter)) {
        profile[priceKey].tpo.push(letter)
      }
      profile[priceKey].volume += bar.volume / ((high - low) / 0.01 || 1)
      profile[priceKey].lastPeriod = currentPeriod
    }
  })

  // Convert to array and calculate statistics
  const profileArray = Object.values(profile).sort((a, b) => b.price - a.price)

  // Find POC (most TPO prints)
  const poc = profileArray.reduce((max, level) =>
    level.tpo.length > max.tpo.length ? level : max
  )

  // Calculate Initial Balance (first two periods)
  const ibLevels = profileArray.filter(level =>
    level.firstPeriod === 0 || level.firstPeriod === 1
  )
  const ibHigh = Math.max(...ibLevels.map(l => l.price))
  const ibLow = Math.min(...ibLevels.map(l => l.price))

  // Identify profile shape
  const shape = identifyProfileShape(profileArray)

  return {
    profile: profileArray,
    poc: poc.price,
    pocTPO: poc.tpo.length,
    initialBalanceHigh: ibHigh,
    initialBalanceLow: ibLow,
    shape,
    periods: currentPeriod + 1,
    range: {
      high: Math.max(...profileArray.map(l => l.price)),
      low: Math.min(...profileArray.map(l => l.price))
    }
  }
}

/**
 * Identify market profile shape
 * @param {Array} profile - Market profile data
 * @returns {Object} Profile shape analysis
 */
function identifyProfileShape(profile) {
  if (!profile || profile.length === 0) return { type: 'unknown' }

  const maxTPO = Math.max(...profile.map(l => l.tpo.length))
  const pocIndex = profile.findIndex(l => l.tpo.length === maxTPO)
  const totalLevels = profile.length

  // Calculate distribution
  const upperThird = profile.slice(0, Math.floor(totalLevels / 3))
  const middleThird = profile.slice(Math.floor(totalLevels / 3), Math.floor(2 * totalLevels / 3))
  const lowerThird = profile.slice(Math.floor(2 * totalLevels / 3))

  const upperVolume = upperThird.reduce((sum, l) => sum + l.tpo.length, 0)
  const middleVolume = middleThird.reduce((sum, l) => sum + l.tpo.length, 0)
  const lowerVolume = lowerThird.reduce((sum, l) => sum + l.tpo.length, 0)

  // Identify shape type
  let type = 'normal'
  let description = ''

  if (middleVolume > upperVolume * 1.5 && middleVolume > lowerVolume * 1.5) {
    type = 'normal'
    description = 'Balanced market with acceptance in middle range'
  } else if (upperVolume > middleVolume * 1.2 && upperVolume > lowerVolume * 1.2) {
    type = 'p-shape'
    description = 'Selling pressure, long liquidation likely'
  } else if (lowerVolume > middleVolume * 1.2 && lowerVolume > upperVolume * 1.2) {
    type = 'b-shape'
    description = 'Buying pressure, short covering likely'
  } else if (Math.abs(upperVolume - lowerVolume) < middleVolume * 0.2) {
    type = 'double-distribution'
    description = 'Two accepted price areas, potential for breakout'
  } else {
    type = 'trending'
    description = pocIndex < totalLevels / 2 ? 'Uptrend continuation' : 'Downtrend continuation'
  }

  return {
    type,
    description,
    pocPosition: pocIndex / totalLevels,
    balance: {
      upper: upperVolume,
      middle: middleVolume,
      lower: lowerVolume
    }
  }
}

/**
 * Calculate Cumulative Volume Delta (CVD)
 * @param {Array} bars - Array of OHLCV bars
 * @returns {Array} CVD values
 */
export function calculateCVD(bars) {
  if (!bars || bars.length === 0) return []

  const cvd = []
  let cumulativeDelta = 0

  bars.forEach(bar => {
    // Estimate buy/sell volume
    const range = bar.high - bar.low || 1
    const closePosition = (bar.close - bar.low) / range

    const buyVolume = bar.volume * closePosition
    const sellVolume = bar.volume * (1 - closePosition)
    const delta = buyVolume - sellVolume

    cumulativeDelta += delta

    cvd.push({
      time: bar.time,
      delta: delta,
      cumulative: cumulativeDelta,
      buyVolume: buyVolume,
      sellVolume: sellVolume,
      ratio: buyVolume / (sellVolume || 1)
    })
  })

  return cvd
}

/**
 * Identify High Volume Nodes (HVN) and Low Volume Nodes (LVN)
 * @param {Object} volumeProfile - Volume profile data
 * @returns {Object} HVN and LVN levels
 */
export function identifyVolumeNodes(volumeProfile) {
  if (!volumeProfile || !volumeProfile.profile) return null

  const profile = volumeProfile.profile
  const avgVolume = volumeProfile.totalVolume / profile.length

  const hvn = [] // High Volume Nodes
  const lvn = [] // Low Volume Nodes

  profile.forEach((bin, index) => {
    // Check if local maximum (HVN)
    const prevVolume = index > 0 ? profile[index - 1].volume : 0
    const nextVolume = index < profile.length - 1 ? profile[index + 1].volume : 0

    if (bin.volume > prevVolume && bin.volume > nextVolume && bin.volume > avgVolume * 1.5) {
      hvn.push({
        price: bin.price,
        volume: bin.volume,
        strength: bin.volume / avgVolume,
        type: 'resistance' // HVN often act as resistance
      })
    }

    // Check if local minimum (LVN)
    if (bin.volume < prevVolume && bin.volume < nextVolume && bin.volume < avgVolume * 0.5) {
      lvn.push({
        price: bin.price,
        volume: bin.volume,
        strength: avgVolume / (bin.volume || 1),
        type: 'breakout' // LVN often lead to quick moves
      })
    }
  })

  return {
    hvn: hvn.sort((a, b) => b.volume - a.volume).slice(0, 5), // Top 5 HVN
    lvn: lvn.sort((a, b) => a.volume - b.volume).slice(0, 5), // Top 5 LVN
    avgVolume
  }
}

/**
 * Calculate Volume-Price Analysis metrics
 * @param {Array} bars - Array of OHLCV bars
 * @returns {Object} Volume analysis metrics
 */
export function analyzeVolumePriceRelationship(bars) {
  if (!bars || bars.length < 2) return null

  const metrics = {
    volumeROC: [], // Volume rate of change
    priceByVolume: [], // Price movement per unit volume
    volumeEfficiency: [], // How efficiently volume moves price
    accumulation: 0, // Accumulation/Distribution
    onBalanceVolume: []
  }

  let obv = 0
  let accumDist = 0

  bars.forEach((bar, index) => {
    if (index === 0) {
      metrics.volumeROC.push(0)
      metrics.priceByVolume.push(0)
      metrics.volumeEfficiency.push(0)
      metrics.onBalanceVolume.push(0)
      return
    }

    const prevBar = bars[index - 1]

    // Volume ROC
    const volumeROC = prevBar.volume > 0 ?
      ((bar.volume - prevBar.volume) / prevBar.volume) * 100 : 0
    metrics.volumeROC.push(volumeROC)

    // Price by Volume
    const priceChange = ((bar.close - prevBar.close) / prevBar.close) * 100
    const priceByVolume = bar.volume > 0 ? priceChange / (bar.volume / 1000000) : 0
    metrics.priceByVolume.push(priceByVolume)

    // Volume Efficiency
    const efficiency = bar.volume > 0 ? Math.abs(priceChange) / Math.log(bar.volume + 1) : 0
    metrics.volumeEfficiency.push(efficiency)

    // On Balance Volume
    if (bar.close > prevBar.close) {
      obv += bar.volume
    } else if (bar.close < prevBar.close) {
      obv -= bar.volume
    }
    metrics.onBalanceVolume.push(obv)

    // Accumulation/Distribution
    const moneyFlow = ((bar.close - bar.low) - (bar.high - bar.close)) / (bar.high - bar.low || 1)
    accumDist += moneyFlow * bar.volume
  })

  metrics.accumulation = accumDist

  // Calculate averages
  const avgVolumeROC = metrics.volumeROC.reduce((a, b) => a + b, 0) / metrics.volumeROC.length
  const avgEfficiency = metrics.volumeEfficiency.reduce((a, b) => a + b, 0) / metrics.volumeEfficiency.length

  return {
    ...metrics,
    summary: {
      avgVolumeROC,
      avgEfficiency,
      trend: obv > 0 ? 'accumulation' : 'distribution',
      strength: Math.abs(accumDist / bars.reduce((sum, b) => sum + b.volume, 0))
    }
  }
}