export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const env = process.env.ALPACA_ENV || 'paper'
    if (!key || !secret) {
      res.status(500).json({ error: 'Missing ALPACA_KEY_ID/ALPACA_SECRET_KEY env vars' })
      return
    }
    const base = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'
    const r = await fetch(`${base}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret,
      },
    })
    const data = await r.json()
    res.status(r.ok ? 200 : r.status).json(data)
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

