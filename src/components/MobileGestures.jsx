import React, { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Mobile Gestures Controller - Simplified Elite Edition
 *
 * SIMPLIFIED: Only essential gestures that users will actually remember:
 * - Swipe left/right: Navigate between tabs
 * - Pull to refresh: Reload data
 *
 * Removed: diagonal swipes, multi-finger gestures, pattern drawing, shake, etc.
 * These were too complex and sensitive - nobody uses 4-finger taps or draws arrows.
 */
export default function MobileGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onPullToRefresh,
  symbol = '',
  loadBars
}) {
  const containerRef = useRef(null)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [gestureIndicator, setGestureIndicator] = useState(null)

  // INCREASED minimum swipe distance to reduce accidental triggers
  const minSwipeDistance = 100  // Was 50px - now 100px for less sensitivity
  const pullThreshold = 100     // Was 80px - now 100px

  // Handle touch start - simplified
  const handleTouchStart = useCallback((e) => {
    // Only handle single touch
    if (e.touches.length > 1) return

    setTouchEnd(null)
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    })
  }, [])

  // Handle touch move - simplified
  const handleTouchMove = useCallback((e) => {
    if (!touchStart || e.touches.length > 1) return

    const currentTouch = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }

    // Handle pull to refresh (only when at top of page)
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop === 0 && currentTouch.y > touchStart.y) {
      const distance = currentTouch.y - touchStart.y
      setPullDistance(Math.min(distance, 150))
      if (distance > 50) {
        setGestureIndicator({
          type: 'pull',
          message: distance > pullThreshold ? '↻ Release to refresh' : '↓ Pull to refresh'
        })
      }
    }

    setTouchEnd(currentTouch)
  }, [touchStart, pullThreshold])

  // Handle touch end - simplified (only horizontal swipes + pull refresh)
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) {
      setPullDistance(0)
      setGestureIndicator(null)
      return
    }

    const swipeTime = Date.now() - touchStart.time
    const horizontalDistance = touchStart.x - touchEnd.x
    const verticalDistance = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(horizontalDistance) > Math.abs(verticalDistance) * 1.5 // Must be clearly horizontal

    // Only process quick swipes (< 400ms) that are clearly horizontal
    if (swipeTime < 400 && isHorizontalSwipe && Math.abs(horizontalDistance) > minSwipeDistance) {
      if (horizontalDistance > 0) {
        handleSwipeLeft()
      } else {
        handleSwipeRight()
      }
    }

    // Pull to refresh
    if (pullDistance > pullThreshold) {
      handlePullToRefresh()
    }

    // Reset states
    setPullDistance(0)
    setGestureIndicator(null)
    setTouchStart(null)
    setTouchEnd(null)
  }, [touchStart, touchEnd, pullDistance, minSwipeDistance, pullThreshold])

  // Swipe handlers - simplified
  const handleSwipeLeft = useCallback(() => {
    setGestureIndicator({ type: 'swipe', message: '→' })
    setTimeout(() => setGestureIndicator(null), 500)
    onSwipeLeft?.()
  }, [onSwipeLeft])

  const handleSwipeRight = useCallback(() => {
    setGestureIndicator({ type: 'swipe', message: '←' })
    setTimeout(() => setGestureIndicator(null), 500)
    onSwipeRight?.()
  }, [onSwipeRight])

  const handlePullToRefresh = useCallback(() => {
    setIsRefreshing(true)
    setGestureIndicator({ type: 'refresh', message: '↻ Refreshing...' })

    if (onPullToRefresh) {
      onPullToRefresh()
    } else if (loadBars && symbol) {
      loadBars(symbol)
    }

    window.dispatchEvent(new CustomEvent('iava.refresh'))

    setTimeout(() => {
      setIsRefreshing(false)
      setGestureIndicator(null)
    }, 1000)
  }, [onPullToRefresh, loadBars, symbol])

  // Simplified render - no gesture hint bar, minimal UI
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : undefined,
        transition: pullDistance > 0 ? 'none' : 'transform 0.2s ease'
      }}
    >
      {/* Pull to Refresh Indicator - minimal */}
      {pullDistance > 50 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center h-12 text-slate-400"
          style={{ marginTop: `-${pullDistance * 0.3}px` }}
        >
          <span className={isRefreshing ? 'animate-spin' : ''}>
            {pullDistance > pullThreshold ? '↻' : '↓'}
          </span>
        </div>
      )}

      {/* Gesture Indicator - subtle, small */}
      {gestureIndicator && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="px-4 py-2 rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-white text-sm font-medium">
            {gestureIndicator.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  )
}