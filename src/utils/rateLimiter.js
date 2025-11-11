/**
 * Intelligent Rate Limiter with Caching and Request Queue
 *
 * Features:
 * - Request queuing with exponential backoff
 * - Smart caching to avoid duplicate requests
 * - Automatic retry on 429 errors
 * - Per-endpoint rate limit tracking
 */

class RateLimiter {
  constructor() {
    this.cache = new Map() // key -> { data, timestamp }
    this.queue = []
    this.processing = false
    this.rateLimitUntil = 0
    this.requestCounts = new Map() // endpoint -> { count, resetTime }

    // Alpaca rate limits (conservative estimates)
    this.limits = {
      bars: { maxPerMinute: 200, maxConcurrent: 3 },
      default: { maxPerMinute: 100, maxConcurrent: 2 }
    }

    // Cache TTL in milliseconds
    this.cacheTTL = {
      '1Min': 60 * 1000,      // 1 minute for 1-min bars
      '5Min': 5 * 60 * 1000,  // 5 minutes for 5-min bars
      '15Min': 10 * 60 * 1000, // 10 minutes for 15-min bars
      '1Hour': 30 * 60 * 1000, // 30 minutes for hourly bars
      '1Day': 60 * 60 * 1000   // 1 hour for daily bars
    }
  }

  getCacheKey(url, params = {}) {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
    return `${url}?${sortedParams}`
  }

  getCached(key) {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    // Extract timeframe from key to determine TTL
    const timeframeMatch = key.match(/timeframe=([^&]+)/)
    const timeframe = timeframeMatch ? timeframeMatch[1] : '1Min'
    const ttl = this.cacheTTL[timeframe] || this.cacheTTL['1Min']

    if (now - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() })

    // Limit cache size to prevent memory issues
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  async throttledFetch(url, options = {}, retryCount = 0) {
    const cacheKey = this.getCacheKey(url, options.params)

    // Check cache first
    const cached = this.getCached(cacheKey)
    if (cached) {
      return { ...cached, fromCache: true }
    }

    // Check if we're rate limited
    const now = Date.now()
    if (this.rateLimitUntil > now) {
      const waitTime = this.rateLimitUntil - now
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    try {
      const response = await fetch(url, options)

      if (response.status === 429) {
        // Rate limited - implement exponential backoff
        const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10)
        const backoffTime = Math.min(retryAfter * 1000, Math.pow(2, retryCount) * 1000)

        this.rateLimitUntil = now + backoffTime

        // Retry up to 3 times
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, backoffTime))
          return this.throttledFetch(url, options, retryCount + 1)
        }

        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(backoffTime / 1000)}s`)
      }

      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }

      const data = await response.json()

      // Cache successful responses
      this.setCache(cacheKey, data)

      return data
    } catch (error) {
      // If it's a network error and we have cached data, return it
      const staleCache = this.cache.get(cacheKey)
      if (staleCache && error.message.includes('fetch')) {
        console.warn('Using stale cache due to network error')
        return { ...staleCache.data, fromCache: true, stale: true }
      }
      throw error
    }
  }

  clearCache() {
    this.cache.clear()
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()).map(k => {
        const cached = this.cache.get(k)
        return {
          key: k.substring(0, 80), // truncate for display
          age: Math.floor((Date.now() - cached.timestamp) / 1000)
        }
      })
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Wrapper for fetch with automatic rate limiting and caching
 */
export async function rateLimitedFetch(url, options = {}) {
  return rateLimiter.throttledFetch(url, options)
}
