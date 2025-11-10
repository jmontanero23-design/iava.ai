import React, { useEffect, useMemo, useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

async function api(path, opts) {
  const r = await fetch(path, opts)
  const txt = await r.text()
  try { return { ok: r.ok, json: JSON.parse(txt) } } catch { return { ok: r.ok, text: txt } }
}

export default function OrdersPanel({ symbol: currentSymbol, lastPrice, saty }) {
  const [orders, setOrders] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [sym, setSym] = useState(currentSymbol || 'AAPL')
  const [side, setSide] = useState('buy')
  const [qty, setQty] = useState(1)
  const [klass, setKlass] = useState('market') // market | bracket
  const [tpPct, setTpPct] = useState(1.0)
  const [slPct, setSlPct] = useState(0.5)
  const [riskPct, setRiskPct] = useState(1.0)
  const [useSaty, setUseSaty] = useState(false)
  const [stopLevel, setStopLevel] = useState('t0236')
  const [tpLevel, setTpLevel] = useState('t1000')
  const [account, setAccount] = useState(null)
  const [rules, setRules] = useState(null)

  useEffect(() => setSym(currentSymbol || 'AAPL'), [currentSymbol])

  const preview = useMemo(() => {
    const price = Number(lastPrice || 0)
    if (klass !== 'bracket' || !price) return null
    if (useSaty && saty?.levels) {
      const lv = saty.levels
      const sl = side === 'buy' ? lv[stopLevel]?.dn : lv[stopLevel]?.up
      const tp = side === 'buy' ? lv[tpLevel]?.up : lv[tpLevel]?.dn
      return { tp, sl }
    }
    const tp = side === 'buy' ? price * (1 + tpPct / 100) : price * (1 - tpPct / 100)
    const sl = side === 'buy' ? price * (1 - slPct / 100) : price * (1 + slPct / 100)
    return { tp, sl }
  }, [klass, side, tpPct, slPct, lastPrice, useSaty, saty, stopLevel, tpLevel])

  useEffect(() => { (async () => { try { const r = await fetch('/api/alpaca/account'); const j = await r.json(); if (r.ok) setAccount(j) } catch {} })() }, [])
  useEffect(() => { (async () => { try { const r = await fetch('/api/config'); const j = await r.json(); if (r.ok) setRules(j?.order || null) } catch {} })() }, [])

  function calcQtyFromRisk() {
    const price = Number(lastPrice || 0)
    const eq = parseFloat(account?.equity || '0')
    if (!price || !eq) return
    let slPrice
    if (useSaty && saty?.levels) {
      const lv = saty.levels
      slPrice = side === 'buy' ? lv[stopLevel]?.dn : lv[stopLevel]?.up
    } else {
      slPrice = side === 'buy' ? price * (1 - slPct / 100) : price * (1 + slPct / 100)
    }
    if (slPrice == null) return
    const perShare = side === 'buy' ? Math.max(0, price - slPrice) : Math.max(0, slPrice - price)
    if (!(perShare > 0)) return
    const budget = (Math.max(0, parseFloat(riskPct) || 0) / 100) * eq
    const q = Math.floor(budget / perShare)
    if (Number.isFinite(q) && q > 0) setQty(q)
  }

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
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Orders & Positions <InfoPopover title="Trading Ops">Place orders and manage open orders/positions. Bracket orders set both take‑profit and stop‑loss. Use Risk % + Calc Qty for consistent sizing. Guardrails may reject orders (market closed, risk/exposure, cooldown, daily loss cap).</InfoPopover></h3>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">{loading ? 'Refreshing…' : 'Refresh'}</button>
          <button onClick={async()=>{ const r = await api('/api/alpaca/orders_cancel_all', { method:'POST' }); setMsg(r.ok ? 'Cancel all sent' : (r.json?.message || r.text || 'Cancel all error')); refresh() }} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700" title="Cancel all open orders">Cancel All</button>
          <button onClick={async()=>{ const r = await api('/api/alpaca/positions_close_all', { method:'POST' }); setMsg(r.ok ? 'Close all sent' : (r.json?.message || r.text || 'Close all error')); refresh() }} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700" title="Close all open positions">Close All</button>
        </div>
      </div>
      {rules ? (
        <div className="mt-2 text-xs text-slate-400">
          <span className="mr-2">Rules:</span>
          <span className="mr-2" title="Require market open">{rules.marketOpenRequired ? 'Open' : 'Open: off'}</span>
          {rules.maxPositions > 0 && <span className="mr-2" title="Max concurrent positions">MaxPos {rules.maxPositions}</span>}
          {rules.maxRiskPct > 0 && <span className="mr-2" title="Per-order risk cap">Risk ≤ {rules.maxRiskPct}%</span>}
          {rules.maxDailyLossPct > 0 && <span className="mr-2" title="Daily loss cap">DailyLoss ≤ {rules.maxDailyLossPct}%</span>}
          {rules.maxExposurePct > 0 && <span className="mr-2" title="Total exposure cap">Exposure ≤ {rules.maxExposurePct}%</span>}
          {rules.minMinutesBetweenOrders > 0 && <span className="mr-2" title="Cooldown between orders">Cooldown {rules.minMinutesBetweenOrders}m</span>}
        </div>
      ) : null}
      {msg && <div className="text-xs text-slate-400 mt-2">{msg}</div>}
      {/* Order Entry */}
      <div className="mt-3 p-2 border border-slate-800 rounded">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400">Symbol</span>
            <input value={sym} onChange={e=>setSym(e.target.value.toUpperCase())} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24" />
          </label>
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400">Side</span>
            <select value={side} onChange={e=>setSide(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400">Qty</span>
            <input type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1, parseInt(e.target.value,10)||1))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24" />
          </label>
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400">Class</span>
            <select value={klass} onChange={e=>setKlass(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
              <option value="market">Market</option>
              <option value="bracket">Bracket</option>
            </select>
          </label>
          {klass === 'bracket' && (
            <>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={useSaty} onChange={e=>setUseSaty(e.target.checked)} /> Use SATY stops <InfoPopover title="SATY Stops">Stop/TP anchor to SATY ATR levels: ±0.236 (triggers), ±1.000 (primary), ±1.618 (extensions). Choose Stop/TP levels, then Calc Qty via Risk %.</InfoPopover>
              </label>
              {!useSaty && (
                <>
                  <label className="inline-flex flex-col">
                    <span className="text-xs text-slate-400">TP %</span>
                    <input type="number" step="0.1" value={tpPct} onChange={e=>setTpPct(parseFloat(e.target.value)||0)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24" />
                  </label>
                  <label className="inline-flex flex-col">
                    <span className="text-xs text-slate-400">SL %</span>
                    <input type="number" step="0.1" value={slPct} onChange={e=>setSlPct(parseFloat(e.target.value)||0)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24" />
                  </label>
                </>
              )}
              {useSaty && (
                <>
                  <label className="inline-flex flex-col">
                    <span className="text-xs text-slate-400">Stop Level</span>
                    <select value={stopLevel} onChange={e=>setStopLevel(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-28">
                      <option value="t0236">±0.236</option>
                      <option value="t1000">±1.000</option>
                      <option value="t1618">±1.618</option>
                    </select>
                  </label>
                  <label className="inline-flex flex-col">
                    <span className="text-xs text-slate-400">TP Level</span>
                    <select value={tpLevel} onChange={e=>setTpLevel(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-28">
                      <option value="t1000">±1.000</option>
                      <option value="t0236">±0.236</option>
                      <option value="t1618">±1.618</option>
                    </select>
                  </label>
                </>
              )}
            </>
          )}
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400">Risk %</span>
            <input type="number" step="0.1" value={riskPct} onChange={e=>setRiskPct(parseFloat(e.target.value)||0)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24" />
          </label>
          <InfoPopover title="Risk Sizing">Calc Qty = (Equity × Risk%) ÷ (Entry − Stop). Adjust Risk % and Stop (SATY or %) to size positions consistently.</InfoPopover>
          <button onClick={calcQtyFromRisk} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">Calc Qty</button>
          <button onClick={async ()=>{
            setMsg('')
            const payload = { symbol: sym, side, qty, type: 'market' }
            if (klass === 'bracket' && lastPrice) {
              const price = Number(lastPrice)
              let tp, sl
              if (useSaty && saty?.levels) {
                const lv = saty.levels
                sl = side === 'buy' ? lv[stopLevel]?.dn : lv[stopLevel]?.up
                tp = side === 'buy' ? lv[tpLevel]?.up : lv[tpLevel]?.dn
                if (sl == null) sl = side === 'buy' ? price * (1 - slPct/100) : price * (1 + slPct/100)
                if (tp == null) tp = side === 'buy' ? price * (1 + tpPct/100) : price * (1 - tpPct/100)
              } else {
                tp = side === 'buy' ? price * (1 + tpPct/100) : price * (1 - tpPct/100)
                sl = side === 'buy' ? price * (1 - slPct/100) : price * (1 + slPct/100)
              }
              payload.orderClass = 'bracket'
              payload.takeProfit = { limit_price: Number(tp.toFixed(2)) }
              payload.stopLoss = { stop_price: Number(sl.toFixed(2)) }
            }
            const r = await api('/api/alpaca/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            if (r.ok) { setMsg('Order sent'); refresh() } else { setMsg(r.json?.error || r.json?.message || r.text || 'Order error') }
          }} className="bg-indigo-600 hover:bg-indigo-500 text-xs rounded px-3 py-1">Place</button>
          {klass === 'bracket' && preview && (
            <div className="text-xs text-slate-400 ml-2">Preview: TP {preview.tp.toFixed(2)} · SL {preview.sl.toFixed(2)}</div>
          )}
        </div>
      </div>
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
