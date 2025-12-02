/**
 * LEGENDARY AI Panel
 *
 * Desktop right panel matching iAVA-LEGENDARY-DESKTOP_1.html exactly
 * Features:
 * - Header with unicorn gradient icon and AVA Mind title
 * - Tab bar with underline indicator (Score, Insights, Chronos, Chat)
 * - Score section with direction badge, confidence, 3-column breakdown
 * - Insight cards with colored icons and action buttons
 */

import { useState, useEffect } from 'react'
import {
  Zap,
  TrendingUp,
  Clock,
  MessageCircle,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Target,
  ArrowUp,
  ArrowDown,
  Radio,
  Brain,
  Sparkles,
  BarChart3,
  Activity,
  Eye,
} from 'lucide-react'
import { ScoreRing } from '../ui/ScoreRing'
import { LogoMark } from '../ui/Logo'
import SignalFeed from '../SignalFeed'
// AVAMindChatTab is defined inline below - psychology-focused personal coaching chat
import { useMarketData } from '../../contexts/MarketDataContext'
import { colors, gradients, animation, spacing, radius, typography, shadows } from '../../styles/tokens'

const tabs = [
  { id: 'score', label: 'Score' },
  { id: 'insights', label: 'Insights' },
  { id: 'chronos', label: 'Chronos' },
  { id: 'chat', label: 'Chat' },
]

// Demo insights matching HTML mockup
const insights = [
  {
    type: 'purple',
    icon: Sparkles,
    title: 'Pattern Recognition',
    subtitle: 'Just detected',
    content: 'Bullish flag pattern forming on the 4H chart. Historical success rate: <strong>78%</strong> with average move of <strong>+4.2%</strong>.',
    actionLabel: 'View Pattern',
  },
  {
    type: 'cyan',
    icon: Activity,
    title: 'Volume Anomaly',
    subtitle: '12 minutes ago',
    content: 'Unusual volume spike detected. <strong>3.2x</strong> average volume with price holding above VWAP.',
    actionLabel: 'Analyze Volume',
  },
  {
    type: 'emerald',
    icon: TrendingUp,
    title: 'Support Level',
    subtitle: '25 minutes ago',
    content: 'Strong support at <strong>$140.50</strong> has been tested 4 times. Consider this level for stops.',
    actionLabel: 'Set Alert',
  },
]

const chronosPredictions = [
  { timeframe: '1H', direction: 'up', target: 144.20, confidence: 72, change: '+0.8%' },
  { timeframe: '4H', direction: 'up', target: 146.80, confidence: 68, change: '+2.4%' },
  { timeframe: '1D', direction: 'up', target: 152.40, confidence: 65, change: '+6.2%' },
  { timeframe: '1W', direction: 'down', target: 148.00, confidence: 58, change: '+3.2%' },
]

function ScoreTab({ symbol = 'NVDA', score = 87, components = {}, recommendation = {} }) {
  // Score breakdown - use real components from API if available
  const breakdown = [
    { label: 'Technicals', value: Math.round(components.technical ?? 50), color: '#60a5fa' }, // blue
    { label: 'Sentiment', value: Math.round(components.sentiment ?? 50), color: colors.purple[500] },
    { label: 'Forecast', value: Math.round(components.forecast ?? 50), color: colors.cyan[400] },
  ]

  // Determine direction from recommendation or score
  const direction = recommendation.action?.includes('BUY') ? 'bullish'
    : recommendation.action?.includes('SELL') ? 'bearish'
    : score >= 60 ? 'bullish' : score <= 40 ? 'bearish' : 'neutral'

  const directionConfig = {
    bullish: { label: 'Bullish', color: colors.emerald[400], bg: colors.emerald.dim, Icon: ArrowUp },
    bearish: { label: 'Bearish', color: colors.red[400], bg: colors.red.dim, Icon: ArrowDown },
    neutral: { label: 'Neutral', color: colors.text[50], bg: colors.glass.bg, Icon: TrendingUp },
  }
  const dir = directionConfig[direction]

  return (
    <div style={{ padding: spacing[4] }}>
      {/* Score Section - matching HTML mockup exactly */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.depth1} 0%, rgba(99, 102, 241, 0.05) 100%)`,
          border: `1px solid ${colors.glass.border}`,
          borderRadius: radius.xl,
          padding: spacing[5],
          marginBottom: spacing[4],
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Unicorn gradient top border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: gradients.unicorn,
          }}
        />

        {/* Score header - ring and direction badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing[4],
          }}
        >
          {/* Large Score Ring */}
          <div style={{ position: 'relative' }}>
            <ScoreRing score={score} size="xl" />
          </div>

          {/* Direction badge and confidence */}
          <div style={{ textAlign: 'right' }}>
            {/* Direction badge - dynamic based on score/recommendation */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: `${spacing[2]}px ${spacing[3]}px`,
                background: dir.bg,
                borderRadius: radius.md,
                marginBottom: spacing[2],
              }}
            >
              <dir.Icon size={14} style={{ color: dir.color }} />
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.extrabold,
                  color: dir.color,
                  textTransform: 'uppercase',
                }}
              >
                {dir.label}
              </span>
            </div>

            {/* Confidence */}
            <div
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text[50],
              }}
            >
              Confidence: <strong style={{ color: colors.text[100] }}>High</strong>
            </div>
          </div>
        </div>

        {/* 3-column breakdown grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: spacing[2],
          }}
        >
          {breakdown.map((item) => (
            <div
              key={item.label}
              style={{
                background: colors.depth2,
                borderRadius: radius.lg,
                padding: spacing[3],
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.black,
                  color: item.color,
                  marginBottom: 4,
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text[50],
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional quick stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: spacing[3],
        }}
      >
        <div
          style={{
            background: colors.depth1,
            border: `1px solid ${colors.glass.border}`,
            borderRadius: radius.lg,
            padding: spacing[3],
          }}
        >
          <div
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text[50],
              marginBottom: 4,
            }}
          >
            Support
          </div>
          <div
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
              fontFamily: typography.fontFamily.mono,
            }}
          >
            $138.50
          </div>
        </div>
        <div
          style={{
            background: colors.depth1,
            border: `1px solid ${colors.glass.border}`,
            borderRadius: radius.lg,
            padding: spacing[3],
          }}
        >
          <div
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text[50],
              marginBottom: 4,
            }}
          >
            Resistance
          </div>
          <div
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
              fontFamily: typography.fontFamily.mono,
            }}
          >
            $145.20
          </div>
        </div>
      </div>
    </div>
  )
}

function InsightsTab() {
  // Color mappings for insight types
  const colorMap = {
    purple: { bg: colors.purple.dim, color: colors.purple[400] },
    cyan: { bg: colors.cyan.dim, color: colors.cyan[400] },
    emerald: { bg: colors.emerald.dim, color: colors.emerald[400] },
    amber: { bg: colors.amber.dim, color: colors.amber[400] },
  }

  return (
    <div style={{ padding: spacing[4] }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        {insights.map((insight, idx) => {
          const Icon = insight.icon
          const colorStyle = colorMap[insight.type] || colorMap.purple

          return (
            <div
              key={idx}
              style={{
                background: colors.depth1,
                border: `1px solid ${colors.glass.border}`,
                borderRadius: 14,
                padding: spacing[4],
                transition: `all ${animation.duration.fast}ms`,
              }}
            >
              {/* Insight header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  marginBottom: spacing[3],
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: colorStyle.bg,
                  }}
                >
                  <Icon size={18} style={{ color: colorStyle.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text[100],
                      marginBottom: 2,
                    }}
                  >
                    {insight.title}
                  </h4>
                  <span
                    style={{
                      fontSize: 11,
                      color: colors.text[50],
                    }}
                  >
                    {insight.subtitle}
                  </span>
                </div>
              </div>

              {/* Insight content */}
              <div
                style={{
                  fontSize: typography.fontSize.sm,
                  lineHeight: 1.6,
                  color: colors.text[70],
                }}
                dangerouslySetInnerHTML={{ __html: insight.content }}
              />

              {/* Action button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  marginTop: spacing[3],
                  paddingTop: spacing[3],
                  borderTop: `1px solid ${colors.glass.border}`,
                }}
              >
                <button
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: spacing[2],
                    background: colors.purple.dim,
                    border: `1px solid rgba(168, 85, 247, 0.2)`,
                    borderRadius: radius.md,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.purple[400],
                    cursor: 'pointer',
                    transition: `all ${animation.duration.fast}ms`,
                  }}
                >
                  <Eye size={14} />
                  {insight.actionLabel}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChronosTab() {
  return (
    <div style={{ padding: spacing[4] }}>
      {/* Chronos header section */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.depth1} 0%, ${colors.cyan.dim} 100%)`,
          border: `1px solid rgba(34, 211, 238, 0.2)`,
          borderRadius: 14,
          padding: spacing[4],
          marginBottom: spacing[3],
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            marginBottom: spacing[3],
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: colors.cyan.dim,
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={18} style={{ color: colors.cyan[400] }} />
          </div>
          <div>
            <h4
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
              }}
            >
              Chronos Forecast
            </h4>
            <span
              style={{
                fontSize: 11,
                color: colors.text[50],
              }}
            >
              Multi-timeframe predictions
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text[70],
            lineHeight: 1.5,
          }}
        >
          Quantum temporal analysis predicting price movements across multiple timeframes using advanced ML models.
        </p>
      </div>

      {/* Forecast rows */}
      <div
        style={{
          background: colors.depth1,
          border: `1px solid ${colors.glass.border}`,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {chronosPredictions.map((pred, idx) => (
          <div
            key={pred.timeframe}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: `${spacing[3]}px ${spacing[4]}px`,
              borderBottom: idx < chronosPredictions.length - 1 ? `1px solid ${colors.glass.border}` : 'none',
            }}
          >
            {/* Timeframe */}
            <div
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
                minWidth: 40,
              }}
            >
              {pred.timeframe}
            </div>

            {/* Direction badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                background: pred.direction === 'up' ? colors.emerald.dim : colors.red.dim,
                borderRadius: radius.full,
              }}
            >
              {pred.direction === 'up' ? (
                <ArrowUp size={12} style={{ color: colors.emerald[400] }} />
              ) : (
                <ArrowDown size={12} style={{ color: colors.red[400] }} />
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: typography.fontWeight.bold,
                  color: pred.direction === 'up' ? colors.emerald[400] : colors.red[400],
                }}
              >
                {pred.change}
              </span>
            </div>

            {/* Target price */}
            <div
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
                fontFamily: typography.fontFamily.mono,
              }}
            >
              ${pred.target.toFixed(2)}
            </div>

            {/* Confidence */}
            <div
              style={{
                fontSize: 11,
                color: colors.cyan[400],
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              {pred.confidence}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * AVA Mind Chat Tab - Psychology-focused personal coaching chat
 * Uses real user data from localStorage (patterns, archetypes, learning stats)
 */
function AVAMindChatTab() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  // Suggested prompts for new users
  const suggestedPrompts = [
    "How am I trading lately?",
    "What are my strengths?",
    "How can I improve?",
  ]

  // Build context from localStorage (real user data)
  const buildContext = () => {
    try {
      const learningStats = JSON.parse(localStorage.getItem('ava-mind-learning') || '{}')
      const patterns = JSON.parse(localStorage.getItem('ava-mind-patterns') || '{}')
      const archetype = JSON.parse(localStorage.getItem('ava-mind-archetype') || '{}')
      const trustLevel = parseInt(localStorage.getItem('ava-mind-trust-level') || '1', 10)

      // Format patterns
      const formattedPatterns = Object.entries(patterns).flatMap(([dimension, items]) =>
        Object.entries(items || {}).map(([value, data]) => ({
          dimension,
          value,
          winRate: data.wins / (data.wins + data.losses) * 100,
          count: data.wins + data.losses
        }))
      ).filter(p => p.count >= 2).slice(0, 10)

      return {
        archetype: archetype?.primary?.archetype || null,
        emotionalState: { state: 'neutral', intensity: 0.5 },
        trustLevel,
        patterns: formattedPatterns,
        learning: {
          totalTrades: learningStats?.totalTrades || 0,
          winRate: learningStats?.winRate || 0,
          profitFactor: learningStats?.profitFactor || 0,
          currentStreak: learningStats?.streakCurrent || 0,
          bestStreak: learningStats?.streakBest || 0,
          worstStreak: learningStats?.streakWorst || 0,
          averageWin: learningStats?.avgWin || 0,
          averageLoss: learningStats?.avgLoss || 0,
        }
      }
    } catch (e) {
      return {}
    }
  }

  // Send message to AVA Mind API
  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setLoading(true)

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const context = buildContext()
      const conversationHistory = [...messages, { role: 'user', content: userMessage }].slice(-10)

      const response = await fetch('/api/ai/ava-mind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory, context })
      })

      if (!response.ok) throw new Error('Failed to get response')

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2))
              fullResponse += text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: fullResponse }
                return updated
              })
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('[AVA Mind Chat] Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again in a moment."
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: spacing[4],
      }}
    >
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: spacing[3] }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing[6] }}>
            <Brain size={40} style={{ color: colors.purple[400], margin: '0 auto 12px', opacity: 0.6 }} />
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text[50], marginBottom: spacing[4] }}>
              Ask about your trading patterns and psychology
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setInputValue(prompt); setTimeout(sendMessage, 50) }}
                  style={{
                    padding: `${spacing[2]}px ${spacing[3]}px`,
                    background: colors.depth2,
                    border: `1px solid ${colors.glass.border}`,
                    borderRadius: radius.lg,
                    color: colors.text[70],
                    fontSize: typography.fontSize.xs,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: spacing[3],
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: spacing[3],
                  borderRadius: radius.xl,
                  background: msg.role === 'user' ? colors.purple.dim : colors.depth2,
                  border: `1px solid ${msg.role === 'user' ? colors.purple[500] + '40' : colors.glass.border}`,
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Brain size={12} style={{ color: colors.purple[400] }} />
                    <span style={{ fontSize: 10, color: colors.purple[400], fontWeight: 600 }}>AVA Mind</span>
                  </div>
                )}
                <p
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text[100],
                    lineHeight: 1.5,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: spacing[3] }}>
            <div style={{
              padding: spacing[3],
              borderRadius: radius.xl,
              background: colors.depth2,
              border: `1px solid ${colors.glass.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Brain size={12} style={{ color: colors.purple[400] }} />
                <span style={{ fontSize: 10, color: colors.purple[400] }}>Thinking...</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: colors.purple[400],
                        animation: `bounce 1s infinite ${i * 150}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
          padding: spacing[3],
          background: colors.depth2,
          borderRadius: radius.xl,
          border: `1px solid ${colors.glass.border}`,
        }}
      >
        <input
          type="text"
          placeholder="Ask about your trading..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: typography.fontSize.sm,
            color: colors.text[90],
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !inputValue.trim()}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: loading || !inputValue.trim() ? colors.depth3 : gradients.unicorn,
            borderRadius: radius.lg,
            border: 'none',
            cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !inputValue.trim() ? 0.5 : 1,
          }}
        >
          <Zap size={16} style={{ color: '#fff' }} />
        </button>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

export default function AIPanel({ symbol: propSymbol = 'NVDA', score: propScore = null }) {
  const [activeTab, setActiveTab] = useState('score')
  const [hoveredTab, setHoveredTab] = useState(null)

  // Get real market data from context
  const { marketData } = useMarketData()

  // Use context data if available, otherwise fall back to props
  const symbol = marketData?.symbol || propSymbol

  // Extract score from unicornScore object (API returns ultraUnicornScore)
  const unicornData = marketData?.unicornScore
  const score = unicornData?.ultraUnicornScore ?? propScore ?? 50
  const scoreComponents = unicornData?.components ?? {}
  const recommendation = unicornData?.recommendation ?? {}

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header - matching HTML mockup exactly */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing[4],
          borderBottom: `1px solid ${colors.glass.border}`,
          background: `linear-gradient(180deg, ${colors.purple.dim} 0%, transparent 100%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          {/* Unicorn gradient icon */}
          <div
            style={{
              width: 40,
              height: 40,
              background: gradients.unicorn,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 30px ${colors.purple.glow}`,
            }}
          >
            <Brain size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.extrabold,
                color: colors.text[100],
              }}
            >
              AVA Mind
            </h2>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text[50],
              }}
            >
              AI-Powered Analysis
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar with underline indicator */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.glass.border}`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const isHovered = hoveredTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                flex: 1,
                padding: spacing[3],
                background: isHovered ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                border: 'none',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: isActive ? colors.purple[400] : colors.text[50],
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms`,
                position: 'relative',
              }}
            >
              {tab.label}
              {/* Active underline indicator */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '20%',
                    right: '20%',
                    height: 2,
                    background: gradients.unicorn,
                    borderRadius: '2px 2px 0 0',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content with custom scrollbar */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
        className="ai-content"
      >
        {activeTab === 'score' && (
          <ScoreTab
            symbol={symbol}
            score={score}
            components={scoreComponents}
            recommendation={recommendation}
          />
        )}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab === 'chronos' && <ChronosTab />}
        {activeTab === 'chat' && <AVAMindChatTab />}
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .ai-content::-webkit-scrollbar {
          width: 6px;
        }
        .ai-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-content::-webkit-scrollbar-thumb {
          background: ${colors.depth3};
          border-radius: 3px;
        }
        .ai-content::-webkit-scrollbar-thumb:hover {
          background: ${colors.text[30]};
        }
      `}</style>
    </div>
  )
}
