import React, { useEffect, useState } from 'react'

export default function ToastHub() {
  const [toasts, setToasts] = useState([])
  const MAX_TOASTS = 3 // Stack limit

  useEffect(() => {
    const onToast = (e) => {
      try {
        const detail = e.detail || {}
        const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`
        const type = detail.type || 'info'
        const t = {
          id,
          text: String(detail.text || ''),
          type,
          ttl: detail.ttl || 3000,
          action: detail.action, // Optional: { label: 'View', onClick: fn }
        }

        setToasts(prev => {
          // Add new toast, but limit to MAX_TOASTS
          const newToasts = [t, ...prev].slice(0, MAX_TOASTS)
          return newToasts
        })

        // Auto-remove after TTL
        setTimeout(() => {
          setToasts(prev => prev.filter(x => x.id !== id))
        }, t.ttl)
      } catch {}
    }
    window.addEventListener('iava.toast', onToast)
    return () => window.removeEventListener('iava.toast', onToast)
  }, [])

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'signal': return '⚡'
      default: return 'ℹ️'
    }
  }

  const getStyles = (type) => {
    const base = 'px-4 py-3 rounded-lg border text-sm text-slate-50 shadow-xl backdrop-blur-md'
    switch (type) {
      case 'success':
        return `${base} bg-emerald-600/90 border-emerald-400/50`
      case 'error':
        return `${base} bg-rose-600/90 border-rose-400/50`
      case 'warning':
        return `${base} bg-amber-600/90 border-amber-400/50`
      case 'signal':
        return `${base} bg-indigo-600/90 border-indigo-400/50 signal-glow`
      default:
        return `${base} bg-slate-800/95 border-slate-600/50`
    }
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t, idx) => (
        <div
          key={t.id}
          className={`${getStyles(t.type)} toast-enter flex items-start gap-3 group relative`}
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          {/* Icon */}
          <span className="text-xl flex-shrink-0">{getIcon(t.type)}</span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium leading-tight">{t.text}</p>
          </div>

          {/* Action Button (optional) */}
          {t.action && (
            <button
              onClick={() => {
                t.action.onClick?.()
                removeToast(t.id)
              }}
              className="px-2 py-1 text-xs rounded bg-white/20 hover:bg-white/30 transition-all flex-shrink-0"
            >
              {t.action.label || 'View'}
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={() => removeToast(t.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-current">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
