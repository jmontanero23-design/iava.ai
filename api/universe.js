import { getCacheMap, getCache, setCache } from '../lib/cache.js'

const cacheMap = getCacheMap('universe')

export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const env = process.env.ALPACA_ENV || 'paper'
    const url = new URL(req.url, 'http://localhost')
    const assetClass = (url.searchParams.get('assetClass') || 'stocks').toLowerCase()
    if (!key || !secret) return res.status(500).json({ error: 'Missing Alpaca keys' })
    const base = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'

    const cached = getCache(cacheMap, 'universe', 60 * 60 * 1000)
    if (cached && assetClass === 'stocks') { res.status(200).json(cached); return }

    if (assetClass === 'crypto') {
      // Provide a curated default crypto list from env or sensible defaults
      const envList = (process.env.CRYPTO_SYMBOLS || '').trim()
      const symbols = envList
        ? envList.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
        : ['BTC/USD','ETH/USD','SOL/USD','AVAX/USD','DOGE/USD','ADA/USD','MATIC/USD','XRP/USD']
      return res.status(200).json({ symbols })
    } else {
      const r = await fetch(`${base}/v2/assets?status=active&asset_class=us_equity` , { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
      const j = await r.json()
      if (!r.ok) return res.status(r.status).json(j)
      const symbols = Array.isArray(j) ? j.filter(a => a?.tradable).map(a => a.symbol).filter(Boolean) : []
      const payload = { symbols }
      setCache(cacheMap, 'universe', payload)
      res.status(200).json(payload)
    }
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}
