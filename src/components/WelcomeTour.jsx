/**
 * Welcome Tour Component
 * Interactive onboarding for new users
 * Shows once on first visit, can be restarted via help button
 */

import { useState, useEffect } from 'react'

const TOUR_STEPS = [
  {
    title: 'Welcome to iAVA.ai! 🦄',
    description: 'Your AI-powered Unicorn signal detector. This quick tour will show you around.',
    position: 'center',
    highlight: null
  },
  {
    title: 'Navigation Tabs',
    description: 'Switch between Trading Chart, AI Dashboard (12 features), AI Chat, NLP Scanner, and System Health.',
    position: 'top',
    highlight: 'nav'
  },
  {
    title: 'Feature Status Badge',
    description: 'This badge shows how many AI features are active (9 client-side + 3 API-powered). Click to see details.',
    position: 'top',
    highlight: 'badge'
  },
  {
    title: 'Symbol & Timeframe',
    description: 'Enter a symbol (e.g., SPY, AAPL) and select timeframe to load chart data. The AI will analyze it automatically.',
    position: 'top',
    highlight: 'controls'
  },
  {
    title: 'Unicorn Detection',
    description: 'When all 4 indicators align perfectly (SATY, Ripster, Ichimoku, TTM Squeeze), you get a rare Unicorn signal! 🦄',
    position: 'center',
    highlight: null
  },
  {
    title: 'AI Analysis Panel',
    description: '12 AI features analyze every signal: Quality Score, Predictive Confidence, Market Regime, Risk Analysis, and more.',
    position: 'bottom',
    highlight: 'ai-panel'
  },
  {
    title: 'You\'re All Set! 🎉',
    description: 'Start by loading a symbol like SPY or QQQ. Lower the threshold slider to see more signals. Happy trading!',
    position: 'center',
    highlight: null
  }
]

export default function WelcomeTour({ onClose, forceShow = false }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has completed tour
    const hasCompletedTour = localStorage.getItem('iava_tour_completed')

    if (forceShow || !hasCompletedTour) {
      // Show tour after a brief delay
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [forceShow])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem('iava_tour_completed', 'true')
    setIsVisible(false)
    if (onClose) onClose()
  }

  if (!isVisible) return null

  const step = TOUR_STEPS[currentStep]
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Premium Overlay */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />

      {/* Premium Tour Card */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-3xl opacity-30 rounded-2xl" />

          {/* Card content */}
          <div className="relative glass-panel overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

            <div className="relative p-8 space-y-5">
              {/* Premium Progress Bar */}
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 transition-all duration-500 shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
                  {step.title}
                </h3>
                <p className="text-base text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Premium Step Indicator */}
              <div className="flex items-center justify-center gap-2 pt-3">
                {TOUR_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep
                        ? 'w-10 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/50'
                        : idx < currentStep
                        ? 'w-2 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/50'
                        : 'w-2 bg-slate-700/50'
                    }`}
                  />
                ))}
              </div>

              {/* Premium Actions */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={handleSkip}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Close' : 'Skip Tour'}
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-semibold">
                    {currentStep + 1} / {TOUR_STEPS.length}
                  </span>
                  <button
                    onClick={handleNext}
                    className="relative group px-6 py-2.5 rounded-xl text-sm font-bold overflow-hidden shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-cyan-500 transition-all" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
                    <span className="relative text-white flex items-center gap-2">
                      {currentStep === TOUR_STEPS.length - 1 ? (
                        <>
                          <span>Get Started</span>
                          <span className="text-base">🚀</span>
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <span className="text-base">→</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hint Arrow (for specific highlights) */}
        {step.highlight && step.position !== 'center' && (
          <div className={`absolute ${
            step.position === 'top' ? 'bottom-full mb-4' :
            step.position === 'bottom' ? 'top-full mt-4' :
            ''
          } left-1/2 -translate-x-1/2`}>
            <div className={`text-indigo-400 text-4xl ${
              step.position === 'top' ? '' : 'rotate-180'
            }`}>
              ↓
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Premium Help Button - Allows users to restart tour
 */
export function TourHelpButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 group z-40"
      title="Restart Tour"
    >
      {/* Button glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 blur-xl opacity-50 group-hover:opacity-70 rounded-full transition-opacity" />

      {/* Button content */}
      <div className="relative w-full h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 rounded-full shadow-2xl flex items-center justify-center text-2xl font-bold text-white transition-all hover:scale-110">
        ?
      </div>
    </button>
  )
}
