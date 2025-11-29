/**
 * InsightCard - Actionable Trading Insights
 *
 * Displays AI-generated insights with potential profit/risk calculations.
 * Each insight is actionable and can be executed directly.
 *
 * Features:
 * - Dollar potential calculations
 * - Risk/reward visualization
 * - One-click execution
 * - Confidence indicators
 * - Time-sensitive alerts
 */

import React, { useState } from 'react'

// Insight types with styling
const INSIGHT_TYPES = {
  opportunity: {
    icon: '💰',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    label: 'Opportunity'
  },
  warning: {
    icon: '⚠️',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    label: 'Warning'
  },
  pattern: {
    icon: '📊',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    label: 'Pattern'
  },
  prediction: {
    icon: '🔮',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    label: 'Prediction'
  },
  streak: {
    icon: '🔥',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    label: 'Streak'
  },
  timing: {
    icon: '⏰',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    label: 'Timing'
  }
}

// Risk level indicators
const RISK_LEVELS = {
  LOW: { color: '#10B981', label: 'Low Risk', width: '33%' },
  MEDIUM: { color: '#F59E0B', label: 'Medium Risk', width: '66%' },
  HIGH: { color: '#EF4444', label: 'High Risk', width: '100%' }
}

// Format currency with proper sign
function formatCurrency(value) {
  const absValue = Math.abs(value)
  const formatted = absValue >= 1000
    ? `$${(absValue / 1000).toFixed(1)}k`
    : `$${absValue.toFixed(0)}`
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

export default function InsightCard({
  insight,
  onAction,
  onDismiss,
  compact = false,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isActioning, setIsActioning] = useState(false)

  const type = INSIGHT_TYPES[insight.type] || INSIGHT_TYPES.pattern
  const risk = RISK_LEVELS[insight.risk] || RISK_LEVELS.MEDIUM

  const handleAction = async () => {
    if (!onAction) return
    setIsActioning(true)
    try {
      await onAction(insight)
    } finally {
      setIsActioning(false)
    }
  }

  if (compact) {
    return (
      <div
        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${className}`}
        style={{
          backgroundColor: type.bgColor,
          borderColor: type.borderColor,
          borderWidth: 1
        }}
        onClick={() => setIsExpanded(true)}
      >
        <span className="text-xl">{type.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{insight.title}</p>
          <p className="text-xs text-slate-400 truncate">{insight.description}</p>
        </div>
        {insight.potentialValue && (
          <span
            className="text-sm font-bold"
            style={{ color: insight.potentialValue >= 0 ? '#10B981' : '#EF4444' }}
          >
            {formatCurrency(insight.potentialValue)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all ${className}`}
      style={{
        backgroundColor: type.bgColor,
        borderColor: type.borderColor,
        borderWidth: 1
      }}
    >
      {/* Gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${type.color}, ${type.color}80)`
        }}
      />

      {/* Main content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: `${type.color}20` }}
          >
            {type.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${type.color}20`, color: type.color }}
              >
                {type.label}
              </span>
              {insight.urgent && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 animate-pulse">
                  URGENT
                </span>
              )}
            </div>
            <h3 className="text-white font-semibold mt-1.5">{insight.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{insight.description}</p>
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={() => onDismiss(insight)}
              className="p-1 rounded hover:bg-slate-800/50 transition-colors text-slate-500 hover:text-slate-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Potential value section */}
        {insight.potentialValue !== undefined && (
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Potential Value</span>
              <span
                className="text-2xl font-bold"
                style={{ color: insight.potentialValue >= 0 ? '#10B981' : '#EF4444' }}
              >
                {formatCurrency(insight.potentialValue)}
              </span>
            </div>

            {/* Confidence bar */}
            {insight.confidence !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Confidence</span>
                  <span style={{ color: type.color }}>{insight.confidence}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${insight.confidence}%`,
                      backgroundColor: type.color
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Risk indicator */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Risk Level</span>
              <span style={{ color: risk.color }}>{risk.label}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: risk.width,
                  backgroundColor: risk.color
                }}
              />
            </div>
          </div>
        </div>

        {/* Supporting data */}
        {insight.data && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(insight.data).map(([key, value]) => (
              <div key={key} className="bg-slate-900/30 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                <div className="text-sm text-white font-medium">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Reasoning */}
        {insight.reasoning && (
          <div className="mt-4 p-3 bg-slate-900/30 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-sm">💭</span>
              <p className="text-xs text-slate-400 italic">{insight.reasoning}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {insight.action && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAction}
              disabled={isActioning}
              className="flex-1 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: type.color,
                color: 'white'
              }}
            >
              {isActioning ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                insight.action.label || 'Take Action'
              )}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Expanded details */}
        {isExpanded && insight.details && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h4 className="text-sm font-medium text-white mb-2">Details</h4>
            <div className="text-sm text-slate-400 space-y-2">
              {typeof insight.details === 'string' ? (
                <p>{insight.details}</p>
              ) : (
                insight.details.map((detail, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    {detail}
                  </p>
                ))
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {insight.timestamp && (
          <div className="mt-3 text-xs text-slate-500 text-right">
            {new Date(insight.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

// "What Would AVA Do?" prediction card
export function WhatWouldAVADo({
  prediction,
  onFollowAdvice,
  className = ''
}) {
  if (!prediction) return null

  const actionColor = prediction.suggestedAction === 'BUY'
    ? '#10B981'
    : prediction.suggestedAction === 'SELL'
    ? '#EF4444'
    : '#F59E0B'

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 ${className}`}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 animate-shimmer" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-2xl">🔮</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">What Would AVA Do?</h3>
            <p className="text-xs text-purple-400">AI Prediction based on your patterns</p>
          </div>
        </div>

        {/* Prediction content */}
        <div className="space-y-4">
          {/* Symbol and action */}
          {prediction.symbol && (
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div>
                <span className="text-xs text-slate-400">Symbol</span>
                <div className="text-xl font-bold text-white">{prediction.symbol}</div>
              </div>
              <div
                className="px-4 py-2 rounded-lg font-bold text-lg"
                style={{
                  backgroundColor: `${actionColor}20`,
                  color: actionColor
                }}
              >
                {prediction.suggestedAction}
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div className="p-3 bg-slate-900/30 rounded-lg">
            <p className="text-sm text-slate-300 italic">
              "{prediction.reasoning}"
            </p>
          </div>

          {/* Expected outcome */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <span className="text-xs text-emerald-400">Potential Gain</span>
              <div className="text-xl font-bold text-emerald-400">
                +{prediction.potentialGain?.toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
              <span className="text-xs text-rose-400">Risk</span>
              <div className="text-xl font-bold text-rose-400">
                -{prediction.potentialLoss?.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">AVA's Confidence</span>
              <span className="text-purple-400 font-bold">{prediction.confidence}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                style={{ width: `${prediction.confidence}%` }}
              />
            </div>
          </div>

          {/* Action button */}
          {onFollowAdvice && (
            <button
              onClick={() => onFollowAdvice(prediction)}
              className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
            >
              Follow AVA's Advice
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Insight list container
export function InsightList({
  insights = [],
  onAction,
  onDismiss,
  maxVisible = 5,
  className = ''
}) {
  const [showAll, setShowAll] = useState(false)

  const visibleInsights = showAll ? insights : insights.slice(0, maxVisible)
  const hasMore = insights.length > maxVisible

  if (insights.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <span className="text-4xl">🔍</span>
        <p className="text-slate-400 mt-3">No insights yet</p>
        <p className="text-xs text-slate-500 mt-1">Keep trading and AVA will learn your patterns</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleInsights.map(insight => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onAction={onAction}
          onDismiss={onDismiss}
        />
      ))}

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {showAll ? 'Show less' : `Show ${insights.length - maxVisible} more insights`}
        </button>
      )}
    </div>
  )
}
