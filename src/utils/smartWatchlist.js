/**
 * Smart Watchlist Builder
 * AI-powered symbol recommendations based on strategy fit and user preferences
 *
 * Features:
 * - Personalized symbol recommendations
 * - Strategy compatibility scoring
 * - Sector and market cap diversification
 * - Technical setup detection (breakouts, pullbacks, etc.)
 * - Volume and liquidity filtering
 * - Correlation analysis (avoid over-concentration)
 * - Integration with AI Gateway for intelligent suggestions
 */

import { callAI } from './aiGateway.js'

/**
 * Symbol universe by category
 */
const SYMBOL_UNIVERSE = {
  megaCap: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B'],
  largeCap: ['JPM', 'V', 'WMT', 'JNJ', 'PG', 'MA', 'HD', 'DIS', 'NFLX', 'ADBE'],
  midCap: ['PLTR', 'COIN', 'SNOW', 'CRWD', 'NET', 'DDOG', 'ZS', 'FTNT', 'MDB', 'TEAM'],
  growth: ['NVDA', 'TSLA', 'PLTR', 'SNOW', 'CRWD', 'DDOG', 'NET', 'ZS', 'ROKU', 'SQ'],
  value: ['BRK.B', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'TFC'],
  tech: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'INTC', 'QCOM', 'AVGO', 'CRM'],
  finance: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'V', 'MA', 'AXP', 'BLK'],
  healthcare: ['JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'DHR', 'MRK', 'LLY', 'BMY'],
  energy: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL'],
  consumer: ['AMZN', 'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'COST', 'TJX']
}

/**
 * Get all unique symbols
 */
function getAllSymbols() {
  const allSymbols = new Set()
  for (const category of Object.values(SYMBOL_UNIVERSE)) {
    category.forEach(sym => allSymbols.add(sym))
  }
  return Array.from(allSymbols)
}

/**
 * Score symbol compatibility with user strategy
 */
export function scoreSymbolFit(symbol, userProfile, marketData = {}) {
  const scores = {
    marketCap: 0,
    sector: 0,
    volatility: 0,
    liquidity: 0,
    technicalSetup: 0
  }

  // Market cap preference
  const { preferredMarketCap = 'any' } = userProfile
  if (preferredMarketCap !== 'any') {
    const category = SYMBOL_UNIVERSE[preferredMarketCap] || []
    scores.marketCap = category.includes(symbol) ? 1.0 : 0.3
  } else {
    scores.marketCap = 0.7
  }

  // Sector preference
  const { preferredSectors = [] } = userProfile
  if (preferredSectors.length > 0) {
    let inPreferredSector = false
    for (const sector of preferredSectors) {
      const category = SYMBOL_UNIVERSE[sector] || []
      if (category.includes(symbol)) {
        inPreferredSector = true
        break
      }
    }
    scores.sector = inPreferredSector ? 1.0 : 0.4
  } else {
    scores.sector = 0.7
  }

  // Volatility preference
  const { preferredVolatility = 'medium' } = userProfile
  const { atrPercent = 2.0 } = marketData

  if (preferredVolatility === 'high' && atrPercent >= 3.0) scores.volatility = 1.0
  else if (preferredVolatility === 'high' && atrPercent >= 2.0) scores.volatility = 0.7
  else if (preferredVolatility === 'medium' && atrPercent >= 1.5 && atrPercent < 3.0) scores.volatility = 1.0
  else if (preferredVolatility === 'low' && atrPercent < 1.5) scores.volatility = 1.0
  else scores.volatility = 0.5

  // Liquidity (volume)
  const { avgVolume = 1000000 } = marketData
  scores.liquidity = avgVolume >= 1000000 ? 1.0 : avgVolume >= 500000 ? 0.7 : 0.4

  // Technical setup detection
  const { setup = null } = marketData
  const { preferredSetups = [] } = userProfile

  if (preferredSetups.length > 0 && setup) {
    scores.technicalSetup = preferredSetups.includes(setup) ? 1.0 : 0.5
  } else {
    scores.technicalSetup = 0.7
  }

  // Weighted average
  const weights = {
    marketCap: 0.15,
    sector: 0.20,
    volatility: 0.25,
    liquidity: 0.20,
    technicalSetup: 0.20
  }

  const finalScore = Object.keys(scores).reduce((sum, key) => {
    return sum + scores[key] * weights[key]
  }, 0)

  return {
    score: finalScore,
    breakdown: scores
  }
}

/**
 * Build user profile from trading history and preferences
 */
export function buildUserProfile(options = {}) {
  const {
    trades = [],
    preferences = {},
    watchlist = []
  } = options

  // Analyze past trades
  const symbolFrequency = {}
  const sectorFrequency = {}

  for (const trade of trades) {
    symbolFrequency[trade.symbol] = (symbolFrequency[trade.symbol] || 0) + 1

    // Determine sector
    for (const [sector, symbols] of Object.entries(SYMBOL_UNIVERSE)) {
      if (symbols.includes(trade.symbol)) {
        sectorFrequency[sector] = (sectorFrequency[sector] || 0) + 1
      }
    }
  }

  // Find most traded sectors
  const topSectors = Object.entries(sectorFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector]) => sector)

  return {
    preferredMarketCap: preferences.marketCap || 'any',
    preferredSectors: preferences.sectors || topSectors,
    preferredVolatility: preferences.volatility || 'medium',
    preferredSetups: preferences.setups || ['breakout', 'pullback'],
    currentWatchlist: watchlist,
    tradingHistory: {
      totalTrades: trades.length,
      topSymbols: Object.entries(symbolFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([sym]) => sym)
    }
  }
}

/**
 * Get smart symbol recommendations
 */
export async function getSmartRecommendations(userProfile, count = 5) {
  const allSymbols = getAllSymbols()
  const currentWatchlist = userProfile.currentWatchlist || []

  // Filter out already watched symbols
  const candidates = allSymbols.filter(sym => !currentWatchlist.includes(sym))

  // For demo purposes, simulate market data
  // In production, this would fetch real-time data
  const scoredSymbols = candidates.map(symbol => {
    const mockMarketData = {
      atrPercent: 1.5 + Math.random() * 2.0,
      avgVolume: 500000 + Math.random() * 5000000,
      setup: ['breakout', 'pullback', 'momentum', 'reversal'][Math.floor(Math.random() * 4)]
    }

    const fit = scoreSymbolFit(symbol, userProfile, mockMarketData)

    return {
      symbol,
      fitScore: fit.score,
      breakdown: fit.breakdown,
      marketData: mockMarketData
    }
  })

  // Sort by fit score
  scoredSymbols.sort((a, b) => b.fitScore - a.fitScore)

  // Get top candidates
  const topCandidates = scoredSymbols.slice(0, Math.min(count * 2, 20))

  // Use AI to provide reasoning
  const messages = [
    {
      role: 'system',
      content: 'You are a stock recommendation analyst. Provide concise reasoning for why a symbol is a good fit for the user\'s strategy.'
    },
    {
      role: 'user',
      content: `User Profile:
- Preferred Market Cap: ${userProfile.preferredMarketCap}
- Preferred Sectors: ${userProfile.preferredSectors.join(', ')}
- Preferred Volatility: ${userProfile.preferredVolatility}
- Preferred Setups: ${userProfile.preferredSetups.join(', ')}
- Current Watchlist: ${currentWatchlist.join(', ')}

Top Candidates:
${topCandidates.map(c => `${c.symbol} (fit: ${(c.fitScore * 100).toFixed(0)}%, ATR: ${c.marketData.atrPercent.toFixed(1)}%, setup: ${c.marketData.setup})`).join('\n')}

Recommend the top ${count} symbols with brief reasoning for each (2-3 sentences). Return JSON:
{
  "recommendations": [
    {
      "symbol": "AAPL",
      "reasoning": "...",
      "catalysts": ["..."]
    }
  ]
}`
    }
  ]

  try {
    const result = await callAI('gpt-4o-mini', messages, {
      temperature: 0.4,
      max_tokens: 800,
      json: true,
      cache: true,
      cacheTTL: 3600
    })

    const aiResponse = JSON.parse(result.content)
    const recommendations = aiResponse.recommendations || []

    // Merge AI reasoning with fit scores
    return recommendations.map(rec => {
      const scored = topCandidates.find(c => c.symbol === rec.symbol)
      return {
        symbol: rec.symbol,
        reasoning: rec.reasoning,
        catalysts: rec.catalysts || [],
        fitScore: scored?.fitScore || 0,
        breakdown: scored?.breakdown || {},
        marketData: scored?.marketData || {}
      }
    }).slice(0, count)

  } catch (error) {
    console.error('[Smart Watchlist] AI recommendation error:', error)

    // Fallback to simple scoring
    return topCandidates.slice(0, count).map(c => ({
      symbol: c.symbol,
      reasoning: `Strong fit based on ${userProfile.preferredSetups.join(' and ')} strategy with ${userProfile.preferredVolatility} volatility preference.`,
      catalysts: ['Technical setup', 'Liquidity'],
      fitScore: c.fitScore,
      breakdown: c.breakdown,
      marketData: c.marketData
    }))
  }
}

/**
 * Analyze correlation between watchlist symbols
 * Helps avoid over-concentration in correlated assets
 */
export function analyzeWatchlistCorrelation(watchlist, correlationMatrix = {}) {
  const pairs = []

  for (let i = 0; i < watchlist.length; i++) {
    for (let j = i + 1; j < watchlist.length; j++) {
      const sym1 = watchlist[i]
      const sym2 = watchlist[j]
      const key = [sym1, sym2].sort().join('-')

      const correlation = correlationMatrix[key] || 0

      if (Math.abs(correlation) > 0.7) {
        pairs.push({
          symbols: [sym1, sym2],
          correlation,
          warning: 'High correlation - consider diversification'
        })
      }
    }
  }

  return {
    highlyCorrelated: pairs,
    diversificationScore: pairs.length === 0 ? 1.0 : Math.max(0, 1 - pairs.length / (watchlist.length * 0.5))
  }
}

/**
 * Get sector distribution of watchlist
 */
export function getWatchlistDistribution(watchlist) {
  const distribution = {}

  for (const symbol of watchlist) {
    for (const [sector, symbols] of Object.entries(SYMBOL_UNIVERSE)) {
      if (symbols.includes(symbol)) {
        distribution[sector] = (distribution[sector] || 0) + 1
      }
    }
  }

  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)

  return {
    distribution,
    percentages: Object.fromEntries(
      Object.entries(distribution).map(([sector, count]) => [
        sector,
        total > 0 ? (count / total) * 100 : 0
      ])
    ),
    dominantSector: Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  }
}

export default {
  scoreSymbolFit,
  buildUserProfile,
  getSmartRecommendations,
  analyzeWatchlistCorrelation,
  getWatchlistDistribution,
  SYMBOL_UNIVERSE
}
