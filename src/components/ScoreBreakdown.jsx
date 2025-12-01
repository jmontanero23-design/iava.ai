/**
 * LEGENDARY Score Breakdown
 *
 * Detailed view of Unicorn Score components with explanations
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html (Score Breakdown section)
 */

import { useState } from 'react'
import {
  TrendingUp,
  Activity,
  Target,
  Zap,
  BarChart2,
  ChevronRight,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { ScoreRing } from './ui/ScoreRing'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Demo score data
const scoreFactors = [
  {
    id: 'technical',
    name: 'Technical Analysis',
    score: 92,
    weight: 30,
    icon: BarChart2,
    color: colors.cyan[400],
    description: 'Price action, support/resistance, and chart patterns',
    signals: [
      { text: 'Price above all major MAs', positive: true },
      { text: 'RSI shows strong momentum (68)', positive: true },
      { text: 'MACD bullish crossover', positive: true },
      { text: 'Volume confirming move', positive: true },
    ],
  },
  {
    id: 'momentum',
    name: 'Momentum',
    score: 85,
    weight: 25,
    icon: Activity,
    color: colors.purple[400],
    description: 'Rate of change and trend strength',
    signals: [
      { text: 'Strong upward momentum', positive: true },
      { text: 'Relative strength vs SPY: +2.3%', positive: true },
      { text: 'Accelerating volume', positive: true },
      { text: 'Minor divergence on 1H', positive: false },
    ],
  },
  {
    id: 'sentiment',
    name: 'Market Sentiment',
    score: 78,
    weight: 20,
    icon: Zap,
    color: colors.emerald[400],
    description: 'News sentiment and social indicators',
    signals: [
      { text: 'Positive news coverage', positive: true },
      { text: 'Social sentiment score: 72', positive: true },
      { text: 'Options flow neutral', positive: null },
      { text: 'Earnings in 12 days', positive: null },
    ],
  },
  {
    id: 'pattern',
    name: 'Pattern Recognition',
    score: 88,
    weight: 25,
    icon: Target,
    color: colors.indigo[400],
    description: 'AI-detected patterns and formations',
    signals: [
      { text: 'Bullish flag pattern', positive: true },
      { text: 'Cup & handle forming on daily', positive: true },
      { text: 'Golden cross detected', positive: true },
      { text: 'Near resistance level', positive: false },
    ],
  },
]

export default function ScoreBreakdown({
  symbol = 'NVDA',
  score = 87,
  onClose,
}) {
  const [expandedFactor, setExpandedFactor] = useState(null)

  // Calculate weighted score
  const calculateWeightedScore = () => {
    const totalWeight = scoreFactors.reduce((acc, f) => acc + f.weight, 0)
    const weightedSum = scoreFactors.reduce(
      (acc, f) => acc + (f.score * f.weight),
      0
    )
    return Math.round(weightedSum / totalWeight)
  }

  const calculatedScore = calculateWeightedScore()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[4],
      }}
    >
      {/* Header with main score */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.purple[500]}20 0%, ${colors.cyan[400]}20 100%)`,
          borderRadius: radius['2xl'],
          padding: spacing[6],
          textAlign: 'center',
          border: `1px solid ${colors.purple[500]}30`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 300,
            height: 300,
            background: `radial-gradient(circle, ${colors.purple.glow} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative' }}>
          <ScoreRing score={score} size="xl" />
          <h2
            style={{
              marginTop: spacing[4],
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.black,
              color: colors.text[100],
            }}
          >
            {symbol} Unicorn Score
          </h2>
          <p
            style={{
              marginTop: spacing[1],
              fontSize: typography.fontSize.sm,
              color: colors.text[50],
            }}
          >
            Composite score from {scoreFactors.length} factors
          </p>
        </div>
      </div>

      {/* Score interpretation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          padding: spacing[4],
          background: colors.emerald.dim,
          borderRadius: radius.xl,
          border: `1px solid ${colors.emerald[400]}30`,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: `${colors.emerald[400]}20`,
            borderRadius: radius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp size={24} style={{ color: colors.emerald[400] }} />
        </div>
        <div>
          <div
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.emerald[400],
            }}
          >
            Strong Buy Signal
          </div>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text[70],
            }}
          >
            Score of {score} indicates high probability setup
          </p>
        </div>
      </div>

      {/* Factor breakdown */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        <h3
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.text[100],
          }}
        >
          Score Components
        </h3>

        {scoreFactors.map((factor) => {
          const Icon = factor.icon
          const isExpanded = expandedFactor === factor.id

          return (
            <div
              key={factor.id}
              style={{
                background: colors.depth1,
                borderRadius: radius.xl,
                border: `1px solid ${isExpanded ? factor.color + '40' : colors.glass.border}`,
                overflow: 'hidden',
                transition: `all ${animation.duration.fast}ms`,
              }}
            >
              {/* Factor Header */}
              <button
                onClick={() =>
                  setExpandedFactor(isExpanded ? null : factor.id)
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                  width: '100%',
                  padding: spacing[4],
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: `${factor.color}15`,
                    borderRadius: radius.lg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} style={{ color: factor.color }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                    }}
                  >
                    <span
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text[100],
                      }}
                    >
                      {factor.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: colors.text[30],
                      }}
                    >
                      {factor.weight}% weight
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text[50],
                      marginTop: 2,
                    }}
                  >
                    {factor.description}
                  </p>
                </div>

                {/* Score */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 6,
                      background: colors.depth3,
                      borderRadius: radius.full,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${factor.score}%`,
                        height: '100%',
                        background: factor.color,
                        borderRadius: radius.full,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: factor.color,
                      fontFamily: typography.fontFamily.mono,
                      minWidth: 32,
                    }}
                  >
                    {factor.score}
                  </span>
                </div>

                <ChevronRight
                  size={16}
                  style={{
                    color: colors.text[30],
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: `transform ${animation.duration.fast}ms`,
                  }}
                />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div
                  style={{
                    padding: `0 ${spacing[4]}px ${spacing[4]}px`,
                    borderTop: `1px solid ${colors.glass.border}`,
                    animation: `slideIn ${animation.duration.normal}ms ${animation.easing.smooth}`,
                  }}
                >
                  <div
                    style={{
                      paddingTop: spacing[4],
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing[2],
                    }}
                  >
                    {factor.signals.map((signal, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[2],
                        }}
                      >
                        {signal.positive === true && (
                          <CheckCircle
                            size={14}
                            style={{ color: colors.emerald[400] }}
                          />
                        )}
                        {signal.positive === false && (
                          <AlertTriangle
                            size={14}
                            style={{ color: colors.amber[400] }}
                          />
                        )}
                        {signal.positive === null && (
                          <Info
                            size={14}
                            style={{ color: colors.text[30] }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.text[70],
                          }}
                        >
                          {signal.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Calculation note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: spacing[2],
          padding: spacing[3],
          background: colors.depth2,
          borderRadius: radius.lg,
        }}
      >
        <Info size={14} style={{ color: colors.text[30], marginTop: 2 }} />
        <p
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text[50],
            lineHeight: 1.5,
          }}
        >
          The Unicorn Score is calculated using a weighted combination of technical,
          momentum, sentiment, and pattern factors. Scores above 70 indicate strong
          setups with higher probability of success.
        </p>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
