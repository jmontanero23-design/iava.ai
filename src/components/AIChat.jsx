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
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your ELITE AI trading assistant. Ask me about markets, upload chart screenshots for analysis, or share documents for insights. I have full access to your live market data.',
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([]) // Chart images, PDFs, CSVs
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

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

      // Build user message with vision support
      let userContent = input.trim()

      // If images attached, use vision model format
      if (hasImages) {
        userContent = [
          { type: 'text', text: input.trim() || 'Analyze this chart screenshot. Identify key support/resistance levels, trend direction, volume patterns, and any notable technical setups. Provide actionable insights.' }
        ]

        // Add all images
        currentFiles.forEach(file => {
          if (file.isImage) {
            userContent.push({
              type: 'image_url',
              image_url: { url: file.base64 }
            })
          }
        })
      }

      // If documents attached, extract text and add to context
      if (hasDocuments) {
        const docContext = currentFiles
          .filter(f => f.isText)
          .map(f => `\n\n=== Document: ${f.name} ===\n${atob(f.base64.split(',')[1])}`)
          .join('\n')

        if (typeof userContent === 'string') {
          userContent += docContext
        } else {
          userContent[0].text += docContext
        }
      }

      const aiMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `CURRENT MARKET DATA:\n\n${contextText}` },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userContent }
      ]

      // Use vision model (GPT-4o) if images, otherwise GPT-5 for reasoning
      const model = hasImages ? 'gpt-4o' : 'gpt-5'
      const maxTokens = hasImages ? 500 : 300 // More tokens for chart analysis

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
          <div>
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
            </p>
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

                {msg.cost && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/30">
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <span>💰</span>
                      <span className="font-semibold">${msg.cost.totalCost.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-cyan-400">
                      <span>⚡</span>
                      <span className="font-semibold">{msg.latency}ms</span>
                    </div>
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

      {/* Premium Suggested Questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2.5">
            <span className="text-base">💡</span>
            <span className="font-semibold uppercase tracking-wider">Suggested Questions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className="relative group px-3 py-2 text-xs font-medium bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
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
