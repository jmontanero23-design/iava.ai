/**
 * AVAOrb - The living heart of AVA Mind
 *
 * A sophisticated breathing orb visualization that represents
 * the AI's current state, confidence, and activity level.
 *
 * Features:
 * - Breathing animation that syncs with state
 * - Particle effects around the orb
 * - Color transitions based on mood/confidence
 * - Interactive hover states
 * - Pulsing rings that indicate activity
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'

// State-to-color mapping with gradients
const STATE_COLORS = {
  idle: {
    primary: '#8B5CF6', // Purple
    secondary: '#06B6D4', // Cyan
    glow: 'rgba(139, 92, 246, 0.4)'
  },
  learning: {
    primary: '#06B6D4', // Cyan
    secondary: '#3B82F6', // Blue
    glow: 'rgba(6, 182, 212, 0.4)'
  },
  thinking: {
    primary: '#8B5CF6', // Purple
    secondary: '#EC4899', // Pink
    glow: 'rgba(139, 92, 246, 0.5)'
  },
  suggesting: {
    primary: '#F59E0B', // Amber
    secondary: '#EF4444', // Orange-red
    glow: 'rgba(245, 158, 11, 0.4)'
  },
  executing: {
    primary: '#10B981', // Emerald
    secondary: '#06B6D4', // Cyan
    glow: 'rgba(16, 185, 129, 0.5)'
  },
  confident: {
    primary: '#10B981', // Emerald
    secondary: '#22C55E', // Green
    glow: 'rgba(16, 185, 129, 0.4)'
  },
  cautious: {
    primary: '#F59E0B', // Amber
    secondary: '#EF4444', // Red
    glow: 'rgba(245, 158, 11, 0.4)'
  }
}

// Generate particles around the orb
function generateParticles(count, radius) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    const distance = radius + Math.random() * 30
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 1 + Math.random() * 2,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.5,
      delay: Math.random() * 2
    }
  })
}

export default function AVAOrb({
  state = 'idle',
  confidence = 0,
  activityLevel = 0, // 0-1, how active the orb should appear
  size = 200,
  onClick,
  showStats = true
}) {
  const [breathPhase, setBreathPhase] = useState(0)
  const [hovered, setHovered] = useState(false)
  const particlesRef = useRef(generateParticles(24, size / 2 - 20))
  const animationRef = useRef(null)

  const colors = STATE_COLORS[state] || STATE_COLORS.idle

  // Breathing animation
  useEffect(() => {
    let frame = 0
    const breathSpeed = state === 'executing' ? 0.08 : state === 'thinking' ? 0.05 : 0.03

    const animate = () => {
      frame += breathSpeed
      setBreathPhase(Math.sin(frame) * 0.5 + 0.5)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state])

  // Calculate dynamic sizes based on breath
  const breathScale = 1 + breathPhase * 0.08
  const innerSize = size * 0.7
  const coreSize = size * 0.4

  // Confidence ring calculations
  const confidenceRingRadius = (size / 2) - 8
  const confidenceCircumference = 2 * Math.PI * confidenceRingRadius
  const confidenceOffset = confidenceCircumference - (confidence / 100) * confidenceCircumference

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Outer glow layer */}
      <div
        className="absolute inset-0 rounded-full blur-xl transition-all duration-500"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          transform: `scale(${breathScale * 1.2})`,
          opacity: 0.6 + activityLevel * 0.4
        }}
      />

      {/* Particle field */}
      <svg
        className="absolute inset-0 pointer-events-none"
        viewBox={`${-size/2} ${-size/2} ${size} ${size}`}
        style={{ transform: `translate(${size/2}px, ${size/2}px)` }}
      >
        <defs>
          <radialGradient id="particleGradient">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </radialGradient>
        </defs>
        {particlesRef.current.map(particle => (
          <circle
            key={particle.id}
            cx={particle.x * breathScale}
            cy={particle.y * breathScale}
            r={particle.size}
            fill={colors.primary}
            opacity={particle.opacity * (0.3 + activityLevel * 0.7)}
            className="animate-pulse"
            style={{
              animationDelay: `${particle.delay}s`,
              animationDuration: `${2 / particle.speed}s`
            }}
          />
        ))}
      </svg>

      {/* Pulsing rings */}
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="absolute rounded-full border opacity-20"
          style={{
            inset: -10 - i * 15,
            borderColor: colors.primary,
            animation: `ping ${3 + i}s cubic-bezier(0, 0, 0.2, 1) infinite`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      ))}

      {/* Confidence ring */}
      <svg
        className="absolute inset-0"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={confidenceRingRadius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        {/* Confidence progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={confidenceRingRadius}
          fill="none"
          stroke={`url(#confidenceGradient-${state})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={confidenceCircumference}
          strokeDashoffset={confidenceOffset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id={`confidenceGradient-${state}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
        </defs>
      </svg>

      {/* Outer orb */}
      <div
        className="absolute rounded-full transition-transform duration-300"
        style={{
          inset: 15,
          background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 100%)`,
          backdropFilter: 'blur(8px)',
          border: `1px solid ${colors.primary}40`,
          transform: `scale(${breathScale})`,
        }}
      />

      {/* Inner orb */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          inset: (size - innerSize) / 2,
          background: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.secondary}40 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${colors.primary}60`,
          transform: `scale(${breathScale})`,
          boxShadow: `inset 0 0 30px ${colors.glow}`
        }}
      >
        {/* Core */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: coreSize,
            height: coreSize,
            background: `radial-gradient(circle at 30% 30%, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: `0 0 40px ${colors.glow}, inset 0 0 20px rgba(255,255,255,0.2)`,
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.3s ease'
          }}
        >
          {/* State indicator icon */}
          <span className="text-2xl drop-shadow-lg">
            {state === 'learning' && '🧠'}
            {state === 'thinking' && '💭'}
            {state === 'suggesting' && '💡'}
            {state === 'executing' && '⚡'}
            {state === 'confident' && '✨'}
            {state === 'cautious' && '⚠️'}
            {state === 'idle' && '👁️'}
          </span>
        </div>
      </div>

      {/* Stats overlay (on hover) */}
      {showStats && hovered && (
        <div
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md rounded-lg px-4 py-2 border border-purple-500/30 whitespace-nowrap z-10"
        >
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">State</span>
              <span className="ml-2 text-white capitalize font-medium">{state}</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div>
              <span className="text-slate-400">Confidence</span>
              <span className="ml-2 text-purple-400 font-medium">{confidence}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mini version for sidebar/header use
export function AVAOrbMini({ state = 'idle', size = 32, pulse = true }) {
  const colors = STATE_COLORS[state] || STATE_COLORS.idle

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      {pulse && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: colors.glow,
            opacity: 0.5
          }}
        />
      )}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          boxShadow: `0 0 10px ${colors.glow}`
        }}
      />
    </div>
  )
}
