/**
 * LEGENDARY Market Overview Dashboard
 *
 * Comprehensive market conditions view with indices, sectors, and sentiment
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html (Market Overview section)
 */

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Globe,
  BarChart3,
  Activity,
  Zap,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Demo market data
const indices = [
  { symbol: 'SPY', name: 'S&P 500', price: 594.82, change: 0.59, volume: '87.2M' },
  { symbol: 'QQQ', name: 'Nasdaq 100', price: 511.23, change: 0.82, volume: '45.8M' },
  { symbol: 'DIA', name: 'Dow Jones', price: 436.15, change: 0.34, volume: '12.3M' },
  { symbol: 'IWM', name: 'Russell 2000', price: 232.45, change: -0.28, volume: '28.5M' },
  { symbol: 'VIX', name: 'Volatility', price: 13.42, change: -2.15, volume: '—' },
]

const sectors = [
  { name: 'Technology', symbol: 'XLK', change: 1.24, color: colors.cyan[400] },
  { name: 'Healthcare', symbol: 'XLV', change: 0.45, color: colors.emerald[400] },
  { name: 'Financials', symbol: 'XLF', change: 0.67, color: colors.purple[400] },
  { name: 'Energy', symbol: 'XLE', change: -0.89, color: colors.amber[400] },
  { name: 'Consumer', symbol: 'XLY', change: 0.38, color: colors.indigo[400] },
  { name: 'Industrials', symbol: 'XLI', change: 0.52, color: colors.cyan[400] },
]

const marketEvents = [
  { time: '09:30 AM', event: 'Market Open', type: 'info' },
  { time: '10:00 AM', event: 'Consumer Confidence', type: 'data' },
  { time: '02:00 PM', event: 'Fed Minutes', type: 'important' },
  { time: '04:00 PM', event: 'Market Close', type: 'info' },
]

const regimeIndicators = [
  { name: 'Trend', value: 'Bullish', score: 85, color: colors.emerald[400] },
  { name: 'Volatility', value: 'Low', score: 72, color: colors.cyan[400] },
  { name: 'Momentum', value: 'Strong', score: 88, color: colors.purple[400] },
  { name: 'Breadth', value: 'Healthy', score: 78, color: colors.indigo[400] },
]

export default function MarketOverview({ onSelectSymbol }) {
  const [activeTab, setActiveTab] = useState('indices')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[4],
        paddingBottom: spacing[8],
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: gradients.unicorn,
              borderRadius: radius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 30px ${colors.purple.glow}`,
            }}
          >
            <Globe size={24} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.black,
                color: colors.text[100],
              }}
            >
              Market Overview
            </h1>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text[50],
              }}
            >
              Real-time market conditions
            </p>
          </div>
        </div>

        {/* Market Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[2]}px ${spacing[4]}px`,
            background: colors.emerald.dim,
            borderRadius: radius.full,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              background: colors.emerald[400],
              borderRadius: '50%',
              animation: 'pulse 2s infinite',
            }}
          />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: '600',
              color: colors.emerald[400],
            }}
          >
            Market Open
          </span>
        </div>
      </div>

      {/* Market Regime Summary */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.indigo[500]}15 0%, ${colors.purple[400]}15 100%)`,
          borderRadius: radius['2xl'],
          padding: spacing[5],
          border: `1px solid ${colors.indigo[500]}30`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            marginBottom: spacing[4],
          }}
        >
          <Zap size={18} style={{ color: colors.indigo[400] }} />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              color: colors.indigo[400],
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
            }}
          >
            AVA Market Regime
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: spacing[4],
          }}
        >
          {regimeIndicators.map((indicator) => (
            <div key={indicator.name}>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text[50],
                  marginBottom: spacing[1],
                }}
              >
                {indicator.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}
              >
                <span
                  style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: indicator.color,
                  }}
                >
                  {indicator.value}
                </span>
                <span
                  style={{
                    padding: `2px ${spacing[2]}px`,
                    background: `${indicator.color}20`,
                    borderRadius: radius.full,
                    fontSize: 10,
                    fontWeight: '600',
                    color: indicator.color,
                  }}
                >
                  {indicator.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: spacing[2],
          borderBottom: `1px solid ${colors.glass.border}`,
          paddingBottom: spacing[3],
        }}
      >
        {[
          { id: 'indices', label: 'Indices', icon: BarChart3 },
          { id: 'sectors', label: 'Sectors', icon: Activity },
          { id: 'events', label: 'Events', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]}px ${spacing[4]}px`,
              background: activeTab === tab.id ? colors.purple.dim : 'transparent',
              border: 'none',
              borderRadius: radius.lg,
              cursor: 'pointer',
            }}
          >
            <tab.icon
              size={16}
              style={{
                color: activeTab === tab.id ? colors.purple[400] : colors.text[50],
              }}
            />
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: activeTab === tab.id ? '600' : '500',
                color: activeTab === tab.id ? colors.purple[400] : colors.text[50],
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'indices' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[2],
          }}
        >
          {indices.map((index) => (
            <IndexCard
              key={index.symbol}
              index={index}
              onClick={() => onSelectSymbol?.(index.symbol)}
            />
          ))}
        </div>
      )}

      {activeTab === 'sectors' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: spacing[3],
          }}
        >
          {sectors.map((sector) => (
            <SectorCard
              key={sector.symbol}
              sector={sector}
              onClick={() => onSelectSymbol?.(sector.symbol)}
            />
          ))}
        </div>
      )}

      {activeTab === 'events' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[2],
          }}
        >
          {marketEvents.map((event, index) => (
            <EventCard key={index} event={event} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// Index Card Component
function IndexCard({ index, onClick }) {
  const isPositive = index.change >= 0

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[4],
        padding: spacing[4],
        background: colors.depth1,
        border: `1px solid ${colors.glass.border}`,
        borderRadius: radius.xl,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      {/* Symbol */}
      <div
        style={{
          width: 56,
          height: 56,
          background: isPositive ? colors.emerald.dim : colors.red.dim,
          borderRadius: radius.lg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            color: isPositive ? colors.emerald[400] : colors.red[400],
          }}
        >
          {index.symbol}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.text[100],
            marginBottom: 2,
          }}
        >
          {index.name}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text[50],
          }}
        >
          Vol: {index.volume}
        </div>
      </div>

      {/* Price & Change */}
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text[100],
            fontFamily: typography.fontFamily.mono,
          }}
        >
          {index.price.toFixed(2)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            fontSize: typography.fontSize.base,
            fontWeight: '600',
            color: isPositive ? colors.emerald[400] : colors.red[400],
          }}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? '+' : ''}{index.change.toFixed(2)}%
        </div>
      </div>

      <ChevronRight size={20} style={{ color: colors.text[30] }} />
    </button>
  )
}

// Sector Card Component
function SectorCard({ sector, onClick }) {
  const isPositive = sector.change >= 0

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[4],
        background: colors.depth1,
        border: `1px solid ${colors.glass.border}`,
        borderRadius: radius.xl,
        cursor: 'pointer',
        textAlign: 'left',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
        }}
      >
        <div
          style={{
            width: 8,
            height: 40,
            background: sector.color,
            borderRadius: radius.full,
          }}
        />
        <div>
          <div
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
            }}
          >
            {sector.name}
          </div>
          <div
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text[50],
            }}
          >
            {sector.symbol}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: `${spacing[1]}px ${spacing[3]}px`,
          background: isPositive ? colors.emerald.dim : colors.red.dim,
          borderRadius: radius.lg,
        }}
      >
        {isPositive ? (
          <TrendingUp size={14} style={{ color: colors.emerald[400] }} />
        ) : (
          <TrendingDown size={14} style={{ color: colors.red[400] }} />
        )}
        <span
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            color: isPositive ? colors.emerald[400] : colors.red[400],
          }}
        >
          {isPositive ? '+' : ''}{sector.change.toFixed(2)}%
        </span>
      </div>
    </button>
  )
}

// Event Card Component
function EventCard({ event }) {
  const getEventStyle = () => {
    switch (event.type) {
      case 'important':
        return {
          bg: colors.amber.dim,
          color: colors.amber[400],
          icon: AlertTriangle,
        }
      case 'data':
        return {
          bg: colors.cyan.dim,
          color: colors.cyan[400],
          icon: BarChart3,
        }
      default:
        return {
          bg: colors.depth2,
          color: colors.text[50],
          icon: Clock,
        }
    }
  }

  const style = getEventStyle()
  const Icon = style.icon

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[3],
        background: style.bg,
        borderRadius: radius.lg,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          background: `${style.color}20`,
          borderRadius: radius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} style={{ color: style.color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: '600',
            color: colors.text[100],
          }}
        >
          {event.event}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text[50],
          }}
        >
          {event.time} ET
        </div>
      </div>
      {event.type === 'important' && (
        <span
          style={{
            padding: `2px ${spacing[2]}px`,
            background: colors.amber[400],
            borderRadius: radius.full,
            fontSize: 9,
            fontWeight: '700',
            color: '#000',
            textTransform: 'uppercase',
          }}
        >
          Key
        </span>
      )}
    </div>
  )
}
