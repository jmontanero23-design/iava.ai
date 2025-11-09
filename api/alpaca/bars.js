function mapTimeframe(tf) {
  const t = (tf || '').toLowerCase()
  if (t === '1min' || t === '1m') return '1Min'
  if (t === '5min' || t === '5m') return '5Min'
  if (t === '15min' || t === '15m') return '15Min'
  if (t === '1h' || t === '1hour') return '1Hour'
  if (t === '1d' || t === '1day' || t === 'day' || t === 'd') return '1Day'
  return '1Min'
}

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
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')

    const qs = new URLSearchParams({ timeframe, limit: String(limit), adjustment })
    if (start) qs.set('start', start)
    if (end) qs.set('end', end)

    const dataBase = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'
    const endpoint = `${dataBase}/stocks/${encodeURIComponent(symbol)}/bars?${qs.toString()}`

    const r = await fetch(endpoint, {
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret,
      },
    })
    const json = await r.json()
    if (!r.ok) {
      res.status(r.status).json(json)
      return
    }
    // Map to compact bar objects the UI expects
    const raw = Array.isArray(json?.bars) ? json.bars : []
    const bars = raw.map(b => ({
      time: Math.floor(new Date(b.t).getTime() / 1000),
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
      volume: b.v,
    }))
    res.status(200).json({ symbol, timeframe, bars })
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

