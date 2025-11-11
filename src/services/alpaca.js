import { rateLimitedFetch } from '../utils/rateLimiter.js'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function fetchBars(symbol = 'AAPL', timeframe = '1Min', limit = 500) {
  const qs = new URLSearchParams({ symbol, timeframe, limit: String(limit) })
  const url = `${API_BASE}/api/alpaca/bars?${qs.toString()}`

  const json = await rateLimitedFetch(url, {
    params: { symbol, timeframe, limit }
  })

  const bars = json.bars || []
  // Attach symbol and cache metadata for downstream use
  return bars.map(b => ({
    ...b,
    symbol,
    _fromCache: json.fromCache,
    _stale: json.stale
  }))
}

export async function fetchAccount() {
  const r = await fetch(`${API_BASE}/api/alpaca/account`)
  if (!r.ok) throw new Error(`API error ${r.status}`)
  return r.json()
}
