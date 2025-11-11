/**
 * Personalized Learning System - PhD Elite Edition
 *
 * Comprehensive adaptive learning system with:
 * - Spaced repetition (SM-2 algorithm)
 * - Knowledge graph with concept dependencies
 * - Adaptive difficulty adjustment
 * - Learning analytics and retention curves
 * - Mastery tracking per concept
 * - Personalized curriculum generation
 * - Cognitive load management
 * - Learning velocity optimization
 *
 * @module personalizedLearning
 */

// ============================================================================
// MATHEMATICAL UTILITIES
// ============================================================================

/**
 * Calculate Ebbinghaus forgetting curve
 * R = e^(-t/S)
 * where R = retention, t = time, S = stability
 */
function forgettingCurve(timeDays, stability) {
  return Math.exp(-timeDays / stability)
}

/**
 * Calculate learning curve (power law of practice)
 * T = a * N^(-b)
 * where T = time per trial, N = trial number, a,b = constants
 */
function learningCurve(trialNumber, initialTime = 100, learningRate = 0.3) {
  return initialTime * Math.pow(trialNumber, -learningRate)
}

/**
 * Calculate concept difficulty using Item Response Theory (simplified)
 */
function calculateDifficulty(correctResponses, totalResponses) {
  if (totalResponses === 0) return 0.5
  const proportion = correctResponses / totalResponses
  // Logit transformation
  return 1 / (1 + Math.exp(4 * (proportion - 0.5)))
}

/**
 * Calculate mastery score with diminishing returns
 */
function calculateMastery(practiceCount, successRate, daysSinceLastPractice) {
  const practiceFactor = Math.min(1, practiceCount / 10) // Cap at 10 practices
  const qualityFactor = successRate
  const recencyFactor = Math.exp(-daysSinceLastPractice / 7) // Decay over 7 days

  return (practiceFactor * 0.4 + qualityFactor * 0.4 + recencyFactor * 0.2) * 100
}

// ============================================================================
// SM-2 SPACED REPETITION ALGORITHM
// ============================================================================

/**
 * SM-2 Algorithm Implementation
 * SuperMemo 2 algorithm for optimal review scheduling
 */
export class SM2Card {
  constructor(concept, initialEF = 2.5) {
    this.concept = concept
    this.repetitions = 0
    this.interval = 1 // days
    this.easinessFactor = initialEF // E-Factor (1.3 - 2.5)
    this.nextReviewDate = new Date()
    this.lastReviewDate = null
    this.totalReviews = 0
    this.correctReviews = 0
  }

  /**
   * Update card based on review quality (0-5)
   * 0: Complete blackout
   * 1: Incorrect, but remembered on seeing answer
   * 2: Incorrect, but seemed easy on seeing answer
   * 3: Correct, but required significant difficulty
   * 4: Correct, with some hesitation
   * 5: Perfect recall
   */
  review(quality) {
    this.totalReviews++
    this.lastReviewDate = new Date()

    if (quality >= 3) {
      this.correctReviews++

      if (this.repetitions === 0) {
        this.interval = 1
      } else if (this.repetitions === 1) {
        this.interval = 6
      } else {
        this.interval = Math.round(this.interval * this.easinessFactor)
      }

      this.repetitions++
    } else {
      // Incorrect response - reset repetitions
      this.repetitions = 0
      this.interval = 1
    }

    // Update E-Factor
    this.easinessFactor = Math.max(
      1.3,
      this.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    )

    // Schedule next review
    this.nextReviewDate = new Date(Date.now() + this.interval * 86400000)

    return {
      interval: this.interval,
      nextReview: this.nextReviewDate,
      easinessFactor: this.easinessFactor,
      repetitions: this.repetitions
    }
  }

  isDue() {
    return new Date() >= this.nextReviewDate
  }

  getSuccessRate() {
    return this.totalReviews > 0 ? this.correctReviews / this.totalReviews : 0
  }

  toJSON() {
    return {
      concept: this.concept,
      repetitions: this.repetitions,
      interval: this.interval,
      easinessFactor: this.easinessFactor,
      nextReviewDate: this.nextReviewDate.toISOString(),
      lastReviewDate: this.lastReviewDate ? this.lastReviewDate.toISOString() : null,
      totalReviews: this.totalReviews,
      correctReviews: this.correctReviews
    }
  }

  static fromJSON(data) {
    const card = new SM2Card(data.concept, data.easinessFactor)
    card.repetitions = data.repetitions
    card.interval = data.interval
    card.nextReviewDate = new Date(data.nextReviewDate)
    card.lastReviewDate = data.lastReviewDate ? new Date(data.lastReviewDate) : null
    card.totalReviews = data.totalReviews
    card.correctReviews = data.correctReviews
    return card
  }
}

// ============================================================================
// KNOWLEDGE GRAPH
// ============================================================================

/**
 * Concept node in knowledge graph
 */
class ConceptNode {
  constructor(id, name, category) {
    this.id = id
    this.name = name
    this.category = category
    this.prerequisites = [] // IDs of prerequisite concepts
    this.difficulty = 0.5 // 0-1 scale
    this.estimatedTimeMinutes = 15
    this.masteryLevel = 0 // 0-100%
    this.practiceCount = 0
    this.lastPracticed = null
    this.totalAttempts = 0
    this.successfulAttempts = 0
  }

  hasMasteredPrerequisites(graph) {
    return this.prerequisites.every(prereqId => {
      const prereq = graph.getNode(prereqId)
      return prereq && prereq.masteryLevel >= 70 // 70% mastery threshold
    })
  }

  updateMastery() {
    if (this.totalAttempts === 0) {
      this.masteryLevel = 0
      return
    }

    const successRate = this.successfulAttempts / this.totalAttempts
    const daysSinceLastPractice = this.lastPracticed
      ? (Date.now() - this.lastPracticed.getTime()) / 86400000
      : 999

    this.masteryLevel = calculateMastery(
      this.practiceCount,
      successRate,
      daysSinceLastPractice
    )
  }

  recordPractice(success) {
    this.practiceCount++
    this.totalAttempts++
    if (success) this.successfulAttempts++
    this.lastPracticed = new Date()
    this.updateMastery()
  }

  getDifficulty() {
    return calculateDifficulty(this.successfulAttempts, this.totalAttempts)
  }
}

/**
 * Knowledge Graph for concept dependencies
 */
export class KnowledgeGraph {
  constructor() {
    this.nodes = new Map()
    this.edges = new Map() // concept -> [dependents]
    this.initializeDefaultGraph()
  }

  initializeDefaultGraph() {
    // Beginner concepts
    this.addConcept('support_resistance', 'Support and Resistance', 'basics', [], 1, 10)
    this.addConcept('volume_basics', 'Volume Analysis', 'basics', [], 1, 12)
    this.addConcept('candlesticks', 'Candlestick Patterns', 'basics', [], 1, 15)
    this.addConcept('trends', 'Trend Identification', 'basics', ['support_resistance'], 2, 12)
    this.addConcept('ema', 'Moving Averages', 'basics', ['trends'], 2, 15)

    // Intermediate concepts
    this.addConcept('mtf_analysis', 'Multi-Timeframe Analysis', 'intermediate',
      ['trends', 'ema'], 3, 20)
    this.addConcept('rsi', 'RSI Indicator', 'intermediate', ['trends'], 3, 15)
    this.addConcept('macd', 'MACD Indicator', 'intermediate', ['ema'], 3, 18)
    this.addConcept('position_sizing', 'Position Sizing', 'intermediate', [], 3, 20)
    this.addConcept('risk_reward', 'Risk/Reward Ratios', 'intermediate',
      ['position_sizing'], 3, 18)
    this.addConcept('market_regimes', 'Market Regimes', 'intermediate',
      ['trends', 'volume_basics'], 4, 22)

    // Advanced concepts
    this.addConcept('backtesting', 'Backtesting Strategies', 'advanced',
      ['position_sizing', 'risk_reward'], 5, 30)
    this.addConcept('optimization', 'Strategy Optimization', 'advanced',
      ['backtesting'], 5, 28)
    this.addConcept('order_flow', 'Order Flow Analysis', 'advanced',
      ['volume_basics', 'market_regimes'], 5, 25)
    this.addConcept('portfolio_theory', 'Portfolio Theory', 'advanced',
      ['position_sizing', 'risk_reward'], 5, 30)
    this.addConcept('correlation', 'Asset Correlation', 'advanced',
      ['portfolio_theory'], 5, 22)
    this.addConcept('options', 'Options Trading', 'advanced',
      ['risk_reward', 'market_regimes'], 5, 35)
  }

  addConcept(id, name, category, prerequisites = [], difficulty = 3, timeMinutes = 15) {
    const node = new ConceptNode(id, name, category)
    node.prerequisites = prerequisites
    node.difficulty = difficulty / 5 // Normalize to 0-1
    node.estimatedTimeMinutes = timeMinutes

    this.nodes.set(id, node)

    // Build reverse edges
    prerequisites.forEach(prereqId => {
      if (!this.edges.has(prereqId)) {
        this.edges.set(prereqId, [])
      }
      this.edges.get(prereqId).push(id)
    })
  }

  getNode(id) {
    return this.nodes.get(id)
  }

  getAllConcepts() {
    return Array.from(this.nodes.values())
  }

  getAvailableConcepts() {
    // Concepts whose prerequisites are mastered
    return this.getAllConcepts().filter(node =>
      node.hasMasteredPrerequisites(this)
    )
  }

  getConceptsByCategory(category) {
    return this.getAllConcepts().filter(node => node.category === category)
  }

  getNextConcepts(masteredConceptIds) {
    // Find concepts that are now available after mastering given concepts
    const available = []

    for (const node of this.nodes.values()) {
      if (node.masteryLevel >= 70) continue // Already mastered

      const prerequisitesMet = node.prerequisites.every(prereqId =>
        masteredConceptIds.includes(prereqId) ||
        this.getNode(prereqId)?.masteryLevel >= 70
      )

      if (prerequisitesMet) {
        available.push(node)
      }
    }

    return available.sort((a, b) => a.difficulty - b.difficulty)
  }

  getLearningPath(startConceptId, endConceptId) {
    // BFS to find shortest path through knowledge graph
    const queue = [[startConceptId]]
    const visited = new Set([startConceptId])

    while (queue.length > 0) {
      const path = queue.shift()
      const current = path[path.length - 1]

      if (current === endConceptId) {
        return path.map(id => this.getNode(id))
      }

      const dependents = this.edges.get(current) || []
      for (const next of dependents) {
        if (!visited.has(next)) {
          visited.add(next)
          queue.push([...path, next])
        }
      }
    }

    return [] // No path found
  }

  getOverallMastery() {
    const nodes = this.getAllConcepts()
    if (nodes.length === 0) return 0

    const totalMastery = nodes.reduce((sum, node) => sum + node.masteryLevel, 0)
    return totalMastery / nodes.length
  }

  toJSON() {
    const nodesData = {}
    this.nodes.forEach((node, id) => {
      nodesData[id] = {
        name: node.name,
        category: node.category,
        prerequisites: node.prerequisites,
        difficulty: node.difficulty,
        estimatedTimeMinutes: node.estimatedTimeMinutes,
        masteryLevel: node.masteryLevel,
        practiceCount: node.practiceCount,
        lastPracticed: node.lastPracticed ? node.lastPracticed.toISOString() : null,
        totalAttempts: node.totalAttempts,
        successfulAttempts: node.successfulAttempts
      }
    })
    return nodesData
  }

  fromJSON(data) {
    Object.entries(data).forEach(([id, nodeData]) => {
      const node = this.getNode(id)
      if (node) {
        node.masteryLevel = nodeData.masteryLevel || 0
        node.practiceCount = nodeData.practiceCount || 0
        node.lastPracticed = nodeData.lastPracticed ? new Date(nodeData.lastPracticed) : null
        node.totalAttempts = nodeData.totalAttempts || 0
        node.successfulAttempts = nodeData.successfulAttempts || 0
      }
    })
  }
}

// ============================================================================
// ADAPTIVE DIFFICULTY SYSTEM
// ============================================================================

/**
 * Adaptive difficulty adjuster using zone of proximal development
 */
export class AdaptiveDifficulty {
  constructor() {
    this.targetSuccessRate = 0.75 // Sweet spot for learning
    this.adjustmentRate = 0.1
    this.minDifficulty = 0.1
    this.maxDifficulty = 1.0
  }

  /**
   * Calculate optimal difficulty for learner
   */
  calculateOptimalDifficulty(recentPerformance) {
    if (recentPerformance.length === 0) return 0.5

    const successRate = recentPerformance.filter(p => p.success).length / recentPerformance.length

    // If performing too well, increase difficulty
    if (successRate > this.targetSuccessRate + 0.1) {
      return Math.min(this.maxDifficulty, recentPerformance[0].difficulty + this.adjustmentRate)
    }

    // If struggling, decrease difficulty
    if (successRate < this.targetSuccessRate - 0.1) {
      return Math.max(this.minDifficulty, recentPerformance[0].difficulty - this.adjustmentRate)
    }

    // In the sweet spot
    return recentPerformance[0].difficulty
  }

  /**
   * Generate questions at specific difficulty level
   */
  generateQuestion(concept, difficulty) {
    // Question templates by difficulty
    const templates = {
      easy: [
        { type: 'definition', prompt: `What is ${concept.name}?` },
        { type: 'recognition', prompt: `Identify the ${concept.name} in this example` }
      ],
      medium: [
        { type: 'application', prompt: `How would you use ${concept.name} in this scenario?` },
        { type: 'comparison', prompt: `Compare ${concept.name} with related concepts` }
      ],
      hard: [
        { type: 'synthesis', prompt: `Create a strategy using ${concept.name}` },
        { type: 'evaluation', prompt: `Analyze the effectiveness of ${concept.name}` }
      ]
    }

    let level = 'easy'
    if (difficulty > 0.33 && difficulty <= 0.66) level = 'medium'
    else if (difficulty > 0.66) level = 'hard'

    const template = templates[level][Math.floor(Math.random() * templates[level].length)]

    return {
      concept: concept.id,
      difficulty,
      type: template.type,
      prompt: template.prompt,
      generatedAt: new Date()
    }
  }

  /**
   * Assess cognitive load
   */
  assessCognitiveLoad(sessionData) {
    const {
      questionsAttempted = 0,
      timeSpent = 0, // minutes
      switchesBetweenConcepts = 0,
      errorsRecent = 0
    } = sessionData

    // Cognitive load factors
    const timePressure = Math.min(1, timeSpent / 60) // Normalize to 1 hour
    const taskSwitching = Math.min(1, switchesBetweenConcepts / 10)
    const errorRate = questionsAttempted > 0 ? errorsRecent / questionsAttempted : 0

    const cognitiveLoad = (timePressure * 0.3 + taskSwitching * 0.3 + errorRate * 0.4)

    return {
      load: cognitiveLoad,
      level: cognitiveLoad < 0.3 ? 'low' : cognitiveLoad < 0.7 ? 'optimal' : 'high',
      recommendation: cognitiveLoad > 0.7
        ? 'Consider taking a break or reducing difficulty'
        : cognitiveLoad < 0.3
        ? 'Can increase difficulty for better challenge'
        : 'Current load is in optimal learning zone'
    }
  }
}

// ============================================================================
// LEARNING ANALYTICS
// ============================================================================

/**
 * Comprehensive learning analytics engine
 */
export class LearningAnalytics {
  constructor() {
    this.sessions = []
    this.retentionData = new Map() // concept -> retention measurements
  }

  recordSession(sessionData) {
    this.sessions.push({
      ...sessionData,
      timestamp: new Date()
    })
  }

  /**
   * Calculate retention curve for concept
   */
  calculateRetentionCurve(conceptId, measurements) {
    // Measurements: [{timeDays, score}]
    if (measurements.length < 2) return null

    // Fit exponential decay: R = a * e^(-b*t)
    const xValues = measurements.map(m => m.timeDays)
    const yValues = measurements.map(m => m.score)

    // Simple exponential fit using log-linear regression
    const logY = yValues.map(y => Math.log(Math.max(0.01, y)))
    const { slope, intercept } = this.linearRegression(xValues, logY)

    const stability = -1 / slope // Time constant
    const initialRetention = Math.exp(intercept)

    return {
      conceptId,
      stability,
      initialRetention,
      halfLife: stability * Math.log(2),
      predict: (days) => initialRetention * Math.exp(slope * days)
    }
  }

  linearRegression(x, y) {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  /**
   * Calculate learning velocity (concepts mastered per week)
   */
  calculateLearningVelocity(timeWindowDays = 30) {
    const cutoff = Date.now() - timeWindowDays * 86400000
    const recentSessions = this.sessions.filter(s => s.timestamp >= cutoff)

    if (recentSessions.length === 0) return 0

    const conceptsMastered = new Set()
    recentSessions.forEach(session => {
      if (session.masteryAchieved) {
        session.conceptsMastered?.forEach(c => conceptsMastered.add(c))
      }
    })

    return (conceptsMastered.size / timeWindowDays) * 7 // per week
  }

  /**
   * Predict time to mastery for concept
   */
  predictTimeToMastery(concept, currentMastery) {
    if (currentMastery >= 100) return 0

    // Based on historical learning rate
    const velocity = this.calculateLearningVelocity()
    if (velocity === 0) return null

    // Estimate practice sessions needed
    const sessionsNeeded = (100 - currentMastery) / 10 // ~10% gain per session
    const weeksNeeded = sessionsNeeded / velocity

    return {
      weeks: weeksNeeded,
      sessions: sessionsNeeded,
      confidence: Math.min(1, this.sessions.length / 10) // More data = more confident
    }
  }

  /**
   * Generate study session analytics
   */
  analyzeStudyPattern() {
    if (this.sessions.length === 0) return null

    // Session timing analysis
    const sessionTimes = this.sessions.map(s => s.timestamp.getHours())
    const avgSessionTime = sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length

    // Session length analysis
    const durations = this.sessions.map(s => s.durationMinutes || 0)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length

    // Consistency analysis
    const daysBetweenSessions = []
    for (let i = 1; i < this.sessions.length; i++) {
      const diff = (this.sessions[i].timestamp - this.sessions[i-1].timestamp) / 86400000
      daysBetweenSessions.push(diff)
    }
    const avgGap = daysBetweenSessions.length > 0
      ? daysBetweenSessions.reduce((a, b) => a + b, 0) / daysBetweenSessions.length
      : 0

    return {
      totalSessions: this.sessions.length,
      avgSessionTime: `${Math.round(avgSessionTime)}:00`,
      avgDurationMinutes: Math.round(avgDuration),
      avgDaysBetweenSessions: avgGap.toFixed(1),
      consistency: avgGap < 2 ? 'excellent' : avgGap < 4 ? 'good' : 'needs_improvement',
      recommendation: avgGap > 3
        ? 'Try to study more frequently for better retention'
        : 'Great consistency! Keep up the regular practice'
    }
  }

  /**
   * Identify strengths and weaknesses
   */
  identifyStrengthsWeaknesses(knowledgeGraph) {
    const concepts = knowledgeGraph.getAllConcepts()

    const strengths = concepts
      .filter(c => c.masteryLevel >= 80)
      .sort((a, b) => b.masteryLevel - a.masteryLevel)
      .slice(0, 5)

    const weaknesses = concepts
      .filter(c => c.practiceCount > 0 && c.masteryLevel < 50)
      .sort((a, b) => a.masteryLevel - b.masteryLevel)
      .slice(0, 5)

    const needsPractice = concepts
      .filter(c => {
        if (!c.lastPracticed) return false
        const daysSince = (Date.now() - c.lastPracticed.getTime()) / 86400000
        return daysSince > 7 && c.masteryLevel < 90
      })
      .sort((a, b) => {
        const aDays = (Date.now() - a.lastPracticed.getTime()) / 86400000
        const bDays = (Date.now() - b.lastPracticed.getTime()) / 86400000
        return bDays - aDays
      })
      .slice(0, 5)

    return { strengths, weaknesses, needsPractice }
  }
}

// ============================================================================
// ENHANCED LEARNING PROFILE
// ============================================================================

/**
 * Learning profile for user (ORIGINAL - kept for backward compatibility)
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
 * Enhanced Learning Profile with advanced features
 */
export class EnhancedLearningProfile extends LearningProfile {
  constructor() {
    super()
    this.knowledgeGraph = new KnowledgeGraph()
    this.spacedRepetition = new Map() // concept -> SM2Card
    this.adaptiveDifficulty = new AdaptiveDifficulty()
    this.analytics = new LearningAnalytics()
    this.recentPerformance = [] // Last 20 attempts
    this.currentStreak = 0
    this.longestStreak = 0
    this.totalStudyTimeMinutes = 0
    this.loadEnhancedData()
  }

  loadEnhancedData() {
    try {
      const data = localStorage.getItem('iava_enhanced_learning')
      if (!data) return

      const enhanced = JSON.parse(data)

      // Load knowledge graph
      if (enhanced.knowledgeGraph) {
        this.knowledgeGraph.fromJSON(enhanced.knowledgeGraph)
      }

      // Load spaced repetition cards
      if (enhanced.spacedRepetition) {
        Object.entries(enhanced.spacedRepetition).forEach(([concept, cardData]) => {
          this.spacedRepetition.set(concept, SM2Card.fromJSON(cardData))
        })
      }

      // Load analytics
      if (enhanced.analytics) {
        this.analytics.sessions = enhanced.analytics.sessions?.map(s => ({
          ...s,
          timestamp: new Date(s.timestamp)
        })) || []
      }

      this.recentPerformance = enhanced.recentPerformance || []
      this.currentStreak = enhanced.currentStreak || 0
      this.longestStreak = enhanced.longestStreak || 0
      this.totalStudyTimeMinutes = enhanced.totalStudyTimeMinutes || 0
    } catch (error) {
      console.error('[EnhancedLearning] Failed to load data:', error)
    }
  }

  saveEnhancedData() {
    try {
      const spacedRepetitionData = {}
      this.spacedRepetition.forEach((card, concept) => {
        spacedRepetitionData[concept] = card.toJSON()
      })

      const enhanced = {
        knowledgeGraph: this.knowledgeGraph.toJSON(),
        spacedRepetition: spacedRepetitionData,
        analytics: {
          sessions: this.analytics.sessions.map(s => ({
            ...s,
            timestamp: s.timestamp.toISOString()
          }))
        },
        recentPerformance: this.recentPerformance,
        currentStreak: this.currentStreak,
        longestStreak: this.longestStreak,
        totalStudyTimeMinutes: this.totalStudyTimeMinutes
      }

      localStorage.setItem('iava_enhanced_learning', JSON.stringify(enhanced))
      this.save() // Also save base profile
    } catch (error) {
      console.error('[EnhancedLearning] Failed to save data:', error)
    }
  }

  /**
   * Record practice attempt
   */
  recordPractice(conceptId, success, quality = null) {
    const concept = this.knowledgeGraph.getNode(conceptId)
    if (!concept) return

    // Update concept mastery
    concept.recordPractice(success)

    // Update spaced repetition
    if (!this.spacedRepetition.has(conceptId)) {
      this.spacedRepetition.set(conceptId, new SM2Card(conceptId))
    }
    if (quality !== null) {
      this.spacedRepetition.get(conceptId).review(quality)
    }

    // Update recent performance
    this.recentPerformance.push({
      conceptId,
      success,
      difficulty: concept.getDifficulty(),
      timestamp: new Date()
    })
    if (this.recentPerformance.length > 20) {
      this.recentPerformance.shift()
    }

    // Update streak
    if (success) {
      this.currentStreak++
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak)
    } else {
      this.currentStreak = 0
    }

    this.saveEnhancedData()
  }

  /**
   * Get concepts due for review (spaced repetition)
   */
  getDueReviews() {
    const due = []
    this.spacedRepetition.forEach((card, conceptId) => {
      if (card.isDue()) {
        const concept = this.knowledgeGraph.getNode(conceptId)
        if (concept) {
          due.push({
            concept,
            card,
            priority: card.totalReviews === 0 ? 'new' : 'review'
          })
        }
      }
    })
    return due.sort((a, b) => a.card.nextReviewDate - b.card.nextReviewDate)
  }

  /**
   * Get optimal next lesson
   */
  getOptimalNextLesson() {
    // 1. Check for due reviews first (spaced repetition)
    const dueReviews = this.getDueReviews()
    if (dueReviews.length > 0) {
      return {
        type: 'review',
        concept: dueReviews[0].concept,
        reason: 'Due for spaced repetition review'
      }
    }

    // 2. Get available concepts (prerequisites met)
    const available = this.knowledgeGraph.getAvailableConcepts()
      .filter(c => c.masteryLevel < 70)

    if (available.length === 0) {
      return {
        type: 'complete',
        message: 'Congratulations! You have mastered all available concepts.'
      }
    }

    // 3. Choose based on adaptive difficulty
    const optimalDifficulty = this.adaptiveDifficulty.calculateOptimalDifficulty(
      this.recentPerformance
    )

    const sorted = available.sort((a, b) => {
      const aDiff = Math.abs(a.difficulty - optimalDifficulty)
      const bDiff = Math.abs(b.difficulty - optimalDifficulty)
      return aDiff - bDiff
    })

    return {
      type: 'new',
      concept: sorted[0],
      reason: 'Optimal difficulty match for your current level'
    }
  }

  /**
   * Generate personalized learning path
   */
  generatePersonalizedPath(targetConcepts = [], maxLessons = 10) {
    const path = []
    const processed = new Set()

    // Start with concepts that need practice
    const needsPractice = this.knowledgeGraph.getAllConcepts()
      .filter(c => {
        if (!c.lastPracticed) return false
        const daysSince = (Date.now() - c.lastPracticed.getTime()) / 86400000
        return daysSince > 7 && c.masteryLevel < 90
      })
      .sort((a, b) => {
        const aDays = (Date.now() - a.lastPracticed.getTime()) / 86400000
        const bDays = (Date.now() - b.lastPracticed.getTime()) / 86400000
        return bDays - aDays
      })

    needsPractice.slice(0, 3).forEach(c => {
      path.push({ concept: c, type: 'review', priority: 'high' })
      processed.add(c.id)
    })

    // Add target concepts and their prerequisites
    targetConcepts.forEach(targetId => {
      const target = this.knowledgeGraph.getNode(targetId)
      if (!target) return

      // Find prerequisites not yet mastered
      const prerequisitePath = this.findPrerequisitePath(target)
      prerequisitePath.forEach(c => {
        if (!processed.has(c.id) && c.masteryLevel < 70) {
          path.push({ concept: c, type: 'learn', priority: 'medium' })
          processed.add(c.id)
        }
      })
    })

    // Fill remaining slots with optimal next lessons
    while (path.length < maxLessons) {
      const available = this.knowledgeGraph.getAvailableConcepts()
        .filter(c => !processed.has(c.id) && c.masteryLevel < 70)

      if (available.length === 0) break

      const optimalDifficulty = this.adaptiveDifficulty.calculateOptimalDifficulty(
        this.recentPerformance
      )

      const next = available.sort((a, b) => {
        const aDiff = Math.abs(a.difficulty - optimalDifficulty)
        const bDiff = Math.abs(b.difficulty - optimalDifficulty)
        return aDiff - bDiff
      })[0]

      path.push({ concept: next, type: 'learn', priority: 'low' })
      processed.add(next.id)
    }

    return path
  }

  findPrerequisitePath(concept) {
    const path = []
    const visited = new Set()

    const dfs = (node) => {
      if (visited.has(node.id)) return
      visited.add(node.id)

      node.prerequisites.forEach(prereqId => {
        const prereq = this.knowledgeGraph.getNode(prereqId)
        if (prereq && prereq.masteryLevel < 70) {
          dfs(prereq)
        }
      })

      path.push(node)
    }

    dfs(concept)
    return path
  }

  /**
   * Get comprehensive learning dashboard
   */
  getDashboard() {
    const dueReviews = this.getDueReviews()
    const { strengths, weaknesses, needsPractice } = this.analytics.identifyStrengthsWeaknesses(
      this.knowledgeGraph
    )
    const studyPattern = this.analytics.analyzeStudyPattern()
    const velocity = this.analytics.calculateLearningVelocity()
    const overallMastery = this.knowledgeGraph.getOverallMastery()

    return {
      overview: {
        overallMastery: Math.round(overallMastery),
        currentStreak: this.currentStreak,
        longestStreak: this.longestStreak,
        totalStudyTime: this.totalStudyTimeMinutes,
        learningVelocity: velocity.toFixed(2) + ' concepts/week'
      },
      dueReviews: dueReviews.length,
      strengths: strengths.map(c => ({ name: c.name, mastery: Math.round(c.masteryLevel) })),
      weaknesses: weaknesses.map(c => ({ name: c.name, mastery: Math.round(c.masteryLevel) })),
      needsPractice: needsPractice.map(c => ({
        name: c.name,
        daysSince: Math.round((Date.now() - c.lastPracticed.getTime()) / 86400000)
      })),
      studyPattern,
      nextLesson: this.getOptimalNextLesson()
    }
  }

  /**
   * Record study session
   */
  recordSession(durationMinutes, conceptsMastered = []) {
    this.totalStudyTimeMinutes += durationMinutes

    this.analytics.recordSession({
      durationMinutes,
      conceptsMastered,
      masteryAchieved: conceptsMastered.length > 0
    })

    this.saveEnhancedData()
  }
}

// ============================================================================
// ORIGINAL CURRICULUM (kept for backward compatibility)
// ============================================================================

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
 * Get personalized lesson recommendations (ORIGINAL)
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
 * Get learning path based on goals (ORIGINAL)
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

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton profile (enhanced)
export const learningProfile = new EnhancedLearningProfile()

export default {
  // Classes
  LearningProfile,
  EnhancedLearningProfile,
  SM2Card,
  KnowledgeGraph,
  AdaptiveDifficulty,
  LearningAnalytics,

  // Functions
  getRecommendedLessons,
  getLearningPath,
  forgettingCurve,
  learningCurve,
  calculateMastery,

  // Data
  CURRICULUM,

  // Singleton
  learningProfile
}
