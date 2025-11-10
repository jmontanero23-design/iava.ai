const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function fetchBars(symbol = 'AAPL', timeframe = '1Min', limit = 500) {
  const qs = new URLSearchParams({ symbol, timeframe, limit: String(limit) })
  const r = await fetch(`${API_BASE}/api/alpaca/bars?${qs.toString()}`)
  if (!r.ok) {
    let retryAfter = parseInt(r.headers.get('retry-after') || '0', 10)
    try {
      const j = await r.json()
      if (!retryAfter && j && j.retryAfter) retryAfter = parseInt(j.retryAfter, 10) || 0
    } catch {}
    const err = new Error(`API error ${r.status}`)
    if (r.status === 429) { err.code = 'RATE_LIMIT'; err.retryAfter = retryAfter }
    throw err
  }
  const json = await r.json()
  const bars = json.bars || []
  // Attach symbol for downstream trade panel and logging convenience
  return bars.map(b => ({ ...b, symbol }))
}

export async function fetchAccount() {
  const r = await fetch(`${API_BASE}/api/alpaca/account`)
  if (!r.ok) throw new Error(`API error ${r.status}`)
  return r.json()
}
