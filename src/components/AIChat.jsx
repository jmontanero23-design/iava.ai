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

export default function AIChat() {
  const { marketData } = useMarketData()

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
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('iava_chat_history', JSON.stringify({
      messages,
      timestamp: Date.now()
    }))
  }, [messages])

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

  // Parse trade setup from AI response
  const parseTradeSetup = (content) => {
    // Extract symbol, entry, stop, target from AI response
    // Look for patterns like: "entry at $185", "stop $184", "target 206"
    const symbolMatch = content.match(/\b([A-Z]{1,5})\b.*?(?:entry|buy|sell|long|short)/i)
    const entryMatch = content.match(/(?:entry|buy|long).*?\$?(\d+\.?\d*)/i)
    const stopMatch = content.match(/(?:stop|stop loss|risk).*?\$?(\d+\.?\d*)/i)
    const targetMatch = content.match(/(?:target|take profit|tp).*?\$?(\d+\.?\d*)/i)
    const sideMatch = content.match(/\b(long|short|buy|sell)\b/i)

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

    // If AI mentioned a setup, suggest deeper analysis
    if (content.match(/(?:bullish|bearish|setup|entry|target)/i)) {
      questions.push('Run backtest on this setup')
      questions.push('What\'s the historical win rate?')
      questions.push('Show me similar setups')
    }

    // If AI mentioned levels, ask about risk
    if (content.match(/(?:support|resistance|stop|target)/i)) {
      questions.push('What\'s the risk/reward ratio?')
      questions.push('Size this position for 1% risk')
    }

    // If AI mentioned regime, ask about context
    if (content.match(/(?:regime|trend|bullish|bearish)/i)) {
      questions.push('How does this compare to daily timeframe?')
      questions.push('What other stocks show this pattern?')
    }

    return questions.slice(0, 3) // Max 3 follow-ups
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

  // Find similar setups using NLP Scanner
  const findSimilarSetups = async (messageContent) => {
    try {
      setIsTyping(true)

      // Extract trading intent from message
      const query = messageContent.match(/(?:bullish|bearish|breakout|pullback|reversal|momentum)/gi)?.join(' ') || 'bullish momentum'

      // Call NLP scanner API
      const response = await fetch('/api/ai/nlp-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()

      // Format scanner results
      const results = data.results?.slice(0, 5) || []
      const scannerSummary = `
🔍 **SIMILAR SETUPS FOUND** (${results.length} matches)

${results.map((r, i) => `${i + 1}. **${r.symbol}** - $${r.price?.toFixed(2) || 'N/A'}
   • Unicorn Score: ${r.score}/100
   • ${r.emaCloud} EMA, ${r.pivot} Pivot, ${r.ichi} Ichi
   • Match: ${r.reasoning || 'Similar pattern detected'}`).join('\n\n')}

💡 Click any symbol above to load its chart!`

      // Add scanner results to chat
      const scannerMessage = {
        role: 'assistant',
        content: scannerSummary,
        timestamp: Date.now(),
        isScanner: true,
        results: results // Store for potential click actions
      }

      setMessages(prev => [...prev, scannerMessage])

    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ Scanner failed: ${error.message}`,
        timestamp: Date.now(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

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

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('❌ Voice input not supported in this browser. Try Chrome/Edge.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      console.log('🎤 Voice recognition started')
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      console.log('🎤 Heard:', transcript)
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      console.error('🎤 Error:', event.error)
      setIsListening(false)
      alert(`❌ Voice error: ${event.error}`)
    }

    recognition.onend = () => {
      setIsListening(false)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ((!input.trim() && uploadedFiles.length === 0) || isTyping) return

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

    try {
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

      // Build world-class trading context from actual market data
      const enrichedContext = await buildMarketContext({
        symbol: marketData.symbol || 'SPY',
        currentPrice: marketData.currentPrice,
        bars: marketData.bars || [],
        indicators: {
          score: marketData.signalState?.score,
          emaCloudNow: marketData.signalState?.emaCloudNow,
          pivotNow: marketData.signalState?.pivotNow,
          ichiRegime: marketData.signalState?.ichiRegime,
          satyLevels: marketData.overlays?.saty ? {
            support: marketData.overlays.saty.levels?.[0],
            resistance: marketData.overlays.saty.levels?.[2]
          } : null,
          components: marketData.signalState?.components
        },
        regime: marketData.dailyState ? {
          type: (marketData.dailyState.pivotNow === 'bullish' && marketData.dailyState.ichiRegime === 'bullish') ? 'bull' :
                (marketData.dailyState.pivotNow === 'bearish' && marketData.dailyState.ichiRegime === 'bearish') ? 'bear' : 'neutral',
          strength: 'moderate'
        } : null,
        timeframe: marketData.timeframe,
        enforceDaily: marketData.enforceDaily,
        consensus: marketData.consensus
      })

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

      const aiMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `CURRENT MARKET DATA:\n\n${contextText}` },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userContent }
      ]

      // GPT-5 supports vision! Use GPT-5-mini for speed or GPT-5 for quality
      const model = hasImages ? 'gpt-5-mini' : 'gpt-5' // gpt-5-mini faster for vision
      const maxTokens = hasImages ? 600 : 300

      console.log('[AI Chat] Using model:', model, 'with files:', currentFiles.length)

      const result = await callAI(model, aiMessages, {
        temperature: 0.7,
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

      setMessages(prev => [...prev, assistantMessage])

      // Generate smart suggestions after AI responds
      setTimeout(() => generateSmartSuggestions(), 500)

    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: Date.now(),
        error: true
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
    <div className="glass-panel flex flex-col h-[600px] overflow-hidden">
      {/* Premium Header with animated background */}
      <div className="p-5 border-b border-slate-700/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="relative flex items-center gap-3">
          {/* Icon with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 blur-xl opacity-50 animate-pulse" />
            <span className="relative text-3xl filter drop-shadow-lg">🤖</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
              AI Assistant
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${hasRealData ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className="font-semibold">
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
              onClick={exportChat}
              className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-indigo-500/20 border border-slate-700/50 hover:border-indigo-500/40 rounded-lg text-slate-400 hover:text-indigo-400 transition-all"
              title="Export chat to clipboard"
            >
              📋 Export
            </button>
            <button
              onClick={clearChat}
              className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-rose-500/20 border border-slate-700/50 hover:border-rose-500/40 rounded-lg text-slate-400 hover:text-rose-400 transition-all"
              title="Clear chat history"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

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
                    {/* Trade Setup Button - only if AI mentioned trading levels */}
                    {(() => {
                      const setup = parseTradeSetup(msg.content)
                      if (setup) {
                        return (
                          <button
                            onClick={() => executeTradeSetup(setup)}
                            className="w-full px-3 py-2 text-xs bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
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
                          <div className="space-y-1.5">
                            <div className="text-xs text-slate-500 font-semibold">Ask follow-up:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {followUps.map((q, qIdx) => (
                                <button
                                  key={qIdx}
                                  onClick={() => {
                                    // Special handling for backtest request
                                    if (q.toLowerCase().includes('backtest')) {
                                      runBacktestAnalysis(msg.content)
                                    }
                                    // Special handling for similar setups request
                                    else if (q.toLowerCase().includes('similar')) {
                                      findSimilarSetups(msg.content)
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
                                  className={`px-2.5 py-1 text-xs ${
                                    q.toLowerCase().includes('backtest')
                                      ? 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 hover:border-emerald-400/50 text-emerald-300'
                                      : q.toLowerCase().includes('similar')
                                      ? 'bg-cyan-600/20 hover:bg-cyan-600/30 border-cyan-500/40 hover:border-cyan-400/50 text-cyan-300'
                                      : 'bg-slate-700/50 hover:bg-indigo-600/30 border-slate-600/50 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200'
                                  } border rounded-lg transition-all`}
                                >
                                  {q.toLowerCase().includes('backtest') && '🔬 '}
                                  {q.toLowerCase().includes('similar') && '🔍 '}
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

        {/* Premium typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-10 rounded-2xl" />
              <div className="relative bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-400 to-cyan-400 rounded-full animate-pulse" />
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
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
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2.5">
            <span className="text-base">{smartSuggestions.length > 0 ? '🧠' : '💡'}</span>
            <span className="font-semibold uppercase tracking-wider">
              {smartSuggestions.length > 0 ? 'Smart Suggestions' : 'Suggested Questions'}
            </span>
            {smartSuggestions.length > 0 && (
              <span className="text-xs text-emerald-400 ml-1">• AI-Predicted</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(smartSuggestions.length > 0 ? smartSuggestions : suggestedQuestions).map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className={`relative group px-3 py-2 text-xs font-medium ${
                  smartSuggestions.length > 0
                    ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 hover:from-emerald-600/30 hover:to-cyan-600/30 border-emerald-500/40 hover:border-emerald-400/50 text-emerald-300 hover:text-emerald-200'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200'
                } border rounded-lg transition-all shadow-lg hover:shadow-emerald-500/10`}
              >
                {smartSuggestions.length === 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                )}
                <span className="relative">{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Premium Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
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
            className="relative group px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-cyan-500/40 rounded-xl transition-all shadow-lg"
            title="Upload chart screenshot or document"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            <span className="relative text-xl">📎</span>
          </button>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            className={`relative group px-4 py-3 ${
              isListening
                ? 'bg-rose-600/20 border-rose-500/40 animate-pulse'
                : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50 hover:border-purple-500/40'
            } border rounded-xl transition-all shadow-lg`}
            title={isListening ? 'Stop recording' : 'Voice input'}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${
              isListening ? 'from-rose-600 to-red-600' : 'from-purple-600 to-indigo-600'
            } opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`} />
            <span className="relative text-xl">{isListening ? '🔴' : '🎤'}</span>
          </button>

          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-focus-within:opacity-10 rounded-xl transition-opacity blur-xl" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about markets, upload chart screenshots, or share documents..."
              className="relative w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-lg text-sm"
              disabled={isTyping}
            />
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && uploadedFiles.length === 0) || isTyping}
            className="relative group px-6 py-3 font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 ${
              (!input.trim() && uploadedFiles.length === 0) || isTyping
                ? 'bg-slate-700'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500'
            } transition-all`} />

            {/* Glow effect */}
            {(input.trim() || uploadedFiles.length > 0) && !isTyping && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            )}

            <span className="relative text-white flex items-center gap-2">
              {isTyping ? (
                <>
                  <span className="animate-pulse">Thinking...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <span className="text-lg">→</span>
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  )
}
