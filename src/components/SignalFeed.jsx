/**
 * LEGENDARY Signal Feed
 *
 * Real-time trading signals and alerts from AVA
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html (Signal Feed section)
 */

import { useState, useEffect } from 'react'
import {
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Clock,
  ChevronRight,
  Flame,
  Sparkles,
  Shield,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Demo signals data
const demoSignals = [
  {
    id: 1,
    type: 'bullish',
    symbol: 'NVDA',
    title: 'Breakout Signal',
    description: 'Breaking above $145 resistance with strong volume',
    confidence: 87,
    time: '2m ago',
    priority: 'high',
  },
  {
    id: 2,
    type: 'alert',
    symbol: 'TSLA',
    title: 'Momentum Shift',
    description: 'RSI divergence detected on 1H chart',
    confidence: 72,
    time: '8m ago',
    priority: 'medium',
  },
  {
    id: 3,
    type: 'bullish',
    symbol: 'AMD',
    title: 'Support Bounce',
    description: 'Strong bounce from $155 support level',
    confidence: 81,
    time: '15m ago',
    priority: 'high',
  },
  {
    id: 4,
    type: 'bearish',
    symbol: 'META',
    title: 'Weakness Detected',
    description: 'Failed to hold above 20 EMA',
    confidence: 65,
    time: '22m ago',
    priority: 'low',
  },
  {
    id: 5,
    type: 'alert',
    symbol: 'SPY',
    title: 'Volatility Spike',
    description: 'VIX up 12% - increased market uncertainty',
    confidence: 90,
    time: '30m ago',
    priority: 'high',
  },
]

const signalConfig = {
  bullish: {
    icon: TrendingUp,
    color: colors.emerald[400],
    bg: colors.emerald.dim,
    glow: colors.emerald.glow,
  },
  bearish: {
    icon: TrendingDown,
    color: colors.red[400],
    bg: colors.red.dim,
    glow: colors.red.glow,
  },
  alert: {
    icon: AlertTriangle,
    color: colors.amber[400],
    bg: colors.amber.dim,
    glow: colors.amber.glow,
  },
}

export default function SignalFeed({ onSelectSignal, compact = false }) {
  const [signals, setSignals] = useState(demoSignals)
  const [filter, setFilter] = useState('all')

  const filteredSignals = signals.filter((s) => {
    if (filter === 'all') return true
    return s.type === filter
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[3],
      }}
    >
      {/* Header */}
      {!compact && (
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
              gap: spacing[2],
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: gradients.unicorn,
                borderRadius: radius.lg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={16} style={{ color: '#fff' }} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text[100],
                }}
              >
                Signal Feed
              </h3>
              <p
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text[50],
                }}
              >
                Real-time trading signals
              </p>
            </div>
          </div>

          {/* Live Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1],
              padding: `${spacing[1]}px ${spacing[2]}px`,
              background: colors.emerald.dim,
              borderRadius: radius.full,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                background: colors.emerald[400],
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: colors.emerald[400],
                textTransform: 'uppercase',
              }}
            >
              Live
            </span>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: spacing[2],
          overflowX: 'auto',
          paddingBottom: spacing[1],
        }}
      >
        {['all', 'bullish', 'bearish', 'alert'].map((f) => (
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
              {f === 'all' ? 'All Signals' : f}
            </span>
          </button>
        ))}
      </div>

      {/* Signals List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[2],
        }}
      >
        {filteredSignals.map((signal) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            onClick={() => onSelectSignal?.(signal)}
            compact={compact}
          />
        ))}
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

// Signal Card Component
function SignalCard({ signal, onClick, compact }) {
  const config = signalConfig[signal.type]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing[3],
        padding: spacing[3],
        background: colors.depth1,
        border: `1px solid ${signal.priority === 'high' ? config.color + '30' : colors.glass.border}`,
        borderRadius: radius.lg,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: `all ${animation.duration.fast}ms`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Priority Glow */}
      {signal.priority === 'high' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: config.color,
            boxShadow: `0 0 10px ${config.glow}`,
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          background: config.bg,
          borderRadius: radius.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              color: config.color,
            }}
          >
            {signal.symbol}
          </span>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: '600',
              color: colors.text[90],
            }}
          >
            {signal.title}
          </span>
          {signal.priority === 'high' && (
            <Flame size={12} style={{ color: colors.amber[400] }} />
          )}
        </div>

        {!compact && (
          <p
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text[50],
              lineHeight: 1.4,
              marginBottom: spacing[2],
            }}
          >
            {signal.description}
          </p>
        )}

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
          }}
        >
          {/* Confidence */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Target size={10} style={{ color: colors.text[30] }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: signal.confidence >= 80 ? colors.emerald[400] : colors.text[50],
              }}
            >
              {signal.confidence}%
            </span>
          </div>

          {/* Time */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Clock size={10} style={{ color: colors.text[30] }} />
            <span
              style={{
                fontSize: 10,
                color: colors.text[30],
              }}
            >
              {signal.time}
            </span>
          </div>
        </div>
      </div>

      <ChevronRight size={16} style={{ color: colors.text[30], flexShrink: 0 }} />
    </button>
  )
}

// Compact Signal Badge - for use in other components
export function SignalBadge({ type, count }) {
  const config = signalConfig[type]
  const Icon = config.icon

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: `2px ${spacing[2]}px`,
        background: config.bg,
        borderRadius: radius.full,
      }}
    >
      <Icon size={12} style={{ color: config.color }} />
      <span
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: config.color,
        }}
      >
        {count}
      </span>
    </div>
  )
}
