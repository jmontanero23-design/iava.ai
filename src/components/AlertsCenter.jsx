/**
 * LEGENDARY Alerts Center
 *
 * Dashboard for managing price alerts and notifications
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html
 */

import { useState } from 'react'
import {
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Trash2,
  Edit3,
  X,
  CheckCircle,
  ChevronDown,
  Zap,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Demo alerts data
const demoAlerts = [
  {
    id: 1,
    symbol: 'NVDA',
    type: 'price_above',
    price: 150.00,
    currentPrice: 142.56,
    status: 'active',
    createdAt: '2024-11-28',
    note: 'Breakout above resistance',
  },
  {
    id: 2,
    symbol: 'SPY',
    type: 'price_below',
    price: 580.00,
    currentPrice: 594.82,
    status: 'active',
    createdAt: '2024-11-27',
    note: 'Support breakdown warning',
  },
  {
    id: 3,
    symbol: 'TSLA',
    type: 'score_above',
    threshold: 80,
    currentScore: 65,
    status: 'active',
    createdAt: '2024-11-26',
    note: 'Wait for bullish confirmation',
  },
  {
    id: 4,
    symbol: 'AMD',
    type: 'price_above',
    price: 160.00,
    currentPrice: 156.78,
    status: 'triggered',
    triggeredAt: '2024-11-28 10:45 AM',
    note: 'Take profit target',
  },
]

const alertTypeConfig = {
  price_above: {
    icon: TrendingUp,
    label: 'Price Above',
    color: colors.emerald[400],
  },
  price_below: {
    icon: TrendingDown,
    label: 'Price Below',
    color: colors.red[400],
  },
  score_above: {
    icon: Zap,
    label: 'Score Above',
    color: colors.purple[400],
  },
  score_below: {
    icon: Target,
    label: 'Score Below',
    color: colors.amber[400],
  },
}

export default function AlertsCenter({ onClose }) {
  const [alerts, setAlerts] = useState(demoAlerts)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('all')

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true
    return a.status === filter
  })

  const deleteAlert = (id) => {
    setAlerts(alerts.filter((a) => a.id !== id))
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
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
              background: colors.amber.dim,
              borderRadius: radius.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={20} style={{ color: colors.amber[400] }} />
          </div>
          <div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
              }}
            >
              Alerts Center
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text[50],
              }}
            >
              {alerts.filter((a) => a.status === 'active').length} active alerts
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: spacing[2] }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1],
              padding: `${spacing[2]}px ${spacing[3]}px`,
              background: gradients.unicorn,
              border: 'none',
              borderRadius: radius.lg,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontWeight: '600',
              color: '#fff',
            }}
          >
            <Plus size={16} />
            New Alert
          </button>

          {onClose && (
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
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: spacing[2],
          padding: spacing[4],
          paddingBottom: 0,
        }}
      >
        {['all', 'active', 'triggered'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: `${spacing[1]}px ${spacing[3]}px`,
              background: filter === f ? colors.purple.dim : 'transparent',
              border: `1px solid ${filter === f ? colors.purple[400] + '40' : colors.glass.border}`,
              borderRadius: radius.full,
              cursor: 'pointer',
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
              {f === 'all' ? 'All Alerts' : f}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing[4],
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3],
          }}
        >
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDelete={() => deleteAlert(alert.id)}
            />
          ))}

          {filteredAlerts.length === 0 && (
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
                No alerts found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreate && (
        <CreateAlertModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}

// Alert Card Component
function AlertCard({ alert, onDelete }) {
  const config = alertTypeConfig[alert.type] || alertTypeConfig.price_above
  const Icon = config.icon
  const isTriggered = alert.status === 'triggered'

  return (
    <div
      style={{
        background: isTriggered ? colors.emerald.dim : colors.depth1,
        border: `1px solid ${isTriggered ? colors.emerald[400] + '40' : colors.glass.border}`,
        borderRadius: radius.xl,
        padding: spacing[4],
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Triggered indicator */}
      {isTriggered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: colors.emerald[400],
          }}
        />
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: spacing[3],
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 44,
            height: 44,
            background: `${config.color}15`,
            borderRadius: radius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={22} style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginBottom: spacing[1],
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
              }}
            >
              {alert.symbol}
            </span>
            <span
              style={{
                padding: `2px ${spacing[2]}px`,
                background: `${config.color}20`,
                borderRadius: radius.full,
                fontSize: 10,
                fontWeight: '600',
                color: config.color,
              }}
            >
              {config.label}
            </span>
            {isTriggered && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: `2px ${spacing[2]}px`,
                  background: colors.emerald.dim,
                  borderRadius: radius.full,
                  fontSize: 10,
                  fontWeight: '600',
                  color: colors.emerald[400],
                }}
              >
                <CheckCircle size={10} />
                Triggered
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text[70],
              marginBottom: spacing[2],
            }}
          >
            {alert.type.includes('price') ? (
              <>
                Target: <strong style={{ color: config.color }}>${alert.price.toFixed(2)}</strong>
                {' · '}
                Current: ${alert.currentPrice?.toFixed(2)}
              </>
            ) : (
              <>
                Threshold: <strong style={{ color: config.color }}>{alert.threshold}</strong>
                {' · '}
                Current: {alert.currentScore}
              </>
            )}
          </div>

          {alert.note && (
            <p
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text[50],
                fontStyle: 'italic',
              }}
            >
              "{alert.note}"
            </p>
          )}

          {/* Meta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
              marginTop: spacing[2],
            }}
          >
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
                {isTriggered ? `Triggered ${alert.triggeredAt}` : `Created ${alert.createdAt}`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: spacing[1],
          }}
        >
          <button
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: `1px solid ${colors.glass.border}`,
              borderRadius: radius.md,
              cursor: 'pointer',
            }}
          >
            <Edit3 size={14} style={{ color: colors.text[50] }} />
          </button>
          <button
            onClick={onDelete}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: colors.red.dim,
              border: `1px solid ${colors.red[400]}30`,
              borderRadius: radius.md,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={14} style={{ color: colors.red[400] }} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Create Alert Modal
function CreateAlertModal({ onClose }) {
  const [symbol, setSymbol] = useState('')
  const [alertType, setAlertType] = useState('price_above')
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: spacing[4],
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: colors.glass.bgHeavy,
          border: `1px solid ${colors.glass.border}`,
          borderRadius: radius['2xl'],
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing[4],
            borderBottom: `1px solid ${colors.glass.border}`,
          }}
        >
          <h3
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
            }}
          >
            Create Alert
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: radius.md,
              cursor: 'pointer',
            }}
          >
            <X size={18} style={{ color: colors.text[50] }} />
          </button>
        </div>

        {/* Modal Content */}
        <div
          style={{
            padding: spacing[4],
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[4],
          }}
        >
          {/* Symbol Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.xs,
                fontWeight: '600',
                color: colors.text[50],
                marginBottom: spacing[1],
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wider,
              }}
            >
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. NVDA"
              style={{
                width: '100%',
                padding: spacing[3],
                background: colors.depth2,
                border: `1px solid ${colors.glass.border}`,
                borderRadius: radius.lg,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
                outline: 'none',
              }}
            />
          </div>

          {/* Alert Type */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.xs,
                fontWeight: '600',
                color: colors.text[50],
                marginBottom: spacing[1],
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wider,
              }}
            >
              Alert Type
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: spacing[2],
              }}
            >
              {Object.entries(alertTypeConfig).map(([type, config]) => {
                const Icon = config.icon
                return (
                  <button
                    key={type}
                    onClick={() => setAlertType(type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      padding: spacing[3],
                      background: alertType === type ? `${config.color}15` : colors.depth2,
                      border: `1px solid ${alertType === type ? config.color + '40' : colors.glass.border}`,
                      borderRadius: radius.lg,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon
                      size={16}
                      style={{
                        color: alertType === type ? config.color : colors.text[50],
                      }}
                    />
                    <span
                      style={{
                        fontSize: typography.fontSize.xs,
                        fontWeight: alertType === type ? '600' : '500',
                        color: alertType === type ? config.color : colors.text[70],
                      }}
                    >
                      {config.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.xs,
                fontWeight: '600',
                color: colors.text[50],
                marginBottom: spacing[1],
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wider,
              }}
            >
              {alertType.includes('price') ? 'Price' : 'Score Threshold'}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={alertType.includes('price') ? '150.00' : '80'}
              style={{
                width: '100%',
                padding: spacing[3],
                background: colors.depth2,
                border: `1px solid ${colors.glass.border}`,
                borderRadius: radius.lg,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
                fontFamily: typography.fontFamily.mono,
                outline: 'none',
              }}
            />
          </div>

          {/* Note */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.xs,
                fontWeight: '600',
                color: colors.text[50],
                marginBottom: spacing[1],
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wider,
              }}
            >
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Breakout opportunity"
              style={{
                width: '100%',
                padding: spacing[3],
                background: colors.depth2,
                border: `1px solid ${colors.glass.border}`,
                borderRadius: radius.lg,
                fontSize: typography.fontSize.sm,
                color: colors.text[90],
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            padding: spacing[4],
            borderTop: `1px solid ${colors.glass.border}`,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: spacing[3],
              background: colors.depth2,
              border: `1px solid ${colors.glass.border}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontWeight: '600',
              color: colors.text[70],
            }}
          >
            Cancel
          </button>
          <button
            style={{
              flex: 1,
              padding: spacing[3],
              background: gradients.unicorn,
              border: 'none',
              borderRadius: radius.lg,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              fontWeight: '600',
              color: '#fff',
            }}
          >
            Create Alert
          </button>
        </div>
      </div>
    </div>
  )
}
