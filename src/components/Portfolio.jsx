import React, { useState, useEffect } from 'react'
import TradeJournalAIPanel from './TradeJournalAIPanel.jsx'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

/**
 * Portfolio View - Positions, P&L, and Journal
 * Consolidated portfolio management center
 */
export default function Portfolio() {
  const [activeView, setActiveView] = useState('positions')
  const [positions, setPositions] = useState([])
  const [orderHistory, setOrderHistory] = useState([])
  const [accountInfo, setAccountInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const { marketData } = useMarketData()

  // Fetch positions from Alpaca
  useEffect(() => {
    fetchPositions()
    fetchAccountInfo()
  }, [])

  // Fetch order history when switching to history tab
  useEffect(() => {
    if (activeView === 'history' && orderHistory.length === 0) {
      fetchOrderHistory()
    }
  }, [activeView])

  const fetchPositions = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/positions')
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setPositions(data.positions || [])
    } catch (error) {
      console.error('Error fetching positions:', error)
      setPositions([]) // Reset to empty array on error
      // Show error toast
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Failed to load positions. Please try again.', type: 'error' }
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAccountInfo = async () => {
    try {
      const res = await fetch('/api/account')
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setAccountInfo(data)
    } catch (error) {
      console.error('Error fetching account:', error)
      setAccountInfo(null)
    }
  }

  const fetchOrderHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/alpaca/orders?status=closed&nested=true')
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setOrderHistory(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching order history:', error)
      setOrderHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalPL = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl || 0), 0)
  const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.market_value || 0), 0)

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="glass-panel p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Portfolio Value</div>
            <div className="text-2xl font-bold text-slate-200">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Unrealized P&L</div>
            <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPL >= 0 ? '+' : ''}{totalPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Buying Power</div>
            <div className="text-2xl font-bold text-slate-200">
              ${accountInfo ? parseFloat(accountInfo.buying_power || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Open Positions</div>
            <div className="text-2xl font-bold text-slate-200">{positions.length}</div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="glass-panel p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('positions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'positions'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40'
            }`}
          >
            📊 Positions
          </button>
          <button
            onClick={() => setActiveView('journal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'journal'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40'
            }`}
          >
            📓 Journal
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'history'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40'
            }`}
          >
            📈 History
          </button>
          <button
            onClick={fetchPositions}
            className="ml-auto px-3 py-2 bg-slate-700/40 hover:bg-slate-600/50 rounded-lg text-sm text-slate-300 transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="glass-panel p-4 min-h-[500px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Loading...</div>
          </div>
        ) : (
          <>
            {activeView === 'positions' && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-slate-200 mb-3">Open Positions</h3>
                {positions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No open positions. Start trading to see your portfolio here.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {positions.map((position) => {
                      const pl = parseFloat(position.unrealized_pl || 0)
                      const plPercent = parseFloat(position.unrealized_plpc || 0) * 100

                      return (
                        <div key={position.asset_id} className="glass-panel p-4 hover:bg-slate-700/20 transition-all">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-slate-200">{position.symbol}</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  position.side === 'long'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {position.side?.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-sm text-slate-500 mt-1">
                                {position.qty} shares @ ${parseFloat(position.avg_entry_price || 0).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {pl >= 0 ? '+' : ''}${Math.abs(pl).toFixed(2)}
                              </div>
                              <div className={`text-sm ${pl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-700/50 text-sm">
                            <div>
                              <span className="text-slate-500">Current:</span>
                              <span className="ml-2 text-slate-300">${parseFloat(position.current_price || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Value:</span>
                              <span className="ml-2 text-slate-300">${parseFloat(position.market_value || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Day P&L:</span>
                              <span className={`ml-2 ${parseFloat(position.change_today || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ${parseFloat(position.change_today || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('iava.loadSymbol', {
                                  detail: { symbol: position.symbol }
                                }))
                              }}
                              className="px-3 py-1.5 bg-slate-700/40 hover:bg-slate-600/50 rounded text-xs text-slate-300 transition-all"
                            >
                              View Chart
                            </button>
                            <button className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-xs transition-all">
                              Add More
                            </button>
                            <button className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded text-xs transition-all">
                              Close Position
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeView === 'journal' && (
              <TradeJournalAIPanel />
            )}

            {activeView === 'history' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-slate-200">Order History</h3>
                  <button
                    onClick={fetchOrderHistory}
                    disabled={historyLoading}
                    className="px-3 py-1.5 bg-slate-700/40 hover:bg-slate-600/50 rounded-lg text-sm text-slate-300 transition-all disabled:opacity-50"
                  >
                    {historyLoading ? 'Loading...' : '🔄 Refresh'}
                  </button>
                </div>

                {historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-slate-500">Loading order history...</div>
                  </div>
                ) : orderHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No order history found. Completed orders will appear here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50 text-left">
                          <th className="pb-3 text-slate-500 font-medium">Symbol</th>
                          <th className="pb-3 text-slate-500 font-medium">Side</th>
                          <th className="pb-3 text-slate-500 font-medium">Qty</th>
                          <th className="pb-3 text-slate-500 font-medium">Price</th>
                          <th className="pb-3 text-slate-500 font-medium">Status</th>
                          <th className="pb-3 text-slate-500 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderHistory.map((order) => {
                          const filledQty = parseFloat(order.filled_qty || 0)
                          const filledPrice = parseFloat(order.filled_avg_price || 0)
                          const isBuy = order.side === 'buy'

                          return (
                            <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="py-3">
                                <button
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('iava.loadSymbol', {
                                      detail: { symbol: order.symbol }
                                    }))
                                  }}
                                  className="font-medium text-slate-200 hover:text-amber-400 transition-colors"
                                >
                                  {order.symbol}
                                </button>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  isBuy
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {order.side?.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 text-slate-300">
                                {filledQty > 0 ? filledQty : order.qty}
                              </td>
                              <td className="py-3 text-slate-300">
                                {filledPrice > 0 ? `$${filledPrice.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  order.status === 'filled'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : order.status === 'canceled'
                                    ? 'bg-slate-500/20 text-slate-400'
                                    : order.status === 'expired'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {order.status?.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 text-slate-400 text-xs">
                                {formatDate(order.filled_at || order.canceled_at || order.expired_at || order.submitted_at)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}