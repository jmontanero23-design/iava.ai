/**
 * LEGENDARY Mobile Symbol Header
 *
 * Displays symbol info at top of Trade tab on mobile
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Trade Tab section)
 */

import { useState } from 'react'
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Star,
  Bell,
  Share2,
} from 'lucide-react'
import { ScoreRing } from './ui/ScoreRing'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

export default function MobileSymbolHeader({
  symbol = 'NVDA',
  companyName = 'NVIDIA Corporation',
  price = 142.56,
  change = 3.24,
  changePercent = 2.34,
  score = 87,
  onSymbolClick,
  onWatchlistClick,
  onAlertClick,
  onShareClick,
}) {
  const isPositive = change >= 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[3],
        padding: spacing[4],
        background: colors.glass.bg,
        backdropFilter: 'blur(20px)',
        borderRadius: radius.xl,
        border: `1px solid ${colors.glass.border}`,
        marginBottom: spacing[3],
      }}
    >
      {/* Top row: Symbol selector + Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Symbol button */}
        <button
          onClick={onSymbolClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[2]}px ${spacing[3]}px`,
            background: colors.depth2,
            border: `1px solid ${colors.glass.borderLight}`,
            borderRadius: radius.lg,
            cursor: 'pointer',
          }}
        >
          {/* Company logo placeholder */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: radius.md,
              background: gradients.unicorn,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: '#fff',
              }}
            >
              {symbol.charAt(0)}
            </span>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
              }}
            >
              {symbol}
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text[50],
              }}
            >
              {companyName}
            </div>
          </div>

          <ChevronDown size={16} style={{ color: colors.text[30] }} />
        </button>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: spacing[2] }}>
          <ActionButton icon={Star} onClick={onWatchlistClick} />
          <ActionButton icon={Bell} onClick={onAlertClick} />
          <ActionButton icon={Share2} onClick={onShareClick} />
        </div>
      </div>

      {/* Bottom row: Price + Change + Score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Price section */}
        <div>
          <div
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
              fontFamily: typography.fontFamily.mono,
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            ${price.toFixed(2)}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginTop: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                background: isPositive ? colors.emerald.dim : colors.red.dim,
                borderRadius: radius.md,
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
                {isPositive ? '+' : ''}${Math.abs(change).toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text[30],
              }}
            >
              Today
            </span>
          </div>
        </div>

        {/* Unicorn Score */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <ScoreRing score={score} size="md" />
          <span
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text[50],
              fontWeight: '500',
            }}
          >
            Unicorn Score
          </span>
        </div>
      </div>
    </div>
  )
}

// Action button component
function ActionButton({ icon: Icon, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? colors.purple.dim : colors.depth2,
        border: `1px solid ${active ? colors.purple[500] + '40' : colors.glass.border}`,
        borderRadius: radius.lg,
        cursor: 'pointer',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      <Icon
        size={16}
        style={{
          color: active ? colors.purple[400] : colors.text[50],
        }}
        fill={active ? colors.purple[400] : 'none'}
      />
    </button>
  )
}
