/**
 * AI Chat Interface
 * Conversational assistant for trading queries and market analysis
 */

import { useState, useRef, useEffect } from 'react'
import { callAI } from '../utils/aiGateway.js'

export default function AIChat({ marketContext = {} }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI trading assistant. Ask me about market conditions, trading strategies, or get analysis on specific symbols.',
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // Build context-aware system prompt
      const systemPrompt = `You are an expert trading assistant for iAVA.ai. Provide concise, actionable trading insights.

Current Market Context:
${JSON.stringify(marketContext, null, 2)}

Guidelines:
- Be concise (2-3 sentences max)
- Focus on actionable insights
- Cite specific technical levels when relevant
- Acknowledge risk and uncertainty
- No financial advice disclaimers (user understands risks)`

      const chatHistory = messages.slice(-6) // Last 3 exchanges for context
      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: input.trim() }
      ]

      const result = await callAI('gpt-4o-mini', aiMessages, {
        temperature: 0.7,
        max_tokens: 200,
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

  const suggestedQuestions = [
    "What's the current market regime?",
    "Analyze SPY technical setup",
    "What stocks are showing momentum?",
    "Explain the importance of volume"
  ]

  return (
    <div className="glass-panel flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">AI Assistant</h3>
            <p className="text-xs text-slate-400">Ask me anything about trading</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-600/30 border border-indigo-500/30 text-slate-200'
                  : msg.error
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-300'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.cost && (
                <div className="text-xs text-slate-500 mt-1">
                  ${msg.cost.totalCost.toFixed(4)} • {msg.latency}ms
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-slate-400 mb-2">Suggested questions:</div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className="px-2 py-1 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 rounded transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about markets, strategies, or specific symbols..."
            className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
