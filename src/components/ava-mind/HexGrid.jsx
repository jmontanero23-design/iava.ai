/**
 * HexGrid - Personality Trait Visualization
 *
 * Displays personality traits in a beautiful hexagonal grid pattern.
 * Each hexagon represents a trait with color intensity based on strength.
 *
 * Features:
 * - Honeycomb layout with responsive sizing
 * - Color-coded traits by category
 * - Hover tooltips with detailed info
 * - Animated glow effects
 * - Selection state for deep-dive
 */

import React, { useState } from 'react'

// Trait categories with colors
const TRAIT_CATEGORIES = {
  risk: {
    color: '#F59E0B', // Amber
    gradient: 'from-amber-500 to-orange-500'
  },
  style: {
    color: '#8B5CF6', // Purple
    gradient: 'from-purple-500 to-violet-500'
  },
  emotion: {
    color: '#EC4899', // Pink
    gradient: 'from-pink-500 to-rose-500'
  },
  timing: {
    color: '#06B6D4', // Cyan
    gradient: 'from-cyan-500 to-blue-500'
  },
  analysis: {
    color: '#10B981', // Emerald
    gradient: 'from-emerald-500 to-teal-500'
  }
}

// Default traits structure
const DEFAULT_TRAITS = [
  { id: 'risk', label: 'Risk', value: 50, category: 'risk', description: 'Risk tolerance level' },
  { id: 'speed', label: 'Speed', value: 50, category: 'style', description: 'Decision-making speed' },
  { id: 'patience', label: 'Patience', value: 50, category: 'emotion', description: 'Ability to wait for setups' },
  { id: 'timing', label: 'Timing', value: 50, category: 'timing', description: 'Entry/exit timing accuracy' },
  { id: 'analysis', label: 'Analysis', value: 50, category: 'analysis', description: 'Technical analysis depth' },
  { id: 'intuition', label: 'Intuition', value: 50, category: 'emotion', description: 'Gut feeling accuracy' },
  { id: 'discipline', label: 'Discipline', value: 50, category: 'risk', description: 'Rule adherence' }
]

// Hexagon path for SVG
const HEX_PATH = (size) => {
  const a = size
  const h = a * Math.sqrt(3) / 2
  return `M 0 ${-a} L ${h} ${-a/2} L ${h} ${a/2} L 0 ${a} L ${-h} ${a/2} L ${-h} ${-a/2} Z`
}

// Calculate hex positions in honeycomb pattern
function calculateHexPositions(count, hexSize, gap) {
  const positions = []
  const h = hexSize * Math.sqrt(3)
  const w = hexSize * 2

  // Center hex pattern layouts
  const patterns = {
    1: [[0, 0]],
    3: [[0, 0], [-w * 0.75, -h/2], [w * 0.75, -h/2]],
    5: [[0, 0], [-w * 0.75, -h/2], [w * 0.75, -h/2], [-w * 0.75, h/2], [w * 0.75, h/2]],
    7: [
      [0, 0],
      [-w * 0.75, -h/2], [w * 0.75, -h/2],
      [-w * 0.75, h/2], [w * 0.75, h/2],
      [0, -h], [0, h]
    ],
    9: [
      [0, 0],
      [-w * 0.75, -h/2], [w * 0.75, -h/2],
      [-w * 0.75, h/2], [w * 0.75, h/2],
      [0, -h], [0, h],
      [-w * 1.5, 0], [w * 1.5, 0]
    ]
  }

  const patternKey = Object.keys(patterns).reverse().find(k => parseInt(k) >= count) || '9'
  const pattern = patterns[patternKey]

  for (let i = 0; i < count; i++) {
    if (pattern[i]) {
      positions.push({ x: pattern[i][0], y: pattern[i][1] })
    }
  }

  return positions
}

function Hexagon({
  trait,
  x,
  y,
  size,
  isSelected,
  isHovered,
  onHover,
  onSelect
}) {
  const category = TRAIT_CATEGORIES[trait.category] || TRAIT_CATEGORIES.style
  const intensity = trait.value / 100

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => onHover(trait.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(trait.id)}
      className="cursor-pointer"
    >
      {/* Glow effect */}
      {(isHovered || isSelected) && (
        <path
          d={HEX_PATH(size + 4)}
          fill="none"
          stroke={category.color}
          strokeWidth="2"
          opacity="0.6"
          className="animate-pulse"
          filter="url(#glow)"
        />
      )}

      {/* Background hex */}
      <path
        d={HEX_PATH(size)}
        fill="rgba(30, 41, 59, 0.8)"
        stroke={category.color}
        strokeWidth={isSelected ? 2 : 1}
        strokeOpacity={0.3 + intensity * 0.5}
      />

      {/* Fill based on value */}
      <clipPath id={`clip-${trait.id}`}>
        <rect
          x={-size}
          y={size - (size * 2 * intensity)}
          width={size * 2}
          height={size * 2 * intensity}
        />
      </clipPath>
      <path
        d={HEX_PATH(size - 2)}
        fill={category.color}
        opacity={0.3 + intensity * 0.4}
        clipPath={`url(#clip-${trait.id})`}
      />

      {/* Label */}
      <text
        x="0"
        y="-4"
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="500"
        className="pointer-events-none select-none"
      >
        {trait.label}
      </text>

      {/* Value */}
      <text
        x="0"
        y="10"
        textAnchor="middle"
        fill={category.color}
        fontSize="12"
        fontWeight="700"
        className="pointer-events-none select-none"
      >
        {trait.value}%
      </text>
    </g>
  )
}

export default function HexGrid({
  traits = DEFAULT_TRAITS,
  hexSize = 40,
  gap = 8,
  onTraitSelect,
  className = ''
}) {
  const [hoveredTrait, setHoveredTrait] = useState(null)
  const [selectedTrait, setSelectedTrait] = useState(null)

  const positions = calculateHexPositions(traits.length, hexSize, gap)

  // Calculate viewBox dimensions
  const padding = 60
  const maxX = Math.max(...positions.map(p => Math.abs(p.x))) + hexSize + padding
  const maxY = Math.max(...positions.map(p => Math.abs(p.y))) + hexSize + padding

  const handleSelect = (traitId) => {
    setSelectedTrait(selectedTrait === traitId ? null : traitId)
    onTraitSelect?.(traitId)
  }

  const selectedTraitData = traits.find(t => t.id === selectedTrait || t.id === hoveredTrait)

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`${-maxX} ${-maxY} ${maxX * 2} ${maxY * 2}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Category gradients */}
          {Object.entries(TRAIT_CATEGORIES).map(([key, cat]) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cat.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={cat.color} stopOpacity="0.4" />
            </linearGradient>
          ))}
        </defs>

        {/* Connecting lines (optional visual) */}
        {positions.map((pos, i) => (
          positions.slice(i + 1).map((pos2, j) => {
            const distance = Math.sqrt((pos.x - pos2.x) ** 2 + (pos.y - pos2.y) ** 2)
            if (distance < hexSize * 3.5) {
              return (
                <line
                  key={`line-${i}-${j}`}
                  x1={pos.x}
                  y1={pos.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke="rgba(139, 92, 246, 0.1)"
                  strokeWidth="1"
                />
              )
            }
            return null
          })
        ))}

        {/* Hexagons */}
        {traits.map((trait, index) => (
          <Hexagon
            key={trait.id}
            trait={trait}
            x={positions[index]?.x || 0}
            y={positions[index]?.y || 0}
            size={hexSize}
            isSelected={selectedTrait === trait.id}
            isHovered={hoveredTrait === trait.id}
            onHover={setHoveredTrait}
            onSelect={handleSelect}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {selectedTraitData && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md rounded-lg px-4 py-3 border border-purple-500/30 max-w-xs text-center shadow-xl">
          <div
            className="w-3 h-3 rounded-full mx-auto mb-2"
            style={{ backgroundColor: TRAIT_CATEGORIES[selectedTraitData.category]?.color }}
          />
          <h4 className="text-white font-semibold">{selectedTraitData.label}</h4>
          <p className="text-slate-400 text-xs mt-1">{selectedTraitData.description}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${selectedTraitData.value}%`,
                  backgroundColor: TRAIT_CATEGORIES[selectedTraitData.category]?.color
                }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: TRAIT_CATEGORIES[selectedTraitData.category]?.color }}>
              {selectedTraitData.value}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for smaller spaces
export function HexGridCompact({ traits = [], className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 justify-center ${className}`}>
      {traits.map(trait => {
        const category = TRAIT_CATEGORIES[trait.category] || TRAIT_CATEGORIES.style
        return (
          <div
            key={trait.id}
            className="relative group"
            title={`${trait.label}: ${trait.value}%`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-transform group-hover:scale-110"
              style={{
                backgroundColor: `${category.color}30`,
                borderColor: category.color,
                borderWidth: 1
              }}
            >
              {trait.label.charAt(0)}
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 rounded-b-lg transition-all"
              style={{
                height: `${(trait.value / 100) * 100}%`,
                backgroundColor: `${category.color}40`
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
