/**
 * Streamlined AI Chat with Real-time Streaming
 *
 * Features:
 * - Real-time token streaming (no more "AI is thinking..." for 30 seconds)
 * - Automatic state management with useChat hook
 * - Tool calling for market data
 * - 80% less code than original implementation
 */

import React, { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ChartBar,
  Brain,
  Zap
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function AIChatStream({
  symbol = 'SPY',
  context = {},
  onTradeSignal,
  className = ''
}) {
  const messagesEndRef = useRef(null)
  const [selectedModel, setSelectedModel] = useState('gpt-5-nano')
  const [showModelSelector, setShowModelSelector] = useState(false)

  // The magic hook that replaces 1000+ lines of state management
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    append,
    setMessages
  } = useChat({
    api: '/api/ai/stream',
    body: {
      model: selectedModel,
      context: {
        symbol,
        ...context
      }
    },
    onError: (error) => {
      console.error('Chat streaming error:', error)
    },
    onFinish: (message) => {
      // Save to localStorage for persistence
      const history = JSON.parse(localStorage.getItem('ai_chat_history') || '[]')
      history.push(message)
      // Keep only last 50 messages
      if (history.length > 50) {
        history.shift()
      }
      localStorage.setItem('ai_chat_history', JSON.stringify(history))
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load chat history on mount
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('ai_chat_history') || '[]')
    if (history.length > 0 && messages.length === 0) {
      setMessages(history.slice(-10)) // Load last 10 messages
    }
  }, [])

  // Custom submit handler with context injection
  const handleContextualSubmit = (e) => {
    e.preventDefault()

    // Only submit if there's input
    if (!input || !input.trim()) return

    // Call handleSubmit without the event since we already prevented default
    // The useChat hook's handleSubmit doesn't need the event when called programmatically
    handleSubmit()
  }

  // Model selector component
  const ModelSelector = () => (
    <div className="relative">
      <button
        onClick={() => setShowModelSelector(!showModelSelector)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
      >
        <Brain size={14} />
        <span className="text-xs">{selectedModel}</span>
      </button>

      {showModelSelector && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-xl p-2 min-w-[200px]" style={{ zIndex: 9999 }}>
          <div className="text-xs text-gray-400 px-2 py-1 mb-1">Select Model</div>
          {['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1-preview'].map(model => (
            <button
              key={model}
              onClick={() => {
                setSelectedModel(model)
                setShowModelSelector(false)
              }}
              className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors ${
                model === selectedModel ? 'bg-gray-700 text-white' : 'text-gray-300'
              }`}
            >
              {model}
              {model === 'gpt-5' && ' (Most Capable)'}
              {model === 'gpt-5-nano' && ' (Fastest)'}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // Message component with streaming animation
  const Message = ({ message }) => {
    const isUser = message.role === 'user'
    const isStreaming = isLoading && message === messages[messages.length - 1]

    // Custom markdown components for better rendering
    const markdownComponents = {
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '')
        return !inline && match ? (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="rounded-lg my-2"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
            {children}
          </code>
        )
      },
      // Custom rendering for trade signals
      blockquote({ children }) {
        return (
          <div className="border-l-4 border-green-500 bg-green-900/20 p-3 my-2 rounded">
            <div className="flex items-center gap-2 text-green-400 font-semibold mb-1">
              <TrendingUp size={16} />
              Trade Signal
            </div>
            {children}
          </div>
        )
      }
    }

    return (
      <div className={`flex gap-3 p-4 ${isUser ? 'bg-gray-800/50' : 'bg-gray-900/50'} rounded-lg`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'
        }`}>
          {isUser ? 'U' : <Sparkles size={16} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1">
            {isUser ? 'You' : 'iAVA AI'}
            {!isUser && (
              <span className="ml-2 text-gray-600">
                {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="prose prose-invert max-w-none">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>

            {isStreaming && (
              <span className="inline-flex ml-1">
                <span className="animate-pulse">▊</span>
              </span>
            )}
          </div>

          {/* Tool invocations display */}
          {message.toolInvocations?.map((tool, idx) => (
            <div key={idx} className="mt-2 p-2 bg-gray-800 rounded text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Zap size={14} />
                <span>Called: {tool.toolName}</span>
              </div>
              {tool.result && (
                <div className="mt-1 text-xs text-gray-500">
                  Result: {JSON.stringify(tool.result).substring(0, 100)}...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Streaming indicator component
  const StreamingIndicator = () => (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg animate-pulse">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
        <Sparkles size={16} className="animate-spin" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">iAVA is analyzing</span>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Processing market data, indicators, and AI models...
        </div>
      </div>
    </div>
  )

  return (
    <div className={`flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-300">AI Assistant</span>
          </div>
          {symbol && (
            <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-xs">
              {symbol}
            </span>
          )}
        </div>

        <ModelSelector />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              AI Trading Assistant Ready
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Ask about market conditions, technical analysis, Unicorn Scores,
              or trading strategies. I analyze in real-time with streaming responses.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {[
                'What\'s the Unicorn Score?',
                'Analyze current setup',
                'Show me confluence factors',
                'Is this a good entry?'
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => append({ role: 'user', content: suggestion })}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <Message key={message.id} message={message} />
        ))}

        {isLoading && messages.length > 0 && (
          <StreamingIndicator />
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm">Error: {error.message}</span>
            <button
              onClick={() => reload()}
              className="ml-auto flex items-center gap-1 px-2 py-1 bg-red-800 hover:bg-red-700 rounded text-xs transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleContextualSubmit}
        className="p-4 border-t border-gray-800"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about markets, indicators, or trading strategies..."
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
            disabled={isLoading}
          />

          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Loader2 size={16} className="animate-spin" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input || !input.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={16} />
              Send
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-600">
            Streaming enabled • Real-time responses • {messages.length} messages
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([])
                localStorage.removeItem('ai_chat_history')
              }}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>
      </form>
    </div>
  )
}