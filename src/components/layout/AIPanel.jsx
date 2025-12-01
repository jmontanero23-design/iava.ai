/**
 * LEGENDARY AI Panel
 *
 * Desktop right panel with tabs: Score | Insights | Chronos | Chat
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html
 */

import { useState } from 'react'
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
} from 'lucide-react'
import { ScoreRing } from '../ui/ScoreRing'
import SignalFeed from '../SignalFeed'
import LegendaryAIChat from '../LegendaryAIChat'
import { colors, gradients, animation, spacing, radius, typography, shadows } from '../../styles/tokens'

const tabs = [
  { id: 'score', label: 'Score', Icon: Zap },
  { id: 'signals', label: 'Signals', Icon: Radio },
  { id: 'chronos', label: 'Chronos', Icon: Clock },
  { id: 'chat', label: 'Chat', Icon: MessageCircle },
]

// Demo data
const insights = [
  {
    type: 'bullish',
    title: 'Strong momentum detected',
    description: 'RSI and MACD confirm upward trend',
    confidence: 85,
  },
  {
    type: 'warning',
    title: 'Earnings report in 3 days',
    description: 'Historical volatility: +/- 8%',
    confidence: 92,
  },
  {
    type: 'neutral',
    title: 'Support level at $138.50',
    description: 'Multiple touches confirm strength',
    confidence: 78,
  },
]

const chronosPredictions = [
  { timeframe: '1H', direction: 'up', target: 144.20, confidence: 72 },
  { timeframe: '4H', direction: 'up', target: 146.80, confidence: 68 },
  { timeframe: '1D', direction: 'up', target: 152.40, confidence: 65 },
  { timeframe: '1W', direction: 'down', target: 148.00, confidence: 58 },
]

const chatMessages = [
  { role: 'user', text: 'What\'s the outlook for NVDA?' },
  { role: 'ava', text: 'NVDA shows strong bullish signals with an 87 Unicorn Score. Key resistance at $145 with support at $138.' },
]

function ScoreTab({ symbol = 'NVDA', score = 87 }) {
  const factors = [
    { name: 'Technical', score: 92, color: colors.cyan[400] },
    { name: 'Momentum', score: 85, color: colors.purple[400] },
    { name: 'Sentiment', score: 78, color: colors.emerald[400] },
    { name: 'Pattern', score: 88, color: colors.indigo[400] },
  ]

  return (
    <div style={{ padding: spacing[4] }}>
      {/* Main score display */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: spacing[6],
          marginBottom: spacing[4],
        }}
      >
        <ScoreRing score={score} size="xl" />
        <div
          style={{
            marginTop: spacing[3],
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text[100],
            }}
          >
            {symbol}
          </div>
          <div
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text[50],
            }}
          >
            Unicorn Score
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div
        style={{
          background: colors.depth2,
          borderRadius: radius.xl,
          padding: spacing[4],
          border: `1px solid ${colors.glass.border}`,
        }}
      >
        <h3
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text[70],
            marginBottom: spacing[3],
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.wider,
          }}
        >
          Score Breakdown
        </h3>

        {factors.map((factor) => (
          <div
            key={factor.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing[2]}px 0`,
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text[70],
              }}
            >
              {factor.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <div
                style={{
                  width: 80,
                  height: 4,
                  background: colors.depth3,
                  borderRadius: radius.full,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${factor.score}%`,
                    height: '100%',
                    background: factor.color,
                    borderRadius: radius.full,
                    transition: `width ${animation.duration.slow}ms ${animation.easing.smooth}`,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: factor.color,
                  fontFamily: typography.fontFamily.mono,
                  minWidth: 28,
                }}
              >
                {factor.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightsTab() {
  return (
    <div style={{ padding: spacing[4] }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        {insights.map((insight, idx) => {
          const Icon = insight.type === 'bullish' ? CheckCircle :
                       insight.type === 'warning' ? AlertTriangle : Target

          const iconColor = insight.type === 'bullish' ? colors.emerald[400] :
                           insight.type === 'warning' ? colors.amber[400] : colors.text[50]

          return (
            <div
              key={idx}
              style={{
                background: colors.depth2,
                borderRadius: radius.xl,
                padding: spacing[4],
                border: `1px solid ${colors.glass.border}`,
                transition: `all ${animation.duration.fast}ms`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3] }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${iconColor}15`,
                    borderRadius: radius.lg,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} style={{ color: iconColor }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text[100],
                      marginBottom: 4,
                    }}
                  >
                    {insight.title}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text[50],
                      marginBottom: spacing[2],
                    }}
                  >
                    {insight.description}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.cyan[400],
                      fontWeight: '500',
                    }}
                  >
                    {insight.confidence}% confidence
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: colors.text[30] }} />
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
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.purple[500]}20 0%, ${colors.cyan[400]}20 100%)`,
          borderRadius: radius.xl,
          padding: spacing[4],
          marginBottom: spacing[4],
          border: `1px solid ${colors.purple[500]}30`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
          <Clock size={18} style={{ color: colors.purple[400] }} />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.purple[400],
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
            }}
          >
            Chronos AI
          </span>
        </div>
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text[70],
            lineHeight: 1.5,
          }}
        >
          Quantum temporal analysis predicting price movements across multiple timeframes.
        </p>
      </div>

      {/* Predictions grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
        {chronosPredictions.map((pred) => (
          <div
            key={pred.timeframe}
            style={{
              background: colors.depth2,
              borderRadius: radius.xl,
              padding: spacing[3],
              border: `1px solid ${colors.glass.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing[2],
              }}
            >
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text[50],
                  textTransform: 'uppercase',
                }}
              >
                {pred.timeframe}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 6px',
                  background: pred.direction === 'up' ? colors.emerald.dim : colors.red.dim,
                  borderRadius: radius.full,
                }}
              >
                {pred.direction === 'up' ? (
                  <ArrowUp size={12} style={{ color: colors.emerald[400] }} />
                ) : (
                  <ArrowDown size={12} style={{ color: colors.red[400] }} />
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
                fontFamily: typography.fontFamily.mono,
              }}
            >
              ${pred.target.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.cyan[400],
              }}
            >
              {pred.confidence}% confidence
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatTab() {
  const [inputValue, setInputValue] = useState('')

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
        {chatMessages.map((msg, idx) => (
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
                background: msg.role === 'user' ? gradients.unicorn : colors.depth2,
                border: msg.role === 'ava' ? `1px solid ${colors.glass.border}` : 'none',
              }}
            >
              <p
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text[100],
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {msg.text}
              </p>
            </div>
          </div>
        ))}
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
          placeholder="Ask AVA anything..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: gradients.unicorn,
            borderRadius: radius.lg,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Zap size={16} style={{ color: '#fff' }} />
        </button>
      </div>
    </div>
  )
}

export default function AIPanel({ symbol = 'NVDA', score = 87 }) {
  const [activeTab, setActiveTab] = useState('score')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          padding: spacing[3],
          gap: spacing[1],
          borderBottom: `1px solid ${colors.glass.border}`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: spacing[2],
                background: isActive ? colors.depth2 : 'transparent',
                border: 'none',
                borderRadius: radius.lg,
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms`,
              }}
            >
              <tab.Icon
                size={18}
                style={{
                  color: isActive ? colors.cyan[400] : colors.text[50],
                }}
              />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? colors.text[100] : colors.text[50],
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'score' && <ScoreTab symbol={symbol} score={score} />}
        {activeTab === 'signals' && (
          <div style={{ padding: spacing[4] }}>
            <SignalFeed compact={false} />
          </div>
        )}
        {activeTab === 'chronos' && <ChronosTab />}
        {activeTab === 'chat' && <LegendaryAIChat symbol={symbol} />}
      </div>
    </div>
  )
}
