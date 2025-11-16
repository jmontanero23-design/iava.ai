/**
 * AI Trade Copilot - Proactive Real-Time Trading Assistant
 * Elite floating panel that monitors positions and provides live guidance
 *
 * DIFFERENT FROM AI CHAT:
 * - AI Chat: Reactive (you ask, it answers)
 * - AI Copilot: Proactive (always watching, alerts you)
 *
 * Features:
 * - Real-time position monitoring
 * - Live exit signal detection
 * - Risk violation alerts
 * - Profit target recommendations
 * - Market regime change warnings
 * - Unicorn Score updates
 * - Proactive trade management
 */

import { useState, useEffect, useRef } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

export default function AITradeCopilot({ onClose }) {
  const { marketData } = useMarketData()
  const [isMinimized, setIsMinimized] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [positions, setPositions] = useState([])
  const [lastCheck, setLastCheck] = useState(Date.now())

  // Listen for position updates from Orders panel
  useEffect(() => {
    const handlePositionUpdate = (event) => {
      const updatedPositions = event.detail
      setPositions(updatedPositions)
      console.log('[Copilot] Positions updated:', updatedPositions.length)
    }

    window.addEventListener('iava-positions-update', handlePositionUpdate)
    return () => window.removeEventListener('iava-positions-update', handlePositionUpdate)
  }, [])

  // Monitor positions and market data for alerts
  useEffect(() => {
    if (!marketData.symbol || positions.length === 0) return

    const checkInterval = setInterval(() => {
      analyzePositions()
    }, 5000) // Check every 5 seconds

    return () => clearInterval(checkInterval)
  }, [marketData, positions])

  // Proactive analysis of positions
  const analyzePositions = () => {
    const newAlerts = []
    const currentTime = Date.now()

    positions.forEach(position => {
      const { symbol, side, entry, quantity, stopLoss, takeProfit } = position
      const currentPrice = marketData.symbol === symbol ? marketData.price?.close : null

      if (!currentPrice) return

      // Alert 1: Stop Loss Approaching
      if (stopLoss) {
        const distanceToStop = side === 'buy' ?
          ((currentPrice - stopLoss) / entry) * 100 :
          ((stopLoss - currentPrice) / entry) * 100

        if (distanceToStop < 5 && distanceToStop > 0) {
          newAlerts.push({
            id: `stop-${symbol}-${currentTime}`,
            type: 'warning',
            priority: 'high',
            symbol,
            title: 'Stop Loss Approaching',
            message: `${symbol} is ${distanceToStop.toFixed(1)}% away from your stop loss at $${stopLoss.toFixed(2)}`,
            action: 'Consider adjusting or preparing to exit',
            timestamp: currentTime
          })
        }
      }

      // Alert 2: Profit Target Hit
      if (takeProfit) {
        const distanceToTarget = side === 'buy' ?
          ((takeProfit - currentPrice) / entry) * 100 :
          ((currentPrice - takeProfit) / entry) * 100

        if (distanceToTarget < 2 && distanceToTarget > -1) {
          newAlerts.push({
            id: `target-${symbol}-${currentTime}`,
            type: 'success',
            priority: 'high',
            symbol,
            title: 'Profit Target Reached!',
            message: `${symbol} hit your target at $${takeProfit.toFixed(2)}. Current: $${currentPrice.toFixed(2)}`,
            action: 'Consider taking profits now',
            timestamp: currentTime
          })
        }
      }

      // Alert 3: Unicorn Score Deterioration
      if (marketData.symbol === symbol && marketData.unicornScore) {
        const score = marketData.unicornScore.current

        if (side === 'buy' && score < 40) {
          newAlerts.push({
            id: `score-${symbol}-${currentTime}`,
            type: 'danger',
            priority: 'medium',
            symbol,
            title: 'Unicorn Score Deteriorating',
            message: `${symbol} Unicorn Score dropped to ${score}/100 (bearish)`,
            action: 'Consider tightening stop or exiting',
            timestamp: currentTime
          })
        }

        if (side === 'sell' && score > 70) {
          newAlerts.push({
            id: `score-${symbol}-${currentTime}`,
            type: 'danger',
            priority: 'medium',
            symbol,
            title: 'Unicorn Score Rising',
            message: `${symbol} Unicorn Score rose to ${score}/100 (bullish)`,
            action: 'Cover short or tighten stop',
            timestamp: currentTime
          })
        }
      }

      // Alert 4: Large Price Move
      const priceChange = side === 'buy' ?
        ((currentPrice - entry) / entry) * 100 :
        ((entry - currentPrice) / entry) * 100

      if (Math.abs(priceChange) > 5) {
        const isProfit = priceChange > 0
        newAlerts.push({
          id: `move-${symbol}-${currentTime}`,
          type: isProfit ? 'success' : 'warning',
          priority: 'medium',
          symbol,
          title: `Large ${isProfit ? 'Gain' : 'Loss'}: ${Math.abs(priceChange).toFixed(1)}%`,
          message: `${symbol} moved ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}% from entry`,
          action: isProfit ? 'Consider trailing stop' : 'Review position sizing',
          timestamp: currentTime
        })
      }
    })

    // Add new alerts (avoid duplicates)
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const existingIds = new Set(prev.map(a => a.id))
        const uniqueNew = newAlerts.filter(a => !existingIds.has(a.id))
        return [...uniqueNew, ...prev].slice(0, 10) // Keep last 10 alerts
      })
    }

    setLastCheck(currentTime)
  }

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  // Clear all alerts
  const clearAll = () => {
    setAlerts([])
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span className="text-lg">🤖</span>
          <span className="text-sm font-semibold">AI Copilot</span>
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] z-50">
      <div className="glass-panel overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <div className="text-white font-bold text-sm">AI Trade Copilot</div>
                <div className="text-indigo-200 text-xs">Always watching your positions</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white hover:bg-white/20 rounded px-2 py-1 text-xs transition-colors"
              >
                _
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded px-2 py-1 text-xs transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-700/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${positions.length > 0 ? 'bg-emerald-400' : 'bg-slate-500'} animate-pulse`} />
              <span className="text-slate-300">
                {positions.length > 0 ?
                  `Monitoring ${positions.length} position${positions.length !== 1 ? 's' : ''}` :
                  'No active positions'}
              </span>
            </div>
            <div className="text-slate-400">
              Updated {Math.round((Date.now() - lastCheck) / 1000)}s ago
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">👁️</div>
              <div className="text-sm">I'm watching the markets</div>
              <div className="text-xs mt-1">You'll be alerted of important events</div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-400 font-semibold">
                  ACTIVE ALERTS ({alerts.length})
                </div>
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear all
                </button>
              </div>

              {alerts.map(alert => {
                const alertStyles = {
                  success: 'border-emerald-500/30 bg-emerald-500/10',
                  warning: 'border-amber-500/30 bg-amber-500/10',
                  danger: 'border-red-500/30 bg-red-500/10',
                  info: 'border-cyan-500/30 bg-cyan-500/10'
                }

                const iconMap = {
                  success: '✅',
                  warning: '⚠️',
                  danger: '🚨',
                  info: '💡'
                }

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${alertStyles[alert.type] || alertStyles.info} animate-slide-in-right`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-base">{iconMap[alert.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <span>{alert.title}</span>
                            {alert.priority === 'high' && (
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                                HIGH
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5">
                            {alert.message}
                          </div>
                          {alert.action && (
                            <div className="text-xs text-indigo-300 mt-1 font-semibold">
                              → {alert.action}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-slate-500 hover:text-slate-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Market Status */}
        {marketData.symbol && marketData.unicornScore && (
          <div className="bg-slate-800/30 px-3 py-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs">
              <div className="text-slate-400">
                {marketData.symbol}: <span className="text-slate-200">${marketData.price?.close?.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Unicorn Score:</span>
                <span className={`font-bold ${
                  marketData.unicornScore.current >= 70 ? 'text-emerald-400' :
                  marketData.unicornScore.current >= 50 ? 'text-cyan-400' :
                  marketData.unicornScore.current >= 35 ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {marketData.unicornScore.current}/100
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
