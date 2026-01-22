/**
 * Main App Router - LEGENDARY Edition
 * Responsive layout: Desktop 4-column grid / Mobile 5-tab navigation
 *
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html & iAVA-ULTIMATE-LEGENDARY-MOBILE.html
 */

import { useState, useEffect } from 'react'
import ToastHub from './components/ToastHub.jsx'
import GlobalLoader from './components/GlobalLoader.jsx'
import BuildInfoFooter from './components/BuildInfoFooter.jsx'
import { MarketDataProvider, useMarketData } from './contexts/MarketDataContext.jsx'
import { PositionsProvider } from './contexts/PositionsContext.jsx'
import { useWatchlistData } from './hooks/useWatchlistData.js'
import MobileGestures from './components/MobileGestures.jsx'
import AIHub from './components/AIHub.jsx'
import Portfolio from './components/Portfolio.jsx'
import LegendaryPortfolio from './components/LegendaryPortfolio.jsx'
import AVAMindDashboard from './components/ava-mind/AVAMindDashboard.jsx'
import SocialTradingRooms from './components/SocialTradingRooms.jsx'
import NaturalLanguageScanner from './components/NaturalLanguageScanner.jsx'
import DiscoverTab from './components/DiscoverTab.jsx'
import YouTab from './components/YouTab.jsx'
import WelcomeTour, { TourHelpButton } from './components/WelcomeTour.jsx'
import AITradeCopilot from './components/AITradeCopilot.jsx'
import MobileBottomNav from './components/MobileBottomNav.jsx'
import TrustModeBanner from './components/TrustModeBanner.jsx'
import ExpandableScoreCard from './components/ExpandableScoreCard.jsx'
import DynamicIsland from './components/DynamicIsland.jsx'
import MobileSymbolHeader from './components/MobileSymbolHeader.jsx'
import MobileTradeView from './components/MobileTradeView.jsx'
import MarketOverview from './components/MarketOverview.jsx'
import NotificationCenter from './components/NotificationCenter.jsx'
import MobileQuickActions, { QuickActionsFAB } from './components/MobileQuickActions.jsx'
import AlertsCenter from './components/AlertsCenter.jsx'
import SymbolSearchModal from './components/SymbolSearchModal.jsx'
import ScoreBreakdown from './components/ScoreBreakdown.jsx'

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
  const [showNotifications, setShowNotifications] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showSymbolSearch, setShowSymbolSearch] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)

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

        // Track unique charts viewed for chart-scholar achievement
        try {
          const viewedCharts = JSON.parse(localStorage.getItem('iava_viewed_charts') || '[]')
          if (!viewedCharts.includes(symbol)) {
            viewedCharts.push(symbol)
            localStorage.setItem('iava_viewed_charts', JSON.stringify(viewedCharts))

            // Check for chart-scholar achievement (100 charts)
            if (viewedCharts.length >= 100) {
              window.dispatchEvent(new CustomEvent('iava.achievement', {
                detail: { achievementId: 'chart-scholar' }
              }))
            }
          }
        } catch (e) {
          console.error('[App] Error tracking chart views:', e)
        }

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

  // Listen for quick trade events from Social Trading Rooms
  useEffect(() => {
    const handleQuickTrade = (event) => {
      const { action, symbol, source } = event.detail || {}

      if (symbol && action) {
        // Track copy trades for copy-cat achievement
        if (source === 'social_room') {
          try {
            const copyTrades = JSON.parse(localStorage.getItem('iava_copy_trades') || '[]')
            copyTrades.push({ symbol, action, timestamp: Date.now() })
            localStorage.setItem('iava_copy_trades', JSON.stringify(copyTrades))

            // Check for copy-cat achievement (5 copy trades)
            if (copyTrades.length >= 5) {
              window.dispatchEvent(new CustomEvent('iava.achievement', {
                detail: { achievementId: 'copy-cat' }
              }))
            }
          } catch (e) {
            console.error('[App] Error tracking copy trades:', e)
          }
        }

        // Switch to chart tab and load the symbol
        setActiveTab('chart')

        // Load the symbol on the chart
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('iava.loadSymbol', {
            detail: { symbol, _forwarded: true }
          }))
        }, 100)

        // Open the trade panel with pre-filled action
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('iava.openTradePanel', {
            detail: { symbol, action }
          }))
        }, 300)
      }
    }

    window.addEventListener('iava.quickTrade', handleQuickTrade)
    return () => window.removeEventListener('iava.quickTrade', handleQuickTrade)
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

      // Cmd/Ctrl + K for Symbol Search (common pattern)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSymbolSearch(prev => !prev)
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
      <PositionsProvider>
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
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          showQuickActions={showQuickActions}
          setShowQuickActions={setShowQuickActions}
          showSymbolSearch={showSymbolSearch}
          setShowSymbolSearch={setShowSymbolSearch}
          showAlerts={showAlerts}
          setShowAlerts={setShowAlerts}
          handleFeatureSelect={handleFeatureSelect}
        />
      </PositionsProvider>
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
  showNotifications,
  setShowNotifications,
  showQuickActions,
  setShowQuickActions,
  showSymbolSearch,
  setShowSymbolSearch,
  showAlerts,
  setShowAlerts,
  handleFeatureSelect
}) {
  const { marketData } = useMarketData()
  const symbol = marketData?.symbol || 'SPY'

  // Load watchlist with real-time data
  const { watchlistData, addSymbol: addToWatchlist } = useWatchlistData()

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
        return (
          <MobileTradeView
            symbol={symbol}
            onSelectSymbol={handleSelectSymbol}
          />
        )
      case 'ai-hub':
        return <AIHub />
      case 'discover':
        return <DiscoverTab onSelectSymbol={handleSelectSymbol} />
      case 'scanner':
        return <NaturalLanguageScanner />
      case 'portfolio':
        return <LegendaryPortfolio onSelectSymbol={handleSelectSymbol} />
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
      case 'you':
        return <YouTab />
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
            watchlist={watchlistData}
            onAddSymbol={addToWatchlist}
          />
        }
        aiPanel={
          <AIPanel symbol={symbol} />
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
        {/* Main Content - padding handled by individual components for flexibility */}
        <div
          style={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {renderContent()}
          {activeTab !== 'chart' && <BuildInfoFooter />}
        </div>
      </LegendaryLayout>

      {/* Welcome Tour */}
      <WelcomeTour forceShow={showTour} onClose={() => setShowTour(false)} />
      <TourHelpButton onClick={() => setShowTour(true)} />

      {/* Toast Notifications */}
      <ToastHub />

      {/* Global Loading Indicator */}
      <GlobalLoader />

      {/* AI Trade Copilot */}
      {showCopilot && activeTab === 'chart' && (
        <AITradeCopilot onClose={() => setShowCopilot(false)} />
      )}

      {/* Social Trading Rooms */}
      {showSocialRooms && (
        <SocialTradingRooms onClose={() => setShowSocialRooms(false)} />
      )}

      {/* Symbol Search Modal - Cmd+K */}
      <SymbolSearchModal
        isOpen={showSymbolSearch}
        onClose={() => setShowSymbolSearch(false)}
        onSelect={handleSelectSymbol}
      />

      {/* Notification Center - Slides in from right */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Mobile Quick Actions */}
      <MobileQuickActions
        symbol={symbol}
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        onAction={(actionId) => {
          // Handle quick action
          if (actionId === 'alert') setShowAlerts(true)
        }}
      />

      {/* Mobile FAB for Quick Actions */}
      <div className="md:hidden">
        {activeTab === 'chart' && (
          <QuickActionsFAB onClick={() => setShowQuickActions(true)} />
        )}
      </div>

      {/* Mobile Score Card - shows on chart view for mobile */}
      {activeTab === 'chart' && (
        <div className="md:hidden">
          <ExpandableScoreCard
            symbol={symbol}
            score={87}
            trend="bullish"
            signal="Strong Buy"
          />
        </div>
      )}

      {/* Dynamic Island - iOS devices only */}
      <div className="md:hidden">
        <DynamicIsland
          symbol={symbol}
          score={87}
          changePercent={0.59}
        />
      </div>
    </MobileGestures>
  )
}
