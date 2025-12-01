/**
 * LEGENDARY Mobile Trade View
 *
 * Mobile-optimized trade view matching iAVA-ULTIMATE-LEGENDARY-MOBILE.html exactly
 * Features:
 * - Logo header with app branding
 * - Symbol header with company logo and price
 * - Chart with timeframe bar and tools
 * - Expandable Score Card overlay
 * - Action bar with Buy/Sell buttons
 */

import { useState, useEffect } from 'react'
import {
  Search,
  Bell,
  Maximize2,
  Layers,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Star,
  BarChart3,
  Activity,
  Zap,
  Sparkles,
  Brain,
  Mic,
} from 'lucide-react'
import AppChart from '../AppChart'
import { LogoMark } from './ui/Logo'
import { ScoreRing } from './ui/ScoreRing'
import StockLogo from './ui/StockLogo'
import { SkeletonChart, SkeletonMobileHeader } from './ui/Skeleton'
import { useMarketData } from '../contexts/MarketDataContext'
import { colors, gradients, spacing, animation, radius, typography } from '../styles/tokens'

// Timeframe options
const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D', '1W']

// Company name lookup
const COMPANY_NAMES = {
  SPY: 'SPDR S&P 500 ETF',
  QQQ: 'Invesco QQQ Trust',
  AAPL: 'Apple Inc',
  TSLA: 'Tesla Inc',
  NVDA: 'NVIDIA Corporation',
  AMD: 'Advanced Micro Devices',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc',
  AMZN: 'Amazon.com Inc',
  META: 'Meta Platforms',
}

export default function MobileTradeView({
  symbol = 'SPY',
  onSymbolClick,
  onSelectSymbol,
  onVoiceCommand,
}) {
  // Get real market data from context
  const { marketData } = useMarketData()

  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTimeframe, setActiveTimeframe] = useState('15m')
  const [isChangingSymbol, setIsChangingSymbol] = useState(false)
  const [scoreCardExpanded, setScoreCardExpanded] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)

  // Use real data from context with fallbacks
  const currentPrice = marketData?.currentPrice ?? 0
  const priceChange = marketData?.signalState?.change ?? 0
  const priceChangePercent = marketData?.signalState?.changePercent ?? 0
  const realScore = marketData?.unicornScore?.ultraUnicornScore ?? marketData?.unicornScore?.score ?? 0
  const scoreComponents = marketData?.unicornScore?.components ?? {}
  const scoreBreakdown = marketData?.unicornScore?.breakdown ?? {}
  const recommendation = marketData?.unicornScore?.recommendation?.action ?? 'HOLD'

  // Determine direction from score or price
  const direction = realScore >= 70 ? 'bullish' : realScore >= 50 ? 'neutral' : 'bearish'
  const companyName = COMPANY_NAMES[symbol] || symbol

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle loading state based on market data
  useEffect(() => {
    if (marketData?.currentPrice != null && !marketData?.isLoading) {
      setIsLoading(false)
    }
    // Initial timeout fallback
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [marketData])

  // Handle symbol change animation
  useEffect(() => {
    setIsChangingSymbol(true)
    const timer = setTimeout(() => setIsChangingSymbol(false), 300)
    return () => clearTimeout(timer)
  }, [symbol])

  // Handle voice commands
  const handleVoiceCommand = (command) => {
    setIsVoiceActive(false)
    if (onVoiceCommand) {
      onVoiceCommand(command)
    }
    // Dispatch event for voice command handler
    window.dispatchEvent(new CustomEvent('iava.voiceCommand', { detail: command }))
  }

  const isPositive = priceChange >= 0

  // Score breakdown using REAL data from API (50/25/25 formula)
  const breakdown = [
    { label: 'Technical', value: Math.round(scoreComponents?.technical ?? 50), type: 'tech' },
    { label: 'Sentiment', value: Math.round(scoreComponents?.sentiment ?? 50), type: 'sent' },
    { label: 'Forecast', value: Math.round(scoreComponents?.forecast ?? 50), type: 'fore' },
  ]

  // Get score classification
  const getScoreClassification = (score) => {
    if (score >= 90) return { label: 'Ultra Elite', color: colors.cyan[400], bg: colors.cyan.dim }
    if (score >= 80) return { label: 'Elite', color: colors.purple[400], bg: colors.purple.dim }
    if (score >= 70) return { label: 'Unicorn', color: colors.emerald[400], bg: colors.emerald.dim }
    if (score >= 50) return { label: 'Moderate', color: colors.amber[400], bg: 'rgba(251, 191, 36, 0.15)' }
    return { label: 'Weak', color: colors.red[400], bg: colors.red.dim }
  }
  const scoreClass = getScoreClassification(realScore)

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          gap: spacing[4],
          padding: spacing[4],
        }}
      >
        <SkeletonMobileHeader />
        <SkeletonChart height="calc(100vh - 300px)" />
      </div>
    )
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
      {/* Logo Header - Mobile */}
      {isMobile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${spacing[2]}px ${spacing[5]}px`,
            background: `linear-gradient(180deg, rgba(99, 102, 241, 0.06) 0%, transparent 100%)`,
          }}
        >
          {/* App Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <div
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogoMark size={36} animate />
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: typography.fontWeight.black,
                letterSpacing: '-0.02em',
                background: gradients.unicorn,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              iAVA
            </span>
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <HeaderButton icon={Search} />
            <HeaderButton icon={Bell} badge={3} />
          </div>
        </div>
      )}

      {/* Symbol Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing[3]}px ${spacing[5]}px`,
          opacity: isChangingSymbol ? 0.5 : 1,
          transition: `opacity ${animation.duration.fast}ms`,
        }}
      >
        {/* Left - Company Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            cursor: 'pointer',
          }}
          onClick={onSymbolClick}
        >
          {/* Company Logo */}
          <div style={{ position: 'relative' }}>
            <StockLogo
              symbol={symbol}
              size={54}
              borderRadius={14}
              style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '2px solid rgba(99, 102, 241, 0.15)',
                borderRadius: 14,
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Symbol Info */}
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: typography.fontWeight.black,
                letterSpacing: '-0.02em',
                color: colors.text[100],
              }}
            >
              {symbol}
            </h1>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text[50],
              }}
            >
              {companyName}
            </span>
          </div>
        </div>

        {/* Right - Price Block */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: typography.fontWeight.black,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              color: colors.text[100],
            }}
          >
            ${currentPrice > 0 ? currentPrice.toFixed(2) : '---'}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 6,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              color: isPositive ? colors.emerald[400] : colors.red[400],
            }}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          minHeight: 260,
          background: colors.void,
        }}
      >
        {/* Chart glow effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 70% 30%, ${colors.indigo.dim} 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Timeframe Bar */}
        <div
          style={{
            position: 'absolute',
            top: spacing[3],
            left: spacing[3],
            display: 'flex',
            gap: 4,
            zIndex: 10,
          }}
        >
          {timeframes.slice(0, 5).map((tf) => {
            const isActive = activeTimeframe === tf
            return (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                style={{
                  padding: `${spacing[2]}px ${spacing[3]}px`,
                  background: isActive ? gradients.unicorn : colors.glass.bg,
                  border: isActive ? 'none' : `1px solid ${colors.glass.border}`,
                  borderRadius: radius.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  color: isActive ? '#fff' : colors.text[50],
                  cursor: 'pointer',
                  transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
                  boxShadow: isActive ? `0 0 20px ${colors.purple.glow}` : 'none',
                }}
              >
                {tf}
              </button>
            )
          })}
        </div>

        {/* Chart Tools */}
        <div
          style={{
            position: 'absolute',
            top: spacing[3],
            right: spacing[3],
            display: 'flex',
            gap: 6,
            zIndex: 10,
          }}
        >
          <ToolButton icon={Layers} />
          <ToolButton icon={Maximize2} />
        </div>

        {/* Chart */}
        <AppChart />

        {/* Score Card Overlay */}
        <div
          onClick={() => setScoreCardExpanded(!scoreCardExpanded)}
          style={{
            position: 'absolute',
            bottom: spacing[3],
            left: spacing[3],
            right: spacing[3],
            background: colors.glass.bg,
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: `1px solid ${colors.glass.border}`,
            borderRadius: 20,
            padding: spacing[4],
            cursor: 'pointer',
            transition: `all ${animation.duration.normal}ms ${animation.easing.smooth}`,
            zIndex: 15,
          }}
        >
          {/* Main Score Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left - Score Ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
              <ScoreRing score={Math.round(realScore)} size="md" />
              <div>
                <h3
                  style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.extrabold,
                    color: colors.text[100],
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    marginBottom: 4,
                  }}
                >
                  Unicorn Score
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.extrabold,
                      padding: '4px 10px',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      background: direction === 'bullish' ? colors.emerald.dim : direction === 'bearish' ? colors.red.dim : 'rgba(251, 191, 36, 0.15)',
                      color: direction === 'bullish' ? colors.emerald[400] : direction === 'bearish' ? colors.red[400] : colors.amber[400],
                    }}
                  >
                    {direction === 'bullish' ? 'Bullish' : direction === 'bearish' ? 'Bearish' : 'Neutral'}
                  </span>
                </h3>
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text[50],
                  }}
                >
                  {recommendation !== 'HOLD' ? `${recommendation} Signal` : 'Wait for setup'}
                </span>
              </div>
            </div>

            {/* Right - Score Classification Chip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                padding: `${spacing[2]}px ${spacing[3]}px`,
                background: scoreClass.bg,
                border: `1px solid ${scoreClass.color}30`,
                borderRadius: radius.lg,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: gradients.unicorn,
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} style={{ color: '#fff' }} />
              </div>
              <span
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.extrabold,
                  color: scoreClass.color,
                }}
              >
                {scoreClass.label}
              </span>
            </div>
          </div>

          {/* Expand Hint */}
          {!scoreCardExpanded && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: spacing[3],
                paddingTop: spacing[3],
                borderTop: `1px solid ${colors.glass.border}`,
                fontSize: 11,
                color: colors.text[50],
              }}
            >
              <ChevronDown size={14} style={{ animation: 'bounce 2s ease-in-out infinite' }} />
              Tap for AI breakdown
            </div>
          )}

          {/* Expanded Content */}
          {scoreCardExpanded && (
            <div
              style={{
                marginTop: spacing[4],
                paddingTop: spacing[4],
                borderTop: `1px solid ${colors.glass.border}`,
                animation: `slideIn ${animation.duration.normal}ms ${animation.easing.smooth}`,
              }}
            >
              {/* Breakdown List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[3] }}>
                {breakdown.map((item) => (
                  <BreakdownItem key={item.label} {...item} />
                ))}
              </div>

              {/* AI Recommendation */}
              <div
                style={{
                  background: colors.indigo.dim,
                  border: `1px solid rgba(99, 102, 241, 0.2)`,
                  borderRadius: radius.lg,
                  padding: spacing[3],
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    marginBottom: spacing[2],
                  }}
                >
                  <Brain size={16} style={{ color: colors.indigo[400] }} />
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.extrabold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: colors.indigo[400],
                    }}
                  >
                    AVA Analysis
                  </span>
                </div>
                <p
                  style={{
                    fontSize: typography.fontSize.sm,
                    lineHeight: 1.6,
                    color: colors.text[70],
                    margin: 0,
                  }}
                >
                  {realScore >= 70 ? (
                    <>
                      Strong momentum with <strong style={{ color: colors.text[100] }}>{direction}</strong> bias.
                      Consider entry near <strong style={{ color: colors.text[100] }}>${(currentPrice * 0.99).toFixed(2)}</strong> support.
                    </>
                  ) : realScore >= 50 ? (
                    <>
                      Mixed signals on <strong style={{ color: colors.text[100] }}>{symbol}</strong>.
                      Wait for clearer direction before entry.
                    </>
                  ) : (
                    <>
                      Weak setup on <strong style={{ color: colors.text[100] }}>{symbol}</strong>.
                      Consider waiting or reducing position size.
                    </>
                  )}
                </p>
              </div>

              {/* Score Formula Transparency */}
              {scoreBreakdown?.formula && (
                <div
                  style={{
                    marginTop: spacing[2],
                    padding: `${spacing[2]}px`,
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: radius.md,
                    fontSize: typography.fontSize.xs,
                    color: colors.text[30],
                    fontFamily: 'monospace',
                  }}
                >
                  {scoreBreakdown.formula}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar - Mobile Only */}
      {isMobile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[3]}px ${spacing[4]}px`,
            background: 'rgba(0, 0, 0, 0.98)',
            borderTop: `1px solid ${colors.glass.border}`,
          }}
        >
          {/* Buy Button */}
          <button
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: spacing[4],
              background: gradients.buyButton,
              border: 'none',
              borderRadius: 14,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.extrabold,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: `0 0 30px ${colors.emerald.glow}`,
              transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
            }}
          >
            <TrendingUp size={18} />
            Buy
          </button>

          {/* Sell Button */}
          <button
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: spacing[4],
              background: gradients.sellButton,
              border: 'none',
              borderRadius: 14,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.extrabold,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: `0 0 20px ${colors.red.glow}`,
              transition: `all ${animation.duration.fast}ms ${animation.easing.spring}`,
            }}
          >
            <TrendingDown size={18} />
            Sell
          </button>

          {/* Voice Action Button */}
          <button
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              border: isVoiceActive ? 'none' : `1px solid ${colors.glass.border}`,
              background: isVoiceActive ? gradients.unicorn : colors.glass.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: `all ${animation.duration.fast}ms`,
              boxShadow: isVoiceActive ? `0 0 20px ${colors.purple.glow}` : 'none',
            }}
          >
            <Mic size={22} style={{ color: isVoiceActive ? '#fff' : colors.text[50] }} />
          </button>

          {/* Star Action */}
          <ActionButton icon={Star} />
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Header button component
function HeaderButton({ icon: Icon, badge }) {
  return (
    <button
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        border: `1px solid ${colors.glass.border}`,
        background: colors.glass.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      <Icon size={18} style={{ color: colors.text[50] }} />
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            background: colors.red[500],
            color: '#fff',
            fontSize: 10,
            fontWeight: typography.fontWeight.bold,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

// Tool button component
function ToolButton({ icon: Icon }) {
  return (
    <button
      style={{
        width: 36,
        height: 36,
        background: colors.glass.bg,
        border: `1px solid ${colors.glass.border}`,
        borderRadius: radius.md,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      <Icon size={16} style={{ color: colors.text[50] }} />
    </button>
  )
}

// Action button component
function ActionButton({ icon: Icon }) {
  return (
    <button
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        border: `1px solid ${colors.glass.border}`,
        background: colors.glass.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: `all ${animation.duration.fast}ms`,
      }}
    >
      <Icon size={22} style={{ color: colors.text[50] }} />
    </button>
  )
}

// Breakdown item component
function BreakdownItem({ label, value, type }) {
  const colors_map = {
    tech: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', gradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    sent: { bg: colors.purple.dim, color: colors.purple[400], gradient: `linear-gradient(90deg, #9333ea, ${colors.purple[400]})` },
    fore: { bg: colors.cyan.dim, color: colors.cyan[400], gradient: `linear-gradient(90deg, #0891b2, ${colors.cyan[400]})` },
  }
  const colorStyle = colors_map[type] || colors_map.tech
  const IconComponent = type === 'tech' ? BarChart3 : type === 'sent' ? Brain : Zap

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colorStyle.bg,
        }}
      >
        <IconComponent size={18} style={{ color: colorStyle.color }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: typography.fontSize.sm,
            marginBottom: 6,
          }}
        >
          <span style={{ color: colors.text[70] }}>{label}</span>
          <span style={{ fontWeight: typography.fontWeight.bold, color: colorStyle.color }}>{value}</span>
        </div>
        <div
          style={{
            height: 6,
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${value}%`,
              height: '100%',
              background: colorStyle.gradient,
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    </div>
  )
}
