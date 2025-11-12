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
      model: 'gpt-5',
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
    model: 'gpt-5'
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

// ============================================================================
// RAG (RETRIEVAL AUGMENTED GENERATION)
// ============================================================================

/**
 * Simulated vector embeddings for semantic search
 */
class KnowledgeRetriever {
  constructor() {
    this.documents = this.buildDocumentIndex()
  }

  /**
   * Build searchable document index from knowledge base
   */
  buildDocumentIndex() {
    const docs = []

    // Add indicators as documents
    for (const [key, indicator] of Object.entries(KNOWLEDGE_BASE.indicators)) {
      docs.push({
        id: `ind_${key}`,
        type: 'indicator',
        content: `${indicator.name}: ${indicator.description}. ${indicator.usage || ''}`,
        metadata: indicator,
        keywords: [key, indicator.name.toLowerCase(), ...Object.keys(indicator.interpretation || {})]
      })
    }

    // Add strategies
    for (const [key, strategy] of Object.entries(KNOWLEDGE_BASE.strategies)) {
      docs.push({
        id: `strat_${key}`,
        type: 'strategy',
        content: `${strategy.name}: ${strategy.description}. Entry: ${strategy.entry}. Exit: ${strategy.exit}`,
        metadata: strategy,
        keywords: [key, strategy.name.toLowerCase()]
      })
    }

    // Add concepts
    for (const [key, description] of Object.entries(KNOWLEDGE_BASE.concepts)) {
      docs.push({
        id: `concept_${key}`,
        type: 'concept',
        content: `${key}: ${description}`,
        metadata: { name: key, description },
        keywords: [key]
      })
    }

    return docs
  }

  /**
   * Calculate simple semantic similarity
   */
  calculateSimilarity(query, document) {
    const queryWords = new Set(query.toLowerCase().split(/\s+/))
    const docWords = new Set(document.content.toLowerCase().split(/\s+/))

    const intersection = new Set([...queryWords].filter(w => docWords.has(w)))
    const union = new Set([...queryWords, ...docWords])

    const jaccardSimilarity = union.size === 0 ? 0 : intersection.size / union.size

    // Boost score if keywords match
    let keywordBoost = 0
    for (const keyword of document.keywords) {
      if (query.toLowerCase().includes(keyword)) {
        keywordBoost += 0.3
      }
    }

    return Math.min(1.0, jaccardSimilarity + keywordBoost)
  }

  /**
   * Retrieve relevant documents
   */
  retrieve(query, topK = 3, threshold = 0.3) {
    const scores = this.documents.map(doc => ({
      document: doc,
      score: this.calculateSimilarity(query, doc)
    }))

    return scores
      .filter(s => s.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  /**
   * Format retrieved documents for context
   */
  formatContext(retrievedDocs) {
    return retrievedDocs
      .map((item, idx) => `[${idx + 1}] ${item.document.content}`)
      .join('\n\n')
  }
}

// ============================================================================
// CONVERSATION MEMORY SYSTEM
// ============================================================================

/**
 * Long-term memory for conversation continuity
 */
export class ConversationMemory {
  constructor() {
    this.shortTerm = [] // Last 10 messages
    this.longTerm = new Map() // Key facts extracted from conversation
    this.entities = new Map() // Mentioned entities (stocks, indicators, etc.)
    this.userPreferences = {} // Inferred preferences
    this.conversationSummary = null
  }

  /**
   * Add message to memory
   */
  addMessage(message, type) {
    this.shortTerm.push({ message, type, timestamp: Date.now() })

    // Keep only recent messages in short-term
    if (this.shortTerm.length > 10) {
      this.shortTerm = this.shortTerm.slice(-10)
    }

    // Extract entities
    this.extractEntities(message)

    // Update long-term memory with key facts
    this.updateLongTermMemory(message, type)
  }

  /**
   * Extract entities from message
   */
  extractEntities(message) {
    // Extract stock symbols ($AAPL or AAPL pattern)
    const symbolPattern = /\$?([A-Z]{2,5})\b/g
    let match
    while ((match = symbolPattern.exec(message)) !== null) {
      const symbol = match[1]
      if (symbol.length <= 5) {
        const count = this.entities.get(symbol) || 0
        this.entities.set(symbol, count + 1)
      }
    }

    // Extract indicators
    const indicators = ['rsi', 'macd', 'ema', 'sma', 'adx', 'atr', 'bollinger']
    for (const ind of indicators) {
      if (message.toLowerCase().includes(ind)) {
        const count = this.entities.get(ind.toUpperCase()) || 0
        this.entities.set(ind.toUpperCase(), count + 1)
      }
    }
  }

  /**
   * Update long-term memory with key facts
   */
  updateLongTermMemory(message, type) {
    const lower = message.toLowerCase()

    // Detect user preferences
    if (lower.includes('prefer') || lower.includes('like')) {
      if (lower.includes('day trad')) {
        this.userPreferences.tradingStyle = 'day'
      } else if (lower.includes('swing')) {
        this.userPreferences.tradingStyle = 'swing'
      }

      if (lower.includes('conservative')) {
        this.userPreferences.riskTolerance = 'conservative'
      } else if (lower.includes('aggressive')) {
        this.userPreferences.riskTolerance = 'aggressive'
      }
    }

    // Store key decisions/insights
    if (type === MESSAGE_TYPES.ASSISTANT && (lower.includes('recommend') || lower.includes('suggest'))) {
      const key = `insight_${Date.now()}`
      this.longTerm.set(key, {
        type: 'recommendation',
        content: message,
        timestamp: Date.now()
      })
    }
  }

  /**
   * Get most mentioned entities
   */
  getTopEntities(limit = 5) {
    return Array.from(this.entities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([entity, count]) => ({ entity, count }))
  }

  /**
   * Generate conversation summary
   */
  generateSummary() {
    const topEntities = this.getTopEntities(3)
    const messageCount = this.shortTerm.length

    const summary = {
      messageCount,
      topEntities,
      preferences: this.userPreferences,
      keyInsights: Array.from(this.longTerm.values()).slice(-3)
    }

    this.conversationSummary = summary
    return summary
  }

  /**
   * Clear memory
   */
  clear() {
    this.shortTerm = []
    this.longTerm.clear()
    this.entities.clear()
    this.userPreferences = {}
    this.conversationSummary = null
  }
}

// ============================================================================
// DIALOGUE STATE TRACKING
// ============================================================================

/**
 * Finite State Machine for conversation flow
 */
export class DialogueStateTracker {
  constructor() {
    this.currentState = 'IDLE'
    this.stateHistory = []
    this.slots = {} // Information gathered during conversation
  }

  /**
   * Conversation states
   */
  static STATES = {
    IDLE: 'idle',
    GREETING: 'greeting',
    GATHERING_INFO: 'gathering_info',
    ANALYZING: 'analyzing',
    RECOMMENDING: 'recommending',
    EDUCATING: 'educating',
    CLARIFYING: 'clarifying',
    CONFIRMING: 'confirming',
    CLOSING: 'closing'
  }

  /**
   * State transitions
   */
  static TRANSITIONS = {
    idle: ['greeting', 'gathering_info'],
    greeting: ['gathering_info', 'idle'],
    gathering_info: ['analyzing', 'educating', 'clarifying'],
    analyzing: ['recommending', 'clarifying', 'idle'],
    recommending: ['confirming', 'clarifying', 'idle'],
    educating: ['idle', 'clarifying'],
    clarifying: ['gathering_info', 'analyzing', 'educating'],
    confirming: ['closing', 'idle'],
    closing: ['idle']
  }

  /**
   * Transition to new state
   */
  transition(newState, reason = '') {
    const currentState = this.currentState.toLowerCase()

    // Validate transition
    const validTransitions = DialogueStateTracker.TRANSITIONS[currentState] || []
    if (!validTransitions.includes(newState.toLowerCase())) {
      console.warn(`[Dialogue] Invalid transition from ${currentState} to ${newState}`)
      return false
    }

    // Record history
    this.stateHistory.push({
      from: this.currentState,
      to: newState,
      timestamp: Date.now(),
      reason
    })

    this.currentState = newState.toUpperCase()
    return true
  }

  /**
   * Determine next state based on intent
   */
  determineNextState(intent) {
    const currentState = this.currentState.toLowerCase()

    switch (intent) {
      case CONVERSATION_INTENTS.GREETING:
        if (currentState === 'idle') {
          return 'greeting'
        }
        break

      case CONVERSATION_INTENTS.QUESTION:
      case CONVERSATION_INTENTS.HELP:
        if (['idle', 'greeting'].includes(currentState)) {
          return 'gathering_info'
        }
        break

      case CONVERSATION_INTENTS.ANALYSIS:
        return 'analyzing'

      case CONVERSATION_INTENTS.RECOMMENDATION:
        return 'recommending'

      case CONVERSATION_INTENTS.EDUCATION:
        return 'educating'

      default:
        return currentState
    }

    return currentState
  }

  /**
   * Update slot values
   */
  updateSlot(key, value) {
    this.slots[key] = value
  }

  /**
   * Check if required slots are filled
   */
  checkRequiredSlots(required) {
    return required.every(slot => this.slots[slot] !== undefined)
  }

  /**
   * Get dialogue context
   */
  getContext() {
    return {
      currentState: this.currentState,
      slots: this.slots,
      stateHistory: this.stateHistory.slice(-5)
    }
  }
}

// ============================================================================
// RESPONSE QUALITY SCORING
// ============================================================================

/**
 * Evaluate response quality
 */
export class ResponseQualityScorer {
  /**
   * Score response on multiple dimensions
   */
  scoreResponse(response, userMessage, intent) {
    const scores = {
      relevance: this.scoreRelevance(response, userMessage),
      completeness: this.scoreCompleteness(response, intent),
      clarity: this.scoreClarity(response),
      actionability: this.scoreActionability(response),
      risk_awareness: this.scoreRiskAwareness(response, intent)
    }

    // Calculate overall score (weighted average)
    const weights = {
      relevance: 0.3,
      completeness: 0.25,
      clarity: 0.2,
      actionability: 0.15,
      risk_awareness: 0.1
    }

    const overall = Object.entries(scores).reduce(
      (sum, [key, score]) => sum + score * weights[key],
      0
    )

    return {
      overall: Math.round(overall * 100) / 100,
      dimensions: scores,
      grade: this.getGrade(overall)
    }
  }

  /**
   * Score relevance to user message
   */
  scoreRelevance(response, userMessage) {
    const userWords = new Set(userMessage.toLowerCase().split(/\s+/))
    const responseWords = new Set(response.toLowerCase().split(/\s+/))

    const overlap = new Set([...userWords].filter(w => responseWords.has(w) && w.length > 3))

    return Math.min(1.0, overlap.size / Math.max(userWords.size, 1) * 2)
  }

  /**
   * Score completeness based on expected content
   */
  scoreCompleteness(response, intent) {
    let requiredElements = []

    if (intent === CONVERSATION_INTENTS.ANALYSIS) {
      requiredElements = ['trend', 'level', 'indicator']
    } else if (intent === CONVERSATION_INTENTS.RECOMMENDATION) {
      requiredElements = ['entry', 'exit', 'stop']
    } else if (intent === CONVERSATION_INTENTS.EDUCATION) {
      requiredElements = ['definition', 'example', 'use']
    }

    if (requiredElements.length === 0) return 1.0

    const present = requiredElements.filter(elem =>
      response.toLowerCase().includes(elem)
    ).length

    return present / requiredElements.length
  }

  /**
   * Score clarity (readability)
   */
  scoreClarity(response) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0)

    // Penalize very long sentences
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
    const lengthScore = avgSentenceLength < 20 ? 1.0 : Math.max(0, 1.0 - (avgSentenceLength - 20) / 30)

    // Reward structured content (bullet points, numbered lists)
    const hasStructure = /^[-•\d]/.test(response) ? 1.0 : 0.8

    return (lengthScore + hasStructure) / 2
  }

  /**
   * Score actionability (concrete recommendations)
   */
  scoreActionability(response) {
    const actionableTerms = [
      'buy', 'sell', 'enter', 'exit', 'set', 'place', 'wait', 'avoid',
      'consider', 'watch', 'monitor', 'look for'
    ]

    const hasActionable = actionableTerms.some(term =>
      response.toLowerCase().includes(term)
    )

    // Check for specific numbers/levels
    const hasNumbers = /\d+/.test(response)

    return (hasActionable ? 0.6 : 0.3) + (hasNumbers ? 0.4 : 0)
  }

  /**
   * Score risk awareness
   */
  scoreRiskAwareness(response, intent) {
    if (intent !== CONVERSATION_INTENTS.RECOMMENDATION) {
      return 1.0 // Not applicable
    }

    const riskTerms = [
      'risk', 'stop', 'loss', 'manage', 'protect', 'caution',
      'careful', 'consider', 'disclaimer', 'not guaranteed'
    ]

    const riskMentions = riskTerms.filter(term =>
      response.toLowerCase().includes(term)
    ).length

    return Math.min(1.0, riskMentions / 3)
  }

  /**
   * Convert score to letter grade
   */
  getGrade(score) {
    if (score >= 0.9) return 'A'
    if (score >= 0.8) return 'B'
    if (score >= 0.7) return 'C'
    if (score >= 0.6) return 'D'
    return 'F'
  }
}

// ============================================================================
// CLARIFICATION DETECTION
// ============================================================================

/**
 * Detect when clarification is needed
 */
export class ClarificationDetector {
  /**
   * Check if user message needs clarification
   */
  needsClarification(userMessage, context = {}) {
    const checks = {
      tooVague: this.checkVagueness(userMessage),
      ambiguousSymbol: this.checkAmbiguousSymbol(userMessage),
      missingTimeframe: this.checkMissingTimeframe(userMessage, context),
      conflictingInfo: this.checkConflictingInfo(userMessage)
    }

    const needsClarification = Object.values(checks).some(check => check.needed)

    if (needsClarification) {
      const reasons = Object.entries(checks)
        .filter(([_, check]) => check.needed)
        .map(([reason, check]) => ({ reason, question: check.question }))

      return {
        needed: true,
        reasons,
        suggestedQuestion: reasons[0].question
      }
    }

    return { needed: false }
  }

  /**
   * Check if message is too vague
   */
  checkVagueness(message) {
    const vaguePhrases = [
      'it', 'this', 'that', 'good stock', 'best indicator', 'what should i'
    ]

    const isVague = vaguePhrases.some(phrase =>
      message.toLowerCase().includes(phrase)
    ) && message.split(/\s+/).length < 10

    return {
      needed: isVague,
      question: 'Could you be more specific about what you want to know?'
    }
  }

  /**
   * Check for ambiguous stock symbol
   */
  checkAmbiguousSymbol(message) {
    // Check if multiple symbols mentioned
    const symbols = message.match(/\$?[A-Z]{2,5}\b/g) || []
    const uniqueSymbols = new Set(symbols)

    if (uniqueSymbols.size > 3) {
      return {
        needed: true,
        question: `You mentioned multiple symbols. Which one would you like me to focus on?`
      }
    }

    return { needed: false }
  }

  /**
   * Check if timeframe is missing
   */
  checkMissingTimeframe(message, context) {
    const hasTimeframe = /\b(minute|hour|day|week|daily|1d|5m|15m|1h|4h)\b/i.test(message)
    const needsTimeframe = /\b(trade|analyze|chart|entry|exit)\b/i.test(message)

    if (needsTimeframe && !hasTimeframe && !context.preferredTimeframe) {
      return {
        needed: true,
        question: 'What timeframe are you trading? (e.g., 1d, 4h, 15m)'
      }
    }

    return { needed: false }
  }

  /**
   * Check for conflicting information
   */
  checkConflictingInfo(message) {
    const conflicts = [
      { terms: ['buy', 'sell'], conflict: 'Do you want to buy or sell?' },
      { terms: ['long', 'short'], conflict: 'Are you looking to go long or short?' },
      { terms: ['bullish', 'bearish'], conflict: 'Are you bullish or bearish?' }
    ]

    for (const { terms, conflict } of conflicts) {
      if (terms.every(term => message.toLowerCase().includes(term))) {
        return {
          needed: true,
          question: conflict
        }
      }
    }

    return { needed: false }
  }
}

// ============================================================================
// CONVERSATION SUMMARIZATION
// ============================================================================

/**
 * Generate conversation summaries
 */
export class ConversationSummarizer {
  /**
   * Summarize conversation session
   */
  summarize(messages, maxLength = 200) {
    if (messages.length === 0) {
      return 'No conversation yet.'
    }

    // Extract key points
    const keyPoints = this.extractKeyPoints(messages)

    // Generate summary
    const summary = this.generateSummary(keyPoints, maxLength)

    return summary
  }

  /**
   * Extract key points from messages
   */
  extractKeyPoints(messages) {
    const points = []

    // Find questions asked
    const questions = messages
      .filter(m => m.type === MESSAGE_TYPES.USER && m.content.includes('?'))
      .map(m => m.content)

    if (questions.length > 0) {
      points.push({
        type: 'questions',
        content: questions.slice(-3) // Last 3 questions
      })
    }

    // Find stocks mentioned
    const symbols = new Set()
    messages.forEach(m => {
      const matches = m.content.match(/\$?([A-Z]{2,5})\b/g) || []
      matches.forEach(s => symbols.add(s))
    })

    if (symbols.size > 0) {
      points.push({
        type: 'symbols',
        content: Array.from(symbols)
      })
    }

    // Find recommendations
    const recommendations = messages
      .filter(m =>
        m.type === MESSAGE_TYPES.ASSISTANT &&
        (m.content.toLowerCase().includes('recommend') ||
         m.content.toLowerCase().includes('suggest'))
      )
      .map(m => m.content)

    if (recommendations.length > 0) {
      points.push({
        type: 'recommendations',
        content: recommendations.slice(-2) // Last 2 recommendations
      })
    }

    return points
  }

  /**
   * Generate text summary from key points
   */
  generateSummary(keyPoints, maxLength) {
    const parts = []

    for (const point of keyPoints) {
      if (point.type === 'questions') {
        parts.push(`Discussed: ${point.content.length} question(s)`)
      } else if (point.type === 'symbols') {
        parts.push(`Analyzed: ${point.content.slice(0, 3).join(', ')}`)
      } else if (point.type === 'recommendations') {
        parts.push(`Provided ${point.content.length} recommendation(s)`)
      }
    }

    let summary = parts.join('. ')

    // Truncate if needed
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...'
    }

    return summary || 'General trading discussion.'
  }

  /**
   * Generate session report
   */
  generateReport(session) {
    const messages = session.messages
    const stats = getChatStatistics(session)

    return {
      summary: this.summarize(messages),
      messageCount: stats.totalMessages,
      intentDistribution: stats.intentDistribution,
      topTopics: stats.topTopics,
      duration: this.calculateDuration(messages),
      keyInsights: this.extractKeyPoints(messages)
    }
  }

  /**
   * Calculate conversation duration
   */
  calculateDuration(messages) {
    if (messages.length < 2) return 0

    const first = new Date(messages[0].timestamp)
    const last = new Date(messages[messages.length - 1].timestamp)

    const durationMs = last - first
    const durationMin = Math.round(durationMs / 60000)

    return { minutes: durationMin, formatted: `${durationMin} minutes` }
  }
}

// ============================================================================
// CONTEXT WINDOW MANAGEMENT
// ============================================================================

/**
 * Smart context window truncation
 */
export class ContextWindowManager {
  constructor(maxTokens = 2000) {
    this.maxTokens = maxTokens
    this.avgTokensPerMessage = 50 // Rough estimate
  }

  /**
   * Truncate messages to fit context window
   */
  truncateMessages(messages, systemPromptLength = 200) {
    const availableTokens = this.maxTokens - systemPromptLength
    const maxMessages = Math.floor(availableTokens / this.avgTokensPerMessage)

    if (messages.length <= maxMessages) {
      return messages
    }

    // Keep first message (often important context)
    // Keep most recent messages
    const truncated = [
      messages[0],
      ...messages.slice(-(maxMessages - 1))
    ]

    return truncated
  }

  /**
   * Prioritize important messages
   */
  prioritizeMessages(messages, topK = 10) {
    const scored = messages.map(msg => ({
      message: msg,
      score: this.scoreMessageImportance(msg)
    }))

    scored.sort((a, b) => b.score - a.score)

    return scored
      .slice(0, topK)
      .map(s => s.message)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }

  /**
   * Score message importance
   */
  scoreMessageImportance(message) {
    let score = 0

    // User messages more important than assistant
    if (message.type === MESSAGE_TYPES.USER) {
      score += 1
    }

    // Questions are important
    if (message.content.includes('?')) {
      score += 2
    }

    // Mentions of specific symbols/indicators
    if (/\$?[A-Z]{2,5}/.test(message.content)) {
      score += 1.5
    }

    // Longer messages may have more context
    if (message.content.split(/\s+/).length > 20) {
      score += 0.5
    }

    // Recent messages more important
    const age = Date.now() - new Date(message.timestamp).getTime()
    const ageHours = age / (1000 * 60 * 60)
    const recencyScore = Math.max(0, 2 - ageHours / 24)
    score += recencyScore

    return score
  }
}

// ============================================================================
// RESPONSE PERSONALIZATION
// ============================================================================

/**
 * Personalize responses based on user profile
 */
export class ResponsePersonalizer {
  /**
   * Adapt response to user's experience level
   */
  adaptToExperience(response, experienceLevel) {
    if (experienceLevel === 'beginner') {
      // Add more explanation, avoid jargon
      return this.simplifyLanguage(response)
    } else if (experienceLevel === 'advanced') {
      // Can use technical terms, be more concise
      return this.addTechnicalDepth(response)
    }

    return response
  }

  /**
   * Simplify language for beginners
   */
  simplifyLanguage(response) {
    const jargonMap = {
      'bullish': 'bullish (expecting price to go up)',
      'bearish': 'bearish (expecting price to go down)',
      'divergence': 'divergence (when price and indicator disagree)',
      'confluence': 'confluence (multiple signals agreeing)',
      'breakout': 'breakout (price breaking through a key level)'
    }

    let simplified = response
    for (const [jargon, explanation] of Object.entries(jargonMap)) {
      const regex = new RegExp(`\\b${jargon}\\b`, 'gi')
      simplified = simplified.replace(regex, explanation)
    }

    return simplified
  }

  /**
   * Add technical depth for advanced users
   */
  addTechnicalDepth(response) {
    // Could add specific levels, percentages, probabilities
    // For now, return as-is
    return response
  }

  /**
   * Apply personality style
   */
  applyPersonality(response, personality) {
    if (!personality || personality === 'professional') {
      return response
    }

    if (personality === 'friendly') {
      // Add encouraging phrases
      const encouragements = ['Great question!', 'Good thinking.', 'Here you go:']
      const random = encouragements[Math.floor(Math.random() * encouragements.length)]
      return `${random} ${response}`
    }

    if (personality === 'concise') {
      // Strip extra words, make bullet points
      return response.split('.').slice(0, 3).join('. ') + '.'
    }

    return response
  }
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

/**
 * Calculate confidence in AI responses
 */
export class ConfidenceScorer {
  /**
   * Score confidence in response
   */
  scoreConfidence(response, context = {}) {
    const factors = {
      knowledgeMatch: this.scoreKnowledgeMatch(response, context),
      specificity: this.scoreSpecificity(response),
      hedging: this.scoreHedging(response),
      contextRelevance: this.scoreContextRelevance(response, context)
    }

    // Weighted average
    const weights = {
      knowledgeMatch: 0.35,
      specificity: 0.25,
      hedging: 0.2,
      contextRelevance: 0.2
    }

    const overall = Object.entries(factors).reduce(
      (sum, [key, score]) => sum + score * weights[key],
      0
    )

    return {
      overall: Math.round(overall * 100),
      factors,
      level: this.getConfidenceLevel(overall)
    }
  }

  /**
   * Score how well response matches knowledge base
   */
  scoreKnowledgeMatch(response, context) {
    // If response contains knowledge base content, high confidence
    const hasKnowledge = context.knowledgeResults?.length > 0
    return hasKnowledge ? 0.9 : 0.6
  }

  /**
   * Score specificity (concrete vs vague)
   */
  scoreSpecificity(response) {
    const hasNumbers = /\d+/.test(response)
    const hasLevels = /\b(level|price|at|around)\s+\d+/.test(response)

    if (hasLevels) return 0.9
    if (hasNumbers) return 0.7
    return 0.5
  }

  /**
   * Score hedging language (uncertainty)
   */
  scoreHedging(response) {
    const hedgeWords = ['might', 'could', 'possibly', 'maybe', 'perhaps', 'may', 'uncertain']
    const hedgeCount = hedgeWords.filter(word =>
      response.toLowerCase().includes(word)
    ).length

    // More hedging = less confidence
    return Math.max(0, 1 - hedgeCount * 0.15)
  }

  /**
   * Score context relevance
   */
  scoreContextRelevance(response, context) {
    if (!context.userMessage) return 0.7

    const userWords = new Set(context.userMessage.toLowerCase().split(/\s+/))
    const responseWords = new Set(response.toLowerCase().split(/\s+/))

    const overlap = new Set([...userWords].filter(w => responseWords.has(w) && w.length > 3))

    return Math.min(1, overlap.size / Math.max(userWords.size, 1) * 1.5)
  }

  /**
   * Get confidence level label
   */
  getConfidenceLevel(score) {
    if (score >= 0.8) return 'HIGH'
    if (score >= 0.6) return 'MEDIUM'
    return 'LOW'
  }
}

// ============================================================================
// RESPONSE CACHING
// ============================================================================

/**
 * Cache frequent responses for faster reply times
 */
export class ResponseCache {
  constructor(maxSize = 100, ttl = 3600000) { // 1 hour TTL
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
    this.hits = 0
    this.misses = 0
  }

  /**
   * Generate cache key from message
   */
  generateKey(message, context = {}) {
    // Normalize message
    const normalized = message.toLowerCase().trim()

    // Include relevant context
    const contextKey = [
      context.currentSymbol,
      context.experienceLevel,
      context.tradingStyle
    ].filter(Boolean).join('_')

    return `${normalized}|${contextKey}`
  }

  /**
   * Get cached response
   */
  get(message, context = {}) {
    const key = this.generateKey(message, context)
    const cached = this.cache.get(key)

    if (!cached) {
      this.misses++
      return null
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++
    cached.accessCount++
    cached.lastAccessed = Date.now()

    return cached.response
  }

  /**
   * Set cached response
   */
  set(message, response, context = {}) {
    const key = this.generateKey(message, context)

    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0
    })
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.hits + this.misses
    const hitRate = totalRequests === 0 ? 0 : this.hits / totalRequests

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      hitRatePercent: Math.round(hitRate * 100)
    }
  }

  /**
   * Get most accessed entries
   */
  getTopEntries(limit = 10) {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)

    return entries
  }
}

// ============================================================================
// LEARNING FROM FEEDBACK
// ============================================================================

/**
 * Learn from user feedback to improve responses
 */
export class FeedbackLearner {
  constructor() {
    this.feedback = []
    this.load()
  }

  /**
   * Record user feedback on response
   */
  recordFeedback(messageId, response, feedback) {
    const entry = {
      id: Date.now().toString(),
      messageId,
      response: response.substring(0, 500), // Truncate for storage
      feedback: {
        rating: feedback.rating, // 1-5 stars
        helpful: feedback.helpful, // boolean
        category: feedback.category, // 'accurate', 'relevant', 'clear', 'actionable'
        comment: feedback.comment || null
      },
      timestamp: Date.now()
    }

    this.feedback.push(entry)

    // Limit history
    if (this.feedback.length > 500) {
      this.feedback = this.feedback.slice(-500)
    }

    this.save()
    return entry
  }

  /**
   * Get response quality score based on feedback
   */
  getQualityScore(response) {
    // Find similar responses in feedback history
    const similar = this.feedback.filter(f =>
      this.calculateSimilarity(f.response, response) > 0.7
    )

    if (similar.length === 0) {
      return { score: 0, confidence: 'low', sampleSize: 0 }
    }

    const avgRating = similar.reduce((sum, f) => sum + f.feedback.rating, 0) / similar.length
    const helpfulPercent = similar.filter(f => f.feedback.helpful).length / similar.length

    const score = (avgRating / 5) * 0.6 + helpfulPercent * 0.4

    return {
      score: Math.round(score * 100) / 100,
      confidence: this.getConfidenceLevel(similar.length),
      sampleSize: similar.length,
      avgRating: Math.round(avgRating * 10) / 10,
      helpfulPercent: Math.round(helpfulPercent * 100)
    }
  }

  /**
   * Calculate text similarity
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter(w => words2.has(w)))
    const union = new Set([...words1, ...words2])

    return union.size === 0 ? 0 : intersection.size / union.size
  }

  /**
   * Get confidence level based on sample size
   */
  getConfidenceLevel(sampleSize) {
    if (sampleSize >= 10) return 'high'
    if (sampleSize >= 5) return 'medium'
    return 'low'
  }

  /**
   * Get feedback summary
   */
  getSummary() {
    if (this.feedback.length === 0) {
      return {
        totalFeedback: 0,
        avgRating: 0,
        helpfulPercent: 0,
        categories: {}
      }
    }

    const avgRating = this.feedback.reduce((sum, f) => sum + f.feedback.rating, 0) / this.feedback.length
    const helpfulCount = this.feedback.filter(f => f.feedback.helpful).length
    const helpfulPercent = helpfulCount / this.feedback.length

    // Count by category
    const categories = {}
    this.feedback.forEach(f => {
      const cat = f.feedback.category || 'general'
      categories[cat] = (categories[cat] || 0) + 1
    })

    return {
      totalFeedback: this.feedback.length,
      avgRating: Math.round(avgRating * 10) / 10,
      helpfulPercent: Math.round(helpfulPercent * 100),
      categories
    }
  }

  /**
   * Get improvement suggestions based on feedback
   */
  getImprovementSuggestions() {
    if (this.feedback.length < 5) {
      return ['Collect more feedback to generate suggestions']
    }

    const suggestions = []

    // Analyze low-rated responses
    const lowRated = this.feedback.filter(f => f.feedback.rating <= 2)
    if (lowRated.length > this.feedback.length * 0.3) {
      suggestions.push('Many responses rated poorly - review response generation')
    }

    // Analyze unhelpful responses
    const unhelpful = this.feedback.filter(f => !f.feedback.helpful)
    if (unhelpful.length > this.feedback.length * 0.5) {
      suggestions.push('Over 50% of responses marked as unhelpful - improve relevance')
    }

    // Analyze categories
    const categories = this.getSummary().categories
    for (const [category, count] of Object.entries(categories)) {
      if (count > this.feedback.length * 0.2) {
        suggestions.push(`High feedback volume for '${category}' - review this area`)
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('Overall feedback is positive - maintain current quality')
    }

    return suggestions
  }

  /**
   * Save feedback to localStorage
   */
  save() {
    try {
      localStorage.setItem('iava_chat_feedback', JSON.stringify(this.feedback))
    } catch (error) {
      console.error('[Feedback] Failed to save:', error)
    }
  }

  /**
   * Load feedback from localStorage
   */
  load() {
    try {
      const data = localStorage.getItem('iava_chat_feedback')
      if (data) {
        this.feedback = JSON.parse(data)
      }
    } catch (error) {
      console.error('[Feedback] Failed to load:', error)
      this.feedback = []
    }
  }

  /**
   * Clear all feedback
   */
  clear() {
    this.feedback = []
    this.save()
  }
}

// ============================================================================
// MULTI-TURN COHERENCE
// ============================================================================

/**
 * Maintain coherence across multiple conversation turns
 */
export class CoherenceTracker {
  constructor() {
    this.topics = []
    this.references = new Map() // Pronoun references
    this.continuityScore = 1.0
  }

  /**
   * Add turn to tracker
   */
  addTurn(userMessage, assistantResponse) {
    // Extract topic
    const topic = this.extractTopic(userMessage)
    if (topic) {
      this.topics.push({
        topic,
        timestamp: Date.now()
      })

      // Keep only recent topics
      if (this.topics.length > 10) {
        this.topics = this.topics.slice(-10)
      }
    }

    // Update references
    this.updateReferences(userMessage, assistantResponse)

    // Calculate coherence
    this.continuityScore = this.calculateCoherence()
  }

  /**
   * Extract main topic from message
   */
  extractTopic(message) {
    // Look for stock symbols
    const symbolMatch = message.match(/\$?([A-Z]{2,5})\b/)
    if (symbolMatch) {
      return { type: 'symbol', value: symbolMatch[1] }
    }

    // Look for indicators
    const indicators = ['rsi', 'macd', 'ema', 'sma', 'adx', 'atr']
    for (const ind of indicators) {
      if (message.toLowerCase().includes(ind)) {
        return { type: 'indicator', value: ind.toUpperCase() }
      }
    }

    // Look for strategies
    const strategies = ['trend', 'momentum', 'breakout', 'reversal']
    for (const strat of strategies) {
      if (message.toLowerCase().includes(strat)) {
        return { type: 'strategy', value: strat }
      }
    }

    return null
  }

  /**
   * Update pronoun references
   */
  updateReferences(userMessage, assistantResponse) {
    // Detect pronouns
    const pronouns = ['it', 'this', 'that', 'these', 'those']

    for (const pronoun of pronouns) {
      if (userMessage.toLowerCase().includes(pronoun)) {
        // Link to most recent topic
        if (this.topics.length > 0) {
          const recent = this.topics[this.topics.length - 1]
          this.references.set(pronoun, recent.topic)
        }
      }
    }
  }

  /**
   * Calculate conversation coherence score
   */
  calculateCoherence() {
    if (this.topics.length < 2) {
      return 1.0 // Perfect for single topic
    }

    // Check topic consistency
    const uniqueTopics = new Set(this.topics.map(t => t.topic.value))
    const topicChangeRate = uniqueTopics.size / this.topics.length

    // Lower score if too many topic changes
    let score = 1.0 - (topicChangeRate * 0.5)

    // Check reference resolution
    const unresolvedReferences = Array.from(this.references.values())
      .filter(ref => !ref)
      .length

    score -= unresolvedReferences * 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Resolve pronoun reference
   */
  resolveReference(pronoun) {
    return this.references.get(pronoun.toLowerCase()) || null
  }

  /**
   * Get current topic
   */
  getCurrentTopic() {
    if (this.topics.length === 0) return null
    return this.topics[this.topics.length - 1].topic
  }

  /**
   * Check if topic changed
   */
  hasTopicChanged() {
    if (this.topics.length < 2) return false

    const current = this.topics[this.topics.length - 1]
    const previous = this.topics[this.topics.length - 2]

    return current.topic.value !== previous.topic.value
  }

  /**
   * Get coherence assessment
   */
  getAssessment() {
    return {
      score: Math.round(this.continuityScore * 100) / 100,
      level: this.continuityScore > 0.7 ? 'HIGH' : this.continuityScore > 0.4 ? 'MEDIUM' : 'LOW',
      currentTopic: this.getCurrentTopic(),
      topicChanges: new Set(this.topics.map(t => t.topic.value)).size,
      unresolvedReferences: Array.from(this.references.values()).filter(r => !r).length
    }
  }
}

// ============================================================================
// INTENT DISAMBIGUATION
// ============================================================================

/**
 * Handle ambiguous user intents
 */
export class IntentDisambiguator {
  /**
   * Check if intent is ambiguous
   */
  isAmbiguous(message, topIntents) {
    if (topIntents.length < 2) {
      return false
    }

    // If top 2 intents are close in confidence
    const [first, second] = topIntents
    const confidenceDiff = first.confidence - second.confidence

    return confidenceDiff < 0.2
  }

  /**
   * Generate clarifying question
   */
  generateClarification(topIntents) {
    const [first, second] = topIntents

    const intentQuestions = {
      [CONVERSATION_INTENTS.ANALYSIS]: 'Are you looking for a technical analysis?',
      [CONVERSATION_INTENTS.RECOMMENDATION]: 'Do you want a trade recommendation?',
      [CONVERSATION_INTENTS.EDUCATION]: 'Would you like me to explain this concept?',
      [CONVERSATION_INTENTS.QUESTION]: 'Do you have a specific question?'
    }

    return {
      message: `I want to make sure I understand correctly. ${intentQuestions[first.intent]} Or ${intentQuestions[second.intent]?.toLowerCase()}`,
      options: [
        { label: this.getIntentLabel(first.intent), intent: first.intent },
        { label: this.getIntentLabel(second.intent), intent: second.intent }
      ]
    }
  }

  /**
   * Get friendly label for intent
   */
  getIntentLabel(intent) {
    const labels = {
      [CONVERSATION_INTENTS.ANALYSIS]: 'Technical Analysis',
      [CONVERSATION_INTENTS.RECOMMENDATION]: 'Trade Recommendation',
      [CONVERSATION_INTENTS.EDUCATION]: 'Learning/Explanation',
      [CONVERSATION_INTENTS.QUESTION]: 'Answer Question',
      [CONVERSATION_INTENTS.HELP]: 'Get Help',
      [CONVERSATION_INTENTS.FEEDBACK]: 'Trade Feedback'
    }

    return labels[intent] || intent
  }

  /**
   * Resolve ambiguity with additional context
   */
  resolveWithContext(message, context) {
    // Use conversation history to disambiguate
    if (context.lastIntent) {
      // If user is continuing previous conversation, likely same intent
      return context.lastIntent
    }

    // Use current symbol context
    if (context.currentSymbol && message.toLowerCase().includes('analyze')) {
      return CONVERSATION_INTENTS.ANALYSIS
    }

    // Use keywords
    const educationalKeywords = ['what is', 'how does', 'explain', 'learn']
    if (educationalKeywords.some(kw => message.toLowerCase().includes(kw))) {
      return CONVERSATION_INTENTS.EDUCATION
    }

    return null
  }
}

// ============================================================================
// FOLLOW-UP QUESTION GENERATION
// ============================================================================

/**
 * Generate proactive follow-up questions
 */
export class FollowUpGenerator {
  /**
   * Generate follow-up questions based on response
   */
  generateFollowUps(userMessage, assistantResponse, intent) {
    const followUps = []

    // Based on intent
    if (intent === CONVERSATION_INTENTS.ANALYSIS) {
      followUps.push(
        'What price levels should I watch?',
        'What are the key risks?',
        'How confident are you in this analysis?'
      )
    }

    if (intent === CONVERSATION_INTENTS.RECOMMENDATION) {
      followUps.push(
        'What if the trade goes against me?',
        'What\'s the expected timeframe?',
        'Any alternatives to consider?'
      )
    }

    if (intent === CONVERSATION_INTENTS.EDUCATION) {
      followUps.push(
        'Can you show me an example?',
        'How do professionals use this?',
        'What are common mistakes?'
      )
    }

    // Based on response content
    if (assistantResponse.toLowerCase().includes('trend')) {
      followUps.push('How strong is this trend?')
    }

    if (assistantResponse.toLowerCase().includes('support') || assistantResponse.toLowerCase().includes('resistance')) {
      followUps.push('What happens if this level breaks?')
    }

    if (assistantResponse.match(/\d+/)) {
      followUps.push('How did you calculate these numbers?')
    }

    // Deduplicate and limit
    return [...new Set(followUps)].slice(0, 4)
  }

  /**
   * Generate related topics
   */
  generateRelatedTopics(userMessage) {
    const topics = []

    // Extract main topic
    if (userMessage.toLowerCase().includes('rsi')) {
      topics.push(
        'MACD indicator',
        'Stochastic oscillator',
        'Momentum strategies'
      )
    }

    if (userMessage.toLowerCase().includes('trend')) {
      topics.push(
        'Support and resistance',
        'Moving averages',
        'Trend following strategies'
      )
    }

    if (userMessage.toLowerCase().includes('entry')) {
      topics.push(
        'Position sizing',
        'Stop loss placement',
        'Risk-reward ratios'
      )
    }

    return topics.slice(0, 3)
  }

  /**
   * Suggest next actions
   */
  suggestActions(assistantResponse, context) {
    const actions = []

    // If analysis was provided
    if (context.currentSymbol) {
      actions.push({
        label: 'Get trade recommendation',
        action: `Should I buy ${context.currentSymbol}?`
      })
      actions.push({
        label: 'Check other timeframes',
        action: `Analyze ${context.currentSymbol} on different timeframes`
      })
    }

    // If educational content
    if (assistantResponse.toLowerCase().includes('explanation') || assistantResponse.toLowerCase().includes('concept')) {
      actions.push({
        label: 'See practical example',
        action: 'Show me how to apply this'
      })
    }

    return actions.slice(0, 3)
  }
}

// ============================================================================
// EXPORTS (Enhanced)
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
  PERSONALITIES,

  // Advanced AI
  KnowledgeRetriever,
  ConversationMemory,
  DialogueStateTracker,
  ResponseQualityScorer,
  ClarificationDetector,
  ConversationSummarizer,
  ContextWindowManager,
  ResponsePersonalizer,
  ConfidenceScorer
}
