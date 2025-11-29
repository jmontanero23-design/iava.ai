/**
 * AVA Mind Onboarding Flow
 *
 * A comprehensive, pedagogically-designed onboarding experience that:
 * 1. Introduces the concept of an AI digital twin
 * 2. Captures user's initial personality preferences
 * 3. Explains autonomy levels with clear consequences
 * 4. Sets up initial configuration
 *
 * Design Philosophy:
 * - Progressive disclosure: reveal complexity gradually
 * - Immediate value: users understand benefits right away
 * - Agency: users feel in control of their AI
 * - Accessibility: keyboard navigable, screen reader friendly
 */

import { useState, useEffect, useCallback } from 'react'

const ONBOARDING_STORAGE_KEY = 'ava.mind.onboarding.completed'
const PERSONALITY_STORAGE_KEY = 'ava.mind.personality'

// Risk tolerance configurations with detailed explanations
const RISK_PROFILES = [
  {
    id: 'conservative',
    label: 'Conservative',
    icon: '🛡️',
    description: 'Prioritize capital preservation over gains',
    details: 'AVA will suggest lower-risk setups, wider stop losses, and smaller position sizes. Best for: protecting wealth, steady growth.',
    color: 'emerald',
    stats: { riskLevel: 20, expectedReturn: 'Steady', volatility: 'Low' }
  },
  {
    id: 'moderate',
    label: 'Moderate',
    icon: '⚖️',
    description: 'Balance between growth and protection',
    details: 'AVA will balance risk and reward, suggesting trades with favorable risk-to-reward ratios. Best for: most traders, balanced approach.',
    color: 'blue',
    stats: { riskLevel: 50, expectedReturn: 'Balanced', volatility: 'Medium' }
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    icon: '🚀',
    description: 'Maximize growth, accept higher volatility',
    details: 'AVA will suggest higher-conviction plays, tighter stops, and larger positions when confidence is high. Best for: experienced traders, growth focus.',
    color: 'rose',
    stats: { riskLevel: 80, expectedReturn: 'High', volatility: 'High' }
  }
]

// Trading style configurations
const TRADING_STYLES = [
  {
    id: 'scalp',
    label: 'Scalping',
    icon: '⚡',
    timeframe: 'Seconds to minutes',
    description: 'Quick in-and-out trades capturing small moves',
    details: 'AVA will focus on momentum, volume spikes, and level 2 data. Requires active monitoring.',
    preferredTimeframes: ['1Min', '5Min']
  },
  {
    id: 'day',
    label: 'Day Trading',
    icon: '☀️',
    timeframe: 'Minutes to hours',
    description: 'Open and close positions within the same day',
    details: 'AVA will analyze intraday patterns, VWAP, and session dynamics. No overnight risk.',
    preferredTimeframes: ['5Min', '15Min', '1Hour']
  },
  {
    id: 'swing',
    label: 'Swing Trading',
    icon: '🌊',
    timeframe: 'Days to weeks',
    description: 'Capture medium-term price movements',
    details: 'AVA will identify trend continuations, support/resistance levels, and multi-day setups.',
    preferredTimeframes: ['1Hour', '4Hour', 'Daily']
  },
  {
    id: 'position',
    label: 'Position Trading',
    icon: '🏔️',
    timeframe: 'Weeks to months',
    description: 'Long-term positions based on fundamentals',
    details: 'AVA will focus on macro trends, sector rotation, and major support/resistance zones.',
    preferredTimeframes: ['Daily', 'Weekly']
  }
]

// Autonomy level configurations with consequences
const AUTONOMY_LEVELS = [
  {
    level: 1,
    name: 'Observer',
    icon: '👁️',
    description: 'AVA watches and learns silently',
    capabilities: ['Learns from your trades', 'Tracks your patterns', 'Builds your profile'],
    restrictions: ['No suggestions shown', 'No alerts', 'Silent learning mode'],
    trustLevel: 'Minimal - AVA is just watching'
  },
  {
    level: 2,
    name: 'Advisor',
    icon: '💭',
    description: 'AVA suggests trades for your review',
    capabilities: ['Shows trade suggestions', 'Explains reasoning', 'Voice notifications'],
    restrictions: ['Cannot execute trades', 'You must take action manually'],
    trustLevel: 'Low - AVA advises, you decide'
  },
  {
    level: 3,
    name: 'Assistant',
    icon: '🤝',
    description: 'AVA can execute with your confirmation',
    capabilities: ['Execute button appears on suggestions', 'One-click trade confirmation', 'Quick action shortcuts'],
    restrictions: ['Requires confirmation for each trade', 'No fully autonomous actions'],
    trustLevel: 'Medium - AVA acts with permission'
  },
  {
    level: 4,
    name: 'Co-Pilot',
    icon: '🎯',
    description: 'AVA manages routine trades automatically',
    capabilities: ['Auto-executes high-confidence trades', 'Manages position sizing', 'Sets stop losses'],
    restrictions: ['Follows your risk parameters', 'Reports all actions to you'],
    trustLevel: 'High - AVA acts independently within bounds'
  },
  {
    level: 5,
    name: 'Autonomous',
    icon: '🧠',
    description: 'Full AI-managed trading',
    capabilities: ['Complete trading authority', 'Portfolio optimization', 'Dynamic strategy adjustment'],
    restrictions: ['Still respects risk limits', 'Emergency pause available'],
    trustLevel: 'Full - AVA manages your trading'
  }
]

// Onboarding steps definition
const STEPS = [
  { id: 'intro', title: 'Meet AVA Mind' },
  { id: 'risk', title: 'Your Risk DNA' },
  { id: 'style', title: 'Trading Approach' },
  { id: 'autonomy', title: 'Control Level' },
  { id: 'complete', title: 'Ready to Learn' }
]

export default function AVAMindOnboarding({ onComplete, forceShow = false }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // User selections
  const [riskProfile, setRiskProfile] = useState('moderate')
  const [tradingStyle, setTradingStyle] = useState('swing')
  const [autonomyLevel, setAutonomyLevel] = useState(2)

  // Check if onboarding should show
  useEffect(() => {
    const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    const hasPersonality = localStorage.getItem(PERSONALITY_STORAGE_KEY)

    if (forceShow || (!hasCompleted && !hasPersonality)) {
      const timer = setTimeout(() => setIsVisible(true), 300)
      return () => clearTimeout(timer)
    }
  }, [forceShow])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return

      if (e.key === 'Escape') {
        handleSkip()
      } else if (e.key === 'Enter' && currentStep === STEPS.length - 1) {
        handleComplete()
      } else if (e.key === 'ArrowRight' && currentStep < STEPS.length - 1) {
        handleNext()
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handleBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, currentStep])

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'skipped')
      setIsVisible(false)
      onComplete?.({ skipped: true })
    }, 300)
  }, [onComplete])

  const handleComplete = useCallback(() => {
    // Build personality object
    const selectedRisk = RISK_PROFILES.find(r => r.id === riskProfile)
    const selectedStyle = TRADING_STYLES.find(s => s.id === tradingStyle)

    const personality = {
      riskTolerance: riskProfile,
      tradingStyle: tradingStyle,
      preferredTimeframes: selectedStyle?.preferredTimeframes || ['5Min', '1Hour'],
      favoriteIndicators: ['RSI', 'MACD', 'EMA'],
      patterns: [],
      strengths: [],
      weaknesses: [],
      emotionalState: 'calm',
      learningRate: 0.1,
      adaptability: 0.8,
      intuition: 0.6,
      // New fields from onboarding
      onboardingVersion: 1,
      setupDate: new Date().toISOString()
    }

    // Save to localStorage
    localStorage.setItem(PERSONALITY_STORAGE_KEY, JSON.stringify(personality))
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'completed')
    localStorage.setItem('ava.mind.autonomy', autonomyLevel.toString())

    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onComplete?.({
        personality,
        autonomyLevel,
        skipped: false
      })
    }, 300)
  }, [riskProfile, tradingStyle, autonomyLevel, onComplete])

  if (!isVisible) return null

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ava-onboarding-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" />

      {/* Content container */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-cyan-500 to-pink-500 blur-3xl opacity-20 rounded-3xl animate-pulse" style={{ animationDuration: '4s' }} />

        {/* Card */}
        <div className="relative bg-slate-900/90 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-transparent to-cyan-600" />
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="neural-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                  <circle cx="25" cy="25" r="1" fill="currentColor" className="text-purple-400" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#neural-pattern)" />
            </svg>
          </div>

          {/* Header with progress */}
          <div className="relative px-8 pt-6 pb-4 border-b border-purple-500/20">
            {/* Step indicators */}
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                    ${idx < currentStep
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                      : idx === currentStep
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/30 scale-110'
                        : 'bg-slate-800 text-slate-500'
                    }
                  `}>
                    {idx < currentStep ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 mx-1 transition-colors duration-300 ${
                      idx < currentStep ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="relative px-8 py-6 min-h-[400px]">
            {currentStep === 0 && <IntroStep />}
            {currentStep === 1 && (
              <RiskStep
                selected={riskProfile}
                onSelect={setRiskProfile}
              />
            )}
            {currentStep === 2 && (
              <StyleStep
                selected={tradingStyle}
                onSelect={setTradingStyle}
              />
            )}
            {currentStep === 3 && (
              <AutonomyStep
                selected={autonomyLevel}
                onSelect={setAutonomyLevel}
              />
            )}
            {currentStep === 4 && (
              <CompleteStep
                riskProfile={RISK_PROFILES.find(r => r.id === riskProfile)}
                tradingStyle={TRADING_STYLES.find(s => s.id === tradingStyle)}
                autonomyLevel={AUTONOMY_LEVELS.find(a => a.level === autonomyLevel)}
              />
            )}
          </div>

          {/* Footer with navigation */}
          <div className="relative px-8 py-4 border-t border-purple-500/20 bg-slate-950/50">
            <div className="flex items-center justify-between">
              <button
                onClick={currentStep === 0 ? handleSkip : handleBack}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg"
              >
                {currentStep === 0 ? 'Skip Setup' : '← Back'}
              </button>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500">
                  Step {currentStep + 1} of {STEPS.length}
                </span>

                <button
                  onClick={currentStep === STEPS.length - 1 ? handleComplete : handleNext}
                  className="relative group px-6 py-2.5 rounded-xl text-sm font-bold overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 group-hover:from-purple-500 group-hover:via-cyan-500 group-hover:to-purple-500 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
                  <span className="relative text-white flex items-center gap-2">
                    {currentStep === STEPS.length - 1 ? (
                      <>Start Learning</>
                    ) : (
                      <>Continue →</>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 1: Introduction
function IntroStep() {
  return (
    <div className="space-y-6">
      {/* Brain visualization */}
      <div className="relative h-32 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 animate-pulse" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/30 to-cyan-500/30 animate-pulse" style={{ animationDuration: '2s' }} />
        </div>
        <span className="relative text-5xl z-10">🧠</span>
      </div>

      <div className="text-center space-y-4">
        <h2 id="ava-onboarding-title" className="text-2xl font-bold bg-gradient-to-r from-purple-200 via-cyan-200 to-pink-200 bg-clip-text text-transparent">
          Meet AVA Mind
        </h2>
        <p className="text-lg text-slate-300">
          Your AI Digital Twin
        </p>
      </div>

      <div className="space-y-4 text-slate-400">
        <p className="text-center">
          AVA Mind is an AI that learns your unique trading style and thinks like you.
          Over time, it becomes your personalized trading companion.
        </p>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
            <div className="text-2xl mb-2">📚</div>
            <div className="text-sm font-medium text-purple-300">Learns</div>
            <div className="text-xs text-slate-500">From your trades</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-cyan-500/20">
            <div className="text-2xl mb-2">💡</div>
            <div className="text-sm font-medium text-cyan-300">Suggests</div>
            <div className="text-xs text-slate-500">Matching your style</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-pink-500/20">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium text-pink-300">Evolves</div>
            <div className="text-xs text-slate-500">With every decision</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 2: Risk Profile
function RiskStep({ selected, onSelect }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-white">Your Risk DNA</h2>
        <p className="text-slate-400">How should AVA approach risk on your behalf?</p>
      </div>

      <div className="space-y-3">
        {RISK_PROFILES.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onSelect(profile.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selected === profile.id
                ? `border-${profile.color}-500 bg-${profile.color}-500/10 shadow-lg shadow-${profile.color}-500/20`
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
            style={{
              borderColor: selected === profile.id
                ? profile.color === 'emerald' ? 'rgb(16, 185, 129)'
                : profile.color === 'blue' ? 'rgb(59, 130, 246)'
                : 'rgb(244, 63, 94)'
                : undefined,
              backgroundColor: selected === profile.id
                ? profile.color === 'emerald' ? 'rgba(16, 185, 129, 0.1)'
                : profile.color === 'blue' ? 'rgba(59, 130, 246, 0.1)'
                : 'rgba(244, 63, 94, 0.1)'
                : undefined
            }}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{profile.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{profile.label}</span>
                  {selected === profile.id && (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">{profile.description}</p>
                {selected === profile.id && (
                  <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">
                    {profile.details}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 3: Trading Style
function StyleStep({ selected, onSelect }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-white">Trading Approach</h2>
        <p className="text-slate-400">What's your typical trading timeframe?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TRADING_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selected === style.id
                ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-2">{style.icon}</div>
            <div className="font-semibold text-white">{style.label}</div>
            <div className="text-xs text-cyan-400 mb-2">{style.timeframe}</div>
            <p className="text-xs text-slate-400">{style.description}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="text-xs text-slate-500 mb-2">AVA will optimize for:</div>
          <div className="text-sm text-slate-300">
            {TRADING_STYLES.find(s => s.id === selected)?.details}
          </div>
        </div>
      )}
    </div>
  )
}

// Step 4: Autonomy Level
function AutonomyStep({ selected, onSelect }) {
  const selectedLevel = AUTONOMY_LEVELS.find(a => a.level === selected)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-white">Control Level</h2>
        <p className="text-slate-400">How much should AVA do on its own?</p>
      </div>

      {/* Level selector */}
      <div className="flex gap-2">
        {AUTONOMY_LEVELS.map((level) => (
          <button
            key={level.level}
            onClick={() => onSelect(level.level)}
            className={`flex-1 py-3 rounded-lg transition-all flex flex-col items-center gap-1 ${
              level.level <= selected
                ? level.level >= 3
                  ? 'bg-gradient-to-b from-amber-500/80 to-amber-600/80 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-gradient-to-b from-purple-500/80 to-cyan-500/80 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
            }`}
            title={level.name}
          >
            <span className="text-lg">{level.icon}</span>
            <span className="text-xs font-medium">{level.level}</span>
          </button>
        ))}
      </div>

      {/* Warning for level 3+ */}
      {selected >= 3 && (
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-amber-300">
            <strong>Trade Execution Enabled:</strong> At level {selected}, AVA can execute trades.
            All actions follow your risk parameters and can be paused anytime.
          </div>
        </div>
      )}

      {/* Selected level details */}
      {selectedLevel && (
        <div className="p-4 bg-slate-800/50 rounded-xl border border-purple-500/20 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedLevel.icon}</span>
            <div>
              <div className="font-semibold text-white text-lg">{selectedLevel.name}</div>
              <div className="text-sm text-slate-400">{selectedLevel.description}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-xs text-emerald-400 font-medium mb-2">AVA Can:</div>
              <ul className="space-y-1">
                {selectedLevel.capabilities.map((cap, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                    <svg className="w-3 h-3 text-emerald-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {cap}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium mb-2">Limitations:</div>
              <ul className="space-y-1">
                {selectedLevel.restrictions.map((res, i) => (
                  <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                    <span className="text-slate-600">•</span>
                    {res}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700">
            <div className="text-xs text-purple-400">{selectedLevel.trustLevel}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Step 5: Complete
function CompleteStep({ riskProfile, tradingStyle, autonomyLevel }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-white">AVA is Ready to Learn</h2>
        <p className="text-slate-400">Here's your personalized configuration</p>
      </div>

      {/* Summary cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-xl">{riskProfile?.icon}</span>
            <div>
              <div className="text-xs text-slate-500">Risk Profile</div>
              <div className="font-medium text-white">{riskProfile?.label}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-xl">{tradingStyle?.icon}</span>
            <div>
              <div className="text-xs text-slate-500">Trading Style</div>
              <div className="font-medium text-white">{tradingStyle?.label}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-xl">{autonomyLevel?.icon}</span>
            <div>
              <div className="text-xs text-slate-500">Autonomy Level</div>
              <div className="font-medium text-white">{autonomyLevel?.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
        <div className="text-sm text-purple-300 font-medium mb-2">What happens next:</div>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-400">1.</span>
            AVA will observe your trading patterns
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">2.</span>
            Over time, suggestions will match your style
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">3.</span>
            You can adjust these settings anytime in AVA Mind
          </li>
        </ul>
      </div>
    </div>
  )
}

// Helper function to check if onboarding is needed
export function needsAVAMindOnboarding() {
  if (typeof window === 'undefined') return false
  const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY)
  const hasPersonality = localStorage.getItem(PERSONALITY_STORAGE_KEY)
  return !hasCompleted && !hasPersonality
}

// Helper to reset onboarding (for testing or user request)
export function resetAVAMindOnboarding() {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY)
  localStorage.removeItem(PERSONALITY_STORAGE_KEY)
  localStorage.removeItem('ava.mind.autonomy')
}
