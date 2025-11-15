import { getCacheMap, getCache, setCache } from '../lib/cache.js'

const dailyCache = getCacheMap('dailyBars')

export default async function handler(req, res) {
  try {
    // Using Yahoo Finance for stock data (no API keys needed)

    const url = new URL(req.url, 'http://localhost')
    const symbols = (url.searchParams.get('symbols') || 'AAPL').split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    const timeframe = mapTf(url.searchParams.get('timeframe') || '1Min')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '1000', 10), 2000)
    const threshold = Math.max(0, Math.min(100, parseFloat(url.searchParams.get('threshold') || '70')))
    const horizon = Math.max(1, Math.min(100, parseInt(url.searchParams.get('horizon') || '10', 10)))
    const dailyFilter = (url.searchParams.get('dailyFilter') || 'none').toLowerCase()
    const format = (url.searchParams.get('format') || 'csv').toLowerCase()
    const includeRegimes = (url.searchParams.get('includeRegimes') || '1') !== '0'

    const { computeStates } = await import('../src/utils/indicators.js')

    // Events accumulation
    const header = 'symbol,time,close,score,forwardReturn\n'
    let rows = ''
    const eventsJson = []
    // Summary (per threshold, overall/bull/bear)
    const ths = [30,40,50,60,70,80,90]
    const sumRows = [] // {symbol, regime, th, events, winRate, avgFwd, medianFwd}
    for (const symbol of symbols) {
      const bars = await fetchBars({ symbol, timeframe, limit })
      if (!bars.length) continue
      let dailyBars = null, dailyStates = null
      if (dailyFilter !== 'none') {
        const dkey = `${symbol}|1Day|400`
        dailyBars = getCache(dailyCache, dkey, 60 * 60 * 1000)
        if (!dailyBars) {
          dailyBars = await fetchBars({ symbol, timeframe: '1Day', limit: 400 })
          setCache(dailyCache, dkey, dailyBars)
        }
        dailyStates = []
        for (let di = 0; di < dailyBars.length; di++) dailyStates[di] = computeStates(dailyBars.slice(0, di + 1))
      }
      const start = Math.min(80, Math.floor(bars.length / 5))
      // For summary curves
      const curveAll = ths.map(th => ({ th, rets: [] }))
      const curveBull = ths.map(th => ({ th, rets: [] }))
      const curveBear = ths.map(th => ({ th, rets: [] }))
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
          const iso = new Date(bars[i].time*1000).toISOString()
          rows += `${symbol},${iso},${entry},${st.score.toFixed(2)},${(fwd*100).toFixed(2)}%\n`
          eventsJson.push({ symbol, time: iso, close: entry, score: Number(st.score.toFixed(2)), forwardReturnPct: Number((fwd*100).toFixed(2)) })
        }
        // Summary accumulation
        if (i + horizon < bars.length) {
          const entry = bars[i].close
          const exit = bars[i + horizon].close
          const fwd = (exit - entry) / entry
          for (const bin of curveAll) if (st.score >= bin.th) bin.rets.push(fwd)
          if (dailyStates) {
            const it2 = bars[i].time
            let di2 = -1
            for (let j = 0; j < dailyBars.length; j++) { if (dailyBars[j].time <= it2) di2 = j; else break }
            if (di2 >= 0) {
              const ds2 = dailyStates[di2]
              const isBull = (ds2.pivotNow === 'bullish' && ds2.ichiRegime === 'bullish')
              const isBear = (ds2.pivotNow === 'bearish' && ds2.ichiRegime === 'bearish')
              if (isBull) for (const bin of curveBull) if (st.score >= bin.th) bin.rets.push(fwd)
              if (isBear) for (const bin of curveBear) if (st.score >= bin.th) bin.rets.push(fwd)
            }
          }
        }
      }
      // Push summary rows per symbol
      if (format === 'summary') {
        const pushCurve = (regime, curve) => {
          for (const c of curve) {
            const arr = c.rets
            const ev = arr.length
            const wr = ev ? (arr.filter(x=>x>0).length/ev)*100 : 0
            const av = ev ? (arr.reduce((a,b)=>a+b,0)/ev)*100 : 0
            const med = ev ? median(arr)*100 : 0
            sumRows.push({ symbol, regime, th: c.th, events: ev, winRate: wr.toFixed(2), avgFwd: av.toFixed(2), medianFwd: med.toFixed(2) })
          }
        }
        pushCurve('all', curveAll)
        if (includeRegimes) {
          pushCurve('bull', curveBull)
          pushCurve('bear', curveBear)
        }
      }
    }
    if (format === 'summary') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      const sumHeader = 'symbol,regime,threshold,events,winRate,avgFwd,medianFwd\n'
      const sumCsv = sumRows.map(r => `${r.symbol},${r.regime},${r.th},${r.events},${r.winRate}%,${r.avgFwd}%,${r.medianFwd}%`).join('\n')
      res.status(200).send(sumHeader + sumCsv)
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.status(200).send(JSON.stringify({ events: eventsJson }))
    } else if (format === 'summary-json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.status(200).send(JSON.stringify({ summary: sumRows }))
    } else {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.status(200).send(header + rows)
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

function median(arr) {
  if (!arr?.length) return 0
  const copy = [...arr].sort((a,b) => a - b)
  const mid = Math.floor(copy.length / 2)
  if (copy.length % 2) return copy[mid]
  return (copy[mid - 1] + copy[mid]) / 2
}
