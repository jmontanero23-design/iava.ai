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

  // Group theme colors
  const groupColors = {
    Timeframe: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    Overlays: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    Presets: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Scanner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Symbol: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Premium Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Premium Modal */}
      <div className="relative w-full max-w-xl">
        <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden">
          {/* Gradient Border Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 opacity-20 blur-xl" />

          {/* Content */}
          <div className="relative">
            {/* Premium Search Input */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                  <span className="text-lg">🔍</span>
                </div>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={e=>setQ(e.target.value)}
                  placeholder="Type a command… (e.g., 5Min, Ichimoku, AAPL)"
                  className="w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm text-slate-200 placeholder-slate-500 transition-all"
                />
              </div>
            </div>

            {/* Premium Command List */}
            <div className="max-h-72 overflow-auto">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { try { a.run?.() } finally { setOpen(false) } }}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-900/20 border-b border-slate-800/50 flex items-center justify-between transition-all group"
                >
                  <span className="text-sm text-slate-200 group-hover:text-indigo-200 transition-colors">
                    {a.label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${groupColors[a.group] || 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                    {a.group}
                  </span>
                </button>
              ))}
              {!filtered.length && (
                <div className="px-4 py-8 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm text-slate-400">
                    No matches. Try a timeframe (5Min) or an overlay (Ichimoku).
                  </p>
                </div>
              )}
            </div>

            {/* Premium Footer */}
            <div className="p-3 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-slate-300 font-mono">
                    ⌘K
                  </kbd>
                  <span>toggle</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-slate-300 font-mono">
                    ↵
                  </kbd>
                  <span>run</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-slate-300 font-mono">
                    Esc
                  </kbd>
                  <span>close</span>
                </div>
              </div>
              <button
                onClick={()=>setOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
