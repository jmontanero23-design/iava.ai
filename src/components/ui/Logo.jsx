/**
 * iAVA.ai Official Logo Component
 *
 * The neural network with prediction arc.
 * Symbolism:
 * - Prediction Arc: AI's ability to forecast market movements
 * - Neural Network Tree: Intelligence distributed across nodes
 * - 7 Nodes: Completeness - central node is AVA Mind
 * - Unicorn Gradient: Indigo → Purple → Cyan
 *
 * Based on: iava-logo-system.html
 */

import { memo, useMemo } from 'react'

// Unique ID generator for gradient references
let logoIdCounter = 0
const getUniqueId = () => `logo-grad-${++logoIdCounter}`

/**
 * Logo Mark - The neural network symbol only
 */
export const LogoMark = memo(function LogoMark({
  size = 40,
  animated = false,
  className = '',
  style = {},
}) {
  const gradientId = useMemo(() => getUniqueId(), [])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{
        filter: 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.5))',
        ...style,
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* Prediction Arc - The curved line representing forecasting */}
      <path
        d="M20 40 Q50 15 80 40"
        stroke={`url(#${gradientId})`}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        className={animated ? 'animate-arc' : ''}
      />

      {/* Neural Network - Connections */}
      <line x1="50" y1="35" x2="30" y2="55" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
      <line x1="50" y1="35" x2="70" y2="55" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
      <line x1="50" y1="35" x2="50" y2="60" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
      <line x1="30" y1="55" x2="20" y2="75" stroke={`url(#${gradientId})`} strokeWidth="2" />
      <line x1="30" y1="55" x2="40" y2="75" stroke={`url(#${gradientId})`} strokeWidth="2" />
      <line x1="70" y1="55" x2="60" y2="75" stroke={`url(#${gradientId})`} strokeWidth="2" />
      <line x1="70" y1="55" x2="80" y2="75" stroke={`url(#${gradientId})`} strokeWidth="2" />

      {/* Neural Network - Nodes */}
      <circle cx="50" cy="35" r="7" fill={`url(#${gradientId})`} /> {/* Central - AVA Mind */}
      <circle cx="30" cy="55" r="5" fill={`url(#${gradientId})`} /> {/* Left mid */}
      <circle cx="70" cy="55" r="5" fill={`url(#${gradientId})`} /> {/* Right mid */}
      <circle cx="20" cy="75" r="4" fill={`url(#${gradientId})`} /> {/* Bottom nodes */}
      <circle cx="40" cy="75" r="4" fill={`url(#${gradientId})`} />
      <circle cx="60" cy="75" r="4" fill={`url(#${gradientId})`} />
      <circle cx="80" cy="75" r="4" fill={`url(#${gradientId})`} />

      {/* Central node highlight */}
      <circle cx="50" cy="35" r="3" fill="white" opacity="0.6" />
    </svg>
  )
})

/**
 * Logo Full - Mark + Wordmark
 */
export const LogoFull = memo(function LogoFull({
  size = 40,
  variant = 'horizontal',
  className = '',
  style = {},
}) {
  const isVertical = variant === 'vertical'

  return (
    <div
      className={`flex items-center ${isVertical ? 'flex-col gap-2' : 'gap-3'} ${className}`}
      style={style}
    >
      <LogoMark size={size} />
      <span
        style={{
          fontSize: size * 0.55,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        iAVA.ai
      </span>
    </div>
  )
})

/**
 * App Icon - For mobile app icon / favicon
 */
export const AppIcon = memo(function AppIcon({
  size = 80,
  className = '',
  style = {},
}) {
  const gradientId = useMemo(() => getUniqueId(), [])

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Top shine */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
        }}
      />

      {/* Logo in white */}
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 100 100"
        fill="none"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <path
          d="M20 40 Q50 15 80 40"
          stroke="white"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <line x1="50" y1="35" x2="30" y2="55" stroke="white" strokeWidth="3" />
        <line x1="50" y1="35" x2="70" y2="55" stroke="white" strokeWidth="3" />
        <line x1="50" y1="35" x2="50" y2="60" stroke="white" strokeWidth="3" />
        <line x1="30" y1="55" x2="20" y2="75" stroke="white" strokeWidth="2.5" />
        <line x1="30" y1="55" x2="40" y2="75" stroke="white" strokeWidth="2.5" />
        <line x1="70" y1="55" x2="60" y2="75" stroke="white" strokeWidth="2.5" />
        <line x1="70" y1="55" x2="80" y2="75" stroke="white" strokeWidth="2.5" />
        <circle cx="50" cy="35" r="7" fill="white" />
        <circle cx="30" cy="55" r="6" fill="white" />
        <circle cx="70" cy="55" r="6" fill="white" />
        <circle cx="20" cy="75" r="5" fill="white" />
        <circle cx="40" cy="75" r="5" fill="white" />
        <circle cx="60" cy="75" r="5" fill="white" />
        <circle cx="80" cy="75" r="5" fill="white" />
      </svg>
    </div>
  )
})

/**
 * Loading Logo - Animated version for loading states
 */
export const LoadingLogo = memo(function LoadingLogo({
  size = 60,
  className = '',
  style = {},
}) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        ...style,
      }}
    >
      {/* Spinning rings */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '3px solid transparent',
          borderTopColor: '#a855f7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 6,
          border: '3px solid transparent',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite reverse',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 12,
          border: '3px solid transparent',
          borderTopColor: '#22d3ee',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }}
      />
      {/* Core */}
      <div
        style={{
          position: 'absolute',
          inset: 18,
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
          borderRadius: '50%',
        }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

// Default export - the main logo mark
export default LogoMark
