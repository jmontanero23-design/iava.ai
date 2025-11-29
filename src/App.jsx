/**
 * Main App Router - Tabs for Chart + AI Features
 * Preserves ALL original functionality
 */

import { useState, useEffect } from 'react'
import Hero from './components/Hero.jsx'
import ToastHub from './components/ToastHub.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'
import { MarketDataProvider, useMarketData } from './contexts/MarketDataContext.jsx'
import AIFeaturesDashboard from './components/AIFeaturesDashboard.jsx'
import MobileGestures from './components/MobileGestures.jsx'
import AIHub from './components/AIHub.jsx'
import Portfolio from './components/Portfolio.jsx'
import AIChat from './components/AIChat.jsx'
import AVAMind from './components/AVAMind.jsx'
import AVAMindDashboard from './components/ava-mind/AVAMindDashboard.jsx'
import SocialTradingRooms from './components/SocialTradingRooms.jsx'
import NaturalLanguageScanner from './components/NaturalLanguageScanner.jsx'
import ModelMonitoring from './components/ModelMonitoring.jsx'
import FeatureStatusBadge from './components/FeatureStatusBadge.jsx'
import WelcomeTour, { TourHelpButton } from './components/WelcomeTour.jsx'
import ModeToggle from './components/ModeToggle.jsx'
import EnhancedStatusBar from './components/EnhancedStatusBar.jsx'
import UserProfile from './components/UserProfile.jsx'
import SignalQualityScorerPanel from './components/SignalQualityScorerPanel.jsx'
import RiskAdvisorPanel from './components/RiskAdvisorPanel.jsx'
import TradeJournalAIPanel from './components/TradeJournalAIPanel.jsx'
import MarketRegimeDetectorPanel from './components/MarketRegimeDetectorPanel.jsx'
import AnomalyDetectorPanel from './components/AnomalyDetectorPanel.jsx'
import SmartWatchlistBuilderPanel from './components/SmartWatchlistBuilderPanel.jsx'
import PredictiveConfidencePanel from './components/PredictiveConfidencePanel.jsx'
import PersonalizedLearningPanel from './components/PersonalizedLearningPanel.jsx'
import GeneticOptimizerPanel from './components/GeneticOptimizerPanel.jsx'
import MarketSentiment from './components/MarketSentiment.jsx'
import AITradeCopilot from './components/AITradeCopilot.jsx'
import PatternRecognition from './components/PatternRecognition.jsx'
import MultiSymbolAnalysis from './components/MultiSymbolAnalysis.jsx'
import StrategyBuilder from './components/StrategyBuilder.jsx'
import RiskControlsPanel from './components/RiskControlsPanel.jsx'
import MultiTimeframePanel from './components/MultiTimeframePanel.jsx'
import ChronosForecast from './components/ChronosForecast.jsx'
import AIChatDemo from './pages/AIChatDemo.jsx'
import MobileBottomNav from './components/MobileBottomNav.jsx'

// Import the full original trading chart app
import AppChart from './AppChart.jsx'

// Wrapper component for Multi-TF Panel that needs market data
function MultiTFPanelWrapper({ setActiveTab }) {
  const { marketData } = useMarketData()
  const symbol = marketData.symbol || 'SPY'

  return (
    <MultiTimeframePanel
      symbol={symbol}
      onLoadTimeframe={(tf) => {
        // Load timeframe on chart
        window.dispatchEvent(new CustomEvent('iava.loadTimeframe', {
          detail: { timeframe: tf }
        }))
        // Switch to chart tab
        setActiveTab('chart')
      }}
    />
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('chart')
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [showTour, setShowTour] = useState(false)
  const [showCopilot, setShowCopilot] = useState(true) // AI Copilot visible by default
  const [showAVAMind, setShowAVAMind] = useState(false) // AVA Mind AI Twin
  const [showSocialRooms, setShowSocialRooms] = useState(false) // Social Trading Rooms

  // CRITICAL FIX: Listen for symbol loading from AI Chat
  useEffect(() => {
    let lastSymbol = null
    let lastDispatch = 0
    const DEBOUNCE_MS = 500 // Prevent duplicate events within 500ms

    const handleLoadSymbol = (event) => {
      const { symbol, timeframe, _forwarded } = event.detail || {}

      // Ignore events we've already forwarded to prevent infinite loop
      if (_forwarded) return

      // Debounce: Ignore duplicate requests for the same symbol within 500ms
      const now = Date.now()
      if (symbol === lastSymbol && (now - lastDispatch) < DEBOUNCE_MS) {
        return
      }

      lastSymbol = symbol
      lastDispatch = now

      if (symbol) {
        // Switch to chart tab so symbol can load
        setActiveTab('chart')

        // Give chart time to mount, then dispatch event again with forwarded flag
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('iava.loadSymbol', {
            detail: { symbol, timeframe, _forwarded: true }
          }))
        }, 100)
      }
    }

    window.addEventListener('iava.loadSymbol', handleLoadSymbol)
    return () => window.removeEventListener('iava.loadSymbol', handleLoadSymbol)
  }, [])

  // Listen for tab navigation events (from voice commands, etc.)
  useEffect(() => {
    const handleSetActiveTab = (event) => {
      const { tab } = event.detail || {}
      if (tab) {
        // Map special tabs to valid tabs
        const tabMap = {
          'forecast': 'ai-hub', // Forecast is part of AI Hub
          'chat': 'ai-hub',
          'copilot': 'chart', // Copilot is on chart view
        }
        setActiveTab(tabMap[tab] || tab)
      }
    }

    window.addEventListener('iava.setActiveTab', handleSetActiveTab)
    return () => window.removeEventListener('iava.setActiveTab', handleSetActiveTab)
  }, [])

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
        const tabs = ['chart', 'ai-hub', 'scanner', 'portfolio', 'ava-mind']
        setActiveTab(tabs[parseInt(e.key) - 1])
      }

      // Alt+C for Chart
      if (e.altKey && e.key === 'c') {
        e.preventDefault()
        setActiveTab('chart')
      }

      // Alt+A for AI Hub
      if (e.altKey && e.key === 'a') {
        e.preventDefault()
        setActiveTab('ai-hub')
      }

      // Alt+S for Scanner
      if (e.altKey && e.key === 's') {
        e.preventDefault()
        setActiveTab('scanner')
      }

      // Alt+P for Portfolio
      if (e.altKey && e.key === 'p') {
        e.preventDefault()
        setActiveTab('portfolio')
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

  // Event listeners for Special Features (AVA Mind, Social Rooms)
  useEffect(() => {
    const handleToggleAVAMind = () => {
      setShowAVAMind(prev => !prev)
    }

    const handleToggleSocialRooms = () => {
      setShowSocialRooms(prev => !prev)
    }

    window.addEventListener('iava.toggleAVAMind', handleToggleAVAMind)
    window.addEventListener('iava.toggleSocialRooms', handleToggleSocialRooms)

    return () => {
      window.removeEventListener('iava.toggleAVAMind', handleToggleAVAMind)
      window.removeEventListener('iava.toggleSocialRooms', handleToggleSocialRooms)
    }
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
      'genetic_optimizer': 'genetic-optimizer',
      'pattern_recognition': 'pattern-recognition',
      'market_sentiment': 'market-sentiment',
      'multi_symbol': 'multi-symbol',
      'strategy_builder': 'strategy-builder'
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
      <AppWithGestures
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedFeature={selectedFeature}
        setSelectedFeature={setSelectedFeature}
        showTour={showTour}
        setShowTour={setShowTour}
        showCopilot={showCopilot}
        setShowCopilot={setShowCopilot}
        showAVAMind={showAVAMind}
        setShowAVAMind={setShowAVAMind}
        showSocialRooms={showSocialRooms}
        setShowSocialRooms={setShowSocialRooms}
        handleFeatureSelect={handleFeatureSelect}
      />
    </MarketDataProvider>
  )
}

// Inner component that has access to market data and can use MobileGestures
function AppWithGestures({
  activeTab,
  setActiveTab,
  selectedFeature,
  setSelectedFeature,
  showTour,
  setShowTour,
  showCopilot,
  setShowCopilot,
  showAVAMind,
  setShowAVAMind,
  showSocialRooms,
  setShowSocialRooms,
  handleFeatureSelect
}) {
  const { marketData } = useMarketData()
  const symbol = marketData?.symbol || 'SPY'

  return (
    <MobileGestures
      symbol={symbol}
      onSwipeLeft={() => {
        const tabs = ['chart', 'ai-hub', 'scanner', 'portfolio', 'ava-mind']
        const currentIndex = tabs.indexOf(activeTab)
        const nextIndex = (currentIndex + 1) % tabs.length
        setActiveTab(tabs[nextIndex])
      }}
      onSwipeRight={() => {
        const tabs = ['chart', 'ai-hub', 'scanner', 'portfolio', 'ava-mind']
        const currentIndex = tabs.indexOf(activeTab)
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
        setActiveTab(tabs[prevIndex])
      }}
    >
      <div className="min-h-screen bg-transparent text-slate-100 bg-grid">
        <div className="max-w-7xl mx-auto p-6 space-y-6 pb-16">
          <Hero />

        {/* Streamlined Navigation - 4 Main Views */}
        <nav className="glass-panel p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'chart'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
              title="Trading Chart (⌘1)"
            >
              <span className="text-lg">📊</span>
              <span>Chart</span>
              <kbd className="hidden md:inline text-xs opacity-60 ml-1">⌘1</kbd>
            </button>
            <button
              onClick={() => setActiveTab('ai-hub')}
              className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'ai-hub'
                  ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/20'
                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
              title="AI Command Center (⌘2)"
            >
              <span className="text-lg">🤖</span>
              <span>AI Hub</span>
              <kbd className="hidden md:inline text-xs opacity-60 ml-1">⌘2</kbd>
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'scanner' || activeTab === 'nlp-scanner'
                  ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-300 border border-teal-500/30 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
              title="Market Scanner (⌘3)"
            >
              <span className="text-lg">🔍</span>
              <span>Scanner</span>
              <kbd className="hidden md:inline text-xs opacity-60 ml-1">⌘3</kbd>
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'portfolio'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
              title="Portfolio & Journal (⌘4)"
            >
              <span className="text-lg">💼</span>
              <span>Portfolio</span>
              <kbd className="hidden md:inline text-xs opacity-60 ml-1">⌘4</kbd>
            </button>
            <button
              onClick={() => setActiveTab('ava-mind')}
              className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'ava-mind'
                  ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/20'
                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
              title="AVA Mind - AI Twin (⌘5)"
            >
              <span className="text-lg">🧠</span>
              <span>AVA Mind</span>
              <kbd className="hidden md:inline text-xs opacity-60 ml-1">⌘5</kbd>
            </button>

            {/* AI Chat Demo Button - NEW! */}
            <button
              onClick={() => setActiveTab('ai-demo')}
              className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                activeTab === 'ai-demo'
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30 shadow-lg shadow-yellow-500/20 animate-pulse'
                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
              title="AI Chat Streaming Demo - Try the NEW streaming chat!"
            >
              <span className="text-lg">✨</span>
              <span>AI Demo</span>
              <span className="ml-1 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold">NEW</span>
            </button>

            {/* Next-Gen Features */}
            <div className="ml-auto flex items-center gap-2">

              {/* AI Coach Quick Access */}
              <button
                onClick={() => {
                  setActiveTab('ava-mind')
                  // Open coach tab in AVA Mind
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('ava.openCoach'))
                  }, 100)
                }}
                className="p-2.5 rounded-lg transition-all bg-slate-800/30 text-slate-400 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-orange-500/20 hover:text-amber-300 hover:border hover:border-amber-500/30"
                title="AI Trading Coach - Get personalized coaching"
              >
                <span className="text-lg">🎓</span>
              </button>

              {/* Social Rooms Button */}
              <button
                onClick={() => setShowSocialRooms(!showSocialRooms)}
                className={`p-2.5 rounded-lg transition-all ${
                  showSocialRooms
                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/40 hover:text-cyan-300'
                }`}
                title="Social Trading Rooms"
              >
                <span className="text-lg">👥</span>
              </button>

              <div className="w-px h-8 bg-slate-700"></div>

              <ModeToggle />
              <FeatureStatusBadge onClick={() => setActiveTab('ai-features')} />
              <UserProfile />
            </div>
          </div>
        </nav>

        {/* Tab Content */}
        {activeTab === 'chart' && (
          <AppChart />
        )}

        {activeTab === 'ai-hub' && (
          <AIHub />
        )}

        {activeTab === 'scanner' && (
          <NaturalLanguageScanner />
        )}

        {activeTab === 'portfolio' && (
          <Portfolio />
        )}

        {activeTab === 'ava-mind' && (
          <div className="glass-panel -mx-6 -mt-6 overflow-hidden" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <AVAMindDashboard
              onViewSymbol={(symbol) => {
                window.dispatchEvent(new CustomEvent('iava.loadSymbol', {
                  detail: { symbol }
                }))
                setActiveTab('chart')
              }}
            />
          </div>
        )}

        {activeTab === 'ai-demo' && (
          <AIChatDemo />
        )}

        {activeTab !== 'chart' && <BuildInfoFooter />}
        </div>

        {/* Welcome Tour for new users */}
        <WelcomeTour forceShow={showTour} onClose={() => setShowTour(false)} />

        {/* Help button to restart tour */}
        <TourHelpButton onClick={() => setShowTour(true)} />

        <ToastHub />

        {/* AI Trade Copilot - Proactive position monitoring */}
        {showCopilot && activeTab === 'chart' && (
          <AITradeCopilot onClose={() => setShowCopilot(false)} />
        )}


        {/* Social Trading Rooms */}
        {showSocialRooms && (
          <SocialTradingRooms onClose={() => setShowSocialRooms(false)} />
        )}

        {/* Enhanced Status Bar - Fixed at bottom (desktop) */}
        <EnhancedStatusBar />

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </MobileGestures>
  )
}
