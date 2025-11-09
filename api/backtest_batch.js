export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const dataBase = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'
    if (!key || !secret) return res.status(500).json({ error: 'Missing Alpaca keys' })

    const url = new URL(req.url, 'http://localhost')
    const symbols = (url.searchParams.get('symbols') || 'AAPL').split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    const timeframe = mapTf(url.searchParams.get('timeframe') || '1Min')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '1000', 10), 2000)
    const threshold = Math.max(0, Math.min(100, parseFloat(url.searchParams.get('threshold') || '70')))
    const horizon = Math.max(1, Math.min(100, parseInt(url.searchParams.get('horizon') || '10', 10)))
    const dailyFilter = (url.searchParams.get('dailyFilter') || 'none').toLowerCase()

    const { computeStates } = await import('../src/utils/indicators.js')

    const header = 'symbol,time,close,score,forwardReturn\n'
    let rows = ''
    for (const symbol of symbols) {
      const bars = await fetchBars({ key, secret, dataBase, symbol, timeframe, limit })
      if (!bars.length) continue
      let dailyBars = null, dailyStates = null
      if (dailyFilter !== 'none') {
        dailyBars = await fetchBars({ key, secret, dataBase, symbol, timeframe: '1Day', limit: 400 })
        dailyStates = []
        for (let di = 0; di < dailyBars.length; di++) dailyStates[di] = computeStates(dailyBars.slice(0, di + 1))
      }
      const start = Math.min(80, Math.floor(bars.length / 5))
      for (let i = start; i < bars.length; i++) {
        const slice = bars.slice(0, i + 1)
        const st = computeStates(slice)
        if (dailyStates) {
          const it = bars[i].time
          let di = -1
          for (let j = 0; j < dailyBars.length; j++) { if (dailyBars[j].time <= it) di = j; else break }
          if (di >= 0) {
            const ds = dailyStates[di]
            const wantBull = dailyFilter === 'bull'
            const ok = wantBull ? (ds.pivotNow === 'bullish' && ds.ichiRegime === 'bullish') : (ds.pivotNow === 'bearish' && ds.ichiRegime === 'bearish')
            if (!ok) continue
          }
        }
        if (st.score >= threshold && i + horizon < bars.length) {
          const entry = bars[i].close
          const exit = bars[i + horizon].close
          const fwd = (exit - entry) / entry
          rows += `${symbol},${new Date(bars[i].time*1000).toISOString()},${entry},${st.score.toFixed(2)},${(fwd*100).toFixed(2)}%\n`
        }
      }
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.status(200).send(header + rows)
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

