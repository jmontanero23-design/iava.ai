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

    const { symbol, side, qty, type = 'market', timeInForce = 'day', takeProfit, stopLoss, orderClass, entry } = body || {}
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

    // Guardrails: market open, max positions, max risk %
    const requireOpen = (process.env.ORDER_RULE_MARKET_OPEN_REQUIRED || 'true').toLowerCase() === 'true'
    const maxPositions = parseInt(process.env.ORDER_RULE_MAX_POSITIONS || '0', 10) // 0 means no limit
    const maxRiskPct = parseFloat(process.env.ORDER_RULE_MAX_RISK_PCT || '0') // 0 means no limit

    if (requireOpen) {
      const rc = await fetch(`${base}/v2/clock`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
      const jc = await rc.json()
      if (!rc.ok) return res.status(rc.status).json(jc)
      if (!jc.is_open) return res.status(400).json({ error: 'Market closed (guardrail)' })
    }

    let positionsCache = null
    if (maxPositions > 0) {
      const rp = await fetch(`${base}/v2/positions`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
      const jp = await rp.json()
      if (!rp.ok) return res.status(rp.status).json(jp)
      positionsCache = Array.isArray(jp) ? jp : []
      if (positionsCache.length >= maxPositions) return res.status(400).json({ error: `Max positions reached (${positionsCache.length}/${maxPositions})` })
    }

    if (maxRiskPct > 0 && stopLoss && typeof stopLoss.stop_price === 'number') {
      // Estimate entry as provided or latest close via data API (fallback)
      let estEntry = typeof entry === 'number' ? entry : null
      if (estEntry == null) {
        const rd = await fetch(`https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/trades/latest`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
        const jd = await rd.json()
        estEntry = jd?.trade?.p || null
      }
      const rc = await fetch(`${base}/v2/account`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
      const ja = await rc.json()
      if (!rc.ok) return res.status(rc.status).json(ja)
      const equity = parseFloat(ja.equity || '0')
      const lastEquity = parseFloat(ja.last_equity || '0')
      if (equity > 0 && estEntry != null) {
        const stop = Number(stopLoss.stop_price)
        const q = Number(qty)
        const perShare = side === 'buy' ? Math.max(0, estEntry - stop) : Math.max(0, stop - estEntry)
        const riskUsd = perShare * q
        const pct = (riskUsd / equity) * 100
        if (pct > maxRiskPct) return res.status(400).json({ error: `Risk ${pct.toFixed(2)}% exceeds limit ${maxRiskPct}% (guardrail)` })
      }
    }

    // Max exposure guardrail (sum market_value / equity)
    const maxExposurePct = parseFloat(process.env.ORDER_RULE_MAX_EXPOSURE_PCT || '0')
    if (maxExposurePct > 0) {
      let pos = positionsCache
      if (!Array.isArray(pos)) {
        const rp = await fetch(`${base}/v2/positions`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
        pos = await rp.json()
      }
      const ra = await fetch(`${base}/v2/account`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
      const ja2 = await ra.json()
      const eq = parseFloat(ja2.equity || '0')
      const exposure = Array.isArray(pos) ? pos.reduce((sum,p) => sum + Math.abs(parseFloat(p.market_value || '0')), 0) : 0
      const expPct = eq > 0 ? (exposure / eq) * 100 : 0
      if (expPct > maxExposurePct) return res.status(400).json({ error: `Exposure ${expPct.toFixed(2)}% exceeds limit ${maxExposurePct}% (guardrail)` })
    }

    // Min minutes between orders (cooldown)
    const minMinBetween = parseInt(process.env.ORDER_RULE_MIN_MINUTES_BETWEEN_ORDERS || '0', 10)
    if (minMinBetween > 0) {
      const rlast = await fetch(`${base}/v2/orders?status=all&limit=1&direction=desc`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
      const jlast = await rlast.json()
      if (Array.isArray(jlast) && jlast[0]?.created_at) {
        const t = new Date(jlast[0].created_at).getTime()
        const dtMin = (Date.now() - t) / 60000
        if (dtMin < minMinBetween) return res.status(400).json({ error: `Cooldown active: wait ${Math.ceil(minMinBetween - dtMin)} min` })
      }
    }

    // Daily loss cap guardrail
    const maxDailyLossPct = parseFloat(process.env.ORDER_RULE_MAX_DAILY_LOSS_PCT || '0')
    if (maxDailyLossPct > 0) {
      const ra = await fetch(`${base}/v2/account`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
      const ja2 = await ra.json()
      if (!ra.ok) return res.status(ra.status).json(ja2)
      const eq = parseFloat(ja2.equity || '0')
      const lastEq = parseFloat(ja2.last_equity || '0')
      if (eq > 0 && lastEq > 0) {
        const changePct = ((eq - lastEq) / lastEq) * 100
        if (changePct < -maxDailyLossPct) return res.status(400).json({ error: `Daily loss ${changePct.toFixed(2)}% exceeds limit ${maxDailyLossPct}% (guardrail)` })
      }
    }
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
