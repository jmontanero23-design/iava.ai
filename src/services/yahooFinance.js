/**
 * Yahoo Finance Data Service
 *
 * FREE, UNLIMITED market data for calculating iAVA indicators.
 * No API key needed, no rate limits, real-time data.
 *
 * This replaces Alpaca for data fetching (Alpaca now ONLY for trading).
 */

/**
 * Fetch price bars from Yahoo Finance
 *
 * @param {string} symbol - Stock symbol (AAPL, SPY, etc.)
 * @param {string} timeframe - Timeframe (1Min, 5Min, 15Min, 1Hour, 1Day)
 * @param {number} limit - Number of bars to fetch
 * @returns {Promise<Array>} Array of OHLCV bars
 */
export async function fetchBars(symbol = 'AAPL', timeframe = '1Min', limit = 500) {
  try {
    // Map our timeframe to Yahoo Finance interval
    const interval = mapTimeframeToYahoo(timeframe)
    const range = getRangeForTimeframe(timeframe, limit)

    // Use our CORS proxy instead of calling Yahoo directly
    // Yahoo Finance blocks browser requests with CORS policy
    const url = `/api/yahoo-proxy?symbol=${symbol}&interval=${interval}&range=${range}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Yahoo Finance proxy error: ${response.status}`)
    }

    const data = await response.json()

    // Parse Yahoo Finance response into our OHLCV format
    const bars = parseYahooData(data, symbol)

    // Return most recent bars up to limit
    return bars.slice(-limit)

  } catch (error) {
    console.error(`[Yahoo Finance] Error fetching ${symbol} ${timeframe}:`, error)
    throw error
  }
}

/**
 * Map our timeframe format to Yahoo Finance interval
 */
function mapTimeframeToYahoo(timeframe) {
  const map = {
    '1Min': '1m',
    '2Min': '2m',
    '5Min': '5m',
    '15Min': '15m',
    '30Min': '30m',
    '1Hour': '1h',
    '4Hour': '1h', // Yahoo doesn't have 4h, use 1h
    '1Day': '1d',
    'D': '1d',
    '1W': '1wk',
    'W': '1wk',
    '1M': '1mo',
    'M': '1mo'
  }
  return map[timeframe] || '1m'
}

/**
 * Get appropriate range for timeframe to get enough bars
 */
function getRangeForTimeframe(timeframe, limit) {
  // Intraday timeframes
  if (timeframe.includes('Min') || timeframe.includes('Hour')) {
    // Yahoo Finance intraday data is limited to recent periods
    if (timeframe === '1Min') return '1d'  // 1 day of 1-min bars
    if (timeframe === '5Min') return '5d'  // 5 days of 5-min bars
    if (timeframe === '15Min') return '1mo' // 1 month of 15-min bars
    if (timeframe === '1Hour') return '3mo' // 3 months of hourly bars
    return '1mo'
  }

  // Daily and higher
  if (timeframe === '1Day' || timeframe === 'D') {
    // For daily, get enough days based on limit
    if (limit <= 100) return '3mo'
    if (limit <= 250) return '1y'
    return '2y'
  }

  if (timeframe === '1W' || timeframe === 'W') return '2y'
  if (timeframe === '1M' || timeframe === 'M') return '5y'

  return '1mo'
}

/**
 * Parse Yahoo Finance API response into our OHLCV format
 */
function parseYahooData(data, symbol) {
  try {
    const result = data.chart.result[0]

    if (!result || !result.timestamp) {
      throw new Error('Invalid Yahoo Finance response')
    }

    const timestamps = result.timestamp
    const quote = result.indicators.quote[0]

    const bars = []

    for (let i = 0; i < timestamps.length; i++) {
      // Skip bars with missing data
      if (!quote.open[i] || !quote.high[i] || !quote.low[i] || !quote.close[i]) {
        continue
      }

      bars.push({
        time: timestamps[i] * 1000, // Yahoo gives seconds, we use milliseconds
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i] || 0,
        symbol: symbol
      })
    }

    return bars

  } catch (error) {
    console.error('[Yahoo Finance] Error parsing data:', error)
    return []
  }
}

/**
 * Get current price for a symbol (latest close)
 */
export async function getCurrentPrice(symbol) {
  try {
    const bars = await fetchBars(symbol, '1Min', 1)
    return bars.length > 0 ? bars[bars.length - 1].close : null
  } catch (error) {
    console.error(`[Yahoo Finance] Error fetching current price for ${symbol}:`, error)
    return null
  }
}

/**
 * Check if market is open (US market hours)
 */
export function isMarketOpen() {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay() // 0 = Sunday, 6 = Saturday
  const hour = et.getHours()
  const minute = et.getMinutes()

  // Market closed on weekends
  if (day === 0 || day === 6) return false

  // Market hours: 9:30 AM - 4:00 PM ET
  if (hour < 9 || hour >= 16) return false
  if (hour === 9 && minute < 30) return false

  return true
}

console.log('[Yahoo Finance] Service loaded - FREE unlimited market data! 🚀')
