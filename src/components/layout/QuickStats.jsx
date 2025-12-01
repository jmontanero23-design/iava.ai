/**
 * LEGENDARY QuickStats Bar
 *
 * Top bar showing key market stats and portfolio performance
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html (QuickStats section)
 */

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  Zap,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../../styles/tokens'

// Demo market data
const marketData = {
  indices: [
    { symbol: 'SPY', name: 'S&P 500', price: 594.82, change: 0.59 },
    { symbol: 'QQQ', name: 'Nasdaq', price: 511.23, change: 0.82 },
    { symbol: 'DIA', name: 'Dow Jones', price: 436.15, change: 0.34 },
    { symbol: 'VIX', name: 'Volatility', price: 13.42, change: -2.15 },
  ],
  portfolio: {
    dayPnl: 2847.23,
    dayPnlPercent: 2.28,
    openPositions: 5,
  },
  session: {
    isMarketOpen: true,
    nextEvent: 'Market closes in 2h 34m',
  },
}

export default function QuickStats() {
  const [data, setData] = useState(marketData)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing[2]}px ${spacing[4]}px`,
        background: colors.glass.bg,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.glass.border}`,
      }}
    >
      {/* Left: Market Indices */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[4],
        }}
      >
        {data.indices.map((index) => (
          <IndexTicker key={index.symbol} data={index} />
        ))}
      </div>

      {/* Center: Portfolio Quick Stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[4],
        }}
      >
        {/* Day P/L */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: data.portfolio.dayPnl >= 0 ? colors.emerald.dim : colors.red.dim,
              borderRadius: radius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {data.portfolio.dayPnl >= 0 ? (
              <TrendingUp size={14} style={{ color: colors.emerald[400] }} />
            ) : (
              <TrendingDown size={14} style={{ color: colors.red[400] }} />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: data.portfolio.dayPnl >= 0 ? colors.emerald[400] : colors.red[400],
                fontFamily: typography.fontFamily.mono,
              }}
            >
              {data.portfolio.dayPnl >= 0 ? '+' : ''}${Math.abs(data.portfolio.dayPnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div
              style={{
                fontSize: 10,
                color: colors.text[50],
              }}
            >
              Today's P/L
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 32,
            background: colors.glass.border,
          }}
        />

        {/* Open Positions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: colors.purple.dim,
              borderRadius: radius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={14} style={{ color: colors.purple[400] }} />
          </div>
          <div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
              }}
            >
              {data.portfolio.openPositions}
            </div>
            <div
              style={{
                fontSize: 10,
                color: colors.text[50],
              }}
            >
              Open Positions
            </div>
          </div>
        </div>
      </div>

      {/* Right: Session Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
        }}
      >
        {/* Market Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[1]}px ${spacing[3]}px`,
            background: data.session.isMarketOpen ? colors.emerald.dim : colors.red.dim,
            borderRadius: radius.full,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              background: data.session.isMarketOpen ? colors.emerald[400] : colors.red[400],
              borderRadius: '50%',
              animation: data.session.isMarketOpen ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: '600',
              color: data.session.isMarketOpen ? colors.emerald[400] : colors.red[400],
            }}
          >
            {data.session.isMarketOpen ? 'Market Open' : 'Market Closed'}
          </span>
        </div>

        {/* Time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
          }}
        >
          <Clock size={12} style={{ color: colors.text[50] }} />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: '600',
              color: colors.text[70],
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {formatTime(currentTime)} ET
          </span>
        </div>

        {/* AVA Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
            padding: `${spacing[1]}px ${spacing[2]}px`,
            background: colors.purple.dim,
            borderRadius: radius.full,
          }}
        >
          <Zap size={12} style={{ color: colors.purple[400] }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: colors.purple[400],
            }}
          >
            AVA Active
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// Index Ticker Component
function IndexTicker({ data }) {
  const isPositive = data.change >= 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[2],
      }}
    >
      <span
        style={{
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.bold,
          color: colors.text[90],
        }}
      >
        {data.symbol}
      </span>
      <span
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: '600',
          color: colors.text[70],
          fontFamily: typography.fontFamily.mono,
        }}
      >
        {data.price.toFixed(2)}
      </span>
      <span
        style={{
          fontSize: typography.fontSize.xs,
          fontWeight: '600',
          color: isPositive ? colors.emerald[400] : colors.red[400],
        }}
      >
        {isPositive ? '+' : ''}{data.change.toFixed(2)}%
      </span>
    </div>
  )
}
