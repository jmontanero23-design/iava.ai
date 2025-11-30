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
import { LogoMark } from './ui/Logo'
import { colors, gradients, animation } from '../styles/tokens'
import {
  Target, MessageSquare, TrendingUp, Clock, Eye, LineChart,
  AlertTriangle, Thermometer, Dice1, EyeIcon, Gauge, Dna, Calculator,
  BarChart3, BarChartHorizontal, Briefcase, Volume2, Zap
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

  // Feature definitions with LEGENDARY styling
  const features = [
    { id: 'dashboard', name: 'Dashboard', Icon: Target, component: AIFeaturesDashboard, color: colors.cyan[400] },
    { id: 'chat', name: 'AI Chat', Icon: MessageSquare, component: AIChat, color: colors.indigo[500] },
    { id: 'sentiment', name: 'Sentiment', Icon: TrendingUp, component: MarketSentiment, color: colors.emerald[400] },
    { id: 'forecast', name: 'AVA Forecast', Icon: Zap, component: ChronosForecast, color: colors.purple[500], isAVA: true },
    { id: 'multi-tf', name: 'Multi-TF', Icon: Clock, component: () => <MultiTimeframePanel symbol={symbol} />, color: colors.cyan[400] },
    { id: 'patterns', name: 'Patterns', Icon: Eye, component: PatternRecognition, color: colors.purple[400] },
    { id: 'signals', name: 'Signal Score', Icon: LineChart, component: SignalQualityScorerPanel, color: colors.emerald[400] },
    { id: 'risk', name: 'Risk Advisor', Icon: AlertTriangle, component: RiskAdvisorPanel, color: colors.red[400] },
    { id: 'regime', name: 'Market Regime', Icon: Thermometer, component: MarketRegimeDetectorPanel, color: colors.amber[400] },
    { id: 'anomaly', name: 'Anomaly', Icon: Dice1, component: AnomalyDetectorPanel, color: colors.red[400] },
    { id: 'watchlist', name: 'Watchlist AI', Icon: EyeIcon, component: SmartWatchlistBuilderPanel, color: colors.cyan[400] },
    { id: 'confidence', name: 'Confidence', Icon: Gauge, component: PredictiveConfidencePanel, color: colors.purple[500] },
    { id: 'genetic', name: 'Genetic Opt', Icon: Dna, component: GeneticOptimizerPanel, color: colors.emerald[400] },
    { id: 'options_greeks', name: 'Options', Icon: Calculator, component: OptionsGreeksCalculator, color: colors.indigo[400] },
    { id: 'level2_depth', name: 'Level 2', Icon: BarChart3, component: Level2MarketDepth, color: colors.cyan[400] },
    { id: 'volume_profile', name: 'Volume', Icon: BarChartHorizontal, component: VolumeProfile, color: colors.purple[400] },
    { id: 'portfolio_analytics', name: 'Portfolio', Icon: Briefcase, component: PortfolioAnalytics, color: colors.amber[400] },
    { id: 'voice_settings', name: 'Voice', Icon: Volume2, component: VoiceAlertSettings, color: colors.text[50] }
  ]

  const ActiveComponent = features.find(f => f.id === selectedFeature)?.component

  return (
    <div className="space-y-4">
      {/* LEGENDARY Feature Selector Grid */}
      <div
        style={{
          background: colors.glass.bg,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colors.glass.border}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        {/* Header with Unicorn gradient title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <LogoMark size={28} />
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  background: gradients.unicorn,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                AI Command Center
              </h2>
              <p style={{ fontSize: 12, color: colors.text[50], marginTop: 2 }}>
                {features.filter(f => f.id !== 'dashboard' && f.id !== 'voice_settings').length} AI-Powered Features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <VoiceAlertToggle />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: colors.emerald.dim,
                borderRadius: 20,
                border: `1px solid ${colors.emerald[400]}30`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: colors.emerald[400],
                  borderRadius: '50%',
                  boxShadow: `0 0 8px ${colors.emerald.glow}`,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.emerald[400] }}>
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* LEGENDARY Feature Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
          {features.map(feature => {
            const IconComponent = feature.Icon
            const isActive = selectedFeature === feature.id
            const featureColor = feature.color || colors.text[50]

            return (
              <button
                key={feature.id}
                onClick={() => setSelectedFeature(feature.id)}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: isActive
                    ? `1px solid ${featureColor}50`
                    : '1px solid transparent',
                  background: isActive
                    ? `${featureColor}15`
                    : 'rgba(255, 255, 255, 0.03)',
                  transition: `all ${animation.duration.normal}ms ${animation.easing.smooth}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.border = '1px solid transparent'
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {feature.isAVA ? (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LogoMark
                        size={20}
                        style={{
                          filter: isActive
                            ? `drop-shadow(0 0 8px ${colors.purple.glow})`
                            : 'none',
                          opacity: isActive ? 1 : 0.6,
                        }}
                      />
                    </div>
                  ) : (
                    <IconComponent
                      style={{
                        width: 20,
                        height: 20,
                        marginBottom: 6,
                        color: isActive ? featureColor : colors.text[30],
                        transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
                        filter: isActive
                          ? `drop-shadow(0 0 6px ${featureColor}60)`
                          : 'none',
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? featureColor : colors.text[30],
                      textAlign: 'center',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {feature.name}
                  </span>
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