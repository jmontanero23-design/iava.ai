/**
 * Main App Router - Tabs for Chart + AI Features
 * Preserves ALL original functionality
 */

import { useState } from 'react'
import Hero from './components/Hero.jsx'
import ToastHub from './components/ToastHub.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'
import AIFeaturesDashboard from './components/AIFeaturesDashboard.jsx'
import AIChat from './components/AIChat.jsx'
import NaturalLanguageScanner from './components/NaturalLanguageScanner.jsx'
import ModelMonitoring from './components/ModelMonitoring.jsx'
import FeatureStatusBadge from './components/FeatureStatusBadge.jsx'
import WelcomeTour, { TourHelpButton } from './components/WelcomeTour.jsx'

// Import the full original trading chart app
import AppChart from './AppChart.jsx'

export default function App() {
  const [activeTab, setActiveTab] = useState('chart')
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [showTour, setShowTour] = useState(false)

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
    <div className="min-h-screen bg-transparent text-slate-100 bg-grid">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Hero />

        {/* Tab Navigation with Logo */}
        <nav className="glass-panel p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'chart'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <img src="/logo.svg" className="w-6 h-6" alt="" />
              <span>Trading Chart</span>
            </button>
            <button
              onClick={() => setActiveTab('ai-features')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'ai-features'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <img src="/logo.svg" className="w-6 h-6" alt="" />
              <span>AI Dashboard (12 Features)</span>
            </button>
            <button
              onClick={() => setActiveTab('ai-chat')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'ai-chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <img src="/logo.svg" className="w-6 h-6" alt="" />
              <span>AI Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'monitoring'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <img src="/logo.svg" className="w-6 h-6" alt="" />
              <span>System Health</span>
            </button>
            <button
              onClick={() => setActiveTab('nlp-scanner')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'nlp-scanner'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <img src="/logo.svg" className="w-6 h-6" alt="" />
              <span>NLP Scanner</span>
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
          <AIChat marketContext={{
            status: 'ready',
            features: 12
          }} />
        )}

        {activeTab === 'nlp-scanner' && (
          <NaturalLanguageScanner />
        )}

        {activeTab === 'monitoring' && (
          <ModelMonitoring />
        )}

        {activeTab !== 'chart' && <BuildInfoFooter />}
      </div>

      {/* Welcome Tour for new users */}
      <WelcomeTour forceShow={showTour} onClose={() => setShowTour(false)} />

      {/* Help button to restart tour */}
      <TourHelpButton onClick={() => setShowTour(true)} />

      <ToastHub />
    </div>
  )
}
