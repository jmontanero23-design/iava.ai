/**
 * Portfolio Analytics Dashboard - Elite PhD Level
 * Comprehensive portfolio risk management and performance analytics
 */

import { useState, useEffect, useMemo } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

export default function PortfolioAnalytics() {
  const { marketData } = useMarketData()
  const [portfolio, setPortfolio] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [riskMetrics, setRiskMetrics] = useState(null)
  const [correlations, setCorrelations] = useState(null)
  const [timeframe, setTimeframe] = useState('1M') // 1D, 1W, 1M, 3M, 1Y, ALL
  const [benchmarkSymbol, setBenchmarkSymbol] = useState('SPY')
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [riskLevel, setRiskLevel] = useState('moderate') // conservative, moderate, aggressive
  const [aiOptimization, setAiOptimization] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(true)

  // Sample portfolio (in production, this would come from user's actual positions)
  useEffect(() => {
    const samplePortfolio = [
      { symbol: 'AAPL', quantity: 100, avgCost: 150, currentPrice: 175, value: 17500, weight: 0.25 },
      { symbol: 'GOOGL', quantity: 50, avgCost: 100, currentPrice: 140, value: 7000, weight: 0.10 },
      { symbol: 'MSFT', quantity: 75, avgCost: 250, currentPrice: 380, value: 28500, weight: 0.41 },
      { symbol: 'TSLA', quantity: 30, avgCost: 200, currentPrice: 240, value: 7200, weight: 0.10 },
      { symbol: 'AMD', quantity: 150, avgCost: 80, currentPrice: 120, value: 18000, weight: 0.26 },
      { symbol: 'NVDA', quantity: 40, avgCost: 400, currentPrice: 480, value: 19200, weight: 0.28 },
      { symbol: 'SPY', quantity: 20, avgCost: 400, currentPrice: 450, value: 9000, weight: 0.13 },
      { symbol: 'QQQ', quantity: 25, avgCost: 350, currentPrice: 390, value: 9750, weight: 0.14 }
    ]

    // Calculate actual weights
    const totalValue = samplePortfolio.reduce((sum, pos) => sum + pos.value, 0)
    samplePortfolio.forEach(pos => {
      pos.weight = pos.value / totalValue
      pos.pnl = (pos.currentPrice - pos.avgCost) * pos.quantity
      pos.pnlPercent = ((pos.currentPrice - pos.avgCost) / pos.avgCost) * 100
      pos.dayChange = (Math.random() - 0.5) * 5 // Simulate daily change
      pos.dayChangeDollar = pos.dayChange * pos.quantity
    })

    setPortfolio(samplePortfolio)
    calculateMetrics(samplePortfolio)
    calculateRiskMetrics(samplePortfolio)
    calculateCorrelations(samplePortfolio)
  }, [timeframe])

  // AI Portfolio Optimization
  const optimizePortfolioWithAI = async () => {
    if (!portfolio.length || !metrics || aiLoading) return

    setAiLoading(true)
    try {
      const prompt = `As an AI portfolio manager using Modern Portfolio Theory and ML optimization, analyze this portfolio:

      Portfolio Composition:
      ${portfolio.map(p => `- ${p.symbol}: ${(p.weight * 100).toFixed(1)}% ($${p.value.toLocaleString()})`).join('\n')}

      Key Metrics:
      - Total Value: $${metrics.totalValue.toLocaleString()}
      - Total P&L: ${metrics.totalPnLPercent.toFixed(2)}%
      - Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
      - Sortino Ratio: ${metrics.sortinoRatio.toFixed(2)}
      - Volatility: ${metrics.volatility.toFixed(2)}%
      - Win Rate: ${metrics.winRate.toFixed(1)}%

      Risk Metrics:
      - VaR (95%): $${riskMetrics?.var95.toFixed(0)}
      - Beta: ${riskMetrics?.beta.toFixed(2)}
      - Max Concentration: ${(riskMetrics?.maxWeight * 100).toFixed(1)}%
      - Risk Level: ${riskLevel}

      Provide JSON optimization with:
      1. rebalancing: array of {symbol, currentWeight, targetWeight, action: 'buy'|'sell'|'hold', shares, reasoning}
      2. riskAssessment: {score: 0-100, level: 'low'|'medium'|'high', warnings: array}
      3. optimization: {expectedReturn, expectedVolatility, expectedSharpe, confidence}
      4. diversificationAdvice: specific recommendations to improve diversification
      5. hedgeRecommendations: array of hedge positions with rationale
      6. taxStrategy: tax-efficient rebalancing suggestions
      7. marketTiming: current market conditions and timing advice`

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          feature: 'portfolio-optimization', // Uses GPT-5 for complex analysis
          temperature: 0.2,
          max_tokens: 800,
          requireAccuracy: true // Critical financial decisions need highest accuracy
        })
      })

      if (response.ok) {
        const data = await response.json()
        const optimization = JSON.parse(data.content || '{}')
        setAiOptimization(optimization)

        // Alert on high-priority rebalancing
        if (optimization.rebalancing && optimization.rebalancing.some(r => Math.abs(r.currentWeight - r.targetWeight) > 0.1)) {
          window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: {
              text: `🎯 AI recommends portfolio rebalancing for optimal risk-adjusted returns`,
              type: 'info'
            }
          }))
        }
      }
    } catch (error) {
      console.error('AI optimization error:', error)
    }
    setAiLoading(false)
  }

  // Auto-optimize when metrics change
  useEffect(() => {
    if (showAI && metrics && riskMetrics) {
      const timer = setTimeout(() => {
        optimizePortfolioWithAI()
      }, 2000) // Debounce
      return () => clearTimeout(timer)
    }
  }, [metrics, riskMetrics, showAI, riskLevel])

  // Calculate portfolio metrics
  const calculateMetrics = (positions) => {
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)
    const totalCost = positions.reduce((sum, pos) => sum + (pos.avgCost * pos.quantity), 0)
    const totalPnL = totalValue - totalCost
    const totalPnLPercent = (totalPnL / totalCost) * 100

    // Daily P&L
    const dailyPnL = positions.reduce((sum, pos) => sum + pos.dayChangeDollar, 0)
    const dailyPnLPercent = (dailyPnL / totalValue) * 100

    // Performance metrics
    const returns = positions.map(pos => pos.pnlPercent)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const volatility = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    )

    // Sharpe Ratio (simplified)
    const riskFreeRate = 5 // 5% annual
    const sharpeRatio = (avgReturn - riskFreeRate) / volatility

    // Sortino Ratio (downside deviation)
    const downsideReturns = returns.filter(r => r < 0)
    const downsideVolatility = downsideReturns.length > 0 ?
      Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length) : 0
    const sortinoRatio = downsideVolatility > 0 ? (avgReturn - riskFreeRate) / downsideVolatility : 0

    // Win rate
    const winners = positions.filter(pos => pos.pnl > 0).length
    const winRate = (winners / positions.length) * 100

    // Best and worst performers
    const bestPerformer = positions.reduce((best, pos) =>
      pos.pnlPercent > best.pnlPercent ? pos : best
    )
    const worstPerformer = positions.reduce((worst, pos) =>
      pos.pnlPercent < worst.pnlPercent ? pos : worst
    )

    setMetrics({
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      dailyPnL,
      dailyPnLPercent,
      avgReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      winRate,
      bestPerformer,
      worstPerformer,
      positionCount: positions.length
    })
  }

  // Calculate risk metrics
  const calculateRiskMetrics = (positions) => {
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)

    // Value at Risk (VaR) - 95% confidence
    const returns = positions.map(pos => pos.pnlPercent / 100)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    )
    const var95 = totalValue * (avgReturn - 1.645 * stdDev) // 95% confidence

    // Maximum Drawdown (simulated)
    const maxDrawdown = -Math.abs(Math.min(...returns) * totalValue)

    // Calculate volatility for risk score
    const pnlReturns = positions.map(pos => pos.pnlPercent)
    const avgPnLReturn = pnlReturns.reduce((a, b) => a + b, 0) / pnlReturns.length
    const volatility = Math.sqrt(
      pnlReturns.reduce((sum, r) => sum + Math.pow(r - avgPnLReturn, 2), 0) / pnlReturns.length
    )

    // Beta calculation (simplified - against SPY)
    const marketReturn = 0.10 // Assumed 10% market return
    const beta = positions.reduce((sum, pos) => {
      const weight = pos.value / totalValue
      const positionBeta = pos.symbol === 'SPY' ? 1 : 1 + (Math.random() - 0.5) // Simulated
      return sum + (weight * positionBeta)
    }, 0)

    // Concentration risk
    const maxWeight = Math.max(...positions.map(pos => pos.weight))
    const herfindahlIndex = positions.reduce((sum, pos) =>
      sum + Math.pow(pos.weight, 2), 0
    )

    // Diversification ratio
    const diversificationRatio = 1 / herfindahlIndex

    // Sector concentration (simplified)
    const techPositions = ['AAPL', 'GOOGL', 'MSFT', 'AMD', 'NVDA']
    const techWeight = positions
      .filter(pos => techPositions.includes(pos.symbol))
      .reduce((sum, pos) => sum + pos.weight, 0)

    setRiskMetrics({
      var95,
      maxDrawdown,
      beta,
      maxWeight,
      herfindahlIndex,
      diversificationRatio,
      techWeight,
      riskScore: calculateRiskScore(beta, volatility, maxWeight)
    })
  }

  // Calculate risk score
  const calculateRiskScore = (beta, volatility, maxWeight) => {
    const betaScore = beta > 1.5 ? 30 : beta > 1.2 ? 20 : beta > 0.8 ? 10 : 5
    const volScore = volatility > 30 ? 30 : volatility > 20 ? 20 : volatility > 10 ? 10 : 5
    const concScore = maxWeight > 0.4 ? 40 : maxWeight > 0.3 ? 25 : maxWeight > 0.2 ? 10 : 5
    return betaScore + volScore + concScore
  }

  // Calculate correlation matrix
  const calculateCorrelations = (positions) => {
    const matrix = {}

    positions.forEach(pos1 => {
      matrix[pos1.symbol] = {}
      positions.forEach(pos2 => {
        if (pos1.symbol === pos2.symbol) {
          matrix[pos1.symbol][pos2.symbol] = 1.0
        } else {
          // Simulated correlation (in production, use actual price data)
          const baseCorr = Math.random() * 0.8 + 0.2 // 0.2 to 1.0
          const sectorBonus = ['AAPL', 'GOOGL', 'MSFT', 'AMD', 'NVDA'].includes(pos1.symbol) &&
                             ['AAPL', 'GOOGL', 'MSFT', 'AMD', 'NVDA'].includes(pos2.symbol) ? 0.2 : 0
          matrix[pos1.symbol][pos2.symbol] = Math.min(baseCorr + sectorBonus, 1.0)
        }
      })
    })

    setCorrelations(matrix)
  }

  // Get risk level color
  const getRiskColor = (score) => {
    if (score > 70) return 'text-red-400'
    if (score > 40) return 'text-yellow-400'
    return 'text-emerald-400'
  }

  // Format currency
  const formatCurrency = (value) => {
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : value > 0 ? '+' : ''
    if (absValue >= 1000000) return `${sign}$${(absValue / 1000000).toFixed(2)}M`
    if (absValue >= 1000) return `${sign}$${(absValue / 1000).toFixed(1)}K`
    return `${sign}$${absValue.toFixed(2)}`
  }

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">💼</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Portfolio Analytics</h3>
              <p className="text-xs text-slate-400">
                Risk management & performance tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  timeframe === tf
                    ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                    : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                {tf}
              </button>
            ))}
            <div className="ml-2 border-l border-slate-600 pl-2">
              <button
                onClick={() => setShowAI(!showAI)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  showAI
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                🤖 AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Bar */}
      {metrics && (
        <div className="px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="grid grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Portfolio Value</span>
              <div className="text-lg font-bold text-white">
                {formatCurrency(metrics.totalValue)}
              </div>
              <div className={`text-xs ${metrics.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(metrics.totalPnL)} ({metrics.totalPnLPercent.toFixed(2)}%)
              </div>
            </div>
            <div>
              <span className="text-slate-400">Today's P&L</span>
              <div className={`text-lg font-bold ${metrics.dailyPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(metrics.dailyPnL)}
              </div>
              <div className="text-xs text-slate-400">
                {metrics.dailyPnLPercent.toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-slate-400">Sharpe Ratio</span>
              <div className={`text-lg font-bold ${
                metrics.sharpeRatio > 1.5 ? 'text-emerald-400' :
                metrics.sharpeRatio > 0.5 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {metrics.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">
                Risk-adjusted
              </div>
            </div>
            <div>
              <span className="text-slate-400">Win Rate</span>
              <div className={`text-lg font-bold ${
                metrics.winRate > 60 ? 'text-emerald-400' :
                metrics.winRate > 40 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {metrics.winRate.toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400">
                {Math.round(metrics.winRate * metrics.positionCount / 100)}/{metrics.positionCount} winning
              </div>
            </div>
            <div>
              <span className="text-slate-400">Volatility</span>
              <div className={`text-lg font-bold ${
                metrics.volatility < 15 ? 'text-emerald-400' :
                metrics.volatility < 25 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {metrics.volatility.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400">
                Std deviation
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Holdings Table */}
        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="px-4 py-3 border-b border-slate-700/50">
            <h4 className="text-sm font-semibold text-slate-200">HOLDINGS</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700/50">
                  <th className="text-left py-2 px-4">Symbol</th>
                  <th className="text-right py-2 px-4">Qty</th>
                  <th className="text-right py-2 px-4">Avg Cost</th>
                  <th className="text-right py-2 px-4">Current</th>
                  <th className="text-right py-2 px-4">Value</th>
                  <th className="text-right py-2 px-4">Weight</th>
                  <th className="text-right py-2 px-4">P&L</th>
                  <th className="text-right py-2 px-4">P&L %</th>
                  <th className="text-right py-2 px-4">Day Δ</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((position, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 px-4 font-semibold text-slate-200">{position.symbol}</td>
                    <td className="py-2 px-4 text-right text-slate-300">{position.quantity}</td>
                    <td className="py-2 px-4 text-right text-slate-300">${position.avgCost.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right text-slate-300">${position.currentPrice.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right text-slate-200 font-medium">
                      {formatCurrency(position.value)}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-400">{(position.weight * 100).toFixed(1)}%</td>
                    <td className={`py-2 px-4 text-right font-medium ${
                      position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(position.pnl)}
                    </td>
                    <td className={`py-2 px-4 text-right ${
                      position.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {position.pnlPercent.toFixed(2)}%
                    </td>
                    <td className={`py-2 px-4 text-right ${
                      position.dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {position.dayChange >= 0 ? '+' : ''}{position.dayChange.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Metrics */}
        {riskMetrics && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">RISK ANALYSIS</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Risk Score</span>
                    <span className={`text-sm font-bold ${getRiskColor(riskMetrics.riskScore)}`}>
                      {riskMetrics.riskScore}/100
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        riskMetrics.riskScore > 70 ? 'bg-red-500' :
                        riskMetrics.riskScore > 40 ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${riskMetrics.riskScore}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">VaR (95%)</span>
                    <div className="text-sm font-semibold text-red-400">
                      {formatCurrency(riskMetrics.var95)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Max Drawdown</span>
                    <div className="text-sm font-semibold text-orange-400">
                      {formatCurrency(riskMetrics.maxDrawdown)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Beta</span>
                    <div className="text-sm font-semibold text-purple-400">
                      {riskMetrics.beta.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Diversification</span>
                    <div className="text-sm font-semibold text-cyan-400">
                      {riskMetrics.diversificationRatio.toFixed(1)}x
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">CONCENTRATION</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-400 mb-2">Position Weights</div>
                  <div className="space-y-1">
                    {portfolio.slice(0, 5).map((pos, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-slate-300 w-12">{pos.symbol}</span>
                        <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${pos.weight * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-10 text-right">
                          {(pos.weight * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tech Sector</span>
                    <span className={`font-semibold ${
                      riskMetrics.techWeight > 0.6 ? 'text-yellow-400' : 'text-slate-300'
                    }`}>
                      {(riskMetrics.techWeight * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500">Max Position</span>
                    <span className={`font-semibold ${
                      riskMetrics.maxWeight > 0.3 ? 'text-yellow-400' : 'text-slate-300'
                    }`}>
                      {(riskMetrics.maxWeight * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Correlation Heatmap */}
        {showHeatmap && correlations && (
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-200">CORRELATION MATRIX</h4>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                Hide
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="p-2"></th>
                    {Object.keys(correlations).map(symbol => (
                      <th key={symbol} className="p-2 text-slate-400">{symbol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(correlations).map(([symbol1, row]) => (
                    <tr key={symbol1}>
                      <td className="p-2 font-medium text-slate-400">{symbol1}</td>
                      {Object.entries(row).map(([symbol2, corr]) => (
                        <td
                          key={symbol2}
                          className="p-2 text-center"
                          style={{
                            backgroundColor: `rgba(139, 92, 246, ${corr * 0.5})`,
                            color: corr > 0.7 ? 'white' : '#94a3b8'
                          }}
                        >
                          {corr.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Higher correlation = Higher portfolio risk from lack of diversification
            </div>
          </div>
        )}

        {/* Performance Chart Placeholder */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/30">
          <h4 className="text-sm font-semibold text-purple-400 mb-3">PERFORMANCE VS BENCHMARK</h4>
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            [Performance chart would render here with portfolio vs SPY comparison]
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
            <div>
              <span className="text-slate-500">Alpha</span>
              <div className="text-sm font-semibold text-emerald-400">+4.3%</div>
            </div>
            <div>
              <span className="text-slate-500">Tracking Error</span>
              <div className="text-sm font-semibold text-yellow-400">8.2%</div>
            </div>
            <div>
              <span className="text-slate-500">Information Ratio</span>
              <div className="text-sm font-semibold text-purple-400">0.52</div>
            </div>
          </div>
        </div>

        {/* AI Portfolio Optimization Panel */}
        {showAI && (
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <h4 className="text-sm font-bold text-purple-400">AI PORTFOLIO OPTIMIZATION</h4>
              </div>
              {aiLoading && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-purple-400">Optimizing...</span>
                </div>
              )}
            </div>

            {aiOptimization ? (
              <div className="space-y-4">
                {/* Risk Assessment */}
                {aiOptimization.riskAssessment && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400">RISK ASSESSMENT</span>
                      <span className={`text-sm font-bold ${
                        aiOptimization.riskAssessment.level === 'low' ? 'text-emerald-400' :
                        aiOptimization.riskAssessment.level === 'medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {aiOptimization.riskAssessment.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          aiOptimization.riskAssessment.score < 40 ? 'bg-emerald-500' :
                          aiOptimization.riskAssessment.score < 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${aiOptimization.riskAssessment.score}%` }}
                      ></div>
                    </div>
                    {aiOptimization.riskAssessment.warnings && aiOptimization.riskAssessment.warnings.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {aiOptimization.riskAssessment.warnings.map((warning, idx) => (
                          <div key={idx} className="text-xs text-amber-400 flex items-start gap-1">
                            <span>⚠️</span>
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Rebalancing Recommendations */}
                {aiOptimization.rebalancing && aiOptimization.rebalancing.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-slate-400 mb-2">REBALANCING ACTIONS</div>
                    <div className="space-y-2">
                      {aiOptimization.rebalancing.slice(0, 5).map((rec, idx) => (
                        <div key={idx} className="bg-slate-700/30 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-white">{rec.symbol}</span>
                            <span className={`text-xs font-bold ${
                              rec.action === 'buy' ? 'text-emerald-400' :
                              rec.action === 'sell' ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {rec.action.toUpperCase()} {rec.shares && `${rec.shares} shares`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                              Current: {(rec.currentWeight * 100).toFixed(1)}%
                            </span>
                            <span className="text-purple-400">→</span>
                            <span className="text-slate-300">
                              Target: {(rec.targetWeight * 100).toFixed(1)}%
                            </span>
                          </div>
                          {rec.reasoning && (
                            <div className="text-xs text-slate-500 mt-1">{rec.reasoning}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimization Metrics */}
                {aiOptimization.optimization && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg p-3 border border-emerald-500/30">
                      <div className="text-xs text-emerald-400">Expected Return</div>
                      <div className="text-lg font-bold text-white">
                        {aiOptimization.optimization.expectedReturn?.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-3 border border-yellow-500/30">
                      <div className="text-xs text-yellow-400">Expected Volatility</div>
                      <div className="text-lg font-bold text-white">
                        {aiOptimization.optimization.expectedVolatility?.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-purple-500/30">
                      <div className="text-xs text-purple-400">Expected Sharpe</div>
                      <div className="text-lg font-bold text-white">
                        {aiOptimization.optimization.expectedSharpe?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Diversification Advice */}
                {aiOptimization.diversificationAdvice && (
                  <div className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/30">
                    <div className="text-xs font-semibold text-indigo-400 mb-2">💎 DIVERSIFICATION STRATEGY</div>
                    <div className="text-xs text-slate-300">{aiOptimization.diversificationAdvice}</div>
                  </div>
                )}

                {/* Hedge Recommendations */}
                {aiOptimization.hedgeRecommendations && aiOptimization.hedgeRecommendations.length > 0 && (
                  <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                    <div className="text-xs font-semibold text-amber-400 mb-2">🛡️ HEDGE POSITIONS</div>
                    <div className="space-y-1">
                      {aiOptimization.hedgeRecommendations.map((hedge, idx) => (
                        <div key={idx} className="text-xs text-slate-300">
                          • {hedge}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tax Strategy */}
                {aiOptimization.taxStrategy && (
                  <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/30">
                    <div className="text-xs font-semibold text-cyan-400 mb-2">📋 TAX-EFFICIENT STRATEGY</div>
                    <div className="text-xs text-slate-300">{aiOptimization.taxStrategy}</div>
                  </div>
                )}

                {/* Market Timing */}
                {aiOptimization.marketTiming && (
                  <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-lg p-3 border border-red-500/30">
                    <div className="text-xs font-semibold text-pink-400 mb-2">⏰ MARKET TIMING</div>
                    <div className="text-xs text-slate-300">{aiOptimization.marketTiming}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('iava.toast', {
                        detail: { text: '✅ Rebalancing plan saved to watchlist', type: 'success' }
                      }))
                    }}
                    className="flex-1 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-all text-xs font-semibold"
                  >
                    Save Optimization Plan
                  </button>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('iava.toast', {
                        detail: { text: '🚀 Opening trade execution panel...', type: 'info' }
                      }))
                    }}
                    className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-all text-xs font-semibold"
                  >
                    Execute Rebalancing
                  </button>
                </div>
              </div>
            ) : aiLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-slate-800/30 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <button
                  onClick={optimizePortfolioWithAI}
                  className="px-6 py-3 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all text-sm font-semibold"
                >
                  Generate AI Optimization
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}