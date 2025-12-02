/**
 * useWatchlistData Hook
 *
 * Loads watchlist symbols from localStorage and fetches real-time
 * prices and Unicorn Scores for each symbol.
 *
 * Connects the watchlists utility to live data APIs.
 */

import { useState, useEffect, useCallback } from 'react'
import * as watchlists from '../utils/watchlists'

// Default symbols to use if no watchlist is saved
const DEFAULT_SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'AMD', 'MSFT', 'META']

// Company name lookup
const COMPANY_NAMES = {
  SPY: 'SPDR S&P 500 ETF',
  QQQ: 'Invesco QQQ Trust',
  AAPL: 'Apple Inc',
  TSLA: 'Tesla Inc',
  NVDA: 'NVIDIA Corporation',
  AMD: 'Advanced Micro Devices',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc',
  AMZN: 'Amazon.com Inc',
  META: 'Meta Platforms',
  NFLX: 'Netflix Inc',
  DIS: 'Walt Disney Co',
  BA: 'Boeing Co',
  JPM: 'JPMorgan Chase',
  V: 'Visa Inc',
}

/**
 * Calculate quick technical score from price bars
 * This provides an INSTANT score for watchlist display while full API score loads.
 *
 * NOTE: This is NOT a separate "momentum score" - it's the technical component
 * of the unified Unicorn Score (which is 50% tech + 25% sentiment + 25% forecast).
 *
 * The score will be replaced by the full Unicorn Score when it loads via API.
 */
function calculateQuickTechnicalScore(bars) {
  if (!bars || bars.length < 5) return { score: 50, direction: 'neutral' }

  // Get recent price action
  const current = bars[bars.length - 1]
  const prev1 = bars[bars.length - 2]
  const prev5 = bars[bars.length - Math.min(5, bars.length)]

  // Day change component (+/- 20 points)
  const dayChange = ((current.c - prev1.c) / prev1.c) * 100
  const dayScore = Math.min(20, Math.max(-20, dayChange * 4))

  // 5-day trend component (+/- 20 points)
  const weekChange = ((current.c - prev5.c) / prev5.c) * 100
  const weekScore = Math.min(20, Math.max(-20, weekChange * 2))

  // Volume surge bonus (0-10 points)
  const avgVolume = bars.slice(-5).reduce((sum, b) => sum + b.v, 0) / 5
  const volumeSurge = current.v > avgVolume * 1.5 ? 10 : current.v > avgVolume ? 5 : 0

  // Base score of 50, adjusted by factors
  const score = Math.round(50 + dayScore + weekScore + volumeSurge)
  const clampedScore = Math.max(0, Math.min(100, score))

  // Determine direction (bidirectional - works for longs AND shorts)
  let direction = 'neutral'
  if (clampedScore >= 60) direction = 'bullish'
  else if (clampedScore <= 44) direction = 'bearish'

  return { score: clampedScore, direction }
}

/**
 * Fetch real-time price data for a symbol from Alpaca
 * Returns quick technical score for instant display.
 * Full Unicorn Score loads asynchronously via API.
 */
async function fetchSymbolData(symbol) {
  try {
    const response = await fetch(`/api/alpaca/bars?symbol=${symbol}&timeframe=1Day&limit=10`)
    if (!response.ok) return null

    const data = await response.json()
    const bars = data.bars || []

    if (bars.length >= 2) {
      const current = bars[bars.length - 1]
      const previous = bars[bars.length - 2]
      const price = current.c
      const change = price - previous.c
      const changePercent = (change / previous.c) * 100

      // Get quick technical score (instant)
      const { score, direction } = calculateQuickTechnicalScore(bars)

      return {
        price,
        change,
        changePercent,
        // Progressive score fields:
        unicornScore: score,        // Current display score
        scoreMaxPossible: 50,       // Only technical available (50% of full score)
        scoreComplete: false,       // Full API score not loaded yet
        direction,                  // 'bullish' | 'bearish' | 'neutral'
        bars                        // Keep bars for potential full score calculation
      }
    } else if (bars.length === 1) {
      return {
        price: bars[0].c,
        change: 0,
        changePercent: 0,
        unicornScore: 50,
        scoreMaxPossible: 50,
        scoreComplete: false,
        direction: 'neutral',
        bars
      }
    }
  } catch (error) {
    console.warn(`[useWatchlistData] Failed to fetch ${symbol}:`, error.message)
  }
  return null
}

/**
 * Custom hook to load watchlist with real-time data
 */
export function useWatchlistData(refreshInterval = 60000) {
  const [watchlistData, setWatchlistData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [activeWatchlist, setActiveWatchlist] = useState('')

  // Load watchlist symbols
  const loadWatchlistSymbols = useCallback(() => {
    // Try to get active watchlist
    const activeName = watchlists.getActive()
    const active = watchlists.get(activeName)

    if (active && active.symbols && active.symbols.length > 0) {
      setActiveWatchlist(activeName)
      return active.symbols
    }

    // Fall back to default symbols
    setActiveWatchlist('Default')
    return DEFAULT_SYMBOLS
  }, [])

  // Fetch data for all symbols
  const fetchAllData = useCallback(async () => {
    setIsLoading(true)

    const symbols = loadWatchlistSymbols()
    const results = []

    // Fetch data in parallel (batched to avoid rate limits)
    const batchSize = 4
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (symbol) => {
          const data = await fetchSymbolData(symbol)
          return {
            symbol,
            name: COMPANY_NAMES[symbol] || symbol,
            price: data?.price ?? 0,
            change: data?.change ?? 0,
            changePercent: data?.changePercent ?? 0,
            // Progressive Unicorn Score fields (unified score system):
            unicornScore: data?.unicornScore ?? 50,
            scoreMaxPossible: data?.scoreMaxPossible ?? 50,
            scoreComplete: data?.scoreComplete ?? false,
            direction: data?.direction ?? 'neutral',
            bars: data?.bars ?? []
          }
        })
      )
      results.push(...batchResults)
    }

    setWatchlistData(results)
    setLastUpdated(new Date())
    setIsLoading(false)
  }, [loadWatchlistSymbols])

  // Initial load and refresh interval
  useEffect(() => {
    fetchAllData()

    // Refresh periodically
    const interval = setInterval(fetchAllData, refreshInterval)

    // Listen for watchlist changes
    const handleWatchlistChange = () => {
      fetchAllData()
    }
    window.addEventListener('iava.watchlistChanged', handleWatchlistChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('iava.watchlistChanged', handleWatchlistChange)
    }
  }, [fetchAllData, refreshInterval])

  // Add symbol to watchlist
  const addSymbol = useCallback((symbol) => {
    const symbols = loadWatchlistSymbols()
    if (!symbols.includes(symbol.toUpperCase())) {
      const newSymbols = [...symbols, symbol.toUpperCase()]
      watchlists.save(activeWatchlist || 'Default', newSymbols)
      window.dispatchEvent(new CustomEvent('iava.watchlistChanged'))
    }
  }, [loadWatchlistSymbols, activeWatchlist])

  // Remove symbol from watchlist
  const removeSymbol = useCallback((symbol) => {
    const symbols = loadWatchlistSymbols()
    const newSymbols = symbols.filter(s => s !== symbol.toUpperCase())
    watchlists.save(activeWatchlist || 'Default', newSymbols)
    window.dispatchEvent(new CustomEvent('iava.watchlistChanged'))
  }, [loadWatchlistSymbols, activeWatchlist])

  return {
    watchlistData,
    isLoading,
    lastUpdated,
    activeWatchlist,
    refresh: fetchAllData,
    addSymbol,
    removeSymbol
  }
}

export default useWatchlistData
