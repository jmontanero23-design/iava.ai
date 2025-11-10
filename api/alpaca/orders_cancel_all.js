export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const env = process.env.ALPACA_ENV || 'paper'
    if (!key || !secret) return res.status(500).json({ error: 'Missing Alpaca keys' })
    const base = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'
    const r = await fetch(`${base}/v2/orders`, { method: 'DELETE', headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
    const text = await r.text()
    // Alpaca returns empty body on success for cancel all
    if (r.ok) return res.status(200).json({ ok: true })
    try { return res.status(r.status).json(JSON.parse(text)) } catch { return res.status(r.status).send(text) }
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

