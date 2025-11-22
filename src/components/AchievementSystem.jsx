/**
 * Ultra Elite++ Achievement System
 * Gamification engine to boost engagement and track trading milestones
 */

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Star, Zap, Target, TrendingUp, Award, Medal, Crown } from 'lucide-react'

// Achievement definitions
const ACHIEVEMENTS = {
  // Trading Milestones
  'first-trade': {
    id: 'first-trade',
    name: 'First Steps',
    description: 'Execute your first trade',
    icon: '🎯',
    points: 10,
    rarity: 'common'
  },
  'profitable-week': {
    id: 'profitable-week',
    name: 'Green Week',
    description: 'End a week with positive returns',
    icon: '📈',
    points: 50,
    rarity: 'uncommon'
  },
  'streak-master': {
    id: 'streak-master',
    name: 'Streak Master',
    description: '5 winning trades in a row',
    icon: '🔥',
    points: 100,
    rarity: 'rare'
  },
  'risk-manager': {
    id: 'risk-manager',
    name: 'Risk Manager',
    description: 'Use stop-loss on 10 consecutive trades',
    icon: '🛡️',
    points: 75,
    rarity: 'uncommon'
  },
  'diversified': {
    id: 'diversified',
    name: 'Diversified',
    description: 'Trade 10 different symbols',
    icon: '🌐',
    points: 40,
    rarity: 'common'
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Execute trades in extended hours',
    icon: '🦉',
    points: 30,
    rarity: 'uncommon'
  },
  'unicorn-hunter': {
    id: 'unicorn-hunter',
    name: 'Unicorn Hunter',
    description: 'Find and trade a signal with 90+ Unicorn Score',
    icon: '🦄',
    points: 150,
    rarity: 'legendary'
  },
  'ai-whisperer': {
    id: 'ai-whisperer',
    name: 'AI Whisperer',
    description: 'Follow 10 AI recommendations successfully',
    icon: '🤖',
    points: 80,
    rarity: 'rare'
  },
  'diamond-hands': {
    id: 'diamond-hands',
    name: 'Diamond Hands',
    description: 'Hold a winning position for 30+ days',
    icon: '💎',
    points: 120,
    rarity: 'epic'
  },
  'whale-watcher': {
    id: 'whale-watcher',
    name: 'Whale Watcher',
    description: 'Identify and profit from institutional flow',
    icon: '🐋',
    points: 200,
    rarity: 'legendary'
  },

  // Learning & Analysis
  'chart-scholar': {
    id: 'chart-scholar',
    name: 'Chart Scholar',
    description: 'Analyze 100 charts',
    icon: '📊',
    points: 60,
    rarity: 'uncommon'
  },
  'pattern-master': {
    id: 'pattern-master',
    name: 'Pattern Master',
    description: 'Identify 5 different chart patterns',
    icon: '📐',
    points: 90,
    rarity: 'rare'
  },
  'journal-keeper': {
    id: 'journal-keeper',
    name: 'Journal Keeper',
    description: 'Log 20 trades in your journal',
    icon: '📝',
    points: 50,
    rarity: 'uncommon'
  },

  // Social & Copy Trading
  'copy-cat': {
    id: 'copy-cat',
    name: 'Copy Cat',
    description: 'Successfully copy 5 trades',
    icon: '🐱',
    points: 70,
    rarity: 'uncommon'
  },
  'strategy-leader': {
    id: 'strategy-leader',
    name: 'Strategy Leader',
    description: 'Have 10 followers copy your trades',
    icon: '👑',
    points: 250,
    rarity: 'legendary'
  },
  'social-butterfly': {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Join 3 trading rooms',
    icon: '🦋',
    points: 30,
    rarity: 'common'
  },

  // Special Events
  'early-bird': {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Trade within first hour of market open',
    icon: '🐦',
    points: 20,
    rarity: 'common'
  },
  'volatility-surfer': {
    id: 'volatility-surfer',
    name: 'Volatility Surfer',
    description: 'Profit during high VIX (>30)',
    icon: '🏄',
    points: 100,
    rarity: 'epic'
  },
  'earnings-player': {
    id: 'earnings-player',
    name: 'Earnings Player',
    description: 'Trade successfully around earnings',
    icon: '💰',
    points: 80,
    rarity: 'rare'
  },
  'options-genius': {
    id: 'options-genius',
    name: 'Options Genius',
    description: 'Execute a multi-leg options strategy',
    icon: '🧠',
    points: 150,
    rarity: 'epic'
  }
}

// Rarity colors and labels
const RARITY_CONFIG = {
  common: { color: 'text-gray-400', bg: 'bg-gray-900/50', label: 'Common' },
  uncommon: { color: 'text-green-400', bg: 'bg-green-900/50', label: 'Uncommon' },
  rare: { color: 'text-blue-400', bg: 'bg-blue-900/50', label: 'Rare' },
  epic: { color: 'text-purple-400', bg: 'bg-purple-900/50', label: 'Epic' },
  legendary: { color: 'text-yellow-400', bg: 'bg-yellow-900/50', label: 'Legendary' }
}

// Level thresholds
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000
]

export default function AchievementSystem() {
  const [unlockedAchievements, setUnlockedAchievements] = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [levelProgress, setLevelProgress] = useState(0)
  const [recentUnlock, setRecentUnlock] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showNotification, setShowNotification] = useState(false)

  // Load achievements from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('iava_achievements')
    if (saved) {
      const data = JSON.parse(saved)
      setUnlockedAchievements(data.unlocked || [])
      setTotalPoints(data.totalPoints || 0)
    }

    // Listen for achievement events
    window.addEventListener('iava.achievement', handleAchievementUnlock)
    return () => window.removeEventListener('iava.achievement', handleAchievementUnlock)
  }, [])

  // Calculate level from points
  useEffect(() => {
    let currentLevel = 1
    let progress = 0

    for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
      if (totalPoints >= LEVEL_THRESHOLDS[i]) {
        currentLevel = i + 1
        if (i < LEVEL_THRESHOLDS.length - 1) {
          const levelStart = LEVEL_THRESHOLDS[i]
          const levelEnd = LEVEL_THRESHOLDS[i + 1]
          progress = ((totalPoints - levelStart) / (levelEnd - levelStart)) * 100
        }
      }
    }

    setLevel(currentLevel)
    setLevelProgress(progress)
  }, [totalPoints])

  // Handle achievement unlock
  const handleAchievementUnlock = useCallback((event) => {
    const { achievementId } = event.detail
    const achievement = ACHIEVEMENTS[achievementId]

    if (!achievement || unlockedAchievements.includes(achievementId)) return

    // Add to unlocked
    const newUnlocked = [...unlockedAchievements, achievementId]
    const newPoints = totalPoints + achievement.points

    setUnlockedAchievements(newUnlocked)
    setTotalPoints(newPoints)
    setRecentUnlock(achievement)
    setShowNotification(true)

    // Save to localStorage
    localStorage.setItem('iava_achievements', JSON.stringify({
      unlocked: newUnlocked,
      totalPoints: newPoints,
      lastUnlock: new Date().toISOString()
    }))

    // Hide notification after 5 seconds
    setTimeout(() => {
      setShowNotification(false)
      setRecentUnlock(null)
    }, 5000)

    // Play sound effect
    playAchievementSound()
  }, [unlockedAchievements, totalPoints])

  // Play achievement sound
  const playAchievementSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLaiTcIG2m98OScTgwMUKzn7bFlHgU3jM3w2IgyCB5QqeXsvGkfBjaP0vDTgjMIF1+z6ey=')
    audio.volume = 0.3
    audio.play().catch(() => {})
  }

  // Filter achievements by category
  const getFilteredAchievements = () => {
    const allAchievements = Object.values(ACHIEVEMENTS)

    if (selectedCategory === 'all') return allAchievements
    if (selectedCategory === 'unlocked') {
      return allAchievements.filter(a => unlockedAchievements.includes(a.id))
    }
    if (selectedCategory === 'locked') {
      return allAchievements.filter(a => !unlockedAchievements.includes(a.id))
    }

    // Filter by rarity
    return allAchievements.filter(a => a.rarity === selectedCategory)
  }

  // Calculate statistics
  const stats = {
    unlocked: unlockedAchievements.length,
    total: Object.keys(ACHIEVEMENTS).length,
    percentage: Math.round((unlockedAchievements.length / Object.keys(ACHIEVEMENTS).length) * 100),
    byRarity: Object.keys(RARITY_CONFIG).reduce((acc, rarity) => {
      const total = Object.values(ACHIEVEMENTS).filter(a => a.rarity === rarity).length
      const unlocked = Object.values(ACHIEVEMENTS).filter(a =>
        a.rarity === rarity && unlockedAchievements.includes(a.id)
      ).length
      acc[rarity] = { unlocked, total }
      return acc
    }, {})
  }

  return (
    <div className="relative">
      {/* Achievement Notification */}
      {showNotification && recentUnlock && (
        <div className="fixed top-20 right-4 z-50 animate-slideIn">
          <div className={`${RARITY_CONFIG[recentUnlock.rarity].bg} backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-2xl`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{recentUnlock.icon}</div>
              <div>
                <div className="text-sm text-gray-400">Achievement Unlocked!</div>
                <div className={`font-bold ${RARITY_CONFIG[recentUnlock.rarity].color}`}>
                  {recentUnlock.name}
                </div>
                <div className="text-xs text-gray-500">{recentUnlock.description}</div>
                <div className="text-xs text-yellow-400 mt-1">+{recentUnlock.points} XP</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Achievement Panel */}
      <div className="bg-gray-900/50 rounded-lg p-6">
        {/* Header with Level Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold">Achievement System</h2>
            </div>
            <div className="text-sm text-gray-400">
              {stats.unlocked} / {stats.total} Unlocked ({stats.percentage}%)
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Level {level}</span>
              <span className="text-sm text-gray-400">
                {totalPoints} / {LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)]} XP
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded text-xs ${
              selectedCategory === 'all' ? 'bg-blue-500' : 'bg-gray-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedCategory('unlocked')}
            className={`px-3 py-1 rounded text-xs ${
              selectedCategory === 'unlocked' ? 'bg-green-500' : 'bg-gray-800'
            }`}
          >
            Unlocked
          </button>
          <button
            onClick={() => setSelectedCategory('locked')}
            className={`px-3 py-1 rounded text-xs ${
              selectedCategory === 'locked' ? 'bg-gray-700' : 'bg-gray-800'
            }`}
          >
            Locked
          </button>
          {Object.keys(RARITY_CONFIG).map(rarity => (
            <button
              key={rarity}
              onClick={() => setSelectedCategory(rarity)}
              className={`px-3 py-1 rounded text-xs ${
                selectedCategory === rarity ? RARITY_CONFIG[rarity].bg : 'bg-gray-800'
              } ${RARITY_CONFIG[rarity].color}`}
            >
              {RARITY_CONFIG[rarity].label} ({stats.byRarity[rarity].unlocked}/{stats.byRarity[rarity].total})
            </button>
          ))}
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {getFilteredAchievements().slice(0, showAll ? undefined : 9).map(achievement => {
            const isUnlocked = unlockedAchievements.includes(achievement.id)
            const rarityConfig = RARITY_CONFIG[achievement.rarity]

            return (
              <div
                key={achievement.id}
                className={`
                  ${rarityConfig.bg} rounded-lg p-3 border transition-all duration-300
                  ${isUnlocked ?
                    `border-white/20 ${rarityConfig.color}` :
                    'border-white/5 opacity-50 grayscale'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{achievement.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{achievement.description}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${rarityConfig.color}`}>
                        {rarityConfig.label}
                      </span>
                      <span className="text-xs text-yellow-400">
                        {achievement.points} XP
                      </span>
                    </div>
                  </div>
                  {isUnlocked && (
                    <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Show More/Less Button */}
        {getFilteredAchievements().length > 9 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-sm"
          >
            {showAll ? 'Show Less' : `Show ${getFilteredAchievements().length - 9} More`}
          </button>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <Medal className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <div className="text-lg font-bold">{stats.unlocked}</div>
            <div className="text-xs text-gray-400">Achievements</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <div className="text-lg font-bold">{totalPoints}</div>
            <div className="text-xs text-gray-400">Total XP</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <Crown className="w-5 h-5 mx-auto mb-1 text-purple-400" />
            <div className="text-lg font-bold">Level {level}</div>
            <div className="text-xs text-gray-400">Current Rank</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export achievement trigger function for use in other components
export function unlockAchievement(achievementId) {
  window.dispatchEvent(new CustomEvent('iava.achievement', {
    detail: { achievementId }
  }))
}