/**
 * AVA Mind Personality System
 * 
 * NEW FILE - Add to src/services/
 * 
 * Provides:
 * - 6 Trading Archetypes (Surgeon, Sniper, Momentum Rider, Contrarian, Guardian, Hunter)
 * - 8 Personality Dimensions
 * - Real-time Emotional State Detection
 * - Behavioral Learning from Trade Patterns
 * - AI Context Generation for personalized responses
 */

// ============================================================================
// TRADING ARCHETYPES - The 6 Trading Personalities
// ============================================================================

export const TRADING_ARCHETYPES = {
  surgeon: {
    id: 'surgeon',
    name: 'The Surgeon',
    emoji: '🔪',
    tagline: 'Precise cuts, clean exits',
    description: 'You trade like a surgeon - methodical, precise, emotionally detached. Every entry and exit is calculated.',
    strengths: ['Precision entries/exits', 'Excellent risk management', 'Consistent execution'],
    weaknesses: ['May miss fast opportunities', 'Can over-analyze', 'Sometimes too rigid'],
    idealStrategies: ['Swing trading', 'Options spreads', 'Technical breakouts'],
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-500',
    weights: { riskTolerance: 45, decisionSpeed: 35, analyticalDepth: 85, emotionalControl: 90, lossAversion: 60, timeHorizon: 65, contrarianScore: 40, confidenceLevel: 70 }
  },
  sniper: {
    id: 'sniper',
    name: 'The Sniper',
    emoji: '🎯',
    tagline: 'One shot, one kill',
    description: 'Patient and precise. You wait for the perfect setup and strike with high conviction when conditions align.',
    strengths: ['High win rate', 'Capital efficient', 'Patient and disciplined'],
    weaknesses: ['Few trades per month', 'Opportunity cost', 'Can wait too long'],
    idealStrategies: ['Breakout trading', 'Earnings plays', 'Catalyst-driven'],
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-500',
    weights: { riskTolerance: 55, decisionSpeed: 25, analyticalDepth: 90, emotionalControl: 85, lossAversion: 70, timeHorizon: 50, contrarianScore: 45, confidenceLevel: 85 }
  },
  momentumRider: {
    id: 'momentumRider',
    name: 'The Momentum Rider',
    emoji: '🏄',
    tagline: 'Ride the wave',
    description: 'You thrive in motion. Catching trends early and riding them is your superpower.',
    strengths: ['Captures big moves', 'Adapts to market', 'High activity level'],
    weaknesses: ['Whipsaws hurt', 'Can overtrade', 'Late entries sometimes'],
    idealStrategies: ['Trend following', 'Breakout momentum', 'Sector rotation'],
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    weights: { riskTolerance: 70, decisionSpeed: 80, analyticalDepth: 50, emotionalControl: 55, lossAversion: 35, timeHorizon: 35, contrarianScore: 25, confidenceLevel: 75 }
  },
  contrarian: {
    id: 'contrarian',
    name: 'The Contrarian',
    emoji: '🔄',
    tagline: 'Buy fear, sell greed',
    description: 'You see opportunity where others see danger. Fading the crowd is your edge.',
    strengths: ['Catches reversals', 'Value opportunities', 'Independent thinking'],
    weaknesses: ['Early entries', 'Fighting trends', 'Lonely positions'],
    idealStrategies: ['Mean reversion', 'Oversold bounces', 'Panic buying'],
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
    weights: { riskTolerance: 65, decisionSpeed: 50, analyticalDepth: 75, emotionalControl: 80, lossAversion: 45, timeHorizon: 55, contrarianScore: 95, confidenceLevel: 80 }
  },
  guardian: {
    id: 'guardian',
    name: 'The Guardian',
    emoji: '🛡️',
    tagline: 'Protect and grow',
    description: 'Capital preservation is your priority. Steady growth over home runs, every time.',
    strengths: ['Capital preservation', 'Steady returns', 'Sleep well at night'],
    weaknesses: ['Misses big winners', 'Over-hedging', 'Slower growth'],
    idealStrategies: ['Dividend investing', 'Covered calls', 'Index funds'],
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-500',
    weights: { riskTolerance: 25, decisionSpeed: 30, analyticalDepth: 70, emotionalControl: 95, lossAversion: 90, timeHorizon: 85, contrarianScore: 35, confidenceLevel: 60 }
  },
  hunter: {
    id: 'hunter',
    name: 'The Hunter',
    emoji: '🏹',
    tagline: 'Asymmetric opportunities',
    description: 'You hunt for big game. Comfortable with losses in pursuit of outsized wins.',
    strengths: ['Captures outliers', 'High upside potential', 'Fearless execution'],
    weaknesses: ['Higher drawdowns', 'Volatility in returns', 'Emotional swings'],
    idealStrategies: ['Options buying', 'Small caps', 'Speculative plays'],
    color: '#EF4444',
    gradient: 'from-red-500 to-rose-500',
    weights: { riskTolerance: 90, decisionSpeed: 75, analyticalDepth: 45, emotionalControl: 50, lossAversion: 20, timeHorizon: 30, contrarianScore: 60, confidenceLevel: 85 }
  }
}

// ============================================================================
// PERSONALITY DIMENSIONS - The 8 Core Traits
// ============================================================================

export const PERSONALITY_DIMENSIONS = {
  riskTolerance: {
    id: 'riskTolerance',
    name: 'Risk Tolerance',
    emoji: '🎯',
    description: 'Comfort with uncertainty and potential losses',
    low: 'Conservative - prefers certainty',
    high: 'Aggressive - embraces volatility',
    color: '#EF4444'
  },
  decisionSpeed: {
    id: 'decisionSpeed',
    name: 'Decision Speed',
    emoji: '⚡',
    description: 'How quickly you make trading decisions',
    low: 'Deliberate - needs time to analyze',
    high: 'Quick - acts on instinct',
    color: '#F59E0B'
  },
  analyticalDepth: {
    id: 'analyticalDepth',
    name: 'Analytical Depth',
    emoji: '🔬',
    description: 'Amount of data needed before acting',
    low: 'Intuitive - goes with gut',
    high: 'Data-driven - needs full picture',
    color: '#8B5CF6'
  },
  emotionalControl: {
    id: 'emotionalControl',
    name: 'Emotional Control',
    emoji: '🧘',
    description: 'Ability to manage emotions during volatility',
    low: 'Reactive - emotions affect decisions',
    high: 'Stoic - stays calm under pressure',
    color: '#10B981'
  },
  lossAversion: {
    id: 'lossAversion',
    name: 'Loss Aversion',
    emoji: '⚖️',
    description: 'How strongly you react to losses vs gains',
    low: 'Loss-tolerant - part of the game',
    high: 'Loss-averse - losses hurt deeply',
    color: '#3B82F6'
  },
  timeHorizon: {
    id: 'timeHorizon',
    name: 'Time Horizon',
    emoji: '📅',
    description: 'Preferred holding period for trades',
    low: 'Short-term - minutes to hours',
    high: 'Long-term - weeks to months',
    color: '#06B6D4'
  },
  contrarianScore: {
    id: 'contrarianScore',
    name: 'Contrarian Score',
    emoji: '🔄',
    description: 'Tendency to go against the crowd',
    low: 'Trend follower - goes with flow',
    high: 'Contrarian - fades the crowd',
    color: '#EC4899'
  },
  confidenceLevel: {
    id: 'confidenceLevel',
    name: 'Confidence Level',
    emoji: '💪',
    description: 'Certainty in your trading decisions',
    low: 'Cautious - second-guesses often',
    high: 'Confident - trusts own analysis',
    color: '#14B8A6'
  }
}

// ============================================================================
// EMOTIONAL STATES - Real-time Mood Detection
// ============================================================================

export const EMOTIONAL_STATES = {
  confident: {
    id: 'confident',
    name: 'Confident',
    emoji: '😊',
    color: '#10B981',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    description: 'Trading with conviction and clarity',
    advice: 'Great state for executing your plan. Trust your analysis.',
    tradingImpact: '+15% better decisions'
  },
  neutral: {
    id: 'neutral',
    name: 'Neutral',
    emoji: '😐',
    color: '#64748B',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    description: 'Balanced emotional state',
    advice: 'Good baseline. Stay objective and patient.',
    tradingImpact: 'Baseline performance'
  },
  anxious: {
    id: 'anxious',
    name: 'Anxious',
    emoji: '😰',
    color: '#F59E0B',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    description: 'Uncertain, may be reactive',
    advice: 'Consider reducing position size. Wait for clarity.',
    tradingImpact: '-20% decision quality'
  },
  fearful: {
    id: 'fearful',
    name: 'Fearful',
    emoji: '😨',
    color: '#EF4444',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    description: 'Risk of panic decisions',
    advice: "Step back. Fear often signals opportunity, but also mistakes.",
    tradingImpact: '-35% decision quality'
  },
  greedy: {
    id: 'greedy',
    name: 'Greedy',
    emoji: '🤑',
    color: '#8B5CF6',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/30',
    description: 'May be overextending',
    advice: "Lock in some profits. Don't let winners become losers.",
    tradingImpact: '-25% risk management'
  },
  frustrated: {
    id: 'frustrated',
    name: 'Frustrated',
    emoji: '😤',
    color: '#F97316',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    description: 'Risk of revenge trading',
    advice: 'Take a break. Revenge trades rarely work out.',
    tradingImpact: '-40% decision quality'
  }
}

// ============================================================================
// ARCHETYPE DETERMINATION
// ============================================================================

/**
 * Determine trading archetype based on personality profile
 * @param {Object} profile - Personality profile with 8 dimensions (0-100 each)
 * @returns {Object} Primary and secondary archetypes with confidence scores
 */
export function determineArchetype(profile) {
  if (!profile) return null
  
  const scores = {}
  
  // Calculate match score for each archetype
  Object.entries(TRADING_ARCHETYPES).forEach(([id, archetype]) => {
    let totalDiff = 0
    let count = 0
    
    Object.entries(archetype.weights).forEach(([trait, targetValue]) => {
      const userValue = profile[trait] || 50
      const diff = Math.abs(userValue - targetValue)
      totalDiff += diff
      count++
    })
    
    // Convert to 0-100 score (lower diff = higher score)
    const avgDiff = totalDiff / count
    scores[id] = Math.max(0, 100 - avgDiff)
  })
  
  // Sort by score
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({
      archetype: TRADING_ARCHETYPES[id],
      score: Math.round(score)
    }))
  
  return {
    primary: sorted[0],
    secondary: sorted[1],
    tertiary: sorted[2],
    all: sorted
  }
}

// ============================================================================
// EMOTIONAL STATE DETECTION
// ============================================================================

/**
 * Detect current emotional state based on recent activity
 * @param {Array} recentTrades - Last 5-10 trades
 * @param {Object} recentActivity - Portfolio checks, app activity
 * @param {Object} marketConditions - Current market state
 * @returns {Object} Emotional state with intensity
 */
export function detectEmotionalState(recentTrades = [], recentActivity = {}, marketConditions = {}) {
  const signals = {
    confident: 0,
    neutral: 20, // Base neutral score
    anxious: 0,
    fearful: 0,
    greedy: 0,
    frustrated: 0
  }
  
  // Analyze recent trade outcomes
  if (recentTrades.length > 0) {
    const recentWins = recentTrades.filter(t => t.outcome === 'WIN').length
    const recentLosses = recentTrades.filter(t => t.outcome === 'LOSS').length
    const winRate = recentTrades.length > 0 ? recentWins / recentTrades.length : 0.5
    
    // Win streak → confident or greedy
    if (recentWins >= 3 && recentLosses === 0) {
      signals.confident += 35
      signals.greedy += 25
    }
    // Loss streak → fearful or frustrated
    else if (recentLosses >= 3 && recentWins === 0) {
      signals.fearful += 30
      signals.frustrated += 40
    }
    // Mixed results
    else if (recentTrades.length >= 3) {
      signals.neutral += 15
      if (winRate < 0.4) signals.anxious += 20
      if (winRate > 0.6) signals.confident += 20
    }
    
    // Check for revenge trading pattern (quick trades after losses)
    const closedTrades = recentTrades.filter(t => t.exitTime)
    if (closedTrades.length >= 2) {
      const lastTrade = closedTrades[0]
      const prevTrade = closedTrades[1]
      if (prevTrade.outcome === 'LOSS') {
        const timeBetween = lastTrade.entryTime - prevTrade.exitTime
        if (timeBetween < 5 * 60 * 1000) { // < 5 min after loss
          signals.frustrated += 35
        }
      }
    }
    
    // P&L impact
    const totalPnL = recentTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    if (totalPnL < -500) signals.fearful += 20
    if (totalPnL > 1000) signals.greedy += 15
  }
  
  // App activity signals
  if (recentActivity.checksLast30Min > 15) {
    signals.anxious += 30
  } else if (recentActivity.checksLast30Min > 8) {
    signals.anxious += 15
  }
  
  // Market conditions impact
  if (marketConditions.vix > 30) {
    signals.fearful += 20
    signals.anxious += 15
  } else if (marketConditions.vix > 25) {
    signals.anxious += 10
  }
  
  if (marketConditions.dayChange < -3) {
    signals.fearful += 25
  } else if (marketConditions.dayChange < -1.5) {
    signals.anxious += 15
  } else if (marketConditions.dayChange > 2) {
    signals.greedy += 20
    signals.confident += 10
  }
  
  // Find dominant state
  const sorted = Object.entries(signals).sort((a, b) => b[1] - a[1])
  const [topState, topScore] = sorted[0]
  const [secondState, secondScore] = sorted[1]
  
  // Calculate intensity (0-1)
  const intensity = Math.min(1, topScore / 60)
  
  return {
    state: EMOTIONAL_STATES[topState],
    intensity,
    score: topScore,
    secondary: secondScore > 20 ? EMOTIONAL_STATES[secondState] : null,
    signals,
    timestamp: Date.now()
  }
}

// ============================================================================
// BEHAVIORAL LEARNING - Learn Personality from Trades
// ============================================================================

/**
 * Analyze a trade to extract personality signals
 * @param {Object} trade - Completed trade
 * @param {Object} existingProfile - Current personality profile
 * @returns {Object} Personality adjustments
 */
export function analyzeTradeForPersonality(trade, existingProfile = {}) {
  const signals = {}
  
  // Hold duration analysis
  if (trade.holdDuration) {
    const holdMinutes = trade.holdDuration
    
    if (holdMinutes < 30) {
      signals.decisionSpeed = { delta: +4, reason: 'Very quick trade' }
      signals.timeHorizon = { delta: -4, reason: 'Sub-hour hold' }
    } else if (holdMinutes < 60) {
      signals.decisionSpeed = { delta: +2, reason: 'Quick execution' }
      signals.timeHorizon = { delta: -2, reason: 'Short hold' }
    } else if (holdMinutes > 7 * 24 * 60) {
      signals.timeHorizon = { delta: +5, reason: 'Week+ holding period' }
      signals.decisionSpeed = { delta: -2, reason: 'Patient approach' }
    } else if (holdMinutes > 24 * 60) {
      signals.timeHorizon = { delta: +3, reason: 'Multi-day hold' }
    }
  }
  
  // Loss handling
  if (trade.outcome === 'LOSS') {
    const lossPercent = Math.abs(trade.pnlPercent || 0)
    
    if (lossPercent < 2) {
      signals.emotionalControl = { delta: +4, reason: 'Quick loss cut at 2%' }
      signals.lossAversion = { delta: +3, reason: 'Disciplined stop loss' }
    } else if (lossPercent < 5) {
      signals.emotionalControl = { delta: +2, reason: 'Controlled loss exit' }
    } else if (lossPercent > 15) {
      signals.emotionalControl = { delta: -5, reason: 'Large loss allowed to run' }
      signals.lossAversion = { delta: -4, reason: 'Held through major drawdown' }
    } else if (lossPercent > 10) {
      signals.emotionalControl = { delta: -3, reason: 'Significant loss' }
    }
  }
  
  // Win handling
  if (trade.outcome === 'WIN') {
    const gainPercent = trade.pnlPercent || 0
    
    if (gainPercent < 3) {
      signals.riskTolerance = { delta: -2, reason: 'Quick profit taking' }
      signals.lossAversion = { delta: +2, reason: 'Secured small gain' }
    } else if (gainPercent > 25) {
      signals.riskTolerance = { delta: +4, reason: 'Let big winner run 25%+' }
      signals.confidenceLevel = { delta: +3, reason: 'High conviction hold' }
    } else if (gainPercent > 15) {
      signals.riskTolerance = { delta: +2, reason: 'Held for solid gain' }
      signals.confidenceLevel = { delta: +2, reason: 'Good conviction' }
    }
  }
  
  // Position size (if available)
  if (trade.positionValue && trade.portfolioValue) {
    const positionPercent = (trade.positionValue / trade.portfolioValue) * 100
    
    if (positionPercent > 25) {
      signals.riskTolerance = { delta: +5, reason: 'Large position (25%+ of portfolio)' }
      signals.confidenceLevel = { delta: +4, reason: 'High conviction sizing' }
    } else if (positionPercent > 15) {
      signals.riskTolerance = { delta: +3, reason: 'Significant position size' }
    } else if (positionPercent < 3) {
      signals.riskTolerance = { delta: -2, reason: 'Small test position' }
    }
  }
  
  // Contrarian behavior
  if (trade.marketCondition) {
    if (trade.marketCondition === 'bearish' && trade.action === 'BUY') {
      signals.contrarianScore = { delta: +6, reason: 'Bought in bearish market' }
    } else if (trade.marketCondition === 'bullish' && trade.action === 'SELL') {
      signals.contrarianScore = { delta: +4, reason: 'Sold in bullish market' }
    } else if (trade.marketCondition === 'bullish' && trade.action === 'BUY') {
      signals.contrarianScore = { delta: -2, reason: 'Followed bullish trend' }
    }
  }
  
  return signals
}

/**
 * Update personality profile with new signals
 * @param {Object} existingProfile - Current profile
 * @param {Object} signals - Signals from analyzeTradeForPersonality
 * @param {number} weight - Learning rate (0-1)
 * @returns {Object} Updated profile
 */
export function updateProfileWithSignals(existingProfile, signals, weight = 0.1) {
  const updated = { ...existingProfile }
  
  Object.entries(signals).forEach(([trait, signal]) => {
    const current = updated[trait] || 50
    const delta = signal.delta * weight
    // Clamp between 0-100
    updated[trait] = Math.max(0, Math.min(100, current + delta))
  })
  
  updated.lastUpdated = Date.now()
  updated.dataPoints = (existingProfile.dataPoints || 0) + 1
  
  return updated
}

// ============================================================================
// ONBOARDING → PROFILE CONVERSION
// ============================================================================

/**
 * Calculate personality profile from onboarding answers
 * @param {Object} answers - Answers from onboarding quiz
 * @returns {Object} Initial personality profile
 */
export function calculatePersonalityFromOnboarding(answers) {
  const profile = {
    riskTolerance: 50,
    decisionSpeed: 50,
    analyticalDepth: 50,
    emotionalControl: 50,
    lossAversion: 50,
    timeHorizon: 50,
    contrarianScore: 50,
    confidenceLevel: 50,
    dataPoints: 0,
    source: 'onboarding',
    createdAt: Date.now(),
    lastUpdated: Date.now()
  }
  
  // Q1: Portfolio drops 15%
  const q1Map = {
    buy_more: { riskTolerance: 85, emotionalControl: 80, contrarianScore: 75, lossAversion: 25 },
    hold: { riskTolerance: 55, emotionalControl: 65, lossAversion: 55 },
    reduce: { riskTolerance: 35, lossAversion: 70, emotionalControl: 50 },
    sell_all: { riskTolerance: 15, lossAversion: 90, emotionalControl: 30 }
  }
  if (answers.q1 && q1Map[answers.q1]) {
    Object.assign(profile, q1Map[answers.q1])
  }
  
  // Q2: Decision speed
  const q2Map = {
    immediately: { decisionSpeed: 90, analyticalDepth: 25 },
    same_day: { decisionSpeed: 70, analyticalDepth: 45 },
    few_days: { decisionSpeed: 40, analyticalDepth: 70 },
    week_plus: { decisionSpeed: 20, analyticalDepth: 90 }
  }
  if (answers.q2 && q2Map[answers.q2]) {
    profile.decisionSpeed = q2Map[answers.q2].decisionSpeed
    profile.analyticalDepth = q2Map[answers.q2].analyticalDepth
  }
  
  // Q3: Analysis depth
  const q3Map = {
    price_only: { analyticalDepth: 20 },
    basic_charts: { analyticalDepth: 45 },
    full_technicals: { analyticalDepth: 75 },
    everything: { analyticalDepth: 95 }
  }
  if (answers.q3 && q3Map[answers.q3]) {
    profile.analyticalDepth = Math.round((profile.analyticalDepth + q3Map[answers.q3].analyticalDepth) / 2)
  }
  
  // Q4: Loss reaction
  const q4Map = {
    no_big_deal: { lossAversion: 20, emotionalControl: 85, riskTolerance: 75 },
    uncomfortable: { lossAversion: 50, emotionalControl: 60 },
    very_upset: { lossAversion: 75, emotionalControl: 40 },
    cant_sleep: { lossAversion: 95, emotionalControl: 20 }
  }
  if (answers.q4 && q4Map[answers.q4]) {
    profile.lossAversion = q4Map[answers.q4].lossAversion
    profile.emotionalControl = Math.round((profile.emotionalControl + q4Map[answers.q4].emotionalControl) / 2)
    if (q4Map[answers.q4].riskTolerance) {
      profile.riskTolerance = Math.round((profile.riskTolerance + q4Map[answers.q4].riskTolerance) / 2)
    }
  }
  
  // Q5: Time horizon
  const q5Map = {
    minutes_hours: { timeHorizon: 15 },
    days: { timeHorizon: 40 },
    weeks: { timeHorizon: 65 },
    months_years: { timeHorizon: 90 }
  }
  if (answers.q5 && q5Map[answers.q5]) {
    profile.timeHorizon = q5Map[answers.q5].timeHorizon
  }
  
  // Q6: Crowd behavior
  const q6Map = {
    follow_trend: { contrarianScore: 15, confidenceLevel: 45 },
    consider_both: { contrarianScore: 45, confidenceLevel: 55 },
    independent: { contrarianScore: 70, confidenceLevel: 75 },
    opposite: { contrarianScore: 95, confidenceLevel: 85 }
  }
  if (answers.q6 && q6Map[answers.q6]) {
    profile.contrarianScore = q6Map[answers.q6].contrarianScore
    profile.confidenceLevel = q6Map[answers.q6].confidenceLevel
  }
  
  return profile
}

// ============================================================================
// AI CONTEXT GENERATION
// ============================================================================

/**
 * Generate personality-aware context for AI prompts
 * @param {Object} profile - Personality profile
 * @param {Object} archetype - Determined archetype
 * @param {Object} emotionalState - Current emotional state
 * @returns {string} System prompt context
 */
export function generateAVAMindContext(profile, archetype, emotionalState = null) {
  if (!profile || !archetype) return ''
  
  const a = archetype.primary?.archetype
  if (!a) return ''
  
  let context = `
## AVA Mind - Personalized Trading Context

**Trader Archetype:** ${a.emoji} ${a.name} (${archetype.primary.score}% match)
"${a.tagline}"

**Personality Profile:**
- Risk Tolerance: ${profile.riskTolerance}/100 ${profile.riskTolerance > 65 ? '(aggressive)' : profile.riskTolerance < 35 ? '(conservative)' : '(moderate)'}
- Decision Speed: ${profile.decisionSpeed}/100 ${profile.decisionSpeed > 65 ? '(quick, intuitive)' : '(deliberate, analytical)'}
- Emotional Control: ${profile.emotionalControl}/100
- Time Horizon: ${profile.timeHorizon}/100 ${profile.timeHorizon > 65 ? '(long-term focus)' : '(short-term focus)'}
- Contrarian Score: ${profile.contrarianScore}/100 ${profile.contrarianScore > 65 ? '(fades crowd)' : '(follows trends)'}

**Communication Preferences:**
- ${profile.analyticalDepth > 65 ? 'Provide detailed technical analysis with data' : 'Keep explanations concise and actionable'}
- ${profile.confidenceLevel > 65 ? 'Give direct recommendations' : 'Present balanced pros/cons'}
- ${profile.contrarianScore > 65 ? 'Include contrarian perspectives' : 'Focus on consensus plays'}
- ${a.name}s respond well to: ${a.idealStrategies.join(', ')}
`

  if (emotionalState?.state) {
    context += `
**Current Emotional State:** ${emotionalState.state.emoji} ${emotionalState.state.name}
- ${emotionalState.state.advice}
- Trading impact: ${emotionalState.state.tradingImpact}
`
  }

  return context.trim()
}

// ============================================================================
// FORECAST FIT ASSESSMENT - AVA Mind + Chronos Integration
// ============================================================================

/**
 * Assess how well a forecast aligns with user's trading personality
 * @param {Object} forecast - Chronos forecast data
 * @param {Object} profile - User's personality profile
 * @param {Object} archetype - User's trading archetype
 * @returns {Object} Fit assessment with score, message, and advice
 */
export function assessForecastFit(forecast, profile, archetype = null) {
  if (!forecast || !profile) {
    return {
      score: 50,
      fit: 'neutral',
      message: 'Unable to assess fit',
      advice: null,
      factors: []
    }
  }

  const factors = []
  let fitScore = 50 // Start neutral

  const confidence = forecast.confidence || 50
  const percentChange = Math.abs(forecast.percentChange || 0)
  const direction = (forecast.direction || '').toLowerCase()
  const horizon = forecast.horizon || 24

  // 1. Confidence vs Risk Tolerance
  // High risk tolerance = comfortable with lower confidence
  // Low risk tolerance = needs high confidence
  const confidenceThreshold = profile.lossAversion > 65 ? 75 : profile.lossAversion > 40 ? 65 : 55

  if (confidence >= confidenceThreshold) {
    fitScore += 15
    factors.push({
      factor: 'Confidence Level',
      impact: 'positive',
      detail: `${confidence}% confidence meets your ${profile.lossAversion > 65 ? 'conservative' : 'moderate'} threshold`
    })
  } else if (confidence < confidenceThreshold - 15) {
    fitScore -= 15
    factors.push({
      factor: 'Confidence Level',
      impact: 'negative',
      detail: `${confidence}% confidence is below your comfort level of ${confidenceThreshold}%`
    })
  }

  // 2. Move Size vs Risk Tolerance
  // High risk tolerance = excited by big moves
  // Low risk tolerance = prefers smaller, safer moves
  const idealMoveSize = profile.riskTolerance > 70 ? 5 : profile.riskTolerance > 40 ? 3 : 1.5

  if (percentChange >= idealMoveSize) {
    if (profile.riskTolerance > 60) {
      fitScore += 10
      factors.push({
        factor: 'Move Size',
        impact: 'positive',
        detail: `${percentChange.toFixed(1)}% predicted move matches your appetite for bigger opportunities`
      })
    } else if (profile.riskTolerance < 40) {
      fitScore -= 10
      factors.push({
        factor: 'Move Size',
        impact: 'caution',
        detail: `${percentChange.toFixed(1)}% move may be larger than your typical comfort zone`
      })
    }
  }

  // 3. Time Horizon Match
  // Short horizon preference = wants quick predictions
  // Long horizon preference = comfortable with longer forecasts
  const preferredHorizon = profile.timeHorizon > 65 ? 48 : profile.timeHorizon > 35 ? 24 : 8
  const horizonMatch = Math.abs(horizon - preferredHorizon) < 12

  if (horizonMatch) {
    fitScore += 10
    factors.push({
      factor: 'Time Horizon',
      impact: 'positive',
      detail: `${horizon}h forecast aligns with your ${profile.timeHorizon > 65 ? 'longer-term' : 'shorter-term'} style`
    })
  } else if (horizon > preferredHorizon * 2) {
    fitScore -= 5
    factors.push({
      factor: 'Time Horizon',
      impact: 'neutral',
      detail: `${horizon}h is longer than your typical ${preferredHorizon}h preference`
    })
  }

  // 4. Contrarian Assessment
  // High contrarian score = prefers setups against recent trend
  if (profile.contrarianScore > 65) {
    // Contrarians like predictions that go against recent momentum
    if (direction === 'bullish') {
      factors.push({
        factor: 'Contrarian View',
        impact: 'insight',
        detail: 'Consider if this bullish call goes against or with the crowd'
      })
    }
  }

  // 5. Archetype-specific advice
  let archetypeAdvice = null
  if (archetype?.primary?.archetype) {
    const a = archetype.primary.archetype

    switch (a.id) {
      case 'surgeon':
        if (confidence < 70) {
          archetypeAdvice = 'As a Surgeon, you prefer higher precision. Wait for a cleaner setup.'
          fitScore -= 5
        } else {
          archetypeAdvice = 'This setup has the precision you value. Execute with your usual discipline.'
          fitScore += 5
        }
        break
      case 'sniper':
        if (confidence >= 80 && percentChange >= 3) {
          archetypeAdvice = 'High conviction opportunity detected. This could be worth your single shot.'
          fitScore += 15
        } else {
          archetypeAdvice = 'Not quite a sniper-grade setup. Consider waiting for stronger conviction.'
        }
        break
      case 'momentumRider':
        if (percentChange >= 3) {
          archetypeAdvice = 'Good wave forming. Size in if momentum confirms.'
          fitScore += 10
        } else {
          archetypeAdvice = 'Small predicted move. You might want a bigger wave to ride.'
        }
        break
      case 'contrarian':
        archetypeAdvice = 'Check if this prediction aligns with or opposes crowd sentiment.'
        break
      case 'guardian':
        if (confidence >= 75) {
          archetypeAdvice = 'Decent confidence for a measured position. Keep size conservative.'
          fitScore += 5
        } else {
          archetypeAdvice = 'Confidence below your capital preservation standards. Consider passing.'
          fitScore -= 10
        }
        break
      case 'hunter':
        if (percentChange >= 5) {
          archetypeAdvice = 'Asymmetric opportunity! This is the big game you hunt for.'
          fitScore += 15
        } else {
          archetypeAdvice = 'Move size may not justify the hunt. Look for bigger prey.'
        }
        break
    }
  }

  // Calculate final fit level
  let fit, message
  if (fitScore >= 70) {
    fit = 'excellent'
    message = 'This forecast strongly aligns with your trading style'
  } else if (fitScore >= 55) {
    fit = 'good'
    message = 'This forecast fits your style reasonably well'
  } else if (fitScore >= 40) {
    fit = 'neutral'
    message = 'This forecast has mixed alignment with your style'
  } else {
    fit = 'caution'
    message = 'This forecast may not match your typical trading approach'
  }

  return {
    score: Math.max(0, Math.min(100, fitScore)),
    fit,
    message,
    advice: archetypeAdvice,
    factors,
    recommendation: archetypeAdvice || message
  }
}

/**
 * Get personality-based confidence adjustment
 * @param {number} baseConfidence - Raw forecast confidence
 * @param {Object} profile - User personality profile
 * @returns {Object} Adjusted confidence with reasoning
 */
export function getPersonalityAdjustedConfidence(baseConfidence, profile) {
  if (!profile) return { adjusted: baseConfidence, reason: null }

  // Loss-averse traders need higher confidence to feel comfortable
  // Risk-tolerant traders are comfortable with lower confidence
  const lossAversion = profile.lossAversion || 50
  const riskTolerance = profile.riskTolerance || 50

  let adjustment = 0
  let reason = null

  if (lossAversion > 70) {
    // Very loss averse - penalize lower confidence more
    adjustment = baseConfidence < 70 ? -10 : 0
    reason = baseConfidence < 70 ? 'Below your conservative threshold' : 'Meets your safety standards'
  } else if (riskTolerance > 70) {
    // High risk tolerance - boost moderate confidence
    adjustment = baseConfidence >= 60 ? 5 : 0
    reason = baseConfidence >= 60 ? 'Acceptable for your risk appetite' : null
  }

  return {
    adjusted: Math.max(0, Math.min(100, baseConfidence + adjustment)),
    reason,
    baseConfidence
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  TRADING_ARCHETYPES,
  PERSONALITY_DIMENSIONS,
  EMOTIONAL_STATES,
  determineArchetype,
  detectEmotionalState,
  analyzeTradeForPersonality,
  updateProfileWithSignals,
  calculatePersonalityFromOnboarding,
  generateAVAMindContext,
  assessForecastFit,
  getPersonalityAdjustedConfidence
}
