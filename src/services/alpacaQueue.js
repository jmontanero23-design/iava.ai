/**
 * Alpaca Service with Request Queue Management
 *
 * This module wraps the original Alpaca service with aggressive rate limiting
 * to prevent 429 errors. All components should import from here instead of
 * directly from alpaca.js
 */

import { requestQueue, PRIORITY } from '../utils/requestQueue.js'
import { fetchBarsInternal, fetchAccount as fetchAccountOriginal } from './alpaca.js'

/**
 * Fetch bars with queue management and priority
 *
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Timeframe (1Min, 5Min, etc.)
 * @param {number} limit - Number of bars to fetch
 * @param {number} priority - Request priority (optional)
 */
export async function fetchBars(symbol = 'AAPL', timeframe = '1Min', limit = 500, priority = PRIORITY.LOW) {
  return new Promise((resolve, reject) => {
    requestQueue.enqueue({
      symbol,
      timeframe,
      limit,
      fetchFn: fetchBarsInternal,
      resolve,
      reject
    }, priority)
  })
}

// Re-export fetchAccount (doesn't need queuing as it's called rarely)
export const fetchAccount = fetchAccountOriginal

// Export priority levels for components to use
export { PRIORITY }

// Helper function for components that need to fetch multiple timeframes
export async function fetchBarsSequential(requests) {
  const results = []

  for (const req of requests) {
    try {
      const { symbol, timeframe, limit, priority = PRIORITY.LOW } = req
      const data = await fetchBars(symbol, timeframe, limit, priority)
      results.push(data)
    } catch (error) {
      console.error(`Failed to fetch ${req.symbol} ${req.timeframe}:`, error)
      results.push(null)
    }
  }

  return results
}

// Get queue statistics (for debugging/monitoring)
export function getQueueStats() {
  return requestQueue.getStats()
}

// Emergency queue clear
export function clearQueue() {
  return requestQueue.clearQueue()
}