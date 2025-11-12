/**
 * AI Gateway Client
 * Frontend client for calling the AI API Gateway
 */

const GATEWAY_URL = '/api/ai/gateway'

/**
 * Call AI model through the gateway
 * @param {string} model - Model name (e.g., 'gpt-4o', 'claude-3-haiku')
 * @param {Array} messages - Chat messages in OpenAI format
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} AI response with usage and cost data
 */
export async function callAI(model, messages, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeout || 30000) // 30s default

  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        options
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 504 || response.status === 503) {
        throw new Error('AI service temporarily unavailable. Please check backend configuration and try again.')
      }
      if (response.status === 401) {
        throw new Error('API authentication failed. Please check your API key configuration.')
      }

      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Gateway error: ${response.statusText}`)
    }

    const data = await response.json()
    return data

  } catch (error) {
    clearTimeout(timeout)

    if (error.name === 'AbortError') {
      console.error('[AI Gateway Client] Request timeout after 30s')
      throw new Error('AI request timed out. The service may be overloaded or unavailable.')
    }

    console.error('[AI Gateway Client] Error:', error)
    throw error
  }
}

/**
 * Get gateway metrics
 * @returns {Promise<Object>} Metrics data
 */
export async function getGatewayMetrics() {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[AI Gateway Client] Metrics error:', error)
    return null
  }
}

/**
 * Explain a trading signal using AI
 * @param {Object} signal - Signal data
 * @param {Object} marketContext - Current market context
 * @returns {Promise<Object>} Explanation with reasoning
 */
export async function explainSignal(signal, marketContext = {}) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert trading analyst. Explain trading signals concisely and clearly, focusing on the key factors and implications.'
    },
    {
      role: 'user',
      content: `Explain this trading signal:

Signal: ${signal.symbol} ${signal.direction} at $${signal.price}
Indicators: ${JSON.stringify(signal.indicators, null, 2)}
Market Context: ${JSON.stringify(marketContext, null, 2)}

Provide a brief explanation covering:
1. What triggered this signal
2. Key supporting factors
3. Potential risks
4. Recommended action`
    }
  ]

  const result = await callAI('gpt-4o', messages, {
    temperature: 0.3,
    max_tokens: 500,
    cache: true,
    cacheTTL: 60,
    fallback: 'claude-sonnet-4-5'
  })

  return {
    explanation: result.content,
    confidence: 0.75, // Could be enhanced with sentiment analysis
    cost: result.cost,
    latency: result.latency,
    cached: result.cached
  }
}

/**
 * Analyze multiple signals and rank by quality
 * @param {Array} signals - Array of signals
 * @returns {Promise<Object>} Ranked signals with scores
 */
export async function rankSignals(signals) {
  const messages = [
    {
      role: 'system',
      content: 'You are a trading signal analyst. Analyze and rank signals by quality. Return JSON only.'
    },
    {
      role: 'user',
      content: `Rank these signals from best to worst quality. For each signal, provide a score (0-100) and brief reasoning.

Signals:
${JSON.stringify(signals.map(s => ({
  symbol: s.symbol,
  direction: s.direction,
  price: s.price,
  indicators: s.indicators
})), null, 2)}

Return JSON:
{
  "rankings": [
    { "symbol": "AAPL", "score": 85, "reasoning": "...", "rank": 1 },
    ...
  ]
}`
    }
  ]

  const result = await callAI('gpt-4o', messages, {
    temperature: 0.2,
    max_tokens: 1000,
    json: true,
    cache: true,
    cacheTTL: 120
  })

  try {
    return JSON.parse(result.content)
  } catch {
    return { rankings: [], error: 'Failed to parse response' }
  }
}

/**
 * Get market regime analysis from AI
 * @param {Object} regimeData - Current regime detection data
 * @param {Array} bars - Price bars
 * @returns {Promise<Object>} AI analysis of market regime
 */
export async function analyzeRegime(regimeData, bars) {
  const recentBars = bars.slice(-20) // Last 20 bars

  const messages = [
    {
      role: 'system',
      content: 'You are a market structure analyst. Analyze market regimes and provide actionable insights.'
    },
    {
      role: 'user',
      content: `Current market regime: ${regimeData.regime}
Confidence: ${regimeData.confidence}
Factors: ${JSON.stringify(regimeData.factors, null, 2)}

Recent price action (last 20 bars):
High: ${Math.max(...recentBars.map(b => b.high))}
Low: ${Math.min(...recentBars.map(b => b.low))}
Current: ${recentBars[recentBars.length - 1].close}

Provide a brief analysis (2-3 sentences) of what this regime means for traders and what to watch for next.`
    }
  ]

  const result = await callAI('gpt-4o-mini', messages, {
    temperature: 0.4,
    max_tokens: 300,
    cache: true,
    cacheTTL: 180,
    fallback: 'gpt-4o'
  })

  return {
    analysis: result.content,
    latency: result.latency,
    cached: result.cached
  }
}

/**
 * Natural language query for market scanner
 * @param {string} query - User's natural language query
 * @returns {Promise<Object>} Structured filter criteria
 */
export async function parseNaturalQuery(query) {
  const messages = [
    {
      role: 'system',
      content: 'You are a trading query parser. Convert natural language to structured filter criteria. Return JSON only.'
    },
    {
      role: 'user',
      content: `Convert this query to structured filters:

"${query}"

Return JSON with available filters:
{
  "priceRange": { "min": number, "max": number },
  "volumeMin": number,
  "atrMin": number,
  "adxMin": number,
  "trend": "bullish" | "bearish" | "neutral",
  "marketCap": "small" | "mid" | "large",
  "sector": "string"
}

Only include filters explicitly mentioned in the query.`
    }
  ]

  const result = await callAI('gpt-4o', messages, {
    temperature: 0.1,
    max_tokens: 300,
    json: true,
    cache: true,
    cacheTTL: 300
  })

  try {
    return JSON.parse(result.content)
  } catch {
    return { error: 'Failed to parse query' }
  }
}

/**
 * Get AI suggestions for watchlist symbols
 * @param {Object} userProfile - User trading preferences
 * @param {Array} currentWatchlist - Current watchlist symbols
 * @returns {Promise<Array>} Suggested symbols with reasoning
 */
export async function suggestWatchlistSymbols(userProfile, currentWatchlist = []) {
  const messages = [
    {
      role: 'system',
      content: 'You are a stock recommendation analyst. Suggest symbols based on user preferences. Return JSON only.'
    },
    {
      role: 'user',
      content: `Suggest 5 stock symbols to add to watchlist.

User Profile:
${JSON.stringify(userProfile, null, 2)}

Current Watchlist: ${currentWatchlist.join(', ')}

Return JSON:
{
  "suggestions": [
    { "symbol": "AAPL", "reasoning": "...", "fit_score": 85 },
    ...
  ]
}

Avoid symbols already in watchlist.`
    }
  ]

  const result = await callAI('gpt-4o', messages, {
    temperature: 0.5,
    max_tokens: 800,
    json: true,
    cache: true,
    cacheTTL: 3600 // 1 hour
  })

  try {
    const data = JSON.parse(result.content)
    return data.suggestions || []
  } catch {
    return []
  }
}

export default {
  callAI,
  getGatewayMetrics,
  explainSignal,
  rankSignals,
  analyzeRegime,
  parseNaturalQuery,
  suggestWatchlistSymbols
}
