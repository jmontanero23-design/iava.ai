/**
 * LEGENDARY Icon Rail
 *
 * Vertical navigation for desktop (72px width)
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html
 */

import { useState } from 'react'
import {
  LineChart,
  Search,
  Brain,
  Wallet,
  Sparkles,
  Settings,
  Bell,
  HelpCircle,
  Users,
  BookOpen,
} from 'lucide-react'
import { LogoMark } from '../ui/Logo'
import { colors, gradients, animation, spacing, radius, layout } from '../../styles/tokens'

const navItems = [
  { id: 'chart', Icon: LineChart, label: 'Trade', color: colors.cyan[400] },
  { id: 'discover', Icon: Search, label: 'Discover', color: colors.purple[400] },
  { id: 'ai-hub', Icon: Brain, label: 'AI Hub', color: colors.purple[500] },
  { id: 'portfolio', Icon: Wallet, label: 'Portfolio', color: colors.emerald[400] },
  { id: 'ava-mind', Icon: Sparkles, label: 'AVA', color: colors.indigo[400], isAVA: true },
]

const bottomItems = [
  { id: 'social', Icon: Users, label: 'Social' },
  { id: 'learn', Icon: BookOpen, label: 'Learn' },
  { id: 'notifications', Icon: Bell, label: 'Alerts' },
  { id: 'settings', Icon: Settings, label: 'Settings' },
]

export default function IconRail({ activeTab, onTabChange }) {
  const [hoveredItem, setHoveredItem] = useState(null)

  const NavButton = ({ item, isActive }) => {
    const isHovered = hoveredItem === item.id
    const color = item.color || colors.text[50]

    return (
      <button
        onClick={() => onTabChange(item.id)}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          width: '100%',
          height: 56,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          background: isActive
            ? item.isAVA
              ? gradients.unicorn
              : `${color}15`
            : 'transparent',
          border: 'none',
          borderRadius: radius.lg,
          cursor: 'pointer',
          position: 'relative',
          transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
          transform: isHovered && !isActive ? 'scale(1.05)' : 'scale(1)',
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
              background: item.isAVA ? '#fff' : color,
              borderRadius: '0 4px 4px 0',
            }}
          />
        )}

        <item.Icon
          size={22}
          style={{
            color: isActive
              ? item.isAVA
                ? '#fff'
                : color
              : isHovered
                ? color
                : colors.text[50],
            transition: `color ${animation.duration.fast}ms`,
          }}
        />

        <span
          style={{
            fontSize: 10,
            fontWeight: isActive ? '600' : '500',
            color: isActive
              ? item.isAVA
                ? '#fff'
                : color
              : isHovered
                ? colors.text[70]
                : colors.text[30],
            letterSpacing: '0.02em',
            transition: `color ${animation.duration.fast}ms`,
          }}
        >
          {item.label}
        </span>

        {/* Tooltip on hover */}
        {isHovered && !isActive && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              marginLeft: 8,
              padding: '6px 10px',
              background: colors.depth2,
              border: `1px solid ${colors.glass.border}`,
              borderRadius: radius.md,
              fontSize: 12,
              fontWeight: '500',
              color: colors.text[90],
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 100,
            }}
          >
            {item.label}
          </div>
        )}
      </button>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: `${spacing[3]}px ${spacing[2]}px`,
      }}
    >
      {/* Logo at top */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: spacing[4],
          paddingBottom: spacing[3],
          borderBottom: `1px solid ${colors.glass.border}`,
        }}
      >
        <LogoMark size={36} animate={false} />
      </div>

      {/* Main navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
          />
        ))}
      </nav>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: colors.glass.border,
          margin: `${spacing[3]}px 0`,
        }}
      />

      {/* Bottom utilities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
        {bottomItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
          />
        ))}
      </div>
    </div>
  )
}
