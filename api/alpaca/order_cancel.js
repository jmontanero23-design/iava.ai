export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const env = process.env.ALPACA_ENV || 'paper'
    if (!key || !secret) return res.status(500).json({ error: 'Missing Alpaca keys' })
    const chunks = []
    for await (const c of req) chunks.push(c)
    const raw = Buffer.concat(chunks).toString('utf8')
    let body
    try { body = JSON.parse(raw) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }
    const { id } = body || {}
    if (!id) return res.status(400).json({ error: 'Missing order id' })
    const base = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'
    const r = await fetch(`${base}/v2/orders/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret },
    })
    if (r.status === 204) return res.status(200).json({ ok: true })
    const j = await r.json().catch(() => ({}))
    res.status(r.ok ? 200 : r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

