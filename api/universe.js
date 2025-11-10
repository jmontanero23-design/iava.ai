import { getCacheMap, getCache, setCache } from '../lib/cache.js'

const cacheMap = getCacheMap('universe')

export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const env = process.env.ALPACA_ENV || 'paper'
    if (!key || !secret) return res.status(500).json({ error: 'Missing Alpaca keys' })
    const base = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'

    const cached = getCache(cacheMap, 'universe', 60 * 60 * 1000)
    if (cached) { res.status(200).json(cached); return }

    const r = await fetch(`${base}/v2/assets?status=active&asset_class=us_equity` , { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
    const j = await r.json()
    if (!r.ok) return res.status(r.status).json(j)
    const symbols = Array.isArray(j) ? j.filter(a => a?.tradable).map(a => a.symbol).filter(Boolean) : []
    const payload = { symbols }
    setCache(cacheMap, 'universe', payload)
    res.status(200).json(payload)
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

