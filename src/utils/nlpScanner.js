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

// ============================================================================
// TF-IDF (TERM FREQUENCY-INVERSE DOCUMENT FREQUENCY)
// ============================================================================

/**
 * Calculate term frequency
 */
function calculateTF(term, document) {
  const words = document.toLowerCase().split(/\s+/)
  const termCount = words.filter(w => w === term.toLowerCase()).length
  return termCount / words.length
}

/**
 * Calculate inverse document frequency
 */
function calculateIDF(term, documents) {
  const docsWithTerm = documents.filter(doc =>
    doc.toLowerCase().includes(term.toLowerCase())
  ).length

  return Math.log((documents.length + 1) / (docsWithTerm + 1))
}

/**
 * Calculate TF-IDF score
 */
export function calculateTFIDF(term, document, corpus) {
  const tf = calculateTF(term, document)
  const idf = calculateIDF(term, corpus)
  return tf * idf
}

/**
 * Extract keywords using TF-IDF
 */
export function extractKeywords(query, corpus = []) {
  // Default corpus from example queries
  if (corpus.length === 0) {
    corpus = EXAMPLE_QUERIES.flatMap(cat => cat.queries)
  }

  const words = query.toLowerCase().split(/\s+/)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being'])

  const keywords = []

  for (const word of words) {
    if (stopWords.has(word) || word.length < 3) continue

    const score = calculateTFIDF(word, query, corpus)
    keywords.push({ word, score })
  }

  // Sort by score descending
  return keywords.sort((a, b) => b.score - a.score)
}

// ============================================================================
// WORD EMBEDDINGS & SEMANTIC SIMILARITY
// ============================================================================

/**
 * Simulate word embeddings using character n-grams
 * (Simplified version - real embeddings would use pre-trained models)
 */
function generateEmbedding(text, ngramSize = 3) {
  const ngrams = new Set()
  const normalized = text.toLowerCase()

  for (let i = 0; i <= normalized.length - ngramSize; i++) {
    ngrams.add(normalized.substring(i, i + ngramSize))
  }

  return Array.from(ngrams)
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.includes(x)))
  const union = new Set([...set1, ...set2])

  return union.size === 0 ? 0 : intersection.size / union.size
}

/**
 * Calculate cosine similarity between two text vectors
 */
export function cosineSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)

  // Create vocabulary
  const vocab = new Set([...words1, ...words2])

  // Create vectors
  const vec1 = Array.from(vocab).map(word => words1.filter(w => w === word).length)
  const vec2 = Array.from(vocab).map(word => words2.filter(w => w === word).length)

  // Calculate cosine similarity
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0)
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0))
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0))

  return mag1 === 0 || mag2 === 0 ? 0 : dotProduct / (mag1 * mag2)
}

/**
 * Find semantically similar queries
 */
export function findSimilarQueries(query, candidates, threshold = 0.5) {
  const similarities = candidates.map(candidate => ({
    query: candidate,
    similarity: cosineSimilarity(query, candidate)
  }))

  return similarities
    .filter(s => s.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
}

/**
 * Calculate semantic similarity using character n-grams
 */
export function semanticSimilarity(text1, text2) {
  const embedding1 = generateEmbedding(text1)
  const embedding2 = generateEmbedding(text2)

  return jaccardSimilarity(embedding1, embedding2)
}

// ============================================================================
// SPELL CORRECTION & TYPO HANDLING
// ============================================================================

/**
 * Damerau-Levenshtein distance (handles transpositions)
 */
function damerauLevenshtein(str1, str2) {
  const len1 = str1.length
  const len2 = str2.length

  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0))

  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )

      // Transposition
      if (i > 1 && j > 1 && str1[i - 1] === str2[j - 2] && str1[i - 2] === str2[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost)
      }
    }
  }

  return matrix[len1][len2]
}

/**
 * Build vocabulary from corpus
 */
function buildVocabulary(corpus) {
  const vocab = new Set()

  for (const doc of corpus) {
    const words = doc.toLowerCase().match(/\b\w+\b/g) || []
    words.forEach(word => vocab.add(word))
  }

  return vocab
}

/**
 * Suggest corrections for misspelled words
 */
export function suggestCorrection(word, vocabulary, maxDistance = 2) {
  const lowerWord = word.toLowerCase()

  // Exact match
  if (vocabulary.has(lowerWord)) {
    return { word, corrected: word, distance: 0, confidence: 1.0 }
  }

  // Find candidates within edit distance
  const candidates = []

  for (const candidate of vocabulary) {
    const distance = damerauLevenshtein(lowerWord, candidate)

    if (distance <= maxDistance) {
      candidates.push({
        word: candidate,
        distance,
        confidence: 1 - distance / Math.max(lowerWord.length, candidate.length)
      })
    }
  }

  if (candidates.length === 0) {
    return { word, corrected: word, distance: -1, confidence: 0 }
  }

  // Sort by distance (lower is better)
  candidates.sort((a, b) => a.distance - b.distance)

  return {
    word,
    corrected: candidates[0].word,
    distance: candidates[0].distance,
    confidence: candidates[0].confidence,
    alternatives: candidates.slice(1, 3)
  }
}

/**
 * Auto-correct query
 */
export function correctQuery(query, corpus = []) {
  if (corpus.length === 0) {
    corpus = EXAMPLE_QUERIES.flatMap(cat => cat.queries)
  }

  const vocabulary = buildVocabulary(corpus)
  const words = query.split(/\s+/)
  const corrected = []
  const corrections = []

  for (const word of words) {
    const result = suggestCorrection(word, vocabulary)

    if (result.distance > 0 && result.distance !== -1) {
      corrections.push({
        original: word,
        corrected: result.corrected,
        confidence: result.confidence
      })
      corrected.push(result.corrected)
    } else {
      corrected.push(word)
    }
  }

  return {
    originalQuery: query,
    correctedQuery: corrected.join(' '),
    corrections,
    hasCorrected: corrections.length > 0
  }
}

// ============================================================================
// N-GRAM ANALYSIS
// ============================================================================

/**
 * Extract n-grams from text
 */
export function extractNgrams(text, n = 2) {
  const words = text.toLowerCase().split(/\s+/)
  const ngrams = []

  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '))
  }

  return ngrams
}

/**
 * Count n-gram frequencies
 */
export function ngramFrequency(text, n = 2) {
  const ngrams = extractNgrams(text, n)
  const freq = {}

  for (const ngram of ngrams) {
    freq[ngram] = (freq[ngram] || 0) + 1
  }

  return freq
}

/**
 * Find common n-grams in corpus
 */
export function findCommonNgrams(corpus, n = 2, topK = 10) {
  const allFreq = {}

  for (const doc of corpus) {
    const freq = ngramFrequency(doc, n)
    for (const [ngram, count] of Object.entries(freq)) {
      allFreq[ngram] = (allFreq[ngram] || 0) + count
    }
  }

  return Object.entries(allFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([ngram, count]) => ({ ngram, count }))
}

// ============================================================================
// PART-OF-SPEECH TAGGING (SIMPLIFIED)
// ============================================================================

/**
 * Simple POS tagger using pattern matching
 */
const POS_PATTERNS = {
  VERB: /\b(find|show|get|search|filter|rank|sort|list|scan|analyze|compare|tell)\b/i,
  NOUN: /\b(stock|stocks|symbol|indicator|price|volume|trend|market|cap)\b/i,
  ADJ: /\b(high|low|strong|weak|bullish|bearish|oversold|overbought|above|below)\b/i,
  NUM: /\b\d+(\.\d+)?[kKmMbB]?\b/,
  COMP: /\b(above|below|over|under|greater|less|more|higher|lower)\b/i,
  CONJ: /\b(and|or|but|with)\b/i,
  PREP: /\b(with|in|on|at|by|for|from|to)\b/i
}

/**
 * Tag parts of speech
 */
export function tagPOS(text) {
  const words = text.split(/\s+/)
  const tagged = []

  for (const word of words) {
    let tag = 'OTHER'

    for (const [posTag, pattern] of Object.entries(POS_PATTERNS)) {
      if (pattern.test(word)) {
        tag = posTag
        break
      }
    }

    tagged.push({ word, tag })
  }

  return tagged
}

/**
 * Extract phrases by POS patterns
 */
export function extractPhrases(text) {
  const tagged = tagPOS(text)
  const phrases = {
    verbPhrases: [],
    nounPhrases: [],
    comparisons: []
  }

  // Extract verb phrases (VERB + NOUN)
  for (let i = 0; i < tagged.length - 1; i++) {
    if (tagged[i].tag === 'VERB' && tagged[i + 1].tag === 'NOUN') {
      phrases.verbPhrases.push(`${tagged[i].word} ${tagged[i + 1].word}`)
    }
  }

  // Extract noun phrases (ADJ + NOUN)
  for (let i = 0; i < tagged.length - 1; i++) {
    if (tagged[i].tag === 'ADJ' && tagged[i + 1].tag === 'NOUN') {
      phrases.nounPhrases.push(`${tagged[i].word} ${tagged[i + 1].word}`)
    }
  }

  // Extract comparisons (NOUN + COMP + NUM)
  for (let i = 0; i < tagged.length - 2; i++) {
    if (tagged[i].tag === 'NOUN' && tagged[i + 1].tag === 'COMP' && tagged[i + 2].tag === 'NUM') {
      phrases.comparisons.push(`${tagged[i].word} ${tagged[i + 1].word} ${tagged[i + 2].word}`)
    }
  }

  return phrases
}

// ============================================================================
// QUERY TEMPLATES & SLOT FILLING
// ============================================================================

/**
 * Query template definitions
 */
const QUERY_TEMPLATES = [
  {
    name: 'basic_indicator',
    pattern: /find stocks with (?<indicator>\w+) (?<operator>above|below) (?<value>\d+)/i,
    slots: ['indicator', 'operator', 'value']
  },
  {
    name: 'trend_filter',
    pattern: /(?<adjective>strong|weak)? (?<direction>up|down)trend(?:ing)? stocks/i,
    slots: ['direction', 'adjective']
  },
  {
    name: 'price_range',
    pattern: /price between \$?(?<min>\d+) and \$?(?<max>\d+)/i,
    slots: ['min', 'max']
  },
  {
    name: 'volume_condition',
    pattern: /(?<level>high|low) volume/i,
    slots: ['level']
  },
  {
    name: 'crossover',
    pattern: /(?<ind1>\w+)-(?<period1>\d+) cross(?:ed|es)? (?<direction>above|below) (?<ind2>\w+)-(?<period2>\d+)/i,
    slots: ['ind1', 'period1', 'direction', 'ind2', 'period2']
  }
]

/**
 * Match query against templates and extract slots
 */
export function matchTemplate(query) {
  for (const template of QUERY_TEMPLATES) {
    const match = query.match(template.pattern)

    if (match && match.groups) {
      return {
        template: template.name,
        slots: match.groups,
        confidence: 1.0
      }
    }
  }

  return null
}

/**
 * Fill template slots from query
 */
export function fillSlots(query, templateName) {
  const template = QUERY_TEMPLATES.find(t => t.name === templateName)

  if (!template) {
    return null
  }

  const match = query.match(template.pattern)

  if (!match || !match.groups) {
    return null
  }

  const slots = {}
  for (const slot of template.slots) {
    slots[slot] = match.groups[slot] || null
  }

  return {
    template: templateName,
    slots,
    complete: Object.values(slots).every(v => v !== null)
  }
}

// ============================================================================
// CONTEXT TRACKING & SESSION MANAGEMENT
// ============================================================================

/**
 * Session context manager
 */
export class QueryContext {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.queries = []
    this.entities = new Set()
    this.preferences = {}
    this.lastIntent = null
    this.conversationState = 'initial'
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  addQuery(query, parsedQuery) {
    this.queries.push({
      query,
      parsedQuery,
      timestamp: Date.now()
    })

    // Update context
    if (parsedQuery.entities) {
      parsedQuery.entities.indicators?.forEach(ind => this.entities.add(ind.key))
      parsedQuery.entities.symbols?.forEach(sym => this.entities.add(sym))
    }

    if (parsedQuery.intent) {
      this.lastIntent = parsedQuery.intent
    }

    // Update conversation state
    this.updateConversationState(parsedQuery)

    // Keep only recent queries
    if (this.queries.length > 20) {
      this.queries = this.queries.slice(-20)
    }
  }

  updateConversationState(parsedQuery) {
    if (parsedQuery.intent === INTENTS.FIND || parsedQuery.intent === INTENTS.SCAN) {
      this.conversationState = 'searching'
    } else if (parsedQuery.intent === INTENTS.FILTER) {
      this.conversationState = 'refining'
    } else if (parsedQuery.intent === INTENTS.COMPARE || parsedQuery.intent === INTENTS.ANALYZE) {
      this.conversationState = 'analyzing'
    }
  }

  getRecentIndicators(limit = 5) {
    return Array.from(this.entities)
      .filter(e => INDICATOR_KNOWLEDGE[e])
      .slice(-limit)
  }

  getContextualSuggestions() {
    const suggestions = []

    // Suggest refinements based on last intent
    if (this.lastIntent === INTENTS.FIND) {
      suggestions.push('Refine results with additional filters')
      suggestions.push('Sort by specific indicator')
    } else if (this.lastIntent === INTENTS.FILTER) {
      suggestions.push('Add more conditions')
      suggestions.push('Remove some filters')
    }

    // Suggest based on recent indicators
    const recentIndicators = this.getRecentIndicators(3)
    if (recentIndicators.length > 0) {
      suggestions.push(`Try combining with ${recentIndicators.join(', ')}`)
    }

    return suggestions
  }

  getContextSummary() {
    return {
      sessionId: this.sessionId,
      queryCount: this.queries.length,
      entities: Array.from(this.entities),
      lastIntent: this.lastIntent,
      conversationState: this.conversationState,
      preferences: this.preferences
    }
  }

  reset() {
    this.sessionId = this.generateSessionId()
    this.queries = []
    this.entities = new Set()
    this.preferences = {}
    this.lastIntent = null
    this.conversationState = 'initial'
  }
}

// ============================================================================
// QUERY DECOMPOSITION
// ============================================================================

/**
 * Decompose complex query into simpler subqueries
 */
export function decomposeQuery(query) {
  const subqueries = []

  // Split by conjunctions
  const parts = query.split(/\b(and|with|,)\b/i)

  let currentQuery = ''
  for (const part of parts) {
    const trimmed = part.trim()

    if (['and', 'with', ','].includes(trimmed.toLowerCase())) {
      if (currentQuery) {
        subqueries.push(currentQuery.trim())
        currentQuery = ''
      }
    } else {
      currentQuery += ' ' + trimmed
    }
  }

  if (currentQuery.trim()) {
    subqueries.push(currentQuery.trim())
  }

  return subqueries.map(sq => ({
    query: sq,
    parsed: parseQuery(sq)
  }))
}

/**
 * Merge multiple filters into one
 */
export function mergeFilters(filters) {
  const merged = {
    indicators: {},
    conditions: [],
    timeframe: filters[0]?.timeframe || '1d'
  }

  for (const filter of filters) {
    // Merge indicators
    Object.assign(merged.indicators, filter.indicators)

    // Merge conditions
    if (filter.conditions) {
      merged.conditions.push(...filter.conditions)
    }

    // Merge price
    if (filter.price) {
      merged.price = filter.price
    }
  }

  return merged
}

// ============================================================================
// BM25 RANKING ALGORITHM
// ============================================================================

/**
 * Calculate BM25 score for document relevance
 */
export function calculateBM25(query, document, corpus, k1 = 1.5, b = 0.75) {
  const queryTerms = query.toLowerCase().split(/\s+/)
  const docTerms = document.toLowerCase().split(/\s+/)

  const avgDocLength = corpus.reduce((sum, doc) =>
    sum + doc.split(/\s+/).length, 0
  ) / corpus.length

  const docLength = docTerms.length

  let score = 0

  for (const term of queryTerms) {
    const termFreq = docTerms.filter(t => t === term).length
    const docFreq = corpus.filter(doc =>
      doc.toLowerCase().includes(term)
    ).length

    const idf = Math.log((corpus.length - docFreq + 0.5) / (docFreq + 0.5) + 1)

    const numerator = termFreq * (k1 + 1)
    const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength))

    score += idf * (numerator / denominator)
  }

  return score
}

/**
 * Rank documents by BM25 relevance
 */
export function rankByBM25(query, documents) {
  const scores = documents.map(doc => ({
    document: doc,
    score: calculateBM25(query, doc, documents)
  }))

  return scores.sort((a, b) => b.score - a.score)
}

// ============================================================================
// SEMANTIC ROLE LABELING (SIMPLIFIED)
// ============================================================================

/**
 * Extract semantic roles (simplified version)
 */
export function extractSemanticRoles(query) {
  const roles = {
    action: null, // What to do
    target: null, // What to act on
    constraint: [], // Conditions
    modifier: [] // Qualifiers
  }

  const tagged = tagPOS(query)

  // Extract action (verb)
  const verbIdx = tagged.findIndex(t => t.tag === 'VERB')
  if (verbIdx !== -1) {
    roles.action = tagged[verbIdx].word
  }

  // Extract target (noun after verb)
  if (verbIdx !== -1 && verbIdx < tagged.length - 1) {
    const nounIdx = tagged.findIndex((t, i) => i > verbIdx && t.tag === 'NOUN')
    if (nounIdx !== -1) {
      roles.target = tagged[nounIdx].word
    }
  }

  // Extract constraints (comparisons)
  for (let i = 0; i < tagged.length - 2; i++) {
    if (tagged[i].tag === 'NOUN' && tagged[i + 1].tag === 'COMP') {
      roles.constraint.push({
        entity: tagged[i].word,
        operator: tagged[i + 1].word,
        value: tagged[i + 2]?.word
      })
    }
  }

  // Extract modifiers (adjectives)
  roles.modifier = tagged.filter(t => t.tag === 'ADJ').map(t => t.word)

  return roles
}

// ============================================================================
// QUERY EXPANSION
// ============================================================================

/**
 * Synonym dictionary for query expansion
 */
const SYNONYMS = {
  'find': ['show', 'get', 'list', 'search'],
  'stocks': ['companies', 'equities', 'securities'],
  'high': ['elevated', 'strong', 'increased'],
  'low': ['weak', 'decreased', 'reduced'],
  'above': ['over', 'greater than', 'higher than'],
  'below': ['under', 'less than', 'lower than'],
  'uptrend': ['bullish', 'rising', 'ascending'],
  'downtrend': ['bearish', 'falling', 'descending']
}

/**
 * Expand query with synonyms
 */
export function expandQuery(query) {
  const words = query.toLowerCase().split(/\s+/)
  const expansions = new Set([query])

  for (const word of words) {
    if (SYNONYMS[word]) {
      for (const synonym of SYNONYMS[word]) {
        const expanded = query.replace(new RegExp(`\\b${word}\\b`, 'i'), synonym)
        expansions.add(expanded)
      }
    }
  }

  return Array.from(expansions)
}

/**
 * Generate query variations
 */
export function generateQueryVariations(query) {
  const variations = new Set([query])

  // Add synonym expansions
  const expanded = expandQuery(query)
  expanded.forEach(v => variations.add(v))

  // Add with/without punctuation
  variations.add(query.replace(/[.,!?]/g, ''))

  // Add with/without extra spaces
  variations.add(query.replace(/\s+/g, ' '))

  return Array.from(variations)
}

// ============================================================================
// SENTIMENT ANALYSIS (SIMPLIFIED)
// ============================================================================

/**
 * Sentiment lexicon
 */
const SENTIMENT_WORDS = {
  positive: ['bullish', 'strong', 'high', 'above', 'rising', 'increased', 'gain', 'profit', 'up'],
  negative: ['bearish', 'weak', 'low', 'below', 'falling', 'decreased', 'loss', 'down'],
  neutral: ['stable', 'flat', 'unchanged', 'steady']
}

/**
 * Analyze sentiment of query
 */
export function analyzeSentiment(query) {
  const words = query.toLowerCase().split(/\s+/)

  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0

  for (const word of words) {
    if (SENTIMENT_WORDS.positive.includes(word)) positiveCount++
    if (SENTIMENT_WORDS.negative.includes(word)) negativeCount++
    if (SENTIMENT_WORDS.neutral.includes(word)) neutralCount++
  }

  const total = positiveCount + negativeCount + neutralCount

  if (total === 0) {
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      scores: { positive: 0, negative: 0, neutral: 0 }
    }
  }

  const scores = {
    positive: positiveCount / total,
    negative: negativeCount / total,
    neutral: neutralCount / total
  }

  let sentiment = 'neutral'
  let confidence = 0.5

  if (scores.positive > scores.negative && scores.positive > scores.neutral) {
    sentiment = 'positive'
    confidence = scores.positive
  } else if (scores.negative > scores.positive && scores.negative > scores.neutral) {
    sentiment = 'negative'
    confidence = scores.negative
  } else {
    sentiment = 'neutral'
    confidence = Math.max(scores.neutral, 0.5)
  }

  return {
    sentiment,
    confidence,
    scores
  }
}

// ============================================================================
// ADVANCED QUERY UNDERSTANDING
// ============================================================================

/**
 * Comprehensive query understanding
 */
export function understandQuery(query) {
  return {
    original: query,
    corrected: correctQuery(query),
    intent: classifyIntent(query),
    entities: extractEntities(query),
    keywords: extractKeywords(query),
    phrases: extractPhrases(query),
    semanticRoles: extractSemanticRoles(query),
    sentiment: analyzeSentiment(query),
    template: matchTemplate(query),
    decomposed: decomposeQuery(query),
    variations: generateQueryVariations(query),
    pos: tagPOS(query)
  }
}

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
  OPERATORS,

  // Advanced NLP
  calculateTFIDF,
  extractKeywords,
  cosineSimilarity,
  semanticSimilarity,
  findSimilarQueries,
  suggestCorrection,
  correctQuery,
  extractNgrams,
  ngramFrequency,
  findCommonNgrams,
  tagPOS,
  extractPhrases,
  matchTemplate,
  fillSlots,
  QueryContext,
  decomposeQuery,
  mergeFilters,
  calculateBM25,
  rankByBM25,
  extractSemanticRoles,
  expandQuery,
  generateQueryVariations,
  analyzeSentiment,
  understandQuery
}
