import { getCacheMap, getCache, setCache } from '../../lib/cache.js'

const cacheMap = getCacheMap('stream-bars')

export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const dataBase = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'
    if (!key || !secret) {
      res.status(500).json({ error: 'Missing Alpaca keys' })
      return
    }
    const url = new URL(req.url, 'http://localhost')
    const symbol = (url.searchParams.get('symbol') || 'AAPL').toUpperCase()
    const timeframe = mapTf(url.searchParams.get('timeframe') || '1Min')
    const limit = 1

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.flushHeaders?.()

    let active = true
    req.on('close', () => {
      active = false
    })

    const sendBar = async () => {
      if (!active) return
      try {
        const bars = await fetchBars({ key, secret, dataBase, symbol, timeframe, limit })
        if (!bars.length) return
        const payload = JSON.stringify({ symbol, timeframe, bar: bars[0], at: new Date().toISOString() })
        res.write(`data: ${payload}\n\n`)
      } catch (error) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: error?.message || 'stream error' })}\n\n`)
      }
    }

    await sendBar()
    const interval = setInterval(sendBar, 4000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      res.end()
    }, 5 * 60 * 1000)

    req.on('close', () => {
      clearInterval(interval)
      clearTimeout(timeout)
    })
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

function mapTf(tf) {
  const t = String(tf || '').toLowerCase()
  if (t === '1m' || t === '1min') return '1Min'
  if (t === '5m' || t === '5min') return '5Min'
  if (t === '15m' || t === '15min') return '15Min'
  if (t === '1h' || t === '1hour') return '1Hour'
  if (t === '1d' || t === '1day' || t === 'day') return '1Day'
  return '1Min'
}

async function fetchBars({ key, secret, dataBase, symbol, timeframe, limit }) {
  const qs = new URLSearchParams({ symbols: symbol, timeframe, limit: String(limit), feed: process.env.ALPACA_STOCKS_FEED || 'iex', adjustment: 'raw' })
  const endpoint = `${dataBase}/stocks/bars?${qs.toString()}`
  const cacheKey = `${endpoint}|${key}|${secret}`
  const cached = getCache(cacheMap, cacheKey, 3000)
  if (cached) return cached
  const r = await fetch(endpoint, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j))
  let raw = []
  if (Array.isArray(j?.bars)) raw = j.bars
  else if (j?.bars && Array.isArray(j.bars[symbol])) raw = j.bars[symbol]
  const bars = raw.map(b => ({
    time: Math.floor(new Date(b.t || b.Timestamp || b.time).getTime() / 1000),
    open: b.o ?? b.Open,
    high: b.h ?? b.High,
    low: b.l ?? b.Low,
    close: b.c ?? b.Close,
    volume: b.v ?? b.Volume,
  }))
  setCache(cacheMap, cacheKey, bars)
  return bars
}

