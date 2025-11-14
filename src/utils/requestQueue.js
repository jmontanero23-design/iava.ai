/**
 * Aggressive Request Queue Manager for Alpaca API
 *
 * This module enforces strict rate limiting to prevent 429 errors:
 * - Maximum 2 concurrent requests
 * - Minimum 100ms between requests
 * - Priority queue for visible chart data
 * - Exponential backoff on errors
 * - Request deduplication with cache
 */

class RequestQueue {
  constructor() {
    this.queue = []
    this.activeRequests = 0
    this.maxConcurrent = 2 // AGGRESSIVE: Only 2 concurrent requests
    this.minDelay = 100 // Minimum 100ms between requests
    this.lastRequestTime = 0
    this.processing = false
    this.cache = new Map() // Cache with TTL
    this.rateLimitBackoff = 0 // Backoff time in ms
    this.errorCount = 0

    // Priority levels
    this.PRIORITY = {
      CHART_PRIMARY: 0,    // Currently visible chart
      CHART_SECONDARY: 1,  // Secondary timeframe for consensus
      PANEL_ANALYSIS: 2,   // Analysis panels
      BATCH_REQUEST: 3,    // Batch/scan operations
      LOW: 4               // Background requests
    }
  }

  /**
   * Generate cache key from request parameters
   */
  getCacheKey(symbol, timeframe, limit) {
    return `${symbol}-${timeframe}-${limit}`
  }

  /**
   * Check if cached data is still valid
   */
  getCached(key) {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    const ttl = this.getCacheTTL(cached.timeframe)

    if (now - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Get cache TTL based on timeframe
   */
  getCacheTTL(timeframe) {
    const ttlMap = {
      '1Min': 60 * 1000,        // 1 minute
      '5Min': 5 * 60 * 1000,    // 5 minutes
      '15Min': 10 * 60 * 1000,  // 10 minutes
      '1Hour': 30 * 60 * 1000,  // 30 minutes
      '1Day': 60 * 60 * 1000    // 1 hour
    }
    return ttlMap[timeframe] || 60 * 1000
  }

  /**
   * Add request to queue with priority and deduplication
   */
  async enqueue(request, priority = this.PRIORITY.LOW) {
    const { symbol, timeframe, limit, fetchFn, resolve, reject } = request
    const cacheKey = this.getCacheKey(symbol, timeframe, limit)

    // Check cache first
    const cached = this.getCached(cacheKey)
    if (cached) {
      console.log(`[RequestQueue] Cache hit for ${cacheKey}`)
      resolve({ ...cached, fromCache: true })
      return
    }

    // Check if identical request is already queued
    const existingIdx = this.queue.findIndex(
      q => q.cacheKey === cacheKey && !q.processing
    )

    if (existingIdx >= 0) {
      // Piggyback on existing request
      console.log(`[RequestQueue] Deduplicating request for ${cacheKey}`)
      const existing = this.queue[existingIdx]

      // Chain the promises
      existing.callbacks = existing.callbacks || []
      existing.callbacks.push({ resolve, reject })

      // Upgrade priority if needed
      if (priority < existing.priority) {
        existing.priority = priority
        this.sortQueue()
      }
      return
    }

    // Add new request to queue
    const queueItem = {
      ...request,
      cacheKey,
      priority,
      timestamp: Date.now(),
      retries: 0,
      processing: false,
      callbacks: []
    }

    this.queue.push(queueItem)
    this.sortQueue()

    console.log(`[RequestQueue] Queued ${cacheKey} with priority ${priority}. Queue length: ${this.queue.length}`)

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue()
    }
  }

  /**
   * Sort queue by priority (lower number = higher priority)
   */
  sortQueue() {
    this.queue.sort((a, b) => {
      // First sort by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // Then by timestamp (FIFO within same priority)
      return a.timestamp - b.timestamp
    })
  }

  /**
   * Process the queue
   */
  async processQueue() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      // Check if we can process more requests
      if (this.activeRequests >= this.maxConcurrent) {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 50))
        continue
      }

      // Apply rate limit delay
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.minDelay) {
        await new Promise(resolve =>
          setTimeout(resolve, this.minDelay - timeSinceLastRequest)
        )
      }

      // Apply backoff if we're rate limited
      if (this.rateLimitBackoff > 0) {
        const backoffRemaining = this.rateLimitBackoff - now
        if (backoffRemaining > 0) {
          console.log(`[RequestQueue] Rate limit backoff: waiting ${Math.ceil(backoffRemaining / 1000)}s`)
          await new Promise(resolve => setTimeout(resolve, Math.min(backoffRemaining, 5000)))
          continue
        }
        this.rateLimitBackoff = 0
      }

      // Get next request from queue
      const request = this.queue.shift()
      if (!request) continue

      request.processing = true
      this.activeRequests++
      this.lastRequestTime = Date.now()

      // Execute request
      this.executeRequest(request)
    }

    this.processing = false
  }

  /**
   * Execute a single request with error handling
   */
  async executeRequest(request) {
    const { symbol, timeframe, limit, fetchFn, resolve, reject, callbacks, cacheKey, retries } = request

    console.log(`[RequestQueue] Executing ${cacheKey} (${this.activeRequests}/${this.maxConcurrent} active)`)

    try {
      // Call the actual fetch function
      const data = await fetchFn(symbol, timeframe, limit)

      // Cache the successful result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        timeframe
      })

      // Limit cache size
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value
        this.cache.delete(firstKey)
      }

      // Reset error count on success
      this.errorCount = 0

      // Resolve all waiting promises
      resolve(data)
      callbacks.forEach(cb => cb.resolve(data))

    } catch (error) {
      console.error(`[RequestQueue] Error fetching ${cacheKey}:`, error)

      // Check if it's a rate limit error
      if (error.message && error.message.includes('429')) {
        this.errorCount++

        // Exponential backoff: 2^errorCount seconds, max 60 seconds
        const backoffSeconds = Math.min(Math.pow(2, this.errorCount), 60)
        this.rateLimitBackoff = Date.now() + (backoffSeconds * 1000)

        console.log(`[RequestQueue] Rate limited! Backing off for ${backoffSeconds}s (attempt ${this.errorCount})`)

        // Retry with exponential backoff
        if (retries < 3) {
          request.retries = retries + 1
          request.processing = false

          // Re-add to front of queue with same priority
          this.queue.unshift(request)

          // Reject current attempt but will retry
          const retryError = new Error(`Rate limited. Retrying in ${backoffSeconds}s...`)
          retryError.code = 'RATE_LIMIT_RETRY'
          reject(retryError)
          callbacks.forEach(cb => cb.reject(retryError))
        } else {
          // Max retries reached
          reject(error)
          callbacks.forEach(cb => cb.reject(error))
        }
      } else {
        // Non-rate-limit error
        reject(error)
        callbacks.forEach(cb => cb.reject(error))
      }
    } finally {
      this.activeRequests--

      // Continue processing queue
      if (!this.processing && this.queue.length > 0) {
        this.processQueue()
      }
    }
  }

  /**
   * Clear the queue (emergency stop)
   */
  clearQueue() {
    const cleared = this.queue.length
    this.queue = []
    console.log(`[RequestQueue] Cleared ${cleared} pending requests`)
    return cleared
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      cacheSize: this.cache.size,
      rateLimitBackoff: this.rateLimitBackoff > Date.now() ?
        Math.ceil((this.rateLimitBackoff - Date.now()) / 1000) : 0,
      errorCount: this.errorCount,
      queueByPriority: this.queue.reduce((acc, req) => {
        acc[req.priority] = (acc[req.priority] || 0) + 1
        return acc
      }, {})
    }
  }
}

// Singleton instance
export const requestQueue = new RequestQueue()

/**
 * Queued fetch wrapper for Alpaca bars
 * This replaces direct fetchBars calls to enforce queuing
 */
export async function queuedFetchBars(symbol, timeframe, limit, priority = requestQueue.PRIORITY.LOW) {
  return new Promise((resolve, reject) => {
    // Import the original fetch function dynamically to avoid circular dependency
    import('../services/alpaca.js').then(({ fetchBars }) => {
      requestQueue.enqueue({
        symbol,
        timeframe,
        limit,
        fetchFn: fetchBars,
        resolve,
        reject
      }, priority)
    }).catch(reject)
  })
}

// Export priority constants for external use
export const PRIORITY = {
  CHART_PRIMARY: 0,
  CHART_SECONDARY: 1,
  PANEL_ANALYSIS: 2,
  BATCH_REQUEST: 3,
  LOW: 4
}