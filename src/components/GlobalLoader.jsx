/**
 * Global Loading Indicator
 * Progress bar for long-running operations
 */

import { useState, useEffect } from 'react'

export default function GlobalLoader() {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Listen for global loading events
    const handleShow = (event) => {
      setIsVisible(true)
      setProgress(0)
      setMessage(event.detail?.message || 'Loading...')
    }

    const handleProgress = (event) => {
      setProgress(event.detail?.progress || 0)
      if (event.detail?.message) {
        setMessage(event.detail.message)
      }
    }

    const handleHide = () => {
      setProgress(100)
      setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
        setMessage('')
      }, 500)
    }

    window.addEventListener('iava.loading.show', handleShow)
    window.addEventListener('iava.loading.progress', handleProgress)
    window.addEventListener('iava.loading.hide', handleHide)

    return () => {
      window.removeEventListener('iava.loading.show', handleShow)
      window.removeEventListener('iava.loading.progress', handleProgress)
      window.removeEventListener('iava.loading.hide', handleHide)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      {/* Progress bar */}
      <div className="h-1 bg-slate-800/50 backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Message banner */}
      {message && (
        <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-2">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 truncate">{message}</p>
            </div>
            {progress > 0 && (
              <div className="flex-shrink-0 text-xs text-slate-400 font-mono">
                {Math.round(progress)}%
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions to trigger loading states
export const showGlobalLoader = (message = 'Loading...') => {
  window.dispatchEvent(new CustomEvent('iava.loading.show', {
    detail: { message }
  }))
}

export const updateGlobalLoader = (progress, message) => {
  window.dispatchEvent(new CustomEvent('iava.loading.progress', {
    detail: { progress, message }
  }))
}

export const hideGlobalLoader = () => {
  window.dispatchEvent(new CustomEvent('iava.loading.hide'))
}
