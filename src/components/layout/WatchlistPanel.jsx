/**
 * LEGENDARY Watchlist Panel
 *
 * Desktop watchlist with score rings (280px width)
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html
 */

import { useState } from 'react'
import { Search, Plus, TrendingUp, TrendingDown, Star, Filter } from 'lucide-react'
import { ScoreRing } from '../ui/ScoreRing'
import { colors, gradients, animation, spacing, radius, typography } from '../../styles/tokens'

// Demo watchlist data
const watchlistData = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 142.56, change: 3.24, score: 87, trend: 'up' },
  { symbol: 'AAPL', name: 'Apple Inc', price: 178.32, change: -0.89, score: 72, trend: 'down' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 234.12, change: 5.67, score: 65, trend: 'up' },
  { symbol: 'MSFT', name: 'Microsoft', price: 378.45, change: 1.23, score: 78, trend: 'up' },
  { symbol: 'AMD', name: 'AMD Inc', price: 156.78, change: -2.34, score: 58, trend: 'down' },
  { symbol: 'META', name: 'Meta', price: 512.34, change: 4.56, score: 81, trend: 'up' },
  { symbol: 'GOOGL', name: 'Alphabet', price: 145.67, change: 0.45, score: 69, trend: 'up' },
  { symbol: 'AMZN', name: 'Amazon', price: 185.23, change: -1.12, score: 74, trend: 'down' },
]

const filterTabs = ['All', 'Bullish', 'Bearish', 'Favorites']

export default function WatchlistPanel({ onSelectSymbol, currentSymbol }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [hoveredItem, setHoveredItem] = useState(null)

  // Filter stocks
  const filteredStocks = watchlistData.filter((stock) => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Bullish' && stock.trend === 'up') ||
      (activeFilter === 'Bearish' && stock.trend === 'down') ||
      (activeFilter === 'Favorites' && stock.score >= 75)
    return matchesSearch && matchesFilter
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: spacing[4],
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: spacing[4] }}>
        <h2
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text[100],
            marginBottom: spacing[3],
          }}
        >
          Watchlist
        </h2>

        {/* Search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[2]}px ${spacing[3]}px`,
            background: colors.depth2,
            borderRadius: radius.lg,
            border: `1px solid ${colors.glass.border}`,
          }}
        >
          <Search size={16} style={{ color: colors.text[50] }} />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: typography.fontSize.sm,
              color: colors.text[90],
            }}
          />
          <button
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: gradients.unicorn,
              borderRadius: radius.md,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} style={{ color: '#fff' }} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: spacing[1],
          marginBottom: spacing[4],
          overflowX: 'auto',
        }}
      >
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            style={{
              padding: `${spacing[1]}px ${spacing[3]}px`,
              fontSize: typography.fontSize.xs,
              fontWeight: activeFilter === tab ? '600' : '500',
              color: activeFilter === tab ? colors.text[100] : colors.text[50],
              background: activeFilter === tab ? colors.depth3 : 'transparent',
              border: `1px solid ${activeFilter === tab ? colors.glass.borderLight : 'transparent'}`,
              borderRadius: radius.full,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: `all ${animation.duration.fast}ms`,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stock list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          margin: `0 -${spacing[4]}px`,
          padding: `0 ${spacing[4]}px`,
        }}
      >
        {filteredStocks.map((stock) => {
          const isSelected = currentSymbol === stock.symbol
          const isHovered = hoveredItem === stock.symbol
          const isPositive = stock.change >= 0

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectSymbol?.(stock.symbol)}
              onMouseEnter={() => setHoveredItem(stock.symbol)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: spacing[3],
                marginBottom: spacing[2],
                background: isSelected
                  ? `${colors.purple[500]}15`
                  : isHovered
                    ? colors.depth2
                    : 'transparent',
                border: isSelected
                  ? `1px solid ${colors.purple[500]}30`
                  : '1px solid transparent',
                borderRadius: radius.lg,
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
              }}
            >
              {/* Score Ring */}
              <ScoreRing score={stock.score} size="sm" showLabel={false} />

              {/* Stock info */}
              <div style={{ flex: 1, textAlign: 'left' }}>
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
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text[100],
                    }}
                  >
                    {stock.symbol}
                  </span>
                  {stock.score >= 75 && (
                    <Star
                      size={12}
                      fill={colors.amber[400]}
                      style={{ color: colors.amber[400] }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text[50],
                  }}
                >
                  {stock.name}
                </span>
              </div>

              {/* Price & change */}
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text[100],
                    fontFamily: typography.fontFamily.mono,
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
                    fontWeight: '500',
                    color: isPositive ? colors.emerald[400] : colors.red[400],
                  }}
                >
                  {isPositive ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Add to watchlist button */}
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[2],
          padding: spacing[3],
          marginTop: spacing[3],
          background: 'transparent',
          border: `1px dashed ${colors.glass.borderLight}`,
          borderRadius: radius.lg,
          color: colors.text[50],
          fontSize: typography.fontSize.sm,
          cursor: 'pointer',
          transition: `all ${animation.duration.fast}ms`,
        }}
      >
        <Plus size={16} />
        Add Symbol
      </button>
    </div>
  )
}
