/**
 * LEGENDARY Chart Overlay
 *
 * Floating overlay on chart showing key trading info
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html (Chart overlay elements)
 */

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Activity,
  Zap,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Quick stats that overlay on the chart
export function ChartQuickStats({ symbol = 'SPY', data = {} }) {
  const {
    price = 594.82,
    change = 3.47,
    changePercent = 0.59,
    high = 596.20,
    low = 591.50,
    volume = '42.3M',
    vwap = 593.15,
  } = data

  const isPositive = change >= 0

  return (
    <div
      style={{
        position: 'absolute',
        top: spacing[3],
        left: spacing[3],
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[2],
        zIndex: 10,
      }}
    >
      {/* Symbol & Price */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          padding: `${spacing[2]}px ${spacing[3]}px`,
          background: colors.glass.bgHeavy,
          backdropFilter: 'blur(12px)',
          borderRadius: radius.xl,
          border: `1px solid ${colors.glass.border}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.black,
              color: colors.text[100],
              fontFamily: typography.fontFamily.mono,
              lineHeight: 1,
            }}
          >
            ${price.toFixed(2)}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1],
              marginTop: 2,
            }}
          >
            {isPositive ? (
              <ChevronUp size={14} style={{ color: colors.emerald[400] }} />
            ) : (
              <ChevronDown size={14} style={{ color: colors.red[400] }} />
            )}
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: isPositive ? colors.emerald[400] : colors.red[400],
              }}
            >
              {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Key Levels */}
      <div
        style={{
          display: 'flex',
          gap: spacing[2],
        }}
      >
        <div
          style={{
            padding: `${spacing[1]}px ${spacing[2]}px`,
            background: colors.glass.bg,
            backdropFilter: 'blur(8px)',
            borderRadius: radius.lg,
            border: `1px solid ${colors.glass.border}`,
          }}
        >
          <span style={{ fontSize: 10, color: colors.text[30] }}>H </span>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.emerald[400],
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {high.toFixed(2)}
          </span>
        </div>
        <div
          style={{
            padding: `${spacing[1]}px ${spacing[2]}px`,
            background: colors.glass.bg,
            backdropFilter: 'blur(8px)',
            borderRadius: radius.lg,
            border: `1px solid ${colors.glass.border}`,
          }}
        >
          <span style={{ fontSize: 10, color: colors.text[30] }}>L </span>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.red[400],
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {low.toFixed(2)}
          </span>
        </div>
        <div
          style={{
            padding: `${spacing[1]}px ${spacing[2]}px`,
            background: colors.glass.bg,
            backdropFilter: 'blur(8px)',
            borderRadius: radius.lg,
            border: `1px solid ${colors.glass.border}`,
          }}
        >
          <span style={{ fontSize: 10, color: colors.text[30] }}>V </span>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text[70],
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {volume}
          </span>
        </div>
      </div>
    </div>
  )
}

// Trade entry/exit overlay
export function TradeLevelsOverlay({
  entry,
  stopLoss,
  takeProfit,
  currentPrice,
  side = 'buy',
  onClose,
}) {
  if (!entry) return null

  const isBuy = side === 'buy'
  const riskReward = takeProfit && stopLoss
    ? Math.abs(takeProfit - entry) / Math.abs(entry - stopLoss)
    : null

  const pnl = currentPrice
    ? isBuy
      ? ((currentPrice - entry) / entry) * 100
      : ((entry - currentPrice) / entry) * 100
    : 0

  const pnlColor = pnl >= 0 ? colors.emerald[400] : colors.red[400]

  return (
    <div
      style={{
        position: 'absolute',
        top: spacing[3],
        right: spacing[3],
        width: 180,
        background: colors.glass.bgHeavy,
        backdropFilter: 'blur(12px)',
        borderRadius: radius.xl,
        border: `1px solid ${isBuy ? colors.emerald[400] + '30' : colors.red[400] + '30'}`,
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing[2]}px ${spacing[3]}px`,
          background: isBuy ? colors.emerald.dim : colors.red.dim,
          borderBottom: `1px solid ${colors.glass.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          {isBuy ? (
            <TrendingUp size={14} style={{ color: colors.emerald[400] }} />
          ) : (
            <TrendingDown size={14} style={{ color: colors.red[400] }} />
          )}
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold,
              color: isBuy ? colors.emerald[400] : colors.red[400],
              textTransform: 'uppercase',
            }}
          >
            {isBuy ? 'Long' : 'Short'} Position
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <X size={14} style={{ color: colors.text[30] }} />
          </button>
        )}
      </div>

      {/* Levels */}
      <div style={{ padding: spacing[3] }}>
        {/* Entry */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing[2],
          }}
        >
          <span style={{ fontSize: typography.fontSize.xs, color: colors.text[50] }}>
            Entry
          </span>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
              fontFamily: typography.fontFamily.mono,
            }}
          >
            ${entry.toFixed(2)}
          </span>
        </div>

        {/* Stop Loss */}
        {stopLoss && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing[2],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} style={{ color: colors.red[400] }} />
              <span style={{ fontSize: typography.fontSize.xs, color: colors.red[400] }}>
                Stop
              </span>
            </div>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: colors.red[400],
                fontFamily: typography.fontFamily.mono,
              }}
            >
              ${stopLoss.toFixed(2)}
            </span>
          </div>
        )}

        {/* Take Profit */}
        {takeProfit && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing[2],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Target size={12} style={{ color: colors.emerald[400] }} />
              <span style={{ fontSize: typography.fontSize.xs, color: colors.emerald[400] }}>
                Target
              </span>
            </div>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: colors.emerald[400],
                fontFamily: typography.fontFamily.mono,
              }}
            >
              ${takeProfit.toFixed(2)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: colors.glass.border,
            margin: `${spacing[2]}px 0`,
          }}
        />

        {/* R/R Ratio */}
        {riskReward && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing[2],
            }}
          >
            <span style={{ fontSize: typography.fontSize.xs, color: colors.text[50] }}>
              R/R Ratio
            </span>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: riskReward >= 2 ? colors.emerald[400] : colors.amber[400],
              }}
            >
              1:{riskReward.toFixed(1)}
            </span>
          </div>
        )}

        {/* Current P/L */}
        {currentPrice && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: typography.fontSize.xs, color: colors.text[50] }}>
              P/L
            </span>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: pnlColor,
              }}
            >
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Unicorn Score badge overlay
export function ScoreBadgeOverlay({ score = 87, label = 'Unicorn Score' }) {
  const getScoreColor = (s) => {
    if (s >= 80) return colors.emerald[400]
    if (s >= 60) return colors.amber[400]
    return colors.red[400]
  }

  const scoreColor = getScoreColor(score)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: spacing[3],
        right: spacing[3],
        display: 'flex',
        alignItems: 'center',
        gap: spacing[2],
        padding: `${spacing[2]}px ${spacing[3]}px`,
        background: colors.glass.bgHeavy,
        backdropFilter: 'blur(12px)',
        borderRadius: radius.xl,
        border: `1px solid ${scoreColor}30`,
        zIndex: 10,
      }}
    >
      <Zap size={16} style={{ color: scoreColor }} />
      <div>
        <div
          style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.black,
            color: scoreColor,
            fontFamily: typography.fontFamily.mono,
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: 9,
            color: colors.text[30],
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}

// Signal indicator overlay
export function SignalIndicatorOverlay({ signals = [] }) {
  if (signals.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: spacing[3],
        left: spacing[3],
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[1],
        zIndex: 10,
      }}
    >
      {signals.slice(0, 3).map((signal, idx) => {
        const isBullish = signal.type === 'bullish'
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[1]}px ${spacing[2]}px`,
              background: isBullish ? colors.emerald.dim : colors.red.dim,
              borderRadius: radius.lg,
              border: `1px solid ${isBullish ? colors.emerald[400] + '30' : colors.red[400] + '30'}`,
            }}
          >
            <Activity
              size={12}
              style={{ color: isBullish ? colors.emerald[400] : colors.red[400] }}
            />
            <span
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: isBullish ? colors.emerald[400] : colors.red[400],
              }}
            >
              {signal.text}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Combined chart overlay container
export default function ChartOverlay({
  symbol,
  priceData,
  tradeData,
  score,
  signals,
  showPrice = true,
  showTrade = false,
  showScore = true,
  showSignals = false,
}) {
  return (
    <>
      {showPrice && <ChartQuickStats symbol={symbol} data={priceData} />}
      {showTrade && tradeData && (
        <TradeLevelsOverlay
          entry={tradeData.entry}
          stopLoss={tradeData.stopLoss}
          takeProfit={tradeData.takeProfit}
          currentPrice={tradeData.currentPrice}
          side={tradeData.side}
          onClose={tradeData.onClose}
        />
      )}
      {showScore && score && <ScoreBadgeOverlay score={score} />}
      {showSignals && signals && <SignalIndicatorOverlay signals={signals} />}
    </>
  )
}
