/**
 * SATY Levels Overlay - Compact Version
 *
 * Displays key SATY (ATR-based) support and resistance levels
 * as a compact overlay on the TradingView chart.
 *
 * Shows:
 * - Current price vs pivot
 * - Resistance (upside target)
 * - Support (downside target)
 */

import React from 'react'

export default function SatyLevelsOverlay({ saty, currentPrice }) {
  if (!saty || !saty.levels) {
    return null
  }

  const { pivot, atr, levels } = saty

  // Determine if price is above or below pivot
  const abovePivot = currentPrice > pivot
  const distance = currentPrice - pivot
  const distancePct = pivot ? ((distance / pivot) * 100).toFixed(2) : '0.00'

  // Key levels to show
  const resistance = levels.t1000.up  // Primary upside target
  const support = levels.t1000.dn     // Primary downside target

  return (
    <div className="glass-panel p-3 min-w-[200px] space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <div>
          <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">
            SATY Levels
          </div>
          <div className="text-[10px] text-slate-500">
            ATR: {atr ? atr.toFixed(2) : '—'}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* Pivot Position */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Pivot</span>
        <div className="text-right">
          <div className="font-semibold text-cyan-300">
            ${pivot ? pivot.toFixed(2) : '—'}
          </div>
          {currentPrice && pivot && (
            <div className={`text-[10px] ${abovePivot ? 'text-green-400' : 'text-red-400'}`}>
              {abovePivot ? '+' : ''}{distancePct}%
            </div>
          )}
        </div>
      </div>

      {/* Resistance */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <span className="text-red-400">▲</span>
          Resistance
        </span>
        <div className="text-right">
          <div className="font-semibold text-red-400">
            ${resistance ? resistance.toFixed(2) : '—'}
          </div>
          {currentPrice && resistance && (
            <div className="text-[10px] text-slate-500">
              +{((resistance - currentPrice) / currentPrice * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Support */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <span className="text-green-400">▼</span>
          Support
        </span>
        <div className="text-right">
          <div className="font-semibold text-green-400">
            ${support ? support.toFixed(2) : '—'}
          </div>
          {currentPrice && support && (
            <div className="text-[10px] text-slate-500">
              {((support - currentPrice) / currentPrice * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
