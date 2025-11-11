import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function CommandPalette({
  isOpen: externalOpen,
  onClose,
  symbol,
  setSymbol,
  loadBars,
  timeframe,
  setTimeframe,
  overlayState = {},
  overlayToggles = {},
  applyPreset,
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      const meta = e.ctrlKey || e.metaKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        setTimeout(() => inputRef.current?.focus(), 10)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { if (externalOpen != null) setOpen(!!externalOpen) }, [externalOpen])
  useEffect(() => { if (!open) { setQ(''); onClose?.() } }, [open, onClose])

  const actions = useMemo(() => {
    const items = []
    // Timeframes
    ;['1Min','5Min','15Min','1Hour','1Day'].forEach(tf => items.push({
      id: `tf:${tf}`, group: 'Timeframe', label: `Set timeframe ${tf}`, run: () => setTimeframe?.(tf)
    }))
    // Overlays
    const t = overlayToggles || {}
    const st = overlayState || {}
    const toggle = (k, label) => ({ id: `ov:${k}`, group: 'Overlays', label: `${st[k] ? 'Hide' : 'Show'} ${label}`, run: () => t[k]?.() })
    items.push(toggle('ema821','EMA 8/21'))
    items.push(toggle('ema512','EMA 5/12'))
    items.push(toggle('ema89','EMA 8/9'))
    items.push(toggle('ema3450','EMA 34/50'))
    items.push(toggle('ribbon','Pivot Ribbon'))
    items.push(toggle('ichi','Ichimoku'))
    items.push(toggle('saty','SATY ATR'))
    items.push(toggle('squeeze','Squeeze'))
    // Presets
    const presets = [
      ['trendDaily','Trend + Daily'],
      ['pullbackDaily','Pullback + Daily'],
      ['intradayBreakout','Intraday Breakout'],
      ['dailyTrendFollow','Daily Trend Follow'],
      ['meanRevertIntraday','Mean Revert (Intra)'],
      ['breakoutDailyStrong','Breakout (Daily, Strong)'],
      ['momentumContinuation','Momentum Continuation'],
    ]
    presets.forEach(([id,label]) => items.push({ id:`preset:${id}`, group:'Presets', label:`Apply ${label}`, run: () => applyPreset?.(id) }))
    // Scanner
    items.push({ id:'scan:run', group:'Scanner', label:'Run Scanner now', run: () => { try { window.dispatchEvent(new CustomEvent('iava.scan')) } catch {} } })
    // Symbol (freeform input)
    items.push({ id:'sym:load', group:'Symbol', label:`Load symbol (current ${symbol})`, run: () => {
      if (!q) return
      const s = q.toUpperCase().trim()
      if (!s) return
      setSymbol?.(s)
      loadBars?.(s, timeframe)
    } })
    return items
  }, [overlayToggles, overlayState, applyPreset, setTimeframe, setSymbol, loadBars, timeframe, symbol, q])

  const filtered = useMemo(() => {
    const qq = q.toLowerCase().trim()
    if (!qq) return actions
    return actions.filter(a => a.label.toLowerCase().includes(qq) || a.id.toLowerCase().includes(qq))
  }, [q, actions])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
        <div className="p-2 border-b border-slate-800">
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Type a command… (e.g., 5Min, Ichimoku, AAPL)" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" />
        </div>
        <div className="max-h-72 overflow-auto">
          {filtered.map((a,i) => (
            <button key={a.id} onClick={() => { try { a.run?.() } finally { setOpen(false) } }} className="w-full text-left px-3 py-2 hover:bg-slate-800 border-b border-slate-900 flex items-center justify-between">
              <span className="text-sm text-slate-200">{a.label}</span>
              <span className="text-[10px] text-slate-500">{a.group}</span>
            </button>
          ))}
          {!filtered.length && <div className="px-3 py-3 text-sm text-slate-400">No matches. Try a timeframe (5Min) or an overlay (Ichimoku).</div>}
        </div>
        <div className="p-2 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Cmd/Ctrl+K to toggle · Enter to run</span>
          <button onClick={()=>setOpen(false)} className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">Close</button>
        </div>
      </div>
    </div>
  )
}

