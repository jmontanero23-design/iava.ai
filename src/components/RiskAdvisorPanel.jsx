import { useState, useEffect } from 'react'
import {
  calculateVaR,
  calculateExpectedShortfall,
  calculateKellySize,
  calculateFixedFractionalSize,
  analyzePortfolioRisk,
  getRiskAlerts
} from '../utils/riskAdvisor.js'

export default function RiskAdvisorPanel() {
  const [activeMode, setActiveMode] = useState('position-sizing') // position-sizing, portfolio-analysis, var-calculator

  // Position Sizing State
  const [accountSize, setAccountSize] = useState(10000)
  const [winRate, setWinRate] = useState(0.60)
  const [avgWin, setAvgWin] = useState(0.05)
  const [avgLoss, setAvgLoss] = useState(0.02)
  const [maxKelly, setMaxKelly] = useState(0.25)
  const [kellyResult, setKellyResult] = useState(null)

  // Fixed Fractional State
  const [riskPercent, setRiskPercent] = useState(1)
  const [entryPrice, setEntryPrice] = useState(100)
  const [stopPrice, setStopPrice] = useState(98)
  const [fixedFracResult, setFixedFracResult] = useState(null)

  // Portfolio Analysis State
  const [positions, setPositions] = useState([
    { symbol: 'AAPL', value: 2500, volatility: 0.02, expectedReturn: 0.08 },
    { symbol: 'MSFT', value: 2000, volatility: 0.018, expectedReturn: 0.07 },
    { symbol: 'GOOGL', value: 1500, volatility: 0.025, expectedReturn: 0.09 }
  ])
  const [portfolioAnalysis, setPortfolioAnalysis] = useState(null)

  // VaR State
  const [confidenceLevel, setConfidenceLevel] = useState(0.95)
  const [varResult, setVarResult] = useState(null)
  const [esResult, setEsResult] = useState(null)

  // New Position Form
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    value: '',
    volatility: 0.02,
    expectedReturn: 0.08
  })

  // Calculate Kelly when inputs change
  useEffect(() => {
    if (accountSize > 0) {
      const result = calculateKellySize(winRate, avgWin, avgLoss, accountSize, maxKelly)
      setKellyResult(result)
    }
  }, [accountSize, winRate, avgWin, avgLoss, maxKelly])

  // Calculate Fixed Fractional when inputs change
  useEffect(() => {
    if (accountSize > 0 && entryPrice > 0) {
      const result = calculateFixedFractionalSize(accountSize, riskPercent, entryPrice, stopPrice)
      setFixedFracResult(result)
    }
  }, [accountSize, riskPercent, entryPrice, stopPrice])

  // Analyze portfolio when positions change
  useEffect(() => {
    if (positions.length > 0) {
      const analysis = analyzePortfolioRisk(positions)
      setPortfolioAnalysis(analysis)

      const varRes = calculateVaR(positions, confidenceLevel)
      setVarResult(varRes)

      const esRes = calculateExpectedShortfall(positions, confidenceLevel)
      setEsResult(esRes)
    }
  }, [positions, confidenceLevel])

  const handleAddPosition = () => {
    const val = parseFloat(newPosition.value)
    if (!newPosition.symbol || isNaN(val) || val <= 0) {
      alert('Please enter valid position details')
      return
    }

    setPositions([...positions, {
      symbol: newPosition.symbol.toUpperCase(),
      value: val,
      volatility: newPosition.volatility,
      expectedReturn: newPosition.expectedReturn
    }])

    setNewPosition({ symbol: '', value: '', volatility: 0.02, expectedReturn: 0.08 })
    setShowAddPosition(false)
  }

  const handleRemovePosition = (index) => {
    setPositions(positions.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-orange-600 via-rose-500 to-red-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-600 blur-lg opacity-50 animate-pulse" />
                  <span className="relative text-2xl filter drop-shadow-lg">⚖️</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-orange-200 to-rose-300 bg-clip-text text-transparent">
                    Risk Advisor
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Portfolio risk analysis & position sizing
                  </p>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveMode('position-sizing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeMode === 'position-sizing'
                      ? 'bg-gradient-to-r from-orange-600 to-rose-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Position Sizing
                </button>
                <button
                  onClick={() => setActiveMode('portfolio-analysis')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeMode === 'portfolio-analysis'
                      ? 'bg-gradient-to-r from-orange-600 to-rose-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Portfolio Analysis
                </button>
                <button
                  onClick={() => setActiveMode('var-calculator')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeMode === 'var-calculator'
                      ? 'bg-gradient-to-r from-orange-600 to-rose-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  VaR Calculator
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Size (Always visible) */}
        <div className="p-5 bg-slate-800/30 border-b border-slate-700/50">
          <div className="max-w-md">
            <label className="block text-xs text-slate-400 mb-2">Account Size ($)</label>
            <input
              type="number"
              value={accountSize}
              onChange={e => setAccountSize(parseFloat(e.target.value) || 0)}
              className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all"
              placeholder="10000"
            />
          </div>
        </div>
      </div>

      {/* Position Sizing Mode */}
      {activeMode === 'position-sizing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kelly Criterion */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-orange-900/20 to-rose-900/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📊</span>
                <h3 className="text-sm font-bold text-orange-200">Kelly Criterion</h3>
              </div>
              <p className="text-xs text-slate-400">Optimal position sizing based on edge</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Win Rate ({Math.round(winRate * 100)}%)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={winRate}
                  onChange={e => setWinRate(parseFloat(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Avg Win ({(avgWin * 100).toFixed(1)}%)</label>
                <input
                  type="range"
                  min="0"
                  max="0.20"
                  step="0.005"
                  value={avgWin}
                  onChange={e => setAvgWin(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Avg Loss ({(avgLoss * 100).toFixed(1)}%)</label>
                <input
                  type="range"
                  min="0"
                  max="0.20"
                  step="0.005"
                  value={avgLoss}
                  onChange={e => setAvgLoss(parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Kelly ({(maxKelly * 100)}%)</label>
                <input
                  type="range"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  value={maxKelly}
                  onChange={e => setMaxKelly(parseFloat(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              {kellyResult && (
                <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-orange-500/20">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Full Kelly</div>
                      <div className="text-2xl font-bold text-orange-300">
                        {(kellyResult.kellyFraction * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Recommended Position</div>
                      <div className="text-2xl font-bold text-emerald-300">
                        ${kellyResult.positionSize.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        ({(kellyResult.recommendedFraction * 100).toFixed(1)}% of account)
                      </div>
                    </div>
                    <div className={`text-xs p-2 rounded ${
                      kellyResult.note.includes('aggressive') ? 'bg-rose-500/20 text-rose-300' :
                      kellyResult.note.includes('Negative') ? 'bg-rose-500/20 text-rose-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {kellyResult.note}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Fractional */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-rose-900/20 to-red-900/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🎯</span>
                <h3 className="text-sm font-bold text-rose-200">Fixed Fractional Risk</h3>
              </div>
              <p className="text-xs text-slate-400">Risk-based position sizing with stop loss</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Risk Per Trade ({riskPercent}%)</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.25"
                  value={riskPercent}
                  onChange={e => setRiskPercent(parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Entry Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={entryPrice}
                  onChange={e => setEntryPrice(parseFloat(e.target.value) || 0)}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Stop Loss ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={stopPrice}
                  onChange={e => setStopPrice(parseFloat(e.target.value) || 0)}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
                />
              </div>

              {fixedFracResult && (
                <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-rose-500/20">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Shares to Buy</div>
                      <div className="text-2xl font-bold text-rose-300">
                        {fixedFracResult.shares.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Position Value</div>
                      <div className="text-xl font-bold text-slate-200">
                        ${fixedFracResult.positionValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        ({fixedFracResult.positionPercent.toFixed(1)}% of account)
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Risk Amount</div>
                      <div className="text-lg font-bold text-orange-300">
                        ${fixedFracResult.riskAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        ${fixedFracResult.riskPerShare.toFixed(2)} per share
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Analysis Mode */}
      {activeMode === 'portfolio-analysis' && (
        <div className="space-y-6">
          {/* Positions List */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Portfolio Positions</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {positions.length} positions • ${positions.reduce((sum, p) => sum + p.value, 0).toLocaleString()} total
                </p>
              </div>
              <button
                onClick={() => setShowAddPosition(!showAddPosition)}
                className="relative group px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-rose-600 group-hover:from-orange-500 group-hover:to-rose-500 transition-all" />
                <span className="relative text-white">+ Add Position</span>
              </button>
            </div>

            {showAddPosition && (
              <div className="p-5 bg-slate-800/30 border-b border-slate-700/50">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={newPosition.symbol}
                      onChange={e => setNewPosition({ ...newPosition, symbol: e.target.value })}
                      className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all uppercase"
                      placeholder="TSLA"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Value ($)</label>
                    <input
                      type="number"
                      value={newPosition.value}
                      onChange={e => setNewPosition({ ...newPosition, value: e.target.value })}
                      className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Volatility</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newPosition.volatility}
                      onChange={e => setNewPosition({ ...newPosition, volatility: parseFloat(e.target.value) || 0.02 })}
                      className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all"
                      placeholder="0.02"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={handleAddPosition}
                      className="flex-1 relative group px-4 py-2 rounded-lg text-xs font-semibold overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-rose-600 group-hover:from-orange-500 group-hover:to-rose-500 transition-all" />
                      <span className="relative text-white">Add</span>
                    </button>
                    <button
                      onClick={() => setShowAddPosition(false)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5">
              <div className="space-y-2">
                {positions.map((pos, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-200">{pos.symbol}</div>
                      <div className="text-xs text-slate-400">
                        ${pos.value.toLocaleString()} • {((pos.value / positions.reduce((sum, p) => sum + p.value, 0)) * 100).toFixed(1)}% of portfolio
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePosition(idx)}
                      className="px-2 py-1 rounded text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          {portfolioAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Concentration Analysis */}
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h3 className="text-sm font-bold text-slate-200">Concentration Analysis</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-4 rounded-xl border" style={{
                    backgroundColor: `${portfolioAnalysis.recommendation.color === 'emerald' ? '#10b98120' :
                                       portfolioAnalysis.recommendation.color === 'yellow' ? '#f59e0b20' :
                                       portfolioAnalysis.recommendation.color === 'orange' ? '#f9731620' :
                                       '#ef444420'}`,
                    borderColor: `${portfolioAnalysis.recommendation.color === 'emerald' ? '#10b98140' :
                                    portfolioAnalysis.recommendation.color === 'yellow' ? '#f59e0b40' :
                                    portfolioAnalysis.recommendation.color === 'orange' ? '#f9731640' :
                                    '#ef444440'}`
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{portfolioAnalysis.recommendation.icon}</span>
                      <div className={`text-sm font-bold text-${portfolioAnalysis.recommendation.color}-300`}>
                        {portfolioAnalysis.recommendation.label}
                      </div>
                    </div>
                    <div className={`text-xs text-${portfolioAnalysis.recommendation.color}-200`}>
                      {portfolioAnalysis.recommendation.message}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">Risk Score</div>
                    <div className="text-2xl font-bold text-orange-300">
                      {Math.round(portfolioAnalysis.riskScore)}/100
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">Herfindahl Index</div>
                    <div className="text-lg font-bold text-slate-200">
                      {portfolioAnalysis.herfindahl.toFixed(3)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Lower is better (perfect diversification = 1/N)
                    </div>
                  </div>

                  {portfolioAnalysis.warnings.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-300">Warnings:</div>
                      {portfolioAnalysis.warnings.map((w, idx) => (
                        <div key={idx} className={`p-2 rounded text-xs ${
                          w.level === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          <div className="font-semibold mb-1">{w.message}</div>
                          <div className="opacity-80">{w.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Positions */}
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-slate-700/50">
                  <h3 className="text-sm font-bold text-slate-200">Top Positions</h3>
                </div>
                <div className="p-5 space-y-3">
                  {portfolioAnalysis.concentration.slice(0, 5).map((pos, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-semibold">{pos.symbol}</span>
                        <span className="text-slate-200 font-bold">{pos.percent.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-rose-500"
                          style={{ width: `${pos.percent}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-400">
                        ${pos.value.toLocaleString()} • Risk: ${pos.risk.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VaR Calculator Mode */}
      {activeMode === 'var-calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* VaR Card */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-rose-900/20 to-red-900/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📉</span>
                <h3 className="text-sm font-bold text-rose-200">Value at Risk (VaR)</h3>
              </div>
              <p className="text-xs text-slate-400">Maximum expected loss at given confidence</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Confidence Level</label>
                <select
                  value={confidenceLevel}
                  onChange={e => setConfidenceLevel(parseFloat(e.target.value))}
                  className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
                >
                  <option value={0.90}>90% (1.28σ)</option>
                  <option value={0.95}>95% (1.65σ)</option>
                  <option value={0.99}>99% (2.33σ)</option>
                </select>
              </div>

              {varResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-rose-500/20">
                    <div className="text-xs text-slate-400 mb-1">Portfolio Value</div>
                    <div className="text-xl font-bold text-slate-200">
                      ${varResult.portfolioValue.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/30">
                    <div className="text-xs text-rose-400 mb-1">1-Day VaR ({Math.round(confidenceLevel * 100)}%)</div>
                    <div className="text-2xl font-bold text-rose-300">
                      ${varResult.var.toLocaleString()}
                    </div>
                    <div className="text-xs text-rose-400 mt-1">
                      {varResult.varPercent.toFixed(2)}% of portfolio
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800/30 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">Portfolio Volatility</div>
                    <div className="text-lg font-bold text-orange-300">
                      {(varResult.portfolioVolatility * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expected Shortfall Card */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-red-900/20 to-rose-900/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">💀</span>
                <h3 className="text-sm font-bold text-red-200">Expected Shortfall (CVaR)</h3>
              </div>
              <p className="text-xs text-slate-400">Expected loss when VaR is exceeded</p>
            </div>

            <div className="p-5 space-y-4">
              {esResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                    <div className="text-xs text-red-400 mb-1">Expected Shortfall</div>
                    <div className="text-2xl font-bold text-red-300">
                      ${esResult.expectedShortfall.toLocaleString()}
                    </div>
                    <div className="text-xs text-red-400 mt-1">
                      {esResult.esPercent.toFixed(2)}% of portfolio
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/30 rounded-lg text-xs text-slate-300">
                    <div className="font-semibold mb-2">What is CVaR?</div>
                    <p className="text-slate-400 leading-relaxed">
                      Expected Shortfall (also called Conditional VaR) represents the average loss
                      in scenarios where losses exceed the VaR threshold. It's a more conservative
                      risk measure that captures tail risk.
                    </p>
                  </div>

                  <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <div className="text-xs text-orange-300 font-semibold mb-1">Risk Interpretation:</div>
                    <div className="text-xs text-orange-200">
                      There is a {Math.round((1 - confidenceLevel) * 100)}% chance of losing more than ${varResult.var.toLocaleString()}.
                      When that happens, the expected loss is ${esResult.expectedShortfall.toLocaleString()}.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
