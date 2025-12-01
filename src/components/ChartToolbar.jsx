/**
 * LEGENDARY Chart Toolbar
 *
 * Timeframe selector and indicator pills for chart view
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html (Chart Toolbar section)
 */

import { useState } from 'react'
import {
  Plus,
  Layers,
  Maximize2,
  TrendingUp,
  Activity,
  BarChart2,
  Crosshair,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

const timeframes = ['1m', '5m', '15m', '1H', '4H', 'D', 'W']

const indicators = [
  { id: 'sma', label: 'SMA 20', color: colors.cyan[400], active: true },
  { id: 'ema', label: 'EMA 9', color: colors.purple[400], active: true },
  { id: 'bb', label: 'Bollinger', color: colors.indigo[400], active: false },
  { id: 'rsi', label: 'RSI', color: colors.emerald[400], active: true },
  { id: 'macd', label: 'MACD', color: colors.amber[400], active: false },
  { id: 'vol', label: 'Volume', color: colors.text[50], active: true },
]

export default function ChartToolbar({
  activeTimeframe = '15m',
  onTimeframeChange,
  activeIndicators = [],
  onIndicatorToggle,
  onFullscreen,
  onDrawingMode,
  onLayersClick,
}) {
  const [showIndicators, setShowIndicators] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing[2]}px ${spacing[3]}px`,
        background: colors.glass.bg,
        backdropFilter: 'blur(12px)',
        borderRadius: radius.lg,
        border: `1px solid ${colors.glass.border}`,
        marginBottom: spacing[3],
      }}
    >
      {/* Left: Timeframe Pills */}
      <div
        style={{
          display: 'flex',
          gap: spacing[1],
        }}
      >
        {timeframes.map((tf) => {
          const isActive = activeTimeframe === tf
          return (
            <button
              key={tf}
              onClick={() => onTimeframeChange?.(tf)}
              style={{
                padding: `${spacing[1]}px ${spacing[3]}px`,
                background: isActive ? gradients.unicorn : 'transparent',
                border: isActive ? 'none' : `1px solid ${colors.glass.border}`,
                borderRadius: radius.md,
                fontSize: typography.fontSize.xs,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#fff' : colors.text[50],
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms`,
              }}
            >
              {tf}
            </button>
          )
        })}
      </div>

      {/* Center: Active Indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
          flex: 1,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {indicators
          .filter((ind) => ind.active)
          .map((indicator) => (
            <div
              key={indicator.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: `2px ${spacing[2]}px`,
                background: `${indicator.color}15`,
                borderRadius: radius.full,
                border: `1px solid ${indicator.color}30`,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  background: indicator.color,
                  borderRadius: '50%',
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: indicator.color,
                }}
              >
                {indicator.label}
              </span>
            </div>
          ))}

        {/* Add Indicator Button */}
        <button
          onClick={() => setShowIndicators(!showIndicators)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: `2px ${spacing[2]}px`,
            background: 'transparent',
            border: `1px dashed ${colors.glass.borderLight}`,
            borderRadius: radius.full,
            cursor: 'pointer',
          }}
        >
          <Plus size={10} style={{ color: colors.text[30] }} />
          <span
            style={{
              fontSize: 10,
              color: colors.text[30],
            }}
          >
            Add
          </span>
        </button>
      </div>

      {/* Right: Tools */}
      <div
        style={{
          display: 'flex',
          gap: spacing[1],
        }}
      >
        <ToolButton icon={Crosshair} onClick={onDrawingMode} tooltip="Drawing tools" />
        <ToolButton icon={Layers} onClick={onLayersClick} tooltip="Chart layers" />
        <ToolButton icon={Maximize2} onClick={onFullscreen} tooltip="Fullscreen" />
      </div>

      {/* Indicators Dropdown */}
      {showIndicators && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: spacing[2],
            padding: spacing[3],
            background: colors.glass.bgHeavy,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colors.glass.border}`,
            borderRadius: radius.lg,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            zIndex: 50,
            minWidth: 200,
          }}
        >
          <div
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: '600',
              color: colors.text[50],
              marginBottom: spacing[2],
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
            }}
          >
            Indicators
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {indicators.map((ind) => (
              <button
                key={ind.id}
                onClick={() => onIndicatorToggle?.(ind.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing[2],
                  background: ind.active ? `${ind.color}10` : 'transparent',
                  border: `1px solid ${ind.active ? `${ind.color}30` : 'transparent'}`,
                  borderRadius: radius.md,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      background: ind.color,
                      borderRadius: '50%',
                    }}
                  />
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: ind.active ? ind.color : colors.text[50],
                      fontWeight: ind.active ? '600' : '500',
                    }}
                  >
                    {ind.label}
                  </span>
                </div>
                {ind.active && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      background: ind.color,
                      borderRadius: radius.sm,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: 10 }}>✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Tool Button Component
function ToolButton({ icon: Icon, onClick, tooltip, active }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? colors.purple.dim : 'transparent',
        border: `1px solid ${active ? colors.purple[500] + '40' : 'transparent'}`,
        borderRadius: radius.md,
        cursor: 'pointer',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      <Icon
        size={16}
        style={{ color: active ? colors.purple[400] : colors.text[50] }}
      />
    </button>
  )
}
