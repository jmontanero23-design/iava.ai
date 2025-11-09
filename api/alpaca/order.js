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

    const { symbol, side, qty, type = 'market', timeInForce = 'day', takeProfit, stopLoss, orderClass } = body || {}
    if (!symbol || !side || !qty) return res.status(400).json({ error: 'Missing symbol/side/qty' })
    const payload = {
      symbol,
      side,
      qty: String(qty),
      type,
      time_in_force: timeInForce,
    }
    if (orderClass === 'bracket' && (takeProfit || stopLoss)) {
      payload.order_class = 'bracket'
      if (takeProfit && typeof takeProfit.limit_price === 'number') payload.take_profit = { limit_price: Number(takeProfit.limit_price) }
      if (stopLoss && (typeof stopLoss.stop_price === 'number' || typeof stopLoss.limit_price === 'number')) {
        const o = {}
        if (typeof stopLoss.stop_price === 'number') o.stop_price = Number(stopLoss.stop_price)
        if (typeof stopLoss.limit_price === 'number') o.limit_price = Number(stopLoss.limit_price)
        payload.stop_loss = o
      }
    }
    const base = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'
    const r = await fetch(`${base}/v2/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret,
      },
      body: JSON.stringify(payload),
    })
    const j = await r.json()
    res.status(r.ok ? 200 : r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

