/**
 * Badge - Elite UI Badge Component
 *
 * Features:
 * - Multiple variants (default, success, warning, error, info, purple)
 * - Sizes (sm, md, lg)
 * - Icon support
 * - Pulsing animation for live indicators
 */

import React from 'react'

const variants = {
  default: 'bg-slate-800 text-slate-300 border border-slate-700/50',
  success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-900/50 text-amber-400 border border-amber-500/30',
  error: 'bg-red-900/50 text-red-400 border border-red-500/30',
  info: 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/30',
  purple: 'bg-purple-900/50 text-purple-400 border border-purple-500/30',
  outline: 'bg-transparent text-slate-300 border border-slate-600'
}

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  pulse = false,
  dot = false,
  removable = false,
  onRemove,
  className = ''
}) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-medium
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
      {dot && (
        <span className={`
          w-1.5 h-1.5 rounded-full
          ${variant === 'success' ? 'bg-emerald-400' :
            variant === 'warning' ? 'bg-amber-400' :
            variant === 'error' ? 'bg-red-400' :
            variant === 'info' ? 'bg-cyan-400' :
            variant === 'purple' ? 'bg-purple-400' :
            'bg-slate-400'
          }
          ${pulse ? 'animate-pulse' : ''}
        `} />
      )}
      {icon && <span className="text-sm">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-0.5 -mr-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

// Status Badge with specific styling
export function StatusBadge({ status, className = '' }) {
  const statusConfig = {
    active: { variant: 'success', label: 'Active', pulse: true },
    inactive: { variant: 'default', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending', pulse: true },
    error: { variant: 'error', label: 'Error' },
    beta: { variant: 'purple', label: 'Beta' },
    new: { variant: 'info', label: 'New' },
    live: { variant: 'success', label: 'Live', pulse: true },
    offline: { variant: 'error', label: 'Offline' }
  }

  const config = statusConfig[status] || statusConfig.inactive

  return (
    <Badge
      variant={config.variant}
      dot
      pulse={config.pulse}
      className={className}
    >
      {config.label}
    </Badge>
  )
}

// Count Badge (for notifications)
export function CountBadge({
  count,
  max = 99,
  variant = 'error',
  className = ''
}) {
  if (!count || count <= 0) return null

  return (
    <span className={`
      inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
      text-[10px] font-bold rounded-full
      ${variant === 'error' ? 'bg-red-500 text-white' :
        variant === 'info' ? 'bg-cyan-500 text-white' :
        'bg-slate-600 text-white'
      }
      ${className}
    `}>
      {count > max ? `${max}+` : count}
    </span>
  )
}

// Tag Badge (for categories/labels)
export function TagBadge({
  children,
  color = 'cyan',
  onRemove,
  className = ''
}) {
  const colors = {
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border
      ${colors[color]}
      ${className}
    `}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-3.5 h-3.5 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
