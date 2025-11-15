import crypto from 'node:crypto'
import { getCacheMap, getCache, setCache } from '../lib/cache.js'

const dataCache = getCacheMap('backtest')
const dailyCache = getCacheMap('dailyBars')
const TTL = 60 * 1000 // 60s cache
const DAILY_TTL = 60 * 60 * 1000 // 1h cache for daily bars

export default async function handler(req, res) {
  try {
    // Alpaca keys only needed for crypto trading (Yahoo Finance handles stocks)
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY

    const urlObj = new URL(req.url, 'http://localhost')
    const symbol = (urlObj.searchParams.get('symbol') || 'AAPL').toUpperCase()
    const timeframe = mapTf(urlObj.searchParams.get('timeframe') || '1Min')
    const limit = Math.min(parseInt(urlObj.searchParams.get('limit') || '1000', 10), 2000)
    const threshold = Math.max(0, Math.min(100, parseFloat(urlObj.searchParams.get('threshold') || '70')))
    const horizon = Math.max(1, Math.min(100, parseInt(urlObj.searchParams.get('horizon') || '10', 10)))
    const format = (urlObj.searchParams.get('format') || 'json').toLowerCase()
    const wantCurve = (urlObj.searchParams.get('curve') || '1') !== '0'
    // Optional thresholds list for curve (comma-separated integers)
    let curveThs = [30,40,50,60,70,80,90]
    const thsParam = (urlObj.searchParams.get('ths') || '').trim()
    if (thsParam) {
      const arr = thsParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n) && n >= 0 && n <= 100)
      if (arr.length) curveThs = Array.from(new Set(arr)).sort((a,b)=>a-b)
    }
    const dailyFilter = (urlObj.searchParams.get('dailyFilter') || 'none').toLowerCase() // none|bull|bear
    const assetClass = (urlObj.searchParams.get('assetClass') || 'stocks').toLowerCase() // stocks|crypto
    const regimeCurves = (urlObj.searchParams.get('regimeCurves') || '0') !== '0'
    const consensusBonus = (urlObj.searchParams.get('consensus') || '0') !== '0'
    // Optional multi-horizon matrix: comma-separated
    const hzsParam = (urlObj.searchParams.get('hzs') || '').trim()
    let horizonSet = null
    if (hzsParam) {
      const arr = hzsParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n) && n >= 1 && n <= 100)
      if (arr.length) horizonSet = Array.from(new Set(arr)).sort((a,b)=>a-b)
    }

    const cacheKey = `${symbol}|${timeframe}|${limit}|${threshold}|${horizon}`
    const cached = getCache(dataCache, cacheKey, TTL)
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
    // Check if crypto needs Alpaca keys
    if (assetClass === 'crypto' && (!key || !secret)) {
      return res.status(500).json({ error: 'Alpaca API keys required for crypto data' })
    }

    const bars = assetClass === 'crypto'
      ? await fetchBarsCrypto({ key, secret, dataBaseCrypto: process.env.ALPACA_DATA_CRYPTO_URL || 'https://data.alpaca.markets/v1beta3', symbol, timeframe, limit })
      : await fetchBars({ symbol, timeframe, limit })
    if (!bars.length) return res.status(200).json({ symbol, timeframe, bars: 0, scores: [], scoreAvg: 0, scorePcts: { p40: 0, p60: 0, p70: 0 } })

    const { computeStates } = await import('../src/utils/indicators.js')
    // Secondary timeframe states for consensus bonus (optional)
    let secBars = null
    let secStates = null
    if (consensusBonus) {
      const secTf = mapSecondary(timeframe)
      if (secTf) {
        secBars = assetClass === 'crypto'
          ? await fetchBarsCrypto({ key, secret, dataBaseCrypto: process.env.ALPACA_DATA_CRYPTO_URL || 'https://data.alpaca.markets/v1beta3', symbol, timeframe: secTf, limit })
          : await fetchBars({ symbol, timeframe: secTf, limit })
        if (secBars?.length) {
          secStates = []
          for (let i = 0; i < bars.length; i++) {
            // find last sec bar time <= primary time
            const t = bars[i].time
            let j = -1
            for (let k = 0; k < secBars.length; k++) { if (secBars[k].time <= t) j = k; else break }
            if (j >= 0) secStates[i] = computeStates(secBars.slice(0, j + 1))
            else secStates[i] = null
          }
        }
      }
    }
    const scores = []
    const start = Math.min(80, Math.floor(bars.length / 5))
    const events = []
    const curve = curveThs.map(th => ({ th, rets: [] }))
    const curveBull = curveThs.map(th => ({ th, rets: [] }))
    const curveBear = curveThs.map(th => ({ th, rets: [] }))
    const matrix = horizonSet ? horizonSet.map(hz => ({ hz, bins: curveThs.map(th => ({ th, rets: [] })) })) : null
    // Prepare daily regime states if filtering requested
    let dailyBars = null
    let dailyStates = null
    if ((dailyFilter !== 'none' || regimeCurves) && assetClass === 'stocks') {
      const dkey = `${symbol}|1Day|400`
      dailyBars = getCache(dailyCache, dkey, DAILY_TTL)
      if (!dailyBars) {
        dailyBars = await fetchBars({ symbol, timeframe: '1Day', limit: 400 })
        setCache(dailyCache, dkey, dailyBars)
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
      if (dailyStates && dailyFilter !== 'none' && assetClass === 'stocks') {
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
      const bonus = (consensusBonus && secStates && secStates[i]) ? ((st.pivotNow !== 'neutral' && secStates[i].pivotNow === st.pivotNow) ? 10 : 0) : 0
      const scoreNow = st.score + bonus
      scores.push(scoreNow)
      if (scoreNow >= threshold && i + horizon < bars.length) {
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
          if (scoreNow >= bin.th) bin.rets.push(fwd)
        }
        // Also populate regime curves if daily states available
        if (dailyStates && regimeCurves && assetClass === 'stocks') {
          // find daily bar index di again (reuse logic)
          const it2 = bars[i].time
          let di2 = -1
          for (let j = 0; j < dailyBars.length; j++) {
            if (dailyBars[j].time <= it2) di2 = j; else break
          }
          if (di2 >= 0) {
            const ds2 = dailyStates[di2]
            const isBull = (ds2.pivotNow === 'bullish' && ds2.ichiRegime === 'bullish')
            const isBear = (ds2.pivotNow === 'bearish' && ds2.ichiRegime === 'bearish')
            if (isBull) for (const bin of curveBull) { if (st.score >= bin.th) bin.rets.push(fwd) }
            if (isBear) for (const bin of curveBear) { if (st.score >= bin.th) bin.rets.push(fwd) }
          }
        }
      }
      if (matrix) {
        for (const row of matrix) {
          const hz = row.hz
          if (i + hz >= bars.length) continue
          const entry = bars[i].close
          const exit = bars[i + hz].close
          const fwd = (exit - entry) / entry
          for (const bin of row.bins) if (st.score >= bin.th) bin.rets.push(fwd)
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
    const medFwd = median(events.map(e => e.fwd))
    const out = {
      symbol, timeframe, bars: bars.length,
      scoreAvg: Number(avg.toFixed(2)),
      scorePcts: { p40: Number(pct(scores,40).toFixed(2)), p60: Number(pct(scores,60).toFixed(2)), p70: Number(pct(scores,70).toFixed(2)) },
      recentScores: scores.slice(-120),
      threshold, horizon, dailyFilter: assetClass==='stocks'?dailyFilter:'none', events: events.length, winRate: events.length ? Number(((wins/events.length)*100).toFixed(2)) : 0, avgFwd: Number((avgFwd*100).toFixed(2)),
      medianFwd: Number((medFwd*100).toFixed(2)),
      avgWin: Number((avgWin*100).toFixed(2)), avgLoss: Number((avgLoss*100).toFixed(2)), profitFactor: profitFactor==null?null:Number(profitFactor.toFixed(2)),
    }
    if (wantCurve) {
      out.curve = curve.map(c => {
        const arr = c.rets
        const ev = arr.length
        const wr = ev ? (arr.filter(x=>x>0).length/ev)*100 : 0
        const av = ev ? (arr.reduce((a,b)=>a+b,0)/ev)*100 : 0
        const med = ev ? median(arr)*100 : 0
        return { th: c.th, events: ev, winRate: Number(wr.toFixed(2)), avgFwd: Number(av.toFixed(2)), medianFwd: Number(med.toFixed(2)) }
      })
      if (dailyStates) {
        out.curveBull = curveBull.map(c => {
          const arr = c.rets
          const ev = arr.length
          const wr = ev ? (arr.filter(x=>x>0).length/ev)*100 : 0
          const av = ev ? (arr.reduce((a,b)=>a+b,0)/ev)*100 : 0
          const med = ev ? median(arr)*100 : 0
          return { th: c.th, events: ev, winRate: Number(wr.toFixed(2)), avgFwd: Number(av.toFixed(2)), medianFwd: Number(med.toFixed(2)) }
        })
        out.curveBear = curveBear.map(c => {
          const arr = c.rets
          const ev = arr.length
          const wr = ev ? (arr.filter(x=>x>0).length/ev)*100 : 0
          const av = ev ? (arr.reduce((a,b)=>a+b,0)/ev)*100 : 0
          const med = ev ? median(arr)*100 : 0
          return { th: c.th, events: ev, winRate: Number(wr.toFixed(2)), avgFwd: Number(av.toFixed(2)), medianFwd: Number(med.toFixed(2)) }
        })
      }
      if (matrix) {
        out.matrix = matrix.map(row => ({
          hz: row.hz,
          curve: row.bins.map(b => {
            const arr = b.rets
            const ev = arr.length
            const wr = ev ? (arr.filter(x=>x>0).length/ev)*100 : 0
            const av = ev ? (arr.reduce((a,b)=>a+b,0)/ev)*100 : 0
            return { th: b.th, events: ev, winRate: Number(wr.toFixed(2)), avgFwd: Number(av.toFixed(2)) }
          })
        }))
      }
    }
    if (format === 'summary' || format === 'summary-json') {
      // Build summary from curve(s)
      if (format === 'summary-json') {
        const summary = []
        const pushRows = (regime, arr) => {
          if (!Array.isArray(arr)) return
          for (const c of arr) summary.push({ regime, threshold: c.th, events: c.events, winRate: c.winRate, avgFwd: c.avgFwd, medianFwd: c.medianFwd })
        }
        pushRows('all', out.curve)
        if (regimeCurves && out.curveBull) pushRows('bull', out.curveBull)
        if (regimeCurves && out.curveBear) pushRows('bear', out.curveBear)
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.status(200).send(JSON.stringify({ summary }))
      } else {
        let header = 'regime,threshold,events,winRate,avgFwd,medianFwd\n'
        const rows = []
        const pushRows = (regime, arr) => {
          if (!Array.isArray(arr)) return
          for (const c of arr) rows.push(`${regime},${c.th},${c.events},${c.winRate}%,${c.avgFwd}%,${c.medianFwd}%`)
        }
        pushRows('all', out.curve)
        if (regimeCurves && out.curveBull) pushRows('bull', out.curveBull)
        if (regimeCurves && out.curveBear) pushRows('bear', out.curveBear)
        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.status(200).send(header + rows.join('\n'))
      }
    } else if (format === 'csv') {
      const header = 'time,close,score,forwardReturn\n'
      const rows = events.map(e => `${new Date(e.time*1000).toISOString()},${e.close},${e.score.toFixed(2)},${(e.fwd*100).toFixed(2)}%`).join('\n')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.status(200).send(header + rows)
    } else {
      // ETag support
      const body = JSON.stringify(out)
      const hash = crypto.createHash('sha1').update(body).digest('hex')
      const etag = `W/"${hash}"`
      res.setHeader('ETag', etag)
      const inm = req.headers['if-none-match']
      if (inm && inm === etag) {
        res.status(304).end()
        return
      }
      setCache(dataCache, cacheKey, { body, etag })
      res.status(200).send(body)
    }
  } catch (e) {
    // Log error for debugging
    console.error('[Backtest Error]', e.message || e)
    res.status(500).json({ error: e?.message || 'Backtest calculation failed' })
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

function mapSecondary(tf) {
  const t = String(tf || '').toLowerCase()
  if (t === '1m' || t === '1min') return '5Min'
  if (t === '5m' || t === '5min') return '15Min'
  if (t === '15m' || t === '15min') return '1Hour'
  return null
}

function median(arr) {
  if (!arr?.length) return 0
  const copy = [...arr].sort((a,b) => a - b)
  const mid = Math.floor(copy.length / 2)
  if (copy.length % 2) return copy[mid]
  return (copy[mid - 1] + copy[mid]) / 2
}

async function fetchBars({ symbol, timeframe, limit }) {
  // Use Yahoo Finance instead of Alpaca (free, unlimited)
  const interval = mapTimeframeToYahoo(timeframe)
  const range = getRangeForTimeframe(timeframe, limit)

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status}`)
  }

  const data = await response.json()
  const result = data.chart.result[0]

  if (!result || !result.timestamp) {
    throw new Error('Invalid Yahoo Finance response')
  }

  const timestamps = result.timestamp
  const quote = result.indicators.quote[0]

  const bars = []
  for (let i = 0; i < timestamps.length; i++) {
    if (!quote.open[i] || !quote.close[i]) continue

    bars.push({
      time: timestamps[i], // Yahoo gives seconds, which is what we need
      open: quote.open[i],
      high: quote.high[i],
      low: quote.low[i],
      close: quote.close[i],
      volume: quote.volume[i] || 0
    })
  }

  return bars.slice(-limit)
}

function mapTimeframeToYahoo(timeframe) {
  const map = {
    '1Min': '1m',
    '5Min': '5m',
    '15Min': '15m',
    '30Min': '30m',
    '1Hour': '1h',
    '4Hour': '1h',
    '1Day': '1d'
  }
  return map[timeframe] || '1m'
}

function getRangeForTimeframe(timeframe, limit) {
  if (timeframe.includes('Min') || timeframe.includes('Hour')) {
    if (timeframe === '1Min') return '1d'
    if (timeframe === '5Min') return '5d'
    if (timeframe === '15Min') return '1mo'
    if (timeframe === '1Hour') return '3mo'
    return '1mo'
  }

  if (timeframe === '1Day') {
    if (limit <= 100) return '3mo'
    if (limit <= 250) return '1y'
    return '2y'
  }

  return '1mo'
}

async function fetchBarsCrypto({ key, secret, dataBaseCrypto, symbol, timeframe, limit }) {
  const qs = new URLSearchParams({ symbols: symbol, timeframe, limit: String(limit) })
  const now = new Date()
  const backDays = timeframe === '1Day' ? 365 * 2 : 21
  const startDate = new Date(now.getTime() - backDays * 24 * 60 * 60 * 1000)
  qs.set('start', startDate.toISOString())
  const endpoint = `${dataBaseCrypto}/crypto/us/bars?${qs.toString()}`
  const r = await fetch(endpoint, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j))
  let raw = []
  if (Array.isArray(j?.bars?.[symbol])) raw = j.bars[symbol]
  else if (Array.isArray(j?.bars)) raw = j.bars
  else if (Array.isArray(j?.data?.bars)) raw = j.data.bars
  return raw.map(b => ({
    time: Math.floor(new Date(b.t || b.Timestamp || b.time).getTime() / 1000),
    open: b.o ?? b.Open, high: b.h ?? b.High, low: b.l ?? b.Low, close: b.c ?? b.Close, volume: b.v ?? b.Volume,
  }))
}
