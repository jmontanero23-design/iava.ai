import React, { useState, useEffect } from 'react'
import InfoPopover from './InfoPopover.jsx'
import { getLogs, clearLogs } from '../utils/tradeLogger.js'

export default function AnalyticsDashboard() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState(null)

  async function fetchLogs() {
    setLoading(true)
    try {
      const data = await getLogs({ limit: 200, type: filter === 'all' ? undefined : filter })
      setLogs(data.logs || [])

      const signals = data.logs.filter(l => l.type === 'signal')
      const orders = data.logs.filter(l => l.type === 'order')
      const pnls = data.logs.filter(l => l.type === 'pnl')
      const totalPnL = pnls.reduce((sum, l) => sum + (parseFloat(l.pnl) || 0), 0)
      const avgPnL = pnls.length ? totalPnL / pnls.length : 0
      const winners = pnls.filter(l => parseFloat(l.pnl) > 0).length
      const losers = pnls.filter(l => parseFloat(l.pnl) < 0).length
      const winRate = pnls.length ? (winners / pnls.length) * 100 : 0

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
      alert('✓ Logs cleared')
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Card */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              Analytics Dashboard
            </h3>
            <p className="text-xs text-slate-400">Track signals, orders, fills, and P/L performance</p>
          </div>
          <InfoPopover title="Trade Analytics">
            Tracks all signals, orders, fills, and P/L.
            <br/><br/>
            <strong>Data Types:</strong>
            <br/>• <strong>Signals</strong>: Unicorn Score triggers
            <br/>• <strong>Orders</strong>: Trade placements
            <br/>• <strong>Fills</strong>: Execution confirmations
            <br/>• <strong>P/L</strong>: Realized profit/loss
            <br/><br/>
            Use this data to optimize weights and refine strategy.
          </InfoPopover>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="select text-sm"
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
            className="btn btn-primary px-3 py-1.5"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Loading…
              </span>
            ) : 'Refresh'}
          </button>

          <button
            onClick={handleClear}
            className="btn btn-danger px-3 py-1.5"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-slate-500/20 to-slate-600/20">
                <span className="text-lg">📊</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Total Logs</div>
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
                <span className="text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Signals</div>
                <div className="stat-value text-emerald-400">{stats.signals}</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
                <span className="text-lg">📝</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Orders</div>
                <div className="stat-value text-cyan-400">{stats.orders}</div>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-violet-500/20 to-violet-600/20">
                <span className="text-lg">💰</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">P/L Count</div>
                <div className="stat-value">{stats.pnls}</div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {stats.pnls > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="stat-tile">
                <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
                  <span className="text-lg">Σ</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Total P/L</div>
                  <div className={`stat-value ${parseFloat(stats.totalPnL) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${stats.totalPnL}
                  </div>
                </div>
              </div>

              <div className="stat-tile">
                <div className="stat-icon bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                  <span className="text-lg">μ</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Avg P/L</div>
                  <div className={`stat-value ${parseFloat(stats.avgPnL) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${stats.avgPnL}
                  </div>
                </div>
              </div>

              <div className="stat-tile">
                <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
                  <span className="text-lg">%</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Win Rate</div>
                  <div className="stat-value text-violet-400">{stats.winRate}%</div>
                </div>
              </div>

              <div className="stat-tile">
                <div className="stat-icon bg-gradient-to-br from-slate-500/20 to-slate-600/20">
                  <span className="text-lg">±</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">W/L Ratio</div>
                  <div className="stat-value">{stats.winners}/{stats.losers}</div>
                </div>
              </div>
            </div>
          )}

          {/* Component Frequency */}
          {stats.componentCounts && Object.keys(stats.componentCounts).length > 0 && (
            <div className="card p-4 mb-4">
              <div className="panel-header mb-3">
                <span className="text-xs font-semibold text-slate-300">Component Frequency (in signals)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(stats.componentCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([comp, count]) => (
                    <div key={comp} className="tile p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{comp}</span>
                        <span className="text-emerald-400 font-mono font-semibold">{count}×</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          {logs.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-sm">No logs yet. Signals and orders will appear here.</div>
            </div>
          )}

          {logs.length > 0 && (
            <table className="w-full text-xs">
              <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-sm">
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold">Time</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Symbol</th>
                  <th className="text-right py-3 px-4 font-semibold">Score</th>
                  <th className="text-left py-3 px-4 font-semibold">Side</th>
                  <th className="text-right py-3 px-4 font-semibold">Qty</th>
                  <th className="text-right py-3 px-4 font-semibold">Entry</th>
                  <th className="text-right py-3 px-4 font-semibold">SL</th>
                  <th className="text-right py-3 px-4 font-semibold">TP</th>
                  <th className="text-right py-3 px-4 font-semibold">P/L</th>
                  <th className="text-left py-3 px-4 font-semibold">Notes</th>
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
                    <tr
                      key={idx}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className={`py-2.5 px-4 font-semibold whitespace-nowrap ${typeColors[log.type] || 'text-slate-300'}`}>
                        {log.type}
                      </td>
                      <td className="py-2.5 px-4 text-slate-200 font-mono">{log.symbol || '—'}</td>
                      <td className="py-2.5 px-4 text-right text-slate-300">
                        {log.score != null ? Math.round(log.score) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">{log.side || '—'}</td>
                      <td className="py-2.5 px-4 text-right text-slate-300">{log.qty || '—'}</td>
                      <td className="py-2.5 px-4 text-right text-slate-300">
                        {log.entry ? log.entry.toFixed(2) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-300">
                        {log.sl ? log.sl.toFixed(2) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-300">
                        {log.tp ? log.tp.toFixed(2) : '—'}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-semibold ${log.pnl ? (parseFloat(log.pnl) > 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`}>
                        {log.pnl ? `$${parseFloat(log.pnl).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-xs truncate max-w-xs">
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
  )
}
