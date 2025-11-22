/**
 * Level 2 Market Depth - Elite Order Book Visualization
 * Real-time bid/ask levels with liquidity heatmap
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

export default function Level2MarketDepth() {
  const { marketData } = useMarketData()
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] })
  const [spread, setSpread] = useState(0)
  const [imbalance, setImbalance] = useState(0)
  const [depth, setDepth] = useState(10) // Number of levels to show
  const [aggregation, setAggregation] = useState(0.01) // Price aggregation level
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showImbalance, setShowImbalance] = useState(true)
  const [autoCenter, setAutoCenter] = useState(true)
  const [orderFlow, setOrderFlow] = useState([])
  const [liquidityScore, setLiquidityScore] = useState(0)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(true)
  const containerRef = useRef(null)
  const wsRef = useRef(null)

  // Simulate order book data (in production, this would come from real exchange feed)
  useEffect(() => {
    generateOrderBook()
    const interval = setInterval(generateOrderBook, 1000)
    return () => clearInterval(interval)
  }, [marketData.price, depth, aggregation])

  const generateOrderBook = useCallback(() => {
    const currentPrice = marketData?.price || 100
    const bids = []
    const asks = []

    // Generate bid levels
    for (let i = 1; i <= depth; i++) {
      const price = currentPrice - (i * aggregation)
      const size = Math.floor(Math.random() * 50000 + 10000)
      const orders = Math.floor(Math.random() * 20 + 5)
      bids.push({
        price: price.toFixed(2),
        size,
        orders,
        total: size * price,
        percentage: 0 // Will calculate after
      })
    }

    // Generate ask levels
    for (let i = 1; i <= depth; i++) {
      const price = currentPrice + (i * aggregation)
      const size = Math.floor(Math.random() * 50000 + 10000)
      const orders = Math.floor(Math.random() * 20 + 5)
      asks.push({
        price: price.toFixed(2),
        size,
        orders,
        total: size * price,
        percentage: 0 // Will calculate after
      })
    }

    // Calculate percentages and cumulative values
    const maxSize = Math.max(
      ...bids.map(b => b.size),
      ...asks.map(a => a.size)
    )

    let bidCumulative = 0
    let askCumulative = 0

    bids.forEach(bid => {
      bidCumulative += bid.size
      bid.percentage = (bid.size / maxSize) * 100
      bid.cumulative = bidCumulative
    })

    asks.forEach(ask => {
      askCumulative += ask.size
      ask.percentage = (ask.size / maxSize) * 100
      ask.cumulative = askCumulative
    })

    // Calculate spread
    const bestBid = parseFloat(bids[0]?.price || 0)
    const bestAsk = parseFloat(asks[0]?.price || 0)
    const calculatedSpread = bestAsk - bestBid

    // Calculate imbalance
    const bidVolume = bids.reduce((sum, b) => sum + b.size, 0)
    const askVolume = asks.reduce((sum, a) => sum + a.size, 0)
    const calculatedImbalance = ((bidVolume - askVolume) / (bidVolume + askVolume)) * 100

    // Calculate liquidity score
    const totalVolume = bidVolume + askVolume
    const avgSpread = calculatedSpread / currentPrice
    const score = Math.min(100, (totalVolume / 1000000) * (1 - avgSpread) * 100)

    setOrderBook({ bids, asks })
    setSpread(calculatedSpread)
    setImbalance(calculatedImbalance)
    setLiquidityScore(score)

    // Simulate order flow
    if (Math.random() > 0.7) {
      const isBuy = Math.random() > 0.5
      const size = Math.floor(Math.random() * 5000 + 100)
      const price = isBuy ? bestAsk : bestBid

      setOrderFlow(prev => [{
        time: new Date().toLocaleTimeString(),
        side: isBuy ? 'buy' : 'sell',
        price,
        size,
        aggressive: Math.random() > 0.5
      }, ...prev.slice(0, 19)])
    }
  }, [marketData?.price, depth, aggregation])

  // AI Order Flow Analysis
  const analyzeOrderFlow = async () => {
    if (!orderBook.bids.length || aiLoading) return

    setAiLoading(true)
    try {
      const prompt = `As an AI market microstructure analyst using ML order flow models, analyze this Level 2 data:

      Order Book:
      - Best Bid: $${orderBook.bids[0]?.price} (${orderBook.bids[0]?.size} shares)
      - Best Ask: $${orderBook.asks[0]?.price} (${orderBook.asks[0]?.size} shares)
      - Spread: $${spread.toFixed(2)}
      - Imbalance: ${imbalance.toFixed(1)}%
      - Liquidity Score: ${liquidityScore.toFixed(0)}/100
      - Recent Order Flow: ${orderFlow.length} trades

      Provide JSON analysis with:
      1. manipulation: {detected: boolean, type: 'spoofing'|'layering'|'momentum_ignition'|'none', confidence: 0-1}
      2. orderFlowPrediction: 'buying_pressure'|'selling_pressure'|'neutral' with reasoning
      3. hiddenLiquidity: estimated iceberg orders and dark pool activity
      4. microstructureSignals: array of detected patterns
      5. executionRecommendation: optimal order placement strategy
      6. toxicFlow: percentage of toxic vs informed flow
      7. shortTermDirection: price direction in next 5 minutes with confidence`

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          feature: 'level2-analysis', // Uses GPT-5-mini for order flow analysis
          temperature: 0.2,
          max_tokens: 600
        })
      })

      if (response.ok) {
        const data = await response.json()
        const analysis = JSON.parse(data.content || '{}')
        setAiAnalysis(analysis)

        // Alert on manipulation detection
        if (analysis.manipulation?.detected) {
          window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: {
              text: `⚠️ AI detected ${analysis.manipulation.type} (${(analysis.manipulation.confidence * 100).toFixed(0)}% confidence)`,
              type: 'warning'
            }
          }))
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error)
    }
    setAiLoading(false)
  }

  // Auto-analyze when order book changes significantly
  useEffect(() => {
    if (showAI && orderBook.bids.length > 0) {
      const timer = setTimeout(() => {
        analyzeOrderFlow()
      }, 2000) // Debounce for 2 seconds
      return () => clearTimeout(timer)
    }
  }, [orderBook, showAI])

  // Auto-center on price changes
  useEffect(() => {
    if (autoCenter && containerRef.current) {
      const center = containerRef.current.querySelector('.price-center')
      if (center) {
        center.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [marketData.price, autoCenter])

  // Get color based on size
  const getSizeColor = (percentage) => {
    if (percentage > 75) return 'bg-purple-500/30'
    if (percentage > 50) return 'bg-blue-500/25'
    if (percentage > 25) return 'bg-cyan-500/20'
    return 'bg-slate-700/30'
  }

  // Get imbalance color
  const getImbalanceColor = (value) => {
    if (value > 20) return 'text-emerald-400'
    if (value < -20) return 'text-red-400'
    return 'text-yellow-400'
  }

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Level 2 Depth</h3>
              <p className="text-xs text-slate-400">
                Order book & market microstructure
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showHeatmap ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              🔥 Heat
            </button>
            <button
              onClick={() => setShowImbalance(!showImbalance)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showImbalance ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              ⚖️ Imb
            </button>
            <button
              onClick={() => setAutoCenter(!autoCenter)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                autoCenter ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              🎯 Auto
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showAI ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              🤖 AI
            </button>
          </div>
        </div>
      </div>

      {/* Market Stats */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Spread:</span>
            <div className="text-sm font-semibold text-yellow-400">
              ${spread.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Imbalance:</span>
            <div className={`text-sm font-semibold ${getImbalanceColor(imbalance)}`}>
              {imbalance > 0 ? '+' : ''}{imbalance.toFixed(1)}%
            </div>
          </div>
          <div>
            <span className="text-slate-500">Liquidity:</span>
            <div className="text-sm font-semibold text-cyan-400">
              {liquidityScore.toFixed(0)}/100
            </div>
          </div>
          <div>
            <span className="text-slate-500">Levels:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="bg-slate-700 rounded px-1 text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Order Book */}
        <div className="flex-1 overflow-y-auto" ref={containerRef}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="text-slate-400">
                <th className="text-left py-2 px-2">Orders</th>
                <th className="text-right py-2 px-2">Size</th>
                <th className="text-right py-2 px-2">Bid</th>
                <th className="text-center py-2 px-2">Price</th>
                <th className="text-left py-2 px-2">Ask</th>
                <th className="text-left py-2 px-2">Size</th>
                <th className="text-right py-2 px-2">Orders</th>
              </tr>
            </thead>
            <tbody>
              {/* Ask levels (reversed for display) */}
              {[...orderBook.asks].reverse().map((ask, idx) => (
                <tr key={`ask-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-1 px-2"></td>
                  <td className="py-1 px-2"></td>
                  <td className="py-1 px-2"></td>
                  <td className="text-center py-1 px-2 text-red-400 font-medium">
                    {ask.price}
                  </td>
                  <td className="text-left py-1 px-2 relative">
                    {showHeatmap && (
                      <div
                        className={`absolute inset-0 ${getSizeColor(ask.percentage)}`}
                        style={{ width: `${ask.percentage}%` }}
                      />
                    )}
                    <span className="relative text-red-300">{ask.price}</span>
                  </td>
                  <td className="text-left py-1 px-2 text-slate-300">
                    {formatNumber(ask.size)}
                  </td>
                  <td className="text-right py-1 px-2 text-slate-500">
                    {ask.orders}
                  </td>
                </tr>
              ))}

              {/* Current Price / Spread */}
              <tr className="price-center bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent">
                <td colSpan="7" className="text-center py-2">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-xs text-slate-400">SPREAD</span>
                    <span className="text-lg font-bold text-white">
                      ${marketData?.price?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-xs text-yellow-400">
                      ${spread.toFixed(2)} ({((spread / (marketData?.price || 100)) * 100).toFixed(3)}%)
                    </span>
                  </div>
                </td>
              </tr>

              {/* Bid levels */}
              {orderBook.bids.map((bid, idx) => (
                <tr key={`bid-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                  <td className="text-left py-1 px-2 text-slate-500">
                    {bid.orders}
                  </td>
                  <td className="text-right py-1 px-2 text-slate-300">
                    {formatNumber(bid.size)}
                  </td>
                  <td className="text-right py-1 px-2 relative">
                    {showHeatmap && (
                      <div
                        className={`absolute inset-y-0 right-0 ${getSizeColor(bid.percentage)}`}
                        style={{ width: `${bid.percentage}%` }}
                      />
                    )}
                    <span className="relative text-emerald-300">{bid.price}</span>
                  </td>
                  <td className="text-center py-1 px-2 text-emerald-400 font-medium">
                    {bid.price}
                  </td>
                  <td className="py-1 px-2"></td>
                  <td className="py-1 px-2"></td>
                  <td className="py-1 px-2"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Flow */}
        <div className="w-64 border-l border-slate-700/50 flex flex-col">
          <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-900/50">
            <h4 className="text-xs font-semibold text-slate-400">ORDER FLOW</h4>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="text-xs">
              {orderFlow.map((order, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 border-b border-slate-800/50 ${
                    order.side === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{order.time}</span>
                    <span className={order.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}>
                      {order.side.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-slate-300">{formatNumber(order.size)}</span>
                    <span className="text-slate-400">@ ${order.price.toFixed(2)}</span>
                  </div>
                  {order.aggressive && (
                    <div className="text-amber-400 text-xs mt-0.5">⚡ Aggressive</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Imbalance Indicator */}
          {showImbalance && (
            <div className="px-3 py-3 border-t border-slate-700/50 bg-slate-900/50">
              <div className="text-xs text-slate-400 mb-2">BOOK IMBALANCE</div>
              <div className="relative h-6 bg-slate-700 rounded overflow-hidden">
                <div
                  className={`absolute top-0 bottom-0 transition-all ${
                    imbalance > 0 ? 'bg-emerald-500/50 left-1/2' : 'bg-red-500/50 right-1/2'
                  }`}
                  style={{
                    width: `${Math.abs(imbalance) / 2}%`,
                    left: imbalance > 0 ? '50%' : undefined,
                    right: imbalance < 0 ? '50%' : undefined
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-semibold ${getImbalanceColor(imbalance)}`}>
                    {imbalance > 0 ? 'BID' : 'ASK'} {Math.abs(imbalance).toFixed(1)}%
                  </span>
                </div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
              </div>
            </div>
          )}

          {/* Volume Distribution */}
          <div className="px-3 py-3 border-t border-slate-700/50 bg-slate-900/50">
            <div className="text-xs text-slate-400 mb-2">VOLUME DISTRIBUTION</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400">Bid Vol:</span>
                <span className="text-xs text-slate-300">
                  {formatNumber(orderBook.bids.reduce((sum, b) => sum + b.size, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-400">Ask Vol:</span>
                <span className="text-xs text-slate-300">
                  {formatNumber(orderBook.asks.reduce((sum, a) => sum + a.size, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-400">Total:</span>
                <span className="text-xs text-slate-300">
                  {formatNumber(
                    orderBook.bids.reduce((sum, b) => sum + b.size, 0) +
                    orderBook.asks.reduce((sum, a) => sum + a.size, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* AI Analysis Panel */}
          {showAI && (
            <div className="px-3 py-3 border-t border-slate-700/50 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs">🤖</span>
                  <span className="text-xs font-semibold text-purple-400">AI ANALYSIS</span>
                </div>
                {aiLoading && (
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                )}
              </div>

              {aiAnalysis ? (
                <div className="space-y-2">
                  {/* Manipulation Detection */}
                  {aiAnalysis.manipulation && (
                    <div className={`p-2 rounded text-xs ${
                      aiAnalysis.manipulation.detected
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-green-500/20 border border-green-500/30'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={aiAnalysis.manipulation.detected ? 'text-red-400' : 'text-green-400'}>
                          {aiAnalysis.manipulation.detected ? '⚠️ Manipulation Detected' : '✅ Clean Market'}
                        </span>
                        {aiAnalysis.manipulation.detected && (
                          <span className="text-red-300 text-xs">
                            {(aiAnalysis.manipulation.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {aiAnalysis.manipulation.detected && (
                        <div className="text-red-300">
                          Type: {aiAnalysis.manipulation.type}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Flow Prediction */}
                  {aiAnalysis.orderFlowPrediction && (
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-400 mb-1">Flow Direction</div>
                      <div className={`text-sm font-semibold ${
                        aiAnalysis.orderFlowPrediction === 'buying_pressure' ? 'text-emerald-400' :
                        aiAnalysis.orderFlowPrediction === 'selling_pressure' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {aiAnalysis.orderFlowPrediction === 'buying_pressure' ? '📈 Buying Pressure' :
                         aiAnalysis.orderFlowPrediction === 'selling_pressure' ? '📉 Selling Pressure' :
                         '➡️ Neutral Flow'}
                      </div>
                    </div>
                  )}

                  {/* Hidden Liquidity */}
                  {aiAnalysis.hiddenLiquidity && (
                    <div className="bg-indigo-500/10 rounded p-2 text-xs">
                      <div className="text-indigo-400 mb-1">🧊 Hidden Liquidity</div>
                      <div className="text-slate-300">{aiAnalysis.hiddenLiquidity}</div>
                    </div>
                  )}

                  {/* Microstructure Signals */}
                  {aiAnalysis.microstructureSignals && aiAnalysis.microstructureSignals.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400">Patterns:</div>
                      {aiAnalysis.microstructureSignals.map((signal, idx) => (
                        <div key={idx} className="text-xs bg-purple-500/10 rounded px-2 py-1 text-purple-300">
                          • {signal}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Toxic Flow */}
                  {aiAnalysis.toxicFlow !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Toxic Flow:</span>
                      <span className={`font-semibold ${
                        aiAnalysis.toxicFlow > 50 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {aiAnalysis.toxicFlow}%
                      </span>
                    </div>
                  )}

                  {/* Short Term Direction */}
                  {aiAnalysis.shortTermDirection && (
                    <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded p-2">
                      <div className="text-xs text-cyan-400 mb-1">5-Min Forecast</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          {aiAnalysis.shortTermDirection.direction || 'Analyzing...'}
                        </span>
                        {aiAnalysis.shortTermDirection.confidence && (
                          <span className="text-xs text-cyan-300">
                            {(aiAnalysis.shortTermDirection.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Execution Recommendation */}
                  {aiAnalysis.executionRecommendation && (
                    <div className="bg-amber-500/10 rounded p-2 border border-amber-500/30">
                      <div className="text-xs text-amber-400 mb-1">💡 Execution Strategy</div>
                      <div className="text-xs text-slate-200">{aiAnalysis.executionRecommendation}</div>
                    </div>
                  )}
                </div>
              ) : aiLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-slate-800/30 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={analyzeOrderFlow}
                  className="w-full py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-all"
                >
                  Analyze Order Flow
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Aggregation:</span>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(parseFloat(e.target.value))}
              className="bg-slate-700 rounded px-2 py-1 text-xs"
            >
              <option value="0.01">$0.01</option>
              <option value="0.05">$0.05</option>
              <option value="0.10">$0.10</option>
              <option value="0.50">$0.50</option>
              <option value="1.00">$1.00</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              liquidityScore > 70 ? 'bg-emerald-400' :
              liquidityScore > 40 ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-xs text-slate-400">
              {liquidityScore > 70 ? 'High Liquidity' :
               liquidityScore > 40 ? 'Medium Liquidity' : 'Low Liquidity'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}