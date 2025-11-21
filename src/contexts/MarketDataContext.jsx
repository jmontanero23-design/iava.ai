/**
 * Market Data Context
 *
 * Shares real-time trading state across the application
 * Allows AI Chat and other features to access current market conditions
 */

import { createContext, useContext, useState } from 'react'

const MarketDataContext = createContext(null)

export function MarketDataProvider({ children }) {
  const [marketData, setMarketData] = useState({
    symbol: null,          // CRITICAL: Start null to prevent stale data issues
    timeframe: null,       // Will be set by AppChart on mount
    currentPrice: null,
    bars: [],
    signalState: null,
    dailyState: null,
    overlays: {},
    threshold: 70,
    enforceDaily: false,
    consensusBonus: false,
    consensus: null,
    account: null,
    unicornScore: null,  // Ultra Unicorn Score (50% tech + 25% sentiment + 25% forecast)
    updatedAt: null,
    isLoading: false       // Track loading state to prevent stale reads
  })

  const updateMarketData = (updates) => {
    setMarketData(prev => ({
      ...prev,
      ...updates,
      updatedAt: Date.now()
    }))
  }

  return (
    <MarketDataContext.Provider value={{ marketData, updateMarketData }}>
      {children}
    </MarketDataContext.Provider>
  )
}

export function useMarketData() {
  const context = useContext(MarketDataContext)
  if (!context) {
    throw new Error('useMarketData must be used within MarketDataProvider')
  }
  return context
}
