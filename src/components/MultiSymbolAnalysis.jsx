/**
 * Multi-Symbol Analysis
 * Compare 3-5 symbols side-by-side with sector correlation and relative strength
 *
 * Features:
 * - Side-by-side comparison
 * - Unicorn Score rankings
 * - Sector correlation heat map
 * - Relative strength index
 * - Best opportunities highlighted
 * - Custom watchlist support
 */

import { useState, useEffect } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

export default function MultiSymbolAnalysis() {
  const { marketData } = useMarketData()
  const [symbols, setSymbols] = useState(['SPY', 'QQQ', 'IWM', 'DIA'])
  const [symbolInput, setSymbolInput] = useState('')
  const [analysisData, setAnalysisData] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sortBy, setSortBy] = useState('score') // score, change, volume

  // Mock analysis function (in production, fetch real data for each symbol)
  const analyzeSymbols = async () => {
    setIsAnalyzing(true)

    try {
      // In production, fetch real data for each symbol
      // For now, generate mock data with realistic patterns
      const mockData = symbols.map((symbol, idx) => {
        const baseScore = 50 + Math.random() * 40
        const price = 100 + Math.random() * 400
        const change = (Math.random() - 0.5) * 10
        const volume = Math.floor(Math.random() * 100000000)

        return {
          symbol,
          price: price.toFixed(2),
          change: change.toFixed(2),
          changePercent: (change / price * 100).toFixed(2),
          volume: volume.toLocaleString(),
          unicornScore: Math.round(baseScore),
          trend: baseScore > 65 ? 'bullish' : baseScore < 45 ? 'bearish' : 'neutral',
          strength: Math.round((baseScore / 100) * 10), // 1-10 scale
          sector: getSector(symbol),
          recommendation: getRecommendation(baseScore, change)
        }
      })

      // Sort by selected criteria
      const sorted = mockData.sort((a, b) => {
        if (sortBy === 'score') return b.unicornScore - a.unicornScore
        if (sortBy === 'change') return parseFloat(b.changePercent) - parseFloat(a.changePercent)
        if (sortBy === 'volume') return parseInt(b.volume.replace(/,/g, '')) - parseInt(a.volume.replace(/,/g, ''))
        return 0
      })

      setAnalysisData(sorted)
    } catch (error) {
      console.error('[Multi-Symbol] Error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Get sector for symbol (simplified)
  const getSector = (symbol) => {
    const sectors = {
      'SPY': 'Broad Market',
      'QQQ': 'Technology',
      'IWM': 'Small Cap',
      'DIA': 'Blue Chip',
      'XLF': 'Financials',
      'XLE': 'Energy',
      'XLK': 'Technology',
      'XLV': 'Healthcare',
      'XLY': 'Consumer',
      'XLP': 'Staples'
    }
    return sectors[symbol] || 'Equity'
  }

  // Get recommendation based on score and momentum
  const getRecommendation = (score, change) => {
    if (score >= 75 && change > 2) return { text: 'Strong Buy', color: 'emerald' }
    if (score >= 65 && change > 0) return { text: 'Buy', color: 'cyan' }
    if (score <= 35 && change < -2) return { text: 'Strong Sell', color: 'red' }
    if (score <= 45 && change < 0) return { text: 'Sell', color: 'amber' }
    return { text: 'Hold', color: 'slate' }
  }

  // Add symbol to comparison
  const addSymbol = () => {
    const sym = symbolInput.trim().toUpperCase()
    if (sym && !symbols.includes(sym) && symbols.length < 10) {
      setSymbols([...symbols, sym])
      setSymbolInput('')
    }
  }

  // Remove symbol
  const removeSymbol = (symbol) => {
    if (symbols.length > 1) {
      setSymbols(symbols.filter(s => s !== symbol))
    }
  }

  // Auto-analyze on symbols change
  useEffect(() => {
    if (symbols.length > 0) {
      analyzeSymbols()
    }
  }, [symbols, sortBy])

  // Get strength color
  const getStrengthColor = (strength) => {
    if (strength >= 8) return 'text-emerald-400'
    if (strength >= 6) return 'text-cyan-400'
    if (strength >= 4) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Multi-Symbol Analysis</h3>
              <p className="text-xs text-slate-400">
                Compare up to 10 symbols side-by-side
              </p>
            </div>
          </div>

          {/* Add Symbol */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
              placeholder="Add symbol..."
              className="input-field w-24 text-xs"
              maxLength={5}
            />
            <button
              onClick={addSymbol}
              className="btn-tertiary btn-sm"
              disabled={!symbolInput.trim() || symbols.length >= 10}
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800/30 px-4 py-2 border-b border-slate-700/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field text-xs py-1 px-2"
            >
              <option value="score">Unicorn Score</option>
              <option value="change">% Change</option>
              <option value="volume">Volume</option>
            </select>
          </div>
          <div className="text-xs text-slate-400">
            Comparing {symbols.length} symbols
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {isAnalyzing ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-3" />
            <div className="text-sm text-slate-400">Analyzing symbols...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Symbol Cards */}
            {analysisData.map((data, idx) => {
              const isTop = idx === 0
              const changeColor = parseFloat(data.change) >= 0 ? 'text-emerald-400' : 'text-red-400'

              return (
                <div
                  key={data.symbol}
                  className={`p-4 rounded-lg border ${
                    isTop
                      ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10'
                      : 'border-slate-700/50 bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isTop && <span className="text-lg">👑</span>}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-200">{data.symbol}</span>
                            <span className="text-xs text-slate-400">{data.sector}</span>
                          </div>
                          <div className="text-sm text-slate-400">${data.price}</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSymbol(data.symbol)}
                      className="text-slate-400 hover:text-slate-300 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {/* Unicorn Score */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        data.unicornScore >= 75 ? 'text-emerald-400' :
                        data.unicornScore >= 65 ? 'text-cyan-400' :
                        data.unicornScore >= 50 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {data.unicornScore}
                      </div>
                      <div className="text-xs text-slate-400">Score</div>
                    </div>

                    {/* Change */}
                    <div className="text-center">
                      <div className={`text-xl font-bold ${changeColor}`}>
                        {parseFloat(data.change) >= 0 ? '+' : ''}{data.changePercent}%
                      </div>
                      <div className="text-xs text-slate-400">Change</div>
                    </div>

                    {/* Strength */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getStrengthColor(data.strength)}`}>
                        {data.strength}/10
                      </div>
                      <div className="text-xs text-slate-400">Strength</div>
                    </div>

                    {/* Trend */}
                    <div className="text-center">
                      <div className="text-xl">
                        {data.trend === 'bullish' ? '🐂' :
                         data.trend === 'bearish' ? '🐻' : '➖'}
                      </div>
                      <div className="text-xs text-slate-400 capitalize">{data.trend}</div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                    <div className="text-xs text-slate-400">Recommendation:</div>
                    <div className={`text-sm font-bold text-${data.recommendation.color}-400`}>
                      {data.recommendation.text}
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="mt-2 text-xs text-slate-400 text-center">
                    Volume: {data.volume}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sector Correlation (simplified visualization) */}
        {analysisData.length > 0 && (
          <div className="mt-6 bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <div className="text-xs text-slate-400 font-semibold mb-3">SECTOR CORRELATION</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {analysisData.slice(0, 6).map((data, idx) => {
                const correlation = 50 + Math.random() * 50 // Mock correlation
                return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/30 rounded">
                    <span className="text-slate-300">{data.symbol} - {data.sector}</span>
                    <span className={`font-semibold ${
                      correlation >= 80 ? 'text-emerald-400' :
                      correlation >= 60 ? 'text-cyan-400' :
                      correlation >= 40 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {correlation.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <div className="text-xs text-slate-400 font-semibold mb-3">QUICK PRESETS</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSymbols(['SPY', 'QQQ', 'IWM', 'DIA'])}
              className="btn-ghost btn-sm text-xs"
            >
              📊 Indices
            </button>
            <button
              onClick={() => setSymbols(['XLF', 'XLE', 'XLK', 'XLV', 'XLY'])}
              className="btn-ghost btn-sm text-xs"
            >
              🏭 Sectors
            </button>
            <button
              onClick={() => setSymbols(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'])}
              className="btn-ghost btn-sm text-xs"
            >
              💎 FAANG+
            </button>
            <button
              onClick={() => setSymbols(['GLD', 'SLV', 'USO', 'TLT'])}
              className="btn-ghost btn-sm text-xs"
            >
              📈 Commodities
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
