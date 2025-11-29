/**
 * AVAMindOnboarding - Elite 3-Step Onboarding Flow
 *
 * A world-class onboarding experience that introduces users to AVA Mind:
 * - Step 1: "Meet AVA" - What is your AI Digital Twin?
 * - Step 2: "Set Your Style" - Trading personality setup
 * - Step 3: "Choose Autonomy" - Control level selection
 *
 * PhD++ quality design with smooth animations and clear explanations.
 */

import React, { useState, useEffect } from 'react'

// Default personality template
const DEFAULT_PERSONALITY = {
  riskTolerance: 'moderate',
  tradingStyle: 'swing',
  preferredSymbols: [],
  tradingHours: { start: '09:30', end: '16:00' },
  maxPositionSize: 5,
  intuition: 0.5
}

// Risk tolerance options
const RISK_OPTIONS = [
  {
    value: 'conservative',
    label: 'Conservative',
    icon: '🛡️',
    description: 'Smaller positions, tight stops, capital preservation first',
    color: '#10B981'
  },
  {
    value: 'moderate',
    label: 'Moderate',
    icon: '⚖️',
    description: 'Balanced approach, standard position sizing, measured risk',
    color: '#8B5CF6'
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    icon: '🔥',
    description: 'Larger positions, wider stops, growth-focused',
    color: '#F59E0B'
  }
]

// Trading style options
const STYLE_OPTIONS = [
  {
    value: 'scalp',
    label: 'Scalper',
    icon: '⚡',
    description: 'Minutes to hours, high frequency, quick profits',
    timeframe: '1-15 min'
  },
  {
    value: 'day',
    label: 'Day Trader',
    icon: '☀️',
    description: 'Intraday positions, close before market close',
    timeframe: '15min - 1hr'
  },
  {
    value: 'swing',
    label: 'Swing Trader',
    icon: '🌊',
    description: 'Days to weeks, capture larger moves',
    timeframe: '4hr - Daily'
  },
  {
    value: 'position',
    label: 'Position Trader',
    icon: '🏔️',
    description: 'Weeks to months, trend following',
    timeframe: 'Daily - Weekly'
  }
]

// Autonomy levels
const AUTONOMY_LEVELS = [
  {
    level: 1,
    name: 'Observer',
    icon: '👁️',
    description: 'AVA watches and learns from your trades, provides insights only',
    features: ['Trade analysis', 'Pattern recognition', 'Learning from your style'],
    color: '#64748B'
  },
  {
    level: 2,
    name: 'Advisor',
    icon: '💡',
    description: 'AVA suggests trades with detailed reasoning, you make all decisions',
    features: ['Real-time suggestions', 'Entry/exit recommendations', 'Risk analysis'],
    color: '#8B5CF6'
  },
  {
    level: 3,
    name: 'Assistant',
    icon: '🤝',
    description: 'AVA can prepare orders for your approval before execution',
    features: ['Order drafting', 'One-click execution', 'Position management'],
    color: '#06B6D4'
  },
  {
    level: 4,
    name: 'Co-pilot',
    icon: '🚀',
    description: 'AVA executes small trades automatically within your limits',
    features: ['Auto-execution (small)', 'Stop-loss management', 'Profit taking'],
    color: '#F59E0B'
  },
  {
    level: 5,
    name: 'Autonomous',
    icon: '⚡',
    description: 'Full trading authority within your risk parameters',
    features: ['Full auto-trading', 'Portfolio management', 'Strategy execution'],
    color: '#10B981'
  }
]

export default function AVAMindOnboarding({ onComplete, onSkip }) {
  const [step, setStep] = useState(1)
  const [personality, setPersonality] = useState(DEFAULT_PERSONALITY)
  const [autonomyLevel, setAutonomyLevel] = useState(2)
  const [isAnimating, setIsAnimating] = useState(false)

  // Animate step transitions
  const goToStep = (newStep) => {
    setIsAnimating(true)
    setTimeout(() => {
      setStep(newStep)
      setIsAnimating(false)
    }, 200)
  }

  // Save and complete
  const handleComplete = () => {
    // Save personality
    localStorage.setItem('ava.mind.personality', JSON.stringify(personality))
    localStorage.setItem('ava.mind.autonomy', String(autonomyLevel))
    localStorage.setItem('ava.mind.onboarded', 'true')

    if (onComplete) {
      onComplete({ personality, autonomyLevel })
    }
  }

  // Skip onboarding
  const handleSkip = () => {
    localStorage.setItem('ava.mind.onboarded', 'true')
    if (onSkip) onSkip()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className={`
          w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800
          rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden
          transition-all duration-200
          ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between px-8 pt-6">
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  text-sm font-bold transition-all duration-300
                  ${step === s
                    ? 'bg-purple-500 text-white scale-110 shadow-lg shadow-purple-500/30'
                    : step > s
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
                  }
                `}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>

          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Step 1: Meet AVA */}
        {step === 1 && (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-4">
              {/* AVA Orb Animation */}
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-600/40 to-cyan-600/40" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-700 to-cyan-700 flex items-center justify-center">
                  <span className="text-5xl animate-float">🧠</span>
                </div>
                {/* Orbital rings */}
                <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-spin" style={{ animationDuration: '8s' }} />
                <div className="absolute inset-[-8px] rounded-full border border-cyan-500/10 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
              </div>

              <h2 className="text-3xl font-bold text-white">
                Meet <span className="bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">AVA Mind</span>
              </h2>

              <p className="text-lg text-slate-400 max-w-md mx-auto">
                Your AI Digital Twin that learns your trading style, thinks like you,
                and helps you trade smarter.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: '📊', title: 'Learns', desc: 'Studies your trading patterns' },
                { icon: '🎯', title: 'Predicts', desc: 'Anticipates what you\'d do' },
                { icon: '⚡', title: 'Executes', desc: 'Acts on your behalf' }
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center"
                >
                  <span className="text-3xl mb-2 block">{item.icon}</span>
                  <h4 className="text-white font-semibold">{item.title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={() => goToStep(2)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-500/20"
              >
                Let's Get Started →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Set Your Style */}
        {step === 2 && (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Define Your Trading Style</h2>
              <p className="text-slate-400">AVA will learn to think and trade like you</p>
            </div>

            {/* Risk Tolerance */}
            <div className="space-y-3">
              <label className="text-sm text-slate-400 font-medium">Risk Tolerance</label>
              <div className="grid grid-cols-3 gap-3">
                {RISK_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPersonality(p => ({ ...p, riskTolerance: option.value }))}
                    className={`
                      p-4 rounded-xl border transition-all text-left
                      ${personality.riskTolerance === option.value
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{option.icon}</span>
                      <span className="font-semibold text-white">{option.label}</span>
                    </div>
                    <p className="text-xs text-slate-400">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Trading Style */}
            <div className="space-y-3">
              <label className="text-sm text-slate-400 font-medium">Trading Style</label>
              <div className="grid grid-cols-2 gap-3">
                {STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPersonality(p => ({ ...p, tradingStyle: option.value }))}
                    className={`
                      p-4 rounded-xl border transition-all text-left
                      ${personality.tradingStyle === option.value
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{option.icon}</span>
                        <span className="font-semibold text-white">{option.label}</span>
                      </div>
                      <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                        {option.timeframe}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => goToStep(1)}
                className="px-6 py-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => goToStep(3)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:from-purple-500 hover:to-cyan-500 transition-all"
              >
                Choose Autonomy Level →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Choose Autonomy */}
        {step === 3 && (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">How Much Control?</h2>
              <p className="text-slate-400">You can change this anytime</p>
            </div>

            <div className="space-y-3">
              {AUTONOMY_LEVELS.map((level) => (
                <button
                  key={level.level}
                  onClick={() => setAutonomyLevel(level.level)}
                  className={`
                    w-full p-4 rounded-xl border transition-all text-left
                    ${autonomyLevel === level.level
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${level.color}20` }}
                    >
                      {level.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{level.name}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${level.color}20`,
                            color: level.color
                          }}
                        >
                          Level {level.level}
                        </span>
                        {level.level >= 4 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                            Auto-execute
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{level.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {level.features.map((feature, i) => (
                          <span
                            key={i}
                            className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    {autonomyLevel === level.level && (
                      <div className="text-emerald-400 text-xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {autonomyLevel >= 4 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <span className="text-amber-400 text-xl">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-amber-300">Auto-Execution Warning</h4>
                    <p className="text-sm text-amber-400/80 mt-1">
                      At this level, AVA can execute trades automatically within your limits.
                      You can always pause or reduce the autonomy level at any time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => goToStep(2)}
                className="px-6 py-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold hover:from-emerald-500 hover:to-cyan-500 transition-all"
              >
                Complete Setup ✨
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Hook to check if user has completed onboarding
export function useAVAMindOnboarding() {
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('ava.mind.onboarded')
    setNeedsOnboarding(!hasOnboarded)
  }, [])

  const resetOnboarding = () => {
    localStorage.removeItem('ava.mind.onboarded')
    setNeedsOnboarding(true)
  }

  const completeOnboarding = () => {
    localStorage.setItem('ava.mind.onboarded', 'true')
    setNeedsOnboarding(false)
  }

  return { needsOnboarding, resetOnboarding, completeOnboarding }
}
