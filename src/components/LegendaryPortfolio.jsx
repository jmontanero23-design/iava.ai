/**
 * LEGENDARY Portfolio Tab
 *
 * Portfolio overview with hero section and positions list
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Portfolio Tab section)
 *
 * Uses PositionsContext for real Alpaca data
 */

import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Zap,
  Target,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import StockLogo from './ui/StockLogo'
import { usePositions } from '../contexts/PositionsContext'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'
import avaMindService from '../services/avaMindService.js'

// Company name lookup for common symbols
const COMPANY_NAMES = {
  SPY: 'SPDR S&P 500 ETF',
  QQQ: 'Invesco QQQ Trust',
  AAPL: 'Apple Inc',
  TSLA: 'Tesla Inc',
  NVDA: 'NVIDIA Corporation',
  AMD: 'Advanced Micro Devices',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc',
  AMZN: 'Amazon.com Inc',
  META: 'Meta Platforms',
  NFLX: 'Netflix Inc',
}

export default function LegendaryPortfolio({ onSelectSymbol }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const { positions, portfolioStats, accountInfo, isLoading, refresh } = usePositions()

  // Transform Alpaca positions to our display format
  const data = useMemo(() => {
    const transformedPositions = positions.map(p => ({
      symbol: p.symbol,
      name: COMPANY_NAMES[p.symbol] || p.symbol,
      shares: parseFloat(p.qty || 0),
      avgCost: parseFloat(p.avg_entry_price || 0),
      currentPrice: parseFloat(p.current_price || 0),
      value: parseFloat(p.market_value || 0),
      pnl: parseFloat(p.unrealized_pl || 0),
      pnlPercent: parseFloat(p.unrealized_plpc || 0) * 100,
      score: 50 + Math.floor(Math.random() * 40), // Will be replaced with real scores
    }))

    // Calculate total return percent from equity and positions
    const totalReturnPct = portfolioStats.equity > 0
      ? ((portfolioStats.totalPnL / portfolioStats.equity) * 100)
      : 0

    // Get real stats from AVA Mind trade history
    const learning = avaMindService.getLearning()
    const trades = avaMindService.getRecentTrades(100)

    // Calculate average hold time from closed trades
    const closedTrades = trades.filter(t => t.holdDuration != null)
    const avgHoldTimeMinutes = closedTrades.length > 0
      ? closedTrades.reduce((sum, t) => sum + t.holdDuration, 0) / closedTrades.length
      : 0

    // Format hold time nicely
    let avgHoldTimeStr = '---'
    if (avgHoldTimeMinutes > 0) {
      const days = Math.floor(avgHoldTimeMinutes / 1440)
      const hours = Math.floor((avgHoldTimeMinutes % 1440) / 60)
      if (days > 0) {
        avgHoldTimeStr = `${days}d ${hours}h`
      } else if (hours > 0) {
        avgHoldTimeStr = `${hours}h`
      } else {
        avgHoldTimeStr = `${Math.floor(avgHoldTimeMinutes)}m`
      }
    }

    return {
      totalValue: portfolioStats.equity || portfolioStats.totalValue,
      dayChange: portfolioStats.totalPnL,
      dayChangePercent: portfolioStats.totalPnLPercent,
      totalReturn: portfolioStats.totalPnL,
      totalReturnPercent: totalReturnPct,
      equity: portfolioStats.equity,
      buyingPower: portfolioStats.buyingPower,
      winRate: learning?.winRate || 0, // Real win rate from AVA Mind
      avgHoldTime: avgHoldTimeStr, // Real average hold time from trade history
      positions: transformedPositions,
    }
  }, [positions, portfolioStats])

  const isPositive = data.dayChange >= 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[4],
        padding: spacing[4],
        paddingBottom: spacing[8],
      }}
    >
      {/* Portfolio Hero */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.indigo.dim} 0%, ${colors.purple.dim} 100%)`,
          borderRadius: radius['2xl'],
          padding: spacing[6],
          border: `1px solid ${colors.purple[500]}20`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${colors.purple.glow} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Label */}
        <div
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.wider,
            color: colors.text[50],
            marginBottom: spacing[2],
          }}
        >
          Total Portfolio Value
        </div>

        {/* Value */}
        <div
          style={{
            fontSize: typography.fontSize['5xl'],
            fontWeight: typography.fontWeight.black,
            color: colors.text[100],
            letterSpacing: typography.letterSpacing.tight,
            marginBottom: spacing[2],
            fontFamily: typography.fontFamily.mono,
          }}
        >
          ${data.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>

        {/* Change */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1],
              color: isPositive ? colors.emerald[400] : colors.red[400],
            }}
          >
            {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            <span
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              {isPositive ? '+' : ''}${Math.abs(data.dayChange).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div
            style={{
              padding: `${spacing[1]}px ${spacing[3]}px`,
              background: isPositive ? colors.emerald.dim : colors.red.dim,
              borderRadius: radius.md,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              color: isPositive ? colors.emerald[400] : colors.red[400],
            }}
          >
            {isPositive ? '+' : ''}{data.dayChangePercent.toFixed(2)}%
          </div>

          <span
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text[30],
            }}
          >
            Today
          </span>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: spacing[4],
            marginTop: spacing[5],
            paddingTop: spacing[5],
            borderTop: `1px solid ${colors.glass.border}`,
          }}
        >
          <StatItem
            value={`${data.winRate}%`}
            label="Win Rate"
            color={colors.emerald[400]}
          />
          <StatItem
            value={`+${data.totalReturnPercent}%`}
            label="All Time"
            color={colors.cyan[400]}
          />
          <StatItem
            value={data.avgHoldTime}
            label="Avg Hold"
            color={colors.purple[400]}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: spacing[3],
        }}
      >
        <QuickAction icon={Plus} label="Buy" color={colors.emerald[400]} />
        <QuickAction icon={Target} label="Sell" color={colors.red[400]} />
        <QuickAction icon={Zap} label="Quick Trade" gradient />
      </div>

      {/* Positions Section */}
      <div style={{ padding: `0 0 100px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing[3],
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: colors.text[100],
            }}
          >
            Positions
          </h2>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]}px ${spacing[3]}px`,
              fontSize: 13,
              fontWeight: 600,
              color: colors.purple[400],
              background: colors.purple.dim,
              border: 'none',
              borderRadius: radius.md,
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </button>
        </div>

        {/* Positions List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3],
          }}
        >
          {data.positions.map((position) => (
            <PositionCard
              key={position.symbol}
              position={position}
              onSelect={() => onSelectSymbol?.(position.symbol)}
            />
          ))}
        </div>
      </div>

      {/* AVA Insight */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.purple[500]}15 0%, ${colors.cyan[400]}15 100%)`,
          borderRadius: radius.xl,
          padding: spacing[4],
          border: `1px solid ${colors.purple[500]}30`,
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
          <Zap size={16} style={{ color: colors.purple[400] }} />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.purple[400],
            }}
          >
            AVA Portfolio Insight
          </span>
        </div>
        <p
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text[90],
            lineHeight: 1.5,
          }}
        >
          Your portfolio is <strong style={{ color: colors.emerald[400] }}>outperforming</strong> the S&P 500 by 12.3% this month.
          Consider taking partial profits on <strong>NVDA</strong> as it approaches resistance.
        </p>
      </div>
    </div>
  )
}

// Stat Item Component
function StatItem({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.extrabold,
          color: color || colors.text[100],
          marginBottom: 2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: typography.fontSize.xs,
          color: colors.text[50],
        }}
      >
        {label}
      </div>
    </div>
  )
}

// Quick Action Button
function QuickAction({ icon: Icon, label, color, gradient }) {
  return (
    <button
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing[2],
        padding: spacing[4],
        background: gradient ? gradients.unicorn : colors.depth2,
        border: gradient ? 'none' : `1px solid ${colors.glass.border}`,
        borderRadius: radius.xl,
        cursor: 'pointer',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      <Icon
        size={20}
        style={{ color: gradient ? '#fff' : color }}
      />
      <span
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: '600',
          color: gradient ? '#fff' : colors.text[70],
        }}
      >
        {label}
      </span>
    </button>
  )
}

// Position Card Component with LEGENDARY hover effects
function PositionCard({ position, onSelect }) {
  const [isHovered, setIsHovered] = useState(false)
  const isPositive = position.pnl >= 0

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: 14,
        background: colors.depth1,
        border: `1px solid ${isHovered ? 'rgba(139, 92, 246, 0.3)' : colors.glass.border}`,
        borderRadius: 14,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
        transform: isHovered ? 'translateX(4px)' : 'none',
      }}
    >
      {/* Unicorn left bar on hover */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: gradients.unicorn,
          transform: isHovered ? 'scaleY(1)' : 'scaleY(0)',
          transition: `transform ${animation.duration.fast}ms ${animation.easing.spring}`,
        }}
      />

      {/* Position Logo */}
      <StockLogo
        symbol={position.symbol}
        size={46}
        borderRadius={11}
      />

      {/* Position Info */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            color: colors.text[100],
            marginBottom: 2,
          }}
        >
          {position.symbol}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text[50],
          }}
        >
          {position.shares} shares
        </div>
      </div>

      {/* Value & P/L */}
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            color: colors.text[100],
            fontFamily: typography.fontFamily.mono,
            marginBottom: 2,
          }}
        >
          ${position.value.toLocaleString('en-US', { minimumFractionDigits: 0 })}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: '600',
            color: isPositive ? colors.emerald[400] : colors.red[400],
          }}
        >
          {isPositive ? '+' : ''}${Math.abs(position.pnl).toFixed(0)} ({isPositive ? '+' : ''}{position.pnlPercent.toFixed(1)}%)
        </div>
      </div>
    </button>
  )
}
