import React, { useState, useEffect } from 'react'
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
import VoiceAlertSettings, { VoiceAlertToggle } from './VoiceAlertSettings.jsx'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import {
  Target, MessageSquare, TrendingUp, Sparkles, Clock, Eye, LineChart,
  AlertTriangle, Thermometer, Dice1, EyeIcon, Gauge, Dna, Calculator,
  BarChart3, BarChartHorizontal, Briefcase, Volume2
} from 'lucide-react'

/**
 * AI Hub - Unified AI Feature Center
 * All 12+ AI features in one consolidated view
 */
export default function AIHub() {
  const [selectedFeature, setSelectedFeature] = useState('dashboard')
  const { marketData } = useMarketData()
  const symbol = marketData?.symbol || 'SPY'

  // Listen for events to switch to a specific feature
  useEffect(() => {
    const handleOpenFeature = (event) => {
      const { feature } = event.detail || {}
      if (feature) {
        setSelectedFeature(feature)
      }
    }

    // Listen for specific events
    const handleOpenChat = () => setSelectedFeature('chat')
    const handleOpenForecast = () => setSelectedFeature('forecast')

    window.addEventListener('ava.openHubFeature', handleOpenFeature)
    window.addEventListener('ava.openChat', handleOpenChat)
    window.addEventListener('ava.openForecast', handleOpenForecast)

    return () => {
      window.removeEventListener('ava.openHubFeature', handleOpenFeature)
      window.removeEventListener('ava.openChat', handleOpenChat)
      window.removeEventListener('ava.openForecast', handleOpenForecast)
    }
  }, [])

  const features = [
    { id: 'dashboard', name: 'Dashboard', Icon: Target, component: AIFeaturesDashboard },
    { id: 'chat', name: 'AI Chat', Icon: MessageSquare, component: AIChat },
    { id: 'sentiment', name: 'Sentiment', Icon: TrendingUp, component: MarketSentiment },
    { id: 'forecast', name: 'AVA Forecast', Icon: Sparkles, component: ChronosForecast },
    { id: 'multi-tf', name: 'Multi-TF', Icon: Clock, component: () => <MultiTimeframePanel symbol={symbol} /> },
    { id: 'patterns', name: 'Patterns', Icon: Eye, component: PatternRecognition },
    { id: 'signals', name: 'Signal Score', Icon: LineChart, component: SignalQualityScorerPanel },
    { id: 'risk', name: 'Risk Advisor', Icon: AlertTriangle, component: RiskAdvisorPanel },
    { id: 'regime', name: 'Market Regime', Icon: Thermometer, component: MarketRegimeDetectorPanel },
    { id: 'anomaly', name: 'Anomaly', Icon: Dice1, component: AnomalyDetectorPanel },
    { id: 'watchlist', name: 'Watchlist AI', Icon: EyeIcon, component: SmartWatchlistBuilderPanel },
    { id: 'confidence', name: 'Confidence', Icon: Gauge, component: PredictiveConfidencePanel },
    { id: 'genetic', name: 'Genetic Opt', Icon: Dna, component: GeneticOptimizerPanel },
    { id: 'options_greeks', name: 'Options', Icon: Calculator, component: OptionsGreeksCalculator },
    { id: 'level2_depth', name: 'Level 2', Icon: BarChart3, component: Level2MarketDepth },
    { id: 'volume_profile', name: 'Volume', Icon: BarChartHorizontal, component: VolumeProfile },
    { id: 'portfolio_analytics', name: 'Portfolio', Icon: Briefcase, component: PortfolioAnalytics },
    { id: 'voice_settings', name: 'Voice', Icon: Volume2, component: VoiceAlertSettings }
  ]

  const ActiveComponent = features.find(f => f.id === selectedFeature)?.component

  return (
    <div className="space-y-4">
      {/* Feature Selector Grid */}
      <div className="elite-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            AI Command Center
          </h2>
          <div className="flex items-center gap-3">
            <VoiceAlertToggle />
            <span className="text-xs text-slate-500">
              {features.filter(f => f.id !== 'dashboard' && f.id !== 'voice_settings').length} Features
            </span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
          {features.map(feature => {
            const IconComponent = feature.Icon
            const isActive = selectedFeature === feature.id
            return (
              <button
                key={feature.id}
                onClick={() => setSelectedFeature(feature.id)}
                className={`p-3 rounded-lg border transition-all group ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500/50'
                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col items-center">
                  <IconComponent
                    className={`w-5 h-5 mb-1.5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <div className={`text-[10px] font-medium truncate w-full text-center ${
                    isActive ? 'text-indigo-300' : 'text-slate-500'
                  }`}>
                    {feature.name}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Feature Component */}
      <div className="min-h-[600px]">
        {ActiveComponent && <ActiveComponent onFeatureSelect={setSelectedFeature} />}
      </div>
    </div>
  )
}