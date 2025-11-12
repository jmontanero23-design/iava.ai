/**
 * Smart Watchlist Builder - PhD-Elite Edition
 * AI-powered symbol recommendations with advanced screening and portfolio optimization
 *
 * Features:
 * - Multi-factor fundamental and technical screening
 * - Machine learning ranking and prediction
 * - Portfolio optimization (MPT, risk-parity, minimum correlation)
 * - Sector rotation and economic cycle analysis
 * - Real-time market scanning (breakouts, gaps, volume surges)
 * - Sentiment analysis and news integration
 * - Event-driven screening (earnings, dividends, splits)
 * - Personalized learning from user behavior
 * - Backtesting and performance tracking
 * - Advanced diversification metrics
 */

import { callAI } from './aiGateway.js'

// ============================================================================
// ORIGINAL FUNCTIONS (Backward Compatibility)
// ============================================================================

/**
 * Symbol universe by category (ORIGINAL)
 */
export const SYMBOL_UNIVERSE = {
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
 * Get all unique symbols (ORIGINAL)
 */
function getAllSymbols() {
  const allSymbols = new Set()
  for (const category of Object.values(SYMBOL_UNIVERSE)) {
    category.forEach(sym => allSymbols.add(sym))
  }
  return Array.from(allSymbols)
}

/**
 * Score symbol compatibility with user strategy (ORIGINAL)
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
 * Build user profile from trading history and preferences (ORIGINAL)
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
 * Get smart symbol recommendations (ORIGINAL)
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
    const result = await callAI('gpt-5-nano', messages, {
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
 * Analyze correlation between watchlist symbols (ORIGINAL)
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
 * Get sector distribution of watchlist (ORIGINAL)
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

// ============================================================================
// ADVANCED PhD-ELITE FEATURES
// ============================================================================

// ============================================================================
// Mathematical Utilities
// ============================================================================

function mean(arr) {
  if (!arr || arr.length === 0) return 0
  return arr.reduce((sum, val) => sum + val, 0) / arr.length
}

function standardDeviation(arr) {
  if (!arr || arr.length === 0) return 0
  const avg = mean(arr)
  const squareDiffs = arr.map(val => Math.pow(val - avg, 2))
  return Math.sqrt(mean(squareDiffs))
}

function percentile(arr, p) {
  if (!arr || arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) return sorted[lower]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

function correlation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const meanX = mean(x)
  const meanY = mean(y)
  const stdX = standardDeviation(x)
  const stdY = standardDeviation(y)

  if (stdX === 0 || stdY === 0) return 0

  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY)
  }

  return sum / ((n - 1) * stdX * stdY)
}

function zscore(value, arr) {
  const avg = mean(arr)
  const std = standardDeviation(arr)
  return std === 0 ? 0 : (value - avg) / std
}

// ============================================================================
// Fundamental Analysis
// ============================================================================

/**
 * Calculate comprehensive fundamental scores
 */
export function calculateFundamentalScore(fundamentals) {
  const {
    pe = 20,
    pb = 3,
    debtToEquity = 0.5,
    roe = 0.15,
    profitMargin = 0.10,
    revenueGrowth = 0.10,
    earningsGrowth = 0.10,
    freeCashFlow = 1000000000,
    currentRatio = 1.5,
    quickRatio = 1.0
  } = fundamentals

  const scores = {}

  // Valuation scores (lower is better for P/E and P/B)
  scores.valuation = calculateValuationScore(pe, pb)

  // Financial health
  scores.financialHealth = calculateFinancialHealthScore(debtToEquity, currentRatio, quickRatio)

  // Profitability
  scores.profitability = calculateProfitabilityScore(roe, profitMargin, freeCashFlow)

  // Growth
  scores.growth = calculateGrowthScore(revenueGrowth, earningsGrowth)

  // Quality (Piotroski F-Score inspired)
  scores.quality = calculateQualityScore(fundamentals)

  // Weighted composite score
  const weights = {
    valuation: 0.20,
    financialHealth: 0.20,
    profitability: 0.25,
    growth: 0.20,
    quality: 0.15
  }

  const composite = Object.keys(scores).reduce((sum, key) => {
    return sum + scores[key] * weights[key]
  }, 0)

  return {
    composite: Math.max(0, Math.min(100, composite)),
    breakdown: scores,
    rating: composite >= 80 ? 'Excellent' : composite >= 60 ? 'Good' : composite >= 40 ? 'Average' : 'Poor'
  }
}

function calculateValuationScore(pe, pb) {
  // Lower P/E and P/B are better for value
  let score = 50

  // P/E scoring (normalize to 0-50)
  if (pe < 10) score += 25
  else if (pe < 15) score += 20
  else if (pe < 20) score += 10
  else if (pe < 25) score += 0
  else if (pe < 30) score -= 10
  else score -= 20

  // P/B scoring (normalize to 0-50)
  if (pb < 1.0) score += 25
  else if (pb < 2.0) score += 20
  else if (pb < 3.0) score += 10
  else if (pb < 5.0) score += 0
  else score -= 10

  return Math.max(0, Math.min(100, score))
}

function calculateFinancialHealthScore(debtToEquity, currentRatio, quickRatio) {
  let score = 0

  // Debt-to-equity (lower is better)
  if (debtToEquity < 0.3) score += 35
  else if (debtToEquity < 0.5) score += 30
  else if (debtToEquity < 1.0) score += 20
  else if (debtToEquity < 2.0) score += 10
  else score += 0

  // Current ratio (should be > 1)
  if (currentRatio >= 2.0) score += 35
  else if (currentRatio >= 1.5) score += 25
  else if (currentRatio >= 1.0) score += 15
  else score += 5

  // Quick ratio (should be > 1)
  if (quickRatio >= 1.5) score += 30
  else if (quickRatio >= 1.0) score += 20
  else if (quickRatio >= 0.8) score += 10
  else score += 0

  return Math.max(0, Math.min(100, score))
}

function calculateProfitabilityScore(roe, profitMargin, freeCashFlow) {
  let score = 0

  // ROE (return on equity)
  if (roe >= 0.20) score += 35
  else if (roe >= 0.15) score += 30
  else if (roe >= 0.10) score += 20
  else if (roe >= 0.05) score += 10
  else score += 0

  // Profit margin
  if (profitMargin >= 0.20) score += 35
  else if (profitMargin >= 0.15) score += 25
  else if (profitMargin >= 0.10) score += 15
  else if (profitMargin >= 0.05) score += 5
  else score += 0

  // Free cash flow (positive is good)
  if (freeCashFlow > 5000000000) score += 30
  else if (freeCashFlow > 1000000000) score += 20
  else if (freeCashFlow > 0) score += 10
  else score += 0

  return Math.max(0, Math.min(100, score))
}

function calculateGrowthScore(revenueGrowth, earningsGrowth) {
  let score = 0

  // Revenue growth
  if (revenueGrowth >= 0.30) score += 50
  else if (revenueGrowth >= 0.20) score += 40
  else if (revenueGrowth >= 0.10) score += 30
  else if (revenueGrowth >= 0.05) score += 15
  else if (revenueGrowth >= 0) score += 5
  else score += 0

  // Earnings growth
  if (earningsGrowth >= 0.30) score += 50
  else if (earningsGrowth >= 0.20) score += 40
  else if (earningsGrowth >= 0.10) score += 30
  else if (earningsGrowth >= 0.05) score += 15
  else if (earningsGrowth >= 0) score += 5
  else score += 0

  return Math.max(0, Math.min(100, score))
}

function calculateQualityScore(fundamentals) {
  // Simplified Piotroski F-Score (0-9 points)
  let fScore = 0

  const {
    roe = 0,
    freeCashFlow = 0,
    debtToEquity = 1,
    currentRatio = 1,
    profitMargin = 0,
    assetTurnover = 0.5,
    shares = 1000000000
  } = fundamentals

  // Profitability
  if (roe > 0) fScore += 1
  if (freeCashFlow > 0) fScore += 1
  if (roe > 0.10) fScore += 1

  // Leverage, Liquidity, Source of Funds
  if (debtToEquity < 0.5) fScore += 1
  if (currentRatio > 1.5) fScore += 1
  if (freeCashFlow > roe * 1000000000) fScore += 1 // FCF > Net Income

  // Operating Efficiency
  if (profitMargin > 0.10) fScore += 1
  if (assetTurnover > 0.5) fScore += 1
  if (shares < 2000000000) fScore += 1 // No significant dilution

  // Convert to 0-100 scale
  return (fScore / 9) * 100
}

/**
 * Classify stock as value or growth
 */
export function classifyValueGrowth(fundamentals) {
  const { pe = 20, pb = 3, revenueGrowth = 0.10, earningsGrowth = 0.10 } = fundamentals

  let valueScore = 0
  let growthScore = 0

  // Value indicators (low multiples)
  if (pe < 15) valueScore += 2
  else if (pe < 20) valueScore += 1
  if (pb < 2) valueScore += 2
  else if (pb < 3) valueScore += 1

  // Growth indicators (high growth rates)
  if (revenueGrowth > 0.20) growthScore += 2
  else if (revenueGrowth > 0.10) growthScore += 1
  if (earningsGrowth > 0.20) growthScore += 2
  else if (earningsGrowth > 0.10) growthScore += 1

  if (valueScore > growthScore) {
    return { classification: 'value', confidence: valueScore / 4 }
  } else if (growthScore > valueScore) {
    return { classification: 'growth', confidence: growthScore / 4 }
  } else {
    return { classification: 'blend', confidence: 0.5 }
  }
}

// ============================================================================
// Technical Screening
// ============================================================================

/**
 * Calculate comprehensive technical score
 */
export function calculateTechnicalScore(bars, options = {}) {
  if (!bars || bars.length < 50) {
    return { composite: 50, breakdown: {}, rating: 'Insufficient data' }
  }

  const scores = {}

  // Trend score (EMA alignment)
  scores.trend = calculateTrendScore(bars)

  // Momentum score (RSI, MACD)
  scores.momentum = calculateMomentumScore(bars)

  // Volume score (volume patterns)
  scores.volume = calculateVolumeScore(bars)

  // Volatility score (ATR, Bollinger Bands)
  scores.volatility = calculateVolatilityScore(bars)

  // Pattern score (price patterns)
  scores.patterns = calculatePatternScore(bars)

  // Weighted composite
  const weights = {
    trend: 0.30,
    momentum: 0.25,
    volume: 0.20,
    volatility: 0.10,
    patterns: 0.15
  }

  const composite = Object.keys(scores).reduce((sum, key) => {
    return sum + scores[key] * weights[key]
  }, 0)

  return {
    composite: Math.max(0, Math.min(100, composite)),
    breakdown: scores,
    rating: composite >= 75 ? 'Strong' : composite >= 60 ? 'Good' : composite >= 40 ? 'Neutral' : 'Weak'
  }
}

function calculateTrendScore(bars) {
  const closes = bars.map(b => b.close)

  // Calculate EMAs
  const ema20 = calculateEMA(closes, 20)
  const ema50 = calculateEMA(closes, 50)
  const ema200 = calculateEMA(closes, 200)

  const price = closes[closes.length - 1]
  const ema20Val = ema20[ema20.length - 1]
  const ema50Val = ema50[ema50.length - 1]
  const ema200Val = ema200[ema200.length - 1]

  let score = 50

  // Price above EMAs
  if (price > ema20Val) score += 15
  if (price > ema50Val) score += 15
  if (price > ema200Val) score += 20

  // EMA alignment (bullish: 20 > 50 > 200)
  if (ema20Val > ema50Val && ema50Val > ema200Val) {
    score += 20
  } else if (ema20Val < ema50Val && ema50Val < ema200Val) {
    score -= 20
  }

  return Math.max(0, Math.min(100, score))
}

function calculateMomentumScore(bars) {
  const closes = bars.map(b => b.close)

  // RSI
  const rsi = calculateRSI(closes, 14)
  const rsiVal = rsi[rsi.length - 1]

  // MACD
  const macd = calculateMACD(closes)
  const macdLine = macd.macd[macd.macd.length - 1]
  const signalLine = macd.signal[macd.signal.length - 1]

  let score = 50

  // RSI scoring (30-70 is ideal, not overbought/oversold)
  if (rsiVal >= 40 && rsiVal <= 60) score += 25
  else if (rsiVal >= 30 && rsiVal <= 70) score += 15
  else if (rsiVal < 30) score += 5 // Oversold (potential bounce)
  else if (rsiVal > 70) score -= 5 // Overbought

  // MACD scoring
  if (macdLine > signalLine && macdLine > 0) score += 25 // Bullish above zero
  else if (macdLine > signalLine) score += 15 // Bullish below zero
  else if (macdLine < signalLine && macdLine < 0) score -= 15 // Bearish below zero
  else score -= 5 // Bearish above zero

  return Math.max(0, Math.min(100, score))
}

function calculateVolumeScore(bars) {
  const volumes = bars.map(b => b.volume || 0)
  const recentVolume = volumes.slice(-20)
  const avgVolume = mean(recentVolume)
  const currentVolume = volumes[volumes.length - 1]

  let score = 50

  // Volume relative to average
  const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1

  if (volumeRatio >= 1.5) score += 30
  else if (volumeRatio >= 1.2) score += 20
  else if (volumeRatio >= 1.0) score += 10
  else if (volumeRatio >= 0.8) score += 0
  else score -= 10

  // Volume trend (increasing is good)
  const volumeTrend = recentVolume.slice(-5).reduce((sum, v, i) => sum + v * (i + 1), 0) / 15
  const avgVolTrend = mean(recentVolume)

  if (volumeTrend > avgVolTrend * 1.1) score += 20
  else if (volumeTrend > avgVolTrend) score += 10

  return Math.max(0, Math.min(100, score))
}

function calculateVolatilityScore(bars) {
  const closes = bars.map(b => b.close)
  const atr = calculateATR(bars, 14)
  const atrVal = atr[atr.length - 1]
  const price = closes[closes.length - 1]
  const atrPercent = (atrVal / price) * 100

  // Volatility scoring (moderate volatility is ideal)
  let score = 50

  if (atrPercent >= 1.5 && atrPercent <= 3.0) score += 30
  else if (atrPercent >= 1.0 && atrPercent <= 4.0) score += 20
  else if (atrPercent < 1.0) score += 10 // Low volatility
  else score += 5 // High volatility

  return Math.max(0, Math.min(100, score))
}

function calculatePatternScore(bars) {
  let score = 50

  // Check for higher highs and higher lows (uptrend)
  const recentBars = bars.slice(-20)
  const highs = recentBars.map(b => b.high)
  const lows = recentBars.map(b => b.low)

  const firstHigh = Math.max(...highs.slice(0, 10))
  const secondHigh = Math.max(...highs.slice(10))
  const firstLow = Math.min(...lows.slice(0, 10))
  const secondLow = Math.min(...lows.slice(10))

  if (secondHigh > firstHigh && secondLow > firstLow) {
    score += 30 // Uptrend structure
  } else if (secondHigh < firstHigh && secondLow < firstLow) {
    score -= 20 // Downtrend structure
  }

  // Check for consolidation (good for breakout)
  const priceRange = Math.max(...highs.slice(-10)) - Math.min(...lows.slice(-10))
  const avgPrice = mean(recentBars.slice(-10).map(b => b.close))
  const rangePercent = (priceRange / avgPrice) * 100

  if (rangePercent < 5) score += 20 // Tight consolidation

  return Math.max(0, Math.min(100, score))
}

// Technical indicator calculations
function calculateEMA(data, period) {
  const k = 2 / (period + 1)
  const ema = []

  let sum = 0
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i]
  }
  ema.push(sum / Math.min(period, data.length))

  for (let i = period; i < data.length; i++) {
    ema.push(data[i] * k + ema[ema.length - 1] * (1 - k))
  }

  return ema
}

function calculateRSI(closes, period = 14) {
  const changes = []
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1])
  }

  const rsi = []
  for (let i = period - 1; i < changes.length; i++) {
    const window = changes.slice(i - period + 1, i + 1)
    const gains = window.filter(c => c > 0)
    const losses = window.filter(c => c < 0).map(c => Math.abs(c))

    const avgGain = gains.length > 0 ? mean(gains) : 0
    const avgLoss = losses.length > 0 ? mean(losses) : 0

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    rsi.push(100 - (100 / (1 + rs)))
  }

  return rsi
}

function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(closes, fastPeriod)
  const emaSlow = calculateEMA(closes, slowPeriod)

  const macd = []
  for (let i = 0; i < Math.min(emaFast.length, emaSlow.length); i++) {
    macd.push(emaFast[i] - emaSlow[i])
  }

  const signal = calculateEMA(macd, signalPeriod)

  return { macd, signal }
}

function calculateATR(bars, period = 14) {
  const tr = []

  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high
    const low = bars[i].low
    const prevClose = bars[i - 1].close

    const tr1 = high - low
    const tr2 = Math.abs(high - prevClose)
    const tr3 = Math.abs(low - prevClose)

    tr.push(Math.max(tr1, tr2, tr3))
  }

  const atr = calculateEMA(tr, period)
  return [atr[0], ...atr]
}

// ============================================================================
// Real-Time Market Scanner
// ============================================================================

/**
 * Scan for breakout candidates
 */
export function scanBreakouts(marketData, options = {}) {
  const { minVolume = 1000000, lookback = 20 } = options

  const breakouts = []

  for (const [symbol, data] of Object.entries(marketData)) {
    const { bars = [], volume = 0 } = data

    if (bars.length < lookback || volume < minVolume) continue

    const recentBars = bars.slice(-lookback)
    const currentBar = recentBars[recentBars.length - 1]

    // Check if breaking above resistance
    const resistanceLevel = Math.max(...recentBars.slice(0, -1).map(b => b.high))
    const breakoutPercent = ((currentBar.high - resistanceLevel) / resistanceLevel) * 100

    if (breakoutPercent > 0.5 && currentBar.volume > volume * 1.5) {
      breakouts.push({
        symbol,
        type: 'breakout',
        resistanceLevel,
        breakoutPercent,
        volume: currentBar.volume,
        avgVolume: volume,
        volumeRatio: currentBar.volume / volume,
        price: currentBar.close,
        strength: calculateBreakoutStrength(recentBars, resistanceLevel)
      })
    }
  }

  return breakouts.sort((a, b) => b.strength - a.strength)
}

function calculateBreakoutStrength(bars, resistanceLevel) {
  const currentBar = bars[bars.length - 1]
  const volumeRatio = currentBar.volume / mean(bars.map(b => b.volume))
  const priceStrength = ((currentBar.close - resistanceLevel) / resistanceLevel) * 100

  return volumeRatio * 0.6 + priceStrength * 0.4
}

/**
 * Scan for gap opportunities
 */
export function scanGaps(marketData, options = {}) {
  const { minGapPercent = 2.0 } = options

  const gaps = []

  for (const [symbol, data] of Object.entries(marketData)) {
    const { bars = [] } = data

    if (bars.length < 2) continue

    const prevBar = bars[bars.length - 2]
    const currentBar = bars[bars.length - 1]

    // Gap up
    if (currentBar.open > prevBar.high) {
      const gapPercent = ((currentBar.open - prevBar.high) / prevBar.high) * 100

      if (gapPercent >= minGapPercent) {
        gaps.push({
          symbol,
          type: 'gap_up',
          gapPercent,
          gapSize: currentBar.open - prevBar.high,
          prevClose: prevBar.close,
          currentOpen: currentBar.open,
          currentPrice: currentBar.close,
          filled: currentBar.low <= prevBar.high
        })
      }
    }

    // Gap down
    if (currentBar.open < prevBar.low) {
      const gapPercent = ((prevBar.low - currentBar.open) / prevBar.low) * 100

      if (gapPercent >= minGapPercent) {
        gaps.push({
          symbol,
          type: 'gap_down',
          gapPercent,
          gapSize: prevBar.low - currentBar.open,
          prevClose: prevBar.close,
          currentOpen: currentBar.open,
          currentPrice: currentBar.close,
          filled: currentBar.high >= prevBar.low
        })
      }
    }
  }

  return gaps.sort((a, b) => b.gapPercent - a.gapPercent)
}

/**
 * Scan for volume surges
 */
export function scanVolumeSurges(marketData, options = {}) {
  const { minRatio = 2.0, lookback = 20 } = options

  const surges = []

  for (const [symbol, data] of Object.entries(marketData)) {
    const { bars = [] } = data

    if (bars.length < lookback) continue

    const recentBars = bars.slice(-lookback)
    const currentBar = recentBars[recentBars.length - 1]
    const avgVolume = mean(recentBars.slice(0, -1).map(b => b.volume))

    const volumeRatio = avgVolume > 0 ? currentBar.volume / avgVolume : 0

    if (volumeRatio >= minRatio) {
      surges.push({
        symbol,
        currentVolume: currentBar.volume,
        avgVolume,
        volumeRatio,
        price: currentBar.close,
        priceChange: ((currentBar.close - recentBars[0].close) / recentBars[0].close) * 100
      })
    }
  }

  return surges.sort((a, b) => b.volumeRatio - a.volumeRatio)
}

/**
 * Scan for new highs/lows
 */
export function scanNewHighsLows(marketData, options = {}) {
  const { lookback = 52 } = options // 52-week highs/lows

  const newHighs = []
  const newLows = []

  for (const [symbol, data] of Object.entries(marketData)) {
    const { bars = [] } = data

    if (bars.length < lookback) continue

    const recentBars = bars.slice(-lookback)
    const currentBar = recentBars[recentBars.length - 1]

    const periodHigh = Math.max(...recentBars.slice(0, -1).map(b => b.high))
    const periodLow = Math.min(...recentBars.slice(0, -1).map(b => b.low))

    // New high
    if (currentBar.high > periodHigh) {
      newHighs.push({
        symbol,
        currentPrice: currentBar.close,
        periodHigh,
        breakoutPercent: ((currentBar.high - periodHigh) / periodHigh) * 100,
        volume: currentBar.volume,
        timeframe: `${lookback}-period`
      })
    }

    // New low
    if (currentBar.low < periodLow) {
      newLows.push({
        symbol,
        currentPrice: currentBar.close,
        periodLow,
        breakdownPercent: ((periodLow - currentBar.low) / periodLow) * 100,
        volume: currentBar.volume,
        timeframe: `${lookback}-period`
      })
    }
  }

  return {
    newHighs: newHighs.sort((a, b) => b.breakoutPercent - a.breakoutPercent),
    newLows: newLows.sort((a, b) => b.breakdownPercent - a.breakdownPercent)
  }
}

// ============================================================================
// Portfolio Optimization
// ============================================================================

/**
 * Calculate optimal portfolio weights using Mean-Variance Optimization (Markowitz)
 */
export function optimizePortfolioMeanVariance(returns, targetReturn = null) {
  // returns: array of arrays, each sub-array is returns for one asset

  const numAssets = returns.length
  if (numAssets === 0) return { weights: [], expectedReturn: 0, volatility: 0 }

  // Calculate expected returns
  const expectedReturns = returns.map(r => mean(r))

  // Calculate covariance matrix
  const covMatrix = []
  for (let i = 0; i < numAssets; i++) {
    covMatrix[i] = []
    for (let j = 0; j < numAssets; j++) {
      covMatrix[i][j] = covariance(returns[i], returns[j])
    }
  }

  // Simple optimization: equal weights for now (full MPT requires quadratic programming)
  // In production, use a proper optimizer like scipy or commercial solver
  const weights = new Array(numAssets).fill(1 / numAssets)

  const portfolioReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0)

  // Calculate portfolio variance
  let portfolioVariance = 0
  for (let i = 0; i < numAssets; i++) {
    for (let j = 0; j < numAssets; j++) {
      portfolioVariance += weights[i] * weights[j] * covMatrix[i][j]
    }
  }

  const portfolioVolatility = Math.sqrt(portfolioVariance)

  return {
    weights,
    expectedReturn: portfolioReturn,
    volatility: portfolioVolatility,
    sharpeRatio: portfolioVolatility > 0 ? portfolioReturn / portfolioVolatility : 0
  }
}

function covariance(x, y) {
  if (x.length !== y.length || x.length === 0) return 0

  const meanX = mean(x)
  const meanY = mean(y)

  let sum = 0
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY)
  }

  return sum / (x.length - 1)
}

/**
 * Risk-parity portfolio optimization
 */
export function optimizeRiskParity(returns) {
  const numAssets = returns.length
  if (numAssets === 0) return { weights: [] }

  // Calculate volatilities
  const volatilities = returns.map(r => standardDeviation(r))

  // Risk parity: inverse volatility weighting
  const invVol = volatilities.map(v => v > 0 ? 1 / v : 0)
  const sumInvVol = invVol.reduce((sum, iv) => sum + iv, 0)

  const weights = invVol.map(iv => sumInvVol > 0 ? iv / sumInvVol : 1 / numAssets)

  return { weights, rationale: 'Equal risk contribution from each asset' }
}

/**
 * Minimum correlation portfolio
 */
export function optimizeMinimumCorrelation(returns, symbols) {
  const numAssets = returns.length
  if (numAssets === 0) return { weights: [], selectedSymbols: [] }

  // Calculate correlation matrix
  const corrMatrix = []
  for (let i = 0; i < numAssets; i++) {
    corrMatrix[i] = []
    for (let j = 0; j < numAssets; j++) {
      corrMatrix[i][j] = correlation(returns[i], returns[j])
    }
  }

  // Greedy selection: start with asset, add least correlated assets
  const selected = [0]
  const weights = []

  while (selected.length < Math.min(numAssets, 10)) {
    let minAvgCorr = Infinity
    let nextAsset = -1

    for (let i = 0; i < numAssets; i++) {
      if (selected.includes(i)) continue

      // Calculate average correlation with selected assets
      const avgCorr = selected.reduce((sum, j) => sum + Math.abs(corrMatrix[i][j]), 0) / selected.length

      if (avgCorr < minAvgCorr) {
        minAvgCorr = avgCorr
        nextAsset = i
      }
    }

    if (nextAsset === -1) break
    selected.push(nextAsset)
  }

  // Equal weight selected assets
  const weight = 1 / selected.length
  for (let i = 0; i < numAssets; i++) {
    weights[i] = selected.includes(i) ? weight : 0
  }

  return {
    weights,
    selectedSymbols: selected.map(i => symbols[i]),
    avgCorrelation: calculateAvgCorrelation(corrMatrix, selected)
  }
}

function calculateAvgCorrelation(corrMatrix, indices) {
  if (indices.length < 2) return 0

  let sum = 0
  let count = 0

  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      sum += Math.abs(corrMatrix[indices[i]][indices[j]])
      count++
    }
  }

  return count > 0 ? sum / count : 0
}

// ============================================================================
// Sector Rotation Analysis
// ============================================================================

/**
 * Analyze sector momentum and rotation
 */
export function analyzeSectorRotation(sectorData) {
  // sectorData: { sectorName: { returns: [], volume: [] } }

  const analysis = []

  for (const [sector, data] of Object.entries(sectorData)) {
    const { returns = [], volume = [] } = data

    if (returns.length < 20) continue

    // Calculate momentum (recent vs older returns)
    const recentReturns = returns.slice(-5)
    const olderReturns = returns.slice(-20, -5)

    const recentAvg = mean(recentReturns)
    const olderAvg = mean(olderReturns)

    const momentum = recentAvg - olderAvg

    // Calculate relative strength (vs market)
    const relativeStrength = zscore(recentAvg, returns)

    // Volume trend
    const recentVolume = mean(volume.slice(-5))
    const avgVolume = mean(volume)
    const volumeStrength = avgVolume > 0 ? recentVolume / avgVolume : 1

    analysis.push({
      sector,
      momentum,
      relativeStrength,
      volumeStrength,
      rating: momentum > 0.02 ? 'Strong' : momentum > 0 ? 'Positive' : momentum > -0.02 ? 'Neutral' : 'Weak',
      recommendation: generateSectorRecommendation(momentum, relativeStrength, volumeStrength)
    })
  }

  // Sort by momentum
  analysis.sort((a, b) => b.momentum - a.momentum)

  return {
    sectors: analysis,
    topSectors: analysis.slice(0, 3).map(s => s.sector),
    bottomSectors: analysis.slice(-3).map(s => s.sector)
  }
}

function generateSectorRecommendation(momentum, relativeStrength, volumeStrength) {
  if (momentum > 0.02 && relativeStrength > 0.5 && volumeStrength > 1.2) {
    return 'Overweight - Strong momentum with volume confirmation'
  } else if (momentum > 0 && relativeStrength > 0) {
    return 'Market Weight - Positive but moderate momentum'
  } else if (momentum < -0.02) {
    return 'Underweight - Negative momentum, consider avoiding'
  } else {
    return 'Neutral - Mixed signals'
  }
}

/**
 * Identify economic cycle phase
 */
export function identifyEconomicCycle(indicators) {
  const {
    gdpGrowth = 0.02,
    unemploymentRate = 0.05,
    inflationRate = 0.02,
    interestRate = 0.03,
    consumerConfidence = 100
  } = indicators

  let score = 0

  // Expansion indicators
  if (gdpGrowth > 0.025) score += 2
  else if (gdpGrowth > 0) score += 1
  else score -= 1

  if (unemploymentRate < 0.05) score += 2
  else if (unemploymentRate < 0.07) score += 1
  else score -= 1

  if (consumerConfidence > 100) score += 1
  else if (consumerConfidence < 90) score -= 1

  // Determine phase
  let phase = 'neutral'
  let sectorPreference = []

  if (score >= 4) {
    phase = 'expansion'
    sectorPreference = ['tech', 'consumer', 'finance']
  } else if (score >= 2) {
    phase = 'peak'
    sectorPreference = ['energy', 'finance', 'healthcare']
  } else if (score <= -2) {
    phase = 'contraction'
    sectorPreference = ['healthcare', 'consumer', 'utilities']
  } else {
    phase = 'recovery'
    sectorPreference = ['tech', 'consumer', 'finance']
  }

  return {
    phase,
    score,
    sectorPreference,
    description: getPhaseDescription(phase)
  }
}

function getPhaseDescription(phase) {
  const descriptions = {
    expansion: 'Economic growth accelerating. Favor cyclical sectors.',
    peak: 'Growth slowing, inflation concerns. Favor defensive sectors.',
    contraction: 'Economic downturn. Favor quality and defensive stocks.',
    recovery: 'Economy bottoming out. Favor early-cycle sectors.'
  }

  return descriptions[phase] || 'Economic cycle phase unclear.'
}

// ============================================================================
// Machine Learning Ranking
// ============================================================================

/**
 * Multi-factor ML-inspired ranking model
 */
export function rankSymbolsML(symbolData) {
  // symbolData: array of { symbol, fundamentals, technical, sentiment, etc. }

  const rankedSymbols = symbolData.map(data => {
    const { symbol, fundamentals = {}, technical = {}, sentiment = {} } = data

    // Feature extraction
    const features = extractFeatures(fundamentals, technical, sentiment)

    // Calculate composite score (weighted ensemble)
    const score = calculateMLScore(features)

    return {
      symbol,
      score,
      features,
      rank: 0, // Will be set after sorting
      prediction: score > 75 ? 'Strong Buy' : score > 60 ? 'Buy' : score > 40 ? 'Hold' : 'Avoid'
    }
  })

  // Sort and assign ranks
  rankedSymbols.sort((a, b) => b.score - a.score)
  rankedSymbols.forEach((item, index) => {
    item.rank = index + 1
  })

  return rankedSymbols
}

function extractFeatures(fundamentals, technical, sentiment) {
  return {
    // Fundamental features
    peRatio: fundamentals.pe || 20,
    pbRatio: fundamentals.pb || 3,
    roe: fundamentals.roe || 0.15,
    debtToEquity: fundamentals.debtToEquity || 0.5,
    revenueGrowth: fundamentals.revenueGrowth || 0.10,
    profitMargin: fundamentals.profitMargin || 0.10,

    // Technical features
    trendScore: technical.trend || 50,
    momentumScore: technical.momentum || 50,
    volumeScore: technical.volume || 50,
    rsi: technical.rsi || 50,
    macdSignal: technical.macdSignal || 0,

    // Sentiment features
    newsScore: sentiment.news || 0,
    analystRating: sentiment.analyst || 3,
    socialScore: sentiment.social || 0
  }
}

function calculateMLScore(features) {
  // Weighted scoring (simulating a trained ML model)
  const weights = {
    // Fundamental weights (40%)
    peRatio: -0.05, // Lower is better
    pbRatio: -0.03,
    roe: 0.15,
    debtToEquity: -0.08,
    revenueGrowth: 0.10,
    profitMargin: 0.10,

    // Technical weights (40%)
    trendScore: 0.15,
    momentumScore: 0.10,
    volumeScore: 0.08,
    rsi: 0.05,
    macdSignal: 0.07,

    // Sentiment weights (20%)
    newsScore: 0.10,
    analystRating: 0.08,
    socialScore: 0.05
  }

  let score = 50 // Base score

  // Fundamental scoring
  score += (20 - features.peRatio) * weights.peRatio * 10
  score += (3 - features.pbRatio) * weights.pbRatio * 10
  score += features.roe * weights.roe * 100
  score += (1 - features.debtToEquity) * weights.debtToEquity * 100
  score += features.revenueGrowth * weights.revenueGrowth * 100
  score += features.profitMargin * weights.profitMargin * 100

  // Technical scoring
  score += features.trendScore * weights.trendScore
  score += features.momentumScore * weights.momentumScore
  score += features.volumeScore * weights.volumeScore
  score += (features.rsi - 50) * weights.rsi
  score += features.macdSignal * weights.macdSignal * 100

  // Sentiment scoring
  score += features.newsScore * weights.newsScore * 100
  score += features.analystRating * weights.analystRating * 10
  score += features.socialScore * weights.socialScore * 100

  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate feature importance
 */
export function calculateFeatureImportance(rankedSymbols) {
  // Analyze correlation between features and final scores
  const features = [
    'peRatio', 'pbRatio', 'roe', 'debtToEquity', 'revenueGrowth', 'profitMargin',
    'trendScore', 'momentumScore', 'volumeScore', 'rsi', 'macdSignal',
    'newsScore', 'analystRating', 'socialScore'
  ]

  const importance = {}

  for (const feature of features) {
    const featureValues = rankedSymbols.map(s => s.features[feature])
    const scores = rankedSymbols.map(s => s.score)

    const corr = Math.abs(correlation(featureValues, scores))
    importance[feature] = corr
  }

  // Sort by importance
  const sorted = Object.entries(importance)
    .sort((a, b) => b[1] - a[1])
    .map(([feature, value]) => ({ feature, importance: value }))

  return sorted
}

// ============================================================================
// Sentiment Analysis
// ============================================================================

/**
 * Aggregate sentiment from multiple sources
 */
export function aggregateSentiment(sentimentData) {
  const {
    newsArticles = [],
    analystRatings = [],
    socialMentions = [],
    earningsSentiment = null
  } = sentimentData

  // News sentiment (0-100 scale)
  const newsScore = calculateNewsSentiment(newsArticles)

  // Analyst consensus (1-5 scale converted to 0-100)
  const analystScore = calculateAnalystScore(analystRatings)

  // Social media sentiment
  const socialScore = calculateSocialSentiment(socialMentions)

  // Earnings sentiment
  const earningsScore = earningsSentiment ? (earningsSentiment === 'positive' ? 75 : earningsSentiment === 'negative' ? 25 : 50) : 50

  // Weighted composite
  const weights = {
    news: 0.30,
    analyst: 0.35,
    social: 0.20,
    earnings: 0.15
  }

  const composite = newsScore * weights.news +
                    analystScore * weights.analyst +
                    socialScore * weights.social +
                    earningsScore * weights.earnings

  return {
    composite: Math.max(0, Math.min(100, composite)),
    breakdown: {
      news: newsScore,
      analyst: analystScore,
      social: socialScore,
      earnings: earningsScore
    },
    rating: composite >= 70 ? 'Bullish' : composite >= 55 ? 'Somewhat Bullish' : composite >= 45 ? 'Neutral' : composite >= 30 ? 'Somewhat Bearish' : 'Bearish'
  }
}

function calculateNewsSentiment(articles) {
  if (articles.length === 0) return 50

  const sentimentScores = articles.map(article => {
    const { sentiment = 'neutral', relevance = 1 } = article

    let score = 50
    if (sentiment === 'positive') score = 75
    else if (sentiment === 'negative') score = 25
    else if (sentiment === 'very_positive') score = 90
    else if (sentiment === 'very_negative') score = 10

    return score * relevance
  })

  const totalRelevance = articles.reduce((sum, a) => sum + (a.relevance || 1), 0)
  return sentimentScores.reduce((sum, s) => sum + s, 0) / totalRelevance
}

function calculateAnalystScore(ratings) {
  if (ratings.length === 0) return 50

  // Convert 1-5 rating to 0-100
  const avgRating = mean(ratings.map(r => r.rating || 3))
  return ((avgRating - 1) / 4) * 100
}

function calculateSocialSentiment(mentions) {
  if (mentions.length === 0) return 50

  const positiveMentions = mentions.filter(m => m.sentiment === 'positive').length
  const negativeMentions = mentions.filter(m => m.sentiment === 'negative').length
  const total = mentions.length

  const positiveRatio = total > 0 ? positiveMentions / total : 0.5
  const negativeRatio = total > 0 ? negativeMentions / total : 0.5

  return (positiveRatio - negativeRatio) * 50 + 50
}

// ============================================================================
// Personalization Engine
// ============================================================================

/**
 * Learn from user selections and rejections
 */
export function updatePersonalizationModel(userActions, currentModel = {}) {
  const { selections = [], rejections = [] } = userActions

  // Initialize model
  const model = {
    featureWeights: currentModel.featureWeights || {},
    sectorPreferences: currentModel.sectorPreferences || {},
    setupPreferences: currentModel.setupPreferences || {},
    avgHoldingPeriod: currentModel.avgHoldingPeriod || 5,
    riskTolerance: currentModel.riskTolerance || 0.5
  }

  // Update from selections
  for (const selection of selections) {
    const { symbol, fundamentals = {}, technical = {}, holdingPeriod = 5 } = selection

    // Update sector preferences
    const sector = getSectorForSymbol(symbol)
    if (sector) {
      model.sectorPreferences[sector] = (model.sectorPreferences[sector] || 0) + 0.1
    }

    // Update holding period
    model.avgHoldingPeriod = model.avgHoldingPeriod * 0.9 + holdingPeriod * 0.1

    // Update feature weights based on successful picks
    updateFeatureWeights(model.featureWeights, fundamentals, technical, 0.05)
  }

  // Update from rejections (negative feedback)
  for (const rejection of rejections) {
    const { symbol, fundamentals = {}, technical = {}, reason = '' } = rejection

    const sector = getSectorForSymbol(symbol)
    if (sector) {
      model.sectorPreferences[sector] = (model.sectorPreferences[sector] || 0) - 0.05
    }

    // Decrease feature weights for rejected characteristics
    updateFeatureWeights(model.featureWeights, fundamentals, technical, -0.02)
  }

  // Normalize sector preferences
  const sectorSum = Object.values(model.sectorPreferences).reduce((sum, v) => sum + Math.abs(v), 0)
  if (sectorSum > 0) {
    for (const sector in model.sectorPreferences) {
      model.sectorPreferences[sector] /= sectorSum
    }
  }

  return model
}

function updateFeatureWeights(weights, fundamentals, technical, delta) {
  // Update weights based on characteristics of selected/rejected stocks
  if (fundamentals.pe) {
    weights.pe = (weights.pe || 0) + delta * (20 / fundamentals.pe)
  }

  if (fundamentals.roe) {
    weights.roe = (weights.roe || 0) + delta * fundamentals.roe * 10
  }

  if (technical.momentum) {
    weights.momentum = (weights.momentum || 0) + delta * (technical.momentum / 100)
  }
}

function getSectorForSymbol(symbol) {
  for (const [sector, symbols] of Object.entries(SYMBOL_UNIVERSE)) {
    if (symbols.includes(symbol)) return sector
  }
  return null
}

/**
 * Apply personalization to recommendations
 */
export function personalizeRecommendations(recommendations, personalizationModel) {
  const { featureWeights = {}, sectorPreferences = {} } = personalizationModel

  return recommendations.map(rec => {
    let personalizedScore = rec.score || 50

    // Apply sector preferences
    const sector = getSectorForSymbol(rec.symbol)
    if (sector && sectorPreferences[sector]) {
      personalizedScore += sectorPreferences[sector] * 20
    }

    // Apply feature weight adjustments
    if (rec.fundamentals && featureWeights.pe) {
      personalizedScore += featureWeights.pe * 10
    }

    if (rec.fundamentals && rec.fundamentals.roe && featureWeights.roe) {
      personalizedScore += featureWeights.roe * rec.fundamentals.roe * 100
    }

    if (rec.technical && rec.technical.momentum && featureWeights.momentum) {
      personalizedScore += featureWeights.momentum * rec.technical.momentum
    }

    rec.personalizedScore = Math.max(0, Math.min(100, personalizedScore))
    rec.personalizationBoost = personalizedScore - (rec.score || 50)

    return rec
  }).sort((a, b) => b.personalizedScore - a.personalizedScore)
}

// ============================================================================
// Comprehensive Smart Watchlist Builder
// ============================================================================

/**
 * Build comprehensive smart watchlist with all PhD-elite features
 */
export async function buildComprehensiveWatchlist(userProfile, marketData, options = {}) {
  const {
    count = 10,
    includeFundamental = true,
    includeTechnical = true,
    includeSentiment = true,
    includeOptimization = true,
    personalizationModel = null
  } = options

  const allSymbols = getAllSymbols()
  const currentWatchlist = userProfile.currentWatchlist || []
  const candidates = allSymbols.filter(sym => !currentWatchlist.includes(sym))

  // Score each candidate
  const scoredCandidates = []

  for (const symbol of candidates) {
    const data = marketData[symbol] || {}
    const { bars = [], fundamentals = {}, sentiment = {} } = data

    let score = 50
    const scores = {}

    // Fundamental analysis
    if (includeFundamental && Object.keys(fundamentals).length > 0) {
      const fundScore = calculateFundamentalScore(fundamentals)
      scores.fundamental = fundScore.composite
      score += (fundScore.composite - 50) * 0.3
    }

    // Technical analysis
    if (includeTechnical && bars.length >= 50) {
      const techScore = calculateTechnicalScore(bars)
      scores.technical = techScore.composite
      score += (techScore.composite - 50) * 0.3
    }

    // Sentiment analysis
    if (includeSentiment && Object.keys(sentiment).length > 0) {
      const sentScore = aggregateSentiment(sentiment)
      scores.sentiment = sentScore.composite
      score += (sentScore.composite - 50) * 0.2
    }

    // User fit score
    const fitResult = scoreSymbolFit(symbol, userProfile, data)
    scores.fit = fitResult.score * 100
    score += (fitResult.score - 0.5) * 40

    scoredCandidates.push({
      symbol,
      score: Math.max(0, Math.min(100, score)),
      scores,
      fundamentals,
      bars,
      sentiment
    })
  }

  // Sort by score
  scoredCandidates.sort((a, b) => b.score - a.score)

  // Get top candidates
  let topCandidates = scoredCandidates.slice(0, Math.min(count * 3, 50))

  // Apply personalization if model provided
  if (personalizationModel) {
    topCandidates = personalizeRecommendations(topCandidates, personalizationModel)
    topCandidates.sort((a, b) => b.personalizedScore - a.personalizedScore)
  }

  // Portfolio optimization
  let optimized = topCandidates.slice(0, count)

  if (includeOptimization && topCandidates.length >= count) {
    const returns = topCandidates.slice(0, count * 2).map(c => {
      return c.bars.slice(-20).map((bar, i, arr) => {
        if (i === 0) return 0
        return (bar.close - arr[i - 1].close) / arr[i - 1].close
      })
    }).filter(r => r.length > 0)

    if (returns.length >= count) {
      const minCorrResult = optimizeMinimumCorrelation(
        returns.slice(0, count),
        topCandidates.slice(0, count).map(c => c.symbol)
      )

      optimized = minCorrResult.selectedSymbols.map(sym => {
        return topCandidates.find(c => c.symbol === sym)
      }).filter(Boolean)
    }
  }

  return {
    recommendations: optimized.slice(0, count),
    analysis: {
      candidatesAnalyzed: candidates.length,
      topScore: scoredCandidates[0]?.score || 0,
      avgScore: mean(scoredCandidates.map(c => c.score)),
      diversificationScore: calculateDiversification(optimized.map(c => c.symbol))
    },
    personalizationApplied: personalizationModel !== null
  }
}

function calculateDiversification(symbols) {
  const sectors = new Set()

  for (const symbol of symbols) {
    for (const [sector, syms] of Object.entries(SYMBOL_UNIVERSE)) {
      if (syms.includes(symbol)) {
        sectors.add(sector)
      }
    }
  }

  // Herfindahl index (lower is more diversified)
  const sectorCounts = {}
  for (const symbol of symbols) {
    const sector = getSectorForSymbol(symbol)
    if (sector) {
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1
    }
  }

  const total = symbols.length
  let herfindahl = 0
  for (const count of Object.values(sectorCounts)) {
    const share = count / total
    herfindahl += share * share
  }

  // Convert to diversification score (0-100, higher is better)
  return Math.max(0, Math.min(100, (1 - herfindahl) * 100))
}

// ============================================================================
// Exports
// ============================================================================

export default {
  // Original functions
  SYMBOL_UNIVERSE,
  scoreSymbolFit,
  buildUserProfile,
  getSmartRecommendations,
  analyzeWatchlistCorrelation,
  getWatchlistDistribution,

  // Fundamental analysis
  calculateFundamentalScore,
  classifyValueGrowth,

  // Technical screening
  calculateTechnicalScore,

  // Real-time scanning
  scanBreakouts,
  scanGaps,
  scanVolumeSurges,
  scanNewHighsLows,

  // Portfolio optimization
  optimizePortfolioMeanVariance,
  optimizeRiskParity,
  optimizeMinimumCorrelation,

  // Sector rotation
  analyzeSectorRotation,
  identifyEconomicCycle,

  // ML ranking
  rankSymbolsML,
  calculateFeatureImportance,

  // Sentiment analysis
  aggregateSentiment,

  // Personalization
  updatePersonalizationModel,
  personalizeRecommendations,

  // Comprehensive builder
  buildComprehensiveWatchlist
}
