/**
 * LEGENDARY IconRail
 *
 * Left navigation rail matching iAVA-LEGENDARY-DESKTOP_1.html exactly
 * Features:
 * - 72px width with 48px icon buttons
 * - Active state with unicorn gradient indicator bar
 * - Dividers between nav sections
 * - Tooltip on hover
 * - Spacer pushing settings to bottom
 */

import { useState } from 'react'
import {
  LineChart,
  Search,
  Brain,
  Briefcase,
  Zap,
  Heart,
  BookOpen,
  TrendingUp,
  Settings,
  HelpCircle,
} from 'lucide-react'
import { LogoMark } from '../ui/Logo'
import { colors, gradients, animation, spacing, radius, typography, layout } from '../../styles/tokens'

// Navigation items configuration
const navItems = [
  // Primary navigation
  { id: 'chart', icon: LineChart, label: 'Trade', section: 'primary' },
  { id: 'discover', icon: Search, label: 'Discover', section: 'primary' },
  { id: 'ai-hub', icon: Brain, label: 'AI Hub', section: 'primary' },
  { id: 'portfolio', icon: Briefcase, label: 'Portfolio', section: 'primary' },
  // Divider
  { id: 'divider-1', type: 'divider' },
  // Secondary navigation
  { id: 'chronos', icon: Zap, label: 'Chronos', section: 'secondary', color: colors.cyan[400] },
  { id: 'ava-mind', icon: Heart, label: 'AVA Mind', section: 'secondary', color: colors.purple[400] },
  { id: 'journal', icon: BookOpen, label: 'Journal', section: 'secondary' },
  { id: 'sentiment', icon: TrendingUp, label: 'Sentiment', section: 'secondary' },
  // Spacer
  { id: 'spacer', type: 'spacer' },
  // Bottom items
  { id: 'help', icon: HelpCircle, label: 'Help', section: 'bottom' },
  { id: 'settings', icon: Settings, label: 'Settings', section: 'bottom' },
]

export default function IconRail({ activeTab, onTabChange }) {
  const [hoveredItem, setHoveredItem] = useState(null)

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${spacing[4]}px 0`,
        height: '100%',
        gap: spacing[1],
      }}
    >
      {/* Logo at top */}
      <div
        style={{
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing[4],
        }}
      >
        <LogoMark size={32} animate />
      </div>

      {navItems.map((item) => {
        // Render divider
        if (item.type === 'divider') {
          return (
            <div
              key={item.id}
              style={{
                width: 32,
                height: 1,
                background: colors.glass.border,
                margin: `${spacing[2]}px 0`,
              }}
            />
          )
        }

        // Render spacer
        if (item.type === 'spacer') {
          return <div key={item.id} style={{ flex: 1 }} />
        }

        // Render nav item
        const isActive = activeTab === item.id
        const isHovered = hoveredItem === item.id
        const IconComponent = item.icon

        return (
          <div
            key={item.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={() => onTabChange(item.id)}
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.lg,
                border: 'none',
                background: isActive ? colors.purple.dim : isHovered ? colors.depth1 : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
                position: 'relative',
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 24,
                    background: gradients.unicorn,
                    borderRadius: `0 ${radius.xs}px ${radius.xs}px 0`,
                  }}
                />
              )}

              <IconComponent
                size={22}
                style={{
                  color: isActive
                    ? (item.color || colors.purple[400])
                    : isHovered
                      ? colors.text[70]
                      : colors.text[30],
                  transition: `color ${animation.duration.fast}ms`,
                }}
              />
            </button>

            {/* Tooltip */}
            {isHovered && (
              <div
                style={{
                  position: 'absolute',
                  left: 60,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: `${spacing[2]}px ${spacing[3]}px`,
                  background: colors.depth2,
                  border: `1px solid ${colors.glass.borderLight}`,
                  borderRadius: radius.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text[90],
                  whiteSpace: 'nowrap',
                  zIndex: 100,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  animation: `tooltipFadeIn ${animation.duration.fast}ms ${animation.easing.smooth}`,
                }}
              >
                {item.label}
              </div>
            )}
          </div>
        )
      })}

      <style>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }
      `}</style>
    </nav>
  )
}
