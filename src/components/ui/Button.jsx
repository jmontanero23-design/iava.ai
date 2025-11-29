/**
 * Button - Elite UI Button Component
 *
 * Features:
 * - Multiple variants (primary, secondary, ghost, danger, success)
 * - Multiple sizes (sm, md, lg)
 * - Loading state with spinner
 * - Icon support (left/right)
 * - 44px+ touch targets on mobile
 * - Ripple effect (optional)
 */

import React, { useState, useRef } from 'react'

const variants = {
  primary: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25',
  secondary: 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border border-slate-700/50',
  ghost: 'hover:bg-slate-800/50 text-slate-400 hover:text-white',
  danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg shadow-red-500/25',
  success: 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/25',
  outline: 'border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400'
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg min-h-[28px]',
  sm: 'px-3 py-1.5 text-sm rounded-lg min-h-[36px]',
  md: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]',
  lg: 'px-6 py-3 text-base rounded-xl min-h-[52px]',
  xl: 'px-8 py-4 text-lg rounded-2xl min-h-[60px]'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  ripple = true,
  onClick,
  className = '',
  ...props
}) {
  const [ripples, setRipples] = useState([])
  const buttonRef = useRef(null)

  const handleClick = (e) => {
    if (disabled || loading) return

    // Create ripple effect
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const rippleId = Date.now()

      setRipples(prev => [...prev, { id: rippleId, x, y }])

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== rippleId))
      }, 600)
    }

    onClick?.(e)
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center gap-2
        font-semibold transition-all duration-150 ease-out
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
        overflow-hidden
        ${className}
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(r => (
        <span
          key={r.id}
          className="absolute bg-white/30 rounded-full pointer-events-none animate-ripple"
          style={{
            left: r.x,
            top: r.y,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Loading spinner */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit">
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}

      {/* Content */}
      <span className={`flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
        {icon && iconPosition === 'left' && <span className="text-lg">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className="text-lg">{icon}</span>}
      </span>

      {/* Ripple animation style */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 500px;
            height: 500px;
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }
      `}</style>
    </button>
  )
}

// Icon Button variant
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  tooltip = '',
  ...props
}) {
  const iconSizes = {
    xs: 'w-7 h-7 text-sm',
    sm: 'w-9 h-9 text-base',
    md: 'w-11 h-11 text-lg',
    lg: 'w-14 h-14 text-xl'
  }

  return (
    <button
      className={`
        ${iconSizes[size]}
        rounded-xl flex items-center justify-center
        transition-all duration-150
        ${variants[variant]}
        active:scale-90
      `}
      title={tooltip}
      {...props}
    >
      {icon}
    </button>
  )
}

// Button Group
export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`inline-flex rounded-xl overflow-hidden ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child, {
          className: `${child.props.className || ''} ${
            index === 0 ? 'rounded-r-none' :
            index === React.Children.count(children) - 1 ? 'rounded-l-none' :
            'rounded-none'
          } border-r-0 last:border-r`
        })
      })}
    </div>
  )
}
