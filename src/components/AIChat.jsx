/**
 * AI Chat Interface - ELITE EDITION
 *
 * World-class conversational assistant with:
 * - Chart screenshot analysis (vision models)
 * - Document upload for insights (PDFs, CSV, TXT)
 * - Live market data integration
 * - PhD-level trading intelligence
 */

import { useState, useRef, useEffect } from 'react'
import { callAI } from '../utils/aiGateway.js'
import { generateTradingSystemPrompt, buildMarketContext, formatContextForAI } from '../utils/aiContext.js'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import MobilePushToTalk from './MobilePushToTalk.jsx'
import { detectSymbols, detectTimeframe, buildEnhancedContext, formatEnhancedContext } from '../utils/aiEnhancements.js'

export default function AIChat() {
  const { marketData } = useMarketData()
  const marketDataRef = useRef(marketData)

  // Load chat history from localStorage on mount
  const loadChatHistory = () => {
    try {
      const saved = localStorage.getItem('iava_chat_history')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Only restore if less than 24 hours old
        if (parsed.timestamp && (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000)) {
          return parsed.messages
        }
      }
    } catch (e) {
      console.error('Failed to load chat history:', e)
    }
    // Default greeting
    return [
      {
        role: 'assistant',
        content: 'Hi! I\'m your ELITE AI trading assistant with PhD-level market analysis. I have LIVE access to the current chart\'s market data (indicators, price action, regime). You can also upload chart screenshots of ANY symbol for instant technical analysis, or share documents for insights.',
        timestamp: Date.now()
      }
    ]
  }

  const [messages, setMessages] = useState(loadChatHistory())
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([]) // Chart images, PDFs, CSVs
  const [smartSuggestions, setSmartSuggestions] = useState([]) // AI-generated context-aware questions
  const [audioUnlocked, setAudioUnlocked] = useState(false) // Mobile Safari audio unlock status
  const [pendingAudio, setPendingAudio] = useState(null) // Audio waiting for user gesture
  const [showAudioPrompt, setShowAudioPrompt] = useState(false) // Show "Tap to enable voice" UI
  const [debugLog, setDebugLog] = useState([]) // Debug log for troubleshooting
  const [trustMode, setTrustMode] = useState(() => {
    // Load trust mode preference from localStorage
    try {
      return localStorage.getItem('iava_trust_mode') === 'true'
    } catch {
      return false
    }
  })
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('iava_chat_history', JSON.stringify({
      messages,
      timestamp: Date.now()
    }))
  }, [messages])

  // Toggle Trust Mode for instant trade execution
  const toggleTrustMode = () => {
    const newValue = !trustMode
    setTrustMode(newValue)
    localStorage.setItem('iava_trust_mode', String(newValue))

    if (newValue) {
      // Show warning when enabling trust mode
      const warningMsg = {
        role: 'assistant',
        content: '⚡ **TRUST MODE ENABLED** ⚡\n\nTrades will now execute INSTANTLY without confirmation when I recommend them. Make sure you trust my analysis before enabling this mode.\n\nTo disable: Click the "Trust Mode" button again.',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, warningMsg])
    } else {
      const infoMsg = {
        role: 'assistant',
        content: '🛡️ Trust Mode disabled. Trades will now require your confirmation before execution.',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, infoMsg])
    }
  }

  // Background AI Processing: Resume pending requests on mount
  useEffect(() => {
    const checkPendingRequest = () => {
      try {
        const pending = localStorage.getItem('iava_pending_request')
        if (pending) {
          const { timestamp } = JSON.parse(pending)
          // If request is older than 5 minutes, clear it (timed out)
          if (Date.now() - timestamp > 5 * 60 * 1000) {
            localStorage.removeItem('iava_pending_request')
            setIsTyping(false)
          } else {
            // Resume "thinking" state - request is still pending
            setIsTyping(true)
            console.log('[AI Chat] Resuming background request...')
          }
        }
      } catch (e) {
        console.error('[AI Chat] Error checking pending request:', e)
      }
    }
    checkPendingRequest()
  }, [])

  // Detect if running on iOS/Safari mobile
  const isMobileSafari = () => {
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)
    const isMobile = /Mobile|Android/.test(ua)
    return isIOS || (isSafari && isMobile)
  }

  // CRITICAL: Unlock audio on mobile Safari (requires user gesture)
  const unlockAudio = async () => {
    if (audioUnlocked) return true

    try {
      // Play silent audio to unlock audio context on mobile
      const silentAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/jCp4AAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbw4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e//tQxAkDU8altSvVIdEMFW9W+UgBH///////////////////////w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e//tQxAkDU8altSvVIdEMFW9W+UgBH///////////////////////w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e3w4e')
      silentAudio.volume = 0.01
      await silentAudio.play()
      setAudioUnlocked(true)
      console.log('🔓 Audio unlocked for mobile Safari')
      return true
    } catch (error) {
      console.warn('🔒 Audio unlock failed:', error)
      return false
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle file uploads (images, PDFs, CSVs)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const processedFiles = await Promise.all(
      files.map(async (file) => {
        // Check file type
        const isImage = file.type.startsWith('image/')
        const isPDF = file.type === 'application/pdf'
        const isText = file.type.startsWith('text/') || file.name.endsWith('.csv')

        // Convert to base64 for transmission
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })

        return {
          name: file.name,
          type: file.type,
          size: file.size,
          base64,
          isImage,
          isPDF,
          isText,
          preview: isImage ? base64 : null
        }
      })
    )

    setUploadedFiles((prev) => [...prev, ...processedFiles])
  }

  // Remove uploaded file
  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Clear chat history
  const clearChat = () => {
    if (confirm('Clear chat history? This cannot be undone.')) {
      const freshMessages = [
        {
          role: 'assistant',
          content: 'Hi! I\'m your ELITE AI trading assistant with PhD-level market analysis. I have LIVE access to the current chart\'s market data (indicators, price action, regime). You can also upload chart screenshots of ANY symbol for instant technical analysis, or share documents for insights.',
          timestamp: Date.now()
        }
      ]
      setMessages(freshMessages)
      localStorage.removeItem('iava_chat_history')
    }
  }

  // Parse trade setup from AI response with STRICT patterns to avoid false matches
  const parseTradeSetup = (content) => {
    // Extract symbol, entry, stop, target from AI response
    // STRICT patterns: require $ symbol to avoid matching random numbers like "Unicorn Score 0"
    // Look for patterns like: "entry at $185.50", "stop $184.20", "target $206.80"

    const symbolMatch = content.match(/\b([A-Z]{1,5})\b.*?(?:entry|buy|sell|long|short)/i)

    // Require $ symbol and optional "at", "@", ":" before price
    const entryMatch = content.match(/(?:entry|buy at|long at|enter at)\s*(?:at|@|:)?\s*\$(\d+\.?\d*)/i)
    const stopMatch = content.match(/(?:stop|stop\s*loss|sl|risk)\s*(?:at|@|:)?\s*\$(\d+\.?\d*)/i)
    const targetMatch = content.match(/(?:target|take\s*profit|tp)\s*(?:at|@|:)?\s*\$(\d+\.?\d*)/i)
    const sideMatch = content.match(/\b(long|short|buy|sell)\b/i)

    // Only proceed if we have at least one valid price with $ symbol
    if (!entryMatch && !stopMatch && !targetMatch) return null

    return {
      symbol: symbolMatch ? symbolMatch[1] : marketData.symbol || 'SPY',
      side: sideMatch ? (sideMatch[1].toLowerCase().includes('long') || sideMatch[1].toLowerCase().includes('buy') ? 'buy' : 'sell') : 'buy',
      entry: entryMatch ? parseFloat(entryMatch[1]) : null,
      stopLoss: stopMatch ? parseFloat(stopMatch[1]) : null,
      target: targetMatch ? parseFloat(targetMatch[1]) : null
    }
  }

  // Generate follow-up questions based on AI response
  const generateFollowUpQuestions = (content) => {
    const questions = []

    // PRIORITY: Auto-detect "Load [SYMBOL]" mentions and create buttons
    const loadMatches = content.match(/Load ([A-Z]{1,5})(?!\w)/g)
    if (loadMatches) {
      // Add all unique Load buttons
      const uniqueSymbols = [...new Set(loadMatches)]
      uniqueSymbols.slice(0, 2).forEach(match => questions.push(match))
    }

    // If AI mentioned a setup, suggest deeper analysis
    if (content.match(/(?:bullish|bearish|setup|entry|target)/i)) {
      questions.push('Run backtest on this setup')
      questions.push('Show me similar setups')
    }

    // If AI mentioned levels, ask about risk
    if (content.match(/(?:support|resistance|stop|target)/i)) {
      questions.push('What\'s the risk/reward ratio?')
    }

    // If AI mentioned regime or trend, ask about context
    if (content.match(/(?:regime|trend)/i)) {
      questions.push('What other stocks show this pattern?')
    }

    return questions.slice(0, 4) // Max 4 follow-ups (to accommodate Load buttons)
  }

  // Execute trade setup (emit event to order panel)
  const executeTradeSetup = (setup) => {
    // Emit custom event that OrderPanel can listen to
    window.dispatchEvent(new CustomEvent('ai-trade-setup', {
      detail: setup
    }))

    // Visual feedback
    alert(`Trade setup loaded! Check your order panel.\n\nSymbol: ${setup.symbol}\nSide: ${setup.side}\nEntry: $${setup.entry || 'market'}\nStop: $${setup.stopLoss || 'N/A'}\nTarget: $${setup.target || 'N/A'}`)
  }

  // Run backtest for current setup
  const runBacktestAnalysis = async (messageContent) => {
    try {
      setIsTyping(true)

      // Extract symbol from message or use current
      const symbolMatch = messageContent.match(/\b([A-Z]{1,5})\b/)
      const symbol = symbolMatch ? symbolMatch[1] : marketData.symbol || 'SPY'
      const timeframe = marketData.timeframe || '15Min'

      // Call backtest API
      const response = await fetch(`/api/backtest?symbol=${symbol}&timeframe=${timeframe}&threshold=70&horizon=10&curve=1`)
      const data = await response.json()

      // Format backtest results for AI
      const backtestSummary = `
🔬 **BACKTEST RESULTS for ${symbol} (${timeframe})**

📊 Performance Metrics:
• Score Average: ${data.scoreAvg}/100
• Events Found: ${data.events}
• Win Rate: ${data.winRate}%
• Avg Forward Return: ${data.avgFwd}%
• Median Return: ${data.medianFwd}%
• Profit Factor: ${data.profitFactor || 'N/A'}

📈 Threshold Analysis:
${data.curve?.slice(0, 5).map(c => `• Score ${c.th}+: ${c.events} trades, ${c.winRate}% WR, +${c.avgFwd}% avg`).join('\n') || 'No data'}

💡 **Verdict:** ${
          data.winRate > 60 ? '✅ STRONG EDGE - High probability setup!' :
          data.winRate > 50 ? '⚠️ MODERATE - Use with confirmation' :
          '❌ WEAK - Avoid or wait for better setup'
        }`

      // Add backtest results to chat
      const backtestMessage = {
        role: 'assistant',
        content: backtestSummary,
        timestamp: Date.now(),
        isBacktest: true
      }

      setMessages(prev => [...prev, backtestMessage])

    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ Backtest failed: ${error.message}`,
        timestamp: Date.now(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // Find similar setups - FULL MARKET SCAN (ALL tradeable stocks)
  const findSimilarSetups = async () => {
    try {
      setIsTyping(true)

      // Add progress message
      const progressMsg = {
        role: 'assistant',
        content: '🔍 Scanning the entire market (all tradeable US stocks)...',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, progressMsg])

      const currentTimeframe = marketData.timeframe || '5Min'

      // Step 1: Fetch ENTIRE universe of tradeable stocks from Alpaca
      const universeResponse = await fetch('/api/universe?assetClass=stocks')
      if (!universeResponse.ok) throw new Error('Failed to fetch stock universe')
      const universeData = await universeResponse.json()
      const allSymbols = universeData.symbols || []

      if (!allSymbols.length) throw new Error('No stocks available to scan')

      // Step 2: Scan in batches (like ScannerPanel does) - 25 stocks at a time
      const chunk = (arr, n) => arr.reduce((acc, x, i) => {
        if (i % n === 0) acc.push([])
        acc[acc.length-1].push(x)
        return acc
      }, [])

      const chunks = chunk(allSymbols, 25)
      const accumulated = { longs: [], shorts: [] }
      let totalScanned = 0

      for (let i = 0; i < chunks.length; i++) {
        const batch = chunks[i].join(',')
        const params = new URLSearchParams({
          symbols: batch,
          timeframe: currentTimeframe,
          threshold: '60',
          top: '100',
          enforceDaily: '0',
          requireConsensus: '0',
          consensusBonus: '0',
          assetClass: 'stocks',
          returnAll: '1'
        })

        const response = await fetch(`/api/scan?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          accumulated.longs.push(...(data.longs || []))
          accumulated.shorts.push(...(data.shorts || []))
          totalScanned += chunks[i].length

          // Update progress every 10 batches
          if (i % 10 === 0 || i === chunks.length - 1) {
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: `🔍 Scanning... ${totalScanned}/${allSymbols.length} stocks (${Math.round((totalScanned/allSymbols.length)*100)}%) • Found: ${accumulated.longs.length}L/${accumulated.shorts.length}S`
              }
              return updated
            })
          }
        }
      }

      // Step 3: Sort and get top 10 of each
      accumulated.longs.sort((a,b) => b.score - a.score)
      accumulated.shorts.sort((a,b) => b.score - a.score)
      const topLongs = accumulated.longs.slice(0, 10)
      const topShorts = accumulated.shorts.slice(0, 10)

      // Step 4: Format results
      let resultText = `🔍 **FULL MARKET SCAN COMPLETE**\n`
      resultText += `Scanned: ${allSymbols.length.toLocaleString()} stocks | Threshold: 60+\n\n`

      if (topLongs.length > 0) {
        resultText += `**🟢 TOP ${topLongs.length} LONG SETUPS**\n`
        topLongs.forEach((setup, i) => {
          resultText += `${i + 1}. **${setup.symbol}** - $${setup.last?.close?.toFixed(2)}\n`
          resultText += `   • Unicorn: ${Math.round(setup.score)}/100\n`
        })
      }

      if (topShorts.length > 0) {
        resultText += `\n**🔴 TOP ${topShorts.length} SHORT SETUPS**\n`
        topShorts.forEach((setup, i) => {
          resultText += `${i + 1}. **${setup.symbol}** - $${setup.last?.close?.toFixed(2)}\n`
          resultText += `   • Unicorn: ${Math.round(setup.score)}/100\n`
        })
      }

      if (topLongs.length === 0 && topShorts.length === 0) {
        resultText += `\nNo setups found with Unicorn Score 60+ across the entire market.\n`
        resultText += `Market is extremely choppy - wait for better conditions.`
      } else {
        resultText += `\n💡 Total qualifying setups: ${accumulated.longs.length} longs, ${accumulated.shorts.length} shorts`
        resultText += `\n📊 Load any symbol on the chart for exact entries/stops/targets.`
      }

      // Replace progress message with final results
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: resultText,
          timestamp: Date.now(),
          scanResults: { longs: topLongs, shorts: topShorts, totalScanned: allSymbols.length }
        }
        return updated
      })

    } catch (error) {
      console.error('[AI Chat] Scanner error:', error)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `❌ Market scan failed: ${error.message}\n\nUse the Scanner panel for manual scanning.`,
          timestamp: Date.now(),
          error: true
        }
        return updated
      })
    } finally {
      setIsTyping(false)
    }
  }

  // CRITICAL FIX: Keep ref updated with latest marketData to avoid stale closure
  useEffect(() => {
    marketDataRef.current = marketData
  }, [marketData])

  // Auto-load symbol for detailed analysis - AI can trigger this
  // FIXED: Uses ref instead of closure to avoid race condition
  const loadSymbolForAnalysis = async (symbol, timeframe = null) => {
    return new Promise((resolve) => {
      console.log('[AI Chat] Auto-loading symbol for analysis:', symbol)

      // Listen for symbol loaded event (more reliable than polling)
      const handleSymbolLoaded = (event) => {
        if (event.detail.symbol?.toUpperCase() === symbol.toUpperCase()) {
          window.removeEventListener('iava.symbolLoaded', handleSymbolLoaded)
          clearInterval(checkInterval)
          clearTimeout(timeout)
          console.log('[AI Chat] ✅ Symbol loaded successfully:', symbol, 'bars:', event.detail.bars)
          resolve(true)
        }
      }
      window.addEventListener('iava.symbolLoaded', handleSymbolLoaded)

      // Dispatch event to load symbol in chart
      window.dispatchEvent(new CustomEvent('iava.loadSymbol', {
        detail: { symbol: symbol.toUpperCase(), timeframe }
      }))

      // Fallback: Poll using ref (not closure) for latest data
      let checks = 0
      const checkInterval = setInterval(() => {
        checks++
        // CRITICAL: Use ref.current to get LATEST marketData, not stale closure
        const current = marketDataRef.current
        console.log(`[AI Chat] Waiting for ${symbol} to load... (check ${checks}/50, current: ${current.symbol})`)

        if (current.symbol?.toUpperCase() === symbol.toUpperCase() && current.bars?.length > 0) {
          window.removeEventListener('iava.symbolLoaded', handleSymbolLoaded)
          clearInterval(checkInterval)
          clearTimeout(timeout)
          console.log('[AI Chat] ✅ Symbol loaded successfully (via polling):', symbol, 'bars:', current.bars?.length)
          resolve(true)
        }
      }, 100)

      const timeout = setTimeout(() => {
        window.removeEventListener('iava.symbolLoaded', handleSymbolLoaded)
        clearInterval(checkInterval)
        console.warn('[AI Chat] ⏱️ Symbol load timeout for:', symbol, '- current symbol:', marketDataRef.current.symbol)
        resolve(false)
      }, 5000)
    })
  }

  // Expose loadSymbolForAnalysis to window for AI to access
  // FIXED: No dependencies needed since function uses ref
  useEffect(() => {
    window.iavaLoadSymbol = loadSymbolForAnalysis
    return () => { delete window.iavaLoadSymbol }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Export chat to clipboard (markdown format)
  const exportChat = () => {
    const markdown = messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleString()
      const role = msg.role === 'user' ? '**You**' : '**AI Assistant**'
      return `### ${role} - ${timestamp}\n\n${msg.content}\n\n---\n`
    }).join('\n')

    const fullExport = `# iAVA AI Trading Chat Export\n\nExported: ${new Date().toLocaleString()}\n\n---\n\n${markdown}`

    navigator.clipboard.writeText(fullExport)
      .then(() => alert('✅ Chat exported to clipboard! Paste into your notes/journal.'))
      .catch(() => alert('❌ Failed to copy to clipboard'))
  }

  // Voice input (using Web Speech API)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  const startVoiceInput = async () => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog(prev => [...prev, `${timestamp} - 🎤 Mic button clicked`])

    console.log('🎤 [DEBUG] Start voice input clicked!')
    console.log('🎤 [DEBUG] Browser:', navigator.userAgent)
    console.log('🎤 [DEBUG] Has SpeechRecognition:', 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setDebugLog(prev => [...prev, `${timestamp} - ❌ Speech recognition not supported`])
      console.error('🎤 [DEBUG] Speech recognition not supported!')
      alert('❌ Voice input not supported in this browser. Try Chrome/Edge.')
      return
    }

    // CRITICAL: Unlock audio on mobile Safari before starting voice (user gesture)
    if (isMobileSafari()) {
      setDebugLog(prev => [...prev, `${timestamp} - 🔓 Unlocking audio (Mobile Safari)`])
      console.log('🎤 [DEBUG] Mobile Safari detected - unlocking audio...')
      await unlockAudio()
    }

    setDebugLog(prev => [...prev, `${timestamp} - ✅ Starting recognition...`])
    console.log('🎤 [DEBUG] Attempting to start recognition...')

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    // SMART MODE: Continuous with auto-silence detection
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    let finalTranscript = ''
    let silenceTimer = null

    recognition.onstart = () => {
      setIsListening(true)
      finalTranscript = ''
      console.log('🎤 Voice recognition started (speak naturally, I\'ll know when you\'re done)')
    }

    recognition.onresult = (event) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript = transcript
        }
      }

      // Show live transcript
      setInput((finalTranscript + interimTranscript).trim())

      // Clear any existing silence timer
      if (silenceTimer) clearTimeout(silenceTimer)

      // Set new silence timer - auto-submit after 2 seconds of silence
      silenceTimer = setTimeout(() => {
        if (finalTranscript.trim()) {
          const transcript = finalTranscript.trim().toLowerCase()

          // ELITE: Check for trade confirmation keywords
          const confirmationKeywords = ['yes', 'confirm', 'place trade', 'do it', 'go ahead', 'execute', 'place it', 'yeah', 'yep', 'sure', 'okay', 'ok']
          const isConfirmation = confirmationKeywords.some(keyword => transcript.includes(keyword))

          // Check if there's a pending trade confirmation
          const lastMessage = messages[messages.length - 1]
          if (lastMessage?.awaitingTradeConfirmation && isConfirmation) {
            console.log('[Voice-to-Trade] Confirmation detected:', transcript)
            recognition.stop()
            setInput('')
            finalTranscript = ''
            // Execute trade confirmation
            setTimeout(() => confirmTrade(lastMessage.tradeSetup), 100)
            return
          }

          console.log('🎤 Silence detected - auto-submitting:', finalTranscript.trim())
          recognition.stop()
          // Auto-submit the form
          setTimeout(() => {
            const form = document.querySelector('form')
            form?.requestSubmit()
          }, 200)
        }
      }, 2000) // 2 seconds of silence = done talking
    }

    recognition.onerror = (event) => {
      console.error('🎤 Error:', event.error)
      setIsListening(false)
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        alert(`❌ Voice error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      if (silenceTimer) clearTimeout(silenceTimer)
      console.log('🎤 Voice recognition ended')
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // ELITE FEATURE: Voice-to-Trade Confirmation
  const confirmTrade = (tradeSetup) => {
    console.log('[Voice-to-Trade] Trade confirmed! Dispatching to Orders panel:', tradeSetup)

    // Dispatch trade setup to Orders panel
    window.dispatchEvent(new CustomEvent('ai-trade-setup', {
      detail: tradeSetup
    }))

    // Add confirmation message
    const confirmMsg = {
      role: 'assistant',
      content: `✅ Trade dispatched to Orders panel:

**${tradeSetup.symbol}** ${tradeSetup.side.toUpperCase()}
• Entry: $${tradeSetup.entry?.toFixed(2) || 'Market'}
• Stop Loss: $${tradeSetup.stopLoss?.toFixed(2) || 'None'}
• Target: $${tradeSetup.target?.toFixed(2) || 'None'}

Please review and submit the order in the Orders & Positions panel.`,
      timestamp: Date.now(),
      tradeConfirmed: true
    }

    setMessages(prev => [...prev, confirmMsg])

    // Speak confirmation
    speakResponse('Trade dispatched to orders panel. Please review and submit.')
  }

  // Premium Text-to-Speech: Natural human voice using ElevenLabs
  const speakResponse = async (text) => {
    try {
      // Clean markdown and special characters for TTS
      const cleanText = text
        .replace(/[*_~`#]/g, '') // Remove markdown
        .replace(/\n+/g, '. ') // Newlines to pauses
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/╔.*?╝/gs, '') // Remove box characters
        .replace(/[🔴🟢⚠️💡🧠🎯📊✅❌]/g, '') // Remove emojis
        .trim()

      if (!cleanText) {
        console.warn('🔊 No text to speak after cleaning')
        return
      }

      console.log('[TTS] Converting to premium voice:', cleanText.substring(0, 100) + '...')

      // Call premium TTS API (ElevenLabs Turbo v2.5)
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam - clear, professional male voice
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'TTS generation failed')
      }

      const { audio } = await response.json()

      // CRITICAL: Handle mobile Safari autoplay restrictions
      const playAudio = async (audioData) => {
        const audioElement = new Audio(audioData)
        audioElement.playbackRate = 1.1 // Slightly faster for efficiency

        audioElement.onended = () => {
          console.log('🔊 Premium speech finished')
          // REMOVED: Auto-restart voice input (unwanted on mobile - drains battery, privacy concern)
        }

        audioElement.onerror = (e) => {
          console.error('🔊 Audio playback error:', e)
        }

        try {
          await audioElement.play()
          setAudioUnlocked(true) // Mark as unlocked on successful playback
          console.log('🔊 Speaking with PREMIUM ElevenLabs voice (natural, human-like)')
        } catch (playError) {
          // MOBILE SAFARI AUTOPLAY BLOCKED - Store audio and show prompt
          if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
            console.warn('🔒 Audio autoplay blocked - showing unlock prompt')
            setPendingAudio(audioData)
            setShowAudioPrompt(true)
          } else {
            throw playError
          }
        }
      }

      // If on mobile Safari and audio not unlocked, try to unlock first
      if (isMobileSafari() && !audioUnlocked) {
        const unlocked = await unlockAudio()
        if (!unlocked) {
          // Store audio for later playback after user gesture
          setPendingAudio(audio)
          setShowAudioPrompt(true)
          return
        }
      }

      await playAudio(audio)

    } catch (error) {
      console.error('[TTS] Error:', error)
      // Fallback to browser TTS if premium fails (graceful degradation)
      console.warn('🔊 Falling back to browser TTS...')
      fallbackBrowserTTS(text)
    }
  }

  // Play pending audio (called when user taps "Enable Voice" prompt)
  // CRITICAL: Must be synchronous - iOS Safari requires audio.play() in user gesture handler
  const playPendingAudio = () => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog(prev => [...prev, `${timestamp} - 🔊 ENABLE VOICE CLICKED`])

    console.log('🔊 [DEBUG] ========== ENABLE VOICE CLICKED ==========')
    console.log('🔊 [DEBUG] pendingAudio exists:', !!pendingAudio)

    if (!pendingAudio) {
      setDebugLog(prev => [...prev, `${timestamp} - ❌ No pending audio`])
      console.error('🔊 [DEBUG] No pending audio to play!')
      setShowAudioPrompt(false)
      return
    }

    setDebugLog(prev => [...prev, `${timestamp} - ✅ Creating audio element...`])

    // CRITICAL: Create and play IMMEDIATELY - no async/await before play()
    // iOS Safari REQUIRES audio.play() to be called synchronously in click handler
    const audioElement = new Audio(pendingAudio)
    audioElement.playbackRate = 1.1

    audioElement.onended = () => {
      console.log('🔊 Premium speech finished')
      setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ✅ Audio finished`])
    }

    audioElement.onerror = (e) => {
      const errTime = new Date().toLocaleTimeString()
      console.error('[Voice] Audio playback error:', e)
      setDebugLog(prev => [...prev, `${errTime} - ❌ Audio error: ${e.type}`])
      setPendingAudio(null)
      setShowAudioPrompt(false)
      alert('❌ Audio failed. Try tapping mic button again.')
    }

    // Play IMMEDIATELY - synchronously in click handler
    console.log('[Voice] Calling audio.play() NOW (synchronously)...')
    setDebugLog(prev => [...prev, `${timestamp} - 🎵 Calling play()...`])

    const playPromise = audioElement.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('🔊 ✅ Playing with PREMIUM voice')
          setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ✅ Playback started!`])
          setPendingAudio(null)
          setShowAudioPrompt(false)
          setAudioUnlocked(true)
        })
        .catch(error => {
          const errTime = new Date().toLocaleTimeString()
          console.error('🔊 ❌ Playback failed:', error)
          setDebugLog(prev => [...prev, `${errTime} - ❌ Play failed: ${error.message}`])
          setPendingAudio(null)
          setShowAudioPrompt(false)

          // More helpful error message
          if (error.message.includes('not allowed')) {
            alert('❌ iPhone blocked audio. Try:\n1. Unmute your phone\n2. Check volume\n3. Reload page and try again')
          } else {
            alert(`❌ Audio error: ${error.message}`)
          }
        })
    }
  }

  // Fallback browser TTS (only if premium fails)
  const fallbackBrowserTTS = (text) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .replace(/╔.*?╝/gs, '')
      .replace(/[🔴🟢⚠️💡🧠🎯📊✅❌]/g, '')
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.1
    utterance.onend = () => {
      console.log('🔊 Fallback browser TTS finished')
      // REMOVED: Auto-restart voice input
    }

    window.speechSynthesis.speak(utterance)
    console.log('🔊 Using fallback browser TTS')
  }

  // Generate smart AI-powered suggested questions
  const generateSmartSuggestions = async () => {
    try {
      // Get last 2-3 messages for context
      const recentMessages = messages.slice(-4)
      if (recentMessages.length < 2) return // Need some conversation context

      // Build context summary
      const contextSummary = recentMessages.map(m => `${m.role}: ${m.content.substring(0, 200)}`).join('\n')
      const symbol = marketData.symbol || 'SPY'

      // Use GPT-5-nano for speed and cost efficiency
      const prompt = `Based on this trading conversation about ${symbol}, generate 4 intelligent follow-up questions the user might ask next. Make them specific, actionable, and predictive of where the conversation is heading.

Conversation context:
${contextSummary}

Return ONLY a JSON array of 4 short questions (max 60 chars each), no explanations:
["question1", "question2", "question3", "question4"]`

      const result = await callAI('gpt-5-nano', [
        { role: 'user', content: prompt }
      ], {
        temperature: 0.8,
        max_tokens: 150,
        cache: false
      })

      // Parse JSON response
      const questions = JSON.parse(result.content.trim())
      if (Array.isArray(questions) && questions.length > 0) {
        setSmartSuggestions(questions.slice(0, 4))
      }
    } catch (error) {
      console.error('Failed to generate smart suggestions:', error)
      // Silently fail - not critical feature
    }
  }

  // Handle transcript from mobile push-to-talk
  const handleMobileTranscript = (transcript) => {
    console.log('[Mobile Push-to-Talk] Received transcript:', transcript)
    setInput(transcript)
    // Auto-submit after a short delay
    setTimeout(() => {
      const submitEvent = { preventDefault: () => {} }
      handleSubmit(submitEvent)
    }, 100)
  }

  const handleSubmit = async (e) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog(prev => [...prev, `${timestamp} - Form submit triggered`])

    console.log('🔵 [DEBUG] Form submit triggered!')
    console.log('🔵 [DEBUG] Event:', e)
    console.log('🔵 [DEBUG] Input value:', input)
    console.log('🔵 [DEBUG] isTyping:', isTyping)

    e.preventDefault()

    if ((!input.trim() && uploadedFiles.length === 0) || isTyping) {
      setDebugLog(prev => [...prev, `${timestamp} - Submit BLOCKED (empty or typing)`])
      console.log('🔴 [DEBUG] Submit blocked - empty input or already typing')
      return
    }

    setDebugLog(prev => [...prev, `${timestamp} - Submit PROCEEDING`])
    console.log('🟢 [DEBUG] Submit proceeding...')

    // CRITICAL: Unlock audio on mobile Safari (user gesture required)
    if (isMobileSafari()) {
      await unlockAudio()
    }

    // CRITICAL: Warn if chart data not loaded (unless asking general questions or uploading files)
    const hasUploadedImages = uploadedFiles.some(f => f.isImage)
    const isChartQuery = input.toLowerCase().match(/\b(chart|price|score|unicorn|trend|ema|saty|support|resistance|entry|stop|target|trade)\b/)
    if (isChartQuery && !hasUploadedImages && !hasRealData && !marketData.bars?.length) {
      const warningMsg = {
        role: 'assistant',
        content: '⚠️ **Chart data not loaded yet**\n\nI need live chart data to answer technical questions accurately. Please:\n1. Load a symbol on the Chart tab (Tab #1)\n2. Wait for the chart to finish loading\n3. Then ask your question\n\nOr upload a chart screenshot for analysis instead!',
        timestamp: Date.now(),
        warning: true
      }
      setMessages(prev => [...prev, warningMsg])
      setInput('')
      return
    }

    const userMessage = {
      role: 'user',
      content: input.trim() || '(See attached files)',
      timestamp: Date.now(),
      files: uploadedFiles.length > 0 ? uploadedFiles.map(f => ({
        name: f.name,
        type: f.type,
        isImage: f.isImage
      })) : undefined
    }

    setMessages(prev => [...prev, userMessage])
    const currentFiles = [...uploadedFiles]
    setInput('')
    setUploadedFiles([]) // Clear files after sending
    setIsTyping(true)

    // Save pending request for background processing
    localStorage.setItem('iava_pending_request', JSON.stringify({
      input: userMessage.content,
      timestamp: Date.now()
    }))

    try {
      // PhD++ SIMPLIFIED: Auto-detect symbols when explicitly mentioned ($AAPL or Apple (AAPL))
      // No more aggressive pattern matching, no LLM validation - simple and reliable!
      const detectedSymbols = detectSymbols(userMessage.content)
      const detectedTimeframe = detectTimeframe(userMessage.content)

      if (detectedSymbols.length > 0) {
        console.log('[AI Chat] ✅ Detected symbols:', detectedSymbols, 'Timeframe:', detectedTimeframe)
      }

      // If user mentions a different symbol, load it automatically
      if (detectedSymbols.length > 0) {
        const newSymbol = detectedSymbols[0]
        const currentSymbol = marketData.symbol?.toUpperCase()

        if (newSymbol !== currentSymbol) {
          console.log(`[AI Chat] Auto-loading new symbol: ${newSymbol} (current: ${currentSymbol})`)

          // Show loading message
          const loadingMsg = {
            role: 'assistant',
            content: `🔄 Loading ${newSymbol} chart data for analysis...`,
            timestamp: Date.now()
          }
          setMessages(prev => [...prev, loadingMsg])

          // Load the symbol
          const loaded = await loadSymbolForAnalysis(newSymbol, detectedTimeframe)

          if (!loaded) {
            // Failed to load - update loading message
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: `⚠️ Could not load ${newSymbol} data. Analyzing based on general knowledge...`,
                warning: true
              }
              return updated
            })
          } else {
            // Successfully loaded - remove loading message
            setMessages(prev => prev.slice(0, -1))
          }
        }
      }

      // Determine if we need vision model (for chart screenshots)
      const hasImages = currentFiles.some(f => f.isImage)
      const hasDocuments = currentFiles.some(f => f.isPDF || f.isText)

      // Debug: Log market data to verify connection
      console.log('AI Chat Market Data:', {
        symbol: marketData.symbol,
        hasRealData,
        scoreAvailable: !!marketData.signalState?.score,
        barsCount: marketData.bars?.length || 0,
        currentPrice: marketData.currentPrice,
        hasImages,
        hasDocuments,
        filesCount: currentFiles.length
      })

      // Build world-class trading context from actual market data with FULL access
      const enrichedContext = await buildMarketContext({
        symbol: marketData.symbol || 'SPY',
        currentPrice: marketData.currentPrice,
        bars: marketData.bars || [],
        timeframe: marketData.timeframe || '1Min',
        overlays: marketData.overlays || {}, // Pass ALL overlays (SATY, Squeeze, EMA, Ichimoku)
        signalState: marketData.signalState || {}, // Pass full signal state with components
        indicators: {
          score: marketData.signalState?.score,
          emaCloudNow: marketData.signalState?.emaCloudNow,
          pivotNow: marketData.signalState?.pivotNow,
          ichiRegime: marketData.signalState?.ichiRegime,
          satyLevels: marketData.overlays?.saty ? {
            support: marketData.overlays.saty.levels?.t0236?.dn,
            resistance: marketData.overlays.saty.levels?.t1000?.up
          } : null,
          components: marketData.signalState?.components
        },
        regime: marketData.dailyState ? {
          type: (marketData.dailyState.pivotNow === 'bullish' && marketData.dailyState.ichiRegime === 'bullish') ? 'bull' :
                (marketData.dailyState.pivotNow === 'bearish' && marketData.dailyState.ichiRegime === 'bearish') ? 'bear' : 'neutral',
          strength: 'moderate',
          dailyData: marketData.dailyState // Include full daily data for multi-timeframe analysis
        } : null,
        enforceDaily: marketData.enforceDaily,
        consensus: marketData.consensus
      })

      // ELITE PhD++: Build enhanced context with Multi-Timeframe analysis
      let multiTFContext = null
      try {
        const symbol = marketData.symbol || 'SPY'
        console.log('[AI Chat] Building enhanced multi-TF context for:', symbol)

        const enhancedData = await buildEnhancedContext(marketData, symbol, {
          includeMultiTF: true,        // Always include multi-TF analysis
          includeSentiment: false      // Only include sentiment if explicitly requested (to save API calls)
        })

        multiTFContext = formatEnhancedContext(enhancedData)
        console.log('[AI Chat] Multi-TF context built successfully')
      } catch (error) {
        console.warn('[AI Chat] Multi-TF context build failed:', error)
        // Continue without multi-TF context - graceful degradation
      }

      // Generate PhD-level system prompt
      const systemPrompt = generateTradingSystemPrompt()

      // Format context for AI
      const contextText = formatContextForAI(enrichedContext)

      const chatHistory = messages.slice(-6) // Last 3 exchanges for context

      // Build user message - Vercel AI SDK format supports vision!
      let userContent

      if (hasImages) {
        // Use multi-part content format for Vercel AI SDK (supports vision in GPT-5!)
        userContent = []

        // Add text part
        let textContent = input.trim() || 'Analyze this chart screenshot. Identify key support/resistance levels, trend direction, volume patterns, and any notable technical setups. Provide actionable insights.'

        // Add document text if present
        if (hasDocuments) {
          const docContext = currentFiles
            .filter(f => f.isText)
            .map(f => `\n\n=== Document: ${f.name} ===\n${atob(f.base64.split(',')[1])}`)
            .join('\n')
          textContent += docContext
        }

        userContent.push({ type: 'text', text: textContent })

        // Add all images (Vercel AI SDK format: type 'image' with base64 data)
        currentFiles.forEach(file => {
          if (file.isImage) {
            userContent.push({
              type: 'image',
              image: file.base64 // Vercel AI SDK accepts data:image/...;base64,... format
            })
          }
        })
      } else {
        // Text-only message
        let textContent = input.trim() || 'Analyze the attached files and provide insights.'

        // Add documents
        if (hasDocuments) {
          const docContext = currentFiles
            .filter(f => f.isText)
            .map(f => `\n\n=== Document: ${f.name} ===\n${atob(f.base64.split(',')[1])}`)
            .join('\n')
          textContent += docContext
        }

        userContent = textContent
      }

      // CRITICAL: Add verification footer with actual numbers INCLUDING SATY/ATR
      const verificationFooter = `
⚠️ CRITICAL ACCURACY REQUIREMENT ⚠️
You MUST use these EXACT numbers from the live data above:
- Unicorn Score: ${enrichedContext.unicornScore?.current || 'N/A'}
- Symbol: ${enrichedContext.symbol}
- Price: ${enrichedContext.price?.formatted || 'N/A'}
- EMA Cloud: ${enrichedContext.emaCloud?.status || 'N/A'}
- Pivot: ${enrichedContext.pivotRibbon?.status || 'N/A'}
- Ichimoku: ${enrichedContext.ichimoku?.regime || 'N/A'}

🔴 YOU HAVE SATY DATA - USE IT! 🔴
${enrichedContext.satyLevels ? `- SATY t0236 (Stop Zone): $${enrichedContext.satyLevels.t0236_dn?.toFixed(2)} - $${enrichedContext.satyLevels.t0236_up?.toFixed(2)}
- SATY t1000 (Target Zone): $${enrichedContext.satyLevels.t1000_dn?.toFixed(2)} - $${enrichedContext.satyLevels.t1000_up?.toFixed(2)}
- ATR: $${enrichedContext.satyLevels.atr?.toFixed(2)}
- EMA 8: $${enrichedContext.emaValues?.ema8?.toFixed(2) || 'N/A'}, EMA 21: $${enrichedContext.emaValues?.ema21?.toFixed(2) || 'N/A'}
- TTM Squeeze: ${enrichedContext.ttmSqueeze?.inSqueeze ? 'ACTIVE' : 'RELEASED'} (Momentum: ${enrichedContext.ttmSqueeze?.momentum?.toFixed(2) || 'N/A'})

✅ YOU CAN COMPUTE iAVA R:R - YOU HAVE ALL THE DATA REQUIRED!
- Formula: Long Stop = SATY t0236 down - (1 × ATR) = $${enrichedContext.satyLevels.t0236_dn?.toFixed(2)} - $${enrichedContext.satyLevels.atr?.toFixed(2)} = $${(enrichedContext.satyLevels.t0236_dn - enrichedContext.satyLevels.atr)?.toFixed(2)}
- Formula: Long Target = SATY t1000 up = $${enrichedContext.satyLevels.t1000_up?.toFixed(2)}
- Current Price = ${enrichedContext.price?.formatted}` : '⚠️ SATY data not available for this symbol - load a symbol with SATY overlay enabled'}

NEVER say "I don't have ATR" or "I don't have SATY levels" - YOU DO HAVE THEM (see above).
NEVER guess or approximate numbers. If you cite a number, it MUST match the data above EXACTLY.
If you're uncertain about any metric, say "I don't have that data" rather than guessing.`

      // Build comprehensive market data context with Multi-TF analysis
      let fullMarketContext = `CURRENT MARKET DATA:\n\n${contextText}`

      // Add Multi-Timeframe Analysis if available
      if (multiTFContext) {
        fullMarketContext += `\n\n═══════════════════════════════════════════════════\n`
        fullMarketContext += `🎯 MULTI-TIMEFRAME ANALYSIS (PhD++ Professional)\n`
        fullMarketContext += `═══════════════════════════════════════════════════\n\n`
        fullMarketContext += multiTFContext
        fullMarketContext += `\n\n⚠️ CRITICAL: You MUST reference the Multi-TF analysis in your response!\n`
        fullMarketContext += `This gives you the COMPLETE PICTURE across all timeframes (1Min → Daily).\n`
        fullMarketContext += `Never analyze just the current timeframe in isolation - always consider the multi-TF consensus.\n`
      }

      fullMarketContext += `\n\n${verificationFooter}`

      const aiMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: fullMarketContext },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userContent }
      ]

      // GPT-5 supports vision! Use GPT-5-mini for speed or GPT-5 for quality
      const model = hasImages ? 'gpt-5-mini' : 'gpt-5' // gpt-5-mini faster for vision
      const maxTokens = hasImages ? 600 : 300

      console.log('[AI Chat] Using model:', model, 'with files:', currentFiles.length)
      console.log('[AI Chat] Live Data Check:', {
        score: enrichedContext.unicornScore?.current,
        symbol: enrichedContext.symbol,
        price: enrichedContext.price?.current
      })

      const result = await callAI(model, aiMessages, {
        temperature: 0.1, // LOW temp for factual accuracy - no hallucinations!
        max_tokens: maxTokens,
        cache: false
      })

      const assistantMessage = {
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
        cost: result.cost,
        latency: result.latency
      }

      // PhD++ ELITE FIX: Store response GLOBALLY first (survives component unmount)
      try {
        const currentHistory = JSON.parse(localStorage.getItem('iava_chat_history') || '{"messages":[]}')
        const updatedMessages = [...currentHistory.messages, assistantMessage]

        localStorage.setItem('iava_chat_history', JSON.stringify({
          messages: updatedMessages,
          timestamp: Date.now()
        }))
        localStorage.removeItem('iava_pending_request') // Clear pending since response is saved
        console.log('[AI Chat] ✅ AI response persisted GLOBALLY (survives unmount)')
      } catch (e) {
        console.error('[AI Chat] Failed to persist globally:', e)
      }

      // Now update component state (only works if still mounted)
      setMessages(prev => [...prev, assistantMessage])

      // ELITE FEATURE: Detect trade recommendations for voice-to-trade
      const tradeSetup = parseTradeSetup(result.content)
      if (tradeSetup && tradeSetup.entry) {
        console.log('[Voice-to-Trade] Trade recommendation detected:', tradeSetup)

        if (trustMode) {
          // TRUST MODE ENABLED: Execute trade INSTANTLY without confirmation
          console.log('[Voice-to-Trade] Trust Mode ACTIVE - Executing trade instantly:', tradeSetup)
          setTimeout(() => confirmTrade(tradeSetup), 500) // Small delay for UX
          assistantMessage.tradeSetup = tradeSetup
          assistantMessage.tradeConfirmed = true // Mark as already confirmed
        } else {
          // SAFE MODE: Request user confirmation
          assistantMessage.tradeSetup = tradeSetup
          assistantMessage.awaitingTradeConfirmation = true
        }
      }

      // Speak the response (if not an error)
      setTimeout(() => speakResponse(result.content), 100)

      // Generate smart suggestions after AI responds
      setTimeout(() => generateSmartSuggestions(), 500)

    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: Date.now(),
        error: true
      }
      // Save error globally too
      try {
        const currentHistory = JSON.parse(localStorage.getItem('iava_chat_history') || '{"messages":[]}')
        localStorage.setItem('iava_chat_history', JSON.stringify({
          messages: [...currentHistory.messages, errorMessage],
          timestamp: Date.now()
        }))
        localStorage.removeItem('iava_pending_request')
      } catch (e) {
        console.error('[AI Chat] Failed to persist error globally:', e)
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // Dynamic suggested questions based on current symbol
  const currentSymbol = marketData.symbol || 'SPY'
  const hasRealData = !marketData.usingSample && marketData.bars?.length > 0

  const suggestedQuestions = [
    `Should I buy ${currentSymbol}?`,
    `What's the current market regime for ${currentSymbol}?`,
    `Analyze ${currentSymbol} technical setup`,
    "What's the Unicorn Score telling me?",
    "📸 Upload chart for AI analysis"
  ]

  return (
    <div className="glass-panel flex flex-col overflow-hidden" style={{ height: 'clamp(500px, 750px, 90vh)' }}>
      {/* Premium Header with animated background */}
      <div className="panel-header">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
        <div className="relative flex items-center gap-4">
          {/* Icon with glow effect */}
          <span className="panel-icon" style={{ fontSize: 'var(--text-3xl)' }}>🤖</span>
          <div className="flex-1">
            <h3 className="font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-300 bg-clip-text text-transparent" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>
              AI Assistant
            </h3>
            <p className="text-slate-400 flex items-center gap-2 mt-1" style={{ fontSize: 'var(--text-xs)' }}>
              <span className={`w-2 h-2 rounded-full ${hasRealData ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span style={{ fontWeight: 'var(--font-semibold)' }}>
                {hasRealData
                  ? `Live Data: ${currentSymbol} • ${marketData.timeframe}`
                  : 'Sample Data • Load chart for live analysis'}
              </span>
              <span className="text-slate-500">• Chat persisted 24h</span>
            </p>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={toggleTrustMode}
              className={`btn-sm ${
                trustMode
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-lg shadow-emerald-500/50 pulse-ring'
                  : 'btn-ghost'
              }`}
              title={trustMode ? 'Trust Mode ON - Trades execute instantly!' : 'Trust Mode OFF - Trades require confirmation'}
            >
              {trustMode ? '⚡ Trust Mode' : '🛡️ Safe Mode'}
            </button>
            <button
              onClick={exportChat}
              className="btn-tertiary btn-sm"
              title="Export chat to clipboard"
            >
              📋 Export
            </button>
            <button
              onClick={clearChat}
              className="btn-ghost btn-sm"
              title="Clear chat history"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      {/* CRITICAL: Mobile Safari Audio Unlock Prompt */}
      {showAudioPrompt && pendingAudio && (
        <div className="mx-4 mt-4 mb-2 p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 rounded-lg relative" style={{ zIndex: 20 }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold text-indigo-300 mb-1">🔊 Voice Ready</div>
              <div className="text-xs text-slate-300">Tap to enable premium voice playback</div>
            </div>
            <button
              onClick={playPendingAudio}
              onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
              className="btn-success btn-sm flex items-center gap-2 relative"
              style={{ zIndex: 21, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <span>🔓</span>
              <span>Enable Voice</span>
            </button>
          </div>
        </div>
      )}

      {/* Premium Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Premium message bubble with glow effect */}
            <div className="relative group max-w-[80%]">
              {/* Hover glow effect */}
              <div className={`absolute inset-0 ${
                msg.role === 'user' ? 'bg-indigo-600' :
                msg.error ? 'bg-rose-600' : 'bg-cyan-600'
              } blur-xl opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl`} />

              <div
                className={`relative rounded-2xl p-4 shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600/30 to-indigo-500/20 border border-indigo-500/40 text-slate-200'
                    : msg.error
                    ? 'bg-gradient-to-r from-rose-500/20 to-rose-600/10 border border-rose-500/40 text-rose-300'
                    : 'bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm text-slate-300'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* Show attached files */}
                {msg.files && msg.files.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700/30">
                    <div className="flex flex-wrap gap-1.5">
                      {msg.files.map((file, fileIdx) => (
                        <div key={fileIdx} className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/30 rounded text-xs">
                          <span>{file.isImage ? '🖼️' : '📄'}</span>
                          <span className="text-slate-400">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.cost != null && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/30">
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <span>💰</span>
                      <span className="font-semibold">
                        ${typeof msg.cost === 'number' ? msg.cost.toFixed(4) : msg.cost.totalCost?.toFixed(4) || '0.0000'}
                      </span>
                    </div>
                    {msg.latency != null && (
                      <div className="flex items-center gap-1 text-xs text-cyan-400">
                        <span>⚡</span>
                        <span className="font-semibold">{msg.latency}ms</span>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Response Actions - only for assistant messages */}
                {msg.role === 'assistant' && !msg.error && (
                  <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2">
                    {/* ELITE: Voice-to-Trade - Ask for confirmation */}
                    {msg.awaitingTradeConfirmation && msg.tradeSetup && !msg.tradeConfirmed && (
                      <div className="space-y-2">
                        <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg">
                          <div className="text-xs text-emerald-400 font-semibold mb-2">🎙️ Voice-to-Trade Ready</div>
                          <div className="text-sm text-slate-300">
                            Say <span className="font-bold text-emerald-400">"Yes"</span> or <span className="font-bold text-emerald-400">"Confirm"</span> to place this trade
                          </div>
                        </div>
                        <button
                          onClick={() => confirmTrade(msg.tradeSetup)}
                          className="btn-success w-full flex items-center justify-center gap-2 pulse-ring"
                        >
                          <span>✅</span>
                          <span>Confirm Trade</span>
                          <span className="text-emerald-200">({msg.tradeSetup.symbol} {msg.tradeSetup.side})</span>
                        </button>
                      </div>
                    )}

                    {/* Regular Trade Setup Button - for messages without voice confirmation */}
                    {!msg.awaitingTradeConfirmation && !msg.tradeConfirmed && (() => {
                      const setup = parseTradeSetup(msg.content)
                      if (setup && setup.entry) {
                        return (
                          <button
                            onClick={() => executeTradeSetup(setup)}
                            className="btn-success w-full flex items-center justify-center gap-2"
                          >
                            <span>📊</span>
                            <span>Trade This Setup</span>
                            <span className="text-emerald-200">({setup.symbol} {setup.side})</span>
                          </button>
                        )
                      }
                    })()}

                    {/* Follow-up Questions */}
                    {(() => {
                      const followUps = generateFollowUpQuestions(msg.content)
                      if (followUps.length > 0) {
                        return (
                          <div className="space-y-2">
                            <div className="text-slate-500" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>Ask follow-up:</div>
                            <div className="flex flex-wrap gap-2">
                              {followUps.map((q, qIdx) => (
                                <button
                                  key={qIdx}
                                  onClick={async () => {
                                    // Special handling for backtest request
                                    if (q.toLowerCase().includes('backtest')) {
                                      runBacktestAnalysis(msg.content)
                                    }
                                    // Special handling for similar setups request
                                    else if (q.toLowerCase().includes('similar')) {
                                      findSimilarSetups(msg.content)
                                    }
                                    // Special handling for "Load [SYMBOL]" buttons - AUTO-LOAD AND ANALYZE
                                    else if (q.match(/^Load ([A-Z]{1,5})/i)) {
                                      const symbolMatch = q.match(/^Load ([A-Z]{1,5})/i)
                                      const symbol = symbolMatch[1].toUpperCase()

                                      setIsTyping(true)
                                      const loadingMsg = {
                                        role: 'assistant',
                                        content: `🔄 Loading ${symbol} and analyzing...`,
                                        timestamp: Date.now()
                                      }
                                      setMessages(prev => [...prev, loadingMsg])

                                      // Trigger symbol load
                                      const loaded = await loadSymbolForAnalysis(symbol)

                                      if (loaded) {
                                        // Wait a bit for context to update, then ask AI to analyze
                                        setTimeout(() => {
                                          setInput(`Analyze ${symbol} - give me the full breakdown: Unicorn Score, exact entry/stop/target levels, EMA status, Ichimoku analysis, TTM Squeeze, and trade recommendation.`)
                                          setTimeout(() => {
                                            const form = document.querySelector('form')
                                            form?.requestSubmit()
                                          }, 200)
                                        }, 500)
                                      } else {
                                        setMessages(prev => {
                                          const updated = [...prev]
                                          updated[updated.length - 1] = {
                                            ...updated[updated.length - 1],
                                            content: `❌ Failed to load ${symbol}. Please try manually loading it on the chart.`,
                                            error: true
                                          }
                                          return updated
                                        })
                                        setIsTyping(false)
                                      }
                                    }
                                    // Default: fill input and auto-submit
                                    else {
                                      setInput(q)
                                      // Auto-submit after a short delay to let user see it
                                      setTimeout(() => {
                                        const form = document.querySelector('form')
                                        form?.requestSubmit()
                                      }, 300)
                                    }
                                  }}
                                  className={`btn-xs ${
                                    q.toLowerCase().includes('backtest')
                                      ? 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 hover:border-emerald-400/50 text-emerald-300'
                                      : q.toLowerCase().includes('similar')
                                      ? 'bg-cyan-600/20 hover:bg-cyan-600/30 border-cyan-500/40 hover:border-cyan-400/50 text-cyan-300'
                                      : q.match(/^Load [A-Z]{1,5}/i)
                                      ? 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 hover:border-purple-400/50 text-purple-300'
                                      : 'bg-slate-700/50 hover:bg-indigo-600/30 border-slate-600/50 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200'
                                  } border`}
                                  style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)' }}
                                >
                                  {q.toLowerCase().includes('backtest') && '🔬 '}
                                  {q.toLowerCase().includes('similar') && '🔍 '}
                                  {q.match(/^Load [A-Z]{1,5}/i) && '📊 '}
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Premium typing indicator with spinner */}
        {isTyping && (
          <div className="flex justify-start fade-in">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-10 rounded-2xl" />
              <div className="relative bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="spinner-gradient" />
                  <div className="dots-loader text-cyan-400">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="text-sm text-slate-400 loading-text">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Smart AI-Powered Suggested Questions */}
      {((messages.length <= 1 && suggestedQuestions.length > 0) || smartSuggestions.length > 0) && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-slate-400 mb-3" style={{ fontSize: 'var(--text-xs)' }}>
            <span style={{ fontSize: 'var(--text-base)' }}>{smartSuggestions.length > 0 ? '🧠' : '💡'}</span>
            <span className="uppercase tracking-wider" style={{ fontWeight: 'var(--font-semibold)' }}>
              {smartSuggestions.length > 0 ? 'Smart Suggestions' : 'Suggested Questions'}
            </span>
            {smartSuggestions.length > 0 && (
              <span className="text-emerald-400 ml-1" style={{ fontSize: 'var(--text-xs)' }}>• AI-Predicted</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(smartSuggestions.length > 0 ? smartSuggestions : suggestedQuestions).map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className={`relative group px-3 py-2 ${
                  smartSuggestions.length > 0
                    ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 hover:from-emerald-600/30 hover:to-cyan-600/30 border-emerald-500/40 hover:border-emerald-400/50 text-emerald-300 hover:text-emerald-200'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200'
                } border shadow-lg hover:shadow-emerald-500/10`}
                style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)' }}
              >
                {smartSuggestions.length === 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity" style={{ borderRadius: 'var(--radius-lg)' }} />
                )}
                <span className="relative">{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Premium Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50 bg-slate-900/30 backdrop-blur-sm relative" style={{ zIndex: 30 }}>
        {/* File Preview Area */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg">
                  {file.isImage && file.preview && (
                    <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded" />
                  )}
                  {!file.isImage && (
                    <span className="text-2xl">
                      {file.isPDF ? '📄' : '📋'}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-300 truncate max-w-[150px]">
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary btn-icon"
            title="Upload chart screenshot or document"
          >
            <span style={{ fontSize: 'var(--text-xl)' }}>📎</span>
          </button>

          {/* Voice Input Button - ALL PLATFORMS */}
          <button
            type="button"
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            className={`btn-icon relative ${
              isListening
                ? 'bg-rose-600/20 border-rose-500/40 animate-pulse'
                : 'btn-secondary'
            }`}
            style={{ zIndex: 2, touchAction: 'manipulation' }}
            title={isListening ? 'Stop recording' : 'Voice input'}
          >
            <span style={{ fontSize: 'var(--text-xl)' }}>{isListening ? '🔴' : '🎤'}</span>
          </button>

          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-focus-within:opacity-10 transition-opacity blur-xl pointer-events-none" style={{ borderRadius: 'var(--radius-xl)' }} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about markets, upload chart screenshots, or share documents..."
              className="input relative w-full px-4 py-3 bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 text-slate-200 placeholder-slate-500 shadow-lg"
              style={{ borderRadius: 'var(--radius-xl)', fontSize: 'var(--text-sm)', zIndex: 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              disabled={isTyping}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
            />
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && uploadedFiles.length === 0) || isTyping}
            className="btn-primary relative"
            style={{ zIndex: 2, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            {isTyping ? (
              <div className="flex items-center gap-2">
                <div className="spinner-sm" />
                <span>Thinking...</span>
              </div>
            ) : (
              <>
                <span>Send</span>
                <span style={{ fontSize: 'var(--text-lg)' }}>→</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ELITE: Mobile Push-to-Talk Interface - DISABLED (using inline mic instead) */}
      {/* <MobilePushToTalk
        onTranscript={handleMobileTranscript}
        isListening={isListening}
      /> */}

    </div>
  )
}
