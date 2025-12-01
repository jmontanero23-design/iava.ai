/**
 * LEGENDARY Symbol Search Modal
 *
 * Command palette style symbol search with live results
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html
 */

import { useState, useEffect, useRef } from 'react'
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Command,
  Mic,
  Sparkles,
} from 'lucide-react'
import { ScoreRing } from './ui/ScoreRing'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Demo search results
const popularSymbols = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 594.82, change: 0.59, score: 75 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 511.23, change: 0.82, score: 72 },
  { symbol: 'AAPL', name: 'Apple Inc', price: 178.32, change: 1.24, score: 68 },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 234.12, change: -0.87, score: 65 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 142.56, change: 2.34, score: 87 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 156.78, change: 1.56, score: 78 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.45, change: 0.45, score: 76 },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: 141.23, change: 0.92, score: 71 },
  { symbol: 'AMZN', name: 'Amazon.com Inc', price: 185.67, change: 1.12, score: 74 },
  { symbol: 'META', name: 'Meta Platforms', price: 520.25, change: -0.34, score: 69 },
]

const recentSearches = ['NVDA', 'SPY', 'AAPL', 'TSLA']

export default function SymbolSearchModal({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const filtered = popularSymbols.filter(
      (s) =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    )
    setResults(filtered)
    setSelectedIndex(0)
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].symbol)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  const handleSelect = (symbol) => {
    onSelect?.(symbol)
    onClose()
    setQuery('')
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          background: colors.glass.bgHeavy,
          border: `1px solid ${colors.glass.border}`,
          borderRadius: radius['2xl'],
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
          animation: 'slideDown 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            padding: spacing[4],
            borderBottom: `1px solid ${colors.glass.border}`,
          }}
        >
          <Search size={20} style={{ color: colors.text[50] }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbols, companies..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: typography.fontSize.lg,
              color: colors.text[100],
            }}
          />

          {/* Voice search button */}
          <button
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: colors.purple.dim,
              border: 'none',
              borderRadius: radius.lg,
              cursor: 'pointer',
            }}
          >
            <Mic size={16} style={{ color: colors.purple[400] }} />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: radius.lg,
              cursor: 'pointer',
            }}
          >
            <X size={18} style={{ color: colors.text[50] }} />
          </button>
        </div>

        {/* Results / Quick Access */}
        <div
          style={{
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {query.trim() ? (
            // Search Results
            <div>
              {results.length > 0 ? (
                results.map((result, index) => (
                  <SearchResult
                    key={result.symbol}
                    result={result}
                    isSelected={index === selectedIndex}
                    onClick={() => handleSelect(result.symbol)}
                  />
                ))
              ) : (
                <div
                  style={{
                    padding: spacing[8],
                    textAlign: 'center',
                  }}
                >
                  <Search
                    size={48}
                    style={{
                      color: colors.text[30],
                      marginBottom: spacing[3],
                      opacity: 0.5,
                    }}
                  />
                  <p
                    style={{
                      fontSize: typography.fontSize.base,
                      color: colors.text[50],
                    }}
                  >
                    No results found for "{query}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Quick Access
            <div style={{ padding: spacing[4] }}>
              {/* Recent Searches */}
              <div style={{ marginBottom: spacing[4] }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    marginBottom: spacing[2],
                  }}
                >
                  <Clock size={14} style={{ color: colors.text[30] }} />
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: '600',
                      color: colors.text[50],
                      textTransform: 'uppercase',
                      letterSpacing: typography.letterSpacing.wider,
                    }}
                  >
                    Recent
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: spacing[2],
                  }}
                >
                  {recentSearches.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => handleSelect(sym)}
                      style={{
                        padding: `${spacing[1]}px ${spacing[3]}px`,
                        background: colors.depth2,
                        border: `1px solid ${colors.glass.border}`,
                        borderRadius: radius.full,
                        cursor: 'pointer',
                        fontSize: typography.fontSize.sm,
                        fontWeight: '600',
                        color: colors.text[70],
                      }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular / Trending */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    marginBottom: spacing[2],
                  }}
                >
                  <Sparkles size={14} style={{ color: colors.purple[400] }} />
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: '600',
                      color: colors.text[50],
                      textTransform: 'uppercase',
                      letterSpacing: typography.letterSpacing.wider,
                    }}
                  >
                    Popular
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing[1],
                  }}
                >
                  {popularSymbols.slice(0, 5).map((item) => (
                    <SearchResult
                      key={item.symbol}
                      result={item}
                      isSelected={false}
                      onClick={() => handleSelect(item.symbol)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${spacing[3]}px ${spacing[4]}px`,
            borderTop: `1px solid ${colors.glass.border}`,
            background: colors.depth2,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[4],
            }}
          >
            <KeyboardHint keys={['↑', '↓']} label="Navigate" />
            <KeyboardHint keys={['Enter']} label="Select" />
            <KeyboardHint keys={['Esc']} label="Close" />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1],
            }}
          >
            <Command size={12} style={{ color: colors.text[30] }} />
            <span
              style={{
                fontSize: 10,
                color: colors.text[30],
              }}
            >
              K to open
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Search Result Item
function SearchResult({ result, isSelected, onClick }) {
  const isPositive = result.change >= 0

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        width: '100%',
        padding: spacing[3],
        background: isSelected ? colors.purple.dim : 'transparent',
        border: 'none',
        borderRadius: radius.lg,
        cursor: 'pointer',
        textAlign: 'left',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      {/* Score Ring */}
      <ScoreRing score={result.score} size="xs" showLabel={false} />

      {/* Symbol & Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
            }}
          >
            {result.symbol}
          </span>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: '500',
              color: colors.purple[400],
            }}
          >
            {result.score}
          </span>
        </div>
        <p
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text[50],
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {result.name}
        </p>
      </div>

      {/* Price & Change */}
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text[100],
            fontFamily: typography.fontFamily.mono,
          }}
        >
          ${result.price.toFixed(2)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            fontSize: typography.fontSize.xs,
            fontWeight: '600',
            color: isPositive ? colors.emerald[400] : colors.red[400],
          }}
        >
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isPositive ? '+' : ''}{result.change.toFixed(2)}%
        </div>
      </div>
    </button>
  )
}

// Keyboard Hint Component
function KeyboardHint({ keys, label }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[1],
      }}
    >
      {keys.map((key, index) => (
        <span
          key={index}
          style={{
            padding: `2px ${spacing[2]}px`,
            background: colors.depth3,
            borderRadius: radius.sm,
            fontSize: 10,
            fontWeight: '600',
            color: colors.text[50],
            fontFamily: typography.fontFamily.mono,
          }}
        >
          {key}
        </span>
      ))}
      <span
        style={{
          fontSize: 10,
          color: colors.text[30],
        }}
      >
        {label}
      </span>
    </div>
  )
}
