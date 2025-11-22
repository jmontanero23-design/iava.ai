import React, { useState } from 'react'
import AIFeaturesDashboard from './AIFeaturesDashboard.jsx'
import AIChat from './AIChat.jsx'
import MarketSentiment from './MarketSentiment.jsx'
import ChronosForecast from './ChronosForecast.jsx'
import MultiTimeframePanel from './MultiTimeframePanel.jsx'
import PatternRecognition from './PatternRecognition.jsx'
import SignalQualityScorerPanel from './SignalQualityScorerPanel.jsx'
import RiskAdvisorPanel from './RiskAdvisorPanel.jsx'
import TradeJournalAIPanel from './TradeJournalAIPanel.jsx'
import MarketRegimeDetectorPanel from './MarketRegimeDetectorPanel.jsx'
import AnomalyDetectorPanel from './AnomalyDetectorPanel.jsx'
import SmartWatchlistBuilderPanel from './SmartWatchlistBuilderPanel.jsx'
import PredictiveConfidencePanel from './PredictiveConfidencePanel.jsx'
import PersonalizedLearningPanel from './PersonalizedLearningPanel.jsx'
import GeneticOptimizerPanel from './GeneticOptimizerPanel.jsx'
import OptionsGreeksCalculator from './OptionsGreeksCalculator.jsx'
import Level2MarketDepth from './Level2MarketDepth.jsx'
import VolumeProfile from './VolumeProfile.jsx'
import PortfolioAnalytics from './PortfolioAnalytics.jsx'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

/**
 * AI Hub - Unified AI Feature Center
 * All 12+ AI features in one consolidated view
 */
export default function AIHub() {
  const [selectedFeature, setSelectedFeature] = useState('dashboard')
  const { marketData } = useMarketData()
  const symbol = marketData?.symbol || 'SPY'

  const features = [
    { id: 'dashboard', name: 'Dashboard', icon: '🎯', component: AIFeaturesDashboard },
    { id: 'chat', name: 'AI Chat', icon: '💬', component: AIChat },
    { id: 'sentiment', name: 'Sentiment', icon: '📈', component: MarketSentiment },
    { id: 'forecast', name: 'AVA Forecast', icon: '🔮', component: ChronosForecast },
    { id: 'multi-tf', name: 'Multi-TF', icon: '🕐', component: () => <MultiTimeframePanel symbol={symbol} /> },
    { id: 'patterns', name: 'Patterns', icon: '🎯', component: PatternRecognition },
    { id: 'signals', name: 'Signal Score', icon: '📊', component: SignalQualityScorerPanel },
    { id: 'risk', name: 'Risk Advisor', icon: '⚠️', component: RiskAdvisorPanel },
    { id: 'regime', name: 'Market Regime', icon: '🌡️', component: MarketRegimeDetectorPanel },
    { id: 'anomaly', name: 'Anomaly', icon: '🎲', component: AnomalyDetectorPanel },
    { id: 'watchlist', name: 'Watchlist AI', icon: '👁️', component: SmartWatchlistBuilderPanel },
    { id: 'confidence', name: 'Confidence', icon: '🎯', component: PredictiveConfidencePanel },
    { id: 'genetic', name: 'Genetic Opt', icon: '🧬', component: GeneticOptimizerPanel },
    { id: 'options_greeks', name: 'Options Greeks', icon: 'Δ', component: OptionsGreeksCalculator },
    { id: 'level2_depth', name: 'Level 2', icon: '📊', component: Level2MarketDepth },
    { id: 'volume_profile', name: 'Volume Profile', icon: '📈', component: VolumeProfile },
    { id: 'portfolio_analytics', name: 'Portfolio', icon: '💼', component: PortfolioAnalytics }
  ]

  const ActiveComponent = features.find(f => f.id === selectedFeature)?.component

  return (
    <div className="space-y-4">
      {/* Feature Selector Grid */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            AI Command Center
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {features.filter(f => f.id !== 'dashboard').length} AI Features Active
            </span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {features.map(feature => (
            <button
              key={feature.id}
              onClick={() => setSelectedFeature(feature.id)}
              className={`p-3 rounded-lg border transition-all group ${
                selectedFeature === feature.id
                  ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-purple-500/50 shadow-lg'
                  : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-700/40 hover:border-slate-600/50'
              }`}
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <div className={`text-xs font-medium ${
                selectedFeature === feature.id ? 'text-purple-300' : 'text-slate-400'
              }`}>
                {feature.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Feature Component */}
      <div className="min-h-[600px]">
        {ActiveComponent && <ActiveComponent onFeatureSelect={setSelectedFeature} />}
      </div>
    </div>
  )
}