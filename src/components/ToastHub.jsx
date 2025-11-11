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
    const base = 'px-5 py-4 rounded-xl border text-sm text-white shadow-2xl backdrop-blur-md'
    switch (type) {
      case 'success':
        return `${base} bg-gradient-to-r from-emerald-600/90 to-emerald-500/80 border-emerald-400/50`
      case 'error':
        return `${base} bg-gradient-to-r from-rose-600/90 to-rose-500/80 border-rose-400/50`
      case 'warning':
        return `${base} bg-gradient-to-r from-amber-600/90 to-amber-500/80 border-amber-400/50`
      case 'signal':
        return `${base} bg-gradient-to-r from-indigo-600/90 to-purple-600/80 border-indigo-400/50 signal-glow`
      default:
        return `${base} bg-gradient-to-r from-slate-800/95 to-slate-700/90 border-slate-600/50`
    }
  }

  const getGlowColor = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-600'
      case 'error': return 'bg-rose-600'
      case 'warning': return 'bg-amber-600'
      case 'signal': return 'bg-indigo-600'
      default: return 'bg-slate-600'
    }
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md">
      {toasts.map((t, idx) => (
        <div
          key={t.id}
          className="toast-enter relative group"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          {/* Premium glow effect */}
          <div className={`absolute inset-0 ${getGlowColor(t.type)} blur-xl opacity-30 group-hover:opacity-40 rounded-xl transition-opacity`} />

          {/* Toast content */}
          <div className={`${getStyles(t.type)} relative flex items-start gap-3`}>
            {/* Icon with glow */}
            <div className="relative">
              <div className={`absolute inset-0 ${getGlowColor(t.type)} blur-lg opacity-50 rounded-full`} />
              <span className="relative text-2xl flex-shrink-0 filter drop-shadow-lg">{getIcon(t.type)}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight text-white">{t.text}</p>
            </div>

            {/* Action Button (optional) */}
            {t.action && (
              <button
                onClick={() => {
                  t.action.onClick?.()
                  removeToast(t.id)
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition-all flex-shrink-0 border border-white/20 hover:border-white/30"
              >
                {t.action.label || 'View'}
              </button>
            )}

            {/* Premium Close Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 opacity-60 hover:opacity-100 transition-all flex items-center justify-center ml-1"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
