/**
 * Market Regime Indicator
 *
 * Displays the current market regime (Bull/Bear/Neutral) based on
 * daily timeframe analysis (Pivot + Ichimoku confluence).
 *
 * This is a compact badge overlay for the TradingView chart.
 */

import React from 'react'

export default function MarketRegimeIndicator({ dailyState }) {
  if (!dailyState) {
    return null
  }

  const dailyPivot = dailyState.pivotNow
  const dailyIchi = dailyState.ichiRegime

  // Determine regime
  let regime = 'neutral'
  if (dailyPivot === 'bullish' && dailyIchi === 'bullish') {
    regime = 'bull'
  } else if (dailyPivot === 'bearish' && dailyIchi === 'bearish') {
    regime = 'bear'
  }

  const config = getRegimeConfig(regime)

  return (
    <div className={`glass-panel px-4 py-2.5 ${config.borderColor} border-2`}>
      <div className="flex items-center gap-2.5">
        {/* Animated indicator dot */}
        <div className="relative">
          <div className={`absolute inset-0 ${config.glowColor} blur-md opacity-50 animate-pulse`} />
          <div className={`relative w-3 h-3 rounded-full ${config.dotColor}`} />
        </div>

        {/* Regime label */}
        <div className="flex flex-col">
          <span className={`text-sm font-bold uppercase tracking-wider ${config.textColor}`}>
            {config.icon} {config.label}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
            Market Regime
          </span>
        </div>
      </div>

      {/* Sub-info: Pivot & Ichimoku states */}
      <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="text-slate-400">Pivot:</span>
          <span className={getIndicatorColor(dailyPivot)}>
            {formatIndicator(dailyPivot)}
          </span>
        </div>
        <div className="w-px h-3 bg-slate-700" />
        <div className="flex items-center gap-1">
          <span className="text-slate-400">Ichi:</span>
          <span className={getIndicatorColor(dailyIchi)}>
            {formatIndicator(dailyIchi)}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Get regime configuration (colors, labels, icons)
 */
function getRegimeConfig(regime) {
  const configs = {
    bull: {
      label: 'BULL REGIME',
      icon: '🟢',
      textColor: 'text-green-400',
      dotColor: 'bg-green-500',
      glowColor: 'bg-green-500',
      borderColor: 'border-green-500/50'
    },
    bear: {
      label: 'BEAR REGIME',
      icon: '🔴',
      textColor: 'text-red-400',
      dotColor: 'bg-red-500',
      glowColor: 'bg-red-500',
      borderColor: 'border-red-500/50'
    },
    neutral: {
      label: 'NEUTRAL',
      icon: '🟡',
      textColor: 'text-yellow-400',
      dotColor: 'bg-yellow-500',
      glowColor: 'bg-yellow-500',
      borderColor: 'border-yellow-500/50'
    }
  }

  return configs[regime] || configs.neutral
}

/**
 * Get color for individual indicator states
 */
function getIndicatorColor(value) {
  if (!value) return 'text-slate-400'
  const v = value.toLowerCase()
  if (v === 'bullish') return 'text-green-400'
  if (v === 'bearish') return 'text-red-400'
  return 'text-slate-400'
}

/**
 * Format indicator value for display
 */
function formatIndicator(value) {
  if (!value) return '—'
  return value.charAt(0).toUpperCase() + value.slice(1)
}
