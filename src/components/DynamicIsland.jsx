/**
 * LEGENDARY Dynamic Island
 *
 * iPhone-style Dynamic Island showing live score, ticker, and activities
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Dynamic Island section)
 */

import { useState, useEffect, useRef } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Bell,
  Zap,
  CheckCircle,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import { LogoMark } from './ui/Logo'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Activity types for dynamic island notifications
const ACTIVITY_TYPES = {
  PRICE_ALERT: 'price_alert',
  TRADE_EXECUTED: 'trade_executed',
  SIGNAL: 'signal',
  SCORE_UPDATE: 'score_update',
}

export default function DynamicIsland({
  symbol = 'SPY',
  score = 87,
  changePercent = 0.59,
  isExpanded = true,
  activity = null,
  onActivityDismiss,
}) {
  const [expanded, setExpanded] = useState(isExpanded)
  const [showActivity, setShowActivity] = useState(false)
  const activityTimeoutRef = useRef(null)
  const isPositive = changePercent >= 0

  // Handle activity notifications
  useEffect(() => {
    if (activity) {
      setShowActivity(true)
      setExpanded(true)

      // Auto-dismiss activity after delay
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current)
      activityTimeoutRef.current = setTimeout(() => {
        setShowActivity(false)
        onActivityDismiss?.()
      }, 4000)
    }

    return () => {
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current)
    }
  }, [activity, onActivityDismiss])

  // Auto-expand on data change
  useEffect(() => {
    setExpanded(true)
    const timer = setTimeout(() => {
      // Could auto-collapse after a delay
    }, 5000)
    return () => clearTimeout(timer)
  }, [symbol, score])

  // Get activity display config
  const getActivityConfig = () => {
    if (!activity) return null

    switch (activity.type) {
      case ACTIVITY_TYPES.PRICE_ALERT:
        return {
          Icon: activity.positive ? TrendingUp : TrendingDown,
          color: activity.positive ? colors.emerald[400] : colors.red[400],
          bg: activity.positive ? colors.emerald.dim : colors.red.dim,
        }
      case ACTIVITY_TYPES.TRADE_EXECUTED:
        return {
          Icon: CheckCircle,
          color: colors.emerald[400],
          bg: colors.emerald.dim,
        }
      case ACTIVITY_TYPES.SIGNAL:
        return {
          Icon: Zap,
          color: colors.purple[400],
          bg: colors.purple.dim,
        }
      default:
        return {
          Icon: Bell,
          color: colors.cyan[400],
          bg: colors.cyan.dim,
        }
    }
  }

  const activityConfig = getActivityConfig()

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        position: 'fixed',
        top: 11,
        left: '50%',
        transform: 'translateX(-50%)',
        background: colors.void, // Pure black - THE VOID
        borderRadius: expanded ? 28 : 24,
        width: expanded ? (showActivity ? 280 : 240) : 126,
        height: expanded ? (showActivity ? 64 : 52) : 37,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: `all 0.5s ${animation.easing.spring}`,
        cursor: 'pointer',
        zIndex: 100,
        boxShadow: showActivity
          ? `0 4px 30px rgba(0, 0, 0, 0.6), 0 0 40px ${activityConfig?.color}30`
          : '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Activity Content */}
      {showActivity && activity && activityConfig ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            padding: `0 ${spacing[4]}px`,
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'scale(1)' : 'scale(0.8)',
            transition: `all 0.3s ${animation.easing.smooth}`,
            animation: 'activityPulse 2s ease-in-out infinite',
          }}
        >
          {/* Activity Icon */}
          <div
            style={{
              width: 36,
              height: 36,
              background: activityConfig.bg,
              borderRadius: radius.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <activityConfig.Icon size={18} style={{ color: activityConfig.color }} />
          </div>

          {/* Activity Info */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text[100],
                }}
              >
                {activity.symbol}
              </span>
              {activity.value && (
                <span
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    color: activityConfig.color,
                    fontFamily: typography.fontFamily.mono,
                  }}
                >
                  {activity.value}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text[50],
              }}
            >
              {activity.message}
            </span>
          </div>

          {/* Activity indicator */}
          <div
            style={{
              width: 8,
              height: 8,
              background: activityConfig.color,
              borderRadius: '50%',
              animation: 'pulse 1.5s infinite',
            }}
          />
        </div>
      ) : (
        /* Standard Content - only visible when expanded */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'scale(1)' : 'scale(0.8)',
            transition: `all 0.3s ${animation.easing.smooth}`,
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogoMark size={28} animate={false} />
          </div>

          {/* Score */}
          <span
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.black,
              background: gradients.unicorn,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {score}
          </span>

          {/* Ticker */}
          <span
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              color: colors.text[70],
            }}
          >
            {symbol}
          </span>

          {/* Trend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              color: isPositive ? colors.emerald[400] : colors.red[400],
            }}
          >
            {isPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        @keyframes activityPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </div>
  )
}

// Export activity types for external use
export { ACTIVITY_TYPES }

// Hook to detect if we should show Dynamic Island (iOS devices with notch)
export function useDynamicIslandSupport() {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    // Check for notch/Dynamic Island support via safe area insets
    const checkSupport = () => {
      // This is a rough check - actual Dynamic Island detection is limited
      const hasSafeAreaTop = CSS.supports('padding-top', 'env(safe-area-inset-top)')
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      const hasNotch = window.innerHeight > 800 && isIOS

      setSupported(hasSafeAreaTop && isIOS && hasNotch)
    }

    checkSupport()
  }, [])

  return supported
}

// Hook to manage dynamic island activities
export function useDynamicIslandActivity() {
  const [activity, setActivity] = useState(null)
  const [history, setHistory] = useState([])

  const showActivity = (newActivity) => {
    const activityWithId = {
      id: Date.now(),
      timestamp: new Date(),
      ...newActivity,
    }
    setActivity(activityWithId)
    setHistory(prev => [activityWithId, ...prev].slice(0, 50)) // Keep last 50
  }

  const dismissActivity = () => {
    setActivity(null)
  }

  // Helper functions for common activity types
  const showPriceAlert = (symbol, price, positive = true) => {
    showActivity({
      type: ACTIVITY_TYPES.PRICE_ALERT,
      symbol,
      message: positive ? 'Price target hit!' : 'Stop loss triggered',
      value: `$${typeof price === 'number' ? price.toFixed(2) : price}`,
      positive,
    })
  }

  const showTradeExecuted = (symbol, side, qty, price) => {
    showActivity({
      type: ACTIVITY_TYPES.TRADE_EXECUTED,
      symbol,
      message: `${side.toUpperCase()} ${qty} shares`,
      value: `$${typeof price === 'number' ? price.toFixed(2) : price}`,
      positive: side.toLowerCase() === 'buy',
    })
  }

  const showSignal = (symbol, signalText, positive = true) => {
    showActivity({
      type: ACTIVITY_TYPES.SIGNAL,
      symbol,
      message: signalText,
      positive,
    })
  }

  const showScoreUpdate = (symbol, newScore, change) => {
    showActivity({
      type: ACTIVITY_TYPES.SCORE_UPDATE,
      symbol,
      message: `Score ${change > 0 ? 'increased' : 'decreased'}`,
      value: newScore.toString(),
      positive: change > 0,
    })
  }

  return {
    activity,
    history,
    showActivity,
    dismissActivity,
    showPriceAlert,
    showTradeExecuted,
    showSignal,
    showScoreUpdate,
  }
}
