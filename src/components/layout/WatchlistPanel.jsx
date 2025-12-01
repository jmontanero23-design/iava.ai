/**
 * LEGENDARY WatchlistPanel
 *
 * Desktop watchlist panel matching iAVA-LEGENDARY-DESKTOP_1.html exactly
 * Features:
 * - 280px width panel
 * - Header with count badge and action buttons
 * - Filter pills (All, Unicorns, Squeezes)
 * - Watchlist items with mini ScoreRing
 * - Active item highlighting
 */

import { useState } from 'react'
import {
  Search,
  Plus,
  Filter,
  TrendingUp,
  TrendingDown,
  Star,
} from 'lucide-react'
import { ScoreRing } from '../ui/ScoreRing'
import StockLogo from '../ui/StockLogo'
import { colors, gradients, animation, spacing, radius, typography } from '../../styles/tokens'

// Demo watchlist data
const watchlistData = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 142.56, change: 3.24, changePercent: 2.32, score: 87 },
  { symbol: 'AAPL', name: 'Apple Inc', price: 178.32, change: -0.89, changePercent: -0.50, score: 72 },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 234.12, change: 5.67, changePercent: 2.48, score: 65 },
  { symbol: 'MSFT', name: 'Microsoft', price: 378.45, change: 1.23, changePercent: 0.33, score: 78 },
  { symbol: 'AMD', name: 'AMD Inc', price: 156.78, change: -2.34, changePercent: -1.47, score: 58 },
  { symbol: 'META', name: 'Meta Platforms', price: 512.34, change: 4.56, changePercent: 0.90, score: 81 },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: 145.67, change: 0.45, changePercent: 0.31, score: 69 },
  { symbol: 'AMZN', name: 'Amazon.com', price: 185.23, change: -1.12, changePercent: -0.60, score: 74 },
]

const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'unicorns', label: 'Unicorns' },
  { id: 'squeezes', label: 'Squeezes' },
]

export default function WatchlistPanel({ onSelectSymbol, currentSymbol }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [hoveredItem, setHoveredItem] = useState(null)

  // Filter stocks based on active filter
  const filteredStocks = watchlistData.filter((stock) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unicorns') return stock.score >= 75
    if (activeFilter === 'squeezes') return stock.score < 60
    return true
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing[4],
          borderBottom: `1px solid ${colors.glass.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <h2
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.extrabold,
              color: colors.text[100],
            }}
          >
            Watchlist
          </h2>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold,
              padding: `${spacing[1]}px ${spacing[2]}px`,
              background: colors.purple.dim,
              color: colors.purple[400],
              borderRadius: radius.sm,
            }}
          >
            {watchlistData.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: spacing[1] }}>
          <PanelButton icon={Filter} />
          <PanelButton icon={Plus} />
        </div>
      </div>

      {/* Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: spacing[2],
          padding: `${spacing[3]}px ${spacing[4]}px`,
          borderBottom: `1px solid ${colors.glass.border}`,
        }}
      >
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter.id
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                padding: `${spacing[2]}px ${spacing[3]}px`,
                background: isActive ? gradients.unicorn : colors.depth1,
                border: `1px solid ${isActive ? 'transparent' : colors.glass.border}`,
                borderRadius: radius.md,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: isActive ? '#fff' : colors.text[50],
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
                boxShadow: isActive ? `0 0 20px ${colors.purple.glow}` : 'none',
              }}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* Stock List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing[2],
        }}
      >
        {filteredStocks.map((stock) => {
          const isActive = currentSymbol === stock.symbol
          const isHovered = hoveredItem === stock.symbol
          const isPositive = stock.change >= 0

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectSymbol?.(stock.symbol)}
              onMouseEnter={() => setHoveredItem(stock.symbol)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: spacing[3],
                marginBottom: spacing[1],
                background: isActive
                  ? colors.purple.dim
                  : isHovered
                    ? colors.depth1
                    : 'transparent',
                border: isActive
                  ? `1px solid ${colors.purple[500]}20`
                  : '1px solid transparent',
                borderRadius: radius.lg,
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
                textAlign: 'left',
              }}
            >
              {/* Stock Logo */}
              <StockLogo
                symbol={stock.symbol}
                size={40}
                borderRadius={radius.lg}
                style={{ marginRight: spacing[3] }}
              />

              {/* Stock Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.extrabold,
                    color: colors.text[100],
                    marginBottom: 2,
                  }}
                >
                  {stock.symbol}
                </div>
                <div
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text[50],
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {stock.name}
                </div>
              </div>

              {/* Price & Change */}
              <div style={{ textAlign: 'right', marginRight: spacing[2] }}>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    fontVariantNumeric: 'tabular-nums',
                    color: colors.text[100],
                    marginBottom: 2,
                  }}
                >
                  ${stock.price.toFixed(2)}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 4,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: isPositive ? colors.emerald[400] : colors.red[400],
                  }}
                >
                  {isPositive ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </div>
              </div>

              {/* Mini Score Ring */}
              <ScoreRing score={stock.score} size="sm" showLabel={false} />
            </button>
          )
        })}
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: ${colors.depth3};
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: ${colors.text[30]};
        }
      `}</style>
    </div>
  )
}

// Panel header button component
function PanelButton({ icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: radius.md,
        border: `1px solid ${colors.glass.border}`,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: `all ${animation.duration.fast}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.depth1
        e.currentTarget.style.borderColor = colors.glass.borderLight
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = colors.glass.border
      }}
    >
      <Icon size={14} style={{ color: colors.text[50] }} />
    </button>
  )
}
