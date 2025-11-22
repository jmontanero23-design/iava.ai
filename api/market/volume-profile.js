/**
 * Ultra Elite++ Volume Profile API
 * Fetches REAL volume distribution data from market
 */

export default async function handler(req, res) {
  const { symbol = 'SPY', period = '1D' } = req.query

  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY

    if (!key || !secret) {
      return res.status(500).json({ error: 'Trading API not configured' })
    }

    // Determine timeframe based on period
    const { start, end, timeframe } = getTimeframeBounds(period)

    // Fetch historical bars for volume profile
    const barsResponse = await fetch(
      `https://data.alpaca.markets/v2/stocks/${symbol}/bars?` +
      `start=${start}&end=${end}&timeframe=${timeframe}&limit=1000&adjustment=raw&feed=iex`,
      {
        headers: {
          'APCA-API-KEY-ID': key,
          'APCA-API-SECRET-KEY': secret
        }
      }
    )

    if (!barsResponse.ok) {
      throw new Error('Failed to fetch market data')
    }

    const barsData = await barsResponse.json()
    const bars = barsData.bars || []

    // Calculate volume profile
    const profile = calculateVolumeProfile(bars)

    // Identify key levels
    const keyLevels = identifyKeyLevels(profile)

    // Calculate market profile metrics
    const metrics = calculateMarketProfileMetrics(profile, bars)

    // Fetch current price for reference
    const currentPrice = bars.length > 0 ? bars[bars.length - 1].c : 100

    // Response with real volume profile data
    const volumeProfile = {
      symbol,
      period,
      timestamp: new Date().toISOString(),
      currentPrice: currentPrice.toFixed(2),
      profile: profile.map(level => ({
        price: level.price.toFixed(2),
        volume: level.volume,
        buyVolume: level.buyVolume,
        sellVolume: level.sellVolume,
        tpo: level.tpo, // Time Price Opportunity
        percent: ((level.volume / metrics.totalVolume) * 100).toFixed(2),
        isVAH: level.price === keyLevels.vah,
        isPOC: level.price === keyLevels.poc,
        isVAL: level.price === keyLevels.val,
        delta: level.buyVolume - level.sellVolume
      })),
      keyLevels: {
        poc: keyLevels.poc.toFixed(2), // Point of Control
        vah: keyLevels.vah.toFixed(2), // Value Area High
        val: keyLevels.val.toFixed(2), // Value Area Low
        vwap: metrics.vwap.toFixed(2), // Volume Weighted Average Price
        developing: keyLevels.developing.toFixed(2)
      },
      metrics: {
        totalVolume: metrics.totalVolume,
        totalTrades: bars.length,
        valueAreaVolume: metrics.valueAreaVolume,
        valueAreaPercent: metrics.valueAreaPercent.toFixed(2),
        profileType: metrics.profileType,
        balance: metrics.balance,
        delta: metrics.delta,
        efficiency: metrics.efficiency.toFixed(2)
      },
      heatmap: generateHeatmap(profile, metrics.totalVolume),
      marketStructure: analyzeMarketStructure(profile, currentPrice, keyLevels)
    }

    return res.status(200).json(volumeProfile)

  } catch (error) {
    console.error('[Volume Profile API] Error:', error)
    return res.status(500).json({ error: 'Failed to fetch volume profile' })
  }
}

function getTimeframeBounds(period) {
  const now = new Date()
  const end = now.toISOString()
  let start, timeframe

  switch (period) {
    case '1D':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      timeframe = '5Min'
      break
    case '1W':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      timeframe = '15Min'
      break
    case '1M':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      timeframe = '1Hour'
      break
    default:
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      timeframe = '5Min'
  }

  return { start, end, timeframe }
}

function calculateVolumeProfile(bars) {
  if (bars.length === 0) return []

  // Find price range
  const prices = bars.flatMap(bar => [bar.h, bar.l])
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  // Create price levels (30 levels for granularity)
  const numLevels = 30
  const priceStep = (maxPrice - minPrice) / numLevels
  const profile = []

  for (let i = 0; i <= numLevels; i++) {
    const price = minPrice + (i * priceStep)
    profile.push({
      price,
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
      tpo: 0, // Time at this price level
      trades: 0
    })
  }

  // Distribute volume across price levels
  bars.forEach(bar => {
    const barMid = (bar.h + bar.l) / 2
    const levelIndex = Math.floor((barMid - minPrice) / priceStep)

    if (levelIndex >= 0 && levelIndex < profile.length) {
      profile[levelIndex].volume += bar.v

      // Estimate buy/sell volume based on close vs open
      if (bar.c >= bar.o) {
        profile[levelIndex].buyVolume += bar.v * 0.6
        profile[levelIndex].sellVolume += bar.v * 0.4
      } else {
        profile[levelIndex].buyVolume += bar.v * 0.4
        profile[levelIndex].sellVolume += bar.v * 0.6
      }

      profile[levelIndex].tpo++
      profile[levelIndex].trades += bar.n || 1
    }

    // Also distribute some volume to adjacent levels for smoothness
    if (levelIndex > 0) {
      profile[levelIndex - 1].volume += bar.v * 0.1
    }
    if (levelIndex < profile.length - 1) {
      profile[levelIndex + 1].volume += bar.v * 0.1
    }
  })

  // Filter out empty levels
  return profile.filter(level => level.volume > 0)
}

function identifyKeyLevels(profile) {
  if (profile.length === 0) {
    return { poc: 0, vah: 0, val: 0, developing: 0 }
  }

  // Point of Control (highest volume level)
  const poc = profile.reduce((max, level) =>
    level.volume > max.volume ? level : max
  ).price

  // Value Area (70% of volume)
  const totalVolume = profile.reduce((sum, level) => sum + level.volume, 0)
  const targetVolume = totalVolume * 0.7

  // Sort by volume
  const sorted = [...profile].sort((a, b) => b.volume - a.volume)
  let accVolume = 0
  const valueAreaLevels = []

  for (const level of sorted) {
    accVolume += level.volume
    valueAreaLevels.push(level.price)
    if (accVolume >= targetVolume) break
  }

  const vah = Math.max(...valueAreaLevels)
  const val = Math.min(...valueAreaLevels)

  // Developing value area (recent activity)
  const recentLevels = profile.slice(-Math.floor(profile.length / 3))
  const developing = recentLevels.reduce((max, level) =>
    level.volume > max.volume ? level : max
  ).price

  return { poc, vah, val, developing }
}

function calculateMarketProfileMetrics(profile, bars) {
  const totalVolume = profile.reduce((sum, level) => sum + level.volume, 0)

  // VWAP calculation
  let vwapNumerator = 0
  let vwapDenominator = 0
  bars.forEach(bar => {
    const typicalPrice = (bar.h + bar.l + bar.c) / 3
    vwapNumerator += typicalPrice * bar.v
    vwapDenominator += bar.v
  })
  const vwap = vwapDenominator > 0 ? vwapNumerator / vwapDenominator : 0

  // Value Area metrics
  const valueAreaLevels = [...profile].sort((a, b) => b.volume - a.volume)
  let valueAreaVolume = 0
  const targetVolume = totalVolume * 0.7

  for (const level of valueAreaLevels) {
    valueAreaVolume += level.volume
    if (valueAreaVolume >= targetVolume) break
  }

  const valueAreaPercent = (valueAreaVolume / totalVolume) * 100

  // Profile type (b, p, D, etc.)
  const profileShape = analyzeProfileShape(profile)

  // Balance/Imbalance
  const buyVolume = profile.reduce((sum, level) => sum + level.buyVolume, 0)
  const sellVolume = profile.reduce((sum, level) => sum + level.sellVolume, 0)
  const delta = buyVolume - sellVolume
  const balance = delta / totalVolume

  // Efficiency (how well distributed the volume is)
  const avgVolume = totalVolume / profile.length
  const variance = profile.reduce((sum, level) =>
    sum + Math.pow(level.volume - avgVolume, 2), 0
  ) / profile.length
  const efficiency = 100 - (Math.sqrt(variance) / avgVolume * 100)

  return {
    totalVolume,
    vwap,
    valueAreaVolume,
    valueAreaPercent,
    profileType: profileShape,
    balance,
    delta,
    efficiency
  }
}

function analyzeProfileShape(profile) {
  // Analyze the shape of the volume profile
  const maxVolume = Math.max(...profile.map(l => l.volume))
  const topHeavy = profile.slice(0, Math.floor(profile.length / 3))
    .reduce((sum, l) => sum + l.volume, 0)
  const bottomHeavy = profile.slice(-Math.floor(profile.length / 3))
    .reduce((sum, l) => sum + l.volume, 0)

  if (topHeavy > bottomHeavy * 1.5) return 'p-shape'
  if (bottomHeavy > topHeavy * 1.5) return 'b-shape'

  // Check for double distribution
  const peaks = profile.filter(l => l.volume > maxVolume * 0.7)
  if (peaks.length >= 2) return 'D-shape'

  return 'balanced'
}

function generateHeatmap(profile, totalVolume) {
  return profile.map(level => {
    const intensity = (level.volume / totalVolume) * 100
    return {
      price: level.price.toFixed(2),
      intensity: intensity.toFixed(2),
      color: getHeatmapColor(intensity)
    }
  })
}

function getHeatmapColor(intensity) {
  if (intensity > 10) return '#ff0000' // Red - high volume
  if (intensity > 5) return '#ff8800' // Orange
  if (intensity > 2) return '#ffff00' // Yellow
  if (intensity > 1) return '#00ff00' // Green
  return '#0088ff' // Blue - low volume
}

function analyzeMarketStructure(profile, currentPrice, keyLevels) {
  const structure = {
    trend: currentPrice > keyLevels.vah ? 'BULLISH' :
           currentPrice < keyLevels.val ? 'BEARISH' : 'NEUTRAL',
    position: currentPrice > keyLevels.poc ? 'ABOVE_POC' : 'BELOW_POC',
    nearestSupport: findNearestSupport(profile, currentPrice),
    nearestResistance: findNearestResistance(profile, currentPrice),
    strength: 'MODERATE'
  }

  // Determine strength based on volume distribution
  const abovePocVolume = profile
    .filter(l => l.price > keyLevels.poc)
    .reduce((sum, l) => sum + l.volume, 0)
  const belowPocVolume = profile
    .filter(l => l.price < keyLevels.poc)
    .reduce((sum, l) => sum + l.volume, 0)

  if (abovePocVolume > belowPocVolume * 1.5) structure.strength = 'STRONG_BULLISH'
  if (belowPocVolume > abovePocVolume * 1.5) structure.strength = 'STRONG_BEARISH'

  return structure
}

function findNearestSupport(profile, currentPrice) {
  const supports = profile
    .filter(l => l.price < currentPrice && l.volume > 0)
    .sort((a, b) => b.volume - a.volume)

  return supports.length > 0 ? supports[0].price.toFixed(2) : null
}

function findNearestResistance(profile, currentPrice) {
  const resistances = profile
    .filter(l => l.price > currentPrice && l.volume > 0)
    .sort((a, b) => b.volume - a.volume)

  return resistances.length > 0 ? resistances[0].price.toFixed(2) : null
}