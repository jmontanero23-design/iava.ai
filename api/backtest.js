import crypto from 'node:crypto'

export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const dataBase = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'
    if (!key || !secret) return res.status(500).json({ error: 'Missing Alpaca keys' })

    const urlObj = new URL(req.url, 'http://localhost')
    const symbol = (urlObj.searchParams.get('symbol') || 'AAPL').toUpperCase()
    const timeframe = mapTf(urlObj.searchParams.get('timeframe') || '1Min')
    const limit = Math.min(parseInt(urlObj.searchParams.get('limit') || '1000', 10), 2000)

    const bars = await fetchBars({ key, secret, dataBase, symbol, timeframe, limit })
    if (!bars.length) return res.status(200).json({ symbol, timeframe, bars: 0, scores: [], scoreAvg: 0, scorePcts: { p40: 0, p60: 0, p70: 0 } })

    const { computeStates } = await import('../src/utils/indicators.js')
    const scores = []
    const start = Math.min(80, Math.floor(bars.length / 5))
    for (let i = start; i < bars.length; i++) {
      const slice = bars.slice(0, i + 1)
      scores.push(computeStates(slice).score)
      if (scores.length > 400) scores.shift() // keep last 400
    }
    const avg = scores.length ? scores.reduce((a,b)=>a+b,0) / scores.length : 0
    const pct = (arr, t) => (arr.filter(x => x >= t).length / (arr.length || 1)) * 100
    const out = {
      symbol, timeframe, bars: bars.length,
      scoreAvg: Number(avg.toFixed(2)),
      scorePcts: { p40: Number(pct(scores,40).toFixed(2)), p60: Number(pct(scores,60).toFixed(2)), p70: Number(pct(scores,70).toFixed(2)) },
      recentScores: scores.slice(-120),
    }
    res.status(200).json(out)
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
  const qs = new URLSearchParams({ symbols: symbol, timeframe, limit: String(limit), feed: 'iex', adjustment: 'raw' })
  const now = new Date()
  const backDays = timeframe === '1Day' ? 365 * 2 : 21
  const startDate = new Date(now.getTime() - backDays * 24 * 60 * 60 * 1000)
  qs.set('start', startDate.toISOString())
  const endpoint = `${dataBase}/stocks/bars?${qs.toString()}`
  const r = await fetch(endpoint, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j))
  let raw = []
  if (Array.isArray(j?.bars?.[symbol])) raw = j.bars[symbol]
  else if (Array.isArray(j?.bars)) raw = j.bars
  return raw.map(b => ({
    time: Math.floor(new Date(b.t || b.Timestamp || b.time).getTime() / 1000),
    open: b.o ?? b.Open, high: b.h ?? b.High, low: b.l ?? b.Low, close: b.c ?? b.Close, volume: b.v ?? b.Volume,
  }))
}

