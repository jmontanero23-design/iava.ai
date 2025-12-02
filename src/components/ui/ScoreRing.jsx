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
import { TrendingUp, TrendingDown, Minus, Zap, Sparkles, Loader2 } from 'lucide-react'
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
 * ProgressiveScoreRing - Score that builds up as data arrives
 *
 * Shows instant technical score (50% capacity) first,
 * then full Unicorn Score when API returns.
 *
 * BIDIRECTIONAL INTERPRETATION:
 * - Score >= 60: BULLISH (LONG opportunity)
 * - Score 45-59: NEUTRAL (Wait for clarity)
 * - Score <= 44: BEARISH (SHORT opportunity)
 */
export const ProgressiveScoreRing = memo(function ProgressiveScoreRing({
  score: rawScore = 0,
  maxPossible: rawMaxPossible = 100,     // 50 = technical only, 100 = complete
  isComplete = false,
  loading = false,
  direction = 'neutral', // 'bullish' | 'bearish' | 'neutral'
  breakdown = {},        // { technical, sentiment, forecast }
  size = 'md',
  showBreakdown = false,
  showDirection = true,
  animated = true,
  className = '',
  style = {},
}) {
  // Ensure score is always a valid number (fixes NaN issue)
  const score = typeof rawScore === 'number' && !isNaN(rawScore) ? rawScore : 0
  const maxPossible = typeof rawMaxPossible === 'number' && !isNaN(rawMaxPossible) && rawMaxPossible > 0 ? rawMaxPossible : 100

  const [displayScore, setDisplayScore] = useState(animated ? 0 : score)
  const gradientId = useMemo(() => getUniqueId(), [])

  // Get size config
  const sizeConfig = componentSizes.scoreRing[size] || componentSizes.scoreRing.md
  const { ring, stroke, fontSize } = sizeConfig

  // Calculate circle properties
  const radius = (ring - stroke) / 2
  const circumference = 2 * Math.PI * radius

  // Score fills based on current score out of maxPossible
  // Technical only (maxPossible=50) shows 50% max ring fill
  // Complete (maxPossible=100) shows full ring
  const normalizedScore = maxPossible > 0 ? (score / maxPossible) * 100 : 0
  const offset = circumference - (normalizedScore / 100) * circumference

  // Animate score on change
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score)
      return
    }

    const duration = 800
    const steps = 40
    const startValue = displayScore
    const diff = score - startValue
    let frame = 0

    const animate = () => {
      frame++
      const progress = frame / steps
      const eased = 1 - Math.pow(1 - progress, 3) // Ease out cubic
      const current = Math.round(startValue + diff * eased)
      setDisplayScore(current)

      if (frame < steps) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [score, animated])

  // Direction info with colors
  const getDirectionInfo = () => {
    switch (direction) {
      case 'bullish':
        return {
          Icon: TrendingUp,
          color: colors.emerald[400],
          label: 'LONG',
          glowColor: 'rgba(52, 211, 153, 0.4)',
        }
      case 'bearish':
        return {
          Icon: TrendingDown,
          color: colors.red[400],
          label: 'SHORT',
          glowColor: 'rgba(248, 113, 113, 0.4)',
        }
      default:
        return {
          Icon: Minus,
          color: colors.text[50],
          label: 'WAIT',
          glowColor: 'rgba(168, 85, 247, 0.3)',
        }
    }
  }

  const directionInfo = getDirectionInfo()

  // Score glow based on direction and completeness
  const getScoreGlow = () => {
    if (!isComplete) return '0 0 8px rgba(168, 85, 247, 0.2)'
    if (direction === 'bullish') return `0 0 20px ${directionInfo.glowColor}`
    if (direction === 'bearish') return `0 0 20px ${directionInfo.glowColor}`
    return '0 0 15px rgba(168, 85, 247, 0.4)'
  }

  // Status icon - Zap when loading, Sparkles when complete
  const StatusIcon = isComplete ? Sparkles : Zap
  const statusIconColor = isComplete ? colors.purple[400] : colors.indigo[400]

  return (
    <div
      className={`progressive-score-ring ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      {/* Main Ring Container */}
      <div
        style={{
          width: ring,
          height: ring,
          position: 'relative',
        }}
      >
        <svg
          width={ring}
          height={ring}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            {/* Unicorn gradient for complete score */}
            <linearGradient id={`${gradientId}-full`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>

            {/* Subdued gradient for loading/incomplete */}
            <linearGradient id={`${gradientId}-partial`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.7" />
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

          {/* "Potential" ring - shows what's possible with full data */}
          {!isComplete && (
            <circle
              cx={ring / 2}
              cy={ring / 2}
              r={radius}
              fill="none"
              stroke="rgba(168, 85, 247, 0.15)"
              strokeWidth={stroke}
              strokeDasharray={`${circumference * 0.5} ${circumference}`}
              style={{ opacity: 0.5 }}
            />
          )}

          {/* Score ring - animated fill */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId}-${isComplete ? 'full' : 'partial'})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: animated
                ? `stroke-dashoffset 0.8s ${animation.easing.smooth}`
                : 'none',
              filter: `drop-shadow(${getScoreGlow()})`,
            }}
          />
        </svg>

        {/* Score value + status icon */}
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
          {/* Loading indicator */}
          {loading && !isComplete && (
            <Loader2
              size={12}
              style={{
                color: colors.purple[400],
                animation: 'spin 1s linear infinite',
                position: 'absolute',
                top: size === 'sm' ? 4 : 8,
              }}
            />
          )}

          {/* Score number */}
          <span
            style={{
              fontSize,
              fontWeight: 900,
              background: isComplete ? gradients.unicorn : `linear-gradient(135deg, ${colors.indigo[400]}, ${colors.purple[400]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
            }}
          >
            {displayScore}
          </span>

          {/* Status icon below score */}
          {size !== 'sm' && (
            <StatusIcon
              size={12}
              style={{
                color: statusIconColor,
                marginTop: 2,
                opacity: 0.8,
              }}
            />
          )}
        </div>

        {/* Direction badge */}
        {showDirection && isComplete && (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: size === 'sm' ? 18 : 24,
              height: size === 'sm' ? 18 : 24,
              borderRadius: '50%',
              background: colors.void,
              border: `2px solid ${directionInfo.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 8px ${directionInfo.glowColor}`,
            }}
          >
            <directionInfo.Icon
              size={size === 'sm' ? 10 : 12}
              style={{ color: directionInfo.color }}
            />
          </div>
        )}
      </div>

      {/* Direction label */}
      {showDirection && isComplete && size !== 'sm' && (
        <div
          style={{
            marginTop: 6,
            fontSize: 10,
            fontWeight: 700,
            color: directionInfo.color,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {directionInfo.label}
        </div>
      )}

      {/* Breakdown bars (expanded view) */}
      {showBreakdown && breakdown && (
        <div
          style={{
            marginTop: 12,
            width: '100%',
            minWidth: 160,
            padding: 12,
            background: colors.glass.bg,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colors.glass.border}`,
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: colors.text[50], marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Score Breakdown
          </div>

          {/* Technical */}
          <ProgressiveBreakdownBar
            icon={Zap}
            label="Technical"
            value={breakdown.technical}
            max={50}
            color={colors.indigo[500]}
            loaded={breakdown.technical !== null}
          />

          {/* Sentiment */}
          <ProgressiveBreakdownBar
            icon={null}
            label="Sentiment"
            value={breakdown.sentiment}
            max={25}
            color={colors.purple[500]}
            loaded={breakdown.sentiment !== null}
          />

          {/* Forecast */}
          <ProgressiveBreakdownBar
            icon={null}
            label="Forecast"
            value={breakdown.forecast}
            max={25}
            color={colors.cyan[400]}
            loaded={breakdown.forecast !== null}
          />
        </div>
      )}
    </div>
  )
})

/**
 * Progressive Breakdown Bar - Shows loading state for each component
 */
const ProgressiveBreakdownBar = memo(function ProgressiveBreakdownBar({
  icon: Icon,
  label,
  value,
  max,
  color,
  loaded = false,
}) {
  const percentage = loaded && value !== null ? (value / max) * 100 : 0

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 3,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {Icon && <Icon size={10} style={{ color: colors.text[50] }} />}
          <span style={{ fontSize: 11, color: colors.text[50] }}>{label}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: loaded ? colors.text[70] : colors.text[30] }}>
          {loaded ? `${value}/${max}` : '—'}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {loaded ? (
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: color,
              borderRadius: 2,
              transition: `width ${animation.duration.slow}ms ${animation.easing.smooth}`,
            }}
          />
        ) : (
          <div
            style={{
              height: '100%',
              width: '30%',
              background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
              borderRadius: 2,
              animation: 'shimmer 1.5s infinite',
            }}
          />
        )}
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
