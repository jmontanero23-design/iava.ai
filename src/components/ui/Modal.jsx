/**
 * Modal - Elite UI Modal Component
 *
 * Features:
 * - Multiple sizes (sm, md, lg, xl, full)
 * - Animation variants (fade, slide, scale)
 * - Focus trap
 * - Click outside to close
 * - Escape key to close
 * - Mobile sheet variant
 */

import React, { useEffect, useCallback, useRef } from 'react'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full mx-4'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showClose = true,
  footer,
  className = ''
}) {
  const modalRef = useRef(null)
  const previousActiveElement = useRef(null)

  // Handle escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose()
    }
  }, [closeOnEscape, onClose])

  // Handle click outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose()
    }
  }

  // Focus trap and body scroll lock
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)

      // Focus first focusable element
      setTimeout(() => {
        const focusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }, 100)
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
      previousActiveElement.current?.focus()
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizes[size]}
          bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl
          animate-scale-in
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between p-5 border-b border-slate-800/50">
            <div>
              {title && (
                <h2 id="modal-title" className="text-xl font-bold text-white">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-400">{description}</p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 -mt-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800/50">
            {footer}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

// Confirmation Modal
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger', 'warning', 'info'
  loading = false
}) {
  const variants = {
    danger: {
      icon: '🚨',
      buttonClass: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: '⚠️',
      buttonClass: 'bg-amber-600 hover:bg-amber-700'
    },
    info: {
      icon: 'ℹ️',
      buttonClass: 'bg-cyan-600 hover:bg-cyan-700'
    }
  }

  const v = variants[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showClose={false}
    >
      <div className="text-center">
        <div className="text-5xl mb-4">{v.icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400">{message}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-3 ${v.buttonClass} text-white rounded-xl font-medium transition-colors flex items-center justify-center`}
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : confirmText}
        </button>
      </div>
    </Modal>
  )
}

// Alert Modal
export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  buttonText = 'OK'
}) {
  const types = {
    success: { icon: '✅', color: 'text-emerald-400' },
    error: { icon: '❌', color: 'text-red-400' },
    warning: { icon: '⚠️', color: 'text-amber-400' },
    info: { icon: 'ℹ️', color: 'text-cyan-400' }
  }

  const t = types[type]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="text-center">
        <div className="text-5xl mb-4">{t.icon}</div>
        <h3 className={`text-xl font-bold mb-2 ${t.color}`}>{title}</h3>
        <p className="text-slate-400">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
      >
        {buttonText}
      </button>
    </Modal>
  )
}

// Sheet (mobile bottom modal)
export function Sheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto', // 'auto', 'half', 'full'
  className = ''
}) {
  const heights = {
    auto: '',
    half: 'h-[50vh]',
    full: 'h-[90vh]'
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`
          absolute bottom-0 left-0 right-0
          bg-slate-900 rounded-t-3xl shadow-2xl
          animate-slide-up
          ${heights[height]}
          ${className}
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-4 border-b border-slate-800/50">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
