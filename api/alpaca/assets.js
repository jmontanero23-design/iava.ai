let cache = { at: 0, data: [] }

export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const env = process.env.ALPACA_ENV || 'paper'
    if (!key || !secret) return res.status(500).json({ error: 'Missing Alpaca keys' })
    const base = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'
    const url = new URL(req.url, 'http://localhost')
    const q = (url.searchParams.get('q') || '').trim().toUpperCase()
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)
    // Refresh cache daily
    const dayMs = 24 * 60 * 60 * 1000
    const mustRefresh = Date.now() - cache.at > dayMs || !Array.isArray(cache.data) || cache.data.length === 0
    if (mustRefresh) {
      const r = await fetch(`${base}/v2/assets?status=active&asset_class=us_equity`, {
        headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret },
      })
      const assets = await r.json()
      if (!r.ok) return res.status(r.status).json(assets)
      cache = { at: Date.now(), data: Array.isArray(assets) ? assets : [] }
    }
    if (!q) return res.status(200).json([])
    const results = cache.data.filter(a => {
      const sym = (a.symbol || '').toUpperCase()
      const name = (a.name || '').toUpperCase()
      return sym.includes(q) || name.includes(q)
    }).slice(0, limit).map(a => ({ symbol: a.symbol, name: a.name, exchange: a.exchange, tradable: a.tradable }))
    res.status(200).json(results)
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

