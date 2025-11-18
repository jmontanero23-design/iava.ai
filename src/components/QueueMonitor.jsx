/**
 * Queue Monitor Component - Debug tool to monitor request queue
 */

import { useState, useEffect } from 'react'
import { getQueueStats, clearQueue } from '../services/alpacaQueue.js'

export default function QueueMonitor() {
  const [stats, setStats] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Update stats every 500ms
    const interval = setInterval(() => {
      const queueStats = getQueueStats()
      setStats(queueStats)

      // Auto-show if queue is backing up
      if (queueStats.queueLength > 5 || queueStats.rateLimitBackoff > 0) {
        setVisible(true)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-20 right-4 z-50 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:bg-slate-700 transition-all"
      >
        Queue Monitor
      </button>
    )
  }

  const getPriorityName = (priority) => {
    const names = ['CHART_PRIMARY', 'CHART_SECONDARY', 'PANEL_ANALYSIS', 'BATCH_REQUEST', 'LOW']
    return names[priority] || `Priority ${priority}`
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-200">Request Queue Monitor</h3>
        <button
          onClick={() => setVisible(false)}
          className="text-slate-400 hover:text-slate-200"
        >
          ×
        </button>
      </div>

      {stats && (
        <div className="space-y-3 text-xs">
          {/* Queue Length Indicator */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Queue Length</span>
              <span className={stats.queueLength > 10 ? 'text-rose-400 font-bold' : stats.queueLength > 5 ? 'text-amber-400' : 'text-emerald-400'}>
                {stats.queueLength}
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  stats.queueLength > 10 ? 'bg-rose-500' : stats.queueLength > 5 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, stats.queueLength * 5)}%` }}
              />
            </div>
          </div>

          {/* Active Requests */}
          <div className="flex justify-between">
            <span className="text-slate-400">Active Requests</span>
            <span className={`font-mono ${stats.activeRequests >= 2 ? 'text-amber-400' : 'text-slate-200'}`}>
              {stats.activeRequests}/2
            </span>
          </div>

          {/* Cache Stats */}
          <div className="flex justify-between">
            <span className="text-slate-400">Cache Size</span>
            <span className="text-slate-200">{stats.cacheSize}</span>
          </div>

          {/* Rate Limit Status */}
          {stats.rateLimitBackoff > 0 && (
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded">
              <div className="text-rose-400 font-bold mb-1">RATE LIMITED</div>
              <div className="text-rose-300">Backing off for {stats.rateLimitBackoff}s</div>
              <div className="text-rose-300 text-xs mt-1">Error count: {stats.errorCount}</div>
            </div>
          )}

          {/* Queue by Priority */}
          {stats.queueLength > 0 && stats.queueByPriority && (
            <div>
              <div className="text-slate-400 mb-1">Queue by Priority:</div>
              {Object.entries(stats.queueByPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between text-slate-300 ml-2">
                  <span className="text-xs">{getPriorityName(parseInt(priority))}</span>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-700">
            <button
              onClick={() => {
                const cleared = clearQueue()
                console.log(`Cleared ${cleared} requests from queue`)
              }}
              disabled={stats.queueLength === 0}
              className="w-full px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded transition-all text-xs font-semibold"
            >
              Clear Queue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}