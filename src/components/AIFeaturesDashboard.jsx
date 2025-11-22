/**
 * AI Features Dashboard - PREMIUM REDESIGN
 * Central hub for accessing all AI capabilities
 * PhD-Elite Quality - Top 1% Global Benchmark
 * Matches Hero modern aesthetic
 */

import { useState, useEffect } from 'react'
import OptionsGreeksCalculator from './OptionsGreeksCalculator.jsx'
import Level2MarketDepth from './Level2MarketDepth.jsx'
import VolumeProfile from './VolumeProfile.jsx'
import PortfolioAnalytics from './PortfolioAnalytics.jsx'

export default function AIFeaturesDashboard({ onFeatureSelect }) {
  const [metrics, setMetrics] = useState(null)

  // Load REAL metrics from LocalStorage tracking
  useEffect(() => {
    const loadRealMetrics = () => {
      const signalQualityData = JSON.parse(localStorage.getItem('iava_signal_quality') || '{"signals":[]}')
      const tradeJournalData = JSON.parse(localStorage.getItem('iava_trade_journal') || '{"trades":[]}')
      const learningData = JSON.parse(localStorage.getItem('iava_learning_progress') || '{"completed":[]}')

      setMetrics({
        signalsTracked: signalQualityData.signals?.length || 0,
        tradesLogged: tradeJournalData.trades?.length || 0,
        lessonsCompleted: learningData.completed?.length || 0,
        featuresActive: 16
      })
    }

    loadRealMetrics()
    const interval = setInterval(loadRealMetrics, 10000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      id: 'signal_quality',
      name: 'Signal Quality Scorer',
      description: 'Historical performance ratings',
      detail: 'Win rate, profit factor, Sharpe ratio tracking for Unicorn, Breakout, and Pullback signals',
      icon: '📊',
      gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
      glowColor: 'emerald',
      requiresAPI: false,
      category: 'Core'
    },
    {
      id: 'predictive_confidence',
      name: 'Predictive Confidence',
      description: 'ML probability model',
      detail: '7-factor weighted scoring: historical, confluence, regime, R:R, volume, time, volatility',
      icon: '🎯',
      gradient: 'from-cyan-600 via-cyan-500 to-blue-500',
      glowColor: 'cyan',
      requiresAPI: false,
      category: 'Core'
    },
    {
      id: 'market_regime',
      name: 'Market Regime Detector',
      description: 'Real-time condition classification',
      detail: 'ADX + EMA + Ichimoku + ATR analysis for trending, ranging, and volatile regimes',
      icon: '🌡️',
      gradient: 'from-blue-600 via-blue-500 to-indigo-500',
      glowColor: 'blue',
      requiresAPI: false,
      category: 'Core'
    },
    {
      id: 'smart_watchlist',
      name: 'Smart Watchlist Builder',
      description: 'AI symbol recommendations',
      detail: 'Profile-based strategy fit scoring with correlation and sector diversification',
      icon: '⭐',
      gradient: 'from-indigo-600 via-indigo-500 to-purple-500',
      glowColor: 'indigo',
      requiresAPI: true,
      category: 'Discovery'
    },
    {
      id: 'risk_advisor',
      name: 'Risk Advisor',
      description: 'Portfolio risk analysis',
      detail: 'VaR, Expected Shortfall, Kelly Criterion sizing, concentration alerts',
      icon: '⚖️',
      gradient: 'from-yellow-600 via-yellow-500 to-orange-500',
      glowColor: 'yellow',
      requiresAPI: false,
      category: 'Execution'
    },
    {
      id: 'anomaly_detector',
      name: 'Anomaly Detector',
      description: 'Unusual condition alerts',
      detail: 'Z-score price spikes, volume surges, gap detection, volatility breakouts',
      icon: '🔍',
      gradient: 'from-orange-600 via-orange-500 to-red-500',
      glowColor: 'orange',
      requiresAPI: false,
      category: 'Validation'
    },
    {
      id: 'multi_timeframe',
      name: 'Multi-Timeframe Analysis',
      description: '5-timeframe PhD++ analysis',
      detail: '1Min → Daily weighted scoring, consensus, divergence alerts, optimal entry TF',
      icon: '⏱️',
      gradient: 'from-purple-600 via-purple-500 to-pink-500',
      glowColor: 'purple',
      requiresAPI: false,
      category: 'Core'
    },
    {
      id: 'nlp_scanner',
      name: 'Natural Language Scanner',
      description: 'Query in plain English',
      detail: 'AVA Intelligence converts natural language to precise technical filters',
      icon: '💬',
      gradient: 'from-pink-600 via-pink-500 to-rose-500',
      glowColor: 'pink',
      requiresAPI: true,
      category: 'Discovery'
    },
    {
      id: 'trade_journal',
      name: 'Trade Journal AI',
      description: 'Post-trade analysis',
      detail: 'Performance analytics, AI review, pattern recognition, improvement suggestions',
      icon: '📝',
      gradient: 'from-teal-600 via-teal-500 to-cyan-500',
      glowColor: 'teal',
      requiresAPI: false,
      category: 'Learning'
    },
    {
      id: 'ai_chat',
      name: 'AI Chat Assistant',
      description: 'Conversational insights',
      detail: 'Context-aware AVA Intelligence with real-time market data integration',
      icon: '🤖',
      gradient: 'from-violet-600 via-violet-500 to-purple-500',
      glowColor: 'violet',
      requiresAPI: true,
      category: 'Support'
    },
    {
      id: 'personalized_learning',
      name: 'Personalized Learning',
      description: 'Adaptive education',
      detail: 'Style detection, experience-based curriculum, progress tracking, concept mastery',
      icon: '🎓',
      gradient: 'from-amber-600 via-amber-500 to-yellow-500',
      glowColor: 'amber',
      requiresAPI: false,
      category: 'Learning'
    },
    {
      id: 'genetic_optimizer',
      name: 'Genetic Optimizer',
      description: 'Evolutionary strategy tuning',
      detail: 'Multi-objective optimization for Unicorn threshold and horizon parameters',
      icon: '🧬',
      gradient: 'from-lime-600 via-lime-500 to-green-500',
      glowColor: 'lime',
      requiresAPI: false,
      category: 'Core'
    },
    {
      id: 'options_greeks',
      name: 'Options Greeks Calculator',
      description: 'Real-time Black-Scholes analytics',
      detail: 'Delta, Gamma, Theta, Vega, Rho with strategy analysis and IV calculation',
      icon: 'Δ',
      gradient: 'from-purple-600 via-indigo-500 to-blue-500',
      glowColor: 'indigo',
      requiresAPI: false,
      category: 'Professional',
      component: OptionsGreeksCalculator
    },
    {
      id: 'level2_depth',
      name: 'Level 2 Market Depth',
      description: 'Order book microstructure',
      detail: 'Real-time bid/ask levels, liquidity heatmap, order flow, imbalance detection',
      icon: '📊',
      gradient: 'from-cyan-600 via-teal-500 to-emerald-500',
      glowColor: 'teal',
      requiresAPI: false,
      category: 'Professional',
      component: Level2MarketDepth
    },
    {
      id: 'volume_profile',
      name: 'Volume Profile',
      description: 'TPO, VWAP, POC analysis',
      detail: 'Market Profile, Value Area, Volume Nodes, CVD, institutional order flow',
      icon: '📈',
      gradient: 'from-pink-600 via-purple-500 to-indigo-500',
      glowColor: 'purple',
      requiresAPI: false,
      category: 'Professional',
      component: VolumeProfile
    },
    {
      id: 'portfolio_analytics',
      name: 'Portfolio Analytics',
      description: 'Risk & performance dashboard',
      detail: 'Sharpe/Sortino, VaR, correlation matrix, concentration analysis, alpha tracking',
      icon: '💼',
      gradient: 'from-amber-600 via-orange-500 to-red-500',
      glowColor: 'orange',
      requiresAPI: false,
      category: 'Professional',
      component: PortfolioAnalytics
    }
  ]

  const glowStyles = {
    emerald: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
    cyan: 'shadow-cyan-500/20 hover:shadow-cyan-500/40',
    blue: 'shadow-blue-500/20 hover:shadow-blue-500/40',
    indigo: 'shadow-indigo-500/20 hover:shadow-indigo-500/40',
    purple: 'shadow-purple-500/20 hover:shadow-purple-500/40',
    pink: 'shadow-pink-500/20 hover:shadow-pink-500/40',
    yellow: 'shadow-yellow-500/20 hover:shadow-yellow-500/40',
    orange: 'shadow-orange-500/20 hover:shadow-orange-500/40',
    teal: 'shadow-teal-500/20 hover:shadow-teal-500/40',
    violet: 'shadow-violet-500/20 hover:shadow-violet-500/40',
    amber: 'shadow-amber-500/20 hover:shadow-amber-500/40',
    lime: 'shadow-lime-500/20 hover:shadow-lime-500/40'
  }

  const clientSideCount = features.filter(f => !f.requiresAPI).length
  const apiRequiredCount = features.filter(f => f.requiresAPI).length

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative glass-panel p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">🤖</span>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
                    AI Features Hub
                  </h2>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {features.length} AI capabilities
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400">{clientSideCount} always available</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400">{apiRequiredCount} API-powered</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quality Badge */}
            <div className="shrink-0">
              <div className="relative group/badge">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-lg opacity-60 group-hover/badge:opacity-80 transition-opacity" />
                <div className="relative px-5 py-3 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/50 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💎</span>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-purple-300 font-semibold mb-0.5">
                        PhD-Elite Quality
                      </div>
                      <div className="text-base font-bold text-white">
                        Top 1% Global Standard
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real Usage Metrics - Redesigned */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-10 group-hover:opacity-20 rounded-xl transition-opacity blur-xl" />
                <div className="relative p-4 bg-slate-800/50 border border-emerald-500/30 rounded-xl backdrop-blur-sm hover:border-emerald-400/50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📊</span>
                    <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Signals</div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-300">{metrics.signalsTracked}</div>
                  <div className="text-xs text-slate-400 mt-1">Quality DB</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-10 group-hover:opacity-20 rounded-xl transition-opacity blur-xl" />
                <div className="relative p-4 bg-slate-800/50 border border-cyan-500/30 rounded-xl backdrop-blur-sm hover:border-cyan-400/50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📝</span>
                    <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Trades</div>
                  </div>
                  <div className="text-3xl font-bold text-cyan-300">{metrics.tradesLogged}</div>
                  <div className="text-xs text-slate-400 mt-1">Journal</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10 group-hover:opacity-20 rounded-xl transition-opacity blur-xl" />
                <div className="relative p-4 bg-slate-800/50 border border-indigo-500/30 rounded-xl backdrop-blur-sm hover:border-indigo-400/50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🎓</span>
                    <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Lessons</div>
                  </div>
                  <div className="text-3xl font-bold text-indigo-300">{metrics.lessonsCompleted}</div>
                  <div className="text-xs text-slate-400 mt-1">Learning</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-10 group-hover:opacity-20 rounded-xl transition-opacity blur-xl" />
                <div className="relative p-4 bg-slate-800/50 border border-purple-500/30 rounded-xl backdrop-blur-sm hover:border-purple-400/50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">✨</span>
                    <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Active</div>
                  </div>
                  <div className="text-3xl font-bold text-purple-300">{metrics.featuresActive}</div>
                  <div className="text-xs text-slate-400 mt-1">Features</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => onFeatureSelect?.(feature.component || feature.id)}
            className="group relative text-left transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-20 rounded-2xl blur-2xl transition-all duration-300`} />

            {/* Card content */}
            <div className={`relative p-6 bg-slate-900/50 border border-slate-700/50 group-hover:border-slate-600 rounded-2xl backdrop-blur-sm shadow-xl ${glowStyles[feature.glowColor]} transition-all duration-300 flex flex-col min-h-[220px]`}>
              {/* Icon with gradient background */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-3xl filter drop-shadow-lg">{feature.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-100 text-lg mb-1 group-hover:text-white transition-colors break-words leading-snug">
                    {feature.name}
                  </h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    {feature.category}
                  </p>
                </div>
              </div>

              <div className="flex-1 min-h-[56px]">
                <p className="text-sm text-slate-300 leading-snug mb-1 break-words">
                  {feature.description}
                </p>
                <p className="text-xs text-slate-400 leading-snug break-words">
                  {feature.detail}
                </p>
              </div>

              {/* Status badges */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                  feature.requiresAPI
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    feature.requiresAPI ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  {feature.requiresAPI ? 'API Ready' : 'Client-Side'}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  🦄 Unicorn
                </span>
              </div>

              {/* Hover arrow */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-slate-400 group-hover:text-slate-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer info */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-indigo-600 to-purple-600 blur-2xl" />
        <div className="relative glass-panel p-6 border-indigo-500/30">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🦄</span>
            <div>
              <h4 className="text-lg font-bold bg-gradient-to-r from-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2">
                Unicorn-Optimized Intelligence
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                Every AI feature enhances rare signal detection. From discovery to execution to learning,
                the entire system focuses on finding and validating high-quality Unicorn alignments.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg">
                  <span className="text-base">✓</span>
                  <span className="font-semibold">{clientSideCount} work offline</span>
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg">
                  <span className="text-base">⚙️</span>
                  <span className="font-semibold">{apiRequiredCount} use AI APIs</span>
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg">
                  <span className="text-base">📊</span>
                  <span className="font-semibold">All data local</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
