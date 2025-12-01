/**
 * LEGENDARY Portfolio Tab
 *
 * Portfolio overview with hero section and positions list
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Portfolio Tab section)
 */

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Zap,
  Target,
} from 'lucide-react'
import StockLogo from './ui/StockLogo'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Demo portfolio data
const portfolioData = {
  totalValue: 127432.56,
  dayChange: 2847.23,
  dayChangePercent: 2.28,
  totalReturn: 32847.23,
  totalReturnPercent: 34.7,
  winRate: 73,
  avgHoldTime: '4.2 days',
  positions: [
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      shares: 25,
      avgCost: 118.42,
      currentPrice: 142.56,
      value: 3564.00,
      pnl: 603.50,
      pnlPercent: 20.38,
      score: 87,
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc',
      shares: 50,
      avgCost: 165.20,
      currentPrice: 178.32,
      value: 8916.00,
      pnl: 656.00,
      pnlPercent: 7.94,
      score: 72,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc',
      shares: 15,
      avgCost: 198.50,
      currentPrice: 234.12,
      value: 3511.80,
      pnl: 534.30,
      pnlPercent: 17.94,
      score: 65,
    },
    {
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      shares: 30,
      avgCost: 142.30,
      currentPrice: 156.78,
      value: 4703.40,
      pnl: 434.40,
      pnlPercent: 10.17,
      score: 78,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 20,
      avgCost: 352.10,
      currentPrice: 378.45,
      value: 7569.00,
      pnl: 527.00,
      pnlPercent: 7.48,
      score: 76,
    },
  ],
}

export default function LegendaryPortfolio({ onSelectSymbol }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const data = portfolioData

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
          <a
            href="#"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.purple[400],
              textDecoration: 'none',
            }}
          >
            View All
          </a>
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
