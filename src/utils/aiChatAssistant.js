/**
 * AI Chat Assistant - PhD Elite Edition
 *
 * Comprehensive conversational trading assistant with:
 * - Multi-turn dialogue management
 * - Context-aware responses
 * - Trading knowledge base integration
 * - Market analysis on demand
 * - Action recommendations
 * - Educational content delivery
 * - Risk assessment and warnings
 * - Personality and tone customization
 * - Response quality optimization
 *
 * @module aiChatAssistant
 */

import { callAIGateway } from './aiGateway'

// ============================================================================
// MESSAGE TYPES AND INTENTS
// ============================================================================

const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
}

const CONVERSATION_INTENTS = {
  QUESTION: 'question', // Ask about trading concepts
  ANALYSIS: 'analysis', // Request market/stock analysis
  RECOMMENDATION: 'recommendation', // Ask for trade recommendations
  EDUCATION: 'education', // Learn about strategy/concept
  GREETING: 'greeting', // Casual conversation
  HELP: 'help', // Ask for help/guidance
  FEEDBACK: 'feedback' // Provide feedback on trades
}

/**
 * Detect conversation intent
 */
function detectIntent(message) {
  const lower = message.toLowerCase()

  // Greeting patterns
  const greetingPatterns = [
    /^(hi|hello|hey|howdy|greetings)/i,
    /(good morning|good afternoon|good evening)/i
  ]
  if (greetingPatterns.some(p => p.test(lower))) {
    return CONVERSATION_INTENTS.GREETING
  }

  // Help patterns
  if (/\b(help|how do i|how to|guide|tutorial)\b/i.test(lower)) {
    return CONVERSATION_INTENTS.HELP
  }

  // Analysis patterns
  const analysisPatterns = [
    /\b(analyze|analysis|look at|check|review|what do you think about)\b/i,
    /\b(bullish|bearish|trend|support|resistance)\b/i
  ]
  if (analysisPatterns.some(p => p.test(lower))) {
    return CONVERSATION_INTENTS.ANALYSIS
  }

  // Recommendation patterns
  if (/\b(should i|recommend|suggest|good (trade|buy|sell)|entry|exit)\b/i.test(lower)) {
    return CONVERSATION_INTENTS.RECOMMENDATION
  }

  // Education patterns
  if (/\b(what is|explain|teach|learn about|how does.*work)\b/i.test(lower)) {
    return CONVERSATION_INTENTS.EDUCATION
  }

  // Feedback patterns
  if (/\b(trade (went|was)|result|outcome|profit|loss|my trade)\b/i.test(lower)) {
    return CONVERSATION_INTENTS.FEEDBACK
  }

  // Default to question
  return CONVERSATION_INTENTS.QUESTION
}

// ============================================================================
// TRADING KNOWLEDGE BASE
// ============================================================================

const KNOWLEDGE_BASE = {
  indicators: {
    rsi: {
      name: 'RSI (Relative Strength Index)',
      description: 'Momentum oscillator measuring speed and magnitude of price changes',
      range: '0-100',
      interpretation: {
        oversold: 'Below 30 suggests oversold conditions - potential buying opportunity',
        overbought: 'Above 70 suggests overbought conditions - potential selling pressure',
        divergence: 'Price/RSI divergence can signal trend reversal'
      },
      usage: 'Best combined with trend analysis and support/resistance levels'
    },
    macd: {
      name: 'MACD (Moving Average Convergence Divergence)',
      description: 'Trend-following momentum indicator using EMA relationships',
      components: 'MACD line (12-26 EMA), Signal line (9 EMA), Histogram',
      interpretation: {
        crossover: 'MACD crossing above signal = bullish, below = bearish',
        histogram: 'Growing histogram = strengthening momentum',
        divergence: 'Price/MACD divergence signals potential reversal'
      },
      usage: 'Effective for identifying trend direction and momentum shifts'
    },
    ema: {
      name: 'EMA (Exponential Moving Average)',
      description: 'Weighted moving average giving more importance to recent prices',
      common: 'EMA-8, EMA-21, EMA-50, EMA-200',
      interpretation: {
        crossover: 'Short EMA crossing above long EMA = bullish signal',
        support: 'Price bouncing off EMA suggests support',
        trend: 'Price above EMA = uptrend, below = downtrend'
      },
      usage: 'Key for trend identification and dynamic support/resistance'
    },
    adx: {
      name: 'ADX (Average Directional Index)',
      description: 'Measures trend strength regardless of direction',
      range: '0-100',
      interpretation: {
        weak: 'ADX below 20 = weak or no trend',
        moderate: 'ADX 20-40 = developing trend',
        strong: 'ADX above 40 = strong trend',
        verStrong: 'ADX above 60 = very strong trend'
      },
      usage: 'Combine with +DI/-DI for direction, ADX for strength'
    }
  },

  strategies: {
    trendFollowing: {
      name: 'Trend Following',
      description: 'Trade in direction of established trend',
      entry: 'Enter on pullbacks to moving averages in uptrends',
      exit: 'Exit when trend shows signs of reversal',
      bestMarkets: 'Works best in trending markets with clear direction',
      riskManagement: 'Use trailing stops to protect profits'
    },
    meanReversion: {
      name: 'Mean Reversion',
      description: 'Trade expecting price to return to average',
      entry: 'Enter when price deviates significantly from mean (2+ std dev)',
      exit: 'Exit when price returns to mean or shows reversal',
      bestMarkets: 'Effective in ranging, non-trending markets',
      riskManagement: 'Tight stops as trades can continue trending'
    },
    breakout: {
      name: 'Breakout Trading',
      description: 'Trade when price breaks through key levels',
      entry: 'Enter on confirmed breakout with volume confirmation',
      exit: 'Target prior swing high/low or use trailing stop',
      bestMarkets: 'Consolidation periods before strong moves',
      riskManagement: 'False breakouts common - wait for confirmation'
    },
    momentum: {
      name: 'Momentum Trading',
      description: 'Trade stocks showing strong directional movement',
      entry: 'Enter on continuation patterns in strong trends',
      exit: 'Exit when momentum indicators show divergence',
      bestMarkets: 'High volatility periods with strong trends',
      riskManagement: 'Fast-paced - require quick decision making'
    }
  },

  concepts: {
    support: 'Price level where buying interest is strong enough to prevent further decline',
    resistance: 'Price level where selling interest prevents further advance',
    trend: 'General direction of price movement over time (uptrend, downtrend, sideways)',
    volatility: 'Measure of price variation - higher volatility = higher risk and opportunity',
    volume: 'Number of shares traded - confirms price moves and indicates interest',
    divergence: 'When price and indicator move in opposite directions - signals potential reversal',
    confluence: 'Multiple indicators/levels align - increases probability of trade success',
    riskReward: 'Ratio of potential profit to potential loss - aim for 1:2 or better'
  },

  marketConditions: {
    trending: {
      description: 'Market showing clear directional movement',
      strategies: ['Trend following', 'Momentum', 'Breakout'],
      indicators: ['ADX above 25', 'Clear higher highs/lows', 'Strong volume']
    },
    ranging: {
      description: 'Market moving sideways between support/resistance',
      strategies: ['Mean reversion', 'Range trading'],
      indicators: ['ADX below 20', 'Price bouncing between levels', 'Lower volume']
    },
    volatile: {
      description: 'Large price swings with increased uncertainty',
      strategies: ['Reduce position size', 'Wider stops', 'Consider waiting'],
      indicators: ['High ATR', 'Large candlesticks', 'News-driven moves']
    },
    lowVolatility: {
      description: 'Calm market with small price movements',
      strategies: ['Tighten stops', 'Consider options', 'Wait for catalyst'],
      indicators: ['Low ATR', 'Small candlesticks', 'Narrow ranges']
    }
  }
}

/**
 * Search knowledge base
 */
function searchKnowledge(query) {
  const lower = query.toLowerCase()
  const results = []

  // Search indicators
  for (const [key, indicator] of Object.entries(KNOWLEDGE_BASE.indicators)) {
    if (lower.includes(key) || lower.includes(indicator.name.toLowerCase())) {
      results.push({ type: 'indicator', key, ...indicator })
    }
  }

  // Search strategies
  for (const [key, strategy] of Object.entries(KNOWLEDGE_BASE.strategies)) {
    if (lower.includes(key) || lower.includes(strategy.name.toLowerCase())) {
      results.push({ type: 'strategy', key, ...strategy })
    }
  }

  // Search concepts
  for (const [key, description] of Object.entries(KNOWLEDGE_BASE.concepts)) {
    if (lower.includes(key)) {
      results.push({ type: 'concept', key, name: key, description })
    }
  }

  return results
}

// ============================================================================
// CONVERSATION MANAGER
// ============================================================================

/**
 * Conversation session management
 */
export class ConversationSession {
  constructor(userId = 'default') {
    this.userId = userId
    this.messages = []
    this.context = {
      currentSymbol: null,
      currentStrategy: null,
      userProfile: {
        experienceLevel: 'intermediate', // beginner, intermediate, advanced
        riskTolerance: 'moderate', // conservative, moderate, aggressive
        tradingStyle: 'swing', // scalp, day, swing, position
        preferredTimeframe: '1d'
      }
    }
    this.load()
  }

  /**
   * Add message to conversation
   */
  addMessage(content, type = MESSAGE_TYPES.USER, metadata = {}) {
    const message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date().toISOString(),
      metadata
    }

    this.messages.push(message)

    // Limit history to last 50 messages
    if (this.messages.length > 50) {
      this.messages = this.messages.slice(-50)
    }

    this.save()
    return message
  }

  /**
   * Get recent messages for context
   */
  getRecentMessages(count = 10) {
    return this.messages.slice(-count)
  }

  /**
   * Update context
   */
  updateContext(updates) {
    this.context = { ...this.context, ...updates }
    this.save()
  }

  /**
   * Clear conversation
   */
  clear() {
    this.messages = []
    this.save()
  }

  /**
   * Save to localStorage
   */
  save() {
    try {
      localStorage.setItem(
        `iava_chat_${this.userId}`,
        JSON.stringify({
          messages: this.messages,
          context: this.context
        })
      )
    } catch (error) {
      console.error('[Chat] Failed to save session:', error)
    }
  }

  /**
   * Load from localStorage
   */
  load() {
    try {
      const data = localStorage.getItem(`iava_chat_${this.userId}`)
      if (data) {
        const parsed = JSON.parse(data)
        this.messages = parsed.messages || []
        this.context = { ...this.context, ...parsed.context }
      }
    } catch (error) {
      console.error('[Chat] Failed to load session:', error)
    }
  }

  /**
   * Export conversation
   */
  export() {
    return {
      userId: this.userId,
      messages: this.messages,
      context: this.context,
      exportedAt: new Date().toISOString()
    }
  }
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

/**
 * Get system prompt based on intent and context
 */
function getSystemPrompt(intent, context) {
  const basePrompt = `You are an expert trading assistant with deep knowledge of technical analysis, trading strategies, and risk management. Your responses should be:
- Concise (2-3 sentences max unless explanation needed)
- Actionable with specific recommendations
- Data-driven when possible
- Risk-aware with appropriate disclaimers
- Educational when explaining concepts

User Profile:
- Experience: ${context.userProfile.experienceLevel}
- Risk Tolerance: ${context.userProfile.riskTolerance}
- Trading Style: ${context.userProfile.tradingStyle}
- Preferred Timeframe: ${context.userProfile.preferredTimeframe}`

  const intentPrompts = {
    [CONVERSATION_INTENTS.GREETING]: `
${basePrompt}

Respond warmly but professionally. Offer to help with trading analysis, strategy, or education.`,

    [CONVERSATION_INTENTS.QUESTION]: `
${basePrompt}

Answer the trading question directly and concisely. Use examples when helpful.`,

    [CONVERSATION_INTENTS.ANALYSIS]: `
${basePrompt}

Provide technical analysis focusing on:
1. Current trend and key levels
2. Indicator signals (RSI, MACD, volume)
3. Risk/reward assessment
4. Actionable conclusion

Be objective and cite specific technical factors.`,

    [CONVERSATION_INTENTS.RECOMMENDATION]: `
${basePrompt}

Provide trade recommendations with:
1. Clear entry/exit levels
2. Risk management (stop loss)
3. Rationale based on technicals
4. Risk disclaimer

Never guarantee outcomes. Present probabilities.`,

    [CONVERSATION_INTENTS.EDUCATION]: `
${basePrompt}

Explain the concept clearly:
1. Definition in simple terms
2. Practical application
3. Example if helpful
4. Common mistakes to avoid

Tailor complexity to user's experience level (${context.userProfile.experienceLevel}).`,

    [CONVERSATION_INTENTS.HELP]: `
${basePrompt}

Guide the user effectively:
1. Understand their specific need
2. Provide step-by-step guidance
3. Offer relevant examples
4. Suggest next steps`,

    [CONVERSATION_INTENTS.FEEDBACK]: `
${basePrompt}

Review their trade experience:
1. Acknowledge the outcome
2. Analyze what worked/didn't work
3. Extract learning lessons
4. Suggest improvements

Be supportive but honest about mistakes.`
  }

  return intentPrompts[intent] || basePrompt
}

// ============================================================================
// RESPONSE GENERATION
// ============================================================================

/**
 * Generate response using AI
 */
async function generateAIResponse(userMessage, session, intent) {
  // Build context from recent messages
  const recentMessages = session.getRecentMessages(6)
  const conversationHistory = recentMessages
    .map(msg => `${msg.type === MESSAGE_TYPES.USER ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n')

  // Search knowledge base for relevant info
  const knowledgeResults = searchKnowledge(userMessage)
  let knowledgeContext = ''

  if (knowledgeResults.length > 0) {
    knowledgeContext = '\n\nRelevant Knowledge:\n' +
      knowledgeResults
        .slice(0, 3)
        .map(item => {
          if (item.type === 'indicator') {
            return `${item.name}: ${item.description}`
          }
          if (item.type === 'strategy') {
            return `${item.name}: ${item.description}. Entry: ${item.entry}`
          }
          if (item.type === 'concept') {
            return `${item.name}: ${item.description}`
          }
          return ''
        })
        .join('\n')
  }

  // Add current symbol context if available
  let symbolContext = ''
  if (session.context.currentSymbol) {
    symbolContext = `\n\nCurrent Symbol: ${session.context.currentSymbol}`
  }

  const systemPrompt = getSystemPrompt(intent, session.context)

  const prompt = `${conversationHistory ? 'Conversation History:\n' + conversationHistory + '\n\n' : ''}${knowledgeContext}${symbolContext}

Current User Message: ${userMessage}

Provide a helpful response following the guidelines in your system prompt. Keep it concise but actionable.`

  try {
    const response = await callAIGateway({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      cacheContext: true
    })

    return response.content
  } catch (error) {
    console.error('[Chat] AI response generation failed:', error)
    return generateFallbackResponse(userMessage, intent, knowledgeResults)
  }
}

/**
 * Generate fallback response when AI unavailable
 */
function generateFallbackResponse(userMessage, intent, knowledgeResults) {
  if (intent === CONVERSATION_INTENTS.GREETING) {
    return "Hello! I'm your trading assistant. I can help with technical analysis, trading strategies, and educational content. How can I assist you today?"
  }

  if (intent === CONVERSATION_INTENTS.HELP) {
    return "I can help you with:\n• Technical analysis of stocks\n• Trading strategy recommendations\n• Educational content on indicators and concepts\n• Risk management guidance\n• Market condition assessment\n\nWhat would you like help with?"
  }

  if (knowledgeResults.length > 0) {
    const first = knowledgeResults[0]

    if (first.type === 'indicator') {
      return `${first.name}: ${first.description}. ${first.usage || ''}`
    }

    if (first.type === 'strategy') {
      return `${first.name}: ${first.description}. Entry: ${first.entry}. Exit: ${first.exit}. Best in ${first.bestMarkets}.`
    }

    if (first.type === 'concept') {
      return `${first.name}: ${first.description}`
    }
  }

  return "I'm here to help with trading analysis and education. Could you rephrase your question or ask about specific indicators, strategies, or stocks?"
}

// ============================================================================
// SUGGESTED ACTIONS
// ============================================================================

/**
 * Generate suggested follow-up questions
 */
function generateSuggestedActions(userMessage, assistantResponse, intent) {
  const suggestions = []

  if (intent === CONVERSATION_INTENTS.GREETING) {
    return [
      'Analyze a stock for me',
      'Explain RSI indicator',
      'Show me trending stocks',
      'What is a good entry strategy?'
    ]
  }

  if (intent === CONVERSATION_INTENTS.EDUCATION) {
    return [
      'Show me an example',
      'How do I use this in trading?',
      'What are common mistakes?',
      'Explain another concept'
    ]
  }

  if (intent === CONVERSATION_INTENTS.ANALYSIS) {
    return [
      'What are the risks?',
      'Give me entry/exit levels',
      'What is the best strategy here?',
      'Analyze another stock'
    ]
  }

  if (intent === CONVERSATION_INTENTS.RECOMMENDATION) {
    return [
      'Why this recommendation?',
      'What if the trade goes against me?',
      'Show me similar opportunities',
      'How do I manage this trade?'
    ]
  }

  // Default suggestions
  return [
    'Tell me more',
    'Explain further',
    'What else should I know?',
    'Show me an example'
  ]
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * Assess risk in user message/response
 */
function assessRisk(userMessage, assistantResponse) {
  const riskIndicators = {
    highRisk: [
      'all in',
      'yolo',
      'guaranteed',
      '100%',
      'cant lose',
      'easy money',
      'sure thing'
    ],
    leverageRisk: ['leverage', 'margin', 'options', '2x', '3x', '10x'],
    emotionalRisk: ['revenge', 'fomo', 'desperate', 'need this', 'must win']
  }

  const lower = (userMessage + ' ' + assistantResponse).toLowerCase()

  let riskLevel = 'low'
  const warnings = []

  // Check high risk patterns
  if (riskIndicators.highRisk.some(term => lower.includes(term))) {
    riskLevel = 'high'
    warnings.push('Avoid overconfidence - no trade is guaranteed')
  }

  // Check leverage patterns
  if (riskIndicators.leverageRisk.some(term => lower.includes(term))) {
    riskLevel = 'moderate'
    warnings.push('Leverage amplifies both gains and losses - use cautiously')
  }

  // Check emotional patterns
  if (riskIndicators.emotionalRisk.some(term => lower.includes(term))) {
    riskLevel = 'high'
    warnings.push('Emotional trading leads to poor decisions - take a break')
  }

  return {
    level: riskLevel,
    warnings,
    recommendation: riskLevel === 'high'
      ? 'Consider consulting a financial advisor before proceeding'
      : null
  }
}

// ============================================================================
// CHAT ASSISTANT API
// ============================================================================

/**
 * Send message and get response
 */
export async function sendMessage(message, session = null) {
  // Create session if not provided
  if (!session) {
    session = new ConversationSession()
  }

  // Add user message
  const userMsg = session.addMessage(message, MESSAGE_TYPES.USER)

  // Detect intent
  const intent = detectIntent(message)

  // Generate response
  const assistantContent = await generateAIResponse(message, session, intent)

  // Add assistant message
  const assistantMsg = session.addMessage(assistantContent, MESSAGE_TYPES.ASSISTANT, {
    intent,
    model: 'gpt-4o-mini'
  })

  // Assess risk
  const riskAssessment = assessRisk(message, assistantContent)

  // Generate suggestions
  const suggestedActions = generateSuggestedActions(message, assistantContent, intent)

  return {
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    intent,
    riskAssessment,
    suggestedActions,
    session
  }
}

/**
 * Get quick analysis for a stock
 */
export async function getQuickAnalysis(symbol, indicators = {}, session = null) {
  if (!session) {
    session = new ConversationSession()
  }

  // Update context
  session.updateContext({ currentSymbol: symbol })

  // Build analysis prompt
  const indicatorSummary = Object.entries(indicators)
    .map(([name, value]) => `${name}: ${value}`)
    .join(', ')

  const message = `Quick technical analysis for ${symbol}. Indicators: ${indicatorSummary}`

  return sendMessage(message, session)
}

/**
 * Get strategy recommendation
 */
export async function getStrategyRecommendation(marketCondition, userProfile = {}, session = null) {
  if (!session) {
    session = new ConversationSession()
  }

  // Update user profile
  if (Object.keys(userProfile).length > 0) {
    session.updateContext({
      userProfile: { ...session.context.userProfile, ...userProfile }
    })
  }

  const message = `What trading strategy do you recommend for current ${marketCondition} market conditions?`

  return sendMessage(message, session)
}

/**
 * Explain trading concept
 */
export async function explainConcept(concept, session = null) {
  if (!session) {
    session = new ConversationSession()
  }

  const message = `Explain the trading concept: ${concept}`

  return sendMessage(message, session)
}

/**
 * Get trade feedback
 */
export async function getTradeFeedback(trade, session = null) {
  if (!session) {
    session = new ConversationSession()
  }

  const { symbol, entry, exit, outcome, strategy } = trade

  const message = `My ${strategy} trade on ${symbol}: entered at ${entry}, exited at ${exit}. Outcome: ${outcome}. What can I learn?`

  return sendMessage(message, session)
}

// ============================================================================
// CHAT STATISTICS
// ============================================================================

/**
 * Get conversation statistics
 */
export function getChatStatistics(session) {
  const messages = session.messages
  const userMessages = messages.filter(m => m.type === MESSAGE_TYPES.USER)
  const assistantMessages = messages.filter(m => m.type === MESSAGE_TYPES.ASSISTANT)

  // Count intents
  const intentCounts = {}
  assistantMessages.forEach(msg => {
    const intent = msg.metadata?.intent
    if (intent) {
      intentCounts[intent] = (intentCounts[intent] || 0) + 1
    }
  })

  // Calculate average response time (mock - would need real timing data)
  const avgResponseTime = 1.5 // seconds

  // Most discussed topics (from knowledge base searches)
  const topics = {}
  userMessages.forEach(msg => {
    const results = searchKnowledge(msg.content)
    results.forEach(r => {
      const key = r.key || r.name
      topics[key] = (topics[key] || 0) + 1
    })
  })

  const topTopics = Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }))

  return {
    totalMessages: messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    intentDistribution: intentCounts,
    avgResponseTime,
    topTopics,
    firstMessage: messages[0]?.timestamp,
    lastMessage: messages[messages.length - 1]?.timestamp
  }
}

// ============================================================================
// PERSONALITY CUSTOMIZATION
// ============================================================================

/**
 * Personality presets
 */
export const PERSONALITIES = {
  professional: {
    name: 'Professional',
    tone: 'formal, data-driven, focused',
    style: 'Technical analysis with specific levels and probabilities'
  },
  friendly: {
    name: 'Friendly',
    tone: 'approachable, encouraging, supportive',
    style: 'Conversational explanations with analogies and encouragement'
  },
  concise: {
    name: 'Concise',
    tone: 'brief, direct, actionable',
    style: 'Bullet points, key levels, quick recommendations'
  },
  educational: {
    name: 'Educational',
    tone: 'patient, explanatory, detailed',
    style: 'In-depth explanations with examples and best practices'
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Main API
  sendMessage,
  getQuickAnalysis,
  getStrategyRecommendation,
  explainConcept,
  getTradeFeedback,

  // Session management
  ConversationSession,

  // Utilities
  detectIntent,
  searchKnowledge,
  getChatStatistics,
  generateSuggestedActions,
  assessRisk,

  // Constants
  MESSAGE_TYPES,
  CONVERSATION_INTENTS,
  KNOWLEDGE_BASE,
  PERSONALITIES
}
