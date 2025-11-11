/**
 * Personalized Learning System
 * Adapts to user's trading style and provides customized education
 */

/**
 * Learning profile for user
 */
export class LearningProfile {
  constructor() {
    this.load()
  }

  load() {
    try {
      const data = localStorage.getItem('iava_learning_profile')
      const profile = data ? JSON.parse(data) : {}

      this.tradingStyle = profile.tradingStyle || 'unknown' // scalper, day_trader, swing_trader
      this.experienceLevel = profile.experienceLevel || 'beginner' // beginner, intermediate, advanced
      this.preferredStrategies = profile.preferredStrategies || []
      this.knownConcepts = profile.knownConcepts || []
      this.learningGoals = profile.learningGoals || []
      this.completedLessons = profile.completedLessons || []
      this.mistakePatterns = profile.mistakePatterns || []
      this.strengthAreas = profile.strengthAreas || []
    } catch (error) {
      console.error('[Learning] Failed to load profile:', error)
      this.reset()
    }
  }

  save() {
    try {
      localStorage.setItem('iava_learning_profile', JSON.stringify({
        tradingStyle: this.tradingStyle,
        experienceLevel: this.experienceLevel,
        preferredStrategies: this.preferredStrategies,
        knownConcepts: this.knownConcepts,
        learningGoals: this.learningGoals,
        completedLessons: this.completedLessons,
        mistakePatterns: this.mistakePatterns,
        strengthAreas: this.strengthAreas
      }))
    } catch (error) {
      console.error('[Learning] Failed to save profile:', error)
    }
  }

  reset() {
    this.tradingStyle = 'unknown'
    this.experienceLevel = 'beginner'
    this.preferredStrategies = []
    this.knownConcepts = []
    this.learningGoals = []
    this.completedLessons = []
    this.mistakePatterns = []
    this.strengthAreas = []
    this.save()
  }

  updateFromTrades(trades) {
    // Infer trading style from hold times
    const avgHoldTime = trades.reduce((sum, t) => sum + t.holdTime, 0) / trades.length

    if (avgHoldTime < 3600000) { // < 1 hour
      this.tradingStyle = 'scalper'
    } else if (avgHoldTime < 86400000) { // < 1 day
      this.tradingStyle = 'day_trader'
    } else {
      this.tradingStyle = 'swing_trader'
    }

    // Extract preferred strategies
    const strategyFreq = {}
    trades.forEach(t => {
      strategyFreq[t.strategy] = (strategyFreq[t.strategy] || 0) + 1
    })
    this.preferredStrategies = Object.entries(strategyFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([strategy]) => strategy)

    this.save()
  }

  completeLesson(lessonId) {
    if (!this.completedLessons.includes(lessonId)) {
      this.completedLessons.push(lessonId)
      this.save()
    }
  }

  addKnownConcept(concept) {
    if (!this.knownConcepts.includes(concept)) {
      this.knownConcepts.push(concept)
      this.save()
    }
  }
}

/**
 * Learning curriculum
 */
const CURRICULUM = {
  beginner: [
    {
      id: 'basics_1',
      title: 'Understanding Support and Resistance',
      concepts: ['support', 'resistance', 'price_action'],
      duration: '10 min',
      content: 'Learn how to identify key price levels where reversals are likely.'
    },
    {
      id: 'basics_2',
      title: 'Volume Analysis Fundamentals',
      concepts: ['volume', 'accumulation', 'distribution'],
      duration: '12 min',
      content: 'Understand how volume confirms price movements and signals reversals.'
    },
    {
      id: 'basics_3',
      title: 'Trend Identification with EMAs',
      concepts: ['ema', 'trend', 'moving_averages'],
      duration: '15 min',
      content: 'Master using exponential moving averages to identify trends.'
    }
  ],
  intermediate: [
    {
      id: 'inter_1',
      title: 'Multi-Timeframe Analysis',
      concepts: ['mtf_analysis', 'timeframes', 'confluence'],
      duration: '20 min',
      content: 'Learn to align signals across multiple timeframes for higher probability trades.'
    },
    {
      id: 'inter_2',
      title: 'Risk Management and Position Sizing',
      concepts: ['risk_management', 'position_sizing', 'kelly_criterion'],
      duration: '18 min',
      content: 'Calculate optimal position sizes and manage portfolio risk.'
    },
    {
      id: 'inter_3',
      title: 'Market Regime Detection',
      concepts: ['market_regimes', 'adx', 'volatility'],
      duration: '22 min',
      content: 'Identify different market conditions and adapt your strategy.'
    }
  ],
  advanced: [
    {
      id: 'adv_1',
      title: 'Quantitative Strategy Development',
      concepts: ['backtesting', 'optimization', 'statistics'],
      duration: '30 min',
      content: 'Build and validate systematic trading strategies with rigorous testing.'
    },
    {
      id: 'adv_2',
      title: 'Order Flow and Market Microstructure',
      concepts: ['order_flow', 'market_making', 'liquidity'],
      duration: '25 min',
      content: 'Understand institutional order flow and market structure dynamics.'
    },
    {
      id: 'adv_3',
      title: 'Portfolio Construction and Correlation',
      concepts: ['portfolio_theory', 'correlation', 'diversification'],
      duration: '28 min',
      content: 'Build diversified portfolios with optimal risk/return profiles.'
    }
  ]
}

/**
 * Get personalized lesson recommendations
 */
export function getRecommendedLessons(profile) {
  const curriculum = CURRICULUM[profile.experienceLevel] || CURRICULUM.beginner

  // Filter out completed lessons
  const available = curriculum.filter(lesson =>
    !profile.completedLessons.includes(lesson.id)
  )

  // Prioritize lessons that match user's weaknesses
  const prioritized = available.sort((a, b) => {
    const aRelevance = a.concepts.some(c => profile.mistakePatterns.includes(c)) ? 1 : 0
    const bRelevance = b.concepts.some(c => profile.mistakePatterns.includes(c)) ? 1 : 0
    return bRelevance - aRelevance
  })

  return prioritized.slice(0, 3)
}

/**
 * Get learning path based on goals
 */
export function getLearningPath(profile) {
  const allLessons = [
    ...CURRICULUM.beginner,
    ...CURRICULUM.intermediate,
    ...CURRICULUM.advanced
  ]

  // Filter by goals
  let relevant = allLessons

  if (profile.learningGoals.length > 0) {
    relevant = allLessons.filter(lesson =>
      lesson.concepts.some(c => profile.learningGoals.includes(c))
    )
  }

  // Filter completed
  relevant = relevant.filter(lesson =>
    !profile.completedLessons.includes(lesson.id)
  )

  return {
    current: relevant[0] || null,
    upcoming: relevant.slice(1, 4),
    totalRemaining: relevant.length,
    progress: profile.completedLessons.length / allLessons.length
  }
}

// Singleton profile
export const learningProfile = new LearningProfile()

export default {
  LearningProfile,
  getRecommendedLessons,
  getLearningPath,
  CURRICULUM,
  learningProfile
}
