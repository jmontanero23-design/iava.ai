import crypto from 'node:crypto'

const mem = { data: new Map(), daily: new Map() }
const TTL = 60 * 1000 // 60s cache
const DAILY_TTL = 60 * 60 * 1000 // 1h cache for daily bars

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
    const threshold = Math.max(0, Math.min(100, parseFloat(urlObj.searchParams.get('threshold') || '70')))
    const horizon = Math.max(1, Math.min(100, parseInt(urlObj.searchParams.get('horizon') || '10', 10)))
    const format = (urlObj.searchParams.get('format') || 'json').toLowerCase()
    const wantCurve = (urlObj.searchParams.get('curve') || '1') !== '0'
    const dailyFilter = (urlObj.searchParams.get('dailyFilter') || 'none').toLowerCase() // none|bull|bear

    const cacheKey = `${symbol}|${timeframe}|${limit}|${threshold}|${horizon}`
    const now = Date.now()
    const hit = mem.data.get(cacheKey)
    if (hit && (now - hit.at) < TTL) {
      return res.status(200).json(hit.value)
    }
    const bars = await fetchBars({ key, secret, dataBase, symbol, timeframe, limit })
    if (!bars.length) return res.status(200).json({ symbol, timeframe, bars: 0, scores: [], scoreAvg: 0, scorePcts: { p40: 0, p60: 0, p70: 0 } })

    const { computeStates } = await import('../src/utils/indicators.js')
    const scores = []
    const start = Math.min(80, Math.floor(bars.length / 5))
    const events = []
    const curveThs = [30,40,50,60,70,80,90]
    const curve = curveThs.map(th => ({ th, rets: [] }))
    // Prepare daily regime states if filtering requested
    let dailyBars = null
    let dailyStates = null
    if (dailyFilter !== 'none') {
      const dkey = `${symbol}|1Day|400`
      const now2 = Date.now()
      const dhit = mem.daily.get(dkey)
      if (dhit && (now2 - dhit.at) < DAILY_TTL) {
        dailyBars = dhit.value
      } else {
        dailyBars = await fetchBars({ key, secret, dataBase, symbol, timeframe: '1Day', limit: 400 })
        mem.daily.set(dkey, { at: now2, value: dailyBars })
      }
      dailyStates = []
      for (let di = 0; di < dailyBars.length; di++) {
        dailyStates[di] = computeStates(dailyBars.slice(0, di + 1))
      }
    }
    for (let i = start; i < bars.length; i++) {
      const slice = bars.slice(0, i + 1)
      const st = computeStates(slice)
      // Optional daily regime filter
      if (dailyStates) {
        const it = bars[i].time
        let di = -1
        for (let j = 0; j < dailyBars.length; j++) {
          if (dailyBars[j].time <= it) di = j; else break
        }
        if (di >= 0) {
          const ds = dailyStates[di]
          const wantBull = dailyFilter === 'bull'
          const ok = wantBull ? (ds.pivotNow === 'bullish' && ds.ichiRegime === 'bullish') : (ds.pivotNow === 'bearish' && ds.ichiRegime === 'bearish')
          if (!ok) {
            if (scores.length > 400) scores.shift()
            continue
          }
        }
      }
      scores.push(st.score)
      if (st.score >= threshold && i + horizon < bars.length) {
        const entry = bars[i].close
        const exit = bars[i + horizon].close
        const fwd = (exit - entry) / entry
        events.push({ i, time: bars[i].time, close: entry, score: st.score, fwd })
      }
      if (wantCurve && i + horizon < bars.length) {
        const entry = bars[i].close
        const exit = bars[i + horizon].close
        const fwd = (exit - entry) / entry
        for (const bin of curve) {
          if (st.score >= bin.th) bin.rets.push(fwd)
        }
      }
      if (scores.length > 400) scores.shift() // keep last 400
    }
    const avg = scores.length ? scores.reduce((a,b)=>a+b,0) / scores.length : 0
    const pct = (arr, t) => (arr.filter(x => x >= t).length / (arr.length || 1)) * 100
    const winsArr = events.filter(e => e.fwd > 0).map(e=>e.fwd)
    const lossArr = events.filter(e => e.fwd <= 0).map(e=>e.fwd)
    const wins = winsArr.length
    const avgFwd = events.length ? (events.reduce((a,b)=>a+b.fwd,0) / events.length) : 0
    const avgWin = winsArr.length ? (winsArr.reduce((a,b)=>a+b,0) / winsArr.length) : 0
    const avgLoss = lossArr.length ? (lossArr.reduce((a,b)=>a+b,0) / lossArr.length) : 0
    const profitFactor = (avgWin > 0 && avgLoss < 0) ? Math.abs((avgWin) / (avgLoss)) : (winsArr.length && lossArr.length ? 0 : null)
    const out = {
      symbol, timeframe, bars: bars.length,
      scoreAvg: Number(avg.toFixed(2)),
      scorePcts: { p40: Number(pct(scores,40).toFixed(2)), p60: Number(pct(scores,60).toFixed(2)), p70: Number(pct(scores,70).toFixed(2)) },
      recentScores: scores.slice(-120),
      threshold, horizon, dailyFilter, events: events.length, winRate: events.length ? Number(((wins/events.length)*100).toFixed(2)) : 0, avgFwd: Number((avgFwd*100).toFixed(2)),
      avgWin: Number((avgWin*100).toFixed(2)), avgLoss: Number((avgLoss*100).toFixed(2)), profitFactor: profitFactor==null?null:Number(profitFactor.toFixed(2)),
    }
    if (wantCurve) {
      out.curve = curve.map(c => {
        const arr = c.rets
        const ev = arr.length
        const wr = ev ? (arr.filter(x=>x>0).length/ev)*100 : 0
        const av = ev ? (arr.reduce((a,b)=>a+b,0)/ev)*100 : 0
        return { th: c.th, events: ev, winRate: Number(wr.toFixed(2)), avgFwd: Number(av.toFixed(2)) }
      })
    }
    if (format === 'csv') {
      const header = 'time,close,score,forwardReturn\n'
      const rows = events.map(e => `${new Date(e.time*1000).toISOString()},${e.close},${e.score.toFixed(2)},${(e.fwd*100).toFixed(2)}%`).join('\n')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.status(200).send(header + rows)
    } else {
      mem.data.set(cacheKey, { at: now, value: out })
      res.status(200).json(out)
    }
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
