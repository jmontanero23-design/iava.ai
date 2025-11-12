/**
 * AI API Gateway
 * Unified gateway for all AI/LLM requests with caching, rate limiting, and monitoring
 *
 * Features:
 * - Model routing (OpenAI GPT-4, Anthropic Claude)
 * - Automatic fallback on failures
 * - In-memory response caching
 * - Rate limiting per user/IP
 * - Latency tracking
 * - Cost estimation
 * - Request/response logging
 */

// ============================================================================
// In-Memory Cache (Redis-compatible interface for easy upgrade)
// ============================================================================

class MemoryCache {
  constructor(defaultTTL = 60) {
    this.cache = new Map()
    this.defaultTTL = defaultTTL // seconds
  }

  _isExpired(entry) {
    return Date.now() > entry.expiresAt
  }

  async get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (this._isExpired(entry)) {
      this.cache.delete(key)
      return null
    }
    return entry.value
  }

  async set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000
    })
  }

  async del(key) {
    this.cache.delete(key)
  }

  async clear() {
    this.cache.clear()
  }

  async keys(pattern) {
    // Simple prefix matching for now
    const prefix = pattern.replace('*', '')
    return Array.from(this.cache.keys()).filter(k => k.startsWith(prefix))
  }

  // Cleanup expired entries periodically
  startCleanup(intervalMs = 60000) {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key)
        }
      }
    }, intervalMs)
  }
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }

  _cleanup() {
    const now = Date.now()
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < this.windowMs)
      if (validTimestamps.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validTimestamps)
      }
    }
  }

  isAllowed(identifier) {
    this._cleanup()
    const now = Date.now()
    const timestamps = this.requests.get(identifier) || []

    // Filter to only recent requests within the window
    const recentRequests = timestamps.filter(t => now - t < this.windowMs)

    if (recentRequests.length >= this.maxRequests) {
      return false
    }

    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
    return true
  }

  getRemaining(identifier) {
    const timestamps = this.requests.get(identifier) || []
    const now = Date.now()
    const recentRequests = timestamps.filter(t => now - t < this.windowMs)
    return Math.max(0, this.maxRequests - recentRequests.length)
  }

  reset(identifier) {
    this.requests.delete(identifier)
  }
}

// ============================================================================
// Cost Estimation
// ============================================================================

const MODEL_COSTS = {
  // OpenAI pricing (per 1M tokens)
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },

  // Anthropic pricing (per 1M tokens)
  'claude-3-opus': { input: 15, output: 75 },
  'claude-3-sonnet': { input: 3, output: 15 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'claude-3-5-sonnet': { input: 3, output: 15 }
}

function estimateCost(model, inputTokens, outputTokens) {
  const costs = MODEL_COSTS[model] || { input: 0, output: 0 }
  const inputCost = (inputTokens / 1_000_000) * costs.input
  const outputCost = (outputTokens / 1_000_000) * costs.output
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    inputTokens,
    outputTokens
  }
}

// ============================================================================
// Model Router
// ============================================================================

const MODEL_PROVIDERS = {
  'gpt-4': 'openai',
  'gpt-4-turbo': 'openai',
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-3.5-turbo': 'openai',
  'claude-3-opus': 'anthropic',
  'claude-3-sonnet': 'anthropic',
  'claude-3-haiku': 'anthropic',
  'claude-3-5-sonnet': 'anthropic'
}

function getProvider(model) {
  return MODEL_PROVIDERS[model] || 'openai'
}

// ============================================================================
// OpenAI Client
// ============================================================================

async function callOpenAI(model, messages, options = {}) {
  const apiKey = process.env.VERCEL_AI_GATEWAY_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('VERCEL_AI_GATEWAY_KEY or OPENAI_API_KEY not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1000,
      response_format: options.json ? { type: 'json_object' } : undefined
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()

  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0
    },
    model: data.model,
    provider: 'openai'
  }
}

// ============================================================================
// Anthropic Client
// ============================================================================

async function callAnthropic(model, messages, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  // Convert OpenAI-style messages to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      messages: anthropicMessages,
      system: systemMessage || undefined,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1000
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()

  return {
    content: data.content[0]?.text || '',
    usage: {
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    },
    model: data.model,
    provider: 'anthropic'
  }
}

// ============================================================================
// Main Gateway
// ============================================================================

const cache = new MemoryCache(300) // 5 minute default TTL
cache.startCleanup()

const rateLimiter = new RateLimiter(100, 60000) // 100 requests per minute

// Metrics storage
const metrics = {
  requests: 0,
  errors: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalLatency: 0,
  totalCost: 0,
  byModel: {}
}

/**
 * Generate cache key from request
 */
function getCacheKey(model, messages, options) {
  const payload = JSON.stringify({ model, messages, options })
  // Simple hash function (for production, use crypto.createHash)
  let hash = 0
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `ai:${model}:${Math.abs(hash)}`
}

/**
 * Call AI model with caching, rate limiting, and fallback
 */
async function callAI(model, messages, options = {}) {
  const startTime = Date.now()
  metrics.requests++

  // Initialize model metrics
  if (!metrics.byModel[model]) {
    metrics.byModel[model] = {
      requests: 0,
      errors: 0,
      latency: 0,
      cost: 0
    }
  }
  metrics.byModel[model].requests++

  try {
    // Check cache if enabled
    if (options.cache !== false) {
      const cacheKey = getCacheKey(model, messages, options)
      const cached = await cache.get(cacheKey)

      if (cached) {
        metrics.cacheHits++
        console.log('[AI Gateway] Cache HIT:', model)
        return {
          ...cached,
          cached: true,
          latency: Date.now() - startTime
        }
      }
      metrics.cacheMisses++
    }

    // Determine provider
    const provider = getProvider(model)

    // Call appropriate provider
    let result
    if (provider === 'anthropic') {
      result = await callAnthropic(model, messages, options)
    } else {
      result = await callOpenAI(model, messages, options)
    }

    // Calculate metrics
    const latency = Date.now() - startTime
    const cost = estimateCost(model, result.usage.inputTokens, result.usage.outputTokens)

    metrics.totalLatency += latency
    metrics.totalCost += cost.totalCost
    metrics.byModel[model].latency += latency
    metrics.byModel[model].cost += cost.totalCost

    const response = {
      ...result,
      latency,
      cost,
      cached: false
    }

    // Cache response if enabled
    if (options.cache !== false) {
      const cacheKey = getCacheKey(model, messages, options)
      const cacheTTL = options.cacheTTL || 300
      await cache.set(cacheKey, response, cacheTTL)
    }

    console.log('[AI Gateway] Success:', model, latency + 'ms', '$' + cost.totalCost.toFixed(4))
    return response

  } catch (error) {
    metrics.errors++
    metrics.byModel[model].errors++

    console.error('[AI Gateway] Error:', model, error.message)

    // Automatic fallback logic
    if (options.fallback && !options._fallbackAttempted) {
      console.log('[AI Gateway] Attempting fallback to:', options.fallback)
      return callAI(options.fallback, messages, { ...options, _fallbackAttempted: true })
    }

    throw error
  }
}

/**
 * Get gateway metrics
 */
function getMetrics() {
  return {
    ...metrics,
    avgLatency: metrics.requests > 0 ? metrics.totalLatency / metrics.requests : 0,
    cacheHitRate: metrics.cacheHits + metrics.cacheMisses > 0
      ? metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)
      : 0
  }
}

/**
 * Clear cache
 */
async function clearCache(pattern = '*') {
  if (pattern === '*') {
    await cache.clear()
  } else {
    const keys = await cache.keys(pattern)
    for (const key of keys) {
      await cache.del(key)
    }
  }
}

// ============================================================================
// Vercel Edge Function Handler
// ============================================================================

export default async function handler(req) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers })
  }

  if (req.method === 'GET') {
    // Return metrics
    return new Response(JSON.stringify(getMetrics(), null, 2), { headers })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    })
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!rateLimiter.isAllowed(clientIP)) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        remaining: rateLimiter.getRemaining(clientIP)
      }), {
        status: 429,
        headers
      })
    }

    // Parse request
    const body = await req.json()
    const { model, messages, options = {} } = body

    if (!model || !messages) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: model, messages'
      }), {
        status: 400,
        headers
      })
    }

    // Call AI
    const result = await callAI(model, messages, options)

    return new Response(JSON.stringify(result), { headers })

  } catch (error) {
    console.error('[AI Gateway] Handler error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers
    })
  }
}

// Export for use in other API routes
export { callAI, getMetrics, clearCache, cache, rateLimiter }
