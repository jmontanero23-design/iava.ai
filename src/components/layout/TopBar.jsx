/**
 * LEGENDARY TopBar
 *
 * The signature top navigation bar matching iAVA-LEGENDARY-DESKTOP_1.html exactly
 * Features:
 * - Logo with unicorn gradient
 * - Market status badge (LIVE/CLOSED)
 * - Global search bar (400px with Cmd+K shortcut)
 * - Voice button "Hey AVA"
 * - Notifications with badge
 * - User avatar
 */

import { useState, useEffect } from 'react'
import { LogoMark, LogoFull } from '../ui/Logo'
import {
  Search,
  Bell,
  Settings,
  Mic,
  User,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography, layout } from '../../styles/tokens'

export default function TopBar({
  currentSymbol,
  onSymbolChange,
  onSearchClick,
  onNotificationsClick,
  onSettingsClick,
  onVoiceClick,
}) {
  const [isMarketOpen, setIsMarketOpen] = useState(true)

  // Check market hours (simplified)
  useEffect(() => {
    const checkMarket = () => {
      const now = new Date()
      const hours = now.getHours()
      const day = now.getDay()
      setIsMarketOpen(day >= 1 && day <= 5 && hours >= 9 && hours < 16)
    }
    checkMarket()
    const interval = setInterval(checkMarket, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${spacing[5]}px`,
      }}
    >
      {/* Left Section - Logo & Market Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[6] }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          <LogoMark size={36} />
          <span
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.black,
              letterSpacing: typography.letterSpacing.tight,
              background: gradients.unicorn,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            iAVA.ai
          </span>
        </div>

        {/* Market Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[2]}px ${spacing[3]}px`,
            background: isMarketOpen ? colors.emerald.dim : colors.red.dim,
            border: `1px solid ${isMarketOpen ? colors.emerald[400] : colors.red[400]}20`,
            borderRadius: radius.md,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              background: isMarketOpen ? colors.emerald[400] : colors.red[400],
              borderRadius: '50%',
              boxShadow: `0 0 8px ${isMarketOpen ? colors.emerald.glow : colors.red.glow}`,
              animation: isMarketOpen ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              color: isMarketOpen ? colors.emerald[400] : colors.red[400],
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
            }}
          >
            {isMarketOpen ? 'LIVE' : 'CLOSED'}
          </span>
        </div>
      </div>

      {/* Center Section - Global Search */}
      <button
        onClick={onSearchClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: 400,
          height: 40,
          background: colors.depth1,
          border: `1px solid ${colors.glass.border}`,
          borderRadius: radius.lg,
          padding: `0 ${spacing[3]}px`,
          cursor: 'pointer',
          transition: `all ${animation.duration.fast}ms`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.purple[500]
          e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.purple.dim}`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.glass.border
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <Search size={18} style={{ color: colors.text[30], flexShrink: 0 }} />
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            padding: `0 ${spacing[3]}px`,
            fontSize: typography.fontSize.base,
            color: colors.text[30],
          }}
        >
          Search stocks, commands...
        </span>
        <span
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            padding: `${spacing[1]}px ${spacing[2]}px`,
            background: colors.depth2,
            borderRadius: radius.xs,
            color: colors.text[30],
          }}
        >
          ⌘K
        </span>
      </button>

      {/* Right Section - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
        {/* Voice Button - "Hey AVA" */}
        <button
          onClick={onVoiceClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[2]}px ${spacing[4]}px`,
            background: gradients.unicorn,
            border: 'none',
            borderRadius: radius.lg,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            color: '#fff',
            cursor: 'pointer',
            transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
            boxShadow: `0 0 30px ${colors.purple.glow}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = `0 0 50px ${colors.purple.glow}`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = `0 0 30px ${colors.purple.glow}`
          }}
        >
          <Mic size={16} />
          <span>Hey AVA</span>
        </button>

        {/* Notifications */}
        <TopBarButton
          icon={Bell}
          badge={3}
          onClick={onNotificationsClick}
        />

        {/* Settings */}
        <TopBarButton
          icon={Settings}
          onClick={onSettingsClick}
        />

        {/* User Avatar */}
        <button
          style={{
            width: 40,
            height: 40,
            background: gradients.unicorn,
            borderRadius: radius.lg,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: `transform ${animation.duration.fast}ms`,
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <User size={20} style={{ color: '#fff' }} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
      `}</style>
    </header>
  )
}

// Top bar icon button component
function TopBarButton({ icon: Icon, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: radius.lg,
        border: `1px solid ${colors.glass.border}`,
        background: colors.glass.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.purple[500]
        e.currentTarget.style.background = colors.purple.dim
        e.currentTarget.querySelector('svg').style.color = colors.purple[400]
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.glass.border
        e.currentTarget.style.background = colors.glass.bg
        e.currentTarget.querySelector('svg').style.color = colors.text[50]
      }}
    >
      <Icon
        size={18}
        style={{
          color: colors.text[50],
          transition: `color ${animation.duration.fast}ms`,
        }}
      />
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            background: colors.red[400],
            borderRadius: '50%',
            fontSize: 10,
            fontWeight: typography.fontWeight.bold,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            border: `2px solid ${colors.void}`,
          }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
