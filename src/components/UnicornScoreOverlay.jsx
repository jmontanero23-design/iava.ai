/**
 * UnicornScoreOverlay - Floating score display for chart view
 *
 * Shows the Unicorn Score for the current symbol as a floating
 * overlay on the chart. Tappable to expand and show breakdown.
 *
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html ScoreCard design
 */

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { useMarketData } from '../contexts/MarketDataContext'
import { ScoreRing } from './ui/ScoreRing'
import { colors, gradients, animation } from '../styles/tokens'

export default function UnicornScoreOverlay({ className = '' }) {
  const { symbol, marketData } = useMarketData()
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate a demo score based on market data
  // In production, this would come from the AI scoring system
  const scoreData = useMemo(() => {
    if (!marketData) {
      return {
        score: 0,
        direction: 'neutral',
        breakdown: { technicals: 0, sentiment: 0, chronos: 0 },
        recommendation: 'Loading...',
      }
    }

    const change = marketData.change || 0
    const changePercent = marketData.changePercent || 0

    // Demo scoring logic (replace with real AI scoring)
    let technicals = 25 + Math.random() * 20
    let sentiment = 10 + Math.random() * 12
    let chronos = 8 + Math.random() * 15

    // Adjust based on price movement
    if (change > 0) {
      technicals += 5
      sentiment += 3
    } else if (change < 0) {
      technicals -= 3
      sentiment -= 2
    }

    const total = Math.round(technicals + sentiment + chronos)
    const direction = changePercent > 0.5 ? 'bullish' : changePercent < -0.5 ? 'bearish' : 'neutral'

    const recommendations = {
      bullish: `${symbol} showing bullish momentum. Consider entries on pullbacks.`,
      bearish: `${symbol} in bearish territory. Wait for support confirmation.`,
      neutral: `${symbol} consolidating. Watch for breakout direction.`,
    }

    return {
      score: Math.min(100, Math.max(0, total)),
      direction,
      breakdown: {
        technicals: Math.round(technicals),
        sentiment: Math.round(sentiment),
        chronos: Math.round(chronos),
      },
      recommendation: recommendations[direction],
    }
  }, [marketData, symbol])

  const directionConfig = {
    bullish: { icon: TrendingUp, color: colors.emerald[400], label: 'Bullish' },
    bearish: { icon: TrendingDown, color: colors.red[400], label: 'Bearish' },
    neutral: { icon: Minus, color: colors.text[50], label: 'Neutral' },
  }

  const config = directionConfig[scoreData.direction]
  const DirectionIcon = config.icon

  return (
    <div
      className={`fixed z-20 ${className}`}
      style={{
        top: '80px',
        right: '16px',
        maxWidth: '280px',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: colors.glass.bgHeavy,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colors.glass.border}`,
          borderRadius: 16,
          padding: isExpanded ? 16 : 12,
          cursor: 'pointer',
          transition: `all ${animation.duration.normal}ms ${animation.easing.smooth}`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), ${
            scoreData.score >= 70
              ? '0 0 20px rgba(168, 85, 247, 0.3)'
              : '0 0 10px rgba(0, 0, 0, 0.2)'
          }`,
        }}
      >
        {/* Collapsed view */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ScoreRing
            score={scoreData.score}
            size={isExpanded ? 'md' : 'sm'}
            showLabel={isExpanded}
            animated={true}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Direction badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 2,
              }}
            >
              <DirectionIcon size={12} style={{ color: config.color }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: config.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {config.label}
              </span>
            </div>

            {/* Symbol */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: colors.text[100],
              }}
            >
              {symbol || 'SPY'}
            </div>
          </div>

          {/* Expand/collapse indicator */}
          <div style={{ color: colors.text[30] }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Expanded view - breakdown */}
        {isExpanded && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${colors.glass.border}`,
            }}
          >
            {/* Recommendation */}
            <p
              style={{
                fontSize: 12,
                color: colors.text[70],
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              {scoreData.recommendation}
            </p>

            {/* Breakdown bars */}
            <BreakdownBar
              label="Technicals"
              value={scoreData.breakdown.technicals}
              max={50}
              color={colors.indigo[500]}
            />
            <BreakdownBar
              label="Sentiment"
              value={scoreData.breakdown.sentiment}
              max={25}
              color={colors.purple[500]}
            />
            <BreakdownBar
              label="Chronos AI"
              value={scoreData.breakdown.chronos}
              max={25}
              color={colors.cyan[400]}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Breakdown bar component
function BreakdownBar({ label, value, max, color }) {
  const percentage = (value / max) * 100

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 11, color: colors.text[50] }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.text[70] }}>
          {value}/{max}
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
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: color,
            borderRadius: 2,
            transition: `width ${animation.duration.slow}ms ${animation.easing.smooth}`,
          }}
        />
      </div>
    </div>
  )
}
