/**
 * Skill Progression System - Gamified Trading Improvement
 *
 * PhD++ Quality leveling system:
 * - XP from trades and learning
 * - Skill trees (Technical, Risk, Psychology, Speed)
 * - Achievements and badges
 * - Daily/Weekly challenges
 * - Leaderboard ranking
 */

const STORAGE_KEY = 'ava.skill.progression'

// Skill categories
export const SKILL_TREES = {
  TECHNICAL: {
    id: 'technical',
    name: 'Technical Analysis',
    icon: '📊',
    color: '#06B6D4',
    description: 'Chart reading, patterns, indicators'
  },
  RISK: {
    id: 'risk',
    name: 'Risk Management',
    icon: '🛡️',
    color: '#10B981',
    description: 'Position sizing, stop losses, portfolio management'
  },
  PSYCHOLOGY: {
    id: 'psychology',
    name: 'Trading Psychology',
    icon: '🧠',
    color: '#8B5CF6',
    description: 'Discipline, patience, emotional control'
  },
  SPEED: {
    id: 'speed',
    name: 'Execution Speed',
    icon: '⚡',
    color: '#F59E0B',
    description: 'Quick decisions, timing, market reading'
  }
}

// Level thresholds
const LEVEL_XP = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  1750,   // Level 6
  2750,   // Level 7
  4000,   // Level 8
  5500,   // Level 9
  7500,   // Level 10
  10000,  // Level 11
  13000,  // Level 12
  17000,  // Level 13
  22000,  // Level 14
  28000,  // Level 15 (Master)
  35000,  // Level 16
  45000,  // Level 17
  60000,  // Level 18
  80000,  // Level 19
  100000  // Level 20 (Legend)
]

// Rank titles
const RANK_TITLES = [
  'Novice Trader',      // 1-2
  'Apprentice',         // 3-4
  'Junior Trader',      // 5-6
  'Trader',             // 7-8
  'Senior Trader',      // 9-10
  'Expert Trader',      // 11-12
  'Master Trader',      // 13-14
  'Elite Trader',       // 15-16
  'Legendary Trader',   // 17-18
  'Trading Deity'       // 19-20
]

// Achievements
export const ACHIEVEMENTS = {
  // Trading achievements
  FIRST_TRADE: { id: 'first_trade', name: 'First Steps', description: 'Complete your first trade', icon: '🎯', xp: 50 },
  TEN_TRADES: { id: 'ten_trades', name: 'Getting Started', description: 'Complete 10 trades', icon: '📈', xp: 100 },
  FIFTY_TRADES: { id: 'fifty_trades', name: 'Experienced', description: 'Complete 50 trades', icon: '💪', xp: 250 },
  HUNDRED_TRADES: { id: 'hundred_trades', name: 'Centurion', description: 'Complete 100 trades', icon: '🏆', xp: 500 },

  // Win streak achievements
  THREE_STREAK: { id: 'three_streak', name: 'Hat Trick', description: 'Win 3 trades in a row', icon: '🎩', xp: 75 },
  FIVE_STREAK: { id: 'five_streak', name: 'Hot Streak', description: 'Win 5 trades in a row', icon: '🔥', xp: 150 },
  TEN_STREAK: { id: 'ten_streak', name: 'Unstoppable', description: 'Win 10 trades in a row', icon: '⚡', xp: 500 },

  // Risk management achievements
  ALWAYS_STOPS: { id: 'always_stops', name: 'Risk Manager', description: 'Use stop losses on 20 consecutive trades', icon: '🛡️', xp: 200 },
  SMALL_LOSSES: { id: 'small_losses', name: 'Cut It Short', description: 'Keep 10 losses under 1%', icon: '✂️', xp: 150 },
  PERFECT_RR: { id: 'perfect_rr', name: 'Risk/Reward Pro', description: 'Maintain 2:1 R/R on 10 trades', icon: '⚖️', xp: 300 },

  // Psychology achievements
  PATIENCE: { id: 'patience', name: 'Patient Trader', description: 'Wait at least 1 hour between trades for a week', icon: '🧘', xp: 200 },
  NO_REVENGE: { id: 'no_revenge', name: 'Cool Headed', description: 'No revenge trades for 20 consecutive trades', icon: '❄️', xp: 250 },
  CONSISTENT: { id: 'consistent', name: 'Consistent', description: 'Trade the same strategy for 30 days', icon: '📋', xp: 400 },

  // Learning achievements
  FIRST_ANALYSIS: { id: 'first_analysis', name: 'Student', description: 'Use AVA analysis 10 times', icon: '📚', xp: 50 },
  FORECAST_USER: { id: 'forecast_user', name: 'Fortune Teller', description: 'Check Chronos forecast 50 times', icon: '🔮', xp: 150 },
  COACH_LISTENER: { id: 'coach_listener', name: 'Coachable', description: 'Review AI Coach feedback 20 times', icon: '🎓', xp: 200 },

  // Special achievements
  GREEN_WEEK: { id: 'green_week', name: 'Green Week', description: 'Profitable every day for a week', icon: '💚', xp: 500 },
  GREEN_MONTH: { id: 'green_month', name: 'Green Month', description: 'Profitable every week for a month', icon: '💎', xp: 1000 },
  COMEBACK: { id: 'comeback', name: 'Phoenix', description: 'Recover from a 5-trade losing streak to profit', icon: '🦅', xp: 300 }
}

// Daily challenges
export const DAILY_CHALLENGES = [
  { id: 'win_rate_60', name: 'Sharp Shooter', description: 'Achieve 60%+ win rate today', xp: 50, requirement: { type: 'win_rate', value: 60 } },
  { id: 'three_wins', name: 'Triple Threat', description: 'Win 3 trades today', xp: 30, requirement: { type: 'wins', value: 3 } },
  { id: 'use_stops', name: 'Protected', description: 'Use stop losses on all trades today', xp: 25, requirement: { type: 'stop_usage', value: 100 } },
  { id: 'max_trades_5', name: 'Quality Focus', description: 'Make no more than 5 trades today', xp: 40, requirement: { type: 'max_trades', value: 5 } },
  { id: 'check_forecast', name: 'Forward Looking', description: 'Check Chronos forecast before trading', xp: 20, requirement: { type: 'forecast_check', value: 1 } },
  { id: 'review_trades', name: 'Reflective', description: 'Review yesterday\'s trades', xp: 25, requirement: { type: 'review', value: 1 } }
]

/**
 * Load user progression
 */
function loadProgression() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) {}

  return {
    totalXP: 0,
    level: 1,
    skills: {
      technical: 0,
      risk: 0,
      psychology: 0,
      speed: 0
    },
    achievements: [],
    dailyChallenges: [],
    dailyChallengeDate: null,
    stats: {
      totalTrades: 0,
      wins: 0,
      currentStreak: 0,
      bestStreak: 0,
      tradesWithStops: 0,
      consecutiveStops: 0
    },
    history: []
  }
}

/**
 * Save progression
 */
function saveProgression(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Calculate level from XP
 */
function calculateLevel(xp) {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) return i + 1
  }
  return 1
}

/**
 * Get rank title
 */
function getRankTitle(level) {
  const index = Math.min(Math.floor((level - 1) / 2), RANK_TITLES.length - 1)
  return RANK_TITLES[index]
}

/**
 * Award XP
 */
export function awardXP(amount, category = 'general', reason = '') {
  const data = loadProgression()
  const oldLevel = data.level

  data.totalXP += amount
  data.level = calculateLevel(data.totalXP)

  // Add to skill category if specified
  if (category && data.skills[category] !== undefined) {
    data.skills[category] += amount
  }

  // Record in history
  data.history.unshift({
    type: 'xp',
    amount,
    category,
    reason,
    timestamp: Date.now()
  })

  // Keep history limited
  data.history = data.history.slice(0, 100)

  saveProgression(data)

  // Check for level up
  if (data.level > oldLevel) {
    window.dispatchEvent(new CustomEvent('ava.levelUp', {
      detail: { oldLevel, newLevel: data.level, title: getRankTitle(data.level) }
    }))
  }

  return { xpGained: amount, totalXP: data.totalXP, level: data.level }
}

/**
 * Record trade for progression
 */
export function recordTradeForXP(trade) {
  const data = loadProgression()

  data.stats.totalTrades++

  const isWin = trade.exitPrice > trade.entryPrice
  if (isWin) {
    data.stats.wins++
    data.stats.currentStreak++
    data.stats.bestStreak = Math.max(data.stats.bestStreak, data.stats.currentStreak)
  } else {
    data.stats.currentStreak = 0
  }

  if (trade.stopLoss) {
    data.stats.tradesWithStops++
    data.stats.consecutiveStops++
  } else {
    data.stats.consecutiveStops = 0
  }

  saveProgression(data)

  // Base XP for completing a trade
  let xp = 10
  let category = 'technical'

  // Bonus for winning
  if (isWin) {
    xp += 15
  }

  // Bonus for using stop loss
  if (trade.stopLoss) {
    xp += 5
    category = 'risk'
  }

  // Bonus for streak
  if (data.stats.currentStreak >= 3) {
    xp += data.stats.currentStreak * 2
    category = 'psychology'
  }

  awardXP(xp, category, `Trade: ${trade.symbol}`)

  // Check achievements
  checkAchievements(data)

  return { xp, stats: data.stats }
}

/**
 * Check and award achievements
 */
function checkAchievements(data) {
  const newAchievements = []

  // Trade count achievements
  if (data.stats.totalTrades >= 1 && !data.achievements.includes('first_trade')) {
    newAchievements.push('first_trade')
  }
  if (data.stats.totalTrades >= 10 && !data.achievements.includes('ten_trades')) {
    newAchievements.push('ten_trades')
  }
  if (data.stats.totalTrades >= 50 && !data.achievements.includes('fifty_trades')) {
    newAchievements.push('fifty_trades')
  }
  if (data.stats.totalTrades >= 100 && !data.achievements.includes('hundred_trades')) {
    newAchievements.push('hundred_trades')
  }

  // Streak achievements
  if (data.stats.bestStreak >= 3 && !data.achievements.includes('three_streak')) {
    newAchievements.push('three_streak')
  }
  if (data.stats.bestStreak >= 5 && !data.achievements.includes('five_streak')) {
    newAchievements.push('five_streak')
  }
  if (data.stats.bestStreak >= 10 && !data.achievements.includes('ten_streak')) {
    newAchievements.push('ten_streak')
  }

  // Stop loss achievement
  if (data.stats.consecutiveStops >= 20 && !data.achievements.includes('always_stops')) {
    newAchievements.push('always_stops')
  }

  // Award new achievements
  newAchievements.forEach(achievementId => {
    const achievement = ACHIEVEMENTS[achievementId.toUpperCase()]
    if (achievement) {
      data.achievements.push(achievementId)
      awardXP(achievement.xp, 'general', `Achievement: ${achievement.name}`)

      window.dispatchEvent(new CustomEvent('ava.achievement', {
        detail: achievement
      }))
    }
  })

  if (newAchievements.length > 0) {
    saveProgression(data)
  }

  return newAchievements
}

/**
 * Get current progression
 */
export function getProgression() {
  const data = loadProgression()
  const currentLevelXP = LEVEL_XP[data.level - 1] || 0
  const nextLevelXP = LEVEL_XP[data.level] || LEVEL_XP[LEVEL_XP.length - 1]
  const xpInLevel = data.totalXP - currentLevelXP
  const xpNeeded = nextLevelXP - currentLevelXP
  const progress = Math.min(100, (xpInLevel / xpNeeded) * 100)

  return {
    ...data,
    rank: getRankTitle(data.level),
    progress,
    xpInLevel,
    xpNeeded,
    nextLevelXP
  }
}

/**
 * Get today's challenges
 */
export function getDailyChallenges() {
  const data = loadProgression()
  const today = new Date().toDateString()

  // Generate new challenges if it's a new day
  if (data.dailyChallengeDate !== today) {
    // Pick 3 random challenges
    const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5)
    data.dailyChallenges = shuffled.slice(0, 3).map(c => ({
      ...c,
      completed: false,
      progress: 0
    }))
    data.dailyChallengeDate = today
    saveProgression(data)
  }

  return data.dailyChallenges
}

/**
 * Update challenge progress
 */
export function updateChallengeProgress(challengeId, progress) {
  const data = loadProgression()
  const challenge = data.dailyChallenges.find(c => c.id === challengeId)

  if (challenge && !challenge.completed) {
    challenge.progress = progress

    if (progress >= challenge.requirement.value) {
      challenge.completed = true
      awardXP(challenge.xp, 'general', `Challenge: ${challenge.name}`)

      window.dispatchEvent(new CustomEvent('ava.challengeComplete', {
        detail: challenge
      }))
    }

    saveProgression(data)
  }

  return data.dailyChallenges
}

/**
 * Get leaderboard position (mock for now)
 */
export function getLeaderboardPosition() {
  const data = loadProgression()

  // Simulated percentile based on level
  const percentile = Math.max(1, 100 - (data.level * 4))

  return {
    rank: Math.ceil(1000 * (percentile / 100)),
    percentile,
    totalPlayers: 1000
  }
}

/**
 * Reset progression (for testing)
 */
export function resetProgression() {
  localStorage.removeItem(STORAGE_KEY)
}

export default {
  awardXP,
  recordTradeForXP,
  getProgression,
  getDailyChallenges,
  updateChallengeProgress,
  getLeaderboardPosition,
  resetProgression,
  SKILL_TREES,
  ACHIEVEMENTS,
  DAILY_CHALLENGES
}
