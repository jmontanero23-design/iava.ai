const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function fetchBars(symbol = 'AAPL', timeframe = '1Min', limit = 500) {
  const qs = new URLSearchParams({ symbol, timeframe, limit: String(limit) })
  const r = await fetch(`${API_BASE}/api/alpaca/bars?${qs.toString()}`)
  if (!r.ok) throw new Error(`API error ${r.status}`)
  const json = await r.json()
  return json.bars || []
}

export async function fetchAccount() {
  const r = await fetch(`${API_BASE}/api/alpaca/account`)
  if (!r.ok) throw new Error(`API error ${r.status}`)
  return r.json()
}

