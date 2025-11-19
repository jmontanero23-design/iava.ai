import { useState, useEffect } from 'react'

/**
 * Mobile Bottom Navigation
 *
 * Elite 2025 mobile-first navigation inspired by modern fintech apps
 * PhD++ quality with haptic feedback support and smooth animations
 */
export default function MobileBottomNav({ activeTab, onTabChange }) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [notifications, setNotifications] = useState({
    ai: 3,
    alerts: 5,
    trades: 0
  })

  // Primary navigation items (max 5 for mobile UX best practice)
  const primaryNav = [
    {
      id: 'chart',
      label: 'Chart',
      icon: '📊',
      color: 'indigo'
    },
    {
      id: 'ai-hub',
      label: 'AI Hub',
      icon: '🤖',
      color: 'purple',
      badge: '17'
    },
    {
      id: 'trade',
      label: 'Trade',
      icon: '💰',
      color: 'emerald',
      isAction: true
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: '🔔',
      color: 'amber',
      badge: notifications.alerts > 0 ? notifications.alerts : null
    },
    {
      id: 'more',
      label: 'More',
      icon: '≡',
      color: 'slate',
      isMenu: true
    }
  ]

  // Secondary navigation (in "More" menu)
  const secondaryNav = [
    { id: 'ai-chat', label: 'AI Chat', icon: '💬', color: 'blue' },
    { id: 'nlp-scanner', label: 'Scanner', icon: '🔍', color: 'cyan' },
    { id: 'market-sentiment', label: 'Sentiment', icon: '💭', color: 'emerald' },
    { id: 'pattern-recognition', label: 'Patterns', icon: '🔍', color: 'pink' },
    { id: 'trade-journal', label: 'Journal', icon: '📓', color: 'slate' },
    { id: 'multi-timeframe', label: 'Multi-TF', icon: '⏰', color: 'amber' },
    { id: 'settings', label: 'Settings', icon: '⚙️', color: 'gray' }
  ]

  // Handle navigation
  const handleNavClick = (item) => {
    // Haptic feedback on supported devices
    if (window.navigator.vibrate) {
      window.navigator.vibrate(10)
    }

    if (item.isMenu) {
      setShowMoreMenu(!showMoreMenu)
      return
    }

    if (item.isAction) {
      // Special handling for trade action
      window.dispatchEvent(new CustomEvent('iava.openTradePanel'))
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Trade panel opened', type: 'info' }
      }))
      return
    }

    onTabChange(item.id)
    setShowMoreMenu(false)
  }

  // Close more menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMoreMenu && !e.target.closest('.mobile-more-menu')) {
        setShowMoreMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMoreMenu])

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Only render on mobile
  if (!isMobile) return null

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden">
          <div className="absolute bottom-20 left-0 right-0 mobile-more-menu">
            <div className="mx-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">More Features</h3>
                <div className="grid grid-cols-4 gap-3">
                  {secondaryNav.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id)
                        setShowMoreMenu(false)
                      }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                        activeTab === item.id
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>17 AI Features Active</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Market Open
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 z-50 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {primaryNav.map((item) => {
            const isActive = !item.isMenu && !item.isAction && activeTab === item.id
            const isMoreActive = item.isMenu && showMoreMenu

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                  item.isAction
                    ? 'scale-110' // Make trade button slightly larger
                    : ''
                }`}
              >
                {/* Special styling for trade action button */}
                {item.isAction ? (
                  <div className="absolute inset-2 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30 flex flex-col items-center justify-center">
                    <span className="text-2xl text-white">{item.icon}</span>
                    <span className="text-xs font-medium text-white">{item.label}</span>
                  </div>
                ) : (
                  <>
                    {/* Icon with badge */}
                    <div className="relative">
                      <span className={`text-2xl transition-all ${
                        isActive || isMoreActive
                          ? 'text-indigo-400 scale-110'
                          : 'text-slate-400'
                      }`}>
                        {item.icon}
                      </span>
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 px-1 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <span className={`text-xs transition-all ${
                      isActive || isMoreActive
                        ? 'text-indigo-400 font-medium'
                        : 'text-slate-500'
                    }`}>
                      {item.label}
                    </span>

                    {/* Active indicator */}
                    {(isActive || isMoreActive) && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" />
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* iPhone-style home indicator */}
        <div className="pb-safe">
          <div className="mx-auto w-32 h-1 bg-slate-700 rounded-full mt-2" />
        </div>
      </div>

      {/* Floating Action Buttons (FAB) for quick actions */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-40 md:hidden">
        {/* Mic button for voice input */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('iava.startVoiceInput'))
            if (window.navigator.vibrate) window.navigator.vibrate(20)
          }}
          className="w-12 h-12 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white hover:scale-110 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Command palette button */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('iava.toggleCommandPalette'))
            if (window.navigator.vibrate) window.navigator.vibrate(20)
          }}
          className="w-12 h-12 bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-slate-300 hover:scale-110 transition-all"
        >
          <span className="text-xl">⌘</span>
        </button>
      </div>

      {/* Add padding to main content to account for bottom nav */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .main-content {
            padding-bottom: 80px !important;
          }
        }

        /* Safe area for iPhone notch/home indicator */
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }

        /* Smooth transitions */
        .mobile-more-menu {
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}