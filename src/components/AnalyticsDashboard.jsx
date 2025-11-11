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
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">
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
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
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
            className="bg-violet-600 hover:bg-violet-500 rounded px-3 py-1 text-xs disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleClear}
            className="bg-rose-600 hover:bg-rose-500 rounded px-3 py-1 text-xs"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
            <div className="text-xs text-slate-400">Total Logs</div>
            <div className="text-xl font-bold text-slate-200">{stats.total}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
            <div className="text-xs text-slate-400">Signals</div>
            <div className="text-xl font-bold text-emerald-400">{stats.signals}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
            <div className="text-xs text-slate-400">Orders</div>
            <div className="text-xl font-bold text-cyan-400">{stats.orders}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
            <div className="text-xs text-slate-400">P/L Count</div>
            <div className="text-xl font-bold text-slate-200">{stats.pnls}</div>
          </div>
          {stats.pnls > 0 && (
            <>
              <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
                <div className="text-xs text-slate-400">Total P/L</div>
                <div className={`text-xl font-bold ${parseFloat(stats.totalPnL) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${stats.totalPnL}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
                <div className="text-xs text-slate-400">Avg P/L</div>
                <div className={`text-xl font-bold ${parseFloat(stats.avgPnL) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${stats.avgPnL}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
                <div className="text-xs text-slate-400">Win Rate</div>
                <div className="text-xl font-bold text-violet-400">{stats.winRate}%</div>
              </div>
              <div className="bg-slate-800/50 rounded p-3 border border-slate-700">
                <div className="text-xs text-slate-400">W/L Ratio</div>
                <div className="text-xl font-bold text-slate-200">{stats.winners}/{stats.losers}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Component Frequency */}
      {stats?.componentCounts && Object.keys(stats.componentCounts).length > 0 && (
        <div className="bg-slate-800/50 rounded p-3 border border-slate-700 mb-4">
          <div className="text-xs text-slate-400 mb-2">Component Frequency (in signals)</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {Object.entries(stats.componentCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([comp, count]) => (
                <div key={comp} className="flex justify-between">
                  <span className="text-slate-300">{comp}:</span>
                  <span className="text-emerald-400 font-mono">{count}x</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-slate-800/50 rounded border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          {logs.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No logs yet. Signals and orders will appear here.
            </div>
          )}
          {logs.length > 0 && (
            <table className="w-full text-xs">
              <thead className="bg-slate-900/50 sticky top-0">
                <tr className="text-slate-400">
                  <th className="text-left py-2 px-3">Time</th>
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-right py-2 px-3">Score</th>
                  <th className="text-left py-2 px-3">Side</th>
                  <th className="text-right py-2 px-3">Qty</th>
                  <th className="text-right py-2 px-3">Entry</th>
                  <th className="text-right py-2 px-3">SL</th>
                  <th className="text-right py-2 px-3">TP</th>
                  <th className="text-right py-2 px-3">P/L</th>
                  <th className="text-left py-2 px-3">Notes</th>
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
                    <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-2 px-3 text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className={`py-2 px-3 font-semibold ${typeColors[log.type] || 'text-slate-300'}`}>
                        {log.type}
                      </td>
                      <td className="py-2 px-3 text-slate-200">{log.symbol || '—'}</td>
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
                      <td className={`py-2 px-3 text-right font-semibold ${log.pnl ? (parseFloat(log.pnl) > 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`}>
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
  )
}
