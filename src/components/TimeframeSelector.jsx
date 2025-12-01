/**
 * LEGENDARY Timeframe Selector
 *
 * Elegant timeframe pills with animated indicator
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html
 */

import { useState, useRef, useEffect } from 'react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

const defaultTimeframes = [
  { id: '1m', label: '1m' },
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '30m', label: '30m' },
  { id: '1H', label: '1H' },
  { id: '4H', label: '4H' },
  { id: 'D', label: 'D' },
  { id: 'W', label: 'W' },
]

export default function TimeframeSelector({
  timeframes = defaultTimeframes,
  value = '15m',
  onChange,
  size = 'md',
  variant = 'pills', // 'pills' | 'bar' | 'compact'
}) {
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const containerRef = useRef(null)
  const itemRefs = useRef({})

  // Update sliding indicator position
  useEffect(() => {
    const activeItem = itemRefs.current[value]
    if (activeItem && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()

      setIndicatorStyle({
        left: itemRect.left - containerRect.left,
        width: itemRect.width,
      })
    }
  }, [value])

  const sizes = {
    sm: {
      padding: `${spacing[1]}px ${spacing[2]}px`,
      fontSize: typography.fontSize.xs,
      gap: spacing[1],
    },
    md: {
      padding: `${spacing[2]}px ${spacing[3]}px`,
      fontSize: typography.fontSize.sm,
      gap: spacing[1],
    },
    lg: {
      padding: `${spacing[3]}px ${spacing[4]}px`,
      fontSize: typography.fontSize.base,
      gap: spacing[2],
    },
  }

  const currentSize = sizes[size] || sizes.md

  if (variant === 'compact') {
    return (
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: 2,
          background: colors.depth2,
          borderRadius: radius.lg,
        }}
      >
        {timeframes.map((tf) => {
          const isActive = value === tf.id
          return (
            <button
              key={tf.id}
              onClick={() => onChange?.(tf.id)}
              style={{
                padding: `${spacing[1]}px ${spacing[2]}px`,
                background: isActive ? gradients.unicorn : 'transparent',
                border: 'none',
                borderRadius: radius.md,
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#fff' : colors.text[50],
                transition: `all ${animation.duration.fast}ms`,
              }}
            >
              {tf.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'bar') {
    return (
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          gap: currentSize.gap,
          padding: 3,
          background: colors.depth2,
          borderRadius: radius.xl,
          position: 'relative',
        }}
      >
        {/* Sliding Indicator */}
        <div
          style={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            background: gradients.unicorn,
            borderRadius: radius.lg,
            transition: `all ${animation.duration.normal}ms ${animation.easing.spring}`,
            ...indicatorStyle,
          }}
        />

        {timeframes.map((tf) => {
          const isActive = value === tf.id
          return (
            <button
              key={tf.id}
              ref={(el) => (itemRefs.current[tf.id] = el)}
              onClick={() => onChange?.(tf.id)}
              style={{
                padding: currentSize.padding,
                background: 'transparent',
                border: 'none',
                borderRadius: radius.lg,
                cursor: 'pointer',
                fontSize: currentSize.fontSize,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#fff' : colors.text[50],
                position: 'relative',
                zIndex: 1,
                transition: `color ${animation.duration.fast}ms`,
              }}
            >
              {tf.label}
            </button>
          )
        })}
      </div>
    )
  }

  // Default: pills variant
  return (
    <div
      style={{
        display: 'flex',
        gap: currentSize.gap,
      }}
    >
      {timeframes.map((tf) => {
        const isActive = value === tf.id
        return (
          <button
            key={tf.id}
            onClick={() => onChange?.(tf.id)}
            style={{
              padding: currentSize.padding,
              background: isActive ? gradients.unicorn : 'transparent',
              border: isActive ? 'none' : `1px solid ${colors.glass.border}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
              fontSize: currentSize.fontSize,
              fontWeight: isActive ? '700' : '500',
              color: isActive ? '#fff' : colors.text[50],
              transition: `all ${animation.duration.fast}ms`,
              boxShadow: isActive ? `0 0 20px ${colors.purple.glow}` : 'none',
            }}
          >
            {tf.label}
          </button>
        )
      })}
    </div>
  )
}

// Vertical Timeframe Selector for side panels
export function VerticalTimeframeSelector({
  timeframes = defaultTimeframes.slice(0, 6),
  value = '15m',
  onChange,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[1],
        padding: spacing[2],
        background: colors.depth1,
        borderRadius: radius.xl,
        border: `1px solid ${colors.glass.border}`,
      }}
    >
      {timeframes.map((tf) => {
        const isActive = value === tf.id
        return (
          <button
            key={tf.id}
            onClick={() => onChange?.(tf.id)}
            style={{
              padding: `${spacing[2]}px ${spacing[3]}px`,
              background: isActive ? colors.purple.dim : 'transparent',
              border: `1px solid ${isActive ? colors.purple[400] + '40' : 'transparent'}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontWeight: isActive ? '600' : '500',
              color: isActive ? colors.purple[400] : colors.text[50],
              transition: `all ${animation.duration.fast}ms`,
              textAlign: 'center',
            }}
          >
            {tf.label}
          </button>
        )
      })}
    </div>
  )
}

// Timeframe Tabs with descriptions
export function TimeframeTabs({
  value = '15m',
  onChange,
}) {
  const tabs = [
    { id: '15m', label: '15m', description: 'Scalping' },
    { id: '1H', label: '1H', description: 'Day Trading' },
    { id: '4H', label: '4H', description: 'Swing' },
    { id: 'D', label: 'D', description: 'Position' },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: spacing[2],
      }}
    >
      {tabs.map((tab) => {
        const isActive = value === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: spacing[3],
              background: isActive ? colors.purple.dim : colors.depth1,
              border: `1px solid ${isActive ? colors.purple[400] + '40' : colors.glass.border}`,
              borderRadius: radius.xl,
              cursor: 'pointer',
              transition: `all ${animation.duration.fast}ms`,
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: isActive ? colors.purple[400] : colors.text[100],
              }}
            >
              {tab.label}
            </span>
            <span
              style={{
                fontSize: 10,
                color: isActive ? colors.purple[400] : colors.text[50],
              }}
            >
              {tab.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
