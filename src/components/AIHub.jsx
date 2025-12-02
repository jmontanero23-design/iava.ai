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
import VoiceAlertSettings from './VoiceAlertSettings.jsx'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'
import {
  Brain, MessageCircle, TrendingUp, Clock, Eye, Activity,
  Shield, Dna, Gauge, BookOpen, Search, List, Layers, Users, Mic, GraduationCap,
  Sparkles, ChevronLeft
} from 'lucide-react'

/**
 * AI Hub - Unified AI Feature Center
 * All 12+ AI features in one consolidated view
 */
export default function AIHub() {
  const [selectedFeature, setSelectedFeature] = useState(null)  // null shows feature grid
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

  // Feature definitions matching the LEGENDARY mockup
  const features = [
    { id: 'chat', name: 'Chat with AVA', desc: 'Ask anything about trading, get AI analysis', Icon: MessageCircle, component: AIChat, colorKey: 'cyan', wide: true, status: 'live' },
    { id: 'ava-mind', name: 'AVA Mind', desc: 'Your AI twin that learns your trading style and evolves with you', Icon: Brain, component: AIFeaturesDashboard, colorKey: 'purple', wide: true, status: 'live' },
    { id: 'chronos', name: 'Chronos', desc: 'AI price predictions', Icon: Sparkles, component: ChronosForecast, colorKey: 'cyan', status: 'live' },
    { id: 'sentiment', name: 'Sentiment', desc: 'News & social analysis', Icon: MessageCircle, component: MarketSentiment, colorKey: 'emerald', status: 'live' },
    { id: 'regime', name: 'Regime', desc: 'Market condition', Icon: Activity, component: MarketRegimeDetectorPanel, colorKey: 'indigo', status: 'live' },
    { id: 'genetic', name: 'Genetic', desc: 'Strategy evolution', Icon: Dna, component: GeneticOptimizerPanel, colorKey: 'amber', status: 'live' },
    { id: 'emotional', name: 'Emotional', desc: 'Psychology tracking', Icon: TrendingUp, component: AIChat, colorKey: 'red', status: 'live' },
    { id: 'confidence', name: 'Confidence', desc: 'Signal probability', Icon: Gauge, component: PredictiveConfidencePanel, colorKey: 'purple', status: 'live' },
    { id: 'patterns', name: 'Patterns', desc: 'Chart recognition', Icon: Eye, component: PatternRecognition, colorKey: 'cyan', status: 'live' },
    { id: 'risk', name: 'Risk', desc: 'Position sizing', Icon: Shield, component: RiskAdvisorPanel, colorKey: 'emerald', status: 'live' },
    { id: 'journal', name: 'Journal', desc: 'Trade analysis', Icon: BookOpen, component: TradeJournalAIPanel, colorKey: 'indigo', status: 'live' },
    { id: 'nlp', name: 'NLP', desc: 'Natural search', Icon: Search, component: SmartWatchlistBuilderPanel, colorKey: 'amber', status: 'live' },
    { id: 'watchlist', name: 'Watchlist', desc: 'AI-curated', Icon: List, component: SmartWatchlistBuilderPanel, colorKey: 'red', status: 'live' },
    { id: 'multi-tf', name: 'Multi-TF', desc: 'Cross analysis', Icon: Layers, component: () => <MultiTimeframePanel symbol={symbol} />, colorKey: 'purple', status: 'live' },
    { id: 'social', name: 'Social', desc: 'Trade together', Icon: Users, component: AIChat, colorKey: 'cyan', status: 'beta' },
    { id: 'voice', name: 'Voice', desc: 'Hands-free trading', Icon: Mic, component: VoiceAlertSettings, colorKey: 'emerald', status: 'live' },
    { id: 'learning', name: 'Learning', desc: 'Education path', Icon: GraduationCap, component: PersonalizedLearningPanel, colorKey: 'indigo', status: 'live' },
  ]

  // Color mappings for feature icons
  const colorMaps = {
    purple: { bg: colors.purple.dim, color: colors.purple[400] },
    cyan: { bg: colors.cyan.dim, color: colors.cyan[400] },
    emerald: { bg: colors.emerald.dim, color: colors.emerald[400] },
    indigo: { bg: colors.indigo.dim, color: colors.indigo[400] },
    amber: { bg: colors.amber.dim, color: colors.amber[400] },
    red: { bg: colors.red.dim, color: colors.red[400] },
  }

  const ActiveComponent = features.find(f => f.id === selectedFeature)?.component

  // If a feature is selected, show it full screen with back button
  if (selectedFeature) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Back header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            padding: spacing[4],
            borderBottom: `1px solid ${colors.glass.border}`,
          }}
        >
          <button
            onClick={() => setSelectedFeature(null)}
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.lg,
              background: colors.depth1,
              border: `1px solid ${colors.glass.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={20} style={{ color: colors.text[70] }} />
          </button>
          <div>
            <h2 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text[100] }}>
              {features.find(f => f.id === selectedFeature)?.name}
            </h2>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text[50] }}>
              {features.find(f => f.id === selectedFeature)?.desc}
            </p>
          </div>
        </div>
        {/* Feature content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {ActiveComponent && <ActiveComponent onFeatureSelect={setSelectedFeature} />}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Hub Header */}
      <div
        style={{
          padding: `${spacing[4]}px ${spacing[5]}px`,
          background: `linear-gradient(180deg, ${colors.purple.dim} 0%, transparent 100%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: gradients.unicorn,
              borderRadius: radius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 30px ${colors.purple.glow}`,
            }}
          >
            <Sparkles size={22} style={{ color: '#fff' }} />
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: typography.fontWeight.black,
              letterSpacing: '-0.02em',
              color: colors.text[100],
            }}
          >
            AI Hub
          </h1>
        </div>
        <p style={{ fontSize: typography.fontSize.base, color: colors.text[50] }}>
          {features.length} AI features at your fingertips
        </p>
      </div>

      {/* LEGENDARY Feature Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          padding: `12px ${spacing[4]}px 100px`,
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            colorMap={colorMaps[feature.colorKey]}
            onClick={() => setSelectedFeature(feature.id)}
          />
        ))}
      </div>
    </div>
  )
}

// Feature Card with LEGENDARY hover effects
function FeatureCard({ feature, colorMap, onClick }) {
  const [isHovered, setIsHovered] = useState(false)
  const IconComponent = feature.Icon

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        gridColumn: feature.wide ? 'span 2' : 'span 1',
        background: colors.depth1,
        border: `1px solid ${isHovered ? 'rgba(139, 92, 246, 0.3)' : colors.glass.border}`,
        borderRadius: 16,
        padding: 16,
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
        transform: isHovered ? 'translateY(-4px)' : 'none',
        boxShadow: isHovered ? '0 12px 40px rgba(0, 0, 0, 0.4)' : 'none',
      }}
    >
      {/* Unicorn top bar on hover */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: gradients.unicorn,
          transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
          transition: `transform ${animation.duration.fast}ms ${animation.easing.spring}`,
        }}
      />

      {/* Status badge */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          fontSize: 8,
          fontWeight: 800,
          padding: '3px 7px',
          borderRadius: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          background: feature.status === 'live' ? colors.emerald.dim : colors.amber.dim,
          color: feature.status === 'live' ? colors.emerald[400] : colors.amber[400],
        }}
      >
        {feature.status}
      </div>

      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: colorMap.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <IconComponent size={22} style={{ color: colorMap.color }} />
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: colors.text[100],
          marginBottom: 4,
        }}
      >
        {feature.name}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 12,
          color: colors.text[50],
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        {feature.desc}
      </p>
    </button>
  )
}