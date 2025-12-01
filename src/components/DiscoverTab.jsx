/**
 * LEGENDARY Discover Tab
 *
 * Search, filter, and discover stocks with Unicorn Scores
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Discover Tab section)
 */

import { useState } from 'react'
import {
  Search,
  Mic,
  TrendingUp,
  TrendingDown,
  Zap,
  Star,
  ChevronRight,
  Filter,
  Sparkles,
} from 'lucide-react'
import { ScoreRing } from './ui/ScoreRing'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Demo data for discovery
const trendingStocks = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 142.56, change: 3.24, score: 87, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 234.12, change: 5.67, score: 72, sector: 'Automotive' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 156.78, change: 2.34, score: 78, sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms', price: 512.34, change: -1.23, score: 65, sector: 'Technology' },
  { symbol: 'AAPL', name: 'Apple Inc', price: 178.32, change: 0.89, score: 74, sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: 145.67, change: 1.45, score: 69, sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', price: 185.23, change: -0.56, score: 71, sector: 'E-Commerce' },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: 378.45, change: 1.23, score: 76, sector: 'Technology' },
]

const filterOptions = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'bullish', label: 'Bullish', icon: TrendingUp },
  { id: 'high-score', label: 'Score 75+', icon: Zap },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'tech', label: 'Tech', icon: null },
  { id: 'finance', label: 'Finance', icon: null },
]

export default function DiscoverTab({ onSelectSymbol }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [isListening, setIsListening] = useState(false)

  // Filter stocks based on active filter and search
  const filteredStocks = trendingStocks.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'bullish' && stock.change > 0) ||
      (activeFilter === 'high-score' && stock.score >= 75) ||
      (activeFilter === 'tech' && stock.sector === 'Technology')

    return matchesSearch && matchesFilter
  })

  // Handle voice search
  const handleVoiceSearch = () => {
    setIsListening(!isListening)
    // Voice recognition would be implemented here
  }

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
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text[100],
            marginBottom: spacing[2],
          }}
        >
          Discover
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text[50],
          }}
        >
          Find your next winning trade
        </p>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          padding: `${spacing[3]}px ${spacing[4]}px`,
          background: colors.glass.bg,
          backdropFilter: 'blur(20px)',
          borderRadius: radius.xl,
          border: `1px solid ${colors.glass.border}`,
        }}
      >
        <Search size={20} style={{ color: colors.text[50] }} />
        <input
          type="text"
          placeholder="Search symbols, companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: typography.fontSize.base,
            color: colors.text[100],
          }}
        />
        <button
          onClick={handleVoiceSearch}
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isListening ? gradients.unicorn : colors.depth2,
            borderRadius: radius.lg,
            border: 'none',
            cursor: 'pointer',
            transition: `all ${animation.duration.fast}ms`,
          }}
        >
          <Mic
            size={18}
            style={{ color: isListening ? '#fff' : colors.text[50] }}
          />
        </button>
      </div>

      {/* Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: spacing[2],
          overflowX: 'auto',
          paddingBottom: spacing[2],
          margin: `0 -${spacing[4]}px`,
          padding: `0 ${spacing[4]}px`,
        }}
      >
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter.id
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                padding: `${spacing[2]}px ${spacing[4]}px`,
                background: isActive ? gradients.unicorn : colors.depth2,
                border: isActive ? 'none' : `1px solid ${colors.glass.border}`,
                borderRadius: radius.full,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: `all ${animation.duration.fast}ms`,
              }}
            >
              {filter.icon && (
                <filter.icon
                  size={14}
                  style={{ color: isActive ? '#fff' : colors.text[50] }}
                />
              )}
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? '#fff' : colors.text[70],
                }}
              >
                {filter.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Results count */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text[50],
          }}
        >
          {filteredStocks.length} results
        </span>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
            padding: `${spacing[1]}px ${spacing[2]}px`,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Filter size={14} style={{ color: colors.text[50] }} />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text[50],
            }}
          >
            Sort
          </span>
        </button>
      </div>

      {/* Stock List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        {filteredStocks.map((stock) => {
          const isPositive = stock.change >= 0

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectSymbol?.(stock.symbol)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                padding: spacing[4],
                background: colors.glass.bg,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${colors.glass.border}`,
                borderRadius: radius.xl,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: `all ${animation.duration.fast}ms`,
              }}
            >
              {/* Score Ring */}
              <ScoreRing score={stock.score} size="sm" showLabel={false} />

              {/* Stock Info */}
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
                    {stock.symbol}
                  </span>
                  {stock.score >= 80 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 6px',
                        background: `${colors.purple[500]}20`,
                        borderRadius: radius.full,
                      }}
                    >
                      <Zap size={10} style={{ color: colors.purple[400] }} />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: colors.purple[400],
                        }}
                      >
                        HOT
                      </span>
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text[50],
                  }}
                >
                  {stock.name}
                </span>
              </div>

              {/* Price & Change */}
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: typography.fontSize.lg,
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
                  }}
                >
                  {isPositive ? (
                    <TrendingUp size={14} style={{ color: colors.emerald[400] }} />
                  ) : (
                    <TrendingDown size={14} style={{ color: colors.red[400] }} />
                  )}
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: '600',
                      color: isPositive ? colors.emerald[400] : colors.red[400],
                    }}
                  >
                    {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
                  </span>
                </div>
              </div>

              <ChevronRight size={16} style={{ color: colors.text[30] }} />
            </button>
          )
        })}
      </div>

      {/* AVA Suggestion Card */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.purple[500]}15 0%, ${colors.cyan[400]}15 100%)`,
          borderRadius: radius.xl,
          padding: spacing[4],
          border: `1px solid ${colors.purple[500]}30`,
          marginTop: spacing[2],
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
          <Sparkles size={16} style={{ color: colors.purple[400] }} />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.purple[400],
            }}
          >
            AVA Suggestion
          </span>
        </div>
        <p
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text[90],
            lineHeight: 1.5,
          }}
        >
          Based on your trading style, check out <strong>NVDA</strong> - showing strong momentum with an 87 Unicorn Score.
        </p>
      </div>
    </div>
  )
}
