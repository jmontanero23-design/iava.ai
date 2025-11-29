/**
 * EmotionTimeline - Trading Emotion Tracker
 *
 * Visualizes emotional states over time during trading sessions.
 * Helps identify emotional patterns that affect trading decisions.
 *
 * Features:
 * - Real-time emotion tracking
 * - Color-coded emotion indicators
 * - Time-based visualization
 * - Trend detection for emotional patterns
 * - Integration with trade events
 */

import React, { useState, useMemo } from 'react'

// Emotion definitions with colors and icons
const EMOTIONS = {
  calm: {
    color: '#10B981', // Emerald
    icon: '😌',
    label: 'Calm',
    description: 'Balanced, focused state',
    score: 70
  },
  confident: {
    color: '#8B5CF6', // Purple
    icon: '😎',
    label: 'Confident',
    description: 'High conviction in decisions',
    score: 85
  },
  cautious: {
    color: '#F59E0B', // Amber
    icon: '🤔',
    label: 'Cautious',
    description: 'Heightened risk awareness',
    score: 50
  },
  fearful: {
    color: '#EF4444', // Red
    icon: '😰',
    label: 'Fearful',
    description: 'Risk of panic decisions',
    score: 25
  },
  greedy: {
    color: '#F97316', // Orange
    icon: '🤑',
    label: 'Greedy',
    description: 'Risk of overtrading',
    score: 40
  },
  euphoric: {
    color: '#EC4899', // Pink
    icon: '🤩',
    label: 'Euphoric',
    description: 'Overconfidence risk',
    score: 45
  },
  frustrated: {
    color: '#DC2626', // Red
    icon: '😤',
    label: 'Frustrated',
    description: 'Risk of revenge trading',
    score: 20
  },
  neutral: {
    color: '#64748B', // Slate
    icon: '😐',
    label: 'Neutral',
    description: 'Waiting for opportunity',
    score: 60
  }
}

// Generate sample timeline data for demo
function generateDemoData() {
  const emotions = Object.keys(EMOTIONS)
  const now = Date.now()
  const hour = 60 * 60 * 1000

  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    timestamp: now - (23 - i) * hour,
    emotion: emotions[Math.floor(Math.random() * emotions.length)],
    intensity: 50 + Math.random() * 50,
    event: i % 6 === 0 ? { type: 'trade', symbol: 'AAPL', action: i % 2 === 0 ? 'BUY' : 'SELL' } : null
  }))
}

// Timeline point component
function TimelinePoint({
  point,
  index,
  isActive,
  onClick,
  height
}) {
  const emotion = EMOTIONS[point.emotion] || EMOTIONS.neutral
  const y = height - (emotion.score / 100) * (height - 40)

  return (
    <g
      className="cursor-pointer"
      onClick={() => onClick(point)}
    >
      {/* Event marker */}
      {point.event && (
        <line
          x1={index * 30 + 15}
          y1={y}
          x2={index * 30 + 15}
          y2={height - 10}
          stroke={point.event.action === 'BUY' ? '#10B981' : '#EF4444'}
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.5"
        />
      )}

      {/* Glow effect when active */}
      {isActive && (
        <circle
          cx={index * 30 + 15}
          cy={y}
          r="16"
          fill={emotion.color}
          opacity="0.3"
          className="animate-pulse"
        />
      )}

      {/* Point */}
      <circle
        cx={index * 30 + 15}
        cy={y}
        r={isActive ? 8 : 6}
        fill={emotion.color}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        className="transition-all duration-200"
      />

      {/* Emoji on hover */}
      {isActive && (
        <text
          x={index * 30 + 15}
          y={y - 18}
          textAnchor="middle"
          fontSize="16"
        >
          {emotion.icon}
        </text>
      )}
    </g>
  )
}

export default function EmotionTimeline({
  data = null,
  height = 200,
  showLegend = true,
  onPointSelect,
  className = ''
}) {
  const [activePoint, setActivePoint] = useState(null)
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Use demo data if no data provided
  const timelineData = useMemo(() => data || generateDemoData(), [data])

  const width = timelineData.length * 30 + 30

  // Calculate emotion trend
  const emotionTrend = useMemo(() => {
    if (timelineData.length < 2) return 'stable'
    const recent = timelineData.slice(-5)
    const avgScore = recent.reduce((sum, p) => sum + (EMOTIONS[p.emotion]?.score || 50), 0) / recent.length
    if (avgScore > 70) return 'positive'
    if (avgScore < 40) return 'negative'
    return 'stable'
  }, [timelineData])

  // Generate path for the line
  const linePath = useMemo(() => {
    return timelineData.map((point, index) => {
      const emotion = EMOTIONS[point.emotion] || EMOTIONS.neutral
      const y = height - (emotion.score / 100) * (height - 40)
      const x = index * 30 + 15
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    }).join(' ')
  }, [timelineData, height])

  const handlePointClick = (point) => {
    setActivePoint(point)
    onPointSelect?.(point)
  }

  const currentEmotion = timelineData[timelineData.length - 1]
  const currentEmotionData = EMOTIONS[currentEmotion?.emotion] || EMOTIONS.neutral

  return (
    <div className={`bg-slate-900/50 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            Emotion Timeline
            <span className="text-lg">{currentEmotionData.icon}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Track your emotional state during trading
          </p>
        </div>

        {/* Current state badge */}
        <div
          className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
          style={{
            backgroundColor: `${currentEmotionData.color}20`,
            color: currentEmotionData.color,
            borderColor: `${currentEmotionData.color}40`,
            borderWidth: 1
          }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentEmotionData.color }} />
          {currentEmotionData.label}
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="relative overflow-x-auto pb-2">
        <svg
          width={width}
          height={height}
          className="min-w-full"
        >
          {/* Horizontal grid lines */}
          {[25, 50, 75].map(pct => (
            <line
              key={pct}
              x1="0"
              y1={height - (pct / 100) * (height - 40)}
              x2={width}
              y2={height - (pct / 100) * (height - 40)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          ))}

          {/* Gradient fill under line */}
          <defs>
            <linearGradient id="emotionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`${linePath} L ${(timelineData.length - 1) * 30 + 15} ${height - 10} L 15 ${height - 10} Z`}
            fill="url(#emotionGradient)"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#emotionLineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="emotionLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>

          {/* Points */}
          {timelineData.map((point, index) => (
            <TimelinePoint
              key={point.id}
              point={point}
              index={index}
              isActive={hoveredPoint?.id === point.id || activePoint?.id === point.id}
              onClick={handlePointClick}
              height={height}
            />
          ))}

          {/* X-axis labels (time) */}
          {timelineData.filter((_, i) => i % 4 === 0).map((point, index) => (
            <text
              key={point.id}
              x={index * 4 * 30 + 15}
              y={height - 2}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize="10"
            >
              {new Date(point.timestamp).toLocaleTimeString('en-US', { hour: 'numeric' })}
            </text>
          ))}
        </svg>
      </div>

      {/* Active point details */}
      {(activePoint || hoveredPoint) && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          {(() => {
            const point = activePoint || hoveredPoint
            const emotion = EMOTIONS[point.emotion]
            return (
              <div className="flex items-start gap-3">
                <span className="text-2xl">{emotion.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{emotion.label}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(point.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{emotion.description}</p>
                  {point.event && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          point.event.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {point.event.action}
                      </span>
                      <span className="text-slate-300">{point.event.symbol}</span>
                    </div>
                  )}
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ color: emotion.color }}
                >
                  {emotion.score}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(EMOTIONS).map(([key, emotion]) => (
            <div
              key={key}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer hover:bg-slate-800/50 transition-colors"
              onMouseEnter={() => setHoveredPoint(timelineData.find(p => p.emotion === key))}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <span className="text-sm">{emotion.icon}</span>
              <span className="text-slate-400">{emotion.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trend indicator */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>24h Trend</span>
        <span
          className={`font-medium ${
            emotionTrend === 'positive' ? 'text-emerald-400' :
            emotionTrend === 'negative' ? 'text-rose-400' :
            'text-slate-400'
          }`}
        >
          {emotionTrend === 'positive' && '↗ Improving'}
          {emotionTrend === 'negative' && '↘ Declining'}
          {emotionTrend === 'stable' && '→ Stable'}
        </span>
      </div>
    </div>
  )
}

// Compact emotion indicator for other components
export function EmotionIndicator({ emotion = 'neutral', size = 'md' }) {
  const data = EMOTIONS[emotion] || EMOTIONS.neutral
  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${data.color}20`,
        color: data.color
      }}
    >
      <span>{data.icon}</span>
      <span>{data.label}</span>
    </span>
  )
}
