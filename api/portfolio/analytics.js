/**
 * Ultra Elite++ Portfolio Analytics API
 * Fetches REAL portfolio data from Alpaca account
 */

export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const isPaper = process.env.ALPACA_ENV !== 'live'

    if (!key || !secret) {
      return res.status(500).json({ error: 'Trading API not configured' })
    }

    const baseUrl = isPaper ?
      'https://paper-api.alpaca.markets' :
      'https://api.alpaca.markets'

    // Fetch account information
    const accountResponse = await fetch(`${baseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret
      }
    })

    if (!accountResponse.ok) {
      throw new Error('Failed to fetch account data')
    }

    const account = await accountResponse.json()

    // Fetch all positions
    const positionsResponse = await fetch(`${baseUrl}/v2/positions`, {
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret
      }
    })

    const positions = await positionsResponse.json()

    // Fetch portfolio history for performance metrics
    const historyResponse = await fetch(
      `${baseUrl}/v2/account/portfolio/history?period=1M&timeframe=1D`,
      {
        headers: {
          'APCA-API-KEY-ID': key,
          'APCA-API-SECRET-KEY': secret
        }
      }
    )

    const history = await historyResponse.json()

    // Process positions with real-time pricing
    const enrichedPositions = await enrichPositions(positions, key, secret)

    // Calculate portfolio metrics
    const metrics = calculatePortfolioMetrics(enrichedPositions, account)

    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(enrichedPositions, history)

    // Sector allocation
    const sectorAllocation = calculateSectorAllocation(enrichedPositions)

    // Performance attribution
    const attribution = calculatePerformanceAttribution(enrichedPositions, account)

    // AI-powered insights
    const insights = await generatePortfolioInsights(enrichedPositions, metrics, riskMetrics)

    // Response with real portfolio analytics
    const analytics = {
      timestamp: new Date().toISOString(),
      account: {
        equity: parseFloat(account.equity),
        cash: parseFloat(account.cash),
        buyingPower: parseFloat(account.buying_power),
        portfolioValue: parseFloat(account.portfolio_value),
        dayTradeCount: account.daytrade_count,
        patternDayTrader: account.pattern_day_trader,
        tradingBlocked: account.trading_blocked,
        accountBlocked: account.account_blocked
      },
      positions: enrichedPositions.map(pos => ({
        symbol: pos.symbol,
        quantity: parseInt(pos.qty),
        side: pos.side,
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        avgEntryPrice: parseFloat(pos.avg_entry_price),
        currentPrice: pos.current_price,
        unrealizedPL: parseFloat(pos.unrealized_pl),
        unrealizedPLPercent: parseFloat(pos.unrealized_plpc) * 100,
        realizedPL: parseFloat(pos.unrealized_intraday_pl || 0),
        realizedPLPercent: parseFloat(pos.unrealized_intraday_plpc || 0) * 100,
        weight: (parseFloat(pos.market_value) / parseFloat(account.portfolio_value) * 100),
        changeToday: pos.change_today,
        changePercent: pos.change_percent,
        sector: pos.sector,
        beta: pos.beta,
        volatility: pos.volatility
      })),
      metrics: {
        totalValue: metrics.totalValue,
        totalCost: metrics.totalCost,
        totalPnL: metrics.totalPnL,
        totalPnLPercent: metrics.totalPnLPercent,
        dailyPnL: metrics.dailyPnL,
        dailyPnLPercent: metrics.dailyPnLPercent,
        winRate: metrics.winRate,
        avgWin: metrics.avgWin,
        avgLoss: metrics.avgLoss,
        profitFactor: metrics.profitFactor,
        expectancy: metrics.expectancy,
        bestPerformer: metrics.bestPerformer,
        worstPerformer: metrics.worstPerformer,
        positionCount: positions.length
      },
      riskMetrics: {
        portfolioBeta: riskMetrics.portfolioBeta,
        portfolioVolatility: riskMetrics.portfolioVolatility,
        sharpeRatio: riskMetrics.sharpeRatio,
        sortinoRatio: riskMetrics.sortinoRatio,
        maxDrawdown: riskMetrics.maxDrawdown,
        currentDrawdown: riskMetrics.currentDrawdown,
        valueAtRisk95: riskMetrics.valueAtRisk95,
        expectedShortfall: riskMetrics.expectedShortfall,
        calmarRatio: riskMetrics.calmarRatio,
        informationRatio: riskMetrics.informationRatio
      },
      allocation: {
        sectors: sectorAllocation,
        concentration: {
          top3: metrics.concentrationTop3,
          top5: metrics.concentrationTop5,
          herfindahlIndex: metrics.herfindahlIndex
        },
        diversification: {
          ratio: metrics.diversificationRatio,
          score: metrics.diversificationScore
        }
      },
      performance: {
        attribution: attribution,
        monthlyReturns: calculateMonthlyReturns(history),
        rollingReturns: {
          '1D': history.profit_loss_pct?.[history.profit_loss_pct.length - 1] || 0,
          '1W': calculateRollingReturn(history, 5),
          '1M': calculateRollingReturn(history, 22),
          '3M': calculateRollingReturn(history, 66),
          'YTD': calculateYTDReturn(history)
        }
      },
      insights,
      recommendations: generateRecommendations(metrics, riskMetrics, enrichedPositions)
    }

    return res.status(200).json(analytics)

  } catch (error) {
    console.error('[Portfolio Analytics API] Error:', error)
    return res.status(500).json({ error: 'Failed to fetch portfolio analytics' })
  }
}

async function enrichPositions(positions, key, secret) {
  const enriched = []

  for (const position of positions) {
    try {
      // Fetch latest quote for current price
      const quoteResponse = await fetch(
        `https://data.alpaca.markets/v2/stocks/${position.symbol}/quotes/latest`,
        {
          headers: {
            'APCA-API-KEY-ID': key,
            'APCA-API-SECRET-KEY': secret
          }
        }
      )

      let currentPrice = parseFloat(position.current_price || position.market_value / position.qty)

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json()
        currentPrice = (quoteData.quote?.ap + quoteData.quote?.bp) / 2 || currentPrice
      }

      // Calculate additional metrics
      const changeToday = currentPrice - parseFloat(position.lastday_price || currentPrice)
      const changePercent = (changeToday / parseFloat(position.lastday_price || currentPrice)) * 100

      // Estimate sector and beta
      const { sector, beta } = getSymbolMetadata(position.symbol)

      // Calculate position volatility
      const volatility = await calculatePositionVolatility(position.symbol, key, secret)

      enriched.push({
        ...position,
        current_price: currentPrice,
        change_today: changeToday,
        change_percent: changePercent,
        sector,
        beta,
        volatility
      })
    } catch (error) {
      console.error(`Error enriching position ${position.symbol}:`, error)
      enriched.push(position)
    }
  }

  return enriched
}

function calculatePortfolioMetrics(positions, account) {
  const totalValue = parseFloat(account.portfolio_value)
  const totalCost = positions.reduce((sum, pos) => sum + parseFloat(pos.cost_basis), 0)
  const totalPnL = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl), 0)
  const totalPnLPercent = (totalPnL / totalCost) * 100

  // Daily P&L
  const dailyPnL = positions.reduce((sum, pos) =>
    sum + parseFloat(pos.unrealized_intraday_pl || 0), 0
  )
  const dailyPnLPercent = (dailyPnL / totalValue) * 100

  // Win rate
  const winners = positions.filter(pos => parseFloat(pos.unrealized_pl) > 0)
  const losers = positions.filter(pos => parseFloat(pos.unrealized_pl) < 0)
  const winRate = (winners.length / positions.length) * 100

  // Average win/loss
  const avgWin = winners.length > 0 ?
    winners.reduce((sum, pos) => sum + parseFloat(pos.unrealized_plpc), 0) / winners.length * 100 : 0
  const avgLoss = losers.length > 0 ?
    losers.reduce((sum, pos) => sum + parseFloat(pos.unrealized_plpc), 0) / losers.length * 100 : 0

  // Profit factor
  const totalWins = winners.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl), 0)
  const totalLosses = Math.abs(losers.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl), 0))
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins

  // Expectancy
  const expectancy = (winRate / 100 * avgWin) + ((100 - winRate) / 100 * avgLoss)

  // Best and worst performers
  const bestPerformer = positions.reduce((best, pos) =>
    parseFloat(pos.unrealized_plpc) > parseFloat(best.unrealized_plpc) ? pos : best
  , positions[0] || {})

  const worstPerformer = positions.reduce((worst, pos) =>
    parseFloat(pos.unrealized_plpc) < parseFloat(worst.unrealized_plpc) ? pos : worst
  , positions[0] || {})

  // Concentration metrics
  const sortedByValue = [...positions].sort((a, b) =>
    parseFloat(b.market_value) - parseFloat(a.market_value)
  )

  const concentrationTop3 = sortedByValue.slice(0, 3)
    .reduce((sum, pos) => sum + (parseFloat(pos.market_value) / totalValue), 0) * 100

  const concentrationTop5 = sortedByValue.slice(0, 5)
    .reduce((sum, pos) => sum + (parseFloat(pos.market_value) / totalValue), 0) * 100

  // Herfindahl Index
  const herfindahlIndex = positions.reduce((sum, pos) => {
    const weight = parseFloat(pos.market_value) / totalValue
    return sum + Math.pow(weight, 2)
  }, 0)

  // Diversification metrics
  const diversificationRatio = positions.length > 0 ? 1 / herfindahlIndex : 0
  const diversificationScore = Math.min(100, diversificationRatio * 10)

  return {
    totalValue,
    totalCost,
    totalPnL,
    totalPnLPercent,
    dailyPnL,
    dailyPnLPercent,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    bestPerformer: bestPerformer?.symbol,
    worstPerformer: worstPerformer?.symbol,
    concentrationTop3,
    concentrationTop5,
    herfindahlIndex,
    diversificationRatio,
    diversificationScore
  }
}

function calculateRiskMetrics(positions, history) {
  // Portfolio beta (weighted average)
  const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.market_value), 0)
  const portfolioBeta = positions.reduce((sum, pos) => {
    const weight = parseFloat(pos.market_value) / totalValue
    return sum + (pos.beta * weight)
  }, 0)

  // Portfolio volatility
  const returns = history.profit_loss_pct || []
  const portfolioVolatility = calculateVolatility(returns) * Math.sqrt(252) // Annualized

  // Sharpe Ratio
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const riskFreeRate = 0.05 / 252 // Daily risk-free rate
  const excessReturn = avgReturn - riskFreeRate
  const sharpeRatio = excessReturn / (portfolioVolatility / Math.sqrt(252))

  // Sortino Ratio (downside deviation)
  const downsideReturns = returns.filter(r => r < 0)
  const downsideVolatility = calculateVolatility(downsideReturns) * Math.sqrt(252)
  const sortinoRatio = downsideVolatility > 0 ? excessReturn / (downsideVolatility / Math.sqrt(252)) : 0

  // Maximum Drawdown
  const equity = history.equity || []
  const maxDrawdown = calculateMaxDrawdown(equity)
  const currentDrawdown = calculateCurrentDrawdown(equity)

  // Value at Risk (95% confidence)
  const sortedReturns = [...returns].sort((a, b) => a - b)
  const var95Index = Math.floor(sortedReturns.length * 0.05)
  const valueAtRisk95 = sortedReturns[var95Index] || 0

  // Expected Shortfall (CVaR)
  const tailReturns = sortedReturns.slice(0, var95Index)
  const expectedShortfall = tailReturns.length > 0 ?
    tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length : 0

  // Calmar Ratio
  const annualizedReturn = avgReturn * 252
  const calmarRatio = maxDrawdown !== 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0

  // Information Ratio (assuming SPY as benchmark)
  const benchmarkReturn = 0.10 / 252 // Assuming 10% annual SPY return
  const trackingError = calculateVolatility(returns.map(r => r - benchmarkReturn))
  const informationRatio = trackingError > 0 ? (avgReturn - benchmarkReturn) / trackingError : 0

  return {
    portfolioBeta,
    portfolioVolatility,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    currentDrawdown,
    valueAtRisk95,
    expectedShortfall,
    calmarRatio,
    informationRatio
  }
}

function calculateVolatility(returns) {
  if (returns.length === 0) return 0
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  return Math.sqrt(variance)
}

function calculateMaxDrawdown(equity) {
  if (equity.length === 0) return 0
  let maxDrawdown = 0
  let peak = equity[0]

  for (const value of equity) {
    if (value > peak) peak = value
    const drawdown = (peak - value) / peak
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }

  return maxDrawdown * 100
}

function calculateCurrentDrawdown(equity) {
  if (equity.length === 0) return 0
  const peak = Math.max(...equity)
  const current = equity[equity.length - 1]
  return ((peak - current) / peak) * 100
}

function calculateSectorAllocation(positions) {
  const sectors = {}
  const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.market_value), 0)

  positions.forEach(pos => {
    const sector = pos.sector || 'Unknown'
    if (!sectors[sector]) {
      sectors[sector] = {
        value: 0,
        weight: 0,
        positions: []
      }
    }
    sectors[sector].value += parseFloat(pos.market_value)
    sectors[sector].positions.push(pos.symbol)
  })

  Object.keys(sectors).forEach(sector => {
    sectors[sector].weight = (sectors[sector].value / totalValue) * 100
  })

  return sectors
}

function calculatePerformanceAttribution(positions, account) {
  const totalPnL = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl), 0)

  return positions.map(pos => ({
    symbol: pos.symbol,
    contribution: parseFloat(pos.unrealized_pl),
    contributionPercent: (parseFloat(pos.unrealized_pl) / totalPnL) * 100,
    weight: (parseFloat(pos.market_value) / parseFloat(account.portfolio_value)) * 100,
    return: parseFloat(pos.unrealized_plpc) * 100
  })).sort((a, b) => b.contribution - a.contribution)
}

function calculateMonthlyReturns(history) {
  // Simplified monthly returns calculation
  const monthlyReturns = []
  const dailyReturns = history.profit_loss_pct || []

  for (let i = 0; i < dailyReturns.length; i += 22) { // Approx 22 trading days per month
    const monthReturns = dailyReturns.slice(i, i + 22)
    if (monthReturns.length > 0) {
      const monthReturn = monthReturns.reduce((sum, r) => sum + r, 0)
      monthlyReturns.push(monthReturn)
    }
  }

  return monthlyReturns
}

function calculateRollingReturn(history, days) {
  const returns = history.profit_loss_pct || []
  if (returns.length < days) return 0

  const periodReturns = returns.slice(-days)
  return periodReturns.reduce((sum, r) => sum + r, 0)
}

function calculateYTDReturn(history) {
  const returns = history.profit_loss_pct || []
  return returns.reduce((sum, r) => sum + r, 0)
}

async function calculatePositionVolatility(symbol, key, secret) {
  try {
    // Fetch 30 days of daily bars
    const end = new Date().toISOString()
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const response = await fetch(
      `https://data.alpaca.markets/v2/stocks/${symbol}/bars?` +
      `start=${start}&end=${end}&timeframe=1Day&limit=30`,
      {
        headers: {
          'APCA-API-KEY-ID': key,
          'APCA-API-SECRET-KEY': secret
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      const bars = data.bars || []

      if (bars.length > 1) {
        const returns = []
        for (let i = 1; i < bars.length; i++) {
          const dailyReturn = (bars[i].c - bars[i-1].c) / bars[i-1].c
          returns.push(dailyReturn)
        }

        return calculateVolatility(returns) * Math.sqrt(252) // Annualized
      }
    }
  } catch (error) {
    console.error(`Error calculating volatility for ${symbol}:`, error)
  }

  return 0.20 // Default 20% volatility
}

function getSymbolMetadata(symbol) {
  // Symbol to sector and beta mapping (simplified)
  const metadata = {
    'AAPL': { sector: 'Technology', beta: 1.2 },
    'GOOGL': { sector: 'Technology', beta: 1.1 },
    'MSFT': { sector: 'Technology', beta: 0.9 },
    'AMZN': { sector: 'Consumer Discretionary', beta: 1.3 },
    'TSLA': { sector: 'Consumer Discretionary', beta: 2.0 },
    'META': { sector: 'Technology', beta: 1.35 },
    'NVDA': { sector: 'Technology', beta: 1.6 },
    'JPM': { sector: 'Financials', beta: 1.15 },
    'JNJ': { sector: 'Healthcare', beta: 0.7 },
    'V': { sector: 'Financials', beta: 0.95 },
    'PG': { sector: 'Consumer Staples', beta: 0.6 },
    'UNH': { sector: 'Healthcare', beta: 0.75 },
    'HD': { sector: 'Consumer Discretionary', beta: 1.0 },
    'MA': { sector: 'Financials', beta: 1.1 },
    'DIS': { sector: 'Communication Services', beta: 1.2 },
    'NFLX': { sector: 'Communication Services', beta: 1.5 },
    'AMD': { sector: 'Technology', beta: 1.8 },
    'SPY': { sector: 'Index', beta: 1.0 },
    'QQQ': { sector: 'Index', beta: 1.2 }
  }

  return metadata[symbol] || { sector: 'Other', beta: 1.0 }
}

async function generatePortfolioInsights(positions, metrics, riskMetrics) {
  const insights = []

  // Concentration risk
  if (metrics.concentrationTop3 > 60) {
    insights.push({
      type: 'WARNING',
      category: 'Concentration Risk',
      message: `Top 3 positions represent ${metrics.concentrationTop3.toFixed(1)}% of portfolio - consider diversifying`,
      priority: 'HIGH'
    })
  }

  // Performance insights
  if (metrics.winRate < 40) {
    insights.push({
      type: 'ALERT',
      category: 'Performance',
      message: `Win rate is only ${metrics.winRate.toFixed(1)}% - review entry criteria`,
      priority: 'MEDIUM'
    })
  }

  if (metrics.profitFactor < 1) {
    insights.push({
      type: 'WARNING',
      category: 'Risk/Reward',
      message: `Profit factor below 1.0 - losses exceeding wins`,
      priority: 'HIGH'
    })
  }

  // Risk insights
  if (riskMetrics.sharpeRatio < 0.5) {
    insights.push({
      type: 'INFO',
      category: 'Risk-Adjusted Returns',
      message: 'Low Sharpe ratio - returns not compensating for risk taken',
      priority: 'MEDIUM'
    })
  }

  if (riskMetrics.currentDrawdown > 10) {
    insights.push({
      type: 'ALERT',
      category: 'Drawdown',
      message: `Currently in ${riskMetrics.currentDrawdown.toFixed(1)}% drawdown`,
      priority: 'MEDIUM'
    })
  }

  // Positive insights
  if (metrics.winRate > 60) {
    insights.push({
      type: 'SUCCESS',
      category: 'Performance',
      message: `Excellent win rate of ${metrics.winRate.toFixed(1)}%`,
      priority: 'LOW'
    })
  }

  if (riskMetrics.sharpeRatio > 1.5) {
    insights.push({
      type: 'SUCCESS',
      category: 'Risk-Adjusted Returns',
      message: 'Strong risk-adjusted returns with Sharpe > 1.5',
      priority: 'LOW'
    })
  }

  return insights
}

function generateRecommendations(metrics, riskMetrics, positions) {
  const recommendations = []

  // Diversification recommendations
  if (metrics.diversificationScore < 50) {
    recommendations.push({
      action: 'DIVERSIFY',
      description: 'Add positions in uncorrelated sectors',
      urgency: 'MEDIUM'
    })
  }

  // Risk management recommendations
  if (riskMetrics.portfolioBeta > 1.5) {
    recommendations.push({
      action: 'REDUCE_BETA',
      description: 'Portfolio beta is high - consider defensive positions',
      urgency: 'MEDIUM'
    })
  }

  // Position sizing recommendations
  const oversizedPositions = positions.filter(pos =>
    (parseFloat(pos.market_value) / metrics.totalValue) > 0.20
  )

  if (oversizedPositions.length > 0) {
    recommendations.push({
      action: 'REBALANCE',
      description: `Trim oversized positions: ${oversizedPositions.map(p => p.symbol).join(', ')}`,
      urgency: 'HIGH'
    })
  }

  // Profit taking recommendations
  const bigWinners = positions.filter(pos => parseFloat(pos.unrealized_plpc) > 0.50)

  if (bigWinners.length > 0) {
    recommendations.push({
      action: 'TAKE_PROFITS',
      description: `Consider taking partial profits on: ${bigWinners.map(p => p.symbol).join(', ')}`,
      urgency: 'LOW'
    })
  }

  return recommendations
}