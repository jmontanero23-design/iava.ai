import React, { useEffect, useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

async function api(path, opts) {
  const r = await fetch(path, opts)
  const txt = await r.text()
  try { return { ok: r.ok, json: JSON.parse(txt) } } catch { return { ok: r.ok, text: txt } }
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function refresh() {
    setLoading(true)
    setMsg('')
    try {
      const o = await api('/api/alpaca/orders')
      const p = await api('/api/alpaca/positions')
      setOrders(Array.isArray(o.json) ? o.json : [])
      setPositions(Array.isArray(p.json) ? p.json : [])
    } catch (e) {
      setMsg(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  async function cancelOrder(id) {
    const r = await api('/api/alpaca/order_cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setMsg(r.ok ? 'Order cancelled' : (r.json?.message || r.text || 'Cancel error'))
    refresh()
  }

  async function closePosition(symbol) {
    const r = await api('/api/alpaca/position_close', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol }) })
    setMsg(r.ok ? 'Position close sent' : (r.json?.message || r.text || 'Close error'))
    refresh()
  }

  useEffect(() => { refresh() }, [])

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Orders & Positions <InfoPopover title="Trading Ops">Manage open orders (cancel) and positions (close). Paper trading recommended while tuning guardrails.</InfoPopover></h3>
        <button onClick={refresh} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>
      {msg && <div className="text-xs text-slate-400 mt-2">{msg}</div>}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-slate-400 mb-1">Open Orders</div>
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {orders.length === 0 && <div className="text-slate-500 text-xs">No open orders</div>}
            {orders.map(o => (
              <div key={o.id} className="border border-slate-800 rounded p-2 flex items-center justify-between">
                <div>
                  <div className="text-slate-200">{o.symbol} · {o.side} · {o.qty} {o.type}</div>
                  <div className="text-xs text-slate-500">id {o.id} · {o.status}</div>
                </div>
                <button onClick={() => cancelOrder(o.id)} className="text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded px-2 py-1">Cancel</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-slate-400 mb-1">Positions</div>
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {positions.length === 0 && <div className="text-slate-500 text-xs">No positions</div>}
            {positions.map(p => (
              <div key={p.symbol} className="border border-slate-800 rounded p-2 flex items-center justify-between">
                <div>
                  <div className="text-slate-200">{p.symbol} · {p.side} · qty {p.qty} · avg {Number(p.avg_entry_price).toFixed(2)}</div>
                  <div className="text-xs text-slate-500">unrealized {Number(p.unrealized_pl).toFixed(2)} · {Number(p.unrealized_plpc * 100).toFixed(2)}%</div>
                </div>
                <button onClick={() => closePosition(p.symbol)} className="text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded px-2 py-1">Close</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
