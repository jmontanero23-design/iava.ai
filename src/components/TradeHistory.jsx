/**
 * LEGENDARY Trade History Panel
 *
 * Past trades with performance analytics
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html (Trade History section)
 */

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  ChevronRight,
  Clock,
  DollarSign,
  Target,
  Award,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Demo trade history
const demoTrades = [
  {
    id: 1,
    symbol: 'NVDA',
    side: 'buy',
    entryPrice: 118.42,
    exitPrice: 142.56,
    shares: 25,
    pnl: 603.50,
    pnlPercent: 20.38,
    entryDate: '2024-11-15',
    exitDate: '2024-11-28',
    holdTime: '13 days',
    status: 'closed',
  },
  {
    id: 2,
    symbol: 'AAPL',
    side: 'buy',
    entryPrice: 165.20,
    exitPrice: 178.32,
    shares: 50,
    pnl: 656.00,
    pnlPercent: 7.94,
    entryDate: '2024-11-20',
    exitDate: '2024-11-27',
    holdTime: '7 days',
    status: 'closed',
  },
  {
    id: 3,
    symbol: 'TSLA',
    side: 'buy',
    entryPrice: 198.50,
    exitPrice: null,
    shares: 15,
    pnl: 534.30,
    pnlPercent: 17.94,
    entryDate: '2024-11-22',
    exitDate: null,
    holdTime: '8 days',
    status: 'open',
  },
  {
    id: 4,
    symbol: 'META',
    side: 'sell',
    entryPrice: 545.00,
    exitPrice: 520.25,
    shares: 10,
    pnl: 247.50,
    pnlPercent: 4.54,
    entryDate: '2024-11-18',
    exitDate: '2024-11-25',
    holdTime: '7 days',
    status: 'closed',
  },
  {
    id: 5,
    symbol: 'AMD',
    side: 'buy',
    entryPrice: 142.30,
    exitPrice: 138.15,
    shares: 30,
    pnl: -124.50,
    pnlPercent: -2.92,
    entryDate: '2024-11-10',
    exitDate: '2024-11-14',
    holdTime: '4 days',
    status: 'closed',
  },
]

export default function TradeHistory({ onSelectTrade }) {
  const [filter, setFilter] = useState('all')
  const [period, setPeriod] = useState('30d')

  const filteredTrades = demoTrades.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'open') return t.status === 'open'
    if (filter === 'closed') return t.status === 'closed'
    if (filter === 'winners') return t.pnl > 0
    if (filter === 'losers') return t.pnl < 0
    return true
  })

  // Calculate summary stats
  const stats = {
    totalTrades: filteredTrades.length,
    winRate: Math.round((filteredTrades.filter((t) => t.pnl > 0).length / filteredTrades.length) * 100),
    totalPnl: filteredTrades.reduce((acc, t) => acc + t.pnl, 0),
    avgPnl: filteredTrades.reduce((acc, t) => acc + t.pnl, 0) / filteredTrades.length,
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[4],
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text[100],
          }}
        >
          Trade History
        </h2>

        {/* Period Selector */}
        <div
          style={{
            display: 'flex',
            gap: spacing[1],
            background: colors.depth2,
            padding: 2,
            borderRadius: radius.lg,
          }}
        >
          {['7d', '30d', '90d', 'All'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: `${spacing[1]}px ${spacing[2]}px`,
                background: period === p ? colors.purple.dim : 'transparent',
                border: 'none',
                borderRadius: radius.md,
                cursor: 'pointer',
                fontSize: typography.fontSize.xs,
                fontWeight: period === p ? '600' : '500',
                color: period === p ? colors.purple[400] : colors.text[50],
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: spacing[2],
        }}
      >
        <StatCard
          value={stats.totalTrades}
          label="Trades"
          icon={Target}
          color={colors.cyan[400]}
        />
        <StatCard
          value={`${stats.winRate}%`}
          label="Win Rate"
          icon={Award}
          color={colors.emerald[400]}
        />
        <StatCard
          value={`$${Math.abs(stats.totalPnl).toFixed(0)}`}
          label="Total P/L"
          icon={DollarSign}
          color={stats.totalPnl >= 0 ? colors.emerald[400] : colors.red[400]}
          prefix={stats.totalPnl >= 0 ? '+' : '-'}
        />
        <StatCard
          value={`$${Math.abs(stats.avgPnl).toFixed(0)}`}
          label="Avg P/L"
          icon={TrendingUp}
          color={stats.avgPnl >= 0 ? colors.emerald[400] : colors.red[400]}
          prefix={stats.avgPnl >= 0 ? '+' : '-'}
        />
      </div>

      {/* Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: spacing[2],
          overflowX: 'auto',
        }}
      >
        {['all', 'open', 'closed', 'winners', 'losers'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: `${spacing[1]}px ${spacing[3]}px`,
              background: filter === f ? colors.purple.dim : 'transparent',
              border: `1px solid ${filter === f ? colors.purple[400] + '40' : colors.glass.border}`,
              borderRadius: radius.full,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: filter === f ? '600' : '500',
                color: filter === f ? colors.purple[400] : colors.text[50],
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All Trades' : f}
            </span>
          </button>
        ))}
      </div>

      {/* Trades List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[2],
        }}
      >
        {filteredTrades.map((trade) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            onClick={() => onSelectTrade?.(trade)}
          />
        ))}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ value, label, icon: Icon, color, prefix = '' }) {
  return (
    <div
      style={{
        background: colors.depth1,
        borderRadius: radius.lg,
        padding: spacing[3],
        border: `1px solid ${colors.glass.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
          marginBottom: spacing[1],
        }}
      >
        <Icon size={14} style={{ color: color }} />
        <span
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: color,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          {prefix}{value}
        </span>
      </div>
      <span
        style={{
          fontSize: 10,
          color: colors.text[50],
        }}
      >
        {label}
      </span>
    </div>
  )
}

// Trade Card Component
function TradeCard({ trade, onClick }) {
  const isPositive = trade.pnl >= 0
  const isOpen = trade.status === 'open'

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[3],
        background: colors.depth1,
        border: `1px solid ${isOpen ? colors.cyan[400] + '30' : colors.glass.border}`,
        borderRadius: radius.lg,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      {/* Symbol & Side */}
      <div
        style={{
          width: 48,
          height: 48,
          background: trade.side === 'buy' ? colors.emerald.dim : colors.red.dim,
          borderRadius: radius.lg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            color: trade.side === 'buy' ? colors.emerald[400] : colors.red[400],
          }}
        >
          {trade.symbol}
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: '600',
            color: trade.side === 'buy' ? colors.emerald[400] : colors.red[400],
            textTransform: 'uppercase',
          }}
        >
          {trade.side}
        </span>
      </div>

      {/* Trade Info */}
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
              fontSize: typography.fontSize.sm,
              color: colors.text[70],
            }}
          >
            {trade.shares} shares @ ${trade.entryPrice.toFixed(2)}
          </span>
          {isOpen && (
            <span
              style={{
                padding: `1px ${spacing[2]}px`,
                background: colors.cyan.dim,
                borderRadius: radius.full,
                fontSize: 9,
                fontWeight: '600',
                color: colors.cyan[400],
                textTransform: 'uppercase',
              }}
            >
              Open
            </span>
          )}
        </div>

        {/* Dates */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Calendar size={10} style={{ color: colors.text[30] }} />
            <span
              style={{
                fontSize: 10,
                color: colors.text[30],
              }}
            >
              {trade.entryDate}
            </span>
          </div>
          {trade.exitDate && (
            <>
              <span style={{ fontSize: 10, color: colors.text[30] }}>→</span>
              <span style={{ fontSize: 10, color: colors.text[30] }}>
                {trade.exitDate}
              </span>
            </>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Clock size={10} style={{ color: colors.text[30] }} />
            <span style={{ fontSize: 10, color: colors.text[30] }}>
              {trade.holdTime}
            </span>
          </div>
        </div>
      </div>

      {/* P/L */}
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            marginBottom: 2,
          }}
        >
          {isPositive ? (
            <TrendingUp size={14} style={{ color: colors.emerald[400] }} />
          ) : (
            <TrendingDown size={14} style={{ color: colors.red[400] }} />
          )}
          <span
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: isPositive ? colors.emerald[400] : colors.red[400],
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {isPositive ? '+' : ''}${trade.pnl.toFixed(2)}
          </span>
        </div>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: '600',
            color: isPositive ? colors.emerald[400] : colors.red[400],
          }}
        >
          {isPositive ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
        </span>
      </div>

      <ChevronRight size={16} style={{ color: colors.text[30], flexShrink: 0 }} />
    </button>
  )
}
