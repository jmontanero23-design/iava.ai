/**
 * LEGENDARY Dynamic Island
 *
 * iPhone-style Dynamic Island showing live score and ticker
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Dynamic Island section)
 */

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LogoMark } from './ui/Logo'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

export default function DynamicIsland({
  symbol = 'SPY',
  score = 87,
  changePercent = 0.59,
  isExpanded = true,
}) {
  const [expanded, setExpanded] = useState(isExpanded)
  const isPositive = changePercent >= 0

  // Auto-expand on data change
  useEffect(() => {
    setExpanded(true)
    const timer = setTimeout(() => {
      // Could auto-collapse after a delay
    }, 5000)
    return () => clearTimeout(timer)
  }, [symbol, score])

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        position: 'fixed',
        top: 11,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#000',
        borderRadius: expanded ? 28 : 24,
        width: expanded ? 240 : 126,
        height: expanded ? 52 : 37,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: `all 0.5s ${animation.easing.spring}`,
        cursor: 'pointer',
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Content - only visible when expanded */}
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
    </div>
  )
}

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
