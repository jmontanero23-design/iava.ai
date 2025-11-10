import crypto from 'node:crypto'
import { getCacheMap, getCache, setCache } from '../../lib/cache.js'

function mapTimeframe(tf) {
  const t = (tf || '').toLowerCase()
  if (t === '1min' || t === '1m') return '1Min'
  if (t === '5min' || t === '5m') return '5Min'
  if (t === '15min' || t === '15m') return '15Min'
  if (t === '1h' || t === '1hour') return '1Hour'
  if (t === '1d' || t === '1day' || t === 'day' || t === 'd') return '1Day'
  return '1Min'
}

const TTL_MAP = {
  '1Min': 15 * 1000,
  '5Min': 60 * 1000,
  '15Min': 3 * 60 * 1000,
  '1Hour': 5 * 60 * 1000,
  '1Day': 60 * 60 * 1000,
}

const cacheMap = getCacheMap('bars')
const pending = new Map()

export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    if (!key || !secret) {
      res.status(500).json({ error: 'Missing ALPACA_KEY_ID/ALPACA_SECRET_KEY env vars' })
      return
    }
    const url = new URL(req.url, 'http://localhost')
    const symbol = url.searchParams.get('symbol') || 'AAPL'
    const timeframe = mapTimeframe(url.searchParams.get('timeframe') || '1Min')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '500', 10), 10000)
    const adjustment = url.searchParams.get('adjustment') || 'raw'
    let start = url.searchParams.get('start')
    const end = url.searchParams.get('end')
    if (!start) {
      const now = new Date()
      const backDays = timeframe === '1Day' ? 365 : 7
      const startDate = new Date(now.getTime() - backDays * 24 * 60 * 60 * 1000)
      start = startDate.toISOString()
    }

    const feed = process.env.ALPACA_STOCKS_FEED || 'iex'
    const qs = new URLSearchParams({ timeframe, limit: String(limit), adjustment, feed })
    if (start) qs.set('start', start)
    if (end) qs.set('end', end)

    const dataBase = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'
    qs.set('symbols', symbol)
    const endpoint = `${dataBase}/stocks/bars?${qs.toString()}`

    const cacheKey = `${endpoint}|${key}|${secret}`
    const ttl = TTL_MAP[timeframe] || 15000
    const cached = getCache(cacheMap, cacheKey, ttl)
    const inm = req.headers['if-none-match']
    if (cached) {
      res.setHeader('ETag', cached.etag)
      if (inm && inm === cached.etag) {
        res.status(304).end()
        return
      }
      res.status(200).send(cached.body)
      return
    }

    // De-duplicate in-flight upstream fetches by endpoint/key
    if (pending.has(cacheKey)) {
      try {
        const { status, body, etag } = await pending.get(cacheKey)
        if (etag) res.setHeader('ETag', etag)
        res.status(status).send(body)
        return
      } catch (_) { /* fall through */ }
    }
    const task = (async () => {
      const r = await fetch(endpoint, {
        headers: {
          'APCA-API-KEY-ID': key,
          'APCA-API-SECRET-KEY': secret,
          'User-Agent': 'iava.ai/1.0'
        },
      })
      if (r.status === 429) {
        const retryAfter = r.headers.get('retry-after') || '5'
        const msg = { error: 'Rate limited by data provider', retryAfter }
        return { status: 429, body: JSON.stringify(msg) }
      }
      const json = await r.json()
      if (!r.ok) {
        return { status: r.status, body: JSON.stringify(json) }
      }
      // Map to compact bar objects the UI expects
      let raw = []
      if (Array.isArray(json?.bars)) {
        raw = json.bars
      } else if (json?.bars && Array.isArray(json.bars[symbol])) {
        raw = json.bars[symbol]
      }
      const bars = raw.map(b => ({
        time: Math.floor(new Date(b.t || b.Timestamp || b.time).getTime() / 1000),
        open: b.o ?? b.Open,
        high: b.h ?? b.High,
        low: b.l ?? b.Low,
        close: b.c ?? b.Close,
        volume: b.v ?? b.Volume,
      }))
      const payload = { symbol, timeframe, feed, bars }
      const body = JSON.stringify(payload)
      const etag = `W/"${crypto.createHash('sha1').update(body).digest('hex')}"`
      setCache(cacheMap, cacheKey, { body, etag })
      return { status: 200, body, etag }
    })()
    pending.set(cacheKey, task)
    try {
      const { status, body, etag } = await task
      if (etag) res.setHeader('ETag', etag)
      res.status(status).send(body)
    } finally {
      pending.delete(cacheKey)
    }
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}
