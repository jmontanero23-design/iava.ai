import React, { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Mobile Gestures Controller
 * Advanced touch interactions for mobile trading
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
  const longPressTimer = useRef(null)
  const lastTap = useRef(0)

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

      {/* Mobile Navigation Hint (bottom) */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center pointer-events-none md:hidden">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-full border border-slate-700/50 text-xs text-slate-400">
          <span>← Swipe →</span>
          <span className="text-slate-600">|</span>
          <span>↓ Buy</span>
          <span className="text-slate-600">|</span>
          <span>↑ Sell</span>
        </div>
      </div>

      {/* Main Content */}
      {children}
    </div>
  )
}