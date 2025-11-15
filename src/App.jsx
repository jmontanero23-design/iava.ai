/**
 * Main App Router - Tabs for Chart + AI Features
 * Preserves ALL original functionality
 */

import { useState, useEffect } from 'react'
import Hero from './components/Hero.jsx'
import ToastHub from './components/ToastHub.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'
import { MarketDataProvider } from './contexts/MarketDataContext.jsx'
import AIFeaturesDashboard from './components/AIFeaturesDashboard.jsx'
import AIChat from './components/AIChat.jsx'
import NaturalLanguageScanner from './components/NaturalLanguageScanner.jsx'
import ModelMonitoring from './components/ModelMonitoring.jsx'
import FeatureStatusBadge from './components/FeatureStatusBadge.jsx'
import WelcomeTour, { TourHelpButton } from './components/WelcomeTour.jsx'
import SignalQualityScorerPanel from './components/SignalQualityScorerPanel.jsx'
import RiskAdvisorPanel from './components/RiskAdvisorPanel.jsx'
import TradeJournalAIPanel from './components/TradeJournalAIPanel.jsx'
import MarketRegimeDetectorPanel from './components/MarketRegimeDetectorPanel.jsx'
import AnomalyDetectorPanel from './components/AnomalyDetectorPanel.jsx'
import MultiTimeframeAnalystPanel from './components/MultiTimeframeAnalystPanel.jsx'
import SmartWatchlistBuilderPanel from './components/SmartWatchlistBuilderPanel.jsx'
import PredictiveConfidencePanel from './components/PredictiveConfidencePanel.jsx'
import PersonalizedLearningPanel from './components/PersonalizedLearningPanel.jsx'
import GeneticOptimizerPanel from './components/GeneticOptimizerPanel.jsx'

// Import the full original trading chart app
import AppChart from './AppChart.jsx'

export default function App() {
  const [activeTab, setActiveTab] = useState('chart')
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [showTour, setShowTour] = useState(false)

  // Keyboard shortcuts for elite UX
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger if not typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Cmd/Ctrl + K for Command Palette (common pattern)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('iava.toggleCommandPalette'))
        return
      }

      // Number keys (1-5) to switch tabs
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        const tabs = ['chart', 'ai-features', 'ai-chat', 'monitoring', 'nlp-scanner']
        setActiveTab(tabs[parseInt(e.key) - 1])
      }

      // Alt+C for Chart
      if (e.altKey && e.key === 'c') {
        e.preventDefault()
        setActiveTab('chart')
      }

      // Alt+A for AI Features
      if (e.altKey && e.key === 'a') {
        e.preventDefault()
        setActiveTab('ai-features')
      }

      // Alt+T for AI Chat
      if (e.altKey && e.key === 't') {
        e.preventDefault()
        setActiveTab('ai-chat')
      }

      // ? for help/tour
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault()
        setShowTour(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Handle feature selection from dashboard - ALL 12 features supported
  const handleFeatureSelect = (featureId) => {
    setSelectedFeature(featureId)
    // Map ALL feature IDs to their dedicated tab names
    const featureTabMap = {
      'ai_chat': 'ai-chat',
      'nlp_scanner': 'nlp-scanner',
      'signal_quality': 'signal-quality',
      'predictive_confidence': 'predictive-confidence',
      'market_regime': 'market-regime',
      'smart_watchlist': 'smart-watchlist',
      'risk_advisor': 'risk-advisor',
      'anomaly_detector': 'anomaly-detector',
      'multi_timeframe': 'multi-timeframe',
      'trade_journal': 'trade-journal',
      'personalized_learning': 'personalized-learning',
      'genetic_optimizer': 'genetic-optimizer'
    }

    if (featureTabMap[featureId]) {
      setActiveTab(featureTabMap[featureId])
    } else {
      // Show feature in dashboard context
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: {
          text: `${featureId.replace(/_/g, ' ').toUpperCase()} - Feature active! Check trading chart.`,
          type: 'success'
        }
      }))
    }
  }

  return (
    <MarketDataProvider>
      <div className="min-h-screen bg-transparent text-slate-100 bg-grid">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Hero />

        {/* Tab Navigation with Logo */}
        <nav className="glass-panel p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 glow-on-hover touch-ripple ${
                activeTab === 'chart'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              title="Trading Chart (Alt+C or press 1)"
              aria-label="Switch to Trading Chart tab"
            >
              <img src="/logo.svg" className="w-6 h-6 scale-hover" alt="" />
              <span>Trading Chart</span>
              <kbd className="hidden md:inline-block text-xs opacity-50 px-1.5 py-0.5 bg-slate-900/50 rounded border border-slate-700">1</kbd>
            </button>
            <button
              onClick={() => setActiveTab('ai-features')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 glow-on-hover touch-ripple ${
                activeTab === 'ai-features'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              title="AI Dashboard with 12 Features (Alt+A or press 2)"
              aria-label="Switch to AI Dashboard tab"
            >
              <img src="/logo.svg" className="w-6 h-6 scale-hover" alt="" />
              <span>AI Dashboard (12 Features)</span>
              <kbd className="hidden md:inline-block text-xs opacity-50 px-1.5 py-0.5 bg-slate-900/50 rounded border border-slate-700">2</kbd>
            </button>
            <button
              onClick={() => setActiveTab('ai-chat')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 glow-on-hover touch-ripple ${
                activeTab === 'ai-chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              title="AI Chat Assistant (Alt+T or press 3)"
              aria-label="Switch to AI Chat tab"
            >
              <img src="/logo.svg" className="w-6 h-6 scale-hover" alt="" />
              <span>AI Chat</span>
              <kbd className="hidden md:inline-block text-xs opacity-50 px-1.5 py-0.5 bg-slate-900/50 rounded border border-slate-700">3</kbd>
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 glow-on-hover touch-ripple ${
                activeTab === 'monitoring'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              title="System Health Monitoring (Press 4)"
              aria-label="Switch to System Health tab"
            >
              <img src="/logo.svg" className="w-6 h-6 scale-hover" alt="" />
              <span>System Health</span>
              <kbd className="hidden md:inline-block text-xs opacity-50 px-1.5 py-0.5 bg-slate-900/50 rounded border border-slate-700">4</kbd>
            </button>
            <button
              onClick={() => setActiveTab('nlp-scanner')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 glow-on-hover touch-ripple ${
                activeTab === 'nlp-scanner'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              title="Natural Language Scanner (Press 5)"
              aria-label="Switch to NLP Scanner tab"
            >
              <img src="/logo.svg" className="w-6 h-6 scale-hover" alt="" />
              <span>NLP Scanner</span>
              <kbd className="hidden md:inline-block text-xs opacity-50 px-1.5 py-0.5 bg-slate-900/50 rounded border border-slate-700">5</kbd>
            </button>

            {/* Feature Status Badge - Always visible on right side */}
            <div className="ml-auto">
              <FeatureStatusBadge onClick={() => setActiveTab('ai-features')} />
            </div>
          </div>
        </nav>

        {/* Tab Content */}
        {activeTab === 'chart' && (
          <AppChart />
        )}

        {activeTab === 'ai-features' && (
          <AIFeaturesDashboard onFeatureSelect={handleFeatureSelect} />
        )}

        {activeTab === 'ai-chat' && (
          <AIChat />
        )}

        {activeTab === 'nlp-scanner' && (
          <NaturalLanguageScanner />
        )}

        {activeTab === 'monitoring' && (
          <ModelMonitoring />
        )}

        {activeTab === 'signal-quality' && (
          <SignalQualityScorerPanel />
        )}

        {activeTab === 'risk-advisor' && (
          <RiskAdvisorPanel />
        )}

        {activeTab === 'trade-journal' && (
          <TradeJournalAIPanel />
        )}

        {activeTab === 'market-regime' && (
          <MarketRegimeDetectorPanel />
        )}

        {activeTab === 'anomaly-detector' && (
          <AnomalyDetectorPanel />
        )}

        {activeTab === 'multi-timeframe' && (
          <MultiTimeframeAnalystPanel />
        )}

        {activeTab === 'smart-watchlist' && (
          <SmartWatchlistBuilderPanel />
        )}

        {activeTab === 'predictive-confidence' && (
          <PredictiveConfidencePanel />
        )}

        {activeTab === 'personalized-learning' && (
          <PersonalizedLearningPanel />
        )}

        {activeTab === 'genetic-optimizer' && (
          <GeneticOptimizerPanel />
        )}

        {activeTab !== 'chart' && <BuildInfoFooter />}
        </div>

        {/* Welcome Tour for new users */}
        <WelcomeTour forceShow={showTour} onClose={() => setShowTour(false)} />

        {/* Help button to restart tour */}
        <TourHelpButton onClick={() => setShowTour(true)} />

        <ToastHub />
      </div>
    </MarketDataProvider>
  )
}
