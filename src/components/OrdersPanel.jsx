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
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              Orders & Positions
            </h3>
            <p className="text-xs text-slate-400">Professional order entry and position management</p>
          </div>
          <InfoPopover title="Trading Operations">
            Place orders and manage open orders/positions. Bracket orders set both take‑profit and stop‑loss.
            Use Risk % + Calc Qty for consistent sizing. Guardrails may reject orders (market closed, risk/exposure, cooldown, daily loss cap).
          </InfoPopover>
          <div className="flex items-center gap-2">
            <button onClick={refresh} disabled={loading} className="btn btn-xs">
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              onClick={async()=>{ const r = await api('/api/alpaca/orders_cancel_all', { method:'POST' }); setMsg(r.ok ? 'Cancel all sent' : (r.json?.message || r.text || 'Cancel all error')); refresh() }}
              className="btn btn-xs bg-rose-600 hover:bg-rose-500"
              title="Cancel all open orders"
            >
              Cancel All
            </button>
            <button
              onClick={async()=>{ const r = await api('/api/alpaca/positions_close_all', { method:'POST' }); setMsg(r.ok ? 'Close all sent' : (r.json?.message || r.text || 'Close all error')); refresh() }}
              className="btn btn-xs bg-amber-600 hover:bg-amber-500"
              title="Close all open positions"
            >
              Close All
            </button>
          </div>
        </div>

        {/* Account Stats */}
        {account && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
                <span className="text-lg">💰</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Equity</div>
                <div className="stat-value text-sm text-emerald-400">${parseFloat(account.equity).toFixed(2)}</div>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
                <span className="text-lg">⚡</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Buying Power</div>
                <div className="stat-value text-sm text-indigo-400">${parseFloat(account.buying_power).toFixed(2)}</div>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
                <span className="text-lg">💵</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Cash</div>
                <div className="stat-value text-sm text-cyan-400">${parseFloat(account.cash).toFixed(2)}</div>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-icon bg-gradient-to-br from-violet-500/20 to-violet-600/20">
                <span className="text-lg">📊</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Positions</div>
                <div className="stat-value text-sm text-violet-400">{positions.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Guardrails */}
        {rules && (
          <div className="card p-3 mb-4 bg-slate-800/50">
            <div className="panel-header mb-2">
              <span className="text-xs font-semibold text-slate-300">Trading Guardrails</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${rules.marketOpenRequired ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`} title="Require market open">
                {rules.marketOpenRequired ? '✓' : '○'} Market Open
              </span>
              {rules.maxPositions > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-indigo-500/20 text-indigo-300" title="Max concurrent positions">
                  🎯 Max Positions: {rules.maxPositions}
                </span>
              )}
              {rules.maxRiskPct > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-amber-500/20 text-amber-300" title="Per-order risk cap">
                  ⚠️ Max Risk: {rules.maxRiskPct}%
                </span>
              )}
              {rules.maxDailyLossPct > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-rose-500/20 text-rose-300" title="Daily loss cap">
                  🛑 Daily Loss Cap: {rules.maxDailyLossPct}%
                </span>
              )}
              {rules.maxExposurePct > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-violet-500/20 text-violet-300" title="Total exposure cap">
                  📊 Max Exposure: {rules.maxExposurePct}%
                </span>
              )}
              {rules.minMinutesBetweenOrders > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-cyan-500/20 text-cyan-300" title="Cooldown between orders">
                  ⏱️ Cooldown: {rules.minMinutesBetweenOrders}m
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        {msg && (
          <div className="card p-3 mb-4 bg-indigo-500/10 border-indigo-500/30">
            <p className="text-sm text-indigo-300">{msg}</p>
          </div>
        )}
      </div>
      {/* Order Entry */}
      <div className="card p-4">
        <div className="panel-header mb-3">
          <span className="text-sm font-semibold text-slate-200">Order Entry</span>
          <InfoPopover title="Risk Sizing">
            Calc Qty = (Equity × Risk%) ÷ (Entry − Stop). Adjust Risk % and Stop (SATY or %) to size positions consistently.
          </InfoPopover>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-3">
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400 mb-1">Symbol</span>
            <input value={sym} onChange={e=>setSym(e.target.value.toUpperCase())} className="input" />
          </label>
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400 mb-1">Side</span>
            <select value={side} onChange={e=>setSide(e.target.value)} className="select">
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400 mb-1">Qty</span>
            <input type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1, parseInt(e.target.value,10)||1))} className="input" />
          </label>
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400 mb-1 inline-flex items-center gap-1">
              Class
              <InfoPopover title="Order Class">
                Market sends a single market order. Bracket places an entry with attached take‑profit and stop‑loss.
                Use Bracket with SATY or % to predefine exits.
              </InfoPopover>
            </span>
            <select value={klass} onChange={e=>setKlass(e.target.value)} className="select">
              <option value="market">Market</option>
              <option value="bracket">Bracket</option>
            </select>
          </label>
          <label className="inline-flex flex-col">
            <span className="text-xs text-slate-400 mb-1">Risk %</span>
            <input type="number" step="0.1" value={riskPct} onChange={e=>setRiskPct(parseFloat(e.target.value)||0)} className="input" />
          </label>
          <div className="inline-flex flex-col justify-end">
            <button onClick={calcQtyFromRisk} className="btn btn-sm bg-cyan-600 hover:bg-cyan-500">
              Calc Qty
            </button>
          </div>
        </div>

        {/* Bracket Options */}
        {klass === 'bracket' && (
          <div className="card p-3 mb-3 bg-slate-800/50">
            <label className="inline-flex items-center gap-2 mb-3">
              <input className="checkbox" type="checkbox" checked={useSaty} onChange={e=>setUseSaty(e.target.checked)} />
              <span className="text-sm text-slate-200">Use SATY stops</span>
              <InfoPopover title="SATY Stops">
                Stop/TP anchor to SATY ATR levels: ±0.236 (triggers), ±1.000 (primary), ±1.618 (extensions).
                Choose Stop/TP levels, then Calc Qty via Risk %.
              </InfoPopover>
            </label>

            {!useSaty && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="inline-flex flex-col">
                  <span className="text-xs text-slate-400 mb-1">Take Profit %</span>
                  <input type="number" step="0.1" value={tpPct} onChange={e=>setTpPct(parseFloat(e.target.value)||0)} className="input" />
                </label>
                <label className="inline-flex flex-col">
                  <span className="text-xs text-slate-400 mb-1">Stop Loss %</span>
                  <input type="number" step="0.1" value={slPct} onChange={e=>setSlPct(parseFloat(e.target.value)||0)} className="input" />
                </label>
              </div>
            )}

            {useSaty && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="inline-flex flex-col">
                  <span className="text-xs text-slate-400 mb-1">Stop Level</span>
                  <select value={stopLevel} onChange={e=>setStopLevel(e.target.value)} className="select">
                    <option value="t0236">±0.236</option>
                    <option value="t1000">±1.000</option>
                    <option value="t1618">±1.618</option>
                  </select>
                </label>
                <label className="inline-flex flex-col">
                  <span className="text-xs text-slate-400 mb-1">TP Level</span>
                  <select value={tpLevel} onChange={e=>setTpLevel(e.target.value)} className="select">
                    <option value="t1000">±1.000</option>
                    <option value="t0236">±0.236</option>
                    <option value="t1618">±1.618</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Preview Card */}
        {klass === 'bracket' && preview && (
          <div className="card p-3 mb-3 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/30">
            <div className="panel-header mb-2">
              <span className="text-xs font-semibold text-violet-300">Order Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Take Profit:</span>
                <span className="text-emerald-400 font-mono font-semibold">${preview.tp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Stop Loss:</span>
                <span className="text-rose-400 font-mono font-semibold">${preview.sl.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Place Order Button */}
        <button
          onClick={async ()=>{
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
          }}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-lg px-4 py-2.5 transition-all duration-200"
        >
          Place Order
        </button>
      </div>
      {/* Orders & Positions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Open Orders */}
        <div className="card p-4">
          <div className="panel-header mb-3">
            <span className="text-sm font-semibold text-slate-200">Open Orders</span>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold">
              {orders.length}
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {orders.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No open orders
              </div>
            )}
            {orders.map(o => (
              <div key={o.id} className="tile p-3 hover:scale-[1.01] transition-transform duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-100 font-semibold">{o.symbol}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        o.side === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {o.side.toUpperCase()}
                      </span>
                      <span className="text-slate-400 text-sm">× {o.qty}</span>
                      <span className="text-slate-500 text-xs">{o.type}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      ID: {o.id.substring(0, 8)}... · Status: <span className="text-slate-400">{o.status}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelOrder(o.id)}
                    className="btn btn-xs bg-rose-600 hover:bg-rose-500 ml-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Positions */}
        <div className="card p-4">
          <div className="panel-header mb-3">
            <span className="text-sm font-semibold text-slate-200">Positions</span>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-semibold">
              {positions.length}
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {positions.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No open positions
              </div>
            )}
            {positions.map(p => {
              const unrealizedPL = Number(p.unrealized_pl)
              const unrealizedPct = Number(p.unrealized_plpc * 100)
              const isProfitable = unrealizedPL > 0
              return (
                <div
                  key={p.symbol}
                  className={`tile p-3 hover:scale-[1.01] transition-transform duration-200 ${
                    isProfitable
                      ? 'bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border-emerald-500/20'
                      : 'bg-gradient-to-br from-rose-500/5 to-rose-600/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-100 font-semibold">{p.symbol}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          p.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {p.side.toUpperCase()}
                        </span>
                        <span className="text-slate-400 text-sm">× {p.qty}</span>
                        <span className="text-slate-500 text-xs">@ ${Number(p.avg_entry_price).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={isProfitable ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                          {isProfitable ? '+' : ''}{unrealizedPL.toFixed(2)}
                        </span>
                        <span className={`font-semibold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({unrealizedPct > 0 ? '+' : ''}{unrealizedPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => closePosition(p.symbol)}
                      className="btn btn-xs bg-amber-600 hover:bg-amber-500 ml-2"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
