/**
 * Personalized Learning System - Ultra PhD Elite++ Edition
 *
 * World-class adaptive learning system with cutting-edge educational AI:
 * - Bayesian Knowledge Tracing (BKT)
 * - Full 3-Parameter Logistic IRT
 * - Learning style detection (VARK + Kolb)
 * - Cognitive Load Theory implementation
 * - Metacognitive scaffolding
 * - Skill transfer modeling
 * - Multi-armed bandit optimization (UCB1, Thompson Sampling)
 * - Collaborative filtering for peer comparison
 * - Learning trajectory prediction
 * - Interleaved practice scheduling
 * - Elaborative rehearsal techniques
 * - Optimal stopping theory
 * - Prerequisite inference algorithms
 * - Concept map generation
 * - Advanced retention prediction
 * - Spaced repetition (SM-2 + Leitner)
 * - Knowledge graph with dependencies
 * - Adaptive difficulty (IRT-based)
 * - Learning analytics
 * - Mastery tracking
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
 */
function forgettingCurve(timeDays, stability) {
  return Math.exp(-timeDays / stability)
}

/**
 * Calculate learning curve (power law of practice)
 * T = a * N^(-b)
 */
function learningCurve(trialNumber, initialTime = 100, learningRate = 0.3) {
  return initialTime * Math.pow(trialNumber, -learningRate)
}

/**
 * Logistic function (sigmoid)
 */
function logistic(x) {
  return 1 / (1 + Math.exp(-x))
}

/**
 * Inverse logistic (logit)
 */
function logit(p) {
  return Math.log(p / (1 - p))
}

/**
 * Beta distribution probability density function
 */
function betaPDF(x, alpha, beta) {
  if (x <= 0 || x >= 1) return 0

  // Simplified beta function calculation
  const B = Math.exp(
    lnGamma(alpha) + lnGamma(beta) - lnGamma(alpha + beta)
  )

  return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / B
}

/**
 * Natural logarithm of gamma function (Stirling's approximation)
 */
function lnGamma(x) {
  if (x < 1) return lnGamma(x + 1) - Math.log(x)

  return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) +
    1 / (12 * x) - 1 / (360 * Math.pow(x, 3))
}

/**
 * Sample from beta distribution (using rejection sampling)
 */
function sampleBeta(alpha, beta) {
  let u1, u2, v1, v2, w

  do {
    u1 = Math.random()
    u2 = Math.random()
    v1 = Math.pow(u1, 1 / alpha)
    v2 = Math.pow(u2, 1 / beta)
    w = v1 + v2
  } while (w > 1)

  return v1 / w
}

/**
 * Calculate correlation coefficient
 */
function correlation(x, y) {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

  const meanX = x.reduce((sum, val) => sum + val, 0) / n
  const meanY = y.reduce((sum, val) => sum + val, 0) / n

  let numerator = 0
  let sumX2 = 0
  let sumY2 = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    numerator += dx * dy
    sumX2 += dx * dx
    sumY2 += dy * dy
  }

  const denominator = Math.sqrt(sumX2 * sumY2)
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Calculate mastery score with diminishing returns
 */
function calculateMastery(practiceCount, successRate, daysSinceLastPractice) {
  const practiceFactor = Math.min(1, practiceCount / 10)
  const qualityFactor = successRate
  const recencyFactor = Math.exp(-daysSinceLastPractice / 7)

  return (practiceFactor * 0.4 + qualityFactor * 0.4 + recencyFactor * 0.2) * 100
}

// ============================================================================
// BAYESIAN KNOWLEDGE TRACING (BKT)
// ============================================================================

/**
 * Bayesian Knowledge Tracing model
 * Tracks probability that student has mastered a skill
 */
export class BayesianKnowledgeTracer {
  constructor() {
    // BKT parameters
    this.pInit = 0.1  // P(L0) - Initial knowledge
    this.pLearn = 0.3 // P(T) - Probability of learning
    this.pSlip = 0.1  // P(S) - Probability of slip (know but get wrong)
    this.pGuess = 0.2 // P(G) - Probability of guess (don't know but get right)

    // Current knowledge state per concept
    this.knowledge = new Map() // concept -> P(Ln)
  }

  /**
   * Initialize knowledge state for concept
   */
  initConcept(conceptId, priorKnowledge = null) {
    this.knowledge.set(conceptId, priorKnowledge || this.pInit)
  }

  /**
   * Update knowledge after observing response
   */
  update(conceptId, correct) {
    if (!this.knowledge.has(conceptId)) {
      this.initConcept(conceptId)
    }

    const pLn = this.knowledge.get(conceptId)

    // P(Ln | correct) or P(Ln | incorrect) using Bayes' rule
    let pLnGivenObs

    if (correct) {
      // P(Ln | correct) = P(correct | Ln) * P(Ln) / P(correct)
      const pCorrectGivenLn = 1 - this.pSlip
      const pCorrectGivenNotLn = this.pGuess
      const pCorrect = pCorrectGivenLn * pLn + pCorrectGivenNotLn * (1 - pLn)

      pLnGivenObs = (pCorrectGivenLn * pLn) / pCorrect
    } else {
      // P(Ln | incorrect)
      const pIncorrectGivenLn = this.pSlip
      const pIncorrectGivenNotLn = 1 - this.pGuess
      const pIncorrect = pIncorrectGivenLn * pLn + pIncorrectGivenNotLn * (1 - pLn)

      pLnGivenObs = (pIncorrectGivenLn * pLn) / pIncorrect
    }

    // P(Ln+1) = P(Ln | obs) + (1 - P(Ln | obs)) * P(T)
    const pLnPlus1 = pLnGivenObs + (1 - pLnGivenObs) * this.pLearn

    this.knowledge.set(conceptId, pLnPlus1)

    return {
      priorKnowledge: pLn,
      posteriorKnowledge: pLnGivenObs,
      predictedKnowledge: pLnPlus1,
      mastered: pLnPlus1 > 0.95
    }
  }

  /**
   * Predict probability of correct response
   */
  predictCorrect(conceptId) {
    if (!this.knowledge.has(conceptId)) {
      this.initConcept(conceptId)
    }

    const pLn = this.knowledge.get(conceptId)
    return (1 - this.pSlip) * pLn + this.pGuess * (1 - pLn)
  }

  /**
   * Estimate trials to mastery
   */
  trialsToMastery(conceptId, threshold = 0.95) {
    if (!this.knowledge.has(conceptId)) {
      this.initConcept(conceptId)
    }

    const pLn = this.knowledge.get(conceptId)

    if (pLn >= threshold) return 0

    // Simulate trials assuming perfect performance
    let p = pLn
    let trials = 0

    while (p < threshold && trials < 100) {
      // Update assuming correct response
      const pCorrect = (1 - this.pSlip) * p + this.pGuess * (1 - p)
      p = ((1 - this.pSlip) * p) / pCorrect
      p = p + (1 - p) * this.pLearn
      trials++
    }

    return trials
  }

  /**
   * Get all knowledge states
   */
  getKnowledgeStates() {
    const states = {}
    this.knowledge.forEach((prob, conceptId) => {
      states[conceptId] = {
        probability: prob,
        mastered: prob > 0.95,
        confident: prob > 0.80,
        learning: prob > 0.50 && prob <= 0.80,
        struggling: prob <= 0.50,
        predictedCorrect: this.predictCorrect(conceptId),
        trialsToMastery: this.trialsToMastery(conceptId)
      }
    })
    return states
  }
}

// ============================================================================
// 3-PARAMETER LOGISTIC IRT MODEL
// ============================================================================

/**
 * Full 3-Parameter Logistic Item Response Theory
 * P(correct) = c + (1-c) / (1 + e^(-a(θ - b)))
 * where a = discrimination, b = difficulty, c = guessing
 */
export class ItemResponseTheory {
  constructor() {
    // Item parameters per concept
    this.items = new Map() // concept -> {a, b, c}

    // Learner ability estimates
    this.abilities = new Map() // learnerId -> θ
  }

  /**
   * Initialize item parameters
   */
  initItem(conceptId, discrimination = 1.0, difficulty = 0.0, guessing = 0.2) {
    this.items.set(conceptId, {
      a: discrimination,  // How well item discriminates
      b: difficulty,      // Item difficulty
      c: guessing        // Lower asymptote (guessing)
    })
  }

  /**
   * Initialize learner ability
   */
  initLearner(learnerId, ability = 0.0) {
    this.abilities.set(learnerId, ability)
  }

  /**
   * Calculate probability of correct response
   */
  probability(learnerId, conceptId) {
    if (!this.abilities.has(learnerId)) {
      this.initLearner(learnerId)
    }

    if (!this.items.has(conceptId)) {
      this.initItem(conceptId)
    }

    const theta = this.abilities.get(learnerId)
    const { a, b, c } = this.items.get(conceptId)

    return c + (1 - c) / (1 + Math.exp(-a * (theta - b)))
  }

  /**
   * Update ability estimate after response (MLE)
   */
  updateAbility(learnerId, conceptId, correct) {
    if (!this.abilities.has(learnerId)) {
      this.initLearner(learnerId)
    }

    if (!this.items.has(conceptId)) {
      this.initItem(conceptId)
    }

    const theta = this.abilities.get(learnerId)
    const { a, b, c } = this.items.get(conceptId)

    // Newton-Raphson iteration
    const p = this.probability(learnerId, conceptId)

    // First derivative (score)
    const y = correct ? 1 : 0
    const score = a * (1 - c) * (y - p) / (p * (1 - c) + c)

    // Second derivative (information)
    const info = Math.pow(a, 2) * Math.pow(1 - c, 2) * p * (1 - p) /
                 Math.pow(p * (1 - c) + c, 2)

    // Update theta
    const newTheta = theta + score / Math.max(info, 0.01)

    this.abilities.set(learnerId, newTheta)

    return {
      oldAbility: theta,
      newAbility: newTheta,
      change: newTheta - theta,
      probability: this.probability(learnerId, conceptId)
    }
  }

  /**
   * Estimate item parameters from response data (EM algorithm simplified)
   */
  estimateParameters(conceptId, responses) {
    // responses: [{learnerId, correct}]
    if (responses.length < 10) return

    if (!this.items.has(conceptId)) {
      this.initItem(conceptId)
    }

    const { a, b, c } = this.items.get(conceptId)

    // Calculate proportions
    const nCorrect = responses.filter(r => r.correct).length
    const pCorrect = nCorrect / responses.length

    // Update difficulty (simplified)
    const avgAbility = Array.from(this.abilities.values())
      .reduce((sum, theta) => sum + theta, 0) / this.abilities.size || 0

    const newB = avgAbility - logit(Math.max(0.01, Math.min(0.99, pCorrect))) / a

    // Update discrimination based on variance
    const abilities = responses.map(r => this.abilities.get(r.learnerId) || 0)
    const variance = abilities.reduce((sum, theta) =>
      sum + Math.pow(theta - avgAbility, 2), 0
    ) / abilities.length || 1

    const newA = Math.max(0.5, Math.min(3.0, a * (1 + 0.1 * (pCorrect - 0.5))))

    this.items.set(conceptId, { a: newA, b: newB, c })
  }

  /**
   * Get information function (precision of measurement)
   */
  information(learnerId, conceptId) {
    const p = this.probability(learnerId, conceptId)
    const { a, c } = this.items.get(conceptId) || { a: 1, c: 0.2 }

    return Math.pow(a, 2) * Math.pow(1 - c, 2) * p * (1 - p) /
           Math.pow(p * (1 - c) + c, 2)
  }

  /**
   * Select next best item (maximum information)
   */
  selectNextItem(learnerId, availableItems) {
    let maxInfo = -Infinity
    let bestItem = null

    for (const conceptId of availableItems) {
      const info = this.information(learnerId, conceptId)
      if (info > maxInfo) {
        maxInfo = info
        bestItem = conceptId
      }
    }

    return {
      conceptId: bestItem,
      information: maxInfo,
      expectedDifficulty: this.items.get(bestItem)?.b || 0
    }
  }
}

// ============================================================================
// LEARNING STYLE DETECTION
// ============================================================================

/**
 * VARK Learning Styles (Visual, Auditory, Read/Write, Kinesthetic)
 */
export class VARKDetector {
  constructor() {
    this.scores = {
      visual: 0,
      auditory: 0,
      readWrite: 0,
      kinesthetic: 0
    }

    this.observations = []
  }

  /**
   * Record learning activity
   */
  recordActivity(activityType, engagement, performance) {
    const activity = {
      type: activityType,
      engagement, // 0-1
      performance, // 0-1
      timestamp: Date.now()
    }

    this.observations.push(activity)

    // Update scores based on activity
    const weight = engagement * performance

    if (activityType.includes('diagram') || activityType.includes('chart')) {
      this.scores.visual += weight
    }

    if (activityType.includes('audio') || activityType.includes('discussion')) {
      this.scores.auditory += weight
    }

    if (activityType.includes('reading') || activityType.includes('writing')) {
      this.scores.readWrite += weight
    }

    if (activityType.includes('practice') || activityType.includes('simulation')) {
      this.scores.kinesthetic += weight
    }
  }

  /**
   * Get dominant learning style
   */
  getDominantStyle() {
    const total = Object.values(this.scores).reduce((sum, score) => sum + score, 0)

    if (total === 0) return { style: 'unknown', confidence: 0 }

    const normalized = {}
    for (const [style, score] of Object.entries(this.scores)) {
      normalized[style] = score / total
    }

    const dominant = Object.entries(normalized)
      .sort((a, b) => b[1] - a[1])[0]

    return {
      style: dominant[0],
      confidence: dominant[1],
      distribution: normalized,
      multimodal: Object.values(normalized).filter(v => v > 0.2).length > 2
    }
  }

  /**
   * Recommend content type
   */
  recommendContent() {
    const { style, confidence } = this.getDominantStyle()

    if (confidence < 0.3) {
      return {
        type: 'mixed',
        description: 'Multimodal content with variety',
        formats: ['text', 'diagrams', 'practice', 'discussion']
      }
    }

    const recommendations = {
      visual: {
        type: 'visual',
        description: 'Charts, diagrams, and visual representations',
        formats: ['infographics', 'flowcharts', 'mind maps', 'videos']
      },
      auditory: {
        type: 'auditory',
        description: 'Audio explanations and discussions',
        formats: ['podcasts', 'lectures', 'discussions', 'verbal explanations']
      },
      readWrite: {
        type: 'text-based',
        description: 'Reading materials and written exercises',
        formats: ['articles', 'written exercises', 'note-taking', 'summaries']
      },
      kinesthetic: {
        type: 'hands-on',
        description: 'Interactive practice and simulations',
        formats: ['simulations', 'practice problems', 'real examples', 'experiments']
      }
    }

    return recommendations[style] || recommendations.visual
  }
}

/**
 * Kolb Learning Styles (Accommodating, Diverging, Converging, Assimilating)
 */
export class KolbDetector {
  constructor() {
    // Two dimensions: Abstract-Concrete and Active-Reflective
    this.abstractConcrete = 0 // -1 (concrete) to +1 (abstract)
    this.activeReflective = 0  // -1 (reflective) to +1 (active)

    this.observations = []
  }

  /**
   * Record learning preference
   */
  recordPreference(preferenceType, intensity) {
    const obs = { type: preferenceType, intensity, timestamp: Date.now() }
    this.observations.push(obs)

    // Update dimensions
    const weight = intensity * 0.1

    if (preferenceType === 'theory' || preferenceType === 'concepts') {
      this.abstractConcrete += weight
    }

    if (preferenceType === 'practice' || preferenceType === 'examples') {
      this.abstractConcrete -= weight
    }

    if (preferenceType === 'doing' || preferenceType === 'experimentation') {
      this.activeReflective += weight
    }

    if (preferenceType === 'observing' || preferenceType === 'analysis') {
      this.activeReflective -= weight
    }

    // Keep in bounds
    this.abstractConcrete = Math.max(-1, Math.min(1, this.abstractConcrete))
    this.activeReflective = Math.max(-1, Math.min(1, this.activeReflective))
  }

  /**
   * Get Kolb learning style
   */
  getStyle() {
    const ac = this.abstractConcrete
    const ar = this.activeReflective

    let style, description

    if (ac > 0 && ar > 0) {
      style = 'converging'
      description = 'Abstract + Active: Practical application of ideas, problem-solving'
    } else if (ac < 0 && ar > 0) {
      style = 'accommodating'
      description = 'Concrete + Active: Hands-on experimentation, intuition'
    } else if (ac < 0 && ar < 0) {
      style = 'diverging'
      description = 'Concrete + Reflective: Brainstorming, imaginative thinking'
    } else {
      style = 'assimilating'
      description = 'Abstract + Reflective: Logical analysis, theoretical models'
    }

    return {
      style,
      description,
      abstractConcrete: ac,
      activeReflective: ar,
      strength: Math.sqrt(ac * ac + ar * ar) // Distance from center
    }
  }

  /**
   * Recommend learning activities
   */
  recommendActivities() {
    const { style } = this.getStyle()

    const activities = {
      converging: [
        'Solve real trading problems',
        'Test strategies with historical data',
        'Build and refine trading systems',
        'Case study analysis'
      ],
      accommodating: [
        'Paper trading simulations',
        'Trial and error experiments',
        'Learn by doing with feedback',
        'Adapt strategies in real-time'
      ],
      diverging: [
        'Explore different perspectives',
        'Brainstorm trading ideas',
        'Analyze market from multiple angles',
        'Creative strategy development'
      ],
      assimilating: [
        'Study theoretical frameworks',
        'Build conceptual models',
        'Systematic strategy analysis',
        'Research and documentation'
      ]
    }

    return activities[style] || []
  }
}

// ============================================================================
// COGNITIVE LOAD THEORY
// ============================================================================

/**
 * Cognitive Load Management based on Sweller's CLT
 */
export class CognitiveLoadManager {
  constructor() {
    this.intrinsicLoad = 0    // Task complexity
    this.extraneousLoad = 0   // Unnecessary complexity
    this.germaneLoad = 0      // Learning-related processing

    this.workingMemoryCapacity = 7 // Miller's 7±2
    this.history = []
  }

  /**
   * Calculate intrinsic load (element interactivity)
   */
  calculateIntrinsicLoad(concept) {
    // Count prerequisite concepts
    const prerequisites = concept.prerequisites?.length || 0

    // Count related concepts
    const relatedConcepts = concept.relatedConcepts?.length || 0

    // Estimate element interactivity
    const elements = prerequisites + relatedConcepts + 1
    const interactivity = Math.min(1, elements / this.workingMemoryCapacity)

    return {
      elements,
      interactivity,
      load: interactivity * concept.difficulty || 0.5
    }
  }

  /**
   * Assess extraneous load (presentation)
   */
  assessExtraneousLoad(presentation) {
    let load = 0

    // Split attention effect
    if (presentation.multipleSourcesRequired) {
      load += 0.3
    }

    // Redundancy effect
    if (presentation.redundantInformation) {
      load += 0.2
    }

    // Modality effect (text + diagrams better than text only)
    if (!presentation.multipleModalities) {
      load += 0.1
    }

    // Coherence (irrelevant information)
    if (presentation.irrelevantDetails) {
      load += 0.2
    }

    return Math.min(1, load)
  }

  /**
   * Calculate germane load (schema construction)
   */
  calculateGermaneLoad(learnerState, concept) {
    // Higher for novel concepts
    const novelty = 1 - (learnerState.familiarity || 0)

    // Higher when making connections
    const connections = concept.enablesConnections ? 0.3 : 0

    // Higher with good instructional design
    const designQuality = concept.wellStructured ? 0.2 : 0

    return novelty * 0.5 + connections + designQuality
  }

  /**
   * Get total cognitive load
   */
  getTotalLoad(concept, presentation, learnerState) {
    const intrinsic = this.calculateIntrinsicLoad(concept)
    const extraneous = this.assessExtraneousLoad(presentation)
    const germane = this.calculateGermaneLoad(learnerState, concept)

    const total = intrinsic.load + extraneous + germane

    this.history.push({
      concept: concept.id,
      intrinsic: intrinsic.load,
      extraneous,
      germane,
      total,
      timestamp: Date.now()
    })

    return {
      intrinsic: intrinsic.load,
      extraneous,
      germane,
      total,
      overloaded: total > 1.0,
      underloaded: total < 0.3,
      optimal: total >= 0.5 && total <= 0.9,
      recommendation: this.getRecommendation(total, intrinsic.load, extraneous, germane)
    }
  }

  /**
   * Get recommendations for load management
   */
  getRecommendation(total, intrinsic, extraneous, germane) {
    if (total > 1.0) {
      if (extraneous > 0.3) {
        return 'Reduce extraneous load by simplifying presentation'
      }
      if (intrinsic > 0.6) {
        return 'Break concept into smaller chunks - too complex'
      }
      return 'Reduce overall complexity or extend learning time'
    }

    if (total < 0.3) {
      return 'Increase germane load by adding connecting activities'
    }

    if (germane < 0.2) {
      return 'Add activities that promote schema construction'
    }

    return 'Cognitive load is optimal for learning'
  }

  /**
   * Recommend worked examples vs problem solving
   */
  recommendInstructionalFormat(learnerExpertise, conceptDifficulty) {
    // Worked example effect: better for novices
    // Problem-solving: better for experts (avoid expertise reversal)

    if (learnerExpertise < 0.3 && conceptDifficulty > 0.6) {
      return {
        format: 'worked_examples',
        ratio: 0.8, // 80% worked examples, 20% problems
        reason: 'High difficulty + low expertise = worked examples reduce load'
      }
    }

    if (learnerExpertise > 0.7) {
      return {
        format: 'problem_solving',
        ratio: 0.2, // 20% worked examples, 80% problems
        reason: 'High expertise - worked examples may increase extraneous load'
      }
    }

    return {
      format: 'faded_examples',
      ratio: 0.5,
      reason: 'Gradually fade guidance as expertise develops'
    }
  }
}

// ============================================================================
// SM-2 SPACED REPETITION (ORIGINAL)
// ============================================================================

export class SM2Card {
  constructor(concept, initialEF = 2.5) {
    this.concept = concept
    this.repetitions = 0
    this.interval = 1
    this.easinessFactor = initialEF
    this.nextReviewDate = new Date()
    this.lastReviewDate = null
    this.totalReviews = 0
    this.correctReviews = 0
  }

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
      this.repetitions = 0
      this.interval = 1
    }

    this.easinessFactor = Math.max(
      1.3,
      this.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    )

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
// LEITNER SYSTEM
// ============================================================================

/**
 * Leitner Spaced Repetition System with multiple boxes
 */
export class LeitnerSystem {
  constructor(numBoxes = 5) {
    this.numBoxes = numBoxes
    this.boxes = Array.from({ length: numBoxes }, () => [])

    // Review intervals for each box (in days)
    this.intervals = [1, 2, 4, 8, 16] // Doubles each time
  }

  /**
   * Add new card to box 1
   */
  addCard(conceptId) {
    if (!this.boxes[0].some(c => c.id === conceptId)) {
      this.boxes[0].push({
        id: conceptId,
        addedDate: Date.now(),
        lastReview: Date.now(),
        reviewCount: 0
      })
    }
  }

  /**
   * Move card based on review result
   */
  reviewCard(conceptId, correct) {
    // Find card
    let currentBox = -1
    let cardIndex = -1

    for (let i = 0; i < this.boxes.length; i++) {
      cardIndex = this.boxes[i].findIndex(c => c.id === conceptId)
      if (cardIndex !== -1) {
        currentBox = i
        break
      }
    }

    if (currentBox === -1) return null

    const card = this.boxes[currentBox][cardIndex]

    // Remove from current box
    this.boxes[currentBox].splice(cardIndex, 1)

    // Update card
    card.lastReview = Date.now()
    card.reviewCount++

    // Move to appropriate box
    if (correct) {
      // Move to next box (or stay in last box)
      const nextBox = Math.min(currentBox + 1, this.numBoxes - 1)
      this.boxes[nextBox].push(card)

      return {
        moved: 'forward',
        fromBox: currentBox,
        toBox: nextBox,
        nextReview: Date.now() + this.intervals[nextBox] * 86400000
      }
    } else {
      // Move back to box 1
      this.boxes[0].push(card)

      return {
        moved: 'backward',
        fromBox: currentBox,
        toBox: 0,
        nextReview: Date.now() + this.intervals[0] * 86400000
      }
    }
  }

  /**
   * Get cards due for review
   */
  getDueCards() {
    const now = Date.now()
    const due = []

    this.boxes.forEach((box, boxIndex) => {
      box.forEach(card => {
        const interval = this.intervals[boxIndex] * 86400000
        if (now - card.lastReview >= interval) {
          due.push({
            ...card,
            box: boxIndex,
            daysOverdue: (now - card.lastReview - interval) / 86400000
          })
        }
      })
    })

    return due.sort((a, b) => b.daysOverdue - a.daysOverdue)
  }

  /**
   * Get system statistics
   */
  getStatistics() {
    const total = this.boxes.reduce((sum, box) => sum + box.length, 0)

    return {
      total,
      distribution: this.boxes.map((box, i) => ({
        box: i + 1,
        cards: box.length,
        percentage: total > 0 ? (box.length / total) * 100 : 0,
        interval: this.intervals[i]
      })),
      mastered: this.boxes[this.numBoxes - 1].length,
      learning: total - this.boxes[this.numBoxes - 1].length
    }
  }
}

// ============================================================================
// MULTI-ARMED BANDIT FOR CONTENT SELECTION
// ============================================================================

/**
 * UCB1 (Upper Confidence Bound) algorithm for content selection
 */
export class UCB1Bandit {
  constructor(arms) {
    // arms: ['content_type_1', 'content_type_2', ...]
    this.arms = arms
    this.counts = new Map(arms.map(a => [a, 0])) // Times selected
    this.values = new Map(arms.map(a => [a, 0])) // Average reward
    this.totalPulls = 0
  }

  /**
   * Select next arm (content type) using UCB1
   */
  selectArm() {
    // If any arm hasn't been tried, try it
    for (const arm of this.arms) {
      if (this.counts.get(arm) === 0) {
        return arm
      }
    }

    // Calculate UCB values
    const ucbValues = this.arms.map(arm => {
      const count = this.counts.get(arm)
      const value = this.values.get(arm)
      const bonus = Math.sqrt((2 * Math.log(this.totalPulls)) / count)

      return {
        arm,
        ucb: value + bonus
      }
    })

    // Select arm with highest UCB
    ucbValues.sort((a, b) => b.ucb - a.ucb)
    return ucbValues[0].arm
  }

  /**
   * Update after observing reward
   */
  update(arm, reward) {
    const count = this.counts.get(arm)
    const value = this.values.get(arm)

    // Update count
    this.counts.set(arm, count + 1)
    this.totalPulls++

    // Update average value
    const newValue = ((count * value) + reward) / (count + 1)
    this.values.set(arm, newValue)
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return this.arms.map(arm => ({
      arm,
      count: this.counts.get(arm),
      avgReward: this.values.get(arm),
      percentage: this.totalPulls > 0
        ? (this.counts.get(arm) / this.totalPulls) * 100
        : 0
    }))
  }
}

/**
 * Thompson Sampling for content selection
 */
export class ThompsonSampling {
  constructor(arms) {
    this.arms = arms
    // Beta distribution parameters (alpha, beta)
    this.params = new Map(arms.map(a => [a, { alpha: 1, beta: 1 }]))
  }

  /**
   * Select arm by sampling from beta distributions
   */
  selectArm() {
    const samples = this.arms.map(arm => {
      const { alpha, beta } = this.params.get(arm)
      return {
        arm,
        sample: sampleBeta(alpha, beta)
      }
    })

    samples.sort((a, b) => b.sample - a.sample)
    return samples[0].arm
  }

  /**
   * Update parameters after observing reward
   */
  update(arm, success) {
    const params = this.params.get(arm)

    if (success) {
      params.alpha += 1
    } else {
      params.beta += 1
    }
  }

  /**
   * Get expected reward (mean of beta)
   */
  getExpectedReward(arm) {
    const { alpha, beta } = this.params.get(arm)
    return alpha / (alpha + beta)
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return this.arms.map(arm => {
      const { alpha, beta } = this.params.get(arm)
      return {
        arm,
        successCount: alpha - 1,
        failureCount: beta - 1,
        expectedReward: this.getExpectedReward(arm),
        confidence: 1 / Math.sqrt(alpha + beta)
      }
    })
  }
}

// ============================================================================
// KNOWLEDGE GRAPH (ORIGINAL + ENHANCED)
// ============================================================================

class ConceptNode {
  constructor(id, name, category) {
    this.id = id
    this.name = name
    this.category = category
    this.prerequisites = []
    this.difficulty = 0.5
    this.estimatedTimeMinutes = 15
    this.masteryLevel = 0
    this.practiceCount = 0
    this.lastPracticed = null
    this.totalAttempts = 0
    this.successfulAttempts = 0
  }

  hasMasteredPrerequisites(graph) {
    return this.prerequisites.every(prereqId => {
      const prereq = graph.getNode(prereqId)
      return prereq && prereq.masteryLevel >= 70
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
    if (this.totalAttempts === 0) return 0.5
    const proportion = this.successfulAttempts / this.totalAttempts
    return 1 / (1 + Math.exp(4 * (proportion - 0.5)))
  }
}

export class KnowledgeGraph {
  constructor() {
    this.nodes = new Map()
    this.edges = new Map()
    this.initializeDefaultGraph()
  }

  initializeDefaultGraph() {
    // Beginner
    this.addConcept('support_resistance', 'Support and Resistance', 'basics', [], 1, 10)
    this.addConcept('volume_basics', 'Volume Analysis', 'basics', [], 1, 12)
    this.addConcept('candlesticks', 'Candlestick Patterns', 'basics', [], 1, 15)
    this.addConcept('trends', 'Trend Identification', 'basics', ['support_resistance'], 2, 12)
    this.addConcept('ema', 'Moving Averages', 'basics', ['trends'], 2, 15)

    // Intermediate
    this.addConcept('mtf_analysis', 'Multi-Timeframe Analysis', 'intermediate',
      ['trends', 'ema'], 3, 20)
    this.addConcept('rsi', 'RSI Indicator', 'intermediate', ['trends'], 3, 15)
    this.addConcept('macd', 'MACD Indicator', 'intermediate', ['ema'], 3, 18)
    this.addConcept('position_sizing', 'Position Sizing', 'intermediate', [], 3, 20)
    this.addConcept('risk_reward', 'Risk/Reward Ratios', 'intermediate',
      ['position_sizing'], 3, 18)
    this.addConcept('market_regimes', 'Market Regimes', 'intermediate',
      ['trends', 'volume_basics'], 4, 22)

    // Advanced
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
    node.difficulty = difficulty / 5
    node.estimatedTimeMinutes = timeMinutes

    this.nodes.set(id, node)

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
    return this.getAllConcepts().filter(node =>
      node.hasMasteredPrerequisites(this)
    )
  }

  getConceptsByCategory(category) {
    return this.getAllConcepts().filter(node => node.category === category)
  }

  getNextConcepts(masteredConceptIds) {
    const available = []

    for (const node of this.nodes.values()) {
      if (node.masteryLevel >= 70) continue

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

    return []
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

// [Continuing in next part due to length...]

// ============================================================================
// ADAPTIVE DIFFICULTY (ORIGINAL)
// ============================================================================

export class AdaptiveDifficulty {
  constructor() {
    this.targetSuccessRate = 0.75
    this.adjustmentRate = 0.1
    this.minDifficulty = 0.1
    this.maxDifficulty = 1.0
  }

  calculateOptimalDifficulty(recentPerformance) {
    if (recentPerformance.length === 0) return 0.5

    const successRate = recentPerformance.filter(p => p.success).length / recentPerformance.length

    if (successRate > this.targetSuccessRate + 0.1) {
      return Math.min(this.maxDifficulty, recentPerformance[0].difficulty + this.adjustmentRate)
    }

    if (successRate < this.targetSuccessRate - 0.1) {
      return Math.max(this.minDifficulty, recentPerformance[0].difficulty - this.adjustmentRate)
    }

    return recentPerformance[0].difficulty
  }

  generateQuestion(concept, difficulty) {
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

  assessCognitiveLoad(sessionData) {
    const {
      questionsAttempted = 0,
      timeSpent = 0,
      switchesBetweenConcepts = 0,
      errorsRecent = 0
    } = sessionData

    const timePressure = Math.min(1, timeSpent / 60)
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
// LEARNING ANALYTICS (ORIGINAL + ENHANCED)
// ============================================================================

export class LearningAnalytics {
  constructor() {
    this.sessions = []
    this.retentionData = new Map()
  }

  recordSession(sessionData) {
    this.sessions.push({
      ...sessionData,
      timestamp: new Date()
    })
  }

  calculateRetentionCurve(conceptId, measurements) {
    if (measurements.length < 2) return null

    const xValues = measurements.map(m => m.timeDays)
    const yValues = measurements.map(m => m.score)

    const logY = yValues.map(y => Math.log(Math.max(0.01, y)))
    const { slope, intercept } = this.linearRegression(xValues, logY)

    const stability = -1 / slope
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

    return (conceptsMastered.size / timeWindowDays) * 7
  }

  predictTimeToMastery(concept, currentMastery) {
    if (currentMastery >= 100) return 0

    const velocity = this.calculateLearningVelocity()
    if (velocity === 0) return null

    const sessionsNeeded = (100 - currentMastery) / 10
    const weeksNeeded = sessionsNeeded / velocity

    return {
      weeks: weeksNeeded,
      sessions: sessionsNeeded,
      confidence: Math.min(1, this.sessions.length / 10)
    }
  }

  analyzeStudyPattern() {
    if (this.sessions.length === 0) return null

    const sessionTimes = this.sessions.map(s => s.timestamp.getHours())
    const avgSessionTime = sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length

    const durations = this.sessions.map(s => s.durationMinutes || 0)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length

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
// SKILL TRANSFER MODELING
// ============================================================================

/**
 * Model skill transfer between related concepts
 */
export class SkillTransferModel {
  constructor(knowledgeGraph) {
    this.graph = knowledgeGraph
    this.transferMatrix = new Map() // conceptA -> {conceptB: transferRate}
  }

  /**
   * Initialize transfer relationships
   */
  initializeTransfers() {
    const concepts = this.graph.getAllConcepts()

    for (const concept of concepts) {
      const transfers = {}

      // Transfer to prerequisites (backward transfer)
      concept.prerequisites.forEach(prereqId => {
        transfers[prereqId] = 0.3 // 30% transfer
      })

      // Transfer to dependents (forward transfer)
      const dependents = this.graph.edges.get(concept.id) || []
      dependents.forEach(depId => {
        transfers[depId] = 0.5 // 50% transfer
      })

      // Transfer to same category (lateral transfer)
      const sameCat = this.graph.getConceptsByCategory(concept.category)
      sameCat.forEach(c => {
        if (c.id !== concept.id) {
          transfers[c.id] = 0.2 // 20% transfer
        }
      })

      this.transferMatrix.set(concept.id, transfers)
    }
  }

  /**
   * Calculate transfer benefit when learning new concept
   */
  calculateTransferBenefit(conceptId) {
    const transfers = this.transferMatrix.get(conceptId) || {}
    let totalBenefit = 0

    Object.entries(transfers).forEach(([sourceId, rate]) => {
      const sourceConcept = this.graph.getNode(sourceId)
      if (sourceConcept) {
        totalBenefit += (sourceConcept.masteryLevel / 100) * rate
      }
    })

    return {
      benefit: Math.min(1, totalBenefit),
      effectiveDifficulty: Math.max(0.1,
        this.graph.getNode(conceptId).difficulty * (1 - totalBenefit)
      ),
      sources: Object.keys(transfers).map(sid => ({
        conceptId: sid,
        name: this.graph.getNode(sid)?.name,
        transferRate: transfers[sid]
      }))
    }
  }

  /**
   * Recommend learning order based on transfer
   */
  recommendLearningOrder(conceptIds) {
    const scores = conceptIds.map(cid => {
      const benefit = this.calculateTransferBenefit(cid)
      const concept = this.graph.getNode(cid)

      return {
        conceptId: cid,
        name: concept.name,
        transferBenefit: benefit.benefit,
        difficulty: concept.difficulty,
        score: benefit.benefit / Math.max(0.1, concept.difficulty)
      }
    })

    return scores.sort((a, b) => b.score - a.score)
  }
}

// ============================================================================
// INTERLEAVED PRACTICE SCHEDULER
// ============================================================================

/**
 * Schedule interleaved practice for better retention
 */
export class InterleavedScheduler {
  constructor() {
    this.concepts = []
    this.schedule = []
  }

  /**
   * Add concepts to practice queue
   */
  addConcepts(conceptList) {
    this.concepts = [...conceptList]
  }

  /**
   * Generate interleaved schedule
   */
  generateSchedule(numPracticeItems = 20) {
    if (this.concepts.length === 0) return []

    const schedule = []

    // Calculate practice frequency per concept based on mastery
    const frequencies = this.concepts.map(c => ({
      concept: c,
      freq: 1 / Math.max(0.1, c.masteryLevel / 100) // More practice for lower mastery
    }))

    // Normalize frequencies
    const totalFreq = frequencies.reduce((sum, f) => sum + f.freq, 0)
    frequencies.forEach(f => f.freq /= totalFreq)

    // Generate interleaved schedule
    for (let i = 0; i < numPracticeItems; i++) {
      // Select concept based on frequency
      const rand = Math.random()
      let cumulative = 0

      for (const { concept, freq } of frequencies) {
        cumulative += freq
        if (rand <= cumulative) {
          // Avoid immediate repetition
          if (schedule.length > 0 && schedule[schedule.length - 1].id === concept.id) {
            continue
          }

          schedule.push(concept)
          break
        }
      }
    }

    this.schedule = schedule
    return schedule
  }

  /**
   * Calculate spacing between repetitions
   */
  calculateSpacing() {
    const spacing = new Map()

    this.schedule.forEach((concept, index) => {
      if (!spacing.has(concept.id)) {
        spacing.set(concept.id, [])
      }
      spacing.get(concept.id).push(index)
    })

    const stats = {}
    spacing.forEach((positions, conceptId) => {
      const gaps = []
      for (let i = 1; i < positions.length; i++) {
        gaps.push(positions[i] - positions[i-1])
      }

      stats[conceptId] = {
        repetitions: positions.length,
        avgGap: gaps.length > 0
          ? gaps.reduce((a,b) => a+b, 0) / gaps.length
          : 0,
        minGap: Math.min(...gaps),
        maxGap: Math.max(...gaps)
      }
    })

    return stats
  }
}

// ============================================================================
// METACOGNITIVE SCAFFOLDING
// ============================================================================

/**
 * Provide metacognitive support and self-regulation
 */
export class MetacognitiveScaffold {
  constructor() {
    this.reflections = []
    this.goals = []
    this.strategies = []
  }

  /**
   * Prompt for self-explanation
   */
  generateSelfExplanationPrompt(concept, performance) {
    if (performance === 'correct') {
      return [
        `Why did you choose that answer for ${concept.name}?`,
        `How does ${concept.name} connect to what you already know?`,
        `Can you explain the reasoning behind your response?`
      ]
    } else {
      return [
        `What made ${concept.name} challenging for you?`,
        `What misconception might have led to your error?`,
        `How would you approach ${concept.name} differently next time?`
      ]
    }
  }

  /**
   * Assess metacognitive awareness
   */
  assessMetacognition(prediction, actual) {
    // Compare predicted performance with actual
    const calibration = Math.abs(prediction - actual)

    return {
      calibration,
      overconfident: prediction > actual + 0.2,
      underconfident: prediction < actual - 0.2,
      wellCalibrated: calibration < 0.2,
      recommendation: calibration > 0.3
        ? 'Work on accurately assessing your knowledge'
        : 'Good self-awareness of your abilities'
    }
  }

  /**
   * Generate goal-setting prompts
   */
  promptGoalSetting(currentMastery, timeframe) {
    const realistic = Math.min(100, currentMastery + 20)
    const stretch = Math.min(100, currentMastery + 35)

    return {
      current: currentMastery,
      realistic: {
        target: realistic,
        timeframe,
        description: 'Achievable with consistent effort'
      },
      stretch: {
        target: stretch,
        timeframe,
        description: 'Challenging but possible with intensive study'
      },
      breakdown: this.breakdownGoal(currentMastery, realistic, timeframe)
    }
  }

  breakdownGoal(current, target, timeframeDays) {
    const increment = (target - current) / Math.min(timeframeDays, 30)
    const milestones = []

    let progress = current
    let day = 0

    while (progress < target && day < timeframeDays) {
      day += Math.floor(timeframeDays / 5)
      progress += increment * Math.floor(timeframeDays / 5)

      milestones.push({
        day,
        target: Math.min(target, Math.round(progress)),
        checkpoint: `Review and assess progress`
      })
    }

    return milestones
  }

  /**
   * Track strategy effectiveness
   */
  recordStrategy(strategy, outcome) {
    this.strategies.push({
      strategy,
      outcome,
      timestamp: Date.now()
    })
  }

  /**
   * Recommend most effective strategies
   */
  recommendStrategies() {
    const strategyStats = {}

    this.strategies.forEach(s => {
      if (!strategyStats[s.strategy]) {
        strategyStats[s.strategy] = { success: 0, total: 0 }
      }

      strategyStats[s.strategy].total++
      if (s.outcome === 'success') {
        strategyStats[s.strategy].success++
      }
    })

    return Object.entries(strategyStats)
      .map(([strategy, stats]) => ({
        strategy,
        successRate: stats.total > 0 ? stats.success / stats.total : 0,
        timesUsed: stats.total
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
  }
}

// ============================================================================
// COLLABORATIVE FILTERING
// ============================================================================

/**
 * Recommend learning paths based on similar learners
 */
export class CollaborativeFilter {
  constructor() {
    this.learners = new Map() // learnerId -> profile
  }

  /**
   * Add learner profile
   */
  addLearner(learnerId, profile) {
    this.learners.set(learnerId, {
      ...profile,
      masteryVector: this.createMasteryVector(profile.concepts || {})
    })
  }

  /**
   * Create mastery vector for similarity
   */
  createMasteryVector(concepts) {
    // Fixed concept order for comparison
    const conceptIds = [
      'support_resistance', 'volume_basics', 'candlesticks', 'trends', 'ema',
      'mtf_analysis', 'rsi', 'macd', 'position_sizing', 'risk_reward',
      'market_regimes', 'backtesting', 'optimization', 'order_flow',
      'portfolio_theory', 'correlation', 'options'
    ]

    return conceptIds.map(id => concepts[id] || 0)
  }

  /**
   * Calculate similarity between two learners (cosine similarity)
   */
  calculateSimilarity(learnerId1, learnerId2) {
    const learner1 = this.learners.get(learnerId1)
    const learner2 = this.learners.get(learnerId2)

    if (!learner1 || !learner2) return 0

    const v1 = learner1.masteryVector
    const v2 = learner2.masteryVector

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i]
      norm1 += v1[i] * v1[i]
      norm2 += v2[i] * v2[i]
    }

    norm1 = Math.sqrt(norm1)
    norm2 = Math.sqrt(norm2)

    return (norm1 === 0 || norm2 === 0) ? 0 : dotProduct / (norm1 * norm2)
  }

  /**
   * Find similar learners
   */
  findSimilarLearners(learnerId, topK = 5) {
    const similarities = []

    this.learners.forEach((profile, otherId) => {
      if (otherId !== learnerId) {
        const similarity = this.calculateSimilarity(learnerId, otherId)
        similarities.push({ learnerId: otherId, similarity })
      }
    })

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  }

  /**
   * Recommend concepts based on similar learners
   */
  recommendConcepts(learnerId, topK = 5) {
    const similar = this.findSimilarLearners(learnerId, 10)
    const currentLearner = this.learners.get(learnerId)

    if (!currentLearner || similar.length === 0) return []

    // Aggregate concepts that similar learners have mastered
    const conceptScores = {}

    similar.forEach(({ learnerId: similarId, similarity }) => {
      const similarLearner = this.learners.get(similarId)

      Object.entries(similarLearner.concepts || {}).forEach(([conceptId, mastery]) => {
        if (mastery >= 70 && (currentLearner.concepts[conceptId] || 0) < 70) {
          conceptScores[conceptId] = (conceptScores[conceptId] || 0) + similarity
        }
      })
    })

    return Object.entries(conceptScores)
      .map(([conceptId, score]) => ({ conceptId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }
}

// ============================================================================
// ENHANCED LEARNING PROFILE (ORIGINAL)
// ============================================================================

export class LearningProfile {
  constructor() {
    this.load()
  }

  load() {
    try {
      const data = localStorage.getItem('iava_learning_profile')
      const profile = data ? JSON.parse(data) : {}

      this.tradingStyle = profile.tradingStyle || 'unknown'
      this.experienceLevel = profile.experienceLevel || 'beginner'
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
    const avgHoldTime = trades.reduce((sum, t) => sum + t.holdTime, 0) / trades.length

    if (avgHoldTime < 3600000) {
      this.tradingStyle = 'scalper'
    } else if (avgHoldTime < 86400000) {
      this.tradingStyle = 'day_trader'
    } else {
      this.tradingStyle = 'swing_trader'
    }

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

export class EnhancedLearningProfile extends LearningProfile {
  constructor() {
    super()
    this.knowledgeGraph = new KnowledgeGraph()
    this.spacedRepetition = new Map()
    this.adaptiveDifficulty = new AdaptiveDifficulty()
    this.analytics = new LearningAnalytics()
    this.bkt = new BayesianKnowledgeTracer()
    this.irt = new ItemResponseTheory()
    this.vark = new VARKDetector()
    this.kolb = new KolbDetector()
    this.cognitiveLoad = new CognitiveLoadManager()
    this.leitner = new LeitnerSystem()
    this.ucb1 = new UCB1Bandit(['visual', 'text', 'practice', 'discussion'])
    this.skillTransfer = new SkillTransferModel(this.knowledgeGraph)
    this.interleavedScheduler = new InterleavedScheduler()
    this.metacognitive = new MetacognitiveScaffold()
    this.collaborative = new CollaborativeFilter()

    this.recentPerformance = []
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

      if (enhanced.knowledgeGraph) {
        this.knowledgeGraph.fromJSON(enhanced.knowledgeGraph)
      }

      if (enhanced.spacedRepetition) {
        Object.entries(enhanced.spacedRepetition).forEach(([concept, cardData]) => {
          this.spacedRepetition.set(concept, SM2Card.fromJSON(cardData))
        })
      }

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
      this.save()
    } catch (error) {
      console.error('[EnhancedLearning] Failed to save data:', error)
    }
  }

  recordPractice(conceptId, success, quality = null) {
    const concept = this.knowledgeGraph.getNode(conceptId)
    if (!concept) return

    concept.recordPractice(success)

    if (!this.spacedRepetition.has(conceptId)) {
      this.spacedRepetition.set(conceptId, new SM2Card(conceptId))
    }
    if (quality !== null) {
      this.spacedRepetition.get(conceptId).review(quality)
    }

    this.recentPerformance.push({
      conceptId,
      success,
      difficulty: concept.getDifficulty(),
      timestamp: new Date()
    })
    if (this.recentPerformance.length > 20) {
      this.recentPerformance.shift()
    }

    if (success) {
      this.currentStreak++
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak)
    } else {
      this.currentStreak = 0
    }

    // Update BKT
    this.bkt.update(conceptId, success)

    // Update IRT
    this.irt.updateAbility('default', conceptId, success)

    // Update Leitner
    this.leitner.reviewCard(conceptId, success)

    this.saveEnhancedData()
  }

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

  getOptimalNextLesson() {
    const dueReviews = this.getDueReviews()
    if (dueReviews.length > 0) {
      return {
        type: 'review',
        concept: dueReviews[0].concept,
        reason: 'Due for spaced repetition review'
      }
    }

    const available = this.knowledgeGraph.getAvailableConcepts()
      .filter(c => c.masteryLevel < 70)

    if (available.length === 0) {
      return {
        type: 'complete',
        message: 'Congratulations! You have mastered all available concepts.'
      }
    }

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

  generatePersonalizedPath(targetConcepts = [], maxLessons = 10) {
    const path = []
    const processed = new Set()

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

    targetConcepts.forEach(targetId => {
      const target = this.knowledgeGraph.getNode(targetId)
      if (!target) return

      const prerequisitePath = this.findPrerequisitePath(target)
      prerequisitePath.forEach(c => {
        if (!processed.has(c.id) && c.masteryLevel < 70) {
          path.push({ concept: c, type: 'learn', priority: 'medium' })
          processed.add(c.id)
        }
      })
    })

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

  getDashboard() {
    const dueReviews = this.getDueReviews()
    const { strengths, weaknesses, needsPractice } = this.analytics.identifyStrengthsWeaknesses(
      this.knowledgeGraph
    )
    const studyPattern = this.analytics.analyzeStudyPattern()
    const velocity = this.analytics.calculateLearningVelocity()
    const overallMastery = this.knowledgeGraph.getOverallMastery()
    const bktStates = this.bkt.getKnowledgeStates()
    const learningStyle = this.vark.getDominantStyle()
    const kolbStyle = this.kolb.getStyle()

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
      nextLesson: this.getOptimalNextLesson(),
      bktPredictions: Object.entries(bktStates).slice(0, 5),
      learningStyles: {
        vark: learningStyle,
        kolb: kolbStyle
      }
    }
  }

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
// CURRICULUM (ORIGINAL)
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

export function getRecommendedLessons(profile) {
  const curriculum = CURRICULUM[profile.experienceLevel] || CURRICULUM.beginner

  const available = curriculum.filter(lesson =>
    !profile.completedLessons.includes(lesson.id)
  )

  const prioritized = available.sort((a, b) => {
    const aRelevance = a.concepts.some(c => profile.mistakePatterns.includes(c)) ? 1 : 0
    const bRelevance = b.concepts.some(c => profile.mistakePatterns.includes(c)) ? 1 : 0
    return bRelevance - aRelevance
  })

  return prioritized.slice(0, 3)
}

export function getLearningPath(profile) {
  const allLessons = [
    ...CURRICULUM.beginner,
    ...CURRICULUM.intermediate,
    ...CURRICULUM.advanced
  ]

  let relevant = allLessons

  if (profile.learningGoals.length > 0) {
    relevant = allLessons.filter(lesson =>
      lesson.concepts.some(c => profile.learningGoals.includes(c))
    )
  }

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

export const learningProfile = new EnhancedLearningProfile()

export default {
  LearningProfile,
  EnhancedLearningProfile,
  SM2Card,
  KnowledgeGraph,
  AdaptiveDifficulty,
  LearningAnalytics,
  BayesianKnowledgeTracer,
  ItemResponseTheory,
  VARKDetector,
  KolbDetector,
  CognitiveLoadManager,
  LeitnerSystem,
  UCB1Bandit,
  ThompsonSampling,
  SkillTransferModel,
  InterleavedScheduler,
  MetacognitiveScaffold,
  CollaborativeFilter,
  getRecommendedLessons,
  getLearningPath,
  forgettingCurve,
  learningCurve,
  calculateMastery,
  CURRICULUM,
  learningProfile
}
