/**
 * Card - Elite UI Card Component
 *
 * Features:
 * - Multiple variants (default, elevated, glass, interactive)
 * - Header/footer sections
 * - Hover effects
 * - Loading state
 */

import React from 'react'

const variants = {
  default: 'bg-slate-900/50 backdrop-blur-xl border border-slate-800/50',
  elevated: 'bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 shadow-xl',
  glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
  interactive: 'bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-slate-700/50 hover:bg-slate-800/30 cursor-pointer transition-all',
  gradient: 'bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border border-slate-700/30',
  highlight: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/30'
}

const sizes = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl'
}

export default function Card({
  children,
  variant = 'default',
  size = 'lg',
  padding = true,
  hover = false,
  onClick,
  className = '',
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${padding ? 'p-4 md:p-6' : ''}
        ${hover ? 'hover:scale-[1.02] transition-transform duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Header
export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className = ''
}) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-xl">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          {subtitle && (
            <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Card Body
export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

// Card Footer
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-slate-800/50 ${className}`}>
      {children}
    </div>
  )
}

// Stats Card
export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  icon,
  className = ''
}) {
  const changeColors = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-slate-400'
  }

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
              {changeType === 'positive' && '+'}
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center text-2xl">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// Feature Card
export function FeatureCard({
  title,
  description,
  icon,
  status,
  onClick,
  className = ''
}) {
  const statusColors = {
    active: 'bg-emerald-500',
    inactive: 'bg-slate-600',
    beta: 'bg-amber-500',
    new: 'bg-purple-500'
  }

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={className}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-2xl shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-semibold truncate">{title}</h4>
            {status && (
              <span className={`w-2 h-2 rounded-full ${statusColors[status] || statusColors.inactive}`} />
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{description}</p>
        </div>
      </div>
    </Card>
  )
}
