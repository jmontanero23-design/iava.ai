import crypto from 'node:crypto'
import { getCacheMap, getCache, setCache } from '../lib/cache.js'

const cacheMap = getCacheMap('scan')

export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const dataBase = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'
    if (!key || !secret) return res.status(500).json({ error: 'Missing Alpaca keys' })

    const url = new URL(req.url, 'http://localhost')
    const timeframe = mapTf(url.searchParams.get('timeframe') || '5Min')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '500', 10), 2000)
    const top = Math.min(parseInt(url.searchParams.get('top') || '10', 10), 100)
    const threshold = Math.max(0, Math.min(100, parseFloat(url.searchParams.get('threshold') || '70')))
    const enforceDaily = (url.searchParams.get('enforceDaily') || '1') !== '0'
    const returnAll = (url.searchParams.get('returnAll') || '0') === '1'
    const requireConsensus = (url.searchParams.get('requireConsensus') || '0') === '1'
    const symbolsParam = (url.searchParams.get('symbols') || '').trim()
    const symbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : getDefaultSymbols()

    // Cache by query
    const cacheKey = JSON.stringify({ timeframe, limit, top, threshold, enforceDaily, symbols })
    const cached = getCache(cacheMap, cacheKey, ttlFor(timeframe))
    const inm = req.headers['if-none-match']
    if (cached) {
      res.setHeader('ETag', cached.etag)
      if (inm && inm === cached.etag) { res.status(304).end(); return }
      res.status(200).send(cached.body)
      return
    }

    // Pull daily bars once per symbol if enforcing daily
    const dailyMap = {}
    if (enforceDaily) {
      await Promise.all(symbols.map(async (sym) => {
        const d = await fetchBars({ key, secret, dataBase, symbol: sym, timeframe: '1Day', limit: 400 })
        dailyMap[sym] = d
      }))
    }

    const { computeStates } = await import('../src/utils/indicators.js')
    const results = []
    let neutralSkipped = 0
    let consensusBlocked = 0
    let dailyBlocked = 0
    let thresholdRejected = 0
    await Promise.all(symbols.map(async (sym) => {
      try {
        const bars = await fetchBars({ key, secret, dataBase, symbol: sym, timeframe, limit })
        if (!bars.length) return
        const st = computeStates(bars)
        let dir = st.satyDir || (st.pivotNow === 'bullish' ? 'long' : st.pivotNow === 'bearish' ? 'short' : null)
        if (!dir) { neutralSkipped++; return }
        let consensusAligned = false
        if (requireConsensus) {
          const secTf = mapSecondary(timeframe)
          if (secTf) {
            const secBars = await fetchBars({ key, secret, dataBase, symbol: sym, timeframe: secTf, limit })
            if (!secBars.length) return
            const sec = computeStates(secBars)
            const align = (st.pivotNow === sec.pivotNow) && st.pivotNow !== 'neutral'
            if (!align) { consensusBlocked++; return }
            consensusAligned = true
          }
        }
        const scoreOut = st.score + (consensusAligned ? 10 : 0)
        if (enforceDaily) {
          const d = dailyMap[sym]
          if (!d || !d.length) return
          const ds = computeStates(d)
          const bull = ds.pivotNow === 'bullish' && ds.ichiRegime === 'bullish'
          const bear = ds.pivotNow === 'bearish' && ds.ichiRegime === 'bearish'
          if ((dir === 'long' && !bull) || (dir === 'short' && !bear)) { dailyBlocked++; return }
          if (scoreOut < threshold) { thresholdRejected++; return }
          results.push({ symbol: sym, score: scoreOut, dir, last: bars[bars.length-1], daily: { pivot: ds.pivotNow, ichi: ds.ichiRegime } })
        } else {
          if (scoreOut < threshold) { thresholdRejected++; return }
          results.push({ symbol: sym, score: scoreOut, dir, last: bars[bars.length-1] })
        }
      } catch (_) { /* ignore symbol errors */ }
    }))

    // Results are already threshold-filtered above for accurate counts
    const longsAll = results.filter(r => r.dir === 'long').sort((a,b) => b.score - a.score)
    const shortsAll = results.filter(r => r.dir === 'short').sort((a,b) => b.score - a.score)
    const longs = returnAll ? longsAll : longsAll.slice(0, top)
    const shorts = returnAll ? shortsAll : shortsAll.slice(0, top)
    const payload = {
      timeframe,
      threshold,
      enforceDaily,
      universe: symbols.length,
      longs,
      shorts,
      counts: {
        neutralSkipped,
        consensusBlocked: requireConsensus ? consensusBlocked : undefined,
        dailyBlocked: enforceDaily ? dailyBlocked : undefined,
        thresholdRejected,
        acceptedLongs: longsAll.length,
        acceptedShorts: shortsAll.length,
      }
    }
    const body = JSON.stringify(payload)
    const etag = `W/"${crypto.createHash('sha1').update(body).digest('hex')}"`
    setCache(cacheMap, cacheKey, { body, etag })
    res.setHeader('ETag', etag)
    if (inm && inm === etag) { res.status(304).end(); return }
    res.status(200).send(body)
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

function getDefaultSymbols() {
  const env = (process.env.SCAN_SYMBOLS || '').trim()
  if (env) return env.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
  return ['SPY','QQQ','AAPL','MSFT','NVDA','TSLA','AMZN','META','GOOGL','NFLX','AMD','SMCI','AVGO','COST','JPM','UNH','XOM']
}

function mapTf(tf) {
  const t = String(tf || '').toLowerCase()
  if (t === '1m' || t === '1min') return '1Min'
  if (t === '5m' || t === '5min') return '5Min'
  if (t === '15m' || t === '15min') return '15Min'
  if (t === '1h' || t === '1hour') return '1Hour'
  if (t === '1d' || t === '1day' || t === 'day') return '1Day'
  return '5Min'
}

function ttlFor(tf) {
  if (tf === '1Min') return 10 * 1000
  if (tf === '5Min') return 60 * 1000
  if (tf === '15Min') return 2 * 60 * 1000
  if (tf === '1Hour') return 5 * 60 * 1000
  return 60 * 60 * 1000
}

async function fetchBars({ key, secret, dataBase, symbol, timeframe, limit }) {
  const qs = new URLSearchParams({ symbols: symbol, timeframe, limit: String(limit), feed: process.env.ALPACA_STOCKS_FEED || 'iex', adjustment: 'raw' })
  const now = new Date()
  const backDays = timeframe === '1Day' ? 365 : 7
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

function mapSecondary(tf) {
  const t = String(tf || '').toLowerCase()
  if (t === '1min') return '5Min'
  if (t === '5min') return '15Min'
  if (t === '15min') return '1Hour'
  return null
}
