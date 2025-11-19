import { useState, useEffect } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

/**
 * Enhanced Status Bar
 * Provides real-time system status, market regime, and quick actions
 *
 * Features:
 * - Market open/closed status
 * - Connection quality indicator
 * - AI processing status
 * - Market regime detection
 * - Quick action buttons
 */
export default function EnhancedStatusBar() {
  const { marketData } = useMarketData()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [aiTaskCount, setAiTaskCount] = useState(0)
  const [connectionQuality, setConnectionQuality] = useState({ latency: 0, status: 'good' })
  const [marketRegime, setMarketRegime] = useState({ type: 'neutral', confidence: 0 })

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate connection quality monitoring
  useEffect(() => {
    const checkConnection = () => {
      const start = Date.now()
      fetch('/api/ping')
        .then(response => {
          if (response.ok) {
            const latency = Date.now() - start
            setConnectionQuality({
              latency,
              status: latency < 100 ? 'excellent' : latency < 300 ? 'good' : latency < 500 ? 'fair' : 'poor'
            })
          } else {
            // API exists but returned error - show as poor connection
            setConnectionQuality({ latency: 999, status: 'poor' })
          }
        })
        .catch(() => {
          // API doesn't exist or network error - show as offline but don't spam console
          setConnectionQuality({ latency: 0, status: 'offline' })
        })
    }

    // Check immediately, then every 30 seconds (reduced frequency)
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Changed from 10s to 30s
    return () => clearInterval(interval)
  }, [])

  // Listen for AI task events
  useEffect(() => {
    const handleTaskStart = () => setAiTaskCount(c => c + 1)
    const handleTaskEnd = () => setAiTaskCount(c => Math.max(0, c - 1))

    window.addEventListener('iava.ai.taskStart', handleTaskStart)
    window.addEventListener('iava.ai.taskEnd', handleTaskEnd)

    return () => {
      window.removeEventListener('iava.ai.taskStart', handleTaskStart)
      window.removeEventListener('iava.ai.taskEnd', handleTaskEnd)
    }
  }, [])

  // Detect market regime from market data
  useEffect(() => {
    if (!marketData.bars || marketData.bars.length === 0) return

    try {
      const bars = marketData.bars.slice(-20) // Last 20 bars
      if (bars.length < 20) return

      // Simple regime detection based on moving averages
      const closes = bars.map(b => b.close)
      const sma20 = closes.reduce((a, b) => a + b, 0) / closes.length
      const currentPrice = closes[closes.length - 1]
      const priceChange = ((currentPrice - sma20) / sma20) * 100

      // Volatility check
      const volatility = Math.sqrt(
        closes.reduce((sum, price) => sum + Math.pow(price - sma20, 2), 0) / closes.length
      )
      const avgVolatility = sma20 * 0.02 // 2% of price

      let type = 'neutral'
      let confidence = Math.min(Math.abs(priceChange) * 10, 100)

      if (priceChange > 2 && volatility < avgVolatility) {
        type = 'bullish-trending'
      } else if (priceChange > 1) {
        type = 'bullish'
      } else if (priceChange < -2 && volatility < avgVolatility) {
        type = 'bearish-trending'
      } else if (priceChange < -1) {
        type = 'bearish'
      } else if (volatility > avgVolatility * 2) {
        type = 'volatile'
      }

      setMarketRegime({ type, confidence })
    } catch (error) {
      console.error('[StatusBar] Regime detection error:', error)
    }
  }, [marketData.bars])

  // Check if market is open (simplified - US market hours)
  const isMarketOpen = () => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const time = hour * 60 + minute

    // Weekend
    if (day === 0 || day === 6) return false

    // Market hours: 9:30 AM - 4:00 PM ET (simplified, doesn't account for holidays)
    const marketOpen = 9 * 60 + 30  // 9:30 AM
    const marketClose = 16 * 60     // 4:00 PM

    return time >= marketOpen && time < marketClose
  }

  const marketOpen = isMarketOpen()

  const regimeColors = {
    'bullish-trending': { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Bullish Trend' },
    'bullish': { bg: 'bg-green-500', text: 'text-green-400', label: 'Bullish' },
    'bearish-trending': { bg: 'bg-red-500', text: 'text-red-400', label: 'Bearish Trend' },
    'bearish': { bg: 'bg-orange-500', text: 'text-orange-400', label: 'Bearish' },
    'volatile': { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Volatile' },
    'neutral': { bg: 'bg-slate-500', text: 'text-slate-400', label: 'Neutral' }
  }

  const connectionColors = {
    excellent: { color: 'text-emerald-400', dot: 'bg-emerald-500' },
    good: { color: 'text-green-400', dot: 'bg-green-500' },
    fair: { color: 'text-yellow-400', dot: 'bg-yellow-500' },
    poor: { color: 'text-orange-400', dot: 'bg-orange-500' },
    offline: { color: 'text-red-400', dot: 'bg-red-500' }
  }

  const regime = regimeColors[marketRegime.type] || regimeColors.neutral
  const connection = connectionColors[connectionQuality.status] || connectionColors.offline

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-slate-900 backdrop-blur-xl border-t border-slate-700 flex items-center px-4 gap-4 text-xs z-[100]" style={{ position: 'fixed', bottom: '0px' }}>
      {/* Market Status */}
      <div className="flex items-center gap-2" title={marketOpen ? 'Market is open' : 'Market is closed'}>
        <span className={`w-2 h-2 ${marketOpen ? 'bg-green-500' : 'bg-red-500'} rounded-full ${marketOpen ? 'animate-pulse' : ''}`} />
        <span className={marketOpen ? 'text-green-400' : 'text-red-400'}>
          {marketOpen ? 'Market Open' : 'Market Closed'}
        </span>
      </div>

      <div className="h-4 w-px bg-slate-700" />

      {/* Connection Quality */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        title={`Connection: ${connectionQuality.status} (${connectionQuality.latency}ms)`}
      >
        <div className="flex gap-0.5">
          <div className={`w-1 h-2 rounded-sm ${connection.dot}`} />
          <div className={`w-1 h-3 rounded-sm ${connectionQuality.status !== 'offline' ? connection.dot : 'bg-slate-600'}`} />
          <div className={`w-1 h-4 rounded-sm ${connectionQuality.status === 'excellent' || connectionQuality.status === 'good' ? connection.dot : 'bg-slate-600'}`} />
        </div>
        <span className={connection.color}>
          {connectionQuality.latency > 0 ? `${connectionQuality.latency}ms` : 'Offline'}
        </span>
      </div>

      <div className="h-4 w-px bg-slate-700" />

      {/* AI Processing Status */}
      {aiTaskCount > 0 && (
        <>
          <div className="flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-violet-500 rounded-full" />
            <span className="text-violet-400">AI: {aiTaskCount} task{aiTaskCount !== 1 ? 's' : ''} running</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
        </>
      )}

      {/* Current Symbol */}
      {marketData.symbol && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Symbol:</span>
            <span className="text-cyan-400 font-semibold">{marketData.symbol}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
        </>
      )}

      {/* Market Regime */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        title={`Market Regime: ${regime.label} (${Math.round(marketRegime.confidence)}% confidence)`}
      >
        <span className="text-slate-400">Regime:</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 ${regime.bg} rounded-full`} />
          <span className={regime.text}>{regime.label}</span>
        </div>
        {marketRegime.confidence > 0 && (
          <span className="text-slate-500 text-[10px]">
            {Math.round(marketRegime.confidence)}%
          </span>
        )}
      </div>

      {/* Quick Actions (right side) */}
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('iava.toggleCommandPalette'))}
          className="hover:text-indigo-400 transition-colors"
          title="Command Palette (⌘K)"
        >
          ⌘K
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('iava.toggleTour'))}
          className="hover:text-indigo-400 transition-colors"
          title="Help & Tour"
        >
          ?
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: { text: 'Settings coming soon...', type: 'info' }
          }))}
          className="hover:text-indigo-400 transition-colors"
          title="Settings"
        >
          ⚙️
        </button>

        {/* Current Time */}
        <div className="text-slate-500 text-[10px] font-mono">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </div>
    </div>
  )
}
