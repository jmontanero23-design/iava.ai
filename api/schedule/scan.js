import crypto from 'node:crypto'

function mapTf(tf) {
  const t = String(tf || '').toLowerCase()
  if (t === '1m' || t === '1min') return '1Min'
  if (t === '5m' || t === '5min') return '5Min'
  if (t === '15m' || t === '15min') return '15Min'
  if (t === '1h' || t === '1hour') return '1Hour'
  if (t === '1d' || t === '1day' || t === 'day') return '1Day'
  return '5Min'
}

function mapSecondary(tf) {
  const t = String(tf || '').toLowerCase()
  if (t === '1m' || t === '1min') return '5Min'
  if (t === '5m' || t === '5min') return '15Min'
  if (t === '15m' || t === '15min') return '1Hour'
  return null
}

async function fetchBars({ key, secret, dataBase, symbol, timeframe, limit }) {
  const qs = new URLSearchParams({ symbols: symbol, timeframe, limit: String(limit), feed: process.env.ALPACA_STOCKS_FEED || 'iex', adjustment: 'raw' })
  // default window: 7d intraday, 365d daily
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

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    const cronSecret = process.env.CRON_SECRET || ''
    if (cronSecret) {
      const given = req.headers['x-cron-secret'] || ''
      if (given !== cronSecret) return res.status(401).json({ error: 'Unauthorized' })
    }
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const dataBase = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'
    if (!key || !secret) return res.status(500).json({ error: 'Missing Alpaca keys' })

    const url = new URL(req.url, 'http://localhost')
    const timeframe = mapTf(url.searchParams.get('timeframe') || '5Min')
    const threshold = Math.max(0, Math.min(100, parseFloat(url.searchParams.get('threshold') || '70')))
    const top = Math.min(100, Math.max(1, parseInt(url.searchParams.get('top') || '20', 10)))
    const enforceDaily = (url.searchParams.get('enforceDaily') || '1') !== '0'
    const requireConsensus = (url.searchParams.get('requireConsensus') || '0') !== '0'
    const assetClass = (url.searchParams.get('assetClass') || 'stocks').toLowerCase()
    const symbolsParam = (url.searchParams.get('symbols') || '').trim()
    let symbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : []

    // If symbols not provided, fetch universe (stocks active tradable)
    if (!symbols.length) {
      const env = process.env.ALPACA_ENV || 'paper'
      const base = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'
      const u = await fetch(`${base}/v2/assets?status=active&asset_class=${assetClass==='crypto'?'crypto':'us_equity'}`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
      const uj = await u.json()
      if (!u.ok) return res.status(u.status).json(uj)
      symbols = (Array.isArray(uj) ? uj.filter(a => a?.tradable).map(a => a.symbol) : []).slice(0, 500)
    }

    const { computeStates } = await import('../../src/utils/indicators.js')

    const longs = []
    const shorts = []
    let counts = { neutralSkipped: 0, consensusBlocked: 0, dailyBlocked: 0, thresholdRejected: 0, acceptedLongs: 0, acceptedShorts: 0 }

    // Optionally preload daily bars map
    let dailyMap = {}
    if (enforceDaily && assetClass === 'stocks') {
      for (const sym of symbols) {
        try { dailyMap[sym] = await fetchBars({ key, secret, dataBase, symbol: sym, timeframe: '1Day', limit: 400 }) } catch {}
      }
    }

    // Sequential scan to be kinder on rate limits
    for (const sym of symbols) {
      try {
        const bars = await fetchBars({ key, secret, dataBase, symbol: sym, timeframe, limit: 500 })
        if (!bars.length) continue
        const st = computeStates(bars)
        let dir = st.satyDir || (st.pivotNow === 'bullish' ? 'long' : st.pivotNow === 'bearish' ? 'short' : null)
        if (!dir) { counts.neutralSkipped++; continue }
        let consensusAligned = false
        if (requireConsensus) {
          const secTf = mapSecondary(timeframe)
          if (secTf) {
            const secBars = await fetchBars({ key, secret, dataBase, symbol: sym, timeframe: secTf, limit: 500 })
            if (secBars.length) {
              const sec = computeStates(secBars)
              consensusAligned = (st.pivotNow === sec.pivotNow) && st.pivotNow !== 'neutral'
            }
          }
          if (!consensusAligned) { counts.consensusBlocked++; continue }
        }
        const scoreOut = st.score + (consensusAligned ? 10 : 0)
        if (enforceDaily && assetClass === 'stocks') {
          const d = dailyMap[sym] || []
          if (!d.length) continue
          const ds = computeStates(d)
          const bull = ds.pivotNow === 'bullish' && ds.ichiRegime === 'bullish'
          const bear = ds.pivotNow === 'bearish' && ds.ichiRegime === 'bearish'
          const ok = dir === 'long' ? bull : bear
          if (!ok) { counts.dailyBlocked++; continue }
        }
        if (scoreOut < threshold) { counts.thresholdRejected++; continue }
        const item = { symbol: sym, score: scoreOut, dir, last: bars[bars.length - 1] }
        if (dir === 'long') { longs.push(item); counts.acceptedLongs++ } else { shorts.push(item); counts.acceptedShorts++ }
      } catch { /* ignore per-symbol errors */ }
    }

    longs.sort((a,b)=>b.score-a.score)
    shorts.sort((a,b)=>b.score-a.score)
    const out = { at: new Date().toISOString(), timeframe, threshold, top, enforceDaily, requireConsensus, counts, longs: longs.slice(0, top), shorts: shorts.slice(0, top) }

    // Optional: forward to n8n webhook with HMAC signature
    if ((process.env.N8N_ENABLED || 'true').toLowerCase() !== 'false' && process.env.N8N_WEBHOOK_URL) {
      try {
        const body = JSON.stringify(out)
        const headers = { 'Content-Type': 'application/json' }
        const secret = process.env.N8N_SHARED_SECRET
        if (secret) {
          const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')
          headers['X-Signature'] = sig
        }
        await fetch(process.env.N8N_WEBHOOK_URL, { method: 'POST', headers, body })
      } catch { /* ignore forwarding errors */ }
    }

    res.status(200).json(out)
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

