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

    // AI Commands - New Elite Features
    items.push({ id: 'ai:analyze', group: 'AI', label: '🤖 AI Analysis - Get comprehensive market analysis', hotkey: 'A', run: () => {
      window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'AI Analysis starting...', type: 'info' } }))
      // Navigate to AI Chat and trigger analysis
      window.location.hash = '#ai-chat'
    }})
    items.push({ id: 'ai:risk', group: 'AI', label: '⚠️ Risk Assessment - Analyze position risk', hotkey: 'R', run: () => {
      window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Opening Risk Advisor...', type: 'info' } }))
      window.location.hash = '#ai-features'
    }})
    items.push({ id: 'ai:suggest', group: 'AI', label: '💡 Get AI Suggestions - Trading opportunities', run: () => {
      window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'AI generating suggestions...', type: 'info' } }))
      window.location.hash = '#ai-chat'
    }})
    items.push({ id: 'ai:sentiment', group: 'AI', label: '📊 Market Sentiment - Social & news analysis', run: () => {
      window.location.hash = '#market-sentiment'
    }})

    // Trading Commands - Quick Actions
    items.push({ id: 'trade:buy', group: 'Trading', label: '📈 Buy Stock - Execute buy order', hotkey: 'B', run: () => {
      window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Buy order panel opening...', type: 'success' } }))
    }})
    items.push({ id: 'trade:sell', group: 'Trading', label: '📉 Sell Stock - Execute sell order', hotkey: 'S', run: () => {
      window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Sell order panel opening...', type: 'warning' } }))
    }})
    items.push({ id: 'trade:alert', group: 'Trading', label: '🔔 Set Alert - Price alert notification', run: () => {
      window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Alert creation coming soon...', type: 'info' } }))
    }})
    items.push({ id: 'trade:watchlist', group: 'Trading', label: '👁️ Add to Watchlist - Track this symbol', run: () => {
      if (symbol) {
        const watchlist = JSON.parse(localStorage.getItem('iava_watchlist') || '[]')
        if (!watchlist.includes(symbol)) {
          watchlist.push(symbol)
          localStorage.setItem('iava_watchlist', JSON.stringify(watchlist))
          window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: `${symbol} added to watchlist`, type: 'success' } }))
        } else {
          window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: `${symbol} already in watchlist`, type: 'info' } }))
        }
      }
    }})

    // Navigation Commands
    items.push({ id: 'nav:chart', group: 'Navigation', label: '📊 View Chart - Trading chart view', hotkey: 'C', run: () => window.location.hash = '#chart' })
    items.push({ id: 'nav:ai-hub', group: 'Navigation', label: '🤖 AI Hub - All AI features', run: () => window.location.hash = '#ai-features' })
    items.push({ id: 'nav:settings', group: 'Navigation', label: '⚙️ Settings - Configure app', hotkey: ',', run: () => {
      window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Settings coming soon...', type: 'info' } }))
    }})
    items.push({ id: 'nav:help', group: 'Navigation', label: '❓ Help & Docs - Get help', hotkey: '?', run: () => {
      window.dispatchEvent(new CustomEvent('iava.toggleTour'))
    }})

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
    items.push({ id:'scan:run', group:'Scanner', label:'🔍 Market Scan - Run scanner now', run: () => { try { window.dispatchEvent(new CustomEvent('iava.scan')) } catch {} } })
    items.push({ id:'scan:nlp', group:'Scanner', label: '🔍 NLP Scanner - Natural language search', run: () => window.location.hash = '#nlp-scanner' })

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

  // Natural language processing for commands
  const parseNaturalCommand = (input) => {
    const lower = input.toLowerCase()

    // Trading actions
    if (lower.includes('buy') || lower.includes('long')) return 'trade:buy'
    if (lower.includes('sell') || lower.includes('short')) return 'trade:sell'
    if (lower.includes('alert') || lower.includes('notify')) return 'trade:alert'
    if (lower.includes('watch')) return 'trade:watchlist'

    // AI actions
    if (lower.includes('analyz') || lower.includes('analysis')) return 'ai:analyze'
    if (lower.includes('risk')) return 'ai:risk'
    if (lower.includes('suggest') || lower.includes('idea')) return 'ai:suggest'
    if (lower.includes('sentiment') || lower.includes('social')) return 'ai:sentiment'

    // Navigation
    if (lower.includes('chart')) return 'nav:chart'
    if (lower.includes('ai hub') || lower.includes('features')) return 'nav:ai-hub'
    if (lower.includes('setting')) return 'nav:settings'
    if (lower.includes('help') || lower.includes('tour')) return 'nav:help'

    // Scanner
    if (lower.includes('scan')) return 'scan:run'
    if (lower.includes('nlp') || lower.includes('natural language')) return 'scan:nlp'

    return null
  }

  const filtered = useMemo(() => {
    const qq = q.toLowerCase().trim()
    if (!qq) return actions

    // Try natural language parsing first
    const nlpMatch = parseNaturalCommand(qq)
    if (nlpMatch) {
      const exactMatch = actions.find(a => a.id === nlpMatch)
      if (exactMatch) {
        // Put NLP match first, then show other relevant results
        const others = actions.filter(a =>
          a.id !== nlpMatch &&
          (a.label.toLowerCase().includes(qq) || a.id.toLowerCase().includes(qq))
        )
        return [exactMatch, ...others]
      }
    }

    // Fallback to standard filtering
    return actions.filter(a => a.label.toLowerCase().includes(qq) || a.id.toLowerCase().includes(qq))
  }, [q, actions])

  // Group theme colors - Elite gradient scheme
  const groupColors = {
    AI: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    Trading: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Navigation: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Timeframe: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    Overlays: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    Presets: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Scanner: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
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
