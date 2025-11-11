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

  useEffect(() => { if (rec.stop != null && stop == null) setStop(Number(rec.stop)) }, [rec.stop, stop])
  useEffect(() => { if (rec.tp != null && tp == null) setTp(Number(rec.tp)) }, [rec.tp, tp])

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
    <div className="space-y-4 animate-fadeIn">
      {/* Header Card */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="logo-badge">
            <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              Trade Execution
            </h3>
            <p className="text-xs text-slate-400">Place bracket orders with partial exits (Paper Trading)</p>
          </div>
          <InfoPopover title="Risk & Brackets">
            Size: (risk% × equity) / (entry−stop).
            <br/><br/>
            Bracket orders place take‑profit and stop‑loss together.
            Tune % and levels before sending.
          </InfoPopover>
          <button onClick={onClose} className="btn btn-xs">Close</button>
        </div>

        {/* Market Status */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="stat-tile">
            <div className="stat-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
              <span className="text-sm">{clock?.is_open ? '🟢' : '🔴'}</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400">Market</div>
              <div className={`text-sm font-semibold ${clock?.is_open ? 'text-emerald-400' : 'text-amber-400'}`}>
                {clock?.is_open ? 'Open' : 'Closed'}
              </div>
            </div>
          </div>

          <div className="stat-tile">
            <div className="stat-icon bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
              <span className="text-sm">💵</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400">Last Price</div>
              <div className="text-sm font-mono font-semibold text-slate-200">
                ${last?.close?.toFixed(2) || '—'}
              </div>
            </div>
          </div>

          <div className="stat-tile">
            <div className="stat-icon bg-gradient-to-br from-violet-500/20 to-violet-600/20">
              <span className="text-sm">💰</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400">Equity</div>
              <div className="text-sm font-mono font-semibold text-slate-200">
                ${equity.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* AI Risk Advisor (AI Feature #4) */}
        {last && stop && (
          <div className="mb-4 p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🛡️</span>
              <div>
                <div className="text-sm font-bold text-amber-300">AI Risk Advisor</div>
                <div className="text-xs text-slate-400">Position sizing recommendation</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Per Trade:</span>
                <span className="text-amber-300 font-semibold">{riskPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Amount:</span>
                <span className="text-amber-300 font-semibold">${(equity * (riskPct / 100)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance to Stop:</span>
                <span className="text-amber-300 font-semibold">${Math.abs(last.close - stop).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recommended Qty:</span>
                <span className="text-amber-300 font-semibold">{qty} shares</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-300 bg-slate-800/50 rounded p-2">
              💡 <strong>Smart sizing:</strong> Risk {riskPct}% of ${equity.toFixed(0)} = $
              {(equity * (riskPct / 100)).toFixed(2)}. With ${Math.abs(last.close - stop).toFixed(2)} stop distance,
              buy {qty} shares to risk exactly {riskPct}%.
            </div>
          </div>
        )}

        {/* Order Configuration */}
        <div className="panel-header mb-3">
          <span className="text-xs font-semibold text-slate-300">Order Configuration</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Side</label>
            <select value={side} onChange={e => setSide(e.target.value)} className="select w-full">
              <option value="buy">Buy (Long)</option>
              <option value="sell">Sell (Short)</option>
            </select>
          </div>

          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Risk %</label>
            <input
              type="number"
              value={riskPct}
              onChange={e => setRiskPct(Number(e.target.value))}
              min={0.1}
              max={5}
              step={0.1}
              className="input w-full"
            />
          </div>

          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Quantity</label>
            <input
              type="number"
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              min={1}
              className="input w-full"
            />
          </div>

          <div className="section">
            <label className="block text-xs text-slate-400 mb-1">Stop Loss</label>
            <input
              type="number"
              value={stop ?? ''}
              onChange={e => setStop(Number(e.target.value))}
              step={0.01}
              className="input w-full"
              placeholder="Stop price"
            />
          </div>

          {!usePartials && (
            <div className="section col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Take Profit</label>
              <input
                type="number"
                value={tp ?? ''}
                onChange={e => setTp(Number(e.target.value))}
                step={0.01}
                className="input w-full"
                placeholder="Target price"
              />
            </div>
          )}
        </div>

        {/* Partial Exits Toggle */}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={usePartials}
            onChange={e => setUsePartials(e.target.checked)}
            className="checkbox accent-emerald-500"
          />
          <span className="text-sm text-slate-300">Use Partial Exits (50% at 1R, 25% at 2R, 25% at 3R)</span>
          <InfoPopover title="Partial Exits">
            Blueprint strategy: Scale out of positions at multiple profit levels.
            <br/><br/>
            <strong>Plan:</strong>
            <br/>• 50% at 1R (1× risk)
            <br/>• 25% at 2R (2× risk)
            <br/>• 25% at 3R (3× risk)
            <br/><br/>
            Locks in profits while allowing runners.
          </InfoPopover>
        </label>
      </div>

      {/* Stunning Partial Exit Visualization */}
      {usePartials && partialPlan && (
        <div className="card p-4">
          <div className="panel-header mb-3">
            <span className="text-xs font-semibold text-slate-300">Partial Exit Plan</span>
            <span className="text-xs text-slate-500 ml-2">(Risk per share: ${partialPlan.risk.toFixed(2)})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Exit 1: 50% at 1R */}
            <div className="tile p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="stat-icon bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 scale-90">
                  <span className="text-lg">1️⃣</span>
                </div>
                <div>
                  <div className="text-emerald-400 font-bold text-sm">50% at 1R</div>
                  <div className="text-xs text-slate-400">First Exit</div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="text-slate-200 font-mono font-semibold">{partialPlan.qty1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target:</span>
                  <span className="text-emerald-400 font-mono font-semibold">${partialPlan.tp1.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">R Multiple:</span>
                  <span className="text-emerald-400 font-semibold">1.0R</span>
                </div>
              </div>
            </div>

            {/* Exit 2: 25% at 2R */}
            <div className="tile p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="stat-icon bg-gradient-to-br from-cyan-500/30 to-cyan-600/30 scale-90">
                  <span className="text-lg">2️⃣</span>
                </div>
                <div>
                  <div className="text-cyan-400 font-bold text-sm">25% at 2R</div>
                  <div className="text-xs text-slate-400">Second Exit</div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="text-slate-200 font-mono font-semibold">{partialPlan.qty2}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target:</span>
                  <span className="text-cyan-400 font-mono font-semibold">${partialPlan.tp2.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">R Multiple:</span>
                  <span className="text-cyan-400 font-semibold">2.0R</span>
                </div>
              </div>
            </div>

            {/* Exit 3: 25% at 3R */}
            <div className="tile p-4 bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="stat-icon bg-gradient-to-br from-violet-500/30 to-violet-600/30 scale-90">
                  <span className="text-lg">3️⃣</span>
                </div>
                <div>
                  <div className="text-violet-400 font-bold text-sm">25% at 3R</div>
                  <div className="text-xs text-slate-400">Runner Exit</div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="text-slate-200 font-mono font-semibold">{partialPlan.qty3}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target:</span>
                  <span className="text-violet-400 font-mono font-semibold">${partialPlan.tp3.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">R Multiple:</span>
                  <span className="text-violet-400 font-semibold">3.0R</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons & Results */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={submit}
            disabled={submitting || !qty || !stop || (!usePartials && !tp)}
            className="btn btn-success px-4 py-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Placing…
              </span>
            ) : (usePartials ? 'Place 3 Orders' : 'Place Order')}
          </button>

          {result?.ok && !result.partials && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span>✓</span>
              <span>Order placed: {result.order?.id}</span>
            </div>
          )}

          {result?.ok && result.partials && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span>✓</span>
              <span>{result.orders?.length || 0} orders placed successfully</span>
            </div>
          )}

          {result && !result.ok && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex-1">
              <p className="text-sm text-rose-400">{result.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
