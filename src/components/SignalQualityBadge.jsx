/**
 * Signal Quality Badge Component
 * Displays quality score and rating for trading signals
 */

import { useMemo } from 'react'
import { scoreSignal, getQualityRating } from '../utils/signalQualityScorer.js'

export default function SignalQualityBadge({ signal, showDetails = false }) {
  const quality = useMemo(() => scoreSignal(signal), [signal])

  const { rating, qualityScore, stats, confidence } = quality

  // Color mapping
  const colorStyles = {
    emerald: {
      bg: 'rgba(16,185,129,0.15)',
      border: 'rgba(16,185,129,0.4)',
      text: '#10b981',
      glow: 'rgba(16,185,129,0.3)'
    },
    cyan: {
      bg: 'rgba(34,211,238,0.15)',
      border: 'rgba(34,211,238,0.4)',
      text: '#22d3ee',
      glow: 'rgba(34,211,238,0.3)'
    },
    blue: {
      bg: 'rgba(59,130,246,0.15)',
      border: 'rgba(59,130,246,0.4)',
      text: '#3b82f6',
      glow: 'rgba(59,130,246,0.3)'
    },
    slate: {
      bg: 'rgba(148,163,184,0.15)',
      border: 'rgba(148,163,184,0.3)',
      text: '#94a3b8',
      glow: 'rgba(148,163,184,0.2)'
    },
    yellow: {
      bg: 'rgba(234,179,8,0.15)',
      border: 'rgba(234,179,8,0.4)',
      text: '#eab308',
      glow: 'rgba(234,179,8,0.3)'
    },
    rose: {
      bg: 'rgba(244,63,94,0.15)',
      border: 'rgba(244,63,94,0.4)',
      text: '#f43f5e',
      glow: 'rgba(244,63,94,0.3)'
    }
  }

  const colors = colorStyles[rating.color] || colorStyles.slate

  if (!showDetails) {
    // Compact badge
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          color: colors.text
        }}
        title={`Signal Quality: ${qualityScore}/100 (${stats.count} historical samples)`}
      >
        <span>{rating.icon}</span>
        <span>{qualityScore}</span>
      </div>
    )
  }

  // Detailed view
  return (
    <div
      className="p-3 rounded-lg border backdrop-blur-sm"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        boxShadow: `0 0 20px ${colors.glow}`
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{rating.icon}</span>
          <div>
            <div className="text-sm font-semibold" style={{ color: colors.text }}>
              {rating.label} Signal
            </div>
            <div className="text-xs text-slate-400">
              Quality Score: {qualityScore}/100
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: colors.text }}>
            {qualityScore}
          </div>
          <div className="text-xs text-slate-400 uppercase">
            {confidence} confidence
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${qualityScore}%`,
            backgroundColor: colors.text,
            boxShadow: `0 0 10px ${colors.glow}`
          }}
        />
      </div>

      {/* Stats grid */}
      {stats.count > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-slate-400">Win Rate</div>
            <div className="font-medium" style={{ color: colors.text }}>
              {(stats.winRate * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-slate-400">Avg Return</div>
            <div className="font-medium" style={{ color: colors.text }}>
              {stats.avgReturn > 0 ? '+' : ''}{(stats.avgReturn * 100).toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-slate-400">Profit Factor</div>
            <div className="font-medium" style={{ color: colors.text }}>
              {stats.profitFactor.toFixed(2)}x
            </div>
          </div>
          <div>
            <div className="text-slate-400">Samples</div>
            <div className="font-medium" style={{ color: colors.text }}>
              {stats.count} trades
            </div>
          </div>
        </div>
      )}

      {stats.count === 0 && (
        <div className="text-xs text-slate-400 text-center py-2">
          No historical data for this signal type yet
        </div>
      )}
    </div>
  )
}
