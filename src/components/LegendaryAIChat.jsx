/**
 * LEGENDARY AI Chat
 *
 * Full-featured AI chat with conversation history, suggested prompts,
 * and beautiful message styling
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html (AI Chat section)
 */

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Mic,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

// Suggested prompts - AI can do full market analysis, not just scores
const suggestedPrompts = [
  { text: "Show me the best LONG setups", icon: TrendingUp },
  { text: "Find good SHORT opportunities", icon: AlertTriangle },
  { text: "What is the outlook for NVDA?", icon: Sparkles },
  { text: "Analyze current market conditions", icon: Lightbulb },
]

// Demo conversation - showcases Progressive Unicorn Score with bidirectional interpretation
const demoMessages = [
  {
    id: 1,
    role: 'user',
    content: 'Show me the best setups right now - both longs and shorts',
    timestamp: '10:32 AM',
  },
  {
    id: 2,
    role: 'assistant',
    content: `Here's my analysis with **Unicorn Score breakdowns**:

**LONG Opportunities (High Scores):**
- **NVDA: 87** (Tech: 45/50, Sentiment: 22/25, Forecast: 20/25) → STRONG BULLISH
- **AMD: 72** (Tech: 38/50, Sentiment: 18/25, Forecast: 16/25) → BULLISH

**SHORT Opportunities (Low Scores):**
- **XYZ: 28** (Tech: 12/50, Sentiment: 8/25, Forecast: 8/25) → BEARISH
- **ABC: 35** (Tech: 15/50, Sentiment: 10/25, Forecast: 10/25) → BEARISH

**Score Interpretation:**
- 60+ = LONG opportunities (all components bullish)
- 45-59 = NEUTRAL (wait for clarity)
- Below 44 = SHORT opportunities (all components bearish)

Scores are 50% technicals + 25% sentiment + 25% Chronos AI forecast.`,
    timestamp: '10:32 AM',
  },
]

export default function LegendaryAIChat({ symbol }) {
  const [messages, setMessages] = useState(demoMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    // Simulate AI typing
    setIsTyping(true)
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I've analyzed your question about "${input.slice(0, 30)}..."

Based on the **Unicorn Score** analysis (50% Technical + 25% Sentiment + 25% Forecast):

**Summary:** Looking at the breakdown:
- Technical signals show moderate strength
- Sentiment analysis is positive
- Chronos AI forecast suggests continuation

Remember: Scores 60+ suggest LONG opportunities, scores below 44 indicate SHORT setups.

Would you like me to drill into any specific component?`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSuggestedPrompt = (prompt) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.void,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          padding: spacing[4],
          borderBottom: `1px solid ${colors.glass.border}`,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: gradients.unicorn,
            borderRadius: radius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${colors.purple.glow}`,
          }}
        >
          <Zap size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <h2
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
            }}
          >
            AVA Assistant
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                background: colors.emerald[400],
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
              }}
            />
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.emerald[400],
              }}
            >
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing[4],
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[4],
        }}
      >
        {/* Suggested prompts - show when no messages */}
        {messages.length === 0 && (
          <div
            style={{
              padding: spacing[8],
              textAlign: 'center',
            }}
          >
            <Sparkles
              size={48}
              style={{
                color: colors.purple[400],
                marginBottom: spacing[4],
                opacity: 0.6,
              }}
            />
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
                marginBottom: spacing[2],
              }}
            >
              How can AVA help you today?
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text[50],
                marginBottom: spacing[6],
              }}
            >
              Ask about market conditions, analyze stocks, or get trading insights
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: spacing[2],
                maxWidth: 400,
                margin: '0 auto',
              }}
            >
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedPrompt(prompt.text)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    padding: spacing[3],
                    background: colors.depth1,
                    border: `1px solid ${colors.glass.border}`,
                    borderRadius: radius.lg,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: `all ${animation.duration.fast}ms`,
                  }}
                >
                  <prompt.icon size={16} style={{ color: colors.purple[400] }} />
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text[70],
                    }}
                  >
                    {prompt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={() => handleCopy(message.content, message.id)}
            isCopied={copiedId === message.id}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing[3],
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: gradients.unicorn,
                borderRadius: radius.lg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bot size={16} style={{ color: '#fff' }} />
            </div>
            <div
              style={{
                padding: spacing[3],
                background: colors.depth1,
                borderRadius: radius.xl,
                border: `1px solid ${colors.glass.border}`,
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      background: colors.purple[400],
                      borderRadius: '50%',
                      animation: `bounce 1.4s infinite ${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts bar */}
      {messages.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            padding: `0 ${spacing[4]}px ${spacing[2]}px`,
            overflowX: 'auto',
          }}
        >
          {suggestedPrompts.slice(0, 2).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestedPrompt(prompt.text)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[1],
                padding: `${spacing[1]}px ${spacing[3]}px`,
                background: colors.depth1,
                border: `1px solid ${colors.glass.border}`,
                borderRadius: radius.full,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <prompt.icon size={12} style={{ color: colors.purple[400] }} />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text[50],
                }}
              >
                {prompt.text}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: spacing[4],
          borderTop: `1px solid ${colors.glass.border}`,
          background: colors.depth1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: spacing[2],
            background: colors.depth2,
            borderRadius: radius.xl,
            border: `1px solid ${colors.glass.border}`,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AVA anything..."
            style={{
              flex: 1,
              padding: spacing[2],
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: typography.fontSize.base,
              color: colors.text[100],
            }}
          />

          {/* Voice button */}
          <button
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: colors.purple.dim,
              border: 'none',
              borderRadius: radius.lg,
              cursor: 'pointer',
            }}
          >
            <Mic size={18} style={{ color: colors.purple[400] }} />
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: input.trim() ? gradients.unicorn : colors.depth3,
              border: 'none',
              borderRadius: radius.lg,
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              boxShadow: input.trim() ? `0 0 20px ${colors.purple.glow}` : 'none',
            }}
          >
            <Send size={18} style={{ color: '#fff' }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

// Message Bubble Component
function MessageBubble({ message, onCopy, isCopied }) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing[3],
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          background: isUser ? colors.depth2 : gradients.unicorn,
          borderRadius: radius.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: isUser ? `1px solid ${colors.glass.border}` : 'none',
        }}
      >
        {isUser ? (
          <User size={16} style={{ color: colors.text[50] }} />
        ) : (
          <Bot size={16} style={{ color: '#fff' }} />
        )}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '80%',
          padding: spacing[3],
          background: isUser ? gradients.unicorn : colors.depth1,
          borderRadius: isUser
            ? `${radius.xl}px ${radius.xl}px ${radius.sm}px ${radius.xl}px`
            : `${radius.xl}px ${radius.xl}px ${radius.xl}px ${radius.sm}px`,
          border: isUser ? 'none' : `1px solid ${colors.glass.border}`,
          position: 'relative',
        }}
      >
        {/* Content with markdown-like styling */}
        <div
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text[100],
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
          dangerouslySetInnerHTML={{
            __html: formatMessage(message.content),
          }}
        />

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing[2],
            paddingTop: spacing[2],
            borderTop: `1px solid ${isUser ? 'rgba(255,255,255,0.1)' : colors.glass.border}`,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: isUser ? 'rgba(255,255,255,0.6)' : colors.text[30],
            }}
          >
            {message.timestamp}
          </span>

          {!isUser && (
            <button
              onClick={onCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 10,
                color: colors.text[30],
              }}
            >
              {isCopied ? (
                <>
                  <Check size={12} style={{ color: colors.emerald[400] }} />
                  <span style={{ color: colors.emerald[400] }}>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple markdown-like formatting
function formatMessage(content) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f1f5f9;">$1</strong>')
    .replace(/- (.*?)$/gm, '<span style="display: block; padding-left: 12px;">• $1</span>')
    .replace(/\n/g, '<br/>')
}
