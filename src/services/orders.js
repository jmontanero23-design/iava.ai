export async function placeOrder({ symbol, side, qty, type = 'market', timeInForce = 'day', takeProfit, stopLoss, orderClass }) {
  const r = await fetch('/api/alpaca/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, side, qty, type, timeInForce, takeProfit, stopLoss, orderClass }),
  })
  const json = await r.json()
  if (!r.ok) throw new Error(json?.message || json?.error || `Order error ${r.status}`)
  return json
}

export async function getClock() {
  const r = await fetch('/api/alpaca/clock')
  return r.json()
}

