/**
 * LEGENDARY You/Profile Tab
 *
 * User profile with expandable settings cards
 * Based on: iAVA-ULTIMATE-LEGENDARY-MOBILE.html (You Tab section)
 */

import { useState } from 'react'
import {
  User,
  Brain,
  Shield,
  Bell,
  Palette,
  HelpCircle,
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
  Award,
  Clock,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { LogoMark } from './ui/Logo'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Profile data
const profileData = {
  name: 'Trader',
  archetype: 'Momentum Hunter',
  level: 'Elite',
  joinDate: 'Nov 2024',
  emotionalState: {
    emoji: '😌',
    label: 'Focused',
    description: 'Optimal trading mindset',
    color: colors.emerald[400],
  },
  stats: {
    winRate: 73,
    totalTrades: 247,
    avgReturn: 12.4,
    bestStreak: 14,
  },
}

// Settings categories
const settingsCards = [
  {
    id: 'emotional',
    icon: Brain,
    iconColor: 'purple',
    title: 'Emotional Intelligence',
    description: 'Your trading psychology',
    expandedContent: 'emotional',
  },
  {
    id: 'journal',
    icon: BarChart3,
    iconColor: 'cyan',
    title: 'Trade Journal',
    description: 'Review your performance',
    expandedContent: 'journal',
  },
  {
    id: 'ava',
    icon: Zap,
    iconColor: 'indigo',
    title: 'AVA Settings',
    description: 'Configure your AI assistant',
    expandedContent: 'ava',
  },
  {
    id: 'notifications',
    icon: Bell,
    iconColor: 'amber',
    title: 'Notifications',
    description: 'Alerts and updates',
    expandedContent: null,
  },
  {
    id: 'appearance',
    icon: Palette,
    iconColor: 'emerald',
    title: 'Appearance',
    description: 'Theme and display',
    expandedContent: null,
  },
  {
    id: 'security',
    icon: Shield,
    iconColor: 'red',
    title: 'Security',
    description: 'Account protection',
    expandedContent: null,
  },
]

const iconColors = {
  purple: { bg: colors.purple.dim, fg: colors.purple[400] },
  cyan: { bg: colors.cyan.dim, fg: colors.cyan[400] },
  indigo: { bg: colors.indigo.dim, fg: colors.indigo[400] },
  amber: { bg: colors.amber.dim, fg: colors.amber[400] },
  emerald: { bg: colors.emerald.dim, fg: colors.emerald[400] },
  red: { bg: colors.red.dim, fg: colors.red[400] },
}

export default function YouTab() {
  const [expandedCard, setExpandedCard] = useState(null)
  const profile = profileData

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[4],
        paddingBottom: spacing[8],
      }}
    >
      {/* Profile Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[4],
          padding: spacing[5],
          background: `linear-gradient(180deg, ${colors.purple.dim} 0%, transparent 100%)`,
          borderRadius: radius['2xl'],
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 72,
            height: 72,
            background: gradients.unicorn,
            borderRadius: radius.xl,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: `0 0 40px ${colors.purple.glow}`,
          }}
        >
          <User size={36} style={{ color: '#fff' }} />
          {/* Online indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: -3,
              right: -3,
              width: 22,
              height: 22,
              background: colors.emerald[400],
              border: `3px solid ${colors.voidSoft}`,
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.black,
              color: colors.text[100],
              letterSpacing: typography.letterSpacing.tight,
              marginBottom: 4,
            }}
          >
            {profile.name}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              color: colors.purple[400],
            }}
          >
            <Award size={16} />
            <span
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              {profile.archetype}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: spacing[2],
        }}
      >
        <QuickStat
          value={`${profile.stats.winRate}%`}
          label="Win Rate"
          color={colors.emerald[400]}
        />
        <QuickStat
          value={profile.stats.totalTrades}
          label="Trades"
          color={colors.cyan[400]}
        />
        <QuickStat
          value={`${profile.stats.avgReturn}%`}
          label="Avg Return"
          color={colors.purple[400]}
        />
        <QuickStat
          value={profile.stats.bestStreak}
          label="Best Streak"
          color={colors.amber[400]}
        />
      </div>

      {/* Settings Cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        {settingsCards.map((card) => (
          <SettingsCard
            key={card.id}
            card={card}
            isExpanded={expandedCard === card.id}
            onToggle={() => card.expandedContent && toggleCard(card.id)}
            profile={profile}
          />
        ))}
      </div>

      {/* Bottom Actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[2],
          marginTop: spacing[2],
        }}
      >
        <ActionButton
          icon={CreditCard}
          label="Subscription"
          sublabel="Elite Plan"
        />
        <ActionButton
          icon={HelpCircle}
          label="Help & Support"
        />
        <ActionButton
          icon={LogOut}
          label="Sign Out"
          danger
        />
      </div>

      {/* Version */}
      <div
        style={{
          textAlign: 'center',
          padding: spacing[4],
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
            marginBottom: spacing[2],
          }}
        >
          <LogoMark size={20} />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.bold,
              background: gradients.unicorn,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            iAVA.ai
          </span>
        </div>
        <span
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text[30],
          }}
        >
          LEGENDARY Edition v1.0.0
        </span>
      </div>
    </div>
  )
}

// Quick Stat Component
function QuickStat({ value, label, color }) {
  return (
    <div
      style={{
        background: colors.depth1,
        borderRadius: radius.lg,
        padding: spacing[3],
        textAlign: 'center',
        border: `1px solid ${colors.glass.border}`,
      }}
    >
      <div
        style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: color || colors.text[100],
          marginBottom: 2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: colors.text[50],
        }}
      >
        {label}
      </div>
    </div>
  )
}

// Settings Card Component
function SettingsCard({ card, isExpanded, onToggle, profile }) {
  const iconColor = iconColors[card.iconColor] || iconColors.purple

  return (
    <div
      style={{
        background: colors.depth1,
        border: `1px solid ${isExpanded ? `${colors.purple[500]}30` : colors.glass.border}`,
        borderRadius: radius.xl,
        overflow: 'hidden',
        transition: `all ${animation.duration.normal}ms ${animation.easing.spring}`,
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: spacing[4],
          background: 'transparent',
          border: 'none',
          cursor: card.expandedContent ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: radius.lg,
            background: iconColor.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing[3],
          }}
        >
          <card.icon size={22} style={{ color: iconColor.fg }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
              marginBottom: 2,
            }}
          >
            {card.title}
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text[50],
            }}
          >
            {card.description}
          </p>
        </div>

        {/* Arrow */}
        <div
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: `transform ${animation.duration.normal}ms ${animation.easing.spring}`,
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronRight size={16} style={{ color: colors.text[50] }} />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && card.expandedContent && (
        <div
          style={{
            padding: `0 ${spacing[4]}px ${spacing[4]}px`,
            animation: `slideIn ${animation.duration.normal}ms ${animation.easing.smooth}`,
          }}
        >
          {card.expandedContent === 'emotional' && (
            <EmotionalStateContent state={profile.emotionalState} />
          )}
          {card.expandedContent === 'journal' && (
            <JournalStatsContent stats={profile.stats} />
          )}
          {card.expandedContent === 'ava' && (
            <AVASettingsContent />
          )}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Emotional State Content
function EmotionalStateContent({ state }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[4],
        padding: spacing[4],
        background: colors.emerald.dim,
        borderRadius: radius.lg,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          background: `linear-gradient(135deg, ${colors.emerald[400]}, ${colors.cyan[400]})`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}
      >
        {state.emoji}
      </div>
      <div>
        <h4
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: state.color,
            marginBottom: 2,
          }}
        >
          {state.label}
        </h4>
        <p
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text[50],
          }}
        >
          {state.description}
        </p>
      </div>
    </div>
  )
}

// Journal Stats Content
function JournalStatsContent({ stats }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: spacing[2],
      }}
    >
      <JournalStat value={stats.totalTrades} label="Total Trades" />
      <JournalStat value={`${stats.winRate}%`} label="Win Rate" color={colors.emerald[400]} />
      <JournalStat value={`+${stats.avgReturn}%`} label="Avg Return" color={colors.emerald[400]} />
      <JournalStat value={stats.bestStreak} label="Best Streak" color={colors.amber[400]} />
    </div>
  )
}

function JournalStat({ value, label, color }) {
  return (
    <div
      style={{
        background: colors.depth2,
        borderRadius: radius.lg,
        padding: spacing[3],
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.black,
          color: color || colors.text[100],
          marginBottom: 2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: colors.text[50],
        }}
      >
        {label}
      </div>
    </div>
  )
}

// AVA Settings Content
function AVASettingsContent() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[3],
      }}
    >
      <SettingToggle label="Proactive Insights" enabled />
      <SettingToggle label="Voice Commands" enabled />
      <SettingToggle label="Trade Suggestions" enabled={false} />
      <SettingToggle label="Risk Alerts" enabled />
    </div>
  )
}

function SettingToggle({ label, enabled }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing[2]}px 0`,
      }}
    >
      <span
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text[70],
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 44,
          height: 24,
          borderRadius: radius.full,
          background: enabled ? colors.purple[500] : colors.depth3,
          padding: 2,
          cursor: 'pointer',
          transition: `background ${animation.duration.fast}ms`,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            transform: enabled ? 'translateX(20px)' : 'translateX(0)',
            transition: `transform ${animation.duration.fast}ms ${animation.easing.spring}`,
          }}
        />
      </div>
    </div>
  )
}

// Action Button Component
function ActionButton({ icon: Icon, label, sublabel, danger }) {
  return (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[4],
        background: colors.depth1,
        border: `1px solid ${colors.glass.border}`,
        borderRadius: radius.lg,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      <Icon
        size={20}
        style={{ color: danger ? colors.red[400] : colors.text[50] }}
      />
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: '600',
            color: danger ? colors.red[400] : colors.text[90],
          }}
        >
          {label}
        </span>
      </div>
      {sublabel && (
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.purple[400],
            fontWeight: '600',
          }}
        >
          {sublabel}
        </span>
      )}
      <ChevronRight size={16} style={{ color: colors.text[30] }} />
    </button>
  )
}
