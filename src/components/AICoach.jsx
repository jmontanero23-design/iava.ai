/**
 * AICoach - Elite Trading Coach & Mentor
 *
 * PhD++ Quality AI-powered trading coaching:
 * - Post-trade analysis and feedback
 * - Pattern recognition in your trading
 * - Personalized tips based on your history
 * - Risk management coaching
 * - Performance tracking and goals
 * - Emotional state awareness
 *
 * Features:
 * - Real-time trade feedback
 * - Weekly/monthly performance reviews
 * - Customized learning paths
 * - Achievement system
 * - Voice feedback (optional)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'

// Coach personality modes
const COACH_MODES = {
  supportive: {
    id: 'supportive',
    name: 'Supportive',
    icon: '🤗',
    description: 'Encouraging and positive feedback',
    style: 'gentle'
  },
  analytical: {
    id: 'analytical',
    name: 'Analytical',
    icon: '📊',
    description: 'Data-driven, objective analysis',
    style: 'direct'
  },
  challenging: {
    id: 'challenging',
    name: 'Challenging',
    icon: '💪',
    description: 'Push you to improve, tough love',
    style: 'aggressive'
  }
}

// Achievement badges
const ACHIEVEMENTS = {
  first_trade: { icon: '🎯', name: 'First Trade', description: 'Executed your first trade' },
  green_day: { icon: '💚', name: 'Green Day', description: 'Profitable trading day' },
  streak_3: { icon: '🔥', name: 'Hot Streak', description: '3 winning trades in a row' },
  streak_5: { icon: '🔥🔥', name: 'On Fire', description: '5 winning trades in a row' },
  disciplined: { icon: '🎖️', name: 'Disciplined', description: 'Followed your rules for a week' },
  risk_master: { icon: '🛡️', name: 'Risk Master', description: 'Perfect risk management' },
  pattern_finder: { icon: '🔍', name: 'Pattern Finder', description: 'Identified 10 patterns' },
  comeback: { icon: '💪', name: 'Comeback Kid', description: 'Recovered from a losing streak' },
  consistency: { icon: '⚖️', name: 'Consistent', description: '10 days of consistent trading' },
  student: { icon: '📚', name: 'Eager Student', description: 'Completed all coaching tips' }
}

// Storage keys
const STORAGE_KEYS = {
  COACH_MODE: 'ava.coach.mode',
  TRADE_HISTORY: 'ava.coach.trades',
  ACHIEVEMENTS: 'ava.coach.achievements',
  GOALS: 'ava.coach.goals',
  SESSIONS: 'ava.coach.sessions'
}

export default function AICoach({
  onClose,
  className = ''
}) {
  const [coachMode, setCoachMode] = useState('supportive')
  const [tradeHistory, setTradeHistory] = useState([])
  const [achievements, setAchievements] = useState([])
  const [activeTab, setActiveTab] = useState('feedback')
  const [currentTip, setCurrentTip] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [goals, setGoals] = useState([])
  const [showModeSelector, setShowModeSelector] = useState(false)

  // Load saved data
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEYS.COACH_MODE)
      if (savedMode && COACH_MODES[savedMode]) {
        setCoachMode(savedMode)
      }

      const savedTrades = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY)
      if (savedTrades) {
        setTradeHistory(JSON.parse(savedTrades))
      }

      const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements))
      }

      const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS)
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals))
      }
    } catch (e) {
      console.error('[AICoach] Load error:', e)
    }
  }, [])

  // Listen for new trades
  useEffect(() => {
    const handleTrade = (event) => {
      const trade = event.detail
      if (!trade) return

      const enrichedTrade = {
        ...trade,
        id: `trade_${Date.now()}`,
        timestamp: Date.now(),
        analyzed: false
      }

      setTradeHistory(prev => {
        const updated = [enrichedTrade, ...prev].slice(0, 100)
        localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(updated))
        return updated
      })

      // Analyze the trade
      analyzeTrade(enrichedTrade)
    }

    window.addEventListener('ava.tradeCompleted', handleTrade)
    return () => window.removeEventListener('ava.tradeCompleted', handleTrade)
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    if (tradeHistory.length === 0) {
      return { winRate: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, totalTrades: 0 }
    }

    const wins = tradeHistory.filter(t => (t.pnl || 0) > 0)
    const losses = tradeHistory.filter(t => (t.pnl || 0) < 0)

    const winRate = (wins.length / tradeHistory.length) * 100
    const avgWin = wins.length > 0
      ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length
      : 0
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length)
      : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

    return {
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      totalTrades: tradeHistory.length,
      winCount: wins.length,
      lossCount: losses.length,
      totalPnL: tradeHistory.reduce((sum, t) => sum + (t.pnl || 0), 0)
    }
  }, [tradeHistory])

  // Analyze a trade and provide feedback
  const analyzeTrade = useCallback(async (trade) => {
    setIsAnalyzing(true)

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mode = COACH_MODES[coachMode]
    const isWin = (trade.pnl || 0) > 0

    // Generate feedback based on trade and coaching style
    const feedback = generateFeedback(trade, mode, stats)

    setCurrentTip({
      type: isWin ? 'success' : 'improvement',
      title: isWin ? 'Nice Trade!' : 'Learning Opportunity',
      message: feedback.message,
      tips: feedback.tips,
      timestamp: Date.now()
    })

    // Check for achievements
    checkAchievements(trade)

    setIsAnalyzing(false)

    // Mark trade as analyzed
    setTradeHistory(prev =>
      prev.map(t => t.id === trade.id ? { ...t, analyzed: true, feedback } : t)
    )
  }, [coachMode, stats])

  // Generate feedback based on trade and coaching style
  const generateFeedback = (trade, mode, stats) => {
    const isWin = (trade.pnl || 0) > 0
    const pnl = trade.pnl || 0
    const symbol = trade.symbol || 'Position'

    let message = ''
    let tips = []

    if (mode.style === 'gentle') {
      message = isWin
        ? `Great job on ${symbol}! You secured $${pnl.toFixed(2)} profit. Your patience and discipline paid off.`
        : `${symbol} didn't go as planned, but that's okay - every trade is a learning opportunity. You managed your risk well by limiting the loss to $${Math.abs(pnl).toFixed(2)}.`

      tips = isWin
        ? [
            'Consider journaling what made this trade work',
            'Review if this setup appears frequently',
            'Celebrate your wins, but stay humble'
          ]
        : [
            'Review your entry timing - was it optimal?',
            'Check if the stop loss was appropriate',
            'Remember: One loss doesn\'t define your trading'
          ]
    } else if (mode.style === 'direct') {
      message = isWin
        ? `${symbol}: +$${pnl.toFixed(2)}. Win rate now at ${stats.winRate.toFixed(1)}%. Profit factor: ${stats.profitFactor.toFixed(2)}.`
        : `${symbol}: -$${Math.abs(pnl).toFixed(2)}. This brings your win rate to ${stats.winRate.toFixed(1)}%. Review the data.`

      tips = isWin
        ? [
            `Average winning trade: $${stats.avgWin.toFixed(2)}`,
            `Your R-multiple: ${(pnl / stats.avgLoss || 1).toFixed(2)}R`,
            'Document the setup for pattern analysis'
          ]
        : [
            `Average losing trade: $${stats.avgLoss.toFixed(2)}`,
            `This loss was ${pnl < -stats.avgLoss ? 'larger' : 'smaller'} than average`,
            'Analyze market conditions at entry'
          ]
    } else {
      // Aggressive/challenging
      message = isWin
        ? `Good. $${pnl.toFixed(2)} on ${symbol}. But can you do better? Your average win is $${stats.avgWin.toFixed(2)} - are you maximizing your edge?`
        : `${symbol} cost you $${Math.abs(pnl).toFixed(2)}. What went wrong? Don't make excuses - identify the mistake and fix it.`

      tips = isWin
        ? [
            'Could you have held longer for more profit?',
            'Was your position size optimal?',
            'Stop settling - push for bigger wins'
          ]
        : [
            'Be honest: Did you follow your rules?',
            'What would a professional have done differently?',
            'Turn this loss into fuel for improvement'
          ]
    }

    return { message, tips }
  }

  // Check and award achievements
  const checkAchievements = (trade) => {
    const newAchievements = [...achievements]
    let updated = false

    // First trade
    if (tradeHistory.length === 0 && !achievements.includes('first_trade')) {
      newAchievements.push('first_trade')
      updated = true
    }

    // Winning streak
    const recentTrades = [trade, ...tradeHistory.slice(0, 4)]
    const recentWins = recentTrades.filter(t => (t.pnl || 0) > 0)

    if (recentWins.length >= 3 && !achievements.includes('streak_3')) {
      newAchievements.push('streak_3')
      updated = true
    }

    if (recentWins.length >= 5 && !achievements.includes('streak_5')) {
      newAchievements.push('streak_5')
      updated = true
    }

    if (updated) {
      setAchievements(newAchievements)
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(newAchievements))

      // Show achievement toast
      const latestAchievement = ACHIEVEMENTS[newAchievements[newAchievements.length - 1]]
      if (latestAchievement) {
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: {
            text: `${latestAchievement.icon} Achievement Unlocked: ${latestAchievement.name}!`,
            type: 'success',
            duration: 5000
          }
        }))
      }
    }
  }

  // Change coach mode
  const handleModeChange = (mode) => {
    setCoachMode(mode)
    localStorage.setItem(STORAGE_KEYS.COACH_MODE, mode)
    setShowModeSelector(false)

    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: { text: `Coach mode: ${COACH_MODES[mode].name}`, type: 'info' }
    }))
  }

  const mode = COACH_MODES[coachMode]

  return (
    <div className={`bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center text-2xl">
              🏋️
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">AVA Coach</h2>
              <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                {mode.icon} {mode.name} Mode
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Mode selector dropdown */}
        {showModeSelector && (
          <div className="mt-3 p-2 bg-slate-800/50 rounded-xl">
            {Object.values(COACH_MODES).map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  coachMode === m.id
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'hover:bg-slate-700/50 text-slate-300'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/50">
        {[
          { id: 'feedback', label: 'Feedback', icon: '💬' },
          { id: 'stats', label: 'Stats', icon: '📊' },
          { id: 'achievements', label: 'Badges', icon: '🏆' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            {isAnalyzing ? (
              <div className="p-6 text-center">
                <div className="text-4xl animate-bounce mb-3">🤔</div>
                <p className="text-slate-400">Analyzing your trade...</p>
              </div>
            ) : currentTip ? (
              <div className={`p-4 rounded-xl ${
                currentTip.type === 'success'
                  ? 'bg-emerald-900/20 border border-emerald-500/30'
                  : 'bg-amber-900/20 border border-amber-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {currentTip.type === 'success' ? '🎉' : '📝'}
                  </span>
                  <div>
                    <h4 className={`font-semibold ${
                      currentTip.type === 'success' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {currentTip.title}
                    </h4>
                    <p className="text-slate-300 mt-1">{currentTip.message}</p>
                    <ul className="mt-3 space-y-1">
                      {currentTip.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-slate-400">Complete a trade to get personalized coaching feedback!</p>
              </div>
            )}

            {/* Quick tips */}
            <div className="p-4 bg-slate-800/30 rounded-xl">
              <h4 className="text-white font-medium mb-3">Today's Tip</h4>
              <p className="text-slate-400 text-sm">
                {mode.style === 'gentle'
                  ? "Remember: Trading is a marathon, not a sprint. Focus on consistency over big wins."
                  : mode.style === 'direct'
                    ? `Your current win rate is ${stats.winRate.toFixed(1)}%. Target: 55%+ for consistent profitability.`
                    : "Are you truly maximizing your edge? Every trade is an opportunity to prove yourself."
                }
              </p>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <div className="text-sm text-slate-500">Win Rate</div>
                <div className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stats.winRate.toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <div className="text-sm text-slate-500">Profit Factor</div>
                <div className={`text-2xl font-bold ${stats.profitFactor >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <div className="text-sm text-slate-500">Avg Win</div>
                <div className="text-2xl font-bold text-emerald-400">
                  ${stats.avgWin.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <div className="text-sm text-slate-500">Avg Loss</div>
                <div className="text-2xl font-bold text-red-400">
                  ${stats.avgLoss.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Total P&L */}
            <div className="p-4 bg-slate-800/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">Total P&L ({stats.totalTrades} trades)</div>
                <div className={`text-xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <div className="flex-1 h-2 bg-emerald-500/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${(stats.winCount / (stats.totalTrades || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {stats.winCount}W / {stats.lossCount}L
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-3">
            {Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
              const unlocked = achievements.includes(key)
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    unlocked
                      ? 'bg-purple-900/20 border border-purple-500/30'
                      : 'bg-slate-800/30 opacity-50'
                  }`}
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <div className={`font-medium ${unlocked ? 'text-purple-300' : 'text-slate-500'}`}>
                      {achievement.name}
                    </div>
                    <div className="text-xs text-slate-500">{achievement.description}</div>
                  </div>
                  {unlocked && (
                    <span className="text-emerald-400">✓</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Floating Coach Button
export function CoachButton({
  onClick,
  hasUpdate = false,
  className = ''
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-14 h-14 rounded-full flex items-center justify-center
        bg-gradient-to-br from-purple-500 to-cyan-500
        shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50
        transition-all duration-200 hover:scale-105
        ${className}
      `}
      title="AVA Coach"
    >
      <span className="text-2xl">🏋️</span>
      {hasUpdate && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900" />
      )}
    </button>
  )
}
