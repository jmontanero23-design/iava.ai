/**
 * TradingPatternChart - Pattern Visualization
 *
 * Visualizes trading patterns discovered by AVA Mind service.
 * Shows performance across different dimensions (symbol, timeframe, day, hour).
 *
 * Features:
 * - Multiple view modes (bar, radar, heatmap)
 * - Interactive filtering
 * - Win rate visualization
 * - P&L overlay
 * - Trend indicators
 */

import React, { useState, useMemo } from 'react'

// Chart type configurations
const CHART_TYPES = {
  bar: { label: 'Bar Chart', icon: '📊' },
  radar: { label: 'Radar', icon: '🎯' },
  heatmap: { label: 'Heatmap', icon: '🌡️' }
}

// Dimension labels
const DIMENSIONS = {
  symbols: { label: 'Symbols', description: 'Performance by ticker' },
  timeframes: { label: 'Timeframes', description: 'Performance by chart timeframe' },
  daysOfWeek: { label: 'Days', description: 'Performance by day of week' },
  hoursOfDay: { label: 'Hours', description: 'Performance by hour of day' },
  setupTypes: { label: 'Setups', description: 'Performance by trade setup' }
}

// Bar chart component
function BarChart({ data, dimension, height = 200 }) {
  const [hoveredBar, setHoveredBar] = useState(null)

  const entries = useMemo(() => {
    if (!data || !data[dimension]) return []
    return Object.entries(data[dimension])
      .map(([key, stats]) => ({
        key,
        winRate: stats.winRate || 0,
        total: stats.total || 0,
        pnl: stats.totalPnl || 0
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 10)
  }, [data, dimension])

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No pattern data yet. Trade more to see your patterns!
      </div>
    )
  }

  const maxWinRate = Math.max(...entries.map(e => e.winRate), 100)
  const barWidth = Math.max(40, (100 / entries.length) - 2)

  return (
    <div className="relative" style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-slate-500 py-2">
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>

      {/* Chart area */}
      <div className="ml-10 h-full flex items-end gap-1">
        {entries.map((entry, index) => {
          const barHeight = (entry.winRate / maxWinRate) * (height - 30)
          const isHovered = hoveredBar === entry.key
          const isGood = entry.winRate >= 60
          const isBad = entry.winRate < 40

          return (
            <div
              key={entry.key}
              className="flex-1 flex flex-col items-center"
              style={{ maxWidth: `${barWidth}%` }}
              onMouseEnter={() => setHoveredBar(entry.key)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-800 rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10 shadow-xl border border-slate-700">
                  <div className="font-semibold text-white">{entry.key}</div>
                  <div className="flex gap-3 mt-1">
                    <span className={isGood ? 'text-emerald-400' : isBad ? 'text-rose-400' : 'text-slate-300'}>
                      {entry.winRate.toFixed(0)}% win
                    </span>
                    <span className="text-slate-400">{entry.total} trades</span>
                    <span className={entry.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ${entry.pnl.toFixed(0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-md transition-all duration-200 cursor-pointer relative overflow-hidden"
                style={{
                  height: barHeight,
                  backgroundColor: isGood
                    ? isHovered ? '#10B981' : '#10B98150'
                    : isBad
                    ? isHovered ? '#EF4444' : '#EF444450'
                    : isHovered ? '#8B5CF6' : '#8B5CF650',
                  transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                  transformOrigin: 'bottom'
                }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10"
                  style={{ opacity: isHovered ? 1 : 0.3 }}
                />

                {/* Win rate label on bar */}
                {barHeight > 30 && (
                  <div className="absolute inset-x-0 top-2 text-center text-xs font-bold text-white/80">
                    {entry.winRate.toFixed(0)}%
                  </div>
                )}
              </div>

              {/* X-axis label */}
              <div
                className={`mt-1 text-xs truncate transition-colors ${
                  isHovered ? 'text-white' : 'text-slate-500'
                }`}
                style={{ maxWidth: '100%' }}
                title={entry.key}
              >
                {entry.key.length > 6 ? entry.key.slice(0, 5) + '…' : entry.key}
              </div>
            </div>
          )
        })}
      </div>

      {/* 50% reference line */}
      <div
        className="absolute left-10 right-0 border-t border-dashed border-slate-600"
        style={{ top: height / 2 }}
      >
        <span className="absolute -top-2.5 -left-2 text-xs text-slate-500">50%</span>
      </div>
    </div>
  )
}

// Radar chart for multi-dimensional view
function RadarChart({ data, height = 200 }) {
  const dimensions = ['symbols', 'timeframes', 'daysOfWeek', 'hoursOfDay', 'setupTypes']

  // Calculate average win rate per dimension
  const values = useMemo(() => {
    return dimensions.map(dim => {
      if (!data?.[dim]) return 0
      const entries = Object.values(data[dim])
      if (entries.length === 0) return 0
      const avg = entries.reduce((sum, e) => sum + (e.winRate || 0), 0) / entries.length
      return avg
    })
  }, [data])

  const center = height / 2
  const radius = (height / 2) - 30
  const angleStep = (2 * Math.PI) / dimensions.length

  // Generate polygon points
  const points = values.map((value, i) => {
    const angle = i * angleStep - Math.PI / 2
    const r = (value / 100) * radius
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r
    }
  })

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${height} ${height}`} className="w-full h-full">
      {/* Background rings */}
      {[25, 50, 75, 100].map(pct => (
        <circle
          key={pct}
          cx={center}
          cy={center}
          r={(pct / 100) * radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + Math.cos(angle) * radius}
            y2={center + Math.sin(angle) * radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="rgba(139, 92, 246, 0.3)"
        stroke="#8B5CF6"
        strokeWidth="2"
      />

      {/* Data points */}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="#8B5CF6"
          stroke="white"
          strokeWidth="2"
        />
      ))}

      {/* Labels */}
      {dimensions.map((dim, i) => {
        const angle = i * angleStep - Math.PI / 2
        const labelRadius = radius + 20
        const x = center + Math.cos(angle) * labelRadius
        const y = center + Math.sin(angle) * labelRadius
        return (
          <text
            key={dim}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.6)"
            fontSize="10"
          >
            {DIMENSIONS[dim]?.label || dim}
          </text>
        )
      })}
    </svg>
  )
}

// Heatmap for hour-of-day patterns
function HeatmapChart({ data, height = 200 }) {
  const [hoveredCell, setHoveredCell] = useState(null)

  // Build hour x day matrix
  const matrix = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const hours = Array.from({ length: 8 }, (_, i) => 9 + i) // 9 AM to 4 PM

    return days.map(day => ({
      day,
      hours: hours.map(hour => {
        const hourData = data?.hoursOfDay?.[hour]
        const dayData = data?.daysOfWeek?.[day]

        // Approximate combined performance
        const winRate = hourData?.winRate || dayData?.winRate || 50
        const trades = (hourData?.total || 0) + (dayData?.total || 0)

        return {
          hour,
          winRate,
          trades,
          key: `${day}-${hour}`
        }
      })
    }))
  }, [data])

  const cellWidth = 100 / 8
  const cellHeight = (height - 30) / 5

  return (
    <div className="relative" style={{ height }}>
      {/* Hour labels */}
      <div className="flex ml-16 mb-1">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="text-xs text-slate-500 text-center"
            style={{ width: `${cellWidth}%` }}
          >
            {9 + i}:00
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-0.5">
        {matrix.map((row, dayIndex) => (
          <div key={row.day} className="flex items-center">
            {/* Day label */}
            <div className="w-16 text-xs text-slate-500 text-right pr-2">
              {row.day.slice(0, 3)}
            </div>

            {/* Cells */}
            <div className="flex-1 flex gap-0.5">
              {row.hours.map(cell => {
                const isHovered = hoveredCell === cell.key
                const intensity = cell.winRate / 100
                const isGood = cell.winRate >= 60
                const isBad = cell.winRate < 40

                return (
                  <div
                    key={cell.key}
                    className="flex-1 rounded-sm cursor-pointer transition-all relative"
                    style={{
                      height: cellHeight,
                      backgroundColor: isGood
                        ? `rgba(16, 185, 129, ${0.2 + intensity * 0.6})`
                        : isBad
                        ? `rgba(239, 68, 68, ${0.2 + (1 - intensity) * 0.6})`
                        : `rgba(139, 92, 246, ${0.2 + intensity * 0.4})`,
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                      zIndex: isHovered ? 10 : 1
                    }}
                    onMouseEnter={() => setHoveredCell(cell.key)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 rounded-lg px-3 py-2 text-xs whitespace-nowrap z-20 shadow-xl border border-slate-700">
                        <div className="font-semibold text-white">{row.day} {cell.hour}:00</div>
                        <div className="mt-1">
                          <span className={isGood ? 'text-emerald-400' : isBad ? 'text-rose-400' : 'text-slate-300'}>
                            {cell.winRate.toFixed(0)}% win rate
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-sm bg-rose-500/50" />
          <span>&lt; 40%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-sm bg-purple-500/50" />
          <span>40-60%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-sm bg-emerald-500/50" />
          <span>&gt; 60%</span>
        </div>
      </div>
    </div>
  )
}

export default function TradingPatternChart({
  patterns = null,
  height = 250,
  className = ''
}) {
  const [chartType, setChartType] = useState('bar')
  const [dimension, setDimension] = useState('symbols')

  const hasData = patterns && Object.keys(patterns).some(key =>
    patterns[key] && Object.keys(patterns[key]).length > 0
  )

  return (
    <div className={`bg-slate-900/50 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Trading Patterns</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {DIMENSIONS[dimension]?.description || 'Your performance patterns'}
          </p>
        </div>

        {/* Chart type selector */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {Object.entries(CHART_TYPES).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                chartType === type
                  ? 'bg-purple-500/30 text-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={config.label}
            >
              {config.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Dimension tabs (only for bar chart) */}
      {chartType === 'bar' && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {Object.entries(DIMENSIONS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setDimension(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                dimension === key
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <span className="text-4xl mb-3">📊</span>
            <p className="text-sm">No pattern data yet</p>
            <p className="text-xs mt-1">Trade more to discover your patterns</p>
          </div>
        ) : chartType === 'bar' ? (
          <BarChart data={patterns} dimension={dimension} height={height} />
        ) : chartType === 'radar' ? (
          <RadarChart data={patterns} height={height} />
        ) : (
          <HeatmapChart data={patterns} height={height} />
        )}
      </div>
    </div>
  )
}
