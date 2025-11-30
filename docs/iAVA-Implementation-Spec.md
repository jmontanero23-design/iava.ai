# iAVA.ai UX Implementation Specification
## Technical Guide for Claude Code Execution

---

## Overview

This document provides the exact file-by-file implementation details for the UX Master Plan. 
Claude Code should follow this spec precisely, implementing one phase at a time.

---

## Current File Structure (Reference)

```
src/
├── App.jsx                          # Main router - MODIFY
├── AppChart.jsx                     # TradingView wrapper
├── components/
│   ├── MobileBottomNav.jsx          # Current 5-tab nav - REPLACE
│   ├── CommandPalette.jsx           # Exists - ENHANCE
│   ├── UnicornScorePanel.jsx        # Current score - REFACTOR
│   ├── AITradeCopilot.jsx           # Keep as-is
│   ├── AIChat.jsx                   # Keep as-is
│   ├── AIHub.jsx                    # DEPRECATE (merge into tabs)
│   ├── Portfolio.jsx                # Keep - move to You tab
│   ├── NaturalLanguageScanner.jsx   # Keep - move to Discover tab
│   ├── SmartWatchlistBuilderPanel.jsx # Keep - move to Discover tab
│   ├── TradeJournalAIPanel.jsx      # Keep - move to You tab
│   ├── ava-mind/                    # Keep - move to You tab
│   └── ... (60+ more components)
├── services/
│   └── ai/
│       ├── ultraEliteModels_v2_SIMPLIFIED.js  # Score calculation
│       └── PersonalizedScoreService.js        # Archetypes
└── contexts/
    └── MarketDataContext.jsx        # Keep as-is
```

---

## Phase 1: Navigation Foundation

### Task 1.1: Create New Tab Components

**File: `src/components/tabs/TradeTab.jsx`**
```jsx
/**
 * Trade Tab - Primary trading interface
 * 
 * Contains:
 * - TradingView chart (60% viewport)
 * - ScoreCard overlay (collapsible)
 * - AI Copilot (bottom right bubble)
 * - Order entry (slide-up panel)
 */

import { useState, useCallback } from 'react'
import AppChart from '../../AppChart.jsx'
import ScoreCard from '../score/ScoreCard.jsx'
import AITradeCopilot from '../AITradeCopilot.jsx'
import OrderPanel from '../OrderPanel.jsx'

export default function TradeTab({ symbol, onSymbolChange }) {
  const [showCopilot, setShowCopilot] = useState(true)
  const [showOrder, setShowOrder] = useState(false)
  const [scoreExpanded, setScoreExpanded] = useState(false)

  return (
    <div className="trade-tab h-full flex flex-col">
      {/* Sticky Header */}
      <header className="trade-header flex items-center justify-between px-4 py-2 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <SymbolHeader symbol={symbol} onSymbolChange={onSymbolChange} />
      </header>

      {/* Chart Area */}
      <div className="chart-container flex-1 relative">
        <AppChart symbol={symbol} />
        
        {/* Score Card Overlay */}
        <ScoreCard 
          expanded={scoreExpanded}
          onToggle={() => setScoreExpanded(!scoreExpanded)}
          className="absolute top-4 right-4 z-10"
        />
      </div>

      {/* Action Bar */}
      <div className="action-bar flex items-center justify-between px-4 py-3 bg-slate-900/95 border-t border-slate-700/50">
        <button 
          onClick={() => setShowOrder(true)}
          className="flex-1 mr-2 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold"
        >
          Buy
        </button>
        <button 
          onClick={() => setShowOrder(true)}
          className="flex-1 ml-2 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold"
        >
          Sell
        </button>
        <button
          onClick={() => setShowCopilot(!showCopilot)}
          className="ml-4 p-3 bg-purple-600/30 rounded-xl"
        >
          🤖
        </button>
      </div>

      {/* AI Copilot Bubble */}
      {showCopilot && (
        <AITradeCopilot 
          symbol={symbol}
          onClose={() => setShowCopilot(false)}
          position="bottom-right"
        />
      )}

      {/* Order Panel (slide-up) */}
      {showOrder && (
        <OrderPanel 
          symbol={symbol}
          onClose={() => setShowOrder(false)}
        />
      )}
    </div>
  )
}
```

**File: `src/components/tabs/DiscoverTab.jsx`**
```jsx
/**
 * Discover Tab - Stock discovery and screening
 * 
 * Contains:
 * - Universal search bar (NLP-enabled)
 * - Quick filter pills
 * - Results list with mini-scores
 */

import { useState, useCallback } from 'react'
import SearchBar from '../discover/SearchBar.jsx'
import FilterPills from '../discover/FilterPills.jsx'
import SymbolGrid from '../discover/SymbolGrid.jsx'

const QUICK_FILTERS = [
  { id: 'unicorns', label: '🦄 Unicorns', query: 'score > 85' },
  { id: 'squeezes', label: '🔥 Squeezes', query: 'squeeze fired' },
  { id: 'earnings', label: '📊 Earnings', query: 'earnings this week' },
  { id: 'trending', label: '📈 Trending', query: 'volume spike' },
]

export default function DiscoverTab({ onSelectSymbol }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = useCallback(async (query) => {
    setLoading(true)
    // Use NLP scanner service
    const results = await searchStocks(query)
    setResults(results)
    setLoading(false)
  }, [])

  const handleFilterSelect = useCallback((filter) => {
    setActiveFilter(filter.id)
    handleSearch(filter.query)
  }, [handleSearch])

  return (
    <div className="discover-tab h-full flex flex-col">
      {/* Search Bar */}
      <div className="px-4 pt-4 pb-2">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search stocks or ask AVA..."
        />
      </div>

      {/* Quick Filters */}
      <div className="px-4 pb-3">
        <FilterPills 
          filters={QUICK_FILTERS}
          activeFilter={activeFilter}
          onSelect={handleFilterSelect}
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        <SymbolGrid 
          symbols={results}
          loading={loading}
          onSelect={onSelectSymbol}
        />
      </div>
    </div>
  )
}
```

**File: `src/components/tabs/YouTab.jsx`**
```jsx
/**
 * You Tab - Personal hub
 * 
 * Contains:
 * - Portfolio summary
 * - AVA Mind (AI Twin)
 * - Trade Journal
 * - Settings
 */

import { useState } from 'react'
import PortfolioSummary from '../you/PortfolioSummary.jsx'
import AVAMindCard from '../you/AVAMindCard.jsx'
import JournalCard from '../you/JournalCard.jsx'
import SettingsCard from '../you/SettingsCard.jsx'

export default function YouTab() {
  const [activeSection, setActiveSection] = useState(null)

  return (
    <div className="you-tab h-full overflow-auto">
      <div className="px-4 py-4 space-y-4">
        {/* Portfolio Summary (always visible) */}
        <PortfolioSummary />

        {/* AVA Mind Card */}
        <AVAMindCard 
          expanded={activeSection === 'ava-mind'}
          onToggle={() => setActiveSection(activeSection === 'ava-mind' ? null : 'ava-mind')}
        />

        {/* Journal Card */}
        <JournalCard 
          expanded={activeSection === 'journal'}
          onToggle={() => setActiveSection(activeSection === 'journal' ? null : 'journal')}
        />

        {/* Settings Card */}
        <SettingsCard 
          expanded={activeSection === 'settings'}
          onToggle={() => setActiveSection(activeSection === 'settings' ? null : 'settings')}
        />
      </div>
    </div>
  )
}
```

### Task 1.2: Create New Bottom Navigation

**File: `src/components/navigation/BottomNav.jsx`**
```jsx
/**
 * Bottom Navigation - 3 primary tabs
 * 
 * Design requirements:
 * - 56px minimum touch targets
 * - Haptic feedback on tap
 * - Safe area support
 * - Active indicator animation
 */

import { useCallback } from 'react'

const TABS = [
  { id: 'trade', label: 'Trade', icon: '📈', activeIcon: '📊' },
  { id: 'discover', label: 'Discover', icon: '🔍', activeIcon: '🎯' },
  { id: 'you', label: 'You', icon: '👤', activeIcon: '✨' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const handleTabPress = useCallback((tabId) => {
    triggerHaptic()
    onTabChange(tabId)
  }, [onTabChange, triggerHaptic])

  return (
    <nav 
      className="bottom-nav fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around px-2 py-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.id)}
              className={`
                relative flex flex-col items-center justify-center
                min-w-[80px] min-h-[56px] py-2 px-4 rounded-xl
                transition-all duration-200 ease-out
                ${isActive ? 'bg-purple-500/20' : 'active:bg-slate-800/50'}
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-purple-500" />
              )}
              
              {/* Icon */}
              <span className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                {isActive ? tab.activeIcon : tab.icon}
              </span>
              
              {/* Label */}
              <span className={`text-xs font-medium mt-1 ${isActive ? 'text-purple-400' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Home indicator */}
      <div className="flex justify-center pt-1 pb-2">
        <div className="w-32 h-1 bg-slate-700 rounded-full" />
      </div>
    </nav>
  )
}
```

### Task 1.3: Update App.jsx Router

**File: `src/App.jsx` - Key modifications**
```jsx
// Add imports
import TradeTab from './components/tabs/TradeTab.jsx'
import DiscoverTab from './components/tabs/DiscoverTab.jsx'
import YouTab from './components/tabs/YouTab.jsx'
import BottomNav from './components/navigation/BottomNav.jsx'

// Inside App component, replace tab logic:
const [activeTab, setActiveTab] = useState('trade')
const [currentSymbol, setCurrentSymbol] = useState('SPY')

// Render tabs based on activeTab
const renderTab = () => {
  switch (activeTab) {
    case 'trade':
      return <TradeTab symbol={currentSymbol} onSymbolChange={setCurrentSymbol} />
    case 'discover':
      return <DiscoverTab onSelectSymbol={(sym) => {
        setCurrentSymbol(sym)
        setActiveTab('trade')
      }} />
    case 'you':
      return <YouTab />
    default:
      return <TradeTab symbol={currentSymbol} onSymbolChange={setCurrentSymbol} />
  }
}

// In return:
return (
  <MarketDataProvider>
    <div className="app h-screen flex flex-col bg-slate-950">
      <main className="flex-1 pb-20 overflow-hidden">
        {renderTab()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <CommandPalette />
      <ToastHub />
    </div>
  </MarketDataProvider>
)
```

---

## Phase 2: Score Card Redesign

### Task 2.1: Create Layered Score Components

**File: `src/components/score/ScoreCard.jsx`**
```jsx
/**
 * ScoreCard - Layered Unicorn Score display
 * 
 * L0: Glance (score + direction)
 * L1: Summary (breakdowns + recommendation)
 * L2: Detail (full indicators + personalization)
 */

import { useState, useEffect } from 'react'
import { useMarketData } from '../../contexts/MarketDataContext.jsx'
import { personalizedScoreService } from '../../services/ai/PersonalizedScoreService.js'
import ScoreL0 from './ScoreL0.jsx'
import ScoreL1 from './ScoreL1.jsx'
import ScoreL2 from './ScoreL2.jsx'

export default function ScoreCard({ expanded, onToggle, className = '' }) {
  const { unicornState } = useMarketData()
  const [level, setLevel] = useState(0) // 0, 1, or 2
  const [personalizedData, setPersonalizedData] = useState(null)

  // Get personalized signal when score changes
  useEffect(() => {
    if (unicornState?.score != null) {
      try {
        const signal = personalizedScoreService.getPersonalizedSignal(
          {
            ultraUnicornScore: Math.round(unicornState.score),
            direction: unicornState.rawScore >= 0 ? 'LONG' : 'SHORT',
            components: unicornState.components || {},
          },
          unicornState.symbol || 'SPY',
          0
        )
        setPersonalizedData(signal)
      } catch (e) {
        console.warn('PersonalizedScoreService error:', e)
      }
    }
  }, [unicornState?.score])

  // Handle level changes
  const handleTap = () => {
    if (level === 0) setLevel(1)
    else if (level === 1) setLevel(2)
    else setLevel(0)
  }

  if (!unicornState || unicornState.score == null) {
    return (
      <div className={`score-card-loading ${className}`}>
        <div className="animate-pulse bg-slate-800 rounded-2xl p-4">
          <div className="h-12 w-24 bg-slate-700 rounded-lg" />
        </div>
      </div>
    )
  }

  const score = Math.round(unicornState.score)
  const direction = unicornState.rawScore >= 0 ? 'BULLISH' : 
                    unicornState.rawScore <= 0 ? 'BEARISH' : 'NEUTRAL'

  return (
    <div 
      className={`score-card cursor-pointer transition-all duration-300 ${className}`}
      onClick={handleTap}
    >
      {level === 0 && (
        <ScoreL0 
          score={score} 
          direction={direction}
          archetype={personalizedData?.context?.archetype}
          archetypeIcon={personalizedData?.context?.archetypeIcon}
        />
      )}
      
      {level === 1 && (
        <ScoreL1
          score={score}
          direction={direction}
          technicals={unicornState.techScore || 0}
          sentiment={unicornState.sentimentScore || 0}
          forecast={unicornState.forecastScore || 0}
          consensusActive={unicornState.consensusBonus || false}
          recommendation={personalizedData?.recommendation}
        />
      )}
      
      {level === 2 && (
        <ScoreL2
          unicornState={unicornState}
          personalizedData={personalizedData}
          onClose={() => setLevel(0)}
        />
      )}
    </div>
  )
}
```

**File: `src/components/score/ScoreL0.jsx`**
```jsx
/**
 * ScoreL0 - Glanceable score display
 * Shows: Score number + direction badge + archetype icon
 */

export default function ScoreL0({ score, direction, archetype, archetypeIcon }) {
  const directionColor = direction === 'BULLISH' ? 'text-green-400' :
                         direction === 'BEARISH' ? 'text-red-400' : 'text-slate-400'
  
  const glowColor = direction === 'BULLISH' ? 'shadow-green-500/30' :
                    direction === 'BEARISH' ? 'shadow-red-500/30' : 'shadow-slate-500/30'

  return (
    <div className={`score-l0 glass-panel p-4 rounded-2xl shadow-lg ${glowColor}`}>
      <div className="flex items-center gap-3">
        {/* Score */}
        <div className="text-4xl font-black text-white">
          {score}
        </div>
        
        {/* Direction */}
        <div className={`text-xs font-bold uppercase tracking-wider ${directionColor}`}>
          {direction}
        </div>
        
        {/* Archetype */}
        {archetypeIcon && (
          <div className="ml-auto text-2xl" title={archetype}>
            {archetypeIcon}
          </div>
        )}
      </div>
      
      {/* Tap hint */}
      <div className="text-[10px] text-slate-500 mt-2 text-center">
        Tap for details
      </div>
    </div>
  )
}
```

**File: `src/components/score/ScoreL1.jsx`**
```jsx
/**
 * ScoreL1 - Summary breakdown
 * Shows: Tech/Sentiment/Forecast bars + consensus + recommendation
 */

export default function ScoreL1({ 
  score, 
  direction, 
  technicals, 
  sentiment, 
  forecast, 
  consensusActive,
  recommendation 
}) {
  const categories = [
    { label: 'Technicals', value: technicals, max: 50, color: '#3b82f6' },
    { label: 'Sentiment', value: sentiment, max: 25, color: '#a855f7' },
    { label: 'Forecast', value: forecast, max: 25, color: '#06b6d4' },
  ]

  return (
    <div className="score-l1 glass-panel p-5 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-black text-white">{score}</div>
        <div className={`text-sm font-bold uppercase ${
          direction === 'BULLISH' ? 'text-green-400' : 
          direction === 'BEARISH' ? 'text-red-400' : 'text-slate-400'
        }`}>
          {direction}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 mb-4">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{cat.label}</span>
              <span className="text-slate-300 font-mono">{cat.value.toFixed(1)}/{cat.max}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(cat.value / cat.max) * 100}%`,
                  backgroundColor: cat.color 
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Consensus */}
      {consensusActive && (
        <div className="flex items-center gap-2 text-xs text-green-400 mb-3">
          <span>✓</span>
          <span>Consensus Bonus Active (+10)</span>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3">
          💡 {recommendation}
        </div>
      )}

      {/* Tap hint */}
      <div className="text-[10px] text-slate-500 mt-3 text-center">
        Tap for full breakdown
      </div>
    </div>
  )
}
```

---

## Phase 3: Enhanced Command Palette

### Task 3.1: Add Feature Routing

**File: `src/components/CommandPalette.jsx` - Enhancements**
```jsx
// Add these feature routes to the existing CommandPalette

const FEATURE_ROUTES = [
  // Navigation
  { keywords: ['trade', 'chart', 'buy', 'sell'], action: 'navigate', target: 'trade' },
  { keywords: ['discover', 'search', 'find', 'scan'], action: 'navigate', target: 'discover' },
  { keywords: ['portfolio', 'positions', 'account', 'you', 'me'], action: 'navigate', target: 'you' },
  
  // Features
  { keywords: ['sentiment', 'news', 'social'], action: 'feature', target: 'sentiment-panel' },
  { keywords: ['forecast', 'prediction', 'chronos'], action: 'feature', target: 'forecast-panel' },
  { keywords: ['regime', 'market condition'], action: 'feature', target: 'regime-panel' },
  { keywords: ['journal', 'trades', 'history'], action: 'feature', target: 'journal-panel' },
  { keywords: ['genetic', 'optimize', 'backtest'], action: 'feature', target: 'genetic-panel' },
  { keywords: ['risk', 'position size'], action: 'feature', target: 'risk-panel' },
  { keywords: ['pattern', 'technical'], action: 'feature', target: 'pattern-panel' },
  { keywords: ['watchlist', 'watch'], action: 'feature', target: 'watchlist-panel' },
  { keywords: ['ava mind', 'twin', 'archetype'], action: 'feature', target: 'ava-mind-panel' },
  { keywords: ['emotional', 'feeling', 'mood'], action: 'feature', target: 'emotional-panel' },
  
  // Trading
  { keywords: ['buy'], action: 'trade', type: 'buy' },
  { keywords: ['sell'], action: 'trade', type: 'sell' },
  
  // Symbol loading
  { keywords: ['load', 'show', 'chart'], action: 'symbol', extract: true },
]

// Add NLP matching function
function matchCommand(input) {
  const normalized = input.toLowerCase().trim()
  
  // Check for symbol patterns (e.g., "show AAPL", "TSLA chart")
  const symbolMatch = normalized.match(/\b([A-Z]{1,5})\b/i)
  
  for (const route of FEATURE_ROUTES) {
    if (route.keywords.some(kw => normalized.includes(kw))) {
      return {
        ...route,
        symbol: symbolMatch ? symbolMatch[1].toUpperCase() : null
      }
    }
  }
  
  // If just a ticker symbol, load it
  if (symbolMatch && normalized.length <= 6) {
    return { action: 'symbol', symbol: symbolMatch[1].toUpperCase() }
  }
  
  return null
}
```

---

## Directory Structure After Phase 1

```
src/components/
├── tabs/
│   ├── TradeTab.jsx         # NEW
│   ├── DiscoverTab.jsx      # NEW
│   └── YouTab.jsx           # NEW
├── navigation/
│   └── BottomNav.jsx        # NEW (replaces MobileBottomNav.jsx)
├── score/
│   ├── ScoreCard.jsx        # NEW
│   ├── ScoreL0.jsx          # NEW
│   ├── ScoreL1.jsx          # NEW
│   └── ScoreL2.jsx          # NEW
├── discover/
│   ├── SearchBar.jsx        # NEW
│   ├── FilterPills.jsx      # NEW
│   └── SymbolGrid.jsx       # NEW
├── you/
│   ├── PortfolioSummary.jsx # NEW
│   ├── AVAMindCard.jsx      # NEW
│   ├── JournalCard.jsx      # NEW
│   └── SettingsCard.jsx     # NEW
└── [existing components...]
```

---

## Testing Checklist

### Phase 1 Complete When:
- [ ] 3-tab navigation renders correctly on mobile
- [ ] Tab switching animates smoothly
- [ ] All existing features accessible via command palette
- [ ] Trade tab shows chart + score + copilot
- [ ] Discover tab shows search + filters
- [ ] You tab shows portfolio + cards
- [ ] No console errors
- [ ] Works offline (PWA cache intact)

### Phase 2 Complete When:
- [ ] ScoreCard L0 shows score + direction
- [ ] Tap expands to L1 with breakdowns
- [ ] Tap again expands to L2 with full detail
- [ ] Animations are 60fps
- [ ] Personalization data populates correctly
- [ ] Works with real market data

---

## Notes for Claude Code

1. **Preserve existing functionality** - Don't delete working components, move them
2. **Test on mobile viewport** - Use Chrome DevTools mobile emulation
3. **Keep commits atomic** - One task per commit
4. **Run lint after each change** - `npm run lint`
5. **Verify PWA still works** - Check service worker registration
6. **Don't touch core services** - ultraEliteModels, PersonalizedScoreService stay as-is

---

*This spec is the technical companion to iAVA-UX-Master-Plan.docx*
