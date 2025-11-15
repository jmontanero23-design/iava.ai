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

  // Listen for AI trade setup events
  useEffect(() => {
    const handleAITradeSetup = (event) => {
      const setup = event.detail
      console.log('[TradePanel] Received AI trade setup:', setup)

      // Auto-populate form fields
      if (setup.side) {
        setSide(setup.side)
      }
      if (setup.stopLoss) {
        setStop(setup.stopLoss)
      }
      if (setup.target) {
        setTp(setup.target)
      }

      // Visual feedback
      const panel = document.querySelector('.trade-panel-container')
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' })
        panel.classList.add('ai-setup-highlight')
        setTimeout(() => panel.classList.remove('ai-setup-highlight'), 2000)
      }
    }

    window.addEventListener('ai-trade-setup', handleAITradeSetup)
    return () => window.removeEventListener('ai-trade-setup', handleAITradeSetup)
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
    <div className="card overflow-hidden trade-panel-container">
      {/* Premium Header */}
      <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon with glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-600 blur-lg opacity-50 animate-pulse" />
                <span className="relative text-2xl filter drop-shadow-lg">💼</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-300 bg-clip-text text-transparent inline-flex items-center gap-2">
                Place Bracket Order (Paper)
                <InfoPopover title="Risk & Brackets">
                  Size: (risk% × equity) / (entry−stop). Bracket orders place take‑profit and stop‑loss together. Tune % and levels before sending.
                </InfoPopover>
              </h3>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-all"
            >
              ✕ Close
            </button>
          </div>

          {/* Market Status Bar */}
          <div className="mt-3 flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Market:</span>
              {clock?.is_open ? (
                <span className="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold">● Open</span>
              ) : (
                <span className="px-2 py-1 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold">● Closed</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Last:</span>
              <span className="text-slate-200 font-semibold">${last?.close?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Equity:</span>
              <span className="text-slate-200 font-semibold">${equity.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Content */}
      <div className="p-5 space-y-4">
        {/* Order Configuration Section */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⚙️</span>
            <div className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">Order Configuration</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400 font-medium mb-1.5 block">Side</span>
              <select
                value={side}
                onChange={e => setSide(e.target.value)}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              >
                <option value="buy">Buy (Long)</option>
                <option value="sell">Sell (Short)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 font-medium mb-1.5 block">Risk %</span>
              <input
                type="number"
                value={riskPct}
                onChange={e => setRiskPct(Number(e.target.value))}
                min={0.1}
                max={5}
                step={0.1}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 font-medium mb-1.5 block">Quantity</span>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                min={1}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 font-medium mb-1.5 block">Stop Loss</span>
              <input
                type="number"
                value={stop ?? ''}
                onChange={e => setStop(Number(e.target.value))}
                onBlur={e => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && isFinite(val)) {
                    setStop(Math.round(val * 100) / 100)
                  }
                }}
                step={0.01}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
              />
            </label>
            {!usePartials && (
              <label className="block">
                <span className="text-xs text-slate-400 font-medium mb-1.5 block">Take Profit</span>
                <input
                  type="number"
                  value={tp ?? ''}
                  onChange={e => setTp(Number(e.target.value))}
                  onBlur={e => {
                    const val = parseFloat(e.target.value)
                    if (!isNaN(val) && isFinite(val)) {
                      setTp(Math.round(val * 100) / 100)
                    }
                  }}
                  step={0.01}
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </label>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/30">
            <label className="inline-flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={usePartials}
                onChange={e => setUsePartials(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                aria-label="Use partial exits strategy"
              />
              <span className="text-sm text-slate-300 group-hover:text-emerald-300 transition-colors">
                Use Partial Exits (50% at 1R, 25% at 2R, 25% at 3R)
              </span>
            </label>
          </div>
        </div>

        {/* Premium Partial Exit Plan */}
        {usePartials && partialPlan && (
          <div className="p-4 bg-slate-800/30 rounded-xl border border-teal-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <div className="text-xs uppercase tracking-wider text-teal-300 font-semibold">Partial Exit Plan</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1R Exit */}
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                <div className="relative p-3 bg-slate-800/50 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                  <div className="text-sm font-bold text-emerald-300 mb-2">50% at 1R</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qty:</span>
                      <span className="text-slate-200 font-semibold">{partialPlan.qty1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TP:</span>
                      <span className="text-emerald-300 font-semibold">${partialPlan.tp1.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2R Exit */}
              <div className="relative group">
                <div className="absolute inset-0 bg-teal-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                <div className="relative p-3 bg-slate-800/50 rounded-lg border border-teal-500/30 hover:border-teal-500/50 transition-all">
                  <div className="text-sm font-bold text-teal-300 mb-2">25% at 2R</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qty:</span>
                      <span className="text-slate-200 font-semibold">{partialPlan.qty2}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TP:</span>
                      <span className="text-teal-300 font-semibold">${partialPlan.tp2.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3R Exit */}
              <div className="relative group">
                <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                <div className="relative p-3 bg-slate-800/50 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
                  <div className="text-sm font-bold text-cyan-300 mb-2">25% at 3R</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qty:</span>
                      <span className="text-slate-200 font-semibold">{partialPlan.qty3}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TP:</span>
                      <span className="text-cyan-300 font-semibold">${partialPlan.tp3.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Risk per share: <span className="text-slate-300 font-semibold">${partialPlan.risk.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Action Section */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={submit}
            disabled={submitting || !qty || !stop || (!usePartials && !tp)}
            className="relative group px-6 py-2.5 rounded-lg text-sm font-bold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all group-disabled:from-slate-700 group-disabled:to-slate-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity group-disabled:opacity-0" />
            <span className="relative text-white flex items-center gap-2">
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Placing…
                </>
              ) : (
                <>
                  <span>📈</span>
                  {usePartials ? 'Place 3 Orders' : 'Place Order'}
                </>
              )}
            </span>
          </button>

          {/* Result Feedback */}
          {result?.ok && !result.partials && (
            <div className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <span className="text-sm text-emerald-300 font-semibold">
                ✓ Order placed: {result.order?.id}
              </span>
            </div>
          )}
          {result?.ok && result.partials && (
            <div className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <span className="text-sm text-emerald-300 font-semibold">
                ✓ {result.orders?.length || 0} orders placed
              </span>
            </div>
          )}
          {result && !result.ok && (
            <div className="px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30">
              <span className="text-sm text-rose-300 font-semibold">
                ⚠ {result.error}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
