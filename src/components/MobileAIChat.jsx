/**
 * MobileAIChat - Full-Screen Mobile AI Chat Experience
 *
 * PhD++ Quality mobile-first chat interface:
 * - Full-screen mode
 * - Swipe gestures
 * - Quick action chips
 * - Voice input prominence
 * - Safe area handling
 */

import React, { useState, useRef, useEffect } from 'react'
import AIChat from './AIChat.jsx'

export default function MobileAIChat({
  isOpen,
  onClose,
  initialMessage = ''
}) {
  const [showQuickActions, setShowQuickActions] = useState(true)
  const containerRef = useRef(null)

  // Quick action chips
  const quickActions = [
    { label: '📊 Analyze chart', message: 'Analyze the current chart and give me your recommendation' },
    { label: '🎯 Entry points', message: 'Where are the best entry points for this symbol?' },
    { label: '⚠️ Risk check', message: 'What are the risks I should be aware of?' },
    { label: '🔮 Forecast', message: 'What does AVA predict for this symbol?' },
    { label: '💼 Portfolio', message: 'How is my portfolio performing?' },
    { label: '📈 Top picks', message: 'What are your top stock picks today?' }
  ]

  // Handle swipe down to close
  const handleTouchStart = useRef({ y: 0 })
  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientY - handleTouchStart.current.y
    if (diff > 100 && containerRef.current?.scrollTop === 0) {
      onClose?.()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
      onTouchStart={(e) => { handleTouchStart.current.y = e.touches[0].clientY }}
      onTouchMove={handleTouchMove}
    >
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 bg-slate-900 border-b border-slate-800 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-white font-semibold">AVA Assistant</h1>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice button */}
            <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700">
              <span className="text-xl">🎤</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Swipe indicator */}
        <div className="flex justify-center mt-2">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>
      </header>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="flex-shrink-0 px-4 py-3 bg-slate-900/50 border-b border-slate-800/50 overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  // Dispatch message to chat
                  window.dispatchEvent(new CustomEvent('ava.chatMessage', {
                    detail: { message: action.message }
                  }))
                  setShowQuickActions(false)
                }}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        <AIChat />
      </div>

      {/* Bottom safe area */}
      <div className="safe-area-bottom bg-slate-900" />

      <style jsx>{`
        .safe-area-top {
          padding-top: max(12px, env(safe-area-inset-top));
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  )
}

// Hook to open mobile chat
export function useMobileChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [initialMessage, setInitialMessage] = useState('')

  const openChat = (message = '') => {
    setInitialMessage(message)
    setIsOpen(true)
  }

  const closeChat = () => {
    setIsOpen(false)
    setInitialMessage('')
  }

  return { isOpen, initialMessage, openChat, closeChat }
}

// Floating chat button for mobile
export function MobileChatButton({ onClick, hasUnread = false }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 shadow-lg shadow-purple-500/30 flex items-center justify-center text-2xl hover:scale-110 transition-transform active:scale-95"
      style={{ touchAction: 'manipulation' }}
    >
      <span>💬</span>
      {hasUnread && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
          !
        </span>
      )}
    </button>
  )
}
