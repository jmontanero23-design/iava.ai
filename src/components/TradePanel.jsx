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
    if (!last) return {}
    const price = last.close
    const atr = saty?.atr || price * 0.02 // Fallback: 2% of price if no ATR

    // Calculate sensible stop/TP based on ATR
    if (side === 'buy') {
      // For buy: stop below, TP above
      let s = saty?.levels?.t0236?.dn
      let t = saty?.levels?.t1000?.up

      // Validate stop is reasonable (within 10% of price, below entry)
      if (!s || s >= price || s < price * 0.9) {
        s = price - atr * 1.5 // 1.5 ATR below entry
      }

      // Validate TP is reasonable (above entry, within 20% of price)
      if (!t || t <= price || t > price * 1.2) {
        t = price + atr * 3 // 3 ATR above entry (2:1 R/R)
      }

      return { stop: s, tp: t }
    } else {
      // For sell: stop above, TP below
      let s = saty?.levels?.t0236?.up
      let t = saty?.levels?.t1000?.dn

      // Validate stop is reasonable (within 10% of price, above entry)
      if (!s || s <= price || s > price * 1.1) {
        s = price + atr * 1.5 // 1.5 ATR above entry
      }

      // Validate TP is reasonable (below entry, within 20% of price)
      if (!t || t >= price || t < price * 0.8) {
        t = price - atr * 3 // 3 ATR below entry (2:1 R/R)
      }

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
      <div className="panel-header panel-header-success">
        <div className="absolute inset-0 opacity-15 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 blur-2xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Icon with glow */}
              <span className="panel-icon" style={{ fontSize: 'var(--text-2xl)' }}>💼</span>
              <h3 className="font-bold bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-300 bg-clip-text text-transparent inline-flex items-center gap-2" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
                Place Bracket Order (Paper)
                <InfoPopover title="Risk & Brackets">
                  Size: (risk% × equity) / (entry−stop). Bracket orders place take‑profit and stop‑loss together. Tune % and levels before sending.
                </InfoPopover>
              </h3>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost btn-sm"
            >
              ✕ Close
            </button>
          </div>

          {/* Market Status Bar */}
          <div className="mt-4 flex items-center gap-4 flex-wrap" style={{ fontSize: 'var(--text-xs)' }}>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Market:</span>
              {clock?.is_open ? (
                <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" style={{ borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-semibold)' }}>● Open</span>
              ) : (
                <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300" style={{ borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-semibold)' }}>● Closed</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Last:</span>
              <span className="text-slate-200" style={{ fontWeight: 'var(--font-semibold)' }}>${last?.close?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Equity:</span>
              <span className="text-slate-200" style={{ fontWeight: 'var(--font-semibold)' }}>${equity.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Content */}
      <div className="p-6 space-y-4">
        {/* Order Configuration Section */}
        <div className="p-4 bg-slate-800/30 border border-emerald-500/20" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 'var(--text-base)' }}>⚙️</span>
            <div className="uppercase tracking-wider text-emerald-300" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>Order Configuration</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-slate-400 mb-2 block" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>Side</span>
              <select
                value={side}
                onChange={e => setSide(e.target.value)}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                style={{ transition: 'var(--transition-base)' }}
              >
                <option value="buy">Buy (Long)</option>
                <option value="sell">Sell (Short)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-400 mb-2 block" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>Risk %</span>
              <input
                type="number"
                value={riskPct}
                onChange={e => setRiskPct(Number(e.target.value))}
                min={0.1}
                max={5}
                step={0.1}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                style={{ transition: 'var(--transition-base)' }}
              />
            </label>
            <label className="block">
              <span className="text-slate-400 mb-2 block" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>Quantity</span>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                min={1}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                style={{ transition: 'var(--transition-base)' }}
              />
            </label>
            <label className="block">
              <span className="text-slate-400 mb-2 block" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>Stop Loss</span>
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
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30"
                style={{ transition: 'var(--transition-base)' }}
              />
            </label>
            {!usePartials && (
              <label className="block">
                <span className="text-slate-400 mb-2 block" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>Take Profit</span>
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
                  className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                  style={{ transition: 'var(--transition-base)' }}
                />
              </label>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/30">
            <label className="inline-flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={usePartials}
                onChange={e => setUsePartials(e.target.checked)}
                className="checkbox"
                aria-label="Use partial exits strategy"
              />
              <span className="text-slate-300 group-hover:text-emerald-300" style={{ fontSize: 'var(--text-sm)', transition: 'var(--transition-base)' }}>
                Use Partial Exits (50% at 1R, 25% at 2R, 25% at 3R)
              </span>
            </label>
          </div>
        </div>

        {/* Premium Partial Exit Plan */}
        {usePartials && partialPlan && (
          <div className="p-4 bg-slate-800/30 border border-teal-500/20" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 'var(--text-base)' }}>🎯</span>
              <div className="uppercase tracking-wider text-teal-300" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>Partial Exit Plan</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1R Exit */}
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-0 group-hover:opacity-10 transition-opacity" style={{ borderRadius: 'var(--radius-lg)' }} />
                <div className="relative p-3 bg-slate-800/50 border border-emerald-500/30 hover:border-emerald-500/50" style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)' }}>
                  <div className="text-emerald-300 mb-2" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>50% at 1R</div>
                  <div className="space-y-1" style={{ fontSize: 'var(--text-xs)' }}>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qty:</span>
                      <span className="text-slate-200" style={{ fontWeight: 'var(--font-semibold)' }}>{partialPlan.qty1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TP:</span>
                      <span className="text-emerald-300" style={{ fontWeight: 'var(--font-semibold)' }}>${partialPlan.tp1.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2R Exit */}
              <div className="relative group">
                <div className="absolute inset-0 bg-teal-600 blur-xl opacity-0 group-hover:opacity-10 transition-opacity" style={{ borderRadius: 'var(--radius-lg)' }} />
                <div className="relative p-3 bg-slate-800/50 border border-teal-500/30 hover:border-teal-500/50" style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)' }}>
                  <div className="text-teal-300 mb-2" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>25% at 2R</div>
                  <div className="space-y-1" style={{ fontSize: 'var(--text-xs)' }}>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qty:</span>
                      <span className="text-slate-200" style={{ fontWeight: 'var(--font-semibold)' }}>{partialPlan.qty2}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TP:</span>
                      <span className="text-teal-300" style={{ fontWeight: 'var(--font-semibold)' }}>${partialPlan.tp2.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3R Exit */}
              <div className="relative group">
                <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-0 group-hover:opacity-10 transition-opacity" style={{ borderRadius: 'var(--radius-lg)' }} />
                <div className="relative p-3 bg-slate-800/50 border border-cyan-500/30 hover:border-cyan-500/50" style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)' }}>
                  <div className="text-cyan-300 mb-2" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>25% at 3R</div>
                  <div className="space-y-1" style={{ fontSize: 'var(--text-xs)' }}>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qty:</span>
                      <span className="text-slate-200" style={{ fontWeight: 'var(--font-semibold)' }}>{partialPlan.qty3}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TP:</span>
                      <span className="text-cyan-300" style={{ fontWeight: 'var(--font-semibold)' }}>${partialPlan.tp3.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-slate-400" style={{ fontSize: 'var(--text-xs)' }}>
              Risk per share: <span className="text-slate-300" style={{ fontWeight: 'var(--font-semibold)' }}>${partialPlan.risk.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Action Section */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={submit}
            disabled={submitting || !qty || !stop || (!usePartials && !tp)}
            className="btn-success"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="spinner-sm" />
                <span>Placing…</span>
              </div>
            ) : (
              <>
                <span>📈</span>
                {usePartials ? 'Place 3 Orders' : 'Place Order'}
              </>
            )}
          </button>

          {/* Result Feedback */}
          {result?.ok && !result.partials && (
            <div className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/30" style={{ borderRadius: 'var(--radius-lg)' }}>
              <span className="text-emerald-300" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                ✓ Order placed: {result.order?.id}
              </span>
            </div>
          )}
          {result?.ok && result.partials && (
            <div className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/30" style={{ borderRadius: 'var(--radius-lg)' }}>
              <span className="text-emerald-300" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                ✓ {result.orders?.length || 0} orders placed
              </span>
            </div>
          )}
          {result && !result.ok && (
            <div className="px-3 py-2 bg-rose-500/20 border border-rose-500/30" style={{ borderRadius: 'var(--radius-lg)' }}>
              <span className="text-rose-300" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                ⚠ {result.error}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
