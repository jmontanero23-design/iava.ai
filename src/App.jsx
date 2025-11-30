/**
 * Main App Router - Elite 2025 Edition
 * Professional layout with sidebar + topbar navigation
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
import EmotionalStateBadge from './components/EmotionalStateBadge.jsx'
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
import TrustModeBanner from './components/TrustModeBanner.jsx'

// Elite 2025 Layout Components
import CollapsibleSidebar from './components/CollapsibleSidebar.jsx'
import TopBar from './components/layout/TopBar.jsx'
import UnicornScoreOverlay from './components/UnicornScoreOverlay.jsx'

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
      {/* Global Trust Mode Banner - shows when AVA is trading autonomously */}
      <TrustModeBanner
        onNavigateToSafety={() => {
          setActiveTab('ava-mind')
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('ava.openSafety'))
          }, 100)
        }}
      />

      {/* Elite 2025 Layout: TopBar + Sidebar + Content */}
      <div className="min-h-screen text-slate-100">
        {/* TopBar - Fixed at top */}
        <TopBar
          currentSymbol={symbol}
          onSymbolChange={(newSymbol) => {
            window.dispatchEvent(new CustomEvent('iava.loadSymbol', {
              detail: { symbol: newSymbol }
            }))
          }}
        />

        {/* Sidebar - Desktop only (hidden on mobile via CSS) */}
        <CollapsibleSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content Area */}
        <div
          className="pt-14 md:ml-56 transition-all duration-300 min-h-screen"
          style={{ background: 'var(--bg-base)' }}
        >
          <div className="p-4 md:p-6 pb-24 md:pb-6 space-y-4">

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

        {/* Unicorn Score Overlay - Shows score on chart view */}
        {activeTab === 'chart' && (
          <UnicornScoreOverlay className="hidden md:block" />
        )}

        {/* Social Trading Rooms */}
        {showSocialRooms && (
          <SocialTradingRooms onClose={() => setShowSocialRooms(false)} />
        )}

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </MobileGestures>
  )
}
