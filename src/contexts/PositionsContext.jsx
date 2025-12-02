/**
 * Positions Context
 *
 * Shares Alpaca positions and account data across the application
 * Prevents duplicate API calls and keeps data consistent
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const PositionsContext = createContext(null)

export function PositionsProvider({ children }) {
  const [positions, setPositions] = useState([])
  const [accountInfo, setAccountInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch positions from Alpaca
  const fetchPositions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/positions')
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setPositions(data.positions || [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[PositionsContext] Error fetching positions:', err)
      setError(err.message)
      setPositions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch account info from Alpaca
  const fetchAccountInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/account')
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setAccountInfo(data)
    } catch (err) {
      console.error('[PositionsContext] Error fetching account:', err)
      setAccountInfo(null)
    }
  }, [])

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchPositions(), fetchAccountInfo()])
  }, [fetchPositions, fetchAccountInfo])

  // Initial load
  useEffect(() => {
    refresh()

    // Auto-refresh every 30 seconds while market is likely open
    const interval = setInterval(() => {
      refresh()
    }, 30000)

    // Listen for position update events (from trades, etc.)
    const handlePositionUpdate = () => {
      refresh()
    }
    window.addEventListener('iava.positionsChanged', handlePositionUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('iava.positionsChanged', handlePositionUpdate)
    }
  }, [refresh])

  // Calculate portfolio stats
  const portfolioStats = {
    totalValue: positions.reduce((sum, p) => sum + parseFloat(p.market_value || 0), 0),
    totalPnL: positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pl || 0), 0),
    totalPnLPercent: positions.length > 0
      ? (positions.reduce((sum, p) => sum + parseFloat(p.unrealized_plpc || 0), 0) / positions.length) * 100
      : 0,
    positionCount: positions.length,
    equity: parseFloat(accountInfo?.equity || 0),
    buyingPower: parseFloat(accountInfo?.buying_power || 0),
    cash: parseFloat(accountInfo?.cash || 0),
  }

  return (
    <PositionsContext.Provider value={{
      positions,
      accountInfo,
      portfolioStats,
      isLoading,
      error,
      lastUpdated,
      refresh,
      fetchPositions,
      fetchAccountInfo,
    }}>
      {children}
    </PositionsContext.Provider>
  )
}

export function usePositions() {
  const context = useContext(PositionsContext)
  if (!context) {
    throw new Error('usePositions must be used within PositionsProvider')
  }
  return context
}
