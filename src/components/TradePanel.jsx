import React, { useEffect, useMemo, useState } from 'react'
import InfoPopover from './InfoPopover.jsx'
import { placeOrder, getClock } from '../services/orders.js'
import { logOrder } from '../utils/tradeLogger.js'

export default function TradePanel({ bars = [], saty, account, defaultSide = 'buy', defaultRiskPct = 1, onClose }) {
  const last = bars[bars.length - 1]
  const [side, setSide] = useState(defaultSide)
  const [riskPct, setRiskPct] = useState(defaultRiskPct || 1)
  const [qty, setQty] = useState(0)
  const [stop, setStop] = useState(null)
  const [tp, setTp] = useState(null)
  const [usePartials, setUsePartials] = useState(false)
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

  // Calculate partial exit levels (Blueprint: 50% at 1R, 25% at 2R, 25% at 3R)
  const partialPlan = useMemo(() => {
    if (!last || !stop || !qty) return null
    const entry = last.close
    const risk = Math.abs(entry - stop)  // Distance to stop
    const isBuy = side === 'buy'

    const tp1 = isBuy ? entry + risk * 1 : entry - risk * 1  // 1R
    const tp2 = isBuy ? entry + risk * 2 : entry - risk * 2  // 2R
    const tp3 = isBuy ? entry + risk * 3 : entry - risk * 3  // 3R (or use extension level)

    const qty1 = Math.floor(qty * 0.5)  // 50%
    const qty2 = Math.floor(qty * 0.25)  // 25%
    const qty3 = qty - qty1 - qty2  // Remaining

    return { tp1, tp2, tp3, qty1, qty2, qty3, risk }
  }, [last, stop, qty, side])

  async function submit() {
    try {
      setSubmitting(true)
      setResult(null)

      if (usePartials && partialPlan) {
        // Place 3 separate bracket orders for partial exits
        // Leg 1: 50% at 1R
        // Leg 2: 25% at 2R
        // Leg 3: 25% at 3R
        const orders = []
        const legs = [
          { qty: partialPlan.qty1, tp: partialPlan.tp1, label: '50% at 1R' },
          { qty: partialPlan.qty2, tp: partialPlan.tp2, label: '25% at 2R' },
          { qty: partialPlan.qty3, tp: partialPlan.tp3, label: '25% at 3R' },
        ]

        for (const leg of legs) {
          if (leg.qty <= 0) continue
          const order = await placeOrder({
            symbol: last?.symbol || '',
            side,
            qty: leg.qty,
            type: 'market',
            timeInForce: 'day',
            orderClass: 'bracket',
            takeProfit: { limit_price: Number(leg.tp) },
            stopLoss: { stop_price: Number(stop) },
            entry: Number(last?.close),
          })
          orders.push({ ...order, label: leg.label })

          // Log each leg
          logOrder({
            symbol: last?.symbol || '',
            side: side.toUpperCase(),
            qty: leg.qty,
            entry: Number(last?.close),
            sl: Number(stop),
            tp: Number(leg.tp),
            orderType: 'market',
            timeInForce: 'day',
            orderId: order?.id,
            notes: `Partial exit: ${leg.label} (Paper Trading)`,
          }).catch(err => console.error('Failed to log order:', err))
        }

        setResult({ ok: true, orders, partials: true })
      } else {
        // Single bracket order
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

        // Log the order
        logOrder({
          symbol: last?.symbol || '',
          side: side.toUpperCase(),
          qty,
          entry: Number(last?.close),
          sl: Number(stop),
          tp: Number(tp),
          orderType: 'market',
          timeInForce: 'day',
          orderId: order?.id,
          notes: `Bracket order placed via TradePanel (Paper Trading)`,
        }).catch(err => console.error('Failed to log order:', err))
      }
    } catch (e) {
      setResult({ ok: false, error: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Place Bracket Order (Paper) <InfoPopover title="Risk & Brackets">Size: (risk% × equity) / (entry−stop). Bracket orders place take‑profit and stop‑loss together. Tune % and levels before sending.</InfoPopover></h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm">Close</button>
      </div>
      <div className="text-xs text-slate-400 mb-2">Market: {clock?.is_open ? <span className="text-emerald-400">Open</span> : <span className="text-amber-400">Closed</span>} · Last: <span className="text-slate-200">{last?.close?.toFixed(2)}</span> · Equity: <span className="text-slate-200">{equity}</span></div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="flex items-center gap-2">Side
          <select value={side} onChange={e => setSide(e.target.value)} className="select">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>
        <label className="flex items-center gap-2">Risk %
          <input type="number" value={riskPct} onChange={e => setRiskPct(Number(e.target.value))} min={0.1} max={5} step={0.1} className="input w-24" />
        </label>
        <label className="flex items-center gap-2">Qty
          <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} min={1} className="input w-24" />
        </label>
        <label className="flex items-center gap-2">Stop
          <input type="number" value={stop ?? ''} onChange={e => setStop(Number(e.target.value))} step={0.01} className="input w-32" />
        </label>
        {!usePartials && (
          <label className="flex items-center gap-2">Take Profit
            <input type="number" value={tp ?? ''} onChange={e => setTp(Number(e.target.value))} step={0.01} className="input w-32" />
          </label>
        )}
        <label className="flex items-center gap-2 col-span-2">
          <input type="checkbox" checked={usePartials} onChange={e => setUsePartials(e.target.checked)} className="rounded" />
          <span className="text-xs text-slate-300">Use Partial Exits (50% at 1R, 25% at 2R, 25% at 3R)</span>
        </label>
      </div>

      {/* Show partial exit plan */}
      {usePartials && partialPlan && (
        <div className="mt-3 bg-slate-800/50 rounded p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2">Partial Exit Plan:</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-700/50 rounded p-2">
              <div className="text-emerald-400 font-semibold">50% at 1R</div>
              <div className="text-slate-300">Qty: {partialPlan.qty1}</div>
              <div className="text-slate-300">TP: ${partialPlan.tp1.toFixed(2)}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-2">
              <div className="text-emerald-400 font-semibold">25% at 2R</div>
              <div className="text-slate-300">Qty: {partialPlan.qty2}</div>
              <div className="text-slate-300">TP: ${partialPlan.tp2.toFixed(2)}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-2">
              <div className="text-emerald-400 font-semibold">25% at 3R</div>
              <div className="text-slate-300">Qty: {partialPlan.qty3}</div>
              <div className="text-slate-300">TP: ${partialPlan.tp3.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">Risk per share: ${partialPlan.risk.toFixed(2)}</div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button onClick={submit} disabled={submitting || !qty || !stop || (!usePartials && !tp)} className="bg-emerald-600 hover:bg-emerald-500 rounded px-3 py-1 text-sm disabled:opacity-50">{submitting ? 'Placing…' : (usePartials ? 'Place 3 Orders' : 'Place Order')}</button>
        {result?.ok && !result.partials && <span className="text-emerald-400 text-sm">Order placed: {result.order?.id}</span>}
        {result?.ok && result.partials && <span className="text-emerald-400 text-sm">{result.orders?.length || 0} orders placed</span>}
        {result && !result.ok && <span className="text-rose-400 text-sm">{result.error}</span>}
      </div>
    </div>
  )
}
