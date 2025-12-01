/**
 * LEGENDARY Expandable Score Card
 *
 * Shows Unicorn Score on chart view, expandable for details
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Score Card section)
 */

import { useState } from 'react'
import {
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  Brain,
  Activity,
} from 'lucide-react'
import { ScoreRing } from './ui/ScoreRing'
import { colors, gradients, animation, spacing, radius, typography, shadows } from '../styles/tokens'

// Score breakdown factors
const scoreFactors = [
  { id: 'technical', label: 'Technical', value: 92, icon: BarChart3, color: colors.cyan[400] },
  { id: 'momentum', label: 'Momentum', value: 85, icon: TrendingUp, color: colors.emerald[400] },
  { id: 'sentiment', label: 'Sentiment', value: 78, icon: Brain, color: colors.purple[400] },
  { id: 'pattern', label: 'Pattern', value: 88, icon: Activity, color: colors.indigo[400] },
]

export default function ExpandableScoreCard({
  symbol = 'SPY',
  score = 87,
  trend = 'bullish',
  signal = 'Strong Buy',
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const trendColor = trend === 'bullish' ? colors.emerald[400] : colors.red[400]
  const TrendIcon = trend === 'bullish' ? TrendingUp : TrendingDown

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90, // Above bottom nav
        left: spacing[4],
        right: spacing[4],
        background: colors.glass.bgHeavy,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: radius['2xl'],
        border: `1px solid ${colors.glass.border}`,
        boxShadow: shadows.lg,
        overflow: 'hidden',
        transition: `all ${animation.duration.normal}ms ${animation.easing.spring}`,
        zIndex: 25,
      }}
    >
      {/* Main Row - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[4],
          width: '100%',
          padding: spacing[4],
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Score Ring */}
        <ScoreRing score={score} size="md" />

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
              }}
            >
              Unicorn Score
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                background: `${trendColor}15`,
                borderRadius: radius.full,
              }}
            >
              <TrendIcon size={12} style={{ color: trendColor }} />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: '600',
                  color: trendColor,
                  textTransform: 'capitalize',
                }}
              >
                {trend}
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            <Zap size={14} style={{ color: colors.purple[400] }} />
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.purple[400],
                fontWeight: '600',
              }}
            >
              {signal}
            </span>
          </div>
        </div>

        {/* Expand Arrow */}
        <div
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.depth2,
            borderRadius: radius.lg,
            transition: `transform ${animation.duration.normal}ms ${animation.easing.spring}`,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronUp size={18} style={{ color: colors.text[50] }} />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          style={{
            padding: `0 ${spacing[4]}px ${spacing[4]}px`,
            borderTop: `1px solid ${colors.glass.border}`,
            animation: `slideDown ${animation.duration.normal}ms ${animation.easing.smooth}`,
          }}
        >
          {/* Score Factors */}
          <div style={{ paddingTop: spacing[4] }}>
            <h4
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wider,
                color: colors.text[50],
                marginBottom: spacing[3],
              }}
            >
              Score Breakdown
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: spacing[3],
              }}
            >
              {scoreFactors.map((factor) => (
                <ScoreFactor key={factor.id} factor={factor} />
              ))}
            </div>
          </div>

          {/* Quick Insight */}
          <div
            style={{
              marginTop: spacing[4],
              padding: spacing[3],
              background: `linear-gradient(135deg, ${colors.purple[500]}10 0%, ${colors.cyan[400]}10 100%)`,
              borderRadius: radius.lg,
              border: `1px solid ${colors.purple[500]}20`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                marginBottom: spacing[2],
              }}
            >
              <Brain size={14} style={{ color: colors.purple[400] }} />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: '600',
                  color: colors.purple[400],
                }}
              >
                AVA Insight
              </span>
            </div>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text[70],
                lineHeight: 1.5,
              }}
            >
              Strong momentum with bullish technical setup. Consider entry on pullback to support at $590.
            </p>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: spacing[3],
              marginTop: spacing[4],
            }}
          >
            <ActionButton
              label="Buy"
              color={colors.emerald[400]}
              gradient={gradients.buyButton}
            />
            <ActionButton
              label="Sell"
              color={colors.red[400]}
              gradient={gradients.sellButton}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
      `}</style>
    </div>
  )
}

// Score Factor Component
function ScoreFactor({ factor }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[3],
        background: colors.depth2,
        borderRadius: radius.lg,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${factor.color}15`,
          borderRadius: radius.md,
        }}
      >
        <factor.icon size={18} style={{ color: factor.color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text[50],
            marginBottom: 2,
          }}
        >
          {factor.label}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: factor.color,
          }}
        >
          {factor.value}
        </div>
      </div>
    </div>
  )
}

// Action Button
function ActionButton({ label, color, gradient }) {
  return (
    <button
      style={{
        padding: spacing[4],
        background: gradient,
        border: 'none',
        borderRadius: radius.lg,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: '#fff',
        cursor: 'pointer',
        transition: `all ${animation.duration.fast}ms`,
        boxShadow: `0 4px 12px ${color}40`,
      }}
    >
      {label}
    </button>
  )
}
