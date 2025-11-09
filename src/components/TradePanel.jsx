import React, { useEffect, useMemo, useState } from 'react'
import { placeOrder, getClock } from '../services/orders.js'

export default function TradePanel({ bars = [], saty, account, defaultSide = 'buy', onClose }) {
  const last = bars[bars.length - 1]
  const [side, setSide] = useState(defaultSide)
  const [riskPct, setRiskPct] = useState(1)
  const [qty, setQty] = useState(0)
  const [stop, setStop] = useState(null)
  const [tp, setTp] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [clock, setClock] = useState(null)

  useEffect(() => {
    getClock().then(setClock).catch(() => {})
  }, [])

  const equity = Number(account?.equity || account?.portfolio_value || 0)

  const rec = useMemo(() => {
    if (!saty?.levels || !last) return {}
    const price = last.close
    if (side === 'buy') {
      const s = saty.levels.t0236?.dn ?? (price - (saty.atr || 1) * 0.5)
      const t = saty.levels.t1000?.up ?? (price + (saty.atr || 1))
      return { stop: s, tp: t }
    } else {
      const s = saty.levels.t0236?.up ?? (price + (saty.atr || 1) * 0.5)
      const t = saty.levels.t1000?.dn ?? (price - (saty.atr || 1))
      return { stop: s, tp: t }
    }
  }, [saty, last, side])

  useEffect(() => {
    if (!last) return
    const price = last.close
    const s = typeof stop === 'number' ? stop : rec.stop
    const riskUsd = equity * (riskPct / 100)
    if (!s || !riskUsd) return
    const dist = Math.max(0.01, Math.abs(price - s))
    const q = Math.floor(riskUsd / dist)
    setQty(q > 0 ? q : 1)
  }, [stop, rec.stop, riskPct, equity, last])

  useEffect(() => { if (rec.stop != null && stop == null) setStop(Number(rec.stop)) }, [rec.stop])
  useEffect(() => { if (rec.tp != null && tp == null) setTp(Number(rec.tp)) }, [rec.tp])

  async function submit() {
    try {
      setSubmitting(true)
      setResult(null)
      const order = await placeOrder({
        symbol: last?.symbol || '',
        side,
        qty,
        type: 'market',
        timeInForce: 'day',
        orderClass: 'bracket',
        takeProfit: { limit_price: Number(tp) },
        stopLoss: { stop_price: Number(stop) },
        entry: Number(last?.close),
      })
      setResult({ ok: true, order })
    } catch (e) {
      setResult({ ok: false, error: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-200">Place Bracket Order (Paper)</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm">Close</button>
      </div>
      <div className="text-xs text-slate-400 mb-2">Market: {clock?.is_open ? <span className="text-emerald-400">Open</span> : <span className="text-amber-400">Closed</span>} · Last: <span className="text-slate-200">{last?.close?.toFixed(2)}</span> · Equity: <span className="text-slate-200">{equity}</span></div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="flex items-center gap-2">Side
          <select value={side} onChange={e => setSide(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Risk %
          <input type="number" value={riskPct} onChange={e => setRiskPct(Number(e.target.value))} min={0.1} max={5} step={0.1} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24" />
        </label>
        <label className="flex items-center gap-2">Qty
          <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} min={1} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24" />
        </label>
        <label className="flex items-center gap-2">Stop
          <input type="number" value={stop ?? ''} onChange={e => setStop(Number(e.target.value))} step={0.01} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-32" />
        </label>
        <label className="flex items-center gap-2">Take Profit
          <input type="number" value={tp ?? ''} onChange={e => setTp(Number(e.target.value))} step={0.01} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-32" />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={submit} disabled={submitting || !qty || !stop || !tp} className="bg-emerald-600 hover:bg-emerald-500 rounded px-3 py-1 text-sm disabled:opacity-50">{submitting ? 'Placing…' : 'Place Order'}</button>
        {result?.ok && <span className="text-emerald-400 text-sm">Order placed: {result.order?.id}</span>}
        {result && !result.ok && <span className="text-rose-400 text-sm">{result.error}</span>}
      </div>
    </div>
  )
}
