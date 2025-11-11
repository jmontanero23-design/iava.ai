/**
 * Signal Quality Badge Component
 * Displays quality score and rating for trading signals
 */

import { useMemo } from 'react'
import { scoreSignal, getQualityRating } from '../utils/signalQualityScorer.js'

export default function SignalQualityBadge({ signal, showDetails = false }) {
  const quality = useMemo(() => scoreSignal(signal), [signal])

  const { rating, qualityScore, stats, confidence } = quality

  // Tailwind class mapping for premium styles
  const colorClasses = {
    emerald: {
      compact: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      detailed: 'bg-emerald-900/20 border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'bg-emerald-500',
      progress: 'bg-emerald-500'
    },
    cyan: {
      compact: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
      detailed: 'bg-cyan-900/20 border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'bg-cyan-500',
      progress: 'bg-cyan-500'
    },
    blue: {
      compact: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
      detailed: 'bg-blue-900/20 border-blue-500/30',
      text: 'text-blue-400',
      glow: 'bg-blue-500',
      progress: 'bg-blue-500'
    },
    slate: {
      compact: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
      detailed: 'bg-slate-800/20 border-slate-600/30',
      text: 'text-slate-400',
      glow: 'bg-slate-500',
      progress: 'bg-slate-500'
    },
    yellow: {
      compact: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
      detailed: 'bg-yellow-900/20 border-yellow-500/30',
      text: 'text-yellow-400',
      glow: 'bg-yellow-500',
      progress: 'bg-yellow-500'
    },
    rose: {
      compact: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
      detailed: 'bg-rose-900/20 border-rose-500/30',
      text: 'text-rose-400',
      glow: 'bg-rose-500',
      progress: 'bg-rose-500'
    }
  }

  const colors = colorClasses[rating.color] || colorClasses.slate

  if (!showDetails) {
    // Compact badge
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${colors.compact}`}
        title={`Signal Quality: ${qualityScore}/100 (${stats.count} historical samples)`}
      >
        <span>{rating.icon}</span>
        <span>{qualityScore}</span>
      </div>
    )
  }

  // Premium Detailed view
  return (
    <div className={`relative overflow-hidden p-4 rounded-xl border ${colors.detailed}`}>
      {/* Gradient glow effect */}
      <div className={`absolute inset-0 ${colors.glow} blur-2xl opacity-10`} />

      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{rating.icon}</span>
            <div>
              <div className={`text-sm font-bold ${colors.text}`}>
                {rating.label} Signal
              </div>
              <div className="text-xs text-slate-400">
                Quality Score: {qualityScore}/100
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${colors.text}`}>
              {qualityScore}
            </div>
            <div className="text-xs text-slate-400 uppercase font-semibold">
              {confidence} confidence
            </div>
          </div>
        </div>

        {/* Premium Progress bar */}
        <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.progress}`}
            style={{
              width: `${qualityScore}%`,
              boxShadow: `0 0 10px currentColor`
            }}
          />
        </div>

        {/* Premium Stats grid */}
        {stats.count > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="text-xs text-slate-400 font-medium mb-0.5">Win Rate</div>
              <div className={`text-sm font-bold ${colors.text}`}>
                {(stats.winRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="text-xs text-slate-400 font-medium mb-0.5">Avg Return</div>
              <div className={`text-sm font-bold ${colors.text}`}>
                {stats.avgReturn > 0 ? '+' : ''}{(stats.avgReturn * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="text-xs text-slate-400 font-medium mb-0.5">Profit Factor</div>
              <div className={`text-sm font-bold ${colors.text}`}>
                {stats.profitFactor.toFixed(2)}x
              </div>
            </div>
            <div className="p-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="text-xs text-slate-400 font-medium mb-0.5">Samples</div>
              <div className={`text-sm font-bold ${colors.text}`}>
                {stats.count} trades
              </div>
            </div>
          </div>
        )}

        {stats.count === 0 && (
          <div className="text-xs text-slate-400 text-center py-3 bg-slate-800/20 rounded-lg border border-slate-700/20">
            No historical data for this signal type yet
          </div>
        )}
      </div>
    </div>
  )
}
