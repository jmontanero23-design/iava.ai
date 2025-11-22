import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Fuse from 'fuse.js'

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
  marketData = {},
  positions = []
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentCommands, setRecentCommands] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('iava.recentCommands') || '[]')
    } catch {
      return []
    }
  })
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const recognitionRef = useRef(null)

  // Initialize voice recognition
  useEffect(() => {
    // Check for browser compatibility (Chrome/Edge)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (typeof window !== 'undefined' && SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setVoiceTranscript('')
      }

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')

        setVoiceTranscript(transcript)
        setQ(transcript)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: 'Voice recognition error. Please try again.', type: 'error' }
        }))
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Start/stop voice recognition
  const toggleVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop()
      } else {
        recognitionRef.current.start()
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: 'Listening... Speak your command', type: 'info' }
        }))
      }
    } else {
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Voice recognition not supported in your browser', type: 'error' }
      }))
    }
  }, [isListening])

  // Keyboard shortcut to open (Cmd/Ctrl + K)
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.ctrlKey || e.metaKey

      // Cmd+K to open
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        setTimeout(() => inputRef.current?.focus(), 10)
      }

      // Cmd+V for voice input
      if (meta && e.key.toLowerCase() === 'v' && open) {
        e.preventDefault()
        toggleVoiceInput()
      }

      // Quick number shortcuts (Cmd+1 through Cmd+9) when closed
      if (meta && !open && /^[1-9]$/.test(e.key)) {
        const quickActions = [
          () => window.location.hash = '#chart',        // 1
          () => window.location.hash = '#ai-features',  // 2
          () => window.location.hash = '#ai-chat',      // 3
          () => setTimeframe?.('1Min'),                 // 4
          () => setTimeframe?.('5Min'),                 // 5
          () => setTimeframe?.('15Min'),                // 6
          () => setTimeframe?.('1Hour'),                // 7
          () => setTimeframe?.('1Day'),                 // 8
          () => window.dispatchEvent(new CustomEvent('iava.scan')) // 9
        ]
        const index = parseInt(e.key) - 1
        if (quickActions[index]) {
          e.preventDefault()
          quickActions[index]()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setTimeframe])

  // Handle arrow keys for selection
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex])

  useEffect(() => { if (externalOpen != null) setOpen(!!externalOpen) }, [externalOpen])
  useEffect(() => { if (!open) { setQ(''); setSelectedIndex(0); onClose?.() } }, [open, onClose])

  // Save command to recent history
  const saveToRecent = useCallback((command) => {
    const updated = [command, ...recentCommands.filter(c => c.id !== command.id)].slice(0, 10)
    setRecentCommands(updated)
    localStorage.setItem('iava.recentCommands', JSON.stringify(updated))
  }, [recentCommands])

  // Execute a command
  const executeCommand = useCallback((command) => {
    try {
      command.run?.()
      saveToRecent(command)
    } finally {
      setOpen(false)
    }
  }, [saveToRecent])

  // AI-powered contextual suggestions
  const aiSuggestions = useMemo(() => {
    const suggestions = []

    // Based on current market conditions
    if (marketData.currentPrice && marketData.signalState) {
      const { score = 50 } = marketData.signalState || {}

      if (score >= 70) {
        suggestions.push({
          id: 'ai:buy_signal',
          group: '🤖 AI Suggests',
          label: `Strong buy signal on ${symbol} (Score: ${score})`,
          run: () => {
            window.dispatchEvent(new CustomEvent('iava.toast', {
              detail: { text: `Opening buy order for ${symbol}...`, type: 'success' }
            }))
            // Trigger buy panel
          }
        })
      } else if (score <= 30) {
        suggestions.push({
          id: 'ai:sell_signal',
          group: '🤖 AI Suggests',
          label: `Consider selling ${symbol} (Score: ${score})`,
          run: () => {
            window.dispatchEvent(new CustomEvent('iava.toast', {
              detail: { text: `Opening sell order for ${symbol}...`, type: 'warning' }
            }))
          }
        })
      }
    }

    // Based on positions
    if (positions.length > 0) {
      suggestions.push({
        id: 'ai:check_positions',
        group: '🤖 AI Suggests',
        label: `Review your ${positions.length} open position(s)`,
        run: () => window.location.hash = '#positions'
      })
    }

    // Time-based suggestions
    const hour = new Date().getHours()
    if (hour >= 9 && hour < 10) {
      suggestions.push({
        id: 'ai:morning_scan',
        group: '🤖 AI Suggests',
        label: 'Run morning market scan',
        run: () => window.dispatchEvent(new CustomEvent('iava.scan'))
      })
    }

    return suggestions
  }, [symbol, marketData, positions])

  const actions = useMemo(() => {
    const items = []

    // Add AI suggestions at the top
    items.push(...aiSuggestions)

    // Recent commands (if query is empty)
    if (!q && recentCommands.length > 0) {
      recentCommands.slice(0, 3).forEach(cmd => {
        items.push({ ...cmd, group: '⏱️ Recent' })
      })
    }

    // AI Commands - Elite Features
    items.push({
      id: 'ai:analyze',
      group: 'AI',
      label: '🤖 AI Analysis - Get comprehensive market analysis',
      hotkey: 'A',
      keywords: ['analyze', 'analysis', 'ai', 'help', 'what'],
      run: () => {
        window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'AI Analysis starting...', type: 'info' } }))
        window.location.hash = '#ai-chat'
      }
    })

    items.push({
      id: 'ai:risk',
      group: 'AI',
      label: '⚠️ Risk Assessment - Analyze position risk',
      hotkey: 'R',
      keywords: ['risk', 'danger', 'stop', 'loss'],
      run: () => {
        window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Opening Risk Advisor...', type: 'info' } }))
        window.location.hash = '#ai-features'
      }
    })

    items.push({
      id: 'ai:suggest',
      group: 'AI',
      label: '💡 Get AI Suggestions - Trading opportunities',
      keywords: ['suggest', 'idea', 'opportunity', 'find'],
      run: () => {
        window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'AI generating suggestions...', type: 'info' } }))
        window.location.hash = '#ai-chat'
      }
    })

    items.push({
      id: 'ai:sentiment',
      group: 'AI',
      label: '📊 Market Sentiment - Social & news analysis',
      keywords: ['sentiment', 'social', 'news', 'mood'],
      run: () => window.location.hash = '#market-sentiment'
    })

    items.push({
      id: 'ai:forecast',
      group: 'AI',
      label: '🔮 AVA Forecast - AI price predictions',
      keywords: ['forecast', 'predict', 'future', 'tomorrow'],
      run: () => window.location.hash = '#chronos-forecast'
    })

    // Trading Commands - Quick Actions
    items.push({
      id: 'trade:buy',
      group: 'Trading',
      label: `📈 Buy ${symbol || 'Stock'} - Execute buy order`,
      hotkey: 'B',
      keywords: ['buy', 'long', 'purchase', 'acquire'],
      run: () => {
        window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Buy order panel opening...', type: 'success' } }))
        window.dispatchEvent(new CustomEvent('iava.trade', { detail: { side: 'buy', symbol } }))
      }
    })

    items.push({
      id: 'trade:sell',
      group: 'Trading',
      label: `📉 Sell ${symbol || 'Stock'} - Execute sell order`,
      hotkey: 'S',
      keywords: ['sell', 'short', 'exit', 'close'],
      run: () => {
        window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Sell order panel opening...', type: 'warning' } }))
        window.dispatchEvent(new CustomEvent('iava.trade', { detail: { side: 'sell', symbol } }))
      }
    })

    items.push({
      id: 'trade:alert',
      group: 'Trading',
      label: '🔔 Set Alert - Price alert notification',
      keywords: ['alert', 'notify', 'notification', 'reminder'],
      run: () => {
        window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Alert creation coming soon...', type: 'info' } }))
      }
    })

    items.push({
      id: 'trade:watchlist',
      group: 'Trading',
      label: `👁️ Add ${symbol || 'Symbol'} to Watchlist`,
      keywords: ['watch', 'watchlist', 'track', 'monitor'],
      run: () => {
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
      }
    })

    // Navigation Commands
    items.push({
      id: 'nav:chart',
      group: 'Navigation',
      label: '📊 View Chart - Trading chart view',
      hotkey: 'C',
      keywords: ['chart', 'graph', 'candle', 'price'],
      run: () => window.location.hash = '#chart'
    })

    items.push({
      id: 'nav:ai-hub',
      group: 'Navigation',
      label: '🤖 AI Hub - All AI features',
      keywords: ['ai', 'hub', 'features', 'intelligence'],
      run: () => window.location.hash = '#ai-features'
    })

    items.push({
      id: 'nav:scanner',
      group: 'Navigation',
      label: '🔍 Scanner - Find opportunities',
      keywords: ['scan', 'scanner', 'find', 'search'],
      run: () => window.location.hash = '#scanner'
    })

    items.push({
      id: 'nav:journal',
      group: 'Navigation',
      label: '📓 Trade Journal - Review trades',
      keywords: ['journal', 'trades', 'history', 'log'],
      run: () => window.location.hash = '#journal'
    })

    items.push({
      id: 'nav:settings',
      group: 'Navigation',
      label: '⚙️ Settings - Configure app',
      hotkey: ',',
      keywords: ['settings', 'config', 'preferences', 'options'],
      run: () => {
        window.dispatchEvent(new CustomEvent('iava.toast', { detail: { text: 'Settings coming soon...', type: 'info' } }))
      }
    })

    items.push({
      id: 'nav:help',
      group: 'Navigation',
      label: '❓ Help & Docs - Get help',
      hotkey: '?',
      keywords: ['help', 'docs', 'documentation', 'tutorial'],
      run: () => {
        window.dispatchEvent(new CustomEvent('iava.toggleTour'))
      }
    })

    // Timeframes
    ;['1Min','5Min','15Min','1Hour','1Day'].forEach(tf => items.push({
      id: `tf:${tf}`,
      group: 'Timeframe',
      label: `⏰ Set timeframe to ${tf}`,
      keywords: [tf.toLowerCase(), 'timeframe', 'period'],
      run: () => setTimeframe?.(tf)
    }))

    // Overlays
    const t = overlayToggles || {}
    const st = overlayState || {}
    const toggle = (k, label, keywords = []) => ({
      id: `ov:${k}`,
      group: 'Overlays',
      label: `${st[k] ? '🔴 Hide' : '🟢 Show'} ${label}`,
      keywords: [k, ...keywords],
      run: () => t[k]?.()
    })

    items.push(toggle('ema821','EMA 8/21 Cloud', ['ema', 'cloud', 'moving average']))
    items.push(toggle('ema512','EMA 5/12 Cloud', ['ema', 'cloud', 'moving average']))
    items.push(toggle('ema89','EMA 8/9 Ribbon', ['ema', 'ribbon', 'moving average']))
    items.push(toggle('ema3450','EMA 34/50 Cloud', ['ema', 'cloud', 'moving average']))
    items.push(toggle('ribbon','Pivot Ribbon', ['pivot', 'ribbon', 'support', 'resistance']))
    items.push(toggle('ichi','Ichimoku Cloud', ['ichimoku', 'cloud', 'japanese']))
    items.push(toggle('saty','SATY ATR Levels', ['saty', 'atr', 'volatility', 'levels']))
    items.push(toggle('squeeze','TTM Squeeze', ['squeeze', 'ttm', 'momentum']))

    // Presets
    const presets = [
      ['trendDaily','Trend + Daily', ['trend', 'daily']],
      ['pullbackDaily','Pullback + Daily', ['pullback', 'daily']],
      ['intradayBreakout','Intraday Breakout', ['intraday', 'breakout']],
      ['dailyTrendFollow','Daily Trend Follow', ['daily', 'trend', 'follow']],
      ['meanRevertIntraday','Mean Revert (Intra)', ['mean', 'revert', 'intraday']],
      ['breakoutDailyStrong','Breakout (Daily, Strong)', ['breakout', 'daily', 'strong']],
      ['momentumContinuation','Momentum Continuation', ['momentum', 'continuation']],
    ]

    presets.forEach(([id, label, keywords]) => items.push({
      id: `preset:${id}`,
      group: 'Presets',
      label: `🎯 Apply ${label}`,
      keywords,
      run: () => applyPreset?.(id)
    }))

    // Scanner
    items.push({
      id: 'scan:run',
      group: 'Scanner',
      label: '🔍 Run Market Scan Now',
      keywords: ['scan', 'market', 'find', 'search'],
      run: () => {
        try {
          window.dispatchEvent(new CustomEvent('iava.scan'))
        } catch {}
      }
    })

    items.push({
      id: 'scan:nlp',
      group: 'Scanner',
      label: '💬 NLP Scanner - Natural language search',
      keywords: ['nlp', 'natural', 'language', 'search', 'scan'],
      run: () => window.location.hash = '#nlp-scanner'
    })

    // Symbol (freeform input) - if query looks like a symbol
    if (q && /^[A-Z]{1,5}$/.test(q.toUpperCase())) {
      items.unshift({
        id: 'sym:load',
        group: 'Symbol',
        label: `📈 Load ${q.toUpperCase()}`,
        keywords: [],
        run: () => {
          const s = q.toUpperCase().trim()
          if (s) {
            setSymbol?.(s)
            loadBars?.(s, timeframe)
          }
        }
      })
    }

    return items
  }, [aiSuggestions, recentCommands, q, overlayToggles, overlayState, applyPreset, setTimeframe, setSymbol, loadBars, timeframe, symbol])

  // Natural language processing for commands
  const parseNaturalCommand = (input) => {
    const lower = input.toLowerCase()
    const patterns = [
      // Trading patterns
      { pattern: /buy (\d+) (?:shares? of )?(\w+)/i, action: 'trade:buy_qty' },
      { pattern: /sell (\d+) (?:shares? of )?(\w+)/i, action: 'trade:sell_qty' },
      { pattern: /set (?:a )?(\d+(?:\.\d+)?) (?:dollar )?stop/i, action: 'trade:stop' },
      { pattern: /alert (?:me )?(?:at|when) (\d+(?:\.\d+)?)/i, action: 'trade:alert_price' },

      // Analysis patterns
      { pattern: /what(?:'s| is) happening with (\w+)/i, action: 'ai:analyze_symbol' },
      { pattern: /(?:show|display|open) (\w+) chart/i, action: 'chart:symbol' },
      { pattern: /scan for (.+)/i, action: 'scan:query' },

      // Simple commands
      { pattern: /^buy$/i, action: 'trade:buy' },
      { pattern: /^sell$/i, action: 'trade:sell' },
      { pattern: /^help$/i, action: 'nav:help' },
      { pattern: /^settings?$/i, action: 'nav:settings' },
    ]

    for (const { pattern, action } of patterns) {
      const match = lower.match(pattern)
      if (match) {
        return { action, params: match.slice(1) }
      }
    }

    return null
  }

  // Fuzzy search with Fuse.js
  const filtered = useMemo(() => {
    const qq = q.toLowerCase().trim()

    // If no query, show AI suggestions and recent commands
    if (!qq) {
      return actions.slice(0, 15) // Limit initial display
    }

    // Try natural language parsing first
    const nlpMatch = parseNaturalCommand(qq)
    if (nlpMatch) {
      // Create a dynamic action based on NLP
      const nlpAction = {
        id: 'nlp:dynamic',
        group: '✨ Natural Language',
        label: `Execute: ${q}`,
        run: () => {
          window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: { text: `Executing: ${q}`, type: 'info' }
          }))
          // Handle the NLP action based on nlpMatch.action and nlpMatch.params
        }
      }
      return [nlpAction, ...actions.slice(0, 10)]
    }

    // Enhanced Fuse.js for smarter fuzzy search
    const fuse = new Fuse(actions, {
      keys: [
        { name: 'label', weight: 2.0 },
        { name: 'keywords', weight: 1.5 },
        { name: 'group', weight: 0.5 }
      ],
      threshold: 0.35,  // More forgiving for typos
      includeScore: true,
      includeMatches: true,  // Highlight what matched
      minMatchCharLength: 1,  // Allow single char matches
      location: 0,  // Prefer matches at start
      distance: 100,  // How far from location
      useExtendedSearch: true,  // Enable advanced patterns
      findAllMatches: true,  // Find all potential matches
      ignoreFieldNorm: false,
      fieldNormWeight: 1
    })

    const results = fuse.search(qq)
    return results.map(r => r.item).slice(0, 20)
  }, [q, actions])

  // Group theme colors - Elite gradient scheme
  const groupColors = {
    '🤖 AI Suggests': 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-purple-300 border-purple-500/30',
    '⏱️ Recent': 'bg-slate-600/20 text-slate-300 border-slate-500/30',
    '✨ Natural Language': 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30',
    'AI': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    'Trading': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Navigation': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Timeframe': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'Overlays': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    'Presets': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Scanner': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    'Symbol': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Premium Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Premium Modal */}
      <div className="relative w-full max-w-2xl">
        <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden">
          {/* Gradient Border Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 opacity-20 blur-xl" />

          {/* Content */}
          <div className="relative">
            {/* Premium Search Input with Voice */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                  <span className="text-lg">🔍</span>
                </div>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={e => {
                    setQ(e.target.value)
                    setSelectedIndex(0)
                  }}
                  placeholder={isListening ? "Listening... Speak now" : "Search commands or type naturally (e.g., 'buy 100 NVDA', 'show 5min chart')"}
                  className={`w-full pl-10 pr-24 py-3 bg-slate-800/50 border ${
                    isListening
                      ? 'border-red-500/50 ring-2 ring-red-500/20 animate-pulse'
                      : 'border-slate-700/50 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20'
                  } rounded-lg text-sm text-slate-200 placeholder-slate-500 transition-all`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-1.5 rounded-md transition-all ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 animate-pulse'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-400'
                    }`}
                    title={isListening ? "Stop listening (⌘V)" : "Voice input (⌘V)"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                        isListening
                          ? "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                          : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      } />
                    </svg>
                  </button>
                  <span className="text-xs text-slate-500">⌘K</span>
                </div>
              </div>
              {voiceTranscript && isListening && (
                <div className="mt-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-md">
                  <span className="text-xs text-red-400">🎤 "{voiceTranscript}"</span>
                </div>
              )}

              {/* Quick Actions Bar */}
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-slate-500">Quick:</span>
                <button
                  onClick={() => setQ('buy')}
                  className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 transition-colors"
                >
                  Buy
                </button>
                <button
                  onClick={() => setQ('sell')}
                  className="px-2 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
                >
                  Sell
                </button>
                <button
                  onClick={() => setQ('scan')}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition-colors"
                >
                  Scan
                </button>
                <button
                  onClick={() => setQ('5min')}
                  className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition-colors"
                >
                  5Min
                </button>
              </div>
            </div>

            {/* Premium Command List */}
            <div className="max-h-96 overflow-auto" ref={listRef}>
              {filtered.map((a, index) => (
                <button
                  key={a.id}
                  onClick={() => executeCommand(a)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-800/50 flex items-center justify-between transition-all group ${
                    index === selectedIndex
                      ? 'bg-indigo-900/30 border-l-4 border-l-indigo-500'
                      : 'hover:bg-indigo-900/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-200 group-hover:text-indigo-200 transition-colors">
                      {a.label}
                    </span>
                    {a.hotkey && (
                      <kbd className="px-1.5 py-0.5 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-400">
                        {a.hotkey}
                      </kbd>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                    groupColors[a.group] || 'bg-slate-700/50 text-slate-400 border-slate-600'
                  }`}>
                    {a.group}
                  </span>
                </button>
              ))}

              {!filtered.length && (
                <div className="px-4 py-8 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm text-slate-400">
                    No matches. Try natural language like "buy 100 shares" or "show me AAPL chart"
                  </p>
                </div>
              )}
            </div>

            {/* Premium Footer */}
            <div className="p-3 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-slate-300 font-mono">
                    ↑↓
                  </kbd>
                  <span>navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-slate-300 font-mono">
                    ↵
                  </kbd>
                  <span>execute</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-slate-300 font-mono">
                    Esc
                  </kbd>
                  <span>close</span>
                </div>
                <div className="text-indigo-400">
                  ⌘1-9 for quick actions
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
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