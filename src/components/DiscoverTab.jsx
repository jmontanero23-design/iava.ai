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
  Zap,
  Star,
  Sparkles,
} from 'lucide-react'
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
        height: '100%',
      }}
    >
      {/* Header with cyan gradient background */}
      <div
        style={{
          padding: `${spacing[4]}px ${spacing[5]}px`,
          background: `linear-gradient(180deg, rgba(34, 211, 238, 0.04) 0%, transparent 100%)`,
        }}
      >
        <h1
          style={{
            fontSize: 30,
            fontWeight: typography.fontWeight.black,
            letterSpacing: '-0.02em',
            color: colors.text[100],
            marginBottom: spacing[3],
          }}
        >
          Discover
        </h1>

        {/* Search Bar with focus state */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: colors.depth1,
            border: `1px solid ${colors.glass.border}`,
            borderRadius: 14,
            padding: '4px 4px 4px 16px',
            transition: `all ${animation.duration.fast}ms`,
          }}
        >
          <Search size={20} style={{ color: colors.text[50], flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search symbols, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: spacing[3],
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: typography.fontSize.lg,
              color: colors.text[100],
            }}
          />
          <button
            onClick={handleVoiceSearch}
            style={{
              width: 42,
              height: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isListening ? gradients.unicorn : colors.cyan.dim,
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              transition: `all ${animation.duration.fast}ms`,
            }}
          >
            <Mic
              size={18}
              style={{ color: isListening ? '#fff' : colors.cyan[400] }}
            />
          </button>
        </div>
      </div>

      {/* Filter Section - Sticky */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: colors.void,
          padding: `${spacing[3]}px 0`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            overflowX: 'auto',
            padding: `0 ${spacing[5]}px`,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
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
                  gap: 6,
                  padding: '10px 14px',
                  background: isActive ? gradients.unicorn : colors.depth1,
                  border: isActive ? 'none' : `1px solid ${colors.glass.border}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
                  boxShadow: isActive ? `0 0 20px ${colors.purple.glow}` : 'none',
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
                    fontSize: 13,
                    fontWeight: 600,
                    color: isActive ? '#fff' : colors.text[50],
                  }}
                >
                  {filter.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stock List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${spacing[2]}px ${spacing[4]}px 100px`,
        }}
      >
        {filteredStocks.map((stock) => {
          const isPositive = stock.change >= 0

          return (
            <StockCard
              key={stock.symbol}
              stock={stock}
              isPositive={isPositive}
              onClick={() => onSelectSymbol?.(stock.symbol)}
            />
          )
        })}
      </div>

      {/* AVA Suggestion Card */}
      <div
        style={{
          margin: `0 ${spacing[4]}px ${spacing[4]}px`,
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
            margin: 0,
          }}
        >
          Based on your trading style, check out <strong>NVDA</strong> - showing strong momentum with an 87 Unicorn Score.
        </p>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .filter-pills::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

// Stock Card component with LEGENDARY hover effects
function StockCard({ stock, isPositive, onClick }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: 14,
        marginBottom: 10,
        background: colors.depth1,
        border: `1px solid ${isHovered ? 'rgba(139, 92, 246, 0.3)' : colors.glass.border}`,
        borderRadius: 16,
        cursor: 'pointer',
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

      {/* Stock Logo */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.bold,
          color: colors.depth1,
        }}
      >
        {stock.symbol.slice(0, 2)}
      </div>

      {/* Stock Info */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: colors.text[100],
            marginBottom: 2,
          }}
        >
          {stock.symbol}
        </div>
        <div
          style={{
            fontSize: 12,
            color: colors.text[50],
          }}
        >
          {stock.name}
        </div>
      </div>

      {/* Score Column */}
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            background: gradients.unicorn,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 2,
          }}
        >
          {stock.score}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: isPositive ? colors.emerald[400] : colors.red[400],
          }}
        >
          {isPositive ? 'Bullish' : 'Bearish'}
        </div>
      </div>
    </button>
  )
}
