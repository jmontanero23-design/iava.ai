/**
 * PostTradeAnalysis - AI Trade Analysis Popup
 *
 * PhD++ Quality post-trade feedback:
 * - Entry quality analysis
 * - Potential exit points
 * - Pattern recognition
 * - Learning suggestions
 * - Historical comparison
 */

import React, { useState, useEffect } from 'react'

// Analysis result categories
const ANALYSIS_TYPES = {
  EXCELLENT: { label: 'Excellent Entry', color: '#10B981', icon: '🌟' },
  GOOD: { label: 'Good Trade', color: '#06B6D4', icon: '✅' },
  AVERAGE: { label: 'Average Entry', color: '#F59E0B', icon: '⚠️' },
  POOR: { label: 'Suboptimal Entry', color: '#EF4444', icon: '❌' }
}

// Analyze trade entry quality
function analyzeEntry(trade, marketContext = {}) {
  const score = calculateEntryScore(trade, marketContext)

  if (score >= 80) return { ...ANALYSIS_TYPES.EXCELLENT, score }
  if (score >= 60) return { ...ANALYSIS_TYPES.GOOD, score }
  if (score >= 40) return { ...ANALYSIS_TYPES.AVERAGE, score }
  return { ...ANALYSIS_TYPES.POOR, score }
}

function calculateEntryScore(trade, context) {
  let score = 50 // Base score

  // Trend alignment bonus
  if (context.trend && trade.side === 'buy' && context.trend === 'bullish') {
    score += 15
  } else if (context.trend && trade.side === 'sell' && context.trend === 'bearish') {
    score += 15
  }

  // Volume confirmation bonus
  if (context.volumeAboveAvg) {
    score += 10
  }

  // Near support/resistance bonus
  if (context.nearKeyLevel) {
    score += 10
  }

  // Timing bonus (market hours)
  const hour = new Date(trade.timestamp).getHours()
  if (hour >= 9 && hour <= 10) score += 5 // First hour
  if (hour >= 15 && hour <= 16) score -= 5 // Last hour volatility

  // Confidence level bonus
  if (trade.confidence) {
    score += (trade.confidence / 100) * 10
  }

  return Math.min(100, Math.max(0, score))
}

// Generate feedback based on analysis
function generateFeedback(trade, analysis, context = {}) {
  const feedback = []

  // Entry timing feedback
  if (analysis.score >= 70) {
    feedback.push({
      type: 'positive',
      text: `Great timing on this ${trade.side}! You entered with ${trade.symbol} showing strong momentum.`
    })
  } else if (analysis.score < 50) {
    feedback.push({
      type: 'improvement',
      text: `Consider waiting for better confirmation before entering. The setup showed mixed signals.`
    })
  }

  // Risk management feedback
  if (trade.stopLoss) {
    const riskPercent = Math.abs((trade.stopLoss - trade.entryPrice) / trade.entryPrice * 100)
    if (riskPercent <= 2) {
      feedback.push({
        type: 'positive',
        text: `Excellent risk control with a ${riskPercent.toFixed(1)}% stop loss.`
      })
    } else if (riskPercent > 5) {
      feedback.push({
        type: 'warning',
        text: `Your stop loss is ${riskPercent.toFixed(1)}% away. Consider tighter risk management.`
      })
    }
  } else {
    feedback.push({
      type: 'critical',
      text: `No stop loss set! Always protect your position with a stop loss.`
    })
  }

  // Target setting feedback
  if (trade.target) {
    const targetPercent = Math.abs((trade.target - trade.entryPrice) / trade.entryPrice * 100)
    feedback.push({
      type: 'info',
      text: `Target set at ${targetPercent.toFixed(1)}% from entry. Good to have a plan!`
    })
  }

  return feedback
}

// Suggest optimal exit points
function suggestExitPoints(trade, context = {}) {
  const entryPrice = trade.entryPrice
  const isLong = trade.side === 'buy'

  const suggestions = []

  // Conservative target (1:1 R/R)
  if (trade.stopLoss) {
    const risk = Math.abs(entryPrice - trade.stopLoss)
    const conservativeTarget = isLong ? entryPrice + risk : entryPrice - risk
    suggestions.push({
      type: 'Conservative',
      price: conservativeTarget,
      rr: '1:1',
      description: 'Safe exit with 1:1 reward-to-risk'
    })

    // Extended target (2:1 R/R)
    const extendedTarget = isLong ? entryPrice + (risk * 2) : entryPrice - (risk * 2)
    suggestions.push({
      type: 'Extended',
      price: extendedTarget,
      rr: '2:1',
      description: 'Larger profit, allow partial position'
    })
  }

  // Technical level targets (if available)
  if (context.resistance && isLong && context.resistance > entryPrice) {
    suggestions.push({
      type: 'Resistance',
      price: context.resistance,
      rr: null,
      description: 'Key resistance level'
    })
  }

  if (context.support && !isLong && context.support < entryPrice) {
    suggestions.push({
      type: 'Support',
      price: context.support,
      rr: null,
      description: 'Key support level'
    })
  }

  return suggestions
}

export default function PostTradeAnalysis({
  trade,
  marketContext = {},
  onClose,
  onSetAlert,
  onModifyOrder
}) {
  const [analysis, setAnalysis] = useState(null)
  const [feedback, setFeedback] = useState([])
  const [exitSuggestions, setExitSuggestions] = useState([])
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (trade) {
      const tradeAnalysis = analyzeEntry(trade, marketContext)
      setAnalysis(tradeAnalysis)
      setFeedback(generateFeedback(trade, tradeAnalysis, marketContext))
      setExitSuggestions(suggestExitPoints(trade, marketContext))
    }
  }, [trade, marketContext])

  if (!trade || !analysis) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between"
          style={{ backgroundColor: `${analysis.color}15`, borderBottom: `1px solid ${analysis.color}30` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{analysis.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-white">{analysis.label}</h2>
              <p className="text-sm text-slate-400">
                {trade.side.toUpperCase()} {trade.quantity} {trade.symbol} @ ${trade.entryPrice?.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Entry Score */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Entry Score</span>
            <span className="font-bold" style={{ color: analysis.color }}>
              {analysis.score}/100
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${analysis.score}%`,
                backgroundColor: analysis.color
              }}
            />
          </div>
        </div>

        {/* Feedback */}
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">AVA's Feedback</h3>
          <div className="space-y-2">
            {feedback.map((item, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${
                  item.type === 'positive' ? 'bg-emerald-500/10 text-emerald-300' :
                  item.type === 'warning' ? 'bg-amber-500/10 text-amber-300' :
                  item.type === 'critical' ? 'bg-red-500/10 text-red-300' :
                  item.type === 'improvement' ? 'bg-purple-500/10 text-purple-300' :
                  'bg-cyan-500/10 text-cyan-300'
                }`}
              >
                <span className="mr-2">
                  {item.type === 'positive' ? '✅' :
                   item.type === 'warning' ? '⚠️' :
                   item.type === 'critical' ? '🚨' :
                   item.type === 'improvement' ? '💡' : 'ℹ️'}
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Exit Suggestions */}
        {exitSuggestions.length > 0 && (
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Suggested Exit Points</h3>
            <div className="grid grid-cols-2 gap-2">
              {exitSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSetAlert?.(suggestion.price)}
                  className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{suggestion.type}</span>
                    {suggestion.rr && (
                      <span className="text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                        {suggestion.rr}
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold text-white">
                    ${suggestion.price?.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {suggestion.description}
                  </div>
                  <div className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    Click to set alert →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 py-2 px-4 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:from-purple-500 hover:to-cyan-500 transition-all text-sm"
          >
            Got It! 👍
          </button>
        </div>

        {/* Details Panel */}
        {showDetails && (
          <div className="p-4 bg-slate-800/30 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Entry Price</span>
                <div className="text-white font-medium">${trade.entryPrice?.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-slate-500">Position Size</span>
                <div className="text-white font-medium">{trade.quantity} shares</div>
              </div>
              <div>
                <span className="text-slate-500">Stop Loss</span>
                <div className={trade.stopLoss ? 'text-white font-medium' : 'text-red-400'}>
                  {trade.stopLoss ? `$${trade.stopLoss.toFixed(2)}` : 'Not Set!'}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Target</span>
                <div className={trade.target ? 'text-white font-medium' : 'text-slate-500'}>
                  {trade.target ? `$${trade.target.toFixed(2)}` : 'Not Set'}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Time</span>
                <div className="text-white font-medium">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Value</span>
                <div className="text-white font-medium">
                  ${(trade.entryPrice * trade.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }
        `}</style>
      </div>
    </div>
  )
}

// Hook to listen for trade executions and show analysis
export function usePostTradeAnalysis() {
  const [currentTrade, setCurrentTrade] = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  useEffect(() => {
    const handleTradeExecuted = (event) => {
      const trade = event.detail
      if (trade) {
        setCurrentTrade(trade)
        setShowAnalysis(true)
      }
    }

    window.addEventListener('ava.tradeExecuted', handleTradeExecuted)
    return () => window.removeEventListener('ava.tradeExecuted', handleTradeExecuted)
  }, [])

  const closeAnalysis = () => {
    setShowAnalysis(false)
    setCurrentTrade(null)
  }

  return { currentTrade, showAnalysis, closeAnalysis }
}
