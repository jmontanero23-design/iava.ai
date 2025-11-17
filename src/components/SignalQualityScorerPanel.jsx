import { useState, useEffect } from 'react'
import {
  SIGNAL_TYPES,
  getRankedSignals,
  getSignalPerformance,
  recordTrade,
  exportData,
  importData,
  clearAllData
} from '../utils/signalQualityScorer.js'

export default function SignalQualityScorerPanel() {
  const [rankedSignals, setRankedSignals] = useState([])
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [newTrade, setNewTrade] = useState({
    signalType: SIGNAL_TYPES.UNICORN,
    entry: '',
    exit: '',
    shares: '',
    commission: 0
  })

  // Load data on mount and when trades change
  const refreshData = () => {
    const ranked = getRankedSignals()
    setRankedSignals(ranked)
    if (selectedSignal) {
      const updated = getSignalPerformance(selectedSignal.signalType)
      setSelectedSignal(updated)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleAddTrade = () => {
    try {
      const entry = parseFloat(newTrade.entry)
      const exit = parseFloat(newTrade.exit)
      const shares = parseFloat(newTrade.shares)
      const commission = parseFloat(newTrade.commission) || 0

      // Enhanced validation with toast feedback
      if (isNaN(entry) || entry <= 0) {
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: '❌ Entry price must be greater than 0', type: 'error', ttl: 3000 }
        }))
        return
      }

      if (isNaN(exit) || exit <= 0) {
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: '❌ Exit price must be greater than 0', type: 'error', ttl: 3000 }
        }))
        return
      }

      if (isNaN(shares) || shares <= 0) {
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: '❌ Shares must be greater than 0', type: 'error', ttl: 3000 }
        }))
        return
      }

      if (isNaN(commission) || commission < 0) {
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: '❌ Commission cannot be negative', type: 'error', ttl: 3000 }
        }))
        return
      }

      const pnl = (exit - entry) * shares - commission
      const pnlPercent = ((exit - entry) / entry)

      recordTrade({
        signalType: newTrade.signalType,
        entry,
        exit,
        shares,
        pnl,
        pnlPercent,
        commission,
        timestamp: Date.now(),
        isWin: pnl > 0
      })

      // Reset form and refresh
      setNewTrade({
        signalType: SIGNAL_TYPES.UNICORN,
        entry: '',
        exit: '',
        shares: '',
        commission: 0
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

  const handleExport = () => {
    try {
      const data = exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `signal-quality-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Data exported successfully', type: 'success' }
      }))
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed: ' + error.message)
    }
  }

  const handleImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        importData(data)
        refreshData()
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: 'Data imported successfully', type: 'success' }
        }))
      } catch (error) {
        console.error('Import failed:', error)
        alert('Import failed: ' + error.message)
      }
    }
    reader.readAsText(file)
  }

  const handleClearAll = () => {
    if (confirm('⚠️ This will delete ALL recorded trades. Are you sure?')) {
      clearAllData()
      refreshData()
      setSelectedSignal(null)
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'All data cleared', type: 'success' }
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-600 blur-lg opacity-50 animate-pulse" />
                  <span className="relative text-2xl filter drop-shadow-lg">📊</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-200 to-cyan-300 bg-clip-text text-transparent">
                    Signal Quality Scorer
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Track historical performance by signal type
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowAddTrade(!showAddTrade)}
                  className="relative group px-3 py-1.5 rounded-lg text-xs font-semibold overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all" />
                  <span className="relative text-white flex items-center gap-1.5">
                    <span>+</span>
                    Add Trade
                  </span>
                </button>

                <button
                  onClick={handleExport}
                  disabled={rankedSignals.length === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                  📥 Export
                </button>

                <label className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer">
                  📤 Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleClearAll}
                  disabled={rankedSignals.length === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition-all disabled:opacity-50"
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Trade Form */}
        {showAddTrade && (
          <div className="p-5 bg-slate-800/30 border-b border-slate-700/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Signal Type</label>
                <select
                  value={newTrade.signalType}
                  onChange={e => setNewTrade({ ...newTrade, signalType: e.target.value })}
                  className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm"
                >
                  {Object.entries(SIGNAL_TYPES).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Entry Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTrade.entry}
                  onChange={e => setNewTrade({ ...newTrade, entry: e.target.value })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  placeholder="100.00"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Exit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTrade.exit}
                  onChange={e => setNewTrade({ ...newTrade, exit: e.target.value })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  placeholder="105.00"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Shares</label>
                <input
                  type="number"
                  value={newTrade.shares}
                  onChange={e => setNewTrade({ ...newTrade, shares: e.target.value })}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  placeholder="100"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleAddTrade}
                  className="flex-1 relative group px-4 py-2 rounded-lg text-xs font-semibold overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all" />
                  <span className="relative text-white">Save</span>
                </button>
                <button
                  onClick={() => setShowAddTrade(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {rankedSignals.length > 0 && (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/30 rounded-lg border border-emerald-500/20">
              <div className="text-xs text-slate-400 mb-1">Total Signals</div>
              <div className="text-xl font-bold text-emerald-300">{rankedSignals.length}</div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg border border-cyan-500/20">
              <div className="text-xs text-slate-400 mb-1">Total Trades</div>
              <div className="text-xl font-bold text-cyan-300">
                {rankedSignals.reduce((sum, s) => sum + s.sampleSize, 0)}
              </div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg border border-teal-500/20">
              <div className="text-xs text-slate-400 mb-1">Avg Win Rate</div>
              <div className="text-xl font-bold text-teal-300">
                {Math.round((rankedSignals.reduce((sum, s) => sum + s.winRate, 0) / rankedSignals.length) * 100)}%
              </div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg border border-emerald-500/20">
              <div className="text-xs text-slate-400 mb-1">Avg Quality</div>
              <div className="text-xl font-bold text-emerald-300">
                {Math.round(rankedSignals.reduce((sum, s) => sum + s.qualityScore, 0) / rankedSignals.length)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signal Performance Grid */}
      {rankedSignals.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-slate-400 mb-4">No trades recorded yet</div>
          <button
            onClick={() => setShowAddTrade(true)}
            className="relative group px-4 py-2 rounded-lg text-sm font-semibold overflow-hidden inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all" />
            <span className="relative text-white">+ Add Your First Trade</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {rankedSignals.map((signal) => {
            const ratingColor = signal.rating.color
            const isSelected = selectedSignal?.signalType === signal.signalType

            return (
              <div
                key={signal.signalType}
                onClick={() => setSelectedSignal(signal)}
                className={`card overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                  isSelected ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                {/* Signal Header */}
                <div className="p-4 border-b border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-slate-200 capitalize">
                      {signal.signalType.replace(/_/g, ' ')}
                    </div>
                    <div
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: `${ratingColor}20`,
                        color: ratingColor,
                        border: `1px solid ${ratingColor}40`
                      }}
                    >
                      {signal.rating.label}
                    </div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: ratingColor }}>
                    {Math.round(signal.qualityScore)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Quality Score • {signal.sampleSize} trades
                  </div>
                </div>

                {/* Signal Stats */}
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Win Rate</span>
                    <span className="text-slate-200 font-semibold">
                      {Math.round(signal.winRate * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Profit Factor</span>
                    <span className="text-slate-200 font-semibold">
                      {signal.profitFactor.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sharpe Ratio</span>
                    <span className="text-slate-200 font-semibold">
                      {signal.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Drawdown</span>
                    <span className="text-rose-300 font-semibold">
                      {signal.maxDrawdown.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detailed View */}
      {selectedSignal && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-700/50 bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-200 capitalize mb-1">
                  {selectedSignal.signalType.replace(/_/g, ' ')} - Detailed Analysis
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedSignal.sampleSize} total trades • {selectedSignal.rating.confidence} confidence
                </p>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Extended metrics */}
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Expectancy</div>
              <div className="text-lg font-bold text-slate-200">
                {(selectedSignal.expectancy * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Avg Win</div>
              <div className="text-lg font-bold text-emerald-300">
                +{(selectedSignal.avgWin * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Avg Loss</div>
              <div className="text-lg font-bold text-rose-300">
                {(selectedSignal.avgLoss * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Sortino Ratio</div>
              <div className="text-lg font-bold text-slate-200">
                {selectedSignal.sortinoRatio.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Calmar Ratio</div>
              <div className="text-lg font-bold text-slate-200">
                {selectedSignal.calmarRatio.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Omega Ratio</div>
              <div className="text-lg font-bold text-slate-200">
                {selectedSignal.omegaRatio.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Bayesian Stats */}
          <div className="p-5 border-t border-slate-700/50">
            <div className="text-sm font-semibold text-slate-300 mb-3">Bayesian Win Probability</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-bold text-emerald-300">
                  {Math.round(selectedSignal.bayesian.mean * 100)}%
                </div>
                <div className="text-xs text-slate-400 mt-1">Expected Win Rate</div>
              </div>
              <div className="text-xs text-slate-400">
                95% Credible Interval: {Math.round(selectedSignal.bayesian.credibleInterval.lower * 100)}% - {Math.round(selectedSignal.bayesian.credibleInterval.upper * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
