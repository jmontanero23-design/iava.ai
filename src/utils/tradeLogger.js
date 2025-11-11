/**
 * Trade Logger Utility
 *
 * Client-side helper to log signals, decisions, orders, and P/L.
 *
 * Usage:
 *   import { logSignal, logOrder, logFill } from './utils/tradeLogger.js'
 *
 *   logSignal({ symbol: 'SPY', timeframe: '15', score: 85, components: {...} })
 *   logOrder({ symbol: 'SPY', side: 'BUY', qty: 10, entry: 400, sl: 398, tp: 403 })
 *   logFill({ symbol: 'SPY', fill_price: 400.05, pnl: 150.50 })
 */

const API_URL = '/api/trade_log'

/**
 * Generic log function
 */
async function log(type, data) {
  try {
    const payload = {
      type,
      timestamp: new Date().toISOString(),
      ...data,
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error('[tradeLogger] Failed to log:', await res.text())
      return false
    }

    return true
  } catch (err) {
    console.error('[tradeLogger] Error:', err)
    return false
  }
}

/**
 * Log a signal (Unicorn Score triggered)
 */
export async function logSignal({ symbol, timeframe, score, components, threshold, notes }) {
  return log('signal', {
    symbol,
    timeframe,
    score,
    components,
    threshold,
    notes,
  })
}

/**
 * Log a trading decision (LLM or manual)
 */
export async function logDecision({ symbol, timeframe, score, action, side, notes }) {
  return log('decision', {
    symbol,
    timeframe,
    score,
    action,  // 'order' | 'notify' | 'pass'
    side,    // 'BUY' | 'SELL'
    notes,
  })
}

/**
 * Log an order placement
 */
export async function logOrder({ symbol, side, qty, entry, sl, tp, orderType, timeInForce, orderId, notes }) {
  return log('order', {
    symbol,
    side,
    qty,
    entry,
    sl,
    tp,
    orderType: orderType || 'market',
    timeInForce: timeInForce || 'day',
    orderId,
    notes,
  })
}

/**
 * Log an order fill
 */
export async function logFill({ symbol, orderId, fill_price, fill_qty, notes }) {
  return log('fill', {
    symbol,
    orderId,
    fill_price,
    fill_qty,
    notes,
  })
}

/**
 * Log P&L (profit/loss)
 */
export async function logPnL({ symbol, orderId, entry, exit, qty, pnl, pnl_pct, notes }) {
  return log('pnl', {
    symbol,
    orderId,
    entry,
    exit,
    qty,
    pnl,
    pnl_pct,
    notes,
  })
}

/**
 * Retrieve logs (for analytics)
 */
export async function getLogs({ limit = 100, type, symbol } = {}) {
  try {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit)
    if (type) params.append('type', type)
    if (symbol) params.append('symbol', symbol)

    const res = await fetch(`${API_URL}?${params.toString()}`)
    if (!res.ok) {
      console.error('[tradeLogger] Failed to fetch logs:', await res.text())
      return { logs: [], count: 0, total: 0 }
    }

    return await res.json()
  } catch (err) {
    console.error('[tradeLogger] Error fetching logs:', err)
    return { logs: [], count: 0, total: 0 }
  }
}

/**
 * Clear all logs (for testing)
 */
export async function clearLogs() {
  try {
    const res = await fetch(API_URL, { method: 'DELETE' })
    return res.ok
  } catch (err) {
    console.error('[tradeLogger] Error clearing logs:', err)
    return false
  }
}
