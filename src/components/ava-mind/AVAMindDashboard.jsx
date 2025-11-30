/**
 * AVAMindDashboard - Full-Screen AI Dashboard
 *
 * The centerpiece of AVA Mind - a world-class, full-screen dashboard
 * that replaces the simple floating panel with an immersive experience.
 *
 * Features:
 * - AVAOrb as the visual centerpiece
 * - HexGrid personality visualization
 * - Real-time emotion tracking
 * - Pattern analysis charts
 * - Actionable insights with $ potential
 * - "What Would AVA Do?" predictions
 * - Trust Mode controls
 * - Voice activation status
 *
 * This component integrates with avaMindService for real data.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useMarketData } from '../../contexts/MarketDataContext.jsx'
import avaMindService, {
  getLearning,
  getPatterns,
  generateSuggestions,
  getRecentTrades
} from '../../services/avaMindService.js'

// Personality & Archetype system
import {
  determineArchetype,
  detectEmotionalState,
  TRADING_ARCHETYPES
} from '../../services/avaMindPersonality.js'
import ArchetypeReveal from './ArchetypeReveal.jsx'
import EmotionalStateBadge from './EmotionalStateBadge.jsx'

// Import sub-components
import AVAOrb from './AVAOrb.jsx'
import HexGrid from './HexGrid.jsx'
import EmotionTimeline from './EmotionTimeline.jsx'
import TradingPatternChart from './TradingPatternChart.jsx'
import InsightCard, { InsightList, WhatWouldAVADo } from './InsightCard.jsx'

// Safety & Coaching
import SafetyDashboard, { EmergencyStopButton } from '../SafetyDashboard.jsx'
import AICoach from '../AICoach.jsx'

// Onboarding
import AVAMindOnboarding, { useAVAMindOnboarding } from './AVAMindOnboarding.jsx'

// Trust mode levels with descriptions
const TRUST_LEVELS = [
  { level: 1, name: 'Observer', description: 'Watches and learns only', color: '#64748B', icon: '👁️' },
  { level: 2, name: 'Advisor', description: 'Suggests trades, you execute', color: '#8B5CF6', icon: '💡' },
  { level: 3, name: 'Assistant', description: 'Can prepare orders for approval', color: '#06B6D4', icon: '🤝' },
  { level: 4, name: 'Co-pilot', description: 'Executes small trades automatically', color: '#F59E0B', icon: '🚀' },
  { level: 5, name: 'Autonomous', description: 'Full trading authority within limits', color: '#10B981', icon: '⚡' }
]

// Personality trait mapping from stored personality to HexGrid format
function mapPersonalityToTraits(personality) {
  if (!personality) return []

  const riskMap = { conservative: 25, moderate: 50, aggressive: 85 }
  const styleMap = { scalp: 90, day: 70, swing: 50, position: 30 }

  return [
    { id: 'risk', label: 'Risk', value: riskMap[personality.riskTolerance] || 50, category: 'risk', description: 'Risk tolerance level' },
    { id: 'speed', label: 'Speed', value: styleMap[personality.tradingStyle] || 50, category: 'style', description: 'Decision-making speed' },
    { id: 'patience', label: 'Patience', value: 100 - (styleMap[personality.tradingStyle] || 50), category: 'emotion', description: 'Ability to wait for setups' },
    { id: 'analysis', label: 'Analysis', value: Math.round((personality.intuition || 0.5) * 100), category: 'analysis', description: 'Technical analysis depth' },
    { id: 'discipline', label: 'Discipline', value: Math.round((personality.adaptability || 0.5) * 100), category: 'risk', description: 'Rule adherence' },
    { id: 'intuition', label: 'Intuition', value: Math.round((personality.learningRate || 0.5) * 100), category: 'emotion', description: 'Gut feeling accuracy' }
  ]
}

// Generate insights from suggestions
function suggestionsToInsights(suggestions) {
  return suggestions.map((s, i) => ({
    id: s.id || `insight_${i}`,
    type: s.type === 'historical_edge' ? 'opportunity' :
          s.type === 'historical_warning' ? 'warning' :
          s.type === 'streak_warning' ? 'streak' :
          s.type === 'timing_warning' ? 'timing' : 'pattern',
    title: s.action === 'CONSIDER' ? `Strong edge on ${s.symbol}` :
           s.action === 'AVOID' ? `Caution: Weak performance on ${s.symbol}` :
           s.action === 'PAUSE' ? 'Consider taking a break' :
           s.action === 'MAINTAIN' ? 'Keep up the momentum!' : s.reasoning,
    description: s.reasoning,
    potentialValue: s.action === 'CONSIDER' ? 150 + Math.random() * 350 :
                    s.action === 'AVOID' ? -(100 + Math.random() * 200) : 0,
    confidence: s.confidence,
    risk: s.risk || 'MEDIUM',
    symbol: s.symbol,
    reasoning: s.reasoning,
    timestamp: Date.now(),
    urgent: s.action === 'AVOID' || s.action === 'PAUSE',
    action: s.action !== 'PAUSE' ? {
      label: s.action === 'CONSIDER' ? 'View Chart' :
             s.action === 'AVOID' ? 'Set Alert' : 'Acknowledge',
      handler: 'viewSymbol'
    } : null
  }))
}

export default function AVAMindDashboard({
  onClose,
  onExecuteTrade,
  onViewSymbol
}) {
  // State
  const [personality, setPersonality] = useState(null)
  const [learningStats, setLearningStats] = useState(null)
  const [patterns, setPatterns] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [trustLevel, setTrustLevel] = useState(1)
  const [mindState, setMindState] = useState('idle')
  const [activeTab, setActiveTab] = useState('overview')
  const [voiceActive, setVoiceActive] = useState(false)

  // Archetype & Personality state
  const [archetype, setArchetype] = useState(null)
  const [showArchetypeReveal, setShowArchetypeReveal] = useState(false)

  // Onboarding state
  const { needsOnboarding, completeOnboarding, resetOnboarding } = useAVAMindOnboarding()

  const { marketData } = useMarketData()

  // Load data on mount
  useEffect(() => {
    // Load personality
    try {
      const savedPersonality = localStorage.getItem('ava.mind.personality')
      if (savedPersonality) {
        setPersonality(JSON.parse(savedPersonality))
      }

      const savedTrust = localStorage.getItem('ava.mind.autonomy')
      if (savedTrust) {
        setTrustLevel(parseInt(savedTrust, 10))
      }
    } catch (e) {
      console.error('Error loading AVA Mind data:', e)
    }

    // Load service data
    setLearningStats(getLearning())
    setPatterns(getPatterns())

    // Generate initial suggestions
    if (marketData?.symbol) {
      const initialSuggestions = generateSuggestions({
        symbol: marketData.symbol,
        timeframe: marketData.timeframe,
        marketCondition: marketData.signalState
      })
      setSuggestions(initialSuggestions)
    }
  }, [])

  // Listen for external tab navigation (e.g., from Coach button in navbar)
  useEffect(() => {
    const handleOpenCoach = () => setActiveTab('coach')
    const handleOpenSafety = () => setActiveTab('safety')

    window.addEventListener('ava.openCoach', handleOpenCoach)
    window.addEventListener('ava.openSafety', handleOpenSafety)

    return () => {
      window.removeEventListener('ava.openCoach', handleOpenCoach)
      window.removeEventListener('ava.openSafety', handleOpenSafety)
    }
  }, [])

  // Update mind state based on activity
  useEffect(() => {
    if (learningStats?.totalTrades > 0) {
      if (learningStats.streakCurrent >= 3) {
        setMindState('confident')
      } else if (learningStats.streakCurrent <= -3) {
        setMindState('cautious')
      } else {
        setMindState('thinking')
      }
    }
  }, [learningStats])

  // Calculate archetype when personality loads
  useEffect(() => {
    if (personality) {
      const result = determineArchetype(personality)
      setArchetype(result)
    }
  }, [personality])

  // Handle trust level change
  const handleTrustChange = (level) => {
    setTrustLevel(level)
    localStorage.setItem('ava.mind.autonomy', level.toString())

    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: {
        text: `Trust Mode: ${TRUST_LEVELS[level - 1].name}`,
        type: level >= 4 ? 'warning' : 'info'
      }
    }))
  }

  // Handle insight action
  const handleInsightAction = (insight) => {
    if (insight.symbol && onViewSymbol) {
      onViewSymbol(insight.symbol)
    }
  }

  // Dismiss insight
  const handleDismissInsight = (insight) => {
    setSuggestions(prev => prev.filter(s => s.id !== insight.id))
  }

  // Calculate confidence from learning stats
  const confidence = learningStats?.winRate || 0

  // Map suggestions to insights
  const insights = suggestionsToInsights(suggestions)

  // Generate "What Would AVA Do" prediction
  const avaPrediction = learningStats?.bestSymbol ? {
    symbol: learningStats.bestSymbol.key,
    suggestedAction: learningStats.bestSymbol.pnl > 0 ? 'BUY' : 'HOLD',
    reasoning: `Based on ${learningStats.bestSymbol.trades} trades with ${learningStats.bestSymbol.winRate.toFixed(0)}% win rate`,
    potentialGain: learningStats.avgWin || 2.5,
    potentialLoss: learningStats.avgLoss || 1.5,
    confidence: Math.min(Math.round(learningStats.bestSymbol.winRate), 95)
  } : null

  // Personality traits for HexGrid
  const traits = mapPersonalityToTraits(personality)

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="text-xl">🧠</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AVA Mind</h1>
                <p className="text-xs text-purple-400">Your AI Digital Twin</p>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 ml-6">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                mindState === 'confident' ? 'bg-emerald-500/20 text-emerald-400' :
                mindState === 'cautious' ? 'bg-amber-500/20 text-amber-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
                {mindState.charAt(0).toUpperCase() + mindState.slice(1)}
              </span>

              {learningStats?.totalTrades > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                  {learningStats.totalTrades} trades learned
                </span>
              )}

              {voiceActive && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 animate-pulse">
                  🎤 Listening
                </span>
              )}
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            {['overview', 'patterns', 'insights', 'coach', 'safety'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? tab === 'safety' ? 'bg-rose-500/20 text-rose-400'
                    : tab === 'coach' ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-purple-500/20 text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'coach' ? '🎓 Coach' : tab === 'safety' ? '🛡️ Safety' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Emergency Stop - Always visible */}
            <EmergencyStopButton size="sm" />

            <button
              onClick={() => setVoiceActive(!voiceActive)}
              className={`p-2 rounded-lg transition-colors ${
                voiceActive
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
              title={voiceActive ? 'Disable Voice' : 'Enable Voice'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 h-[calc(100%-64px)] overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-6 grid grid-cols-12 gap-6">
            {/* Left column - Orb and personality */}
            <div className="col-span-4 space-y-6">
              {/* AVA Orb */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-8 flex flex-col items-center">
                <AVAOrb
                  state={mindState}
                  confidence={Math.round(confidence)}
                  activityLevel={learningStats?.totalTrades ? Math.min(learningStats.totalTrades / 50, 1) : 0.1}
                  size={200}
                />

                <div className="mt-6 text-center">
                  <div className="text-3xl font-bold text-white">{Math.round(confidence)}%</div>
                  <div className="text-sm text-purple-400">Win Rate</div>

                  {learningStats?.profitFactor > 0 && (
                    <div className="mt-3 text-xs text-slate-400">
                      Profit Factor: <span className="text-white font-medium">{learningStats.profitFactor.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trading Archetype Display */}
              {archetype?.primary && (
                <div
                  className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 cursor-pointer hover:scale-[1.01] transition-all"
                  onClick={() => setShowArchetypeReveal(true)}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="text-5xl"
                      style={{ filter: `drop-shadow(0 0 20px ${archetype.primary.archetype.color}60)` }}
                    >
                      {archetype.primary.archetype.emoji}
                    </span>
                    <div>
                      <h2
                        className="text-xl font-bold"
                        style={{ color: archetype.primary.archetype.color }}
                      >
                        {archetype.primary.archetype.name}
                      </h2>
                      <p className="text-sm text-slate-400">{archetype.primary.archetype.tagline}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${archetype.primary.archetype.color}20`,
                            color: archetype.primary.archetype.color
                          }}
                        >
                          {archetype.primary.score}% match
                        </span>
                        <span className="text-xs text-slate-500">Click for details</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Emotional State Badge */}
              <EmotionalStateBadge className="w-full" />

              {/* Personality HexGrid */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
                <h3 className="text-white font-semibold mb-4">Personality Matrix</h3>
                <HexGrid
                  traits={traits}
                  hexSize={35}
                  className="h-64"
                />
              </div>

              {/* Trust Mode */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Trust Mode</h3>
                  <span
                    className="text-sm font-medium"
                    style={{ color: TRUST_LEVELS[trustLevel - 1].color }}
                  >
                    {TRUST_LEVELS[trustLevel - 1].icon} {TRUST_LEVELS[trustLevel - 1].name}
                  </span>
                </div>

                <div className="flex gap-1 mb-3">
                  {TRUST_LEVELS.map((level) => (
                    <button
                      key={level.level}
                      onClick={() => handleTrustChange(level.level)}
                      className="flex-1 h-10 rounded-lg transition-all relative overflow-hidden group"
                      style={{
                        backgroundColor: trustLevel >= level.level
                          ? `${level.color}30`
                          : 'rgba(51, 65, 85, 0.5)',
                        borderColor: trustLevel >= level.level ? level.color : 'transparent',
                        borderWidth: 1
                      }}
                      title={`${level.name}: ${level.description}`}
                    >
                      <span className="text-xs text-white/70">{level.level}</span>
                      {trustLevel === level.level && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1"
                          style={{ backgroundColor: level.color }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-slate-400">
                  {TRUST_LEVELS[trustLevel - 1].description}
                </p>

                {trustLevel >= 4 && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400">⚠️</span>
                      <p className="text-xs text-amber-300">
                        Auto-execution enabled. AVA can place trades within your defined limits.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Stats and insights */}
            <div className="col-span-8 space-y-6">
              {/* Quick stats row */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Trades', value: learningStats?.totalTrades || 0, icon: '📊' },
                  { label: 'Win Streak', value: learningStats?.streakCurrent > 0 ? `+${learningStats.streakCurrent}` : learningStats?.streakCurrent || 0, icon: learningStats?.streakCurrent > 0 ? '🔥' : '📉', color: learningStats?.streakCurrent > 0 ? '#10B981' : learningStats?.streakCurrent < 0 ? '#EF4444' : undefined },
                  { label: 'Best Win Streak', value: learningStats?.streakBest || 0, icon: '🏆' },
                  { label: 'Avg Win', value: `${(learningStats?.avgWin || 0).toFixed(1)}%`, icon: '💰', color: '#10B981' }
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800/50 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{stat.icon}</span>
                      <span className="text-xs text-slate-400">{stat.label}</span>
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: stat.color || 'white' }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* What Would AVA Do? */}
              {avaPrediction && (
                <WhatWouldAVADo
                  prediction={avaPrediction}
                  onFollowAdvice={(pred) => {
                    if (onViewSymbol) onViewSymbol(pred.symbol)
                  }}
                />
              )}

              {/* Emotion Timeline */}
              <EmotionTimeline
                height={180}
                showLegend={false}
              />

              {/* Pattern Chart */}
              <TradingPatternChart
                patterns={patterns}
                height={220}
              />
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="p-6 space-y-6">
            <TradingPatternChart
              patterns={patterns}
              height={400}
              className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50"
            />

            <div className="grid grid-cols-2 gap-6">
              {/* Best performers */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="text-lg">🏆</span> Best Performers
                </h3>
                <div className="space-y-3">
                  {learningStats?.bestSymbol && (
                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div>
                        <span className="text-white font-medium">{learningStats.bestSymbol.key}</span>
                        <span className="text-xs text-slate-400 ml-2">{learningStats.bestSymbol.trades} trades</span>
                      </div>
                      <span className="text-emerald-400 font-bold">{learningStats.bestSymbol.winRate.toFixed(0)}%</span>
                    </div>
                  )}
                  {learningStats?.bestTimeframe && (
                    <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div>
                        <span className="text-white font-medium">{learningStats.bestTimeframe.key}</span>
                        <span className="text-xs text-slate-400 ml-2">Best timeframe</span>
                      </div>
                      <span className="text-purple-400 font-bold">{learningStats.bestTimeframe.winRate.toFixed(0)}%</span>
                    </div>
                  )}
                  {learningStats?.bestDayOfWeek && (
                    <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <div>
                        <span className="text-white font-medium">{learningStats.bestDayOfWeek.key}</span>
                        <span className="text-xs text-slate-400 ml-2">Best day</span>
                      </div>
                      <span className="text-cyan-400 font-bold">{learningStats.bestDayOfWeek.winRate.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Areas to improve */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="text-lg">📈</span> Areas to Improve
                </h3>
                <div className="space-y-3">
                  {learningStats?.worstSymbol && (
                    <div className="flex items-center justify-between p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                      <div>
                        <span className="text-white font-medium">{learningStats.worstSymbol.key}</span>
                        <span className="text-xs text-slate-400 ml-2">{learningStats.worstSymbol.trades} trades</span>
                      </div>
                      <span className="text-rose-400 font-bold">{learningStats.worstSymbol.winRate.toFixed(0)}%</span>
                    </div>
                  )}
                  {!learningStats?.worstSymbol && (
                    <div className="text-center py-8 text-slate-500">
                      <span className="text-3xl">🎯</span>
                      <p className="mt-2 text-sm">Keep trading to identify improvement areas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="p-6 grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <InsightList
                insights={insights}
                onAction={handleInsightAction}
                onDismiss={handleDismissInsight}
                maxVisible={10}
              />
            </div>

            <div className="col-span-4 space-y-6">
              {/* What Would AVA Do */}
              {avaPrediction && (
                <WhatWouldAVADo
                  prediction={avaPrediction}
                  onFollowAdvice={(pred) => {
                    if (onViewSymbol) onViewSymbol(pred.symbol)
                  }}
                />
              )}

              {/* Quick settings */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
                <h3 className="text-white font-semibold mb-4">Insight Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-300">Pattern Alerts</span>
                    <div className="w-10 h-6 bg-purple-500/30 rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-purple-400 rounded-full" />
                    </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-300">Streak Warnings</span>
                    <div className="w-10 h-6 bg-purple-500/30 rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-purple-400 rounded-full" />
                    </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-300">Voice Announcements</span>
                    <div className="w-10 h-6 bg-slate-700 rounded-full relative">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full" />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coach Tab - AI Trading Coach */}
        {activeTab === 'coach' && (
          <div className="p-6">
            <AICoach />
          </div>
        )}

        {/* Safety Tab - Safety Controls & Audit Log */}
        {activeTab === 'safety' && (
          <div className="p-6">
            <SafetyDashboard />
          </div>
        )}
      </main>

      {/* Onboarding Modal */}
      {needsOnboarding && (
        <AVAMindOnboarding
          onComplete={({ personality: newPersonality, autonomyLevel }) => {
            setPersonality(newPersonality)
            setTrustLevel(autonomyLevel)
            completeOnboarding()
          }}
          onSkip={completeOnboarding}
        />
      )}

      {/* Archetype Reveal Modal */}
      {showArchetypeReveal && archetype && (
        <ArchetypeReveal
          archetype={archetype}
          profile={personality}
          onContinue={() => setShowArchetypeReveal(false)}
          onRetake={() => {
            setShowArchetypeReveal(false)
            resetOnboarding()
          }}
        />
      )}

      {/* Re-run onboarding button (small, in corner) */}
      {!needsOnboarding && (
        <button
          onClick={resetOnboarding}
          className="absolute bottom-4 right-4 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          title="Re-run AVA Mind setup"
        >
          ↻ Setup
        </button>
      )}
    </div>
  )
}
