/**
 * iAVA.ai ScoreRing Component
 *
 * THE SIGNATURE COMPONENT
 * Displays the Unicorn Score (0-100) with animated gradient ring.
 *
 * Features:
 * - Animated fill on mount
 * - Unicorn gradient stroke
 * - Glow effect
 * - Multiple sizes
 * - Direction indicator
 *
 * Based on: iAVA-CLAUDE-CODE-MASTER-PROMPT.md
 */

import { memo, useMemo, useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { componentSizes, gradients, colors, animation } from '../../styles/tokens'

// Unique ID generator for gradient references
let scoreRingIdCounter = 0
const getUniqueId = () => `score-ring-${++scoreRingIdCounter}`

/**
 * ScoreRing - The Unicorn Score Display
 */
export const ScoreRing = memo(function ScoreRing({
  score = 0,
  size = 'md',
  animated = true,
  showLabel = true,
  showDirection = false,
  direction = 'neutral', // 'bullish' | 'bearish' | 'neutral'
  className = '',
  style = {},
}) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score)
  const gradientId = useMemo(() => getUniqueId(), [])

  // Get size config
  const sizeConfig = componentSizes.scoreRing[size] || componentSizes.scoreRing.md
  const { ring, stroke, fontSize } = sizeConfig

  // Calculate circle properties
  const radius = (ring - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayScore / 100) * circumference

  // Animate score on mount
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score)
      return
    }

    // Animate from 0 to score
    const duration = 1000
    const steps = 60
    const increment = score / steps
    let current = 0
    let frame = 0

    const animate = () => {
      frame++
      current = Math.min(score, Math.round(increment * frame))
      setDisplayScore(current)

      if (frame < steps && current < score) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [score, animated])

  // Get direction icon and color
  const getDirectionInfo = () => {
    switch (direction) {
      case 'bullish':
        return {
          Icon: TrendingUp,
          color: colors.emerald[400],
          label: 'Bullish',
        }
      case 'bearish':
        return {
          Icon: TrendingDown,
          color: colors.red[400],
          label: 'Bearish',
        }
      default:
        return {
          Icon: Minus,
          color: colors.text[50],
          label: 'Neutral',
        }
    }
  }

  const directionInfo = getDirectionInfo()

  // Get score color intensity based on value
  const getScoreGlow = () => {
    if (score >= 80) return '0 0 20px rgba(168, 85, 247, 0.6)'
    if (score >= 60) return '0 0 15px rgba(168, 85, 247, 0.4)'
    return '0 0 10px rgba(168, 85, 247, 0.3)'
  }

  return (
    <div
      className={`score-ring ${className}`}
      style={{
        width: ring,
        height: ring,
        position: 'relative',
        ...style,
      }}
    >
      <svg
        width={ring}
        height={ring}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        {/* Background ring */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={stroke}
        />

        {/* Score ring - animated fill */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: animated
              ? `stroke-dashoffset 1s ${animation.easing.smooth}`
              : 'none',
            filter: `drop-shadow(${getScoreGlow()})`,
          }}
        />
      </svg>

      {/* Score value + label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 900,
            background: gradients.unicorn,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
          }}
        >
          {displayScore}
        </span>

        {showLabel && size !== 'sm' && (
          <span
            style={{
              fontSize: 10,
              color: colors.text[50],
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: 2,
            }}
          >
            Score
          </span>
        )}
      </div>

      {/* Direction badge (optional) */}
      {showDirection && (
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: colors.void,
            border: `2px solid ${directionInfo.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <directionInfo.Icon
            size={12}
            style={{ color: directionInfo.color }}
          />
        </div>
      )}
    </div>
  )
})

/**
 * ScoreRingMini - Compact version for lists
 */
export const ScoreRingMini = memo(function ScoreRingMini({
  score = 0,
  size = 32,
  className = '',
  style = {},
}) {
  const gradientId = useMemo(() => getUniqueId(), [])
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        ...style,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: colors.text[100],
          }}
        >
          {score}
        </span>
      </div>
    </div>
  )
})

/**
 * ScoreCard - Full score display with breakdown
 */
export const ScoreCard = memo(function ScoreCard({
  score = 0,
  direction = 'neutral',
  breakdown = {
    technicals: 0,
    sentiment: 0,
    chronos: 0,
  },
  recommendation = '',
  expanded = false,
  onToggle,
  className = '',
  style = {},
}) {
  const directionColors = {
    bullish: colors.emerald[400],
    bearish: colors.red[400],
    neutral: colors.text[50],
  }

  const directionLabels = {
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
  }

  return (
    <div
      className={className}
      style={{
        background: colors.glass.bg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.glass.border}`,
        borderRadius: 16,
        padding: 16,
        cursor: onToggle ? 'pointer' : 'default',
        transition: `all ${animation.duration.normal}ms ${animation.easing.smooth}`,
        ...style,
      }}
      onClick={onToggle}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ScoreRing
          score={score}
          size="md"
          showDirection
          direction={direction}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: directionColors[direction],
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 4,
            }}
          >
            {directionLabels[direction]}
          </div>

          {recommendation && (
            <div
              style={{
                fontSize: 13,
                color: colors.text[70],
                lineHeight: 1.4,
              }}
            >
              {recommendation}
            </div>
          )}
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${colors.glass.border}`,
          }}
        >
          <ScoreBreakdownBar
            label="Technicals"
            value={breakdown.technicals}
            max={50}
            color={colors.indigo[500]}
          />
          <ScoreBreakdownBar
            label="Sentiment"
            value={breakdown.sentiment}
            max={25}
            color={colors.purple[500]}
          />
          <ScoreBreakdownBar
            label="Chronos AI"
            value={breakdown.chronos}
            max={25}
            color={colors.cyan[400]}
          />
        </div>
      )}
    </div>
  )
})

/**
 * Score Breakdown Bar - Individual category bar
 */
const ScoreBreakdownBar = memo(function ScoreBreakdownBar({
  label,
  value,
  max,
  color,
}) {
  const percentage = (value / max) * 100

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 12, color: colors.text[50] }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.text[70] }}>
          {value}/{max}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: color,
            borderRadius: 3,
            transition: `width ${animation.duration.slow}ms ${animation.easing.smooth}`,
          }}
        />
      </div>
    </div>
  )
})

export default ScoreRing
