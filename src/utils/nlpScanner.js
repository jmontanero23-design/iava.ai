/**
 * Natural Language Processing Scanner - PhD Elite Edition
 *
 * Converts plain English queries into structured technical filters
 *
 * Features:
 * - Intent classification (find, filter, rank, compare)
 * - Entity extraction (symbols, indicators, values, operators)
 * - Query parsing and understanding
 * - Filter object generation
 * - Example query templates
 * - Fuzzy matching for indicator names
 * - Query validation and error handling
 * - Context awareness (query history)
 * - Query optimization and rewriting
 * - Natural language output generation
 *
 * @module nlpScanner
 */

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

const INTENTS = {
  FIND: 'find', // Find stocks matching criteria
  FILTER: 'filter', // Filter existing list
  RANK: 'rank', // Rank by criteria
  COMPARE: 'compare', // Compare stocks
  ANALYZE: 'analyze', // Analyze stock
  SCAN: 'scan', // Scan market
  ALERT: 'alert' // Set up alert
}

/**
 * Intent patterns and keywords
 */
const INTENT_PATTERNS = {
  [INTENTS.FIND]: [
    /find (me |all )?stocks?/i,
    /show (me |all )?stocks?/i,
    /get (me |all )?stocks?/i,
    /which stocks?/i,
    /what stocks?/i,
    /list (all )?stocks?/i
  ],
  [INTENTS.FILTER]: [
    /filter (by |for |on )?/i,
    /narrow down/i,
    /only (show|include)/i,
    /exclude/i,
    /where/i
  ],
  [INTENTS.RANK]: [
    /rank (by |stocks?)?/i,
    /sort (by |stocks?)?/i,
    /order (by |stocks?)?/i,
    /top \d+/i,
    /best/i,
    /highest/i,
    /lowest/i
  ],
  [INTENTS.COMPARE]: [
    /compare/i,
    /versus|vs\.?/i,
    /difference between/i,
    /better than/i
  ],
  [INTENTS.ANALYZE]: [
    /analyze/i,
    /analysis of/i,
    /tell me about/i,
    /what('s| is)/i
  ],
  [INTENTS.SCAN]: [
    /scan (the )?market/i,
    /screen/i,
    /search (the )?market/i
  ],
  [INTENTS.ALERT]: [
    /alert (me )?when/i,
    /notify (me )?when/i,
    /tell me (if|when)/i,
    /watch for/i
  ]
}

/**
 * Classify query intent
 */
function classifyIntent(query) {
  const lowerQuery = query.toLowerCase()

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerQuery)) {
        return intent
      }
    }
  }

  // Default to FIND if no intent matches
  return INTENTS.FIND
}

// ============================================================================
// INDICATOR KNOWLEDGE BASE
// ============================================================================

/**
 * Technical indicators with aliases and patterns
 */
const INDICATOR_KNOWLEDGE = {
  rsi: {
    name: 'RSI',
    fullName: 'Relative Strength Index',
    aliases: ['rsi', 'relative strength', 'relative strength index'],
    valueRange: [0, 100],
    defaultParams: { period: 14 },
    commonThresholds: { oversold: 30, overbought: 70 }
  },
  macd: {
    name: 'MACD',
    fullName: 'Moving Average Convergence Divergence',
    aliases: ['macd', 'moving average convergence', 'mac d'],
    valueRange: [-Infinity, Infinity],
    defaultParams: { fast: 12, slow: 26, signal: 9 }
  },
  ema: {
    name: 'EMA',
    fullName: 'Exponential Moving Average',
    aliases: ['ema', 'exponential moving average', 'exponential ma'],
    valueRange: [0, Infinity],
    defaultParams: { period: 20 }
  },
  sma: {
    name: 'SMA',
    fullName: 'Simple Moving Average',
    aliases: ['sma', 'simple moving average', 'simple ma', 'moving average'],
    valueRange: [0, Infinity],
    defaultParams: { period: 20 }
  },
  adx: {
    name: 'ADX',
    fullName: 'Average Directional Index',
    aliases: ['adx', 'average directional', 'directional index'],
    valueRange: [0, 100],
    defaultParams: { period: 14 },
    commonThresholds: { weak: 20, strong: 40 }
  },
  atr: {
    name: 'ATR',
    fullName: 'Average True Range',
    aliases: ['atr', 'average true range', 'true range'],
    valueRange: [0, Infinity],
    defaultParams: { period: 14 }
  },
  bbands: {
    name: 'Bollinger Bands',
    fullName: 'Bollinger Bands',
    aliases: ['bollinger', 'bollinger bands', 'bb', 'bbands'],
    valueRange: [0, Infinity],
    defaultParams: { period: 20, stdDev: 2 }
  },
  volume: {
    name: 'Volume',
    fullName: 'Trading Volume',
    aliases: ['volume', 'vol', 'trading volume'],
    valueRange: [0, Infinity]
  },
  price: {
    name: 'Price',
    fullName: 'Stock Price',
    aliases: ['price', 'close', 'closing price', 'stock price'],
    valueRange: [0, Infinity]
  },
  marketCap: {
    name: 'Market Cap',
    fullName: 'Market Capitalization',
    aliases: ['market cap', 'marketcap', 'market capitalization', 'cap'],
    valueRange: [0, Infinity]
  }
}

/**
 * Fuzzy match indicator name
 */
function matchIndicator(text) {
  const lowerText = text.toLowerCase()

  // Exact match first
  for (const [key, indicator] of Object.entries(INDICATOR_KNOWLEDGE)) {
    for (const alias of indicator.aliases) {
      if (lowerText === alias || lowerText.includes(alias)) {
        return { key, ...indicator, confidence: 1.0 }
      }
    }
  }

  // Fuzzy match using Levenshtein distance
  let bestMatch = null
  let bestDistance = Infinity

  for (const [key, indicator] of Object.entries(INDICATOR_KNOWLEDGE)) {
    for (const alias of indicator.aliases) {
      const distance = levenshteinDistance(lowerText, alias)
      const maxLength = Math.max(lowerText.length, alias.length)
      const similarity = 1 - distance / maxLength

      if (similarity > 0.6 && distance < bestDistance) {
        bestDistance = distance
        bestMatch = { key, ...indicator, confidence: similarity }
      }
    }
  }

  return bestMatch
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1, str2) {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// ============================================================================
// ENTITY EXTRACTION
// ============================================================================

/**
 * Operators and their meanings
 */
const OPERATORS = {
  '>': 'greater_than',
  '>=': 'greater_than_or_equal',
  '<': 'less_than',
  '<=': 'less_than_or_equal',
  '=': 'equal',
  '==': 'equal',
  '!=': 'not_equal',
  'above': 'greater_than',
  'below': 'less_than',
  'over': 'greater_than',
  'under': 'less_than',
  'greater than': 'greater_than',
  'less than': 'less_than',
  'more than': 'greater_than',
  'at least': 'greater_than_or_equal',
  'at most': 'less_than_or_equal',
  'between': 'between',
  'crossed above': 'crossover_above',
  'crossed below': 'crossover_below'
}

/**
 * Extract numeric values from text
 */
function extractNumbers(text) {
  const numbers = []
  const patterns = [
    /(\d+\.?\d*)[kK]\b/g, // 100k format
    /(\d+\.?\d*)[mM]\b/g, // 100m format
    /(\d+\.?\d*)[bB]\b/g, // 100b format
    /\$(\d+\.?\d*)/g, // $100 format
    /(\d+\.?\d*)%/g, // 100% format
    /\b(\d+\.?\d*)\b/g // Plain numbers
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      let value = parseFloat(match[1])

      // Apply multipliers
      if (match[0].toLowerCase().includes('k')) value *= 1000
      if (match[0].toLowerCase().includes('m')) value *= 1000000
      if (match[0].toLowerCase().includes('b')) value *= 1000000000

      numbers.push({
        value,
        text: match[0],
        index: match.index,
        isPercentage: match[0].includes('%'),
        isDollar: match[0].includes('$')
      })
    }
  }

  return numbers
}

/**
 * Extract operators from text
 */
function extractOperators(text) {
  const operators = []
  const lowerText = text.toLowerCase()

  for (const [pattern, type] of Object.entries(OPERATORS)) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi')
    let match

    while ((match = regex.exec(lowerText)) !== null) {
      operators.push({
        type,
        text: match[0],
        index: match.index
      })
    }
  }

  // Sort by index
  return operators.sort((a, b) => a.index - b.index)
}

/**
 * Extract timeframes
 */
function extractTimeframes(text) {
  const timeframePatterns = {
    '1m': /\b1\s?min(ute)?(s)?\b/i,
    '5m': /\b5\s?min(ute)?(s)?\b/i,
    '15m': /\b15\s?min(ute)?(s)?\b/i,
    '1h': /\b1\s?hour(s)?\b|\bhourly\b/i,
    '4h': /\b4\s?hour(s)?\b/i,
    '1d': /\bdaily\b|\bday\b|\b1\s?day\b/i,
    '1w': /\bweekly\b|\bweek\b|\b1\s?week\b/i
  }

  for (const [timeframe, pattern] of Object.entries(timeframePatterns)) {
    if (pattern.test(text)) {
      return timeframe
    }
  }

  return '1d' // Default to daily
}

/**
 * Extract stock symbols
 */
function extractSymbols(text) {
  const symbols = []

  // Pattern: $SYMBOL or uppercase 1-5 letter word
  const symbolPattern = /\$([A-Z]{1,5})\b|(?:^|\s)([A-Z]{2,5})(?=\s|$)/g

  let match
  while ((match = symbolPattern.exec(text)) !== null) {
    const symbol = match[1] || match[2]

    // Filter out common false positives
    const falsePositives = ['RSI', 'MACD', 'EMA', 'SMA', 'ADX', 'ATR', 'AND', 'OR', 'NOT']
    if (!falsePositives.includes(symbol)) {
      symbols.push(symbol)
    }
  }

  return [...new Set(symbols)]
}

/**
 * Extract all entities from query
 */
function extractEntities(query) {
  const entities = {
    indicators: [],
    numbers: extractNumbers(query),
    operators: extractOperators(query),
    timeframe: extractTimeframes(query),
    symbols: extractSymbols(query)
  }

  // Extract indicators using knowledge base
  for (const [key, indicator] of Object.entries(INDICATOR_KNOWLEDGE)) {
    for (const alias of indicator.aliases) {
      if (query.toLowerCase().includes(alias)) {
        entities.indicators.push({
          key,
          name: indicator.name,
          alias,
          ...indicator
        })
        break
      }
    }
  }

  return entities
}

// ============================================================================
// FILTER GENERATION
// ============================================================================

/**
 * Generate filter object from entities
 */
function generateFilter(entities, query) {
  const filter = {
    indicators: {},
    conditions: [],
    timeframe: entities.timeframe || '1d'
  }

  const lowerQuery = query.toLowerCase()

  // Process each indicator with its conditions
  entities.indicators.forEach(indicator => {
    const indicatorFilter = {
      type: indicator.key,
      name: indicator.name
    }

    // Find associated numbers and operators
    const indicatorIndex = query.toLowerCase().indexOf(indicator.alias)
    const nearbyText = query.substring(indicatorIndex, indicatorIndex + 100)

    // Extract operator
    const operator = entities.operators.find(op =>
      op.index > indicatorIndex && op.index < indicatorIndex + 100
    )

    // Extract value
    const number = entities.numbers.find(num =>
      num.index > indicatorIndex && num.index < indicatorIndex + 100
    )

    if (operator && number) {
      indicatorFilter.operator = operator.type
      indicatorFilter.value = number.value

      // Handle "between" operator
      if (operator.type === 'between') {
        const numbers = entities.numbers.filter(num =>
          num.index > operator.index
        )
        if (numbers.length >= 2) {
          indicatorFilter.min = Math.min(numbers[0].value, numbers[1].value)
          indicatorFilter.max = Math.max(numbers[0].value, numbers[1].value)
          delete indicatorFilter.value
        }
      }
    }

    // Apply common patterns
    if (indicator.key === 'rsi') {
      if (lowerQuery.includes('oversold') && !number) {
        indicatorFilter.operator = 'less_than'
        indicatorFilter.value = 30
      } else if (lowerQuery.includes('overbought') && !number) {
        indicatorFilter.operator = 'greater_than'
        indicatorFilter.value = 70
      }
    }

    if (indicator.key === 'adx') {
      if (lowerQuery.includes('strong trend') && !number) {
        indicatorFilter.operator = 'greater_than'
        indicatorFilter.value = 25
      }
    }

    filter.indicators[indicator.key] = indicatorFilter
  })

  // Handle crossovers
  if (lowerQuery.includes('cross')) {
    const emaMatch = /ema[- ]?(\d+).*cross.*ema[- ]?(\d+)/i.exec(query)
    if (emaMatch) {
      filter.conditions.push({
        type: 'crossover',
        indicator1: { type: 'ema', period: parseInt(emaMatch[1]) },
        indicator2: { type: 'ema', period: parseInt(emaMatch[2]) },
        direction: lowerQuery.includes('above') ? 'above' : 'below'
      })
    }
  }

  // Handle trend conditions
  if (lowerQuery.includes('uptrend') || lowerQuery.includes('up trend')) {
    filter.conditions.push({
      type: 'trend',
      direction: 'up'
    })
  } else if (lowerQuery.includes('downtrend') || lowerQuery.includes('down trend')) {
    filter.conditions.push({
      type: 'trend',
      direction: 'down'
    })
  }

  // Handle volume conditions
  if (lowerQuery.includes('high volume')) {
    filter.conditions.push({
      type: 'volume',
      level: 'high'
    })
  } else if (lowerQuery.includes('low volume')) {
    filter.conditions.push({
      type: 'volume',
      level: 'low'
    })
  }

  // Handle price conditions
  const priceMatch = /price (above|below|over|under) \$?(\d+\.?\d*)/i.exec(query)
  if (priceMatch) {
    filter.price = {
      operator: priceMatch[1].toLowerCase() === 'above' || priceMatch[1].toLowerCase() === 'over'
        ? 'greater_than'
        : 'less_than',
      value: parseFloat(priceMatch[2])
    }
  }

  return filter
}

// ============================================================================
// QUERY PARSER
// ============================================================================

/**
 * Parse natural language query into structured format
 */
export function parseQuery(query) {
  if (!query || query.trim().length === 0) {
    return {
      success: false,
      error: 'Query is empty'
    }
  }

  try {
    const intent = classifyIntent(query)
    const entities = extractEntities(query)
    const filter = generateFilter(entities, query)

    return {
      success: true,
      query,
      intent,
      entities,
      filter,
      confidence: calculateConfidence(entities, filter)
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query
    }
  }
}

/**
 * Calculate confidence score for parsed query
 */
function calculateConfidence(entities, filter) {
  let score = 0
  let maxScore = 0

  // Indicators found
  maxScore += 40
  score += Math.min(entities.indicators.length * 20, 40)

  // Operators found
  maxScore += 20
  score += entities.operators.length > 0 ? 20 : 0

  // Numbers found
  maxScore += 20
  score += entities.numbers.length > 0 ? 20 : 0

  // Filter generated
  maxScore += 20
  if (Object.keys(filter.indicators).length > 0 || filter.conditions.length > 0) {
    score += 20
  }

  return Math.round((score / maxScore) * 100)
}

// ============================================================================
// QUERY VALIDATION
// ============================================================================

/**
 * Validate parsed filter
 */
export function validateFilter(filter) {
  const errors = []
  const warnings = []

  // Check if filter has any conditions
  if (Object.keys(filter.indicators).length === 0 && filter.conditions.length === 0) {
    errors.push('No indicators or conditions specified')
  }

  // Validate indicator values
  for (const [key, indicatorFilter] of Object.entries(filter.indicators)) {
    const indicator = INDICATOR_KNOWLEDGE[key]

    if (indicator && indicator.valueRange) {
      const [min, max] = indicator.valueRange

      if (indicatorFilter.value !== undefined) {
        if (indicatorFilter.value < min || indicatorFilter.value > max) {
          warnings.push(
            `${indicator.name} value ${indicatorFilter.value} is outside normal range [${min}, ${max}]`
          )
        }
      }

      if (indicatorFilter.min !== undefined && indicatorFilter.max !== undefined) {
        if (indicatorFilter.min < min || indicatorFilter.max > max) {
          warnings.push(
            `${indicator.name} range [${indicatorFilter.min}, ${indicatorFilter.max}] is outside normal range [${min}, ${max}]`
          )
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// QUERY OPTIMIZATION
// ============================================================================

/**
 * Optimize and rewrite query for better performance
 */
export function optimizeFilter(filter) {
  const optimized = JSON.parse(JSON.stringify(filter))

  // Combine redundant conditions
  if (optimized.conditions.length > 1) {
    const trendConditions = optimized.conditions.filter(c => c.type === 'trend')
    if (trendConditions.length > 1) {
      // Keep only one trend condition
      optimized.conditions = optimized.conditions.filter(c => c.type !== 'trend')
      optimized.conditions.push(trendConditions[0])
    }
  }

  // Sort indicators by computational cost (cheaper first)
  const costOrder = ['price', 'volume', 'rsi', 'ema', 'sma', 'macd', 'adx', 'bbands', 'atr']

  const sortedIndicators = {}
  costOrder.forEach(key => {
    if (optimized.indicators[key]) {
      sortedIndicators[key] = optimized.indicators[key]
    }
  })

  optimized.indicators = sortedIndicators

  return optimized
}

// ============================================================================
// EXAMPLE QUERIES
// ============================================================================

/**
 * Example query templates
 */
export const EXAMPLE_QUERIES = [
  {
    category: 'Basic Indicators',
    queries: [
      'Find stocks with RSI below 30',
      'Show me stocks where RSI is oversold',
      'Stocks with RSI above 70',
      'Find overbought stocks'
    ]
  },
  {
    category: 'Moving Averages',
    queries: [
      'Find stocks where price is above EMA-20',
      'Show me stocks with EMA-50 above EMA-200',
      'Stocks where EMA-10 crossed above EMA-20',
      'Price above SMA-50'
    ]
  },
  {
    category: 'Trend & Momentum',
    queries: [
      'Find stocks in an uptrend with ADX above 25',
      'Show me strong trending stocks',
      'Stocks with MACD bullish crossover',
      'Uptrending stocks with high volume'
    ]
  },
  {
    category: 'Volume & Price',
    queries: [
      'Find stocks with price above $50 and high volume',
      'Show me stocks with volume above 1M',
      'Stocks between $10 and $100',
      'Price below $20 with increasing volume'
    ]
  },
  {
    category: 'Complex Conditions',
    queries: [
      'Find stocks with RSI below 30, ADX above 25, and price above EMA-20',
      'Show me oversold stocks in an uptrend',
      'Stocks with bullish MACD and RSI between 40 and 60',
      'Strong trending stocks with RSI not oversold'
    ]
  },
  {
    category: 'Market Cap',
    queries: [
      'Find large cap stocks with RSI below 30',
      'Show me stocks with market cap above 10B',
      'Small cap stocks in an uptrend',
      'Market cap between 1B and 10B'
    ]
  }
]

/**
 * Get random example query
 */
export function getRandomExample() {
  const allQueries = EXAMPLE_QUERIES.flatMap(cat => cat.queries)
  return allQueries[Math.floor(Math.random() * allQueries.length)]
}

/**
 * Get examples by category
 */
export function getExamplesByCategory(category) {
  const cat = EXAMPLE_QUERIES.find(c => c.category === category)
  return cat ? cat.queries : []
}

// ============================================================================
// NATURAL LANGUAGE OUTPUT
// ============================================================================

/**
 * Convert filter back to natural language
 */
export function filterToNaturalLanguage(filter) {
  const parts = []

  // Indicators
  for (const [key, indicatorFilter] of Object.entries(filter.indicators)) {
    const indicator = INDICATOR_KNOWLEDGE[key]
    if (!indicator) continue

    let phrase = indicator.name

    if (indicatorFilter.operator && indicatorFilter.value !== undefined) {
      const opText = {
        'greater_than': 'above',
        'greater_than_or_equal': 'at least',
        'less_than': 'below',
        'less_than_or_equal': 'at most',
        'equal': 'equals'
      }[indicatorFilter.operator] || indicatorFilter.operator

      phrase += ` ${opText} ${indicatorFilter.value}`
    } else if (indicatorFilter.min !== undefined && indicatorFilter.max !== undefined) {
      phrase += ` between ${indicatorFilter.min} and ${indicatorFilter.max}`
    }

    parts.push(phrase)
  }

  // Conditions
  filter.conditions?.forEach(condition => {
    if (condition.type === 'trend') {
      parts.push(`in ${condition.direction}trend`)
    } else if (condition.type === 'volume') {
      parts.push(`${condition.level} volume`)
    } else if (condition.type === 'crossover') {
      parts.push(
        `${condition.indicator1.type}-${condition.indicator1.period} ` +
        `crossed ${condition.direction} ` +
        `${condition.indicator2.type}-${condition.indicator2.period}`
      )
    }
  })

  // Price
  if (filter.price) {
    const opText = filter.price.operator === 'greater_than' ? 'above' : 'below'
    parts.push(`price ${opText} $${filter.price.value}`)
  }

  if (parts.length === 0) {
    return 'No filters specified'
  }

  return 'Stocks with ' + parts.join(', ')
}

// ============================================================================
// QUERY HISTORY & CONTEXT
// ============================================================================

/**
 * Query history manager
 */
export class QueryHistory {
  constructor(maxSize = 50) {
    this.maxSize = maxSize
    this.history = []
    this.load()
  }

  add(query, parsedQuery) {
    this.history.unshift({
      query,
      parsedQuery,
      timestamp: new Date().toISOString()
    })

    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize)
    }

    this.save()
  }

  getRecent(count = 10) {
    return this.history.slice(0, count)
  }

  search(term) {
    return this.history.filter(item =>
      item.query.toLowerCase().includes(term.toLowerCase())
    )
  }

  clear() {
    this.history = []
    this.save()
  }

  save() {
    try {
      localStorage.setItem('iava_query_history', JSON.stringify(this.history))
    } catch (error) {
      console.error('[NLP] Failed to save history:', error)
    }
  }

  load() {
    try {
      const data = localStorage.getItem('iava_query_history')
      if (data) {
        this.history = JSON.parse(data)
      }
    } catch (error) {
      console.error('[NLP] Failed to load history:', error)
      this.history = []
    }
  }
}

// ============================================================================
// SMART QUERY SUGGESTIONS
// ============================================================================

/**
 * Generate smart query suggestions based on context
 */
export function generateSuggestions(partialQuery, history = []) {
  const suggestions = []

  if (!partialQuery || partialQuery.length < 2) {
    // Return popular queries
    return [
      'Find stocks with RSI below 30',
      'Show me stocks in an uptrend',
      'Stocks with high volume',
      'Price above $50'
    ]
  }

  const lowerPartial = partialQuery.toLowerCase()

  // Find matching examples
  EXAMPLE_QUERIES.forEach(category => {
    category.queries.forEach(query => {
      if (query.toLowerCase().includes(lowerPartial)) {
        suggestions.push({
          query,
          category: category.category,
          source: 'example'
        })
      }
    })
  })

  // Find matching history
  history.forEach(item => {
    if (item.query.toLowerCase().includes(lowerPartial)) {
      suggestions.push({
        query: item.query,
        category: 'History',
        source: 'history',
        timestamp: item.timestamp
      })
    }
  })

  // Deduplicate and limit
  const unique = Array.from(new Map(suggestions.map(s => [s.query, s])).values())
  return unique.slice(0, 5)
}

// ============================================================================
// ADVANCED QUERY PARSING
// ============================================================================

/**
 * Parse complex queries with AND/OR logic
 */
export function parseComplexQuery(query) {
  // Split by AND/OR
  const orParts = query.split(/\bOR\b/i)

  if (orParts.length > 1) {
    // Handle OR logic
    return {
      logic: 'OR',
      queries: orParts.map(part => parseComplexQuery(part.trim()))
    }
  }

  const andParts = query.split(/\bAND\b/i)

  if (andParts.length > 1) {
    // Handle AND logic
    return {
      logic: 'AND',
      queries: andParts.map(part => parseQuery(part.trim()))
    }
  }

  // Single query
  return parseQuery(query)
}

/**
 * Evaluate complex query filter
 */
export function evaluateComplexFilter(stock, complexQuery) {
  if (complexQuery.logic === 'OR') {
    return complexQuery.queries.some(q =>
      evaluateComplexFilter(stock, q)
    )
  }

  if (complexQuery.logic === 'AND') {
    return complexQuery.queries.every(q =>
      evaluateComplexFilter(stock, q)
    )
  }

  // Single query - evaluate filter
  return evaluateFilter(stock, complexQuery.filter)
}

/**
 * Evaluate single filter against stock data
 */
function evaluateFilter(stock, filter) {
  // Check indicators
  for (const [key, indicatorFilter] of Object.entries(filter.indicators)) {
    const value = stock.indicators?.[key]
    if (value === undefined) return false

    if (indicatorFilter.operator && indicatorFilter.value !== undefined) {
      const result = evaluateOperator(value, indicatorFilter.operator, indicatorFilter.value)
      if (!result) return false
    }

    if (indicatorFilter.min !== undefined && indicatorFilter.max !== undefined) {
      if (value < indicatorFilter.min || value > indicatorFilter.max) {
        return false
      }
    }
  }

  // Check conditions
  if (filter.conditions) {
    for (const condition of filter.conditions) {
      if (condition.type === 'trend') {
        if (stock.trend !== condition.direction) return false
      }
      if (condition.type === 'volume') {
        if (stock.volumeLevel !== condition.level) return false
      }
    }
  }

  // Check price
  if (filter.price) {
    const result = evaluateOperator(stock.price, filter.price.operator, filter.price.value)
    if (!result) return false
  }

  return true
}

/**
 * Evaluate operator comparison
 */
function evaluateOperator(value, operator, threshold) {
  switch (operator) {
    case 'greater_than':
      return value > threshold
    case 'greater_than_or_equal':
      return value >= threshold
    case 'less_than':
      return value < threshold
    case 'less_than_or_equal':
      return value <= threshold
    case 'equal':
      return value === threshold
    case 'not_equal':
      return value !== threshold
    default:
      return false
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Main functions
  parseQuery,
  validateFilter,
  optimizeFilter,
  filterToNaturalLanguage,

  // Complex queries
  parseComplexQuery,
  evaluateComplexFilter,

  // Utilities
  classifyIntent,
  extractEntities,
  matchIndicator,
  generateSuggestions,

  // Examples
  EXAMPLE_QUERIES,
  getRandomExample,
  getExamplesByCategory,

  // History
  QueryHistory,

  // Constants
  INTENTS,
  INDICATOR_KNOWLEDGE,
  OPERATORS
}
