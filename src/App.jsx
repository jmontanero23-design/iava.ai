/**
 * Main App Router - LEGENDARY Edition
 * Responsive layout: Desktop 4-column grid / Mobile 5-tab navigation
 *
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html & iAVA-ULTIMATE-LEGENDARY-MOBILE.html
 */

import { useState, useEffect } from 'react'
import ToastHub from './components/ToastHub.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'
import { MarketDataProvider, useMarketData } from './contexts/MarketDataContext.jsx'
import MobileGestures from './components/MobileGestures.jsx'
import AIHub from './components/AIHub.jsx'
import Portfolio from './components/Portfolio.jsx'
import AVAMindDashboard from './components/ava-mind/AVAMindDashboard.jsx'
import SocialTradingRooms from './components/SocialTradingRooms.jsx'
import NaturalLanguageScanner from './components/NaturalLanguageScanner.jsx'
import DiscoverTab from './components/DiscoverTab.jsx'
import WelcomeTour, { TourHelpButton } from './components/WelcomeTour.jsx'
import AITradeCopilot from './components/AITradeCopilot.jsx'
import MobileBottomNav from './components/MobileBottomNav.jsx'
import TrustModeBanner from './components/TrustModeBanner.jsx'

// LEGENDARY Layout Components
import LegendaryLayout from './components/layout/LegendaryLayout.jsx'
import IconRail from './components/layout/IconRail.jsx'
import WatchlistPanel from './components/layout/WatchlistPanel.jsx'
import AIPanel from './components/layout/AIPanel.jsx'
import TopBar from './components/layout/TopBar.jsx'
import UnicornScoreOverlay from './components/UnicornScoreOverlay.jsx'

// Import the full original trading chart app
import AppChart from './AppChart.jsx'

// Design tokens
import { colors } from './styles/tokens'


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

// Inner component that has access to market data and uses LEGENDARY layout
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

  // Handle symbol selection from watchlist
  const handleSelectSymbol = (newSymbol) => {
    window.dispatchEvent(new CustomEvent('iava.loadSymbol', {
      detail: { symbol: newSymbol }
    }))
    setActiveTab('chart')
  }

  // Main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'chart':
        return <AppChart />
      case 'ai-hub':
        return <AIHub />
      case 'discover':
        return <DiscoverTab onSelectSymbol={handleSelectSymbol} />
      case 'scanner':
        return <NaturalLanguageScanner />
      case 'portfolio':
        return <Portfolio />
      case 'ava-mind':
        return (
          <div style={{
            background: colors.glass.bg,
            borderRadius: 16,
            overflow: 'hidden',
            minHeight: 'calc(100vh - 120px)',
          }}>
            <AVAMindDashboard
              onViewSymbol={(sym) => {
                handleSelectSymbol(sym)
              }}
            />
          </div>
        )
      default:
        return <AppChart />
    }
  }

  return (
    <MobileGestures
      symbol={symbol}
      onSwipeLeft={() => {
        const tabs = ['chart', 'discover', 'ai-hub', 'portfolio', 'ava-mind']
        const currentIndex = tabs.indexOf(activeTab)
        const nextIndex = (currentIndex + 1) % tabs.length
        setActiveTab(tabs[nextIndex])
      }}
      onSwipeRight={() => {
        const tabs = ['chart', 'discover', 'ai-hub', 'portfolio', 'ava-mind']
        const currentIndex = tabs.indexOf(activeTab)
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
        setActiveTab(tabs[prevIndex])
      }}
    >
      {/* Global Trust Mode Banner */}
      <TrustModeBanner
        onNavigateToSafety={() => {
          setActiveTab('ava-mind')
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('ava.openSafety'))
          }, 100)
        }}
      />

      {/* LEGENDARY Layout */}
      <LegendaryLayout
        topBar={
          <TopBar
            currentSymbol={symbol}
            onSymbolChange={handleSelectSymbol}
          />
        }
        iconRail={
          <IconRail
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
        watchlistPanel={
          <WatchlistPanel
            currentSymbol={symbol}
            onSelectSymbol={handleSelectSymbol}
          />
        }
        aiPanel={
          <AIPanel
            symbol={symbol}
            score={87}
          />
        }
        bottomNav={
          <MobileBottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
        showPanels={{
          watchlist: activeTab === 'chart' || activeTab === 'discover',
          ai: activeTab === 'chart',
        }}
      >
        {/* Main Content */}
        <div style={{ padding: 16, minHeight: '100%' }}>
          {renderContent()}
          {activeTab !== 'chart' && <BuildInfoFooter />}
        </div>
      </LegendaryLayout>

      {/* Welcome Tour */}
      <WelcomeTour forceShow={showTour} onClose={() => setShowTour(false)} />
      <TourHelpButton onClick={() => setShowTour(true)} />

      {/* Toast Notifications */}
      <ToastHub />

      {/* AI Trade Copilot */}
      {showCopilot && activeTab === 'chart' && (
        <AITradeCopilot onClose={() => setShowCopilot(false)} />
      )}

      {/* Social Trading Rooms */}
      {showSocialRooms && (
        <SocialTradingRooms onClose={() => setShowSocialRooms(false)} />
      )}
    </MobileGestures>
  )
}
