/**
 * StatusBadge - Accessible status indicator with color + icon
 * Ensures status is communicated through both visual color AND icon/text
 * Follows WCAG 2.1 guidelines for non-color dependent status indicators
 */

const STATUS_CONFIG = {
  success: {
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    label: 'Success'
  },
  warning: {
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    label: 'Warning'
  },
  error: {
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    classes: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    label: 'Error'
  },
  info: {
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    label: 'Info'
  },
  pending: {
    icon: (
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    ),
    classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    label: 'Pending'
  },
  active: {
    icon: (
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
    ),
    classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    label: 'Active'
  },
  inactive: {
    icon: (
      <span className="w-2 h-2 rounded-full bg-current opacity-50" />
    ),
    classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    label: 'Inactive'
  }
}

export default function StatusBadge({
  status = 'info',
  children,
  showIcon = true,
  size = 'sm',
  className = ''
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.info

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs gap-1',
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2'
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${config.classes} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={children ? undefined : config.label}
    >
      {showIcon && config.icon}
      {children || config.label}
    </span>
  )
}

// Named exports for common statuses
export const SuccessBadge = (props) => <StatusBadge status="success" {...props} />
export const WarningBadge = (props) => <StatusBadge status="warning" {...props} />
export const ErrorBadge = (props) => <StatusBadge status="error" {...props} />
export const InfoBadge = (props) => <StatusBadge status="info" {...props} />
export const PendingBadge = (props) => <StatusBadge status="pending" {...props} />
export const ActiveBadge = (props) => <StatusBadge status="active" {...props} />
export const InactiveBadge = (props) => <StatusBadge status="inactive" {...props} />
