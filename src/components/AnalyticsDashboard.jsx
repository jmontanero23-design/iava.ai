import React, { useState, useEffect } from 'react'
import InfoPopover from './InfoPopover.jsx'
import { getLogs, clearLogs } from '../utils/tradeLogger.js'

/**
 * Analytics Dashboard
 *
 * Displays logged signals, orders, and performance metrics.
 *
 * Blueprint: docs/implementation-plan.md (Analytics section)
 */
export default function AnalyticsDashboard() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')  // 'all', 'signal', 'order', 'fill', 'pnl'
  const [stats, setStats] = useState(null)

  async function fetchLogs() {
    setLoading(true)
    try {
      const data = await getLogs({ limit: 200, type: filter === 'all' ? undefined : filter })
      setLogs(data.logs || [])

      // Calculate stats
      const signals = data.logs.filter(l => l.type === 'signal')
      const orders = data.logs.filter(l => l.type === 'order')
      const pnls = data.logs.filter(l => l.type === 'pnl')
      const totalPnL = pnls.reduce((sum, l) => sum + (parseFloat(l.pnl) || 0), 0)
      const avgPnL = pnls.length ? totalPnL / pnls.length : 0
      const winners = pnls.filter(l => parseFloat(l.pnl) > 0).length
      const losers = pnls.filter(l => parseFloat(l.pnl) < 0).length
      const winRate = pnls.length ? (winners / pnls.length) * 100 : 0

      // Component performance (from signals)
      const componentCounts = {}
      signals.forEach(sig => {
        if (sig.components) {
          Object.entries(sig.components).forEach(([comp, score]) => {
            if (score > 0) {
              if (!componentCounts[comp]) componentCounts[comp] = 0
              componentCounts[comp]++
            }
          })
        }
      })

      setStats({
        total: data.total,
        signals: signals.length,
        orders: orders.length,
        pnls: pnls.length,
        totalPnL: totalPnL.toFixed(2),
        avgPnL: avgPnL.toFixed(2),
        winRate: winRate.toFixed(1),
        winners,
        losers,
        componentCounts,
      })
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filter])  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleClear() {
    if (!window.confirm('Clear all logs? This cannot be undone.')) return
    const success = await clearLogs()
    if (success) {
      setLogs([])
      setStats(null)
      alert('Logs cleared')
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Icon with glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-50 animate-pulse" />
                <span className="relative text-2xl filter drop-shadow-lg">📊</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-300 bg-clip-text text-transparent inline-flex items-center gap-2">
                Analytics Dashboard
                <InfoPopover title="Trade Analytics">
                  Tracks all signals, orders, fills, and P/L.
                  <br/>• <strong>Signals</strong>: Unicorn Score triggers
                  <br/>• <strong>Orders</strong>: Trade placements
                  <br/>• <strong>P/L</strong>: Realized profit/loss
                  <br/><br/>
                  Use this data to optimize weights and refine strategy.
                </InfoPopover>
              </h3>
            </div>
          </div>

          {/* Premium Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="select bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            >
              <option value="all">All Types</option>
              <option value="signal">Signals</option>
              <option value="order">Orders</option>
              <option value="fill">Fills</option>
              <option value="pnl">P/L</option>
            </select>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <span className="relative text-white flex items-center gap-1.5">
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Loading...
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    Refresh
                  </>
                )}
              </span>
            </button>

            <button
              onClick={handleClear}
              className="relative group px-4 py-2 rounded-lg text-xs font-bold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 group-hover:from-rose-500 group-hover:to-pink-500 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <span className="relative text-white flex items-center gap-1.5">
                <span>🗑️</span>
                Clear All
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Premium Content */}
      <div className="p-5 space-y-4">
        {/* Premium Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
              <div className="relative p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                <div className="text-xs text-slate-400 font-medium mb-1">Total Logs</div>
                <div className="text-xl font-bold text-slate-200">{stats.total}</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
              <div className="relative p-3 bg-slate-800/30 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                <div className="text-xs text-slate-400 font-medium mb-1">Signals</div>
                <div className="text-xl font-bold text-emerald-400">{stats.signals}</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
              <div className="relative p-3 bg-slate-800/30 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
                <div className="text-xs text-slate-400 font-medium mb-1">Orders</div>
                <div className="text-xl font-bold text-cyan-400">{stats.orders}</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-purple-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
              <div className="relative p-3 bg-slate-800/30 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all">
                <div className="text-xs text-slate-400 font-medium mb-1">P/L Count</div>
                <div className="text-xl font-bold text-slate-200">{stats.pnls}</div>
              </div>
            </div>

            {stats.pnls > 0 && (
              <>
                <div className="relative group">
                  <div className={`absolute inset-0 ${parseFloat(stats.totalPnL) > 0 ? 'bg-emerald-600' : 'bg-rose-600'} blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity`} />
                  <div className={`relative p-3 bg-slate-800/30 rounded-lg border ${parseFloat(stats.totalPnL) > 0 ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-rose-500/30 hover:border-rose-500/50'} transition-all`}>
                    <div className="text-xs text-slate-400 font-medium mb-1">Total P/L</div>
                    <div className={`text-xl font-bold ${parseFloat(stats.totalPnL) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${stats.totalPnL}
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className={`absolute inset-0 ${parseFloat(stats.avgPnL) > 0 ? 'bg-emerald-600' : 'bg-rose-600'} blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity`} />
                  <div className={`relative p-3 bg-slate-800/30 rounded-lg border ${parseFloat(stats.avgPnL) > 0 ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-rose-500/30 hover:border-rose-500/50'} transition-all`}>
                    <div className="text-xs text-slate-400 font-medium mb-1">Avg P/L</div>
                    <div className={`text-xl font-bold ${parseFloat(stats.avgPnL) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${stats.avgPnL}
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-violet-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                  <div className="relative p-3 bg-slate-800/30 rounded-lg border border-violet-500/30 hover:border-violet-500/50 transition-all">
                    <div className="text-xs text-slate-400 font-medium mb-1">Win Rate</div>
                    <div className="text-xl font-bold text-violet-400">{stats.winRate}%</div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                  <div className="relative p-3 bg-slate-800/30 rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 transition-all">
                    <div className="text-xs text-slate-400 font-medium mb-1">W/L Ratio</div>
                    <div className="text-xl font-bold text-slate-200">{stats.winners}/{stats.losers}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Premium Component Frequency */}
        {stats?.componentCounts && Object.keys(stats.componentCounts).length > 0 && (
          <div className="p-4 bg-slate-800/30 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <div className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Component Frequency (in signals)</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(stats.componentCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([comp, count]) => (
                  <div key={comp} className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-purple-500/30 transition-all">
                    <span className="text-xs text-slate-300 font-medium">{comp}</span>
                    <span className="text-xs text-purple-400 font-bold font-mono">{count}x</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Premium Logs Table */}
        <div className="bg-slate-800/30 rounded-xl border border-indigo-500/20 overflow-hidden">
          <div className="p-3 bg-slate-800/50 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Trade Logs</div>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            {logs.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-400 text-sm">
                <div className="text-3xl mb-2">📭</div>
                No logs yet. Signals and orders will appear here.
              </div>
            )}
            {logs.length > 0 && (
              <table className="w-full text-xs">
                <thead className="bg-slate-900/50 sticky top-0 backdrop-blur-sm">
                  <tr className="text-slate-400 border-b border-slate-700/30">
                    <th className="text-left py-3 px-3 font-semibold">Time</th>
                    <th className="text-left py-3 px-3 font-semibold">Type</th>
                    <th className="text-left py-3 px-3 font-semibold">Symbol</th>
                    <th className="text-right py-3 px-3 font-semibold">Score</th>
                    <th className="text-left py-3 px-3 font-semibold">Side</th>
                    <th className="text-right py-3 px-3 font-semibold">Qty</th>
                    <th className="text-right py-3 px-3 font-semibold">Entry</th>
                    <th className="text-right py-3 px-3 font-semibold">SL</th>
                    <th className="text-right py-3 px-3 font-semibold">TP</th>
                    <th className="text-right py-3 px-3 font-semibold">P/L</th>
                    <th className="text-left py-3 px-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => {
                    const typeColors = {
                      signal: 'text-emerald-400',
                      order: 'text-cyan-400',
                      fill: 'text-violet-400',
                      pnl: parseFloat(log.pnl) > 0 ? 'text-emerald-400' : 'text-rose-400',
                      decision: 'text-amber-400',
                    }
                    return (
                      <tr key={idx} className="border-t border-slate-700/30 hover:bg-indigo-900/10 transition-colors">
                        <td className="py-2 px-3 text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className={`py-2 px-3 font-semibold ${typeColors[log.type] || 'text-slate-300'}`}>
                          {log.type}
                        </td>
                        <td className="py-2 px-3 text-slate-200 font-medium">{log.symbol || '—'}</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {log.score != null ? Math.round(log.score) : '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-300">{log.side || '—'}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{log.qty || '—'}</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {log.entry ? log.entry.toFixed(2) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {log.sl ? log.sl.toFixed(2) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {log.tp ? log.tp.toFixed(2) : '—'}
                        </td>
                        <td className={`py-2 px-3 text-right font-semibold ${log.pnl ? (parseFloat(log.pnl) > 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
                          {log.pnl ? `$${parseFloat(log.pnl).toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-xs truncate max-w-xs">
                          {log.notes || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
