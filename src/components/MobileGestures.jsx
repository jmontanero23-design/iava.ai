import React, { useEffect, useRef, useState, useCallback } from 'react'
import { GestureHandler, GESTURES } from '../utils/advancedGestures.js'

/**
 * Mobile Gestures Controller - Elite PhD Level
 * Advanced touch interactions with 20+ gesture types
 */
export default function MobileGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  onPinchZoom,
  onDoubleTap,
  onLongPress,
  symbol = '',
  setSymbol,
  loadBars
}) {
  const containerRef = useRef(null)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [gestureIndicator, setGestureIndicator] = useState(null)
  const [gestureHistory, setGestureHistory] = useState([])
  const longPressTimer = useRef(null)
  const lastTap = useRef(0)
  const gestureHandlerRef = useRef(null)

  // Minimum swipe distance (px)
  const minSwipeDistance = 50
  const pullThreshold = 80

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    })

    // Start long press timer
    if (e.touches && e.touches[0]) {
      longPressTimer.current = setTimeout(() => {
        handleLongPress(e.touches[0])
      }, 500)
    }
  }, [])

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (!touchStart) return

    const currentTouch = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }

    // Cancel long press if moved
    const moveDistance = Math.sqrt(
      Math.pow(currentTouch.x - touchStart.x, 2) +
      Math.pow(currentTouch.y - touchStart.y, 2)
    )

    if (moveDistance > 10) {
      clearTimeout(longPressTimer.current)
    }

    // Handle pull to refresh
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop === 0 && currentTouch.y > touchStart.y) {
      const distance = currentTouch.y - touchStart.y
      setPullDistance(Math.min(distance, 150))
      if (distance > 30) {
        setGestureIndicator({ type: 'pull', message: distance > pullThreshold ? 'Release to refresh' : 'Pull to refresh' })
      }
    }

    setTouchEnd(currentTouch)
  }, [touchStart])

  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    clearTimeout(longPressTimer.current)

    if (!touchStart || !touchEnd) {
      // Check for tap/double tap
      const now = Date.now()
      if (now - lastTap.current < 300) {
        handleDoubleTap(e)
      }
      lastTap.current = now
      return
    }

    const swipeTime = Date.now() - touchStart.time
    const horizontalDistance = touchStart.x - touchEnd.x
    const verticalDistance = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(horizontalDistance) > Math.abs(verticalDistance)

    // Quick swipe detection (< 500ms)
    if (swipeTime < 500) {
      // Horizontal swipes - navigate tabs
      if (isHorizontalSwipe && Math.abs(horizontalDistance) > minSwipeDistance) {
        if (horizontalDistance > 0) {
          // Swipe left - next tab
          handleSwipeLeft()
        } else {
          // Swipe right - previous tab
          handleSwipeRight()
        }
      }
      // Vertical swipes - trade actions
      else if (!isHorizontalSwipe && Math.abs(verticalDistance) > minSwipeDistance) {
        if (verticalDistance > 0 && Math.abs(verticalDistance) > 100) {
          // Swipe up - quick sell
          handleSwipeUp()
        } else if (verticalDistance < 0 && Math.abs(verticalDistance) > 100) {
          // Swipe down - quick buy
          handleSwipeDown()
        }
      }
    }

    // Pull to refresh
    if (pullDistance > pullThreshold) {
      handlePullToRefresh()
    }

    // Reset states
    setPullDistance(0)
    setGestureIndicator(null)
  }, [touchStart, touchEnd, pullDistance])

  // Swipe handlers
  const handleSwipeLeft = useCallback(() => {
    setGestureIndicator({ type: 'swipe', message: 'Next view →' })
    setTimeout(() => setGestureIndicator(null), 1000)

    if (onSwipeLeft) {
      onSwipeLeft()
    } else {
      // Default: Navigate to next tab
      const tabs = ['#chart', '#ai-features', '#scanner', '#positions']
      const currentHash = window.location.hash || '#chart'
      const currentIndex = tabs.indexOf(currentHash)
      const nextIndex = (currentIndex + 1) % tabs.length
      window.location.hash = tabs[nextIndex]
    }
  }, [onSwipeLeft])

  const handleSwipeRight = useCallback(() => {
    setGestureIndicator({ type: 'swipe', message: '← Previous view' })
    setTimeout(() => setGestureIndicator(null), 1000)

    if (onSwipeRight) {
      onSwipeRight()
    } else {
      // Default: Navigate to previous tab
      const tabs = ['#chart', '#ai-features', '#scanner', '#positions']
      const currentHash = window.location.hash || '#chart'
      const currentIndex = tabs.indexOf(currentHash)
      const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
      window.location.hash = tabs[prevIndex]
    }
  }, [onSwipeRight])

  const handleSwipeUp = useCallback(() => {
    setGestureIndicator({ type: 'trade', message: '📈 Quick Sell' })
    setTimeout(() => setGestureIndicator(null), 2000)

    if (onSwipeUp) {
      onSwipeUp()
    } else {
      // Default: Open sell panel
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: `Opening sell panel for ${symbol}...`, type: 'warning' }
      }))
      window.dispatchEvent(new CustomEvent('iava.quickTrade', {
        detail: { action: 'sell', symbol }
      }))
    }
  }, [onSwipeUp, symbol])

  const handleSwipeDown = useCallback(() => {
    setGestureIndicator({ type: 'trade', message: '📉 Quick Buy' })
    setTimeout(() => setGestureIndicator(null), 2000)

    if (onSwipeDown) {
      onSwipeDown()
    } else {
      // Default: Open buy panel
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: `Opening buy panel for ${symbol}...`, type: 'success' }
      }))
      window.dispatchEvent(new CustomEvent('iava.quickTrade', {
        detail: { action: 'buy', symbol }
      }))
    }
  }, [onSwipeDown, symbol])

  const handlePullToRefresh = useCallback(() => {
    setIsRefreshing(true)
    setGestureIndicator({ type: 'refresh', message: 'Refreshing...' })

    if (onPullToRefresh) {
      onPullToRefresh()
    } else {
      // Default: Reload current data
      if (loadBars && symbol) {
        loadBars(symbol)
      }
      window.dispatchEvent(new CustomEvent('iava.refresh'))
    }

    setTimeout(() => {
      setIsRefreshing(false)
      setGestureIndicator(null)
    }, 1500)
  }, [onPullToRefresh, loadBars, symbol])

  const handleLongPress = useCallback((touch) => {
    setGestureIndicator({ type: 'menu', message: 'Quick Actions' })

    if (onLongPress) {
      onLongPress(touch)
    } else {
      // Default: Show context menu
      window.dispatchEvent(new CustomEvent('iava.contextMenu', {
        detail: { x: touch.clientX, y: touch.clientY }
      }))
    }

    setTimeout(() => setGestureIndicator(null), 2000)
  }, [onLongPress])

  const handleDoubleTap = useCallback((e) => {
    setGestureIndicator({ type: 'zoom', message: 'Reset Zoom' })

    if (onDoubleTap) {
      onDoubleTap(e)
    } else {
      // Default: Toggle fullscreen
      window.dispatchEvent(new CustomEvent('iava.toggleFullscreen'))
    }

    setTimeout(() => setGestureIndicator(null), 1000)
  }, [onDoubleTap])

  // Initialize advanced gesture handler
  useEffect(() => {
    if (!containerRef.current) return

    const gestureCallbacks = {
      // Diagonal swipes for trading
      [GESTURES.DIAGONAL_UP_RIGHT]: () => {
        setGestureIndicator({ type: 'trade', message: '📈 Quick Long Position' })
        window.dispatchEvent(new CustomEvent('iava.quickTrade', {
          detail: { action: 'long', symbol, quick: true }
        }))
        setTimeout(() => setGestureIndicator(null), 2000)
      },
      [GESTURES.DIAGONAL_DOWN_LEFT]: () => {
        setGestureIndicator({ type: 'trade', message: '📉 Quick Short Position' })
        window.dispatchEvent(new CustomEvent('iava.quickTrade', {
          detail: { action: 'short', symbol, quick: true }
        }))
        setTimeout(() => setGestureIndicator(null), 2000)
      },
      [GESTURES.DIAGONAL_UP_LEFT]: () => {
        setGestureIndicator({ type: 'order', message: '🛡️ Set Stop Loss' })
        window.dispatchEvent(new CustomEvent('iava.setStopLoss', { detail: { symbol } }))
        setTimeout(() => setGestureIndicator(null), 2000)
      },
      [GESTURES.DIAGONAL_DOWN_RIGHT]: () => {
        setGestureIndicator({ type: 'order', message: '🎯 Set Take Profit' })
        window.dispatchEvent(new CustomEvent('iava.setTakeProfit', { detail: { symbol } }))
        setTimeout(() => setGestureIndicator(null), 2000)
      },

      // Multi-finger gestures
      [GESTURES.TWO_FINGER_TAP]: () => {
        setGestureIndicator({ type: 'stats', message: '📊 Quick Stats' })
        window.dispatchEvent(new CustomEvent('iava.showQuickStats'))
        setTimeout(() => setGestureIndicator(null), 2000)
      },
      [GESTURES.THREE_FINGER_TAP]: () => {
        setGestureIndicator({ type: 'command', message: '🎮 Command Palette' })
        window.dispatchEvent(new CustomEvent('iava.openCommandPalette'))
        setTimeout(() => setGestureIndicator(null), 1500)
      },
      [GESTURES.FOUR_FINGER_TAP]: () => {
        setGestureIndicator({ type: 'emergency', message: '🚨 CLOSE ALL POSITIONS' })
        if (confirm('Emergency close all positions?')) {
          window.dispatchEvent(new CustomEvent('iava.emergencyCloseAll'))
        }
        setTimeout(() => setGestureIndicator(null), 3000)
      },

      // Pattern gestures
      [GESTURES.CIRCLE]: () => {
        setGestureIndicator({ type: 'refresh', message: '🔄 Refreshing Data' })
        handlePullToRefresh()
      },
      [GESTURES.ZIGZAG]: () => {
        setGestureIndicator({ type: 'toggle', message: '📐 Toggle Indicators' })
        window.dispatchEvent(new CustomEvent('iava.toggleIndicators'))
        setTimeout(() => setGestureIndicator(null), 1500)
      },
      [GESTURES.DRAW_UP_ARROW]: () => {
        setGestureIndicator({ type: 'trade', message: '⬆️ Buy Order' })
        window.dispatchEvent(new CustomEvent('iava.placeBuyOrder', { detail: { symbol } }))
        setTimeout(() => setGestureIndicator(null), 2000)
      },
      [GESTURES.DRAW_DOWN_ARROW]: () => {
        setGestureIndicator({ type: 'trade', message: '⬇️ Sell Order' })
        window.dispatchEvent(new CustomEvent('iava.placeSellOrder', { detail: { symbol } }))
        setTimeout(() => setGestureIndicator(null), 2000)
      },
      [GESTURES.DRAW_HORIZONTAL_LINE]: () => {
        setGestureIndicator({ type: 'alert', message: '🔔 Set Price Alert' })
        window.dispatchEvent(new CustomEvent('iava.setPriceAlert', { detail: { symbol } }))
        setTimeout(() => setGestureIndicator(null), 2000)
      },
      [GESTURES.DRAW_X]: () => {
        setGestureIndicator({ type: 'cancel', message: '❌ Cancel Orders' })
        window.dispatchEvent(new CustomEvent('iava.cancelOrders', { detail: { symbol } }))
        setTimeout(() => setGestureIndicator(null), 2000)
      },

      // Shake to undo
      [GESTURES.SHAKE]: () => {
        setGestureIndicator({ type: 'undo', message: '↩️ Undo Last Action' })
        window.dispatchEvent(new CustomEvent('iava.undo'))
        setTimeout(() => setGestureIndicator(null), 1500)
      },

      // Triple tap for fullscreen
      [GESTURES.TRIPLE_TAP]: () => {
        setGestureIndicator({ type: 'fullscreen', message: '🖥️ Toggle Fullscreen' })
        window.dispatchEvent(new CustomEvent('iava.toggleFullscreen'))
        setTimeout(() => setGestureIndicator(null), 1000)
      },

      // Edge swipes
      [GESTURES.EDGE_SWIPE_RIGHT]: () => {
        setGestureIndicator({ type: 'menu', message: '☰ Opening Menu' })
        window.dispatchEvent(new CustomEvent('iava.openSidebar'))
        setTimeout(() => setGestureIndicator(null), 1000)
      },
      [GESTURES.EDGE_SWIPE_LEFT]: () => {
        setGestureIndicator({ type: 'notifications', message: '🔔 Notifications' })
        window.dispatchEvent(new CustomEvent('iava.openNotifications'))
        setTimeout(() => setGestureIndicator(null), 1000)
      },

      // Two finger swipes for chart control
      [GESTURES.TWO_FINGER_SWIPE_UP]: () => {
        setGestureIndicator({ type: 'chart', message: '📈 Maximize Chart' })
        window.dispatchEvent(new CustomEvent('iava.maximizeChart'))
        setTimeout(() => setGestureIndicator(null), 1000)
      },
      [GESTURES.TWO_FINGER_SWIPE_DOWN]: () => {
        setGestureIndicator({ type: 'chart', message: '📉 Minimize Chart' })
        window.dispatchEvent(new CustomEvent('iava.minimizeChart'))
        setTimeout(() => setGestureIndicator(null), 1000)
      },

      // Three finger swipe for workspace
      [GESTURES.THREE_FINGER_SWIPE]: (data) => {
        const direction = data.direction === 'right' ? 'Next' : 'Previous'
        setGestureIndicator({ type: 'workspace', message: `🖥️ ${direction} Workspace` })
        window.dispatchEvent(new CustomEvent('iava.switchWorkspace', {
          detail: { direction: data.direction }
        }))
        setTimeout(() => setGestureIndicator(null), 1500)
      },

      // Generic callback to track all gestures
      onGesture: (type, data) => {
        setGestureHistory(prev => [...prev.slice(-9), { type, data, time: Date.now() }])
      }
    }

    gestureHandlerRef.current = new GestureHandler(containerRef.current, gestureCallbacks)

    return () => {
      if (gestureHandlerRef.current) {
        gestureHandlerRef.current.destroy()
      }
    }
  }, [symbol, handlePullToRefresh])

  // Handle pinch zoom
  useEffect(() => {
    let initialDistance = null
    let currentScale = 1

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )

        if (initialDistance === null) {
          initialDistance = distance
        } else {
          currentScale = distance / initialDistance
          if (onPinchZoom) {
            onPinchZoom(currentScale)
          }
        }
      }
    }

    const handleTouchEnd = () => {
      initialDistance = null
      currentScale = 1
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('touchmove', handleTouchMove, { passive: false })
      container.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      if (container) {
        container.removeEventListener('touchmove', handleTouchMove)
        container.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [onPinchZoom])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : undefined,
        transition: pullDistance > 0 ? 'none' : 'transform 0.3s ease'
      }}
    >
      {/* Pull to Refresh Indicator */}
      {pullDistance > 0 && (
        <div
          className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-all ${
            pullDistance > pullThreshold ? 'h-20' : 'h-12'
          }`}
          style={{ marginTop: `-${pullDistance * 0.4}px` }}
        >
          <div className={`${isRefreshing ? 'animate-spin' : ''}`}>
            {pullDistance > pullThreshold ? '🔄' : '↓'}
          </div>
        </div>
      )}

      {/* Gesture Indicator Overlay */}
      {gestureIndicator && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div
            className={`px-6 py-3 rounded-full backdrop-blur-lg animate-in fade-in zoom-in duration-200 ${
              gestureIndicator.type === 'trade'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : gestureIndicator.type === 'swipe'
                ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                : gestureIndicator.type === 'refresh'
                ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                : 'bg-slate-700/80 border border-slate-600/50 text-slate-300'
            }`}
          >
            <span className="text-lg font-medium">{gestureIndicator.message}</span>
          </div>
        </div>
      )}

      {/* Mobile Navigation Hint (bottom) - Shows advanced gestures */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center pointer-events-none md:hidden">
        <div className="max-w-sm mx-4">
          <div className="flex flex-col gap-1 px-4 py-2 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
              <span>← Swipe → Tabs</span>
              <span className="text-slate-600">|</span>
              <span>↓ Buy ↑ Sell</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-purple-400">
              <span>↗ Long</span>
              <span className="text-slate-600">|</span>
              <span>↙ Short</span>
              <span className="text-slate-600">|</span>
              <span>2👆 Stats</span>
              <span className="text-slate-600">|</span>
              <span>3👆 Cmd</span>
            </div>
            <div className="text-center text-xs text-slate-500">
              Draw: ⬆ Buy | ⬇ Sell | — Alert | ✕ Cancel
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {children}
    </div>
  )
}