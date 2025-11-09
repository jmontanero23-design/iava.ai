#!/usr/bin/env node
import fs from 'node:fs'
import { computeStates } from '../src/utils/indicators.js'

const KEY = process.env.ALPACA_KEY_ID
const SECRET = process.env.ALPACA_SECRET_KEY
const DATA_BASE = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets/v2'

function mapTf(tf) {
  const t = tf.toLowerCase()
  if (t === '1m' || t === '1min') return '1Min'
  if (t === '5m' || t === '5min') return '5Min'
  if (t === '15m' || t === '15min') return '15Min'
  if (t === '1h' || t === '1hour') return '1Hour'
  if (t === '1d' || t === '1day' || t === 'day') return '1Day'
  return '1Min'
}

async function fetchBars(symbol, timeframe = '1Min', limit = 1000) {
  const qs = new URLSearchParams({ symbols: symbol, timeframe, limit: String(limit), feed: 'iex', adjustment: 'raw' })
  const now = new Date()
  const backDays = timeframe === '1Day' ? 365 * 2 : 14
  const startDate = new Date(now.getTime() - backDays * 24 * 60 * 60 * 1000)
  qs.set('start', startDate.toISOString())
  const url = `${DATA_BASE}/stocks/bars?${qs.toString()}`
  const r = await fetch(url, { headers: { 'APCA-API-KEY-ID': KEY, 'APCA-API-SECRET-KEY': SECRET } })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j))
  const raw = Array.isArray(j?.bars?.[symbol]) ? j.bars[symbol] : (Array.isArray(j?.bars) ? j.bars : [])
  return raw.map(b => ({
    time: Math.floor(new Date(b.t || b.Timestamp || b.time).getTime() / 1000),
    open: b.o ?? b.Open, high: b.h ?? b.High, low: b.l ?? b.Low, close: b.c ?? b.Close, volume: b.v ?? b.Volume,
  }))
}

async function main() {
  const symbol = process.argv[2] || 'AAPL'
  const timeframe = mapTf(process.argv[3] || '1Min')
  const limit = parseInt(process.argv[4] || '1000', 10)
  if (!KEY || !SECRET) {
    console.error('Missing ALPACA_KEY_ID/ALPACA_SECRET_KEY env vars')
    process.exit(1)
  }
  const bars = await fetchBars(symbol, timeframe, limit)
  const state = computeStates(bars)
  // Simple stats on Score distribution
  const scores = []
  for (let i = 50; i < bars.length; i++) {
    const slice = bars.slice(0, i+1)
    scores.push(computeStates(slice).score)
  }
  const avg = (arr) => arr.reduce((a,b)=>a+b,0) / arr.length
  const pct = (arr, t) => (arr.filter(x => x >= t).length / arr.length) * 100
  const out = {
    symbol, timeframe, bars: bars.length,
    latestScore: state.score,
    scoreAvg: Number(avg(scores).toFixed(2)),
    scorePcts: { p40: Number(pct(scores,40).toFixed(2)), p60: Number(pct(scores,60).toFixed(2)), p70: Number(pct(scores,70).toFixed(2)) },
  }
  console.log(JSON.stringify(out, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })

