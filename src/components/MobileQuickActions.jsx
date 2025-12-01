/**
 * LEGENDARY Mobile Quick Actions
 *
 * Bottom sheet with quick trading actions for mobile
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (Quick Actions section)
 */

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Bell,
  Share2,
  Star,
  Target,
  Zap,
  BarChart2,
  Clock,
  ChevronUp,
  X,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

const quickActions = [
  {
    id: 'buy',
    label: 'Buy',
    icon: TrendingUp,
    color: colors.emerald[400],
    bg: colors.emerald.dim,
  },
  {
    id: 'sell',
    label: 'Sell',
    icon: TrendingDown,
    color: colors.red[400],
    bg: colors.red.dim,
  },
  {
    id: 'alert',
    label: 'Set Alert',
    icon: Bell,
    color: colors.amber[400],
    bg: colors.amber.dim,
  },
  {
    id: 'watchlist',
    label: 'Watchlist',
    icon: Star,
    color: colors.purple[400],
    bg: colors.purple.dim,
  },
  {
    id: 'share',
    label: 'Share',
    icon: Share2,
    color: colors.cyan[400],
    bg: colors.cyan.dim,
  },
  {
    id: 'analyze',
    label: 'Deep Analysis',
    icon: Zap,
    color: colors.indigo[400],
    bg: colors.indigo.dim,
  },
]

export default function MobileQuickActions({
  symbol = 'SPY',
  isOpen,
  onClose,
  onAction,
}) {
  const [selectedAction, setSelectedAction] = useState(null)

  const handleAction = (actionId) => {
    setSelectedAction(actionId)
    onAction?.(actionId)

    // Auto-close after action selection
    if (['buy', 'sell', 'alert', 'analyze'].includes(actionId)) {
      // Keep open for these - they open sub-panels
    } else {
      setTimeout(() => {
        onClose()
        setSelectedAction(null)
      }, 200)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 90,
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: colors.glass.bgHeavy,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${colors.glass.border}`,
          borderRadius: `${radius['2xl']}px ${radius['2xl']}px 0 0`,
          zIndex: 95,
          animation: 'slideUp 0.3s ease-out',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: spacing[3],
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              background: colors.glass.borderLight,
              borderRadius: radius.full,
            }}
          />
        </div>

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
          <div>
            <h3
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
              }}
            >
              Quick Actions
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text[50],
              }}
            >
              {symbol}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: colors.depth2,
              border: `1px solid ${colors.glass.border}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
            }}
          >
            <X size={18} style={{ color: colors.text[50] }} />
          </button>
        </div>

        {/* Actions Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: spacing[3],
            padding: spacing[4],
          }}
        >
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing[2],
                padding: spacing[4],
                background: selectedAction === action.id ? action.bg : colors.depth1,
                border: `1px solid ${selectedAction === action.id ? action.color + '40' : colors.glass.border}`,
                borderRadius: radius.xl,
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: action.bg,
                  borderRadius: radius.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <action.icon size={24} style={{ color: action.color }} />
              </div>
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: '600',
                  color: colors.text[90],
                }}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Trade Section */}
        <div
          style={{
            padding: `0 ${spacing[4]}px ${spacing[4]}px`,
          }}
        >
          <button
            onClick={() => handleAction('quick-trade')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: spacing[4],
              background: gradients.unicorn,
              border: 'none',
              borderRadius: radius.xl,
              cursor: 'pointer',
              boxShadow: `0 0 30px ${colors.purple.glow}`,
            }}
          >
            <Zap size={20} style={{ color: '#fff' }} />
            <span
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: '#fff',
              }}
            >
              Quick Trade {symbol}
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

// Floating Action Button to trigger Quick Actions
export function QuickActionsFAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 80, // Above bottom nav
        right: 16,
        width: 56,
        height: 56,
        background: gradients.unicorn,
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 20px ${colors.purple.glow}`,
        zIndex: 50,
        animation: 'pulseGlow 2s ease-in-out infinite',
      }}
    >
      <Zap size={24} style={{ color: '#fff' }} />

      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 4px 20px ${colors.purple.glow};
          }
          50% {
            box-shadow: 0 4px 30px ${colors.purple.glow}, 0 0 40px ${colors.cyan.glow};
          }
        }
      `}</style>
    </button>
  )
}
