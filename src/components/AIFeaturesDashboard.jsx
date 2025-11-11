/**
 * AI Features Dashboard
 * Central hub for accessing all AI capabilities
 */

import { useState } from 'react'
import { getGatewayMetrics } from '../utils/aiGateway.js'

export default function AIFeaturesDashboard({ onFeatureSelect }) {
  const [metrics, setMetrics] = useState(null)
  const [showMetrics, setShowMetrics] = useState(false)

  const loadMetrics = async () => {
    const data = await getGatewayMetrics()
    setMetrics(data)
    setShowMetrics(true)
  }

  const features = [
    {
      id: 'signal_quality',
      name: 'Signal Quality Scorer',
      description: 'Historical performance ratings for signal types',
      icon: '📊',
      color: 'emerald',
      status: 'active'
    },
    {
      id: 'predictive_confidence',
      name: 'Predictive Confidence',
      description: 'ML probability model for trade success',
      icon: '🎯',
      color: 'cyan',
      status: 'active'
    },
    {
      id: 'market_regime',
      name: 'Market Regime Detector',
      description: 'Real-time market condition classification',
      icon: '🌡️',
      color: 'blue',
      status: 'active'
    },
    {
      id: 'smart_watchlist',
      name: 'Smart Watchlist',
      description: 'AI symbol recommendations',
      icon: '⭐',
      color: 'indigo',
      status: 'active'
    },
    {
      id: 'risk_advisor',
      name: 'Risk Advisor',
      description: 'Portfolio risk analysis and alerts',
      icon: '⚖️',
      color: 'yellow',
      status: 'active'
    },
    {
      id: 'anomaly_detector',
      name: 'Anomaly Detector',
      description: 'Unusual market condition alerts',
      icon: '🔍',
      color: 'orange',
      status: 'active'
    },
    {
      id: 'multi_timeframe',
      name: 'Multi-Timeframe Analyst',
      description: '3-timeframe signal synthesis',
      icon: '⏱️',
      color: 'purple',
      status: 'active'
    },
    {
      id: 'nlp_scanner',
      name: 'Natural Language Scanner',
      description: 'Query markets in plain English',
      icon: '💬',
      color: 'pink',
      status: 'active'
    },
    {
      id: 'trade_journal',
      name: 'Trade Journal AI',
      description: 'Post-trade analysis and learning',
      icon: '📝',
      color: 'teal',
      status: 'active'
    },
    {
      id: 'ai_chat',
      name: 'AI Chat Assistant',
      description: 'Conversational trading insights',
      icon: '🤖',
      color: 'violet',
      status: 'active'
    },
    {
      id: 'personalized_learning',
      name: 'Personalized Learning',
      description: 'Adaptive education system',
      icon: '🎓',
      color: 'amber',
      status: 'active'
    },
    {
      id: 'genetic_optimizer',
      name: 'Genetic Optimizer',
      description: 'Evolutionary strategy tuning',
      icon: '🧬',
      color: 'lime',
      status: 'active'
    }
  ]

  const colorStyles = {
    emerald: 'from-emerald-600/20 to-transparent border-emerald-500/30',
    cyan: 'from-cyan-600/20 to-transparent border-cyan-500/30',
    blue: 'from-blue-600/20 to-transparent border-blue-500/30',
    indigo: 'from-indigo-600/20 to-transparent border-indigo-500/30',
    purple: 'from-purple-600/20 to-transparent border-purple-500/30',
    pink: 'from-pink-600/20 to-transparent border-pink-500/30',
    yellow: 'from-yellow-600/20 to-transparent border-yellow-500/30',
    orange: 'from-orange-600/20 to-transparent border-orange-500/30',
    teal: 'from-teal-600/20 to-transparent border-teal-500/30',
    violet: 'from-violet-600/20 to-transparent border-violet-500/30',
    amber: 'from-amber-600/20 to-transparent border-amber-500/30',
    lime: 'from-lime-600/20 to-transparent border-lime-500/30'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-200 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
              AI Features
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {features.filter(f => f.status === 'active').length} active AI capabilities
            </p>
          </div>
          <button
            onClick={loadMetrics}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {showMetrics ? 'Refresh' : 'View'} Metrics
          </button>
        </div>

        {/* Metrics Panel */}
        {showMetrics && metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-800/30 rounded-lg">
            <div>
              <div className="text-xs text-slate-400">Total Requests</div>
              <div className="text-xl font-bold text-slate-200">{metrics.requests || 0}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Cache Hit Rate</div>
              <div className="text-xl font-bold text-emerald-400">
                {((metrics.cacheHitRate || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Avg Latency</div>
              <div className="text-xl font-bold text-cyan-400">
                {(metrics.avgLatency || 0).toFixed(0)}ms
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Cost</div>
              <div className="text-xl font-bold text-yellow-400">
                ${(metrics.totalCost || 0).toFixed(4)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => onFeatureSelect?.(feature.id)}
            className={`p-4 bg-gradient-to-br ${colorStyles[feature.color]} border backdrop-blur-sm rounded-lg text-left transition-all hover:scale-105 hover:shadow-lg`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{feature.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-200 mb-1">
                  {feature.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                    feature.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      feature.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`} />
                    {feature.status}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
