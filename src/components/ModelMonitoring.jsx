/**
 * AI Model Monitoring Dashboard
 * Track latency, cost, accuracy, and performance of AI models
 */

import { useState, useEffect } from 'react'
import { getGatewayMetrics } from '../utils/aiGateway.js'

export default function ModelMonitoring() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const data = await getGatewayMetrics()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchMetrics, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [autoRefresh])

  if (loading || !metrics) {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="text-slate-400">Loading metrics...</div>
      </div>
    )
  }

  const modelStats = Object.entries(metrics.byModel || {}).map(([model, stats]) => ({
    model,
    ...stats,
    avgLatency: stats.requests > 0 ? stats.latency / stats.requests : 0,
    errorRate: stats.requests > 0 ? stats.errors / stats.requests : 0
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-200">AI Model Monitoring</h2>
            <p className="text-slate-400 text-sm mt-1">
              Real-time performance metrics and cost tracking
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {autoRefresh ? '● Live' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchMetrics}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-800/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Total Requests</div>
            <div className="text-2xl font-bold text-slate-200">{metrics.requests}</div>
            <div className="text-xs text-emerald-400 mt-1">
              {metrics.errors} errors ({((metrics.errors / metrics.requests) * 100 || 0).toFixed(1)}%)
            </div>
          </div>

          <div className="p-4 bg-slate-800/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Cache Performance</div>
            <div className="text-2xl font-bold text-cyan-400">
              {((metrics.cacheHitRate || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {metrics.cacheHits} hits / {metrics.cacheMisses} misses
            </div>
          </div>

          <div className="p-4 bg-slate-800/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Avg Latency</div>
            <div className="text-2xl font-bold text-blue-400">
              {(metrics.avgLatency || 0).toFixed(0)}ms
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Response time
            </div>
          </div>

          <div className="p-4 bg-slate-800/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Total Cost</div>
            <div className="text-2xl font-bold text-yellow-400">
              ${(metrics.totalCost || 0).toFixed(4)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              ${((metrics.totalCost || 0) / Math.max(1, metrics.requests) * 1000).toFixed(4)} per 1K req
            </div>
          </div>
        </div>
      </div>

      {/* Per-Model Stats */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Per-Model Performance</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs text-slate-400 font-medium py-3 px-4">Model</th>
                <th className="text-right text-xs text-slate-400 font-medium py-3 px-4">Requests</th>
                <th className="text-right text-xs text-slate-400 font-medium py-3 px-4">Errors</th>
                <th className="text-right text-xs text-slate-400 font-medium py-3 px-4">Error Rate</th>
                <th className="text-right text-xs text-slate-400 font-medium py-3 px-4">Avg Latency</th>
                <th className="text-right text-xs text-slate-400 font-medium py-3 px-4">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {modelStats.map((stats) => (
                <tr key={stats.model} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm text-slate-200">{stats.model}</div>
                  </td>
                  <td className="text-right py-3 px-4 text-slate-300">
                    {stats.requests}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={stats.errors > 0 ? 'text-rose-400' : 'text-slate-500'}>
                      {stats.errors}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={stats.errorRate > 0.05 ? 'text-rose-400' : 'text-emerald-400'}>
                      {(stats.errorRate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={stats.avgLatency > 1000 ? 'text-yellow-400' : 'text-cyan-400'}>
                      {stats.avgLatency.toFixed(0)}ms
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-yellow-400">
                    ${stats.cost.toFixed(4)}
                  </td>
                </tr>
              ))}

              {modelStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No model data yet. Start using AI features to see metrics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Insights & Recommendations</h3>

        <div className="space-y-3">
          {metrics.cacheHitRate > 0.7 && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-300">
              ✓ Excellent cache performance ({(metrics.cacheHitRate * 100).toFixed(0)}%) - significant cost savings
            </div>
          )}

          {metrics.cacheHitRate < 0.3 && metrics.requests > 10 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-300">
              ⚠ Low cache hit rate - consider increasing TTL for frequently accessed data
            </div>
          )}

          {metrics.avgLatency > 2000 && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm text-orange-300">
              ⚠ High average latency ({metrics.avgLatency.toFixed(0)}ms) - consider using faster models or streaming
            </div>
          )}

          {metrics.errors / metrics.requests > 0.05 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-300">
              ✕ High error rate ({((metrics.errors / metrics.requests) * 100).toFixed(1)}%) - check API keys and rate limits
            </div>
          )}

          {metrics.requests === 0 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
              ℹ No AI requests yet. Try using features like Signal Quality Scorer or AI Chat to start tracking metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
