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
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />

      {/* Tour Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel p-6 space-y-4">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-200">
              {step.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-8 bg-indigo-500'
                    : idx < currentStep
                    ? 'w-1.5 bg-emerald-500'
                    : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Close' : 'Skip Tour'}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/30"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
              </button>
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
 * Help Button - Allows users to restart tour
 */
export function TourHelpButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-xl font-bold transition-all hover:scale-110 z-40"
      title="Restart Tour"
    >
      ?
    </button>
  )
}
