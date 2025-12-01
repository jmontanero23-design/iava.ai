/**
 * LEGENDARY Notification Center
 *
 * Notification panel with history and actions
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html
 */

import { useState } from 'react'
import {
  Bell,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  MessageCircle,
  CheckCircle,
  Trash2,
  Check,
  Settings,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Demo notifications
const demoNotifications = [
  {
    id: 1,
    type: 'signal',
    title: 'Bullish Signal: NVDA',
    message: 'Breakout above $145 resistance with strong volume',
    time: '2m ago',
    read: false,
    icon: TrendingUp,
    color: colors.emerald[400],
  },
  {
    id: 2,
    type: 'alert',
    title: 'Price Alert Triggered',
    message: 'AMD reached your target price of $160',
    time: '15m ago',
    read: false,
    icon: Bell,
    color: colors.amber[400],
  },
  {
    id: 3,
    type: 'ava',
    title: 'AVA Insight',
    message: 'Market volatility increasing - consider adjusting positions',
    time: '1h ago',
    read: true,
    icon: Zap,
    color: colors.purple[400],
  },
  {
    id: 4,
    type: 'trade',
    title: 'Trade Executed',
    message: 'Bought 10 shares of AAPL at $178.32',
    time: '2h ago',
    read: true,
    icon: CheckCircle,
    color: colors.cyan[400],
  },
  {
    id: 5,
    type: 'warning',
    title: 'Risk Warning',
    message: 'Your TSLA position exceeds recommended allocation',
    time: '3h ago',
    read: true,
    icon: AlertTriangle,
    color: colors.red[400],
  },
]

export default function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(demoNotifications)
  const [filter, setFilter] = useState('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        maxWidth: '100vw',
        background: colors.glass.bgHeavy,
        backdropFilter: 'blur(20px)',
        borderLeft: `1px solid ${colors.glass.border}`,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.2s ease-out',
      }}
    >
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: colors.purple.dim,
              borderRadius: radius.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Bell size={20} style={{ color: colors.purple[400] }} />
            {unreadCount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 18,
                  height: 18,
                  background: colors.red[500],
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#fff',
                }}
              >
                {unreadCount}
              </div>
            )}
          </div>
          <div>
            <h2
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
              }}
            >
              Notifications
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text[50],
              }}
            >
              {unreadCount} unread
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: spacing[1] }}>
          <button
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: `1px solid ${colors.glass.border}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
            }}
          >
            <Settings size={16} style={{ color: colors.text[50] }} />
          </button>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: `1px solid ${colors.glass.border}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
            }}
          >
            <X size={18} style={{ color: colors.text[50] }} />
          </button>
        </div>
      </div>

      {/* Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing[2]}px ${spacing[4]}px`,
          borderBottom: `1px solid ${colors.glass.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: spacing[1],
          }}
        >
          {['all', 'unread', 'signal', 'alert'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: `${spacing[1]}px ${spacing[2]}px`,
                background: filter === f ? colors.purple.dim : 'transparent',
                border: `1px solid ${filter === f ? colors.purple[400] + '40' : 'transparent'}`,
                borderRadius: radius.full,
                cursor: 'pointer',
                fontSize: typography.fontSize.xs,
                fontWeight: filter === f ? '600' : '500',
                color: filter === f ? colors.purple[400] : colors.text[50],
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: `${spacing[1]}px ${spacing[2]}px`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: typography.fontSize.xs,
              fontWeight: '600',
              color: colors.cyan[400],
            }}
          >
            <Check size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing[3],
        }}
      >
        {filteredNotifications.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[2],
            }}
          >
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: spacing[8],
              textAlign: 'center',
            }}
          >
            <Bell
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
              No notifications
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div
          style={{
            padding: spacing[4],
            borderTop: `1px solid ${colors.glass.border}`,
          }}
        >
          <button
            onClick={clearAll}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: spacing[3],
              background: colors.depth2,
              border: `1px solid ${colors.glass.border}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={14} style={{ color: colors.text[50] }} />
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: '600',
                color: colors.text[50],
              }}
            >
              Clear All
            </span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Notification Item Component
function NotificationItem({ notification, onRead, onDelete }) {
  const Icon = notification.icon

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing[3],
        padding: spacing[3],
        background: notification.read ? 'transparent' : `${notification.color}08`,
        border: `1px solid ${notification.read ? colors.glass.border : notification.color + '30'}`,
        borderRadius: radius.lg,
        position: 'relative',
      }}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div
          style={{
            position: 'absolute',
            top: spacing[3],
            left: spacing[3],
            width: 8,
            height: 8,
            background: notification.color,
            borderRadius: '50%',
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          background: `${notification.color}15`,
          borderRadius: radius.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: !notification.read ? 12 : 0,
        }}
      >
        <Icon size={18} style={{ color: notification.color }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: notification.read ? '500' : '600',
            color: colors.text[100],
            marginBottom: 2,
          }}
        >
          {notification.title}
        </div>
        <p
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text[50],
            lineHeight: 1.4,
            marginBottom: spacing[2],
          }}
        >
          {notification.message}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: colors.text[30],
            }}
          >
            {notification.time}
          </span>

          {!notification.read && (
            <button
              onClick={onRead}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: '600',
                color: colors.cyan[400],
              }}
            >
              Mark read
            </button>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={onDelete}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: radius.md,
          cursor: 'pointer',
          opacity: 0.5,
          transition: `opacity ${animation.duration.fast}ms`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
      >
        <X size={14} style={{ color: colors.text[50] }} />
      </button>
    </div>
  )
}
