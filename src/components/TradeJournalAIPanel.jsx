import { useState, useEffect } from 'react'
import {
  TradeEntry,
  tradeJournalDB,
  calculateStats,
  reviewTrade,
  identifyPatterns,
  calculateSharpeRatio,
  calculateSortinoRatio,
  generateComprehensiveAnalysis
} from '../utils/tradeJournal.js'

export default function TradeJournalAIPanel() {
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [aiReview, setAiReview] = useState(null)
  const [aiReviewing, setAiReviewing] = useState(false)
  const [filterStrategy, setFilterStrategy] = useState('all')
  const [filterOutcome, setFilterOutcome] = useState('all')

  const [newTrade, setNewTrade] = useState({
    symbol: '',
    direction: 'long',
    entryPrice: '',
    exitPrice: '',
    shares: '',
    entryDate: Date.now(),
    exitDate: Date.now(),
    strategy: '',
    setup: '',
    notes: '',
    stopLoss: '',
    commission: 0,
    emotionalState: 'neutral',
    disciplineScore: 5,
    marketCondition: 'neutral'
  })

  // Load trades on mount
  const refreshData = () => {
    const allTrades = tradeJournalDB.getAllTrades()
    setTrades(allTrades)
    if (allTrades.length > 0) {
      const statistics = calculateStats(allTrades)
      setStats(statistics)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleAddTrade = () => {
    try {
      const entry = parseFloat(newTrade.entryPrice)
      const exit = parseFloat(newTrade.exitPrice)
      const shares = parseFloat(newTrade.shares)

      if (!newTrade.symbol || isNaN(entry) || isNaN(exit) || isNaN(shares)) {
        alert('Please fill all required fields with valid numbers')
        return
      }

      const tradeData = {
        ...newTrade,
        entryPrice: entry,
        exitPrice: exit,
        shares,
        stopLoss: parseFloat(newTrade.stopLoss) || null
      }

      tradeJournalDB.addTrade(tradeData)

      // Reset form
      setNewTrade({
        symbol: '',
        direction: 'long',
        entryPrice: '',
        exitPrice: '',
        shares: '',
        entryDate: Date.now(),
        exitDate: Date.now(),
        strategy: '',
        setup: '',
        notes: '',
        stopLoss: '',
        commission: 0,
        emotionalState: 'neutral',
        disciplineScore: 5,
        marketCondition: 'neutral'
      })

      setShowAddTrade(false)
      refreshData()

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Trade recorded successfully', type: 'success' }
      }))
    } catch (error) {
      console.error('Error adding trade:', error)
      alert('Failed to add trade: ' + error.message)
    }
  }

  const handleAIReview = async (trade) => {
    setAiReviewing(true)
    setSelectedTrade(trade)
    setAiReview(null)

    try {
      const review = await reviewTrade(trade)
      setAiReview(review)
    } catch (error) {
      console.error('AI review failed:', error)
      setAiReview({
        review: 'Failed to generate AI review. Please check your API configuration.',
        error: error.message
      })
    } finally {
      setAiReviewing(false)
    }
  }

  const handleDelete = (tradeId) => {
    if (confirm('Delete this trade? This cannot be undone.')) {
      tradeJournalDB.deleteTrade(tradeId)
      refreshData()
      setSelectedTrade(null)
      setAiReview(null)
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Trade deleted', type: 'success' }
      }))
    }
  }

  const handleExport = () => {
    try {
      const data = { trades: tradeJournalDB.getAllTrades() }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trade-journal-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Journal exported successfully', type: 'success' }
      }))
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed: ' + error.message)
    }
  }

  // Filter trades
  const filteredTrades = trades.filter(t => {
    const matchesStrategy = filterStrategy === 'all' || t.strategy === filterStrategy
    const matchesOutcome = filterOutcome === 'all' || t.outcome === filterOutcome
    return matchesStrategy && matchesOutcome
  })

  const strategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-violet-600 blur-lg opacity-50 animate-pulse" />
                  <span className="relative text-2xl filter drop-shadow-lg">📔</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-violet-200 to-purple-300 bg-clip-text text-transparent">
                    Trade Journal AI
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Track trades & learn with AI-powered insights
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowAddTrade(!showAddTrade)}
                  className="relative group px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-500 group-hover:to-purple-500 transition-all" />
                  <span className="relative text-white flex items-center gap-1.5">
                    <span>+</span>
                    Add Trade
                  </span>
                </button>

                <button
                  onClick={handleExport}
                  disabled={trades.length === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                  📥 Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Trade Form */}
        {showAddTrade && (
          <div className="p-5 bg-slate-800/30 border-b border-slate-700/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Symbol *</label>
                <input
                  type="text"
                  value={newTrade.symbol}
                  onChange={e => setNewTrade({ ...newTrade, symbol: e.target.value.toUpperCase() })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all uppercase"
                  placeholder="AAPL"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Direction *</label>
                <select
                  value={newTrade.direction}
                  onChange={e => setNewTrade({ ...newTrade, direction: e.target.value })}
                  className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Shares *</label>
                <input
                  type="number"
                  value={newTrade.shares}
                  onChange={e => setNewTrade({ ...newTrade, shares: e.target.value })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Entry Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTrade.entryPrice}
                  onChange={e => setNewTrade({ ...newTrade, entryPrice: e.target.value })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  placeholder="150.00"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Exit Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTrade.exitPrice}
                  onChange={e => setNewTrade({ ...newTrade, exitPrice: e.target.value })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  placeholder="155.00"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Stop Loss</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTrade.stopLoss}
                  onChange={e => setNewTrade({ ...newTrade, stopLoss: e.target.value })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  placeholder="148.00"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Strategy</label>
                <input
                  type="text"
                  value={newTrade.strategy}
                  onChange={e => setNewTrade({ ...newTrade, strategy: e.target.value })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  placeholder="Breakout"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Setup</label>
                <input
                  type="text"
                  value={newTrade.setup}
                  onChange={e => setNewTrade({ ...newTrade, setup: e.target.value })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  placeholder="Bull flag"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Market Condition</label>
                <select
                  value={newTrade.marketCondition}
                  onChange={e => setNewTrade({ ...newTrade, marketCondition: e.target.value })}
                  className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
                >
                  <option value="neutral">Neutral</option>
                  <option value="trending">Trending</option>
                  <option value="ranging">Ranging</option>
                  <option value="volatile">Volatile</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <textarea
                value={newTrade.notes}
                onChange={e => setNewTrade({ ...newTrade, notes: e.target.value })}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                rows="2"
                placeholder="Trade notes..."
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddTrade}
                className="flex-1 relative group px-4 py-2 rounded-lg text-sm font-semibold overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-500 group-hover:to-purple-500 transition-all" />
                <span className="relative text-white">Save Trade</span>
              </button>
              <button
                onClick={() => setShowAddTrade(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {stats && trades.length > 0 && (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/30 rounded-lg border border-violet-500/20">
              <div className="text-xs text-slate-400 mb-1">Total Trades</div>
              <div className="text-xl font-bold text-violet-300">{stats.totalTrades}</div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg border border-emerald-500/20">
              <div className="text-xs text-slate-400 mb-1">Win Rate</div>
              <div className="text-xl font-bold text-emerald-300">
                {Math.round(stats.winRate * 100)}%
              </div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg border border-cyan-500/20">
              <div className="text-xs text-slate-400 mb-1">Profit Factor</div>
              <div className="text-xl font-bold text-cyan-300">
                {stats.profitFactor.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg border border-purple-500/20">
              <div className="text-xs text-slate-400 mb-1">Total P&L</div>
              <div className={`text-xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                ${stats.totalPnL.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {trades.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm text-slate-400 font-semibold">Filters:</div>
            <select
              value={filterOutcome}
              onChange={e => setFilterOutcome(e.target.value)}
              className="select bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
            >
              <option value="all">All Outcomes</option>
              <option value="win">Wins Only</option>
              <option value="loss">Losses Only</option>
            </select>

            {strategies.length > 0 && (
              <select
                value={filterStrategy}
                onChange={e => setFilterStrategy(e.target.value)}
                className="select bg-slate-800/50 border-slate-700/50 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
              >
                <option value="all">All Strategies</option>
                {strategies.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            <div className="ml-auto text-xs text-slate-400">
              Showing {filteredTrades.length} of {trades.length} trades
            </div>
          </div>
        </div>
      )}

      {/* Trade List */}
      {trades.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">📔</div>
          <div className="text-slate-400 mb-4">No trades recorded yet</div>
          <button
            onClick={() => setShowAddTrade(true)}
            className="relative group px-4 py-2 rounded-lg text-sm font-semibold overflow-hidden inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-500 group-hover:to-purple-500 transition-all" />
            <span className="relative text-white">+ Add Your First Trade</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map(trade => (
            <div
              key={trade.id}
              className="card overflow-hidden cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setSelectedTrade(trade.id === selectedTrade?.id ? null : trade)}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-sm font-bold text-slate-200">{trade.symbol}</div>
                    <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      trade.direction === 'long' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {trade.direction.toUpperCase()}
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      trade.outcome === 'win' ? 'bg-emerald-500/20 text-emerald-300' :
                      trade.outcome === 'loss' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {trade.outcome === 'win' ? '+' : trade.outcome === 'loss' ? '-' : '='}{Math.abs(trade.returnPercent).toFixed(2)}%
                    </div>
                    {trade.strategy && (
                      <div className="px-2 py-0.5 rounded text-xs bg-violet-500/20 text-violet-300">
                        {trade.strategy}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    ${trade.entryPrice} → ${trade.exitPrice} • {trade.shares} shares • P&L: ${trade.pnl.toFixed(2)}
                  </div>
                  {trade.notes && (
                    <div className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {trade.notes}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAIReview(trade)
                  }}
                  disabled={aiReviewing}
                  className="ml-4 relative group px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-500 group-hover:to-purple-500 transition-all" />
                  <span className="relative text-white">🤖 AI Review</span>
                </button>
              </div>

              {/* Expanded View */}
              {selectedTrade?.id === trade.id && (
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-slate-400 mb-1">Entry Date</div>
                      <div className="text-slate-200">{new Date(trade.entryDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Exit Date</div>
                      <div className="text-slate-200">{new Date(trade.exitDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Hold Time</div>
                      <div className="text-slate-200">{(trade.holdTime / 3600000).toFixed(1)}h</div>
                    </div>
                    {trade.stopLoss && (
                      <div>
                        <div className="text-slate-400 mb-1">Stop Loss</div>
                        <div className="text-slate-200">${trade.stopLoss}</div>
                      </div>
                    )}
                    {trade.rMultiple && (
                      <div>
                        <div className="text-slate-400 mb-1">R-Multiple</div>
                        <div className="text-slate-200">{trade.rMultiple.toFixed(2)}R</div>
                      </div>
                    )}
                    <div>
                      <div className="text-slate-400 mb-1">Market Condition</div>
                      <div className="text-slate-200 capitalize">{trade.marketCondition}</div>
                    </div>
                  </div>

                  {aiReview && aiReview.review && (
                    <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">🤖</span>
                        <div className="text-sm font-bold text-violet-200">AI Analysis</div>
                      </div>
                      <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {aiReview.review}
                      </div>
                    </div>
                  )}

                  {aiReviewing && (
                    <div className="p-3 bg-slate-700/30 rounded-lg text-sm text-slate-400 text-center">
                      Analyzing trade with AI...
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(trade.id)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
