import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Brain, Search, Briefcase,
  MessageSquare, BarChart3, Eye, BookOpen, Clock, Settings
} from 'lucide-react'

// iAVA Logo component - neural network + chart design
const IAVALogo = ({ className, style }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="logoGradNav" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <circle cx="60" cy="140" r="8" fill="url(#logoGradNav)" opacity="0.6"/>
    <circle cx="100" cy="140" r="8" fill="url(#logoGradNav)" opacity="0.6"/>
    <circle cx="140" cy="140" r="8" fill="url(#logoGradNav)" opacity="0.6"/>
    <circle cx="80" cy="100" r="10" fill="url(#logoGradNav)" opacity="0.8"/>
    <circle cx="120" cy="100" r="10" fill="url(#logoGradNav)" opacity="0.8"/>
    <circle cx="100" cy="60" r="12" fill="url(#logoGradNav)"/>
    <line x1="60" y1="140" x2="80" y2="100" stroke="url(#logoGradNav)" strokeWidth="3" opacity="0.4"/>
    <line x1="100" y1="140" x2="80" y2="100" stroke="url(#logoGradNav)" strokeWidth="3" opacity="0.4"/>
    <line x1="100" y1="140" x2="120" y2="100" stroke="url(#logoGradNav)" strokeWidth="3" opacity="0.4"/>
    <line x1="140" y1="140" x2="120" y2="100" stroke="url(#logoGradNav)" strokeWidth="3" opacity="0.4"/>
    <line x1="80" y1="100" x2="100" y2="60" stroke="url(#logoGradNav)" strokeWidth="3" opacity="0.7"/>
    <line x1="120" y1="100" x2="100" y2="60" stroke="url(#logoGradNav)" strokeWidth="3" opacity="0.7"/>
    <path d="M 95 50 L 100 40 L 105 50 Z" fill="url(#logoGradNav)"/>
    <path d="M 40 130 Q 70 110, 100 90 T 160 70" stroke="url(#logoGradNav)" strokeWidth="4" fill="none" opacity="0.5" strokeLinecap="round"/>
  </svg>
)

/**
 * Mobile Bottom Navigation - Elite 2025 Edition
 *
 * Professional mobile navigation with Lucide icons
 * - 44px+ touch targets (iOS/Android HIG compliance)
 * - Haptic feedback on tap
 * - Safe area support for notched devices
 */
export default function MobileBottomNav({ activeTab, onTabChange, badges = {} }) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [pressedItem, setPressedItem] = useState(null)
  const [notifications, setNotifications] = useState({
    ai: badges['ai-hub'] || 0,
    alerts: badges['alerts'] || 0,
    trades: badges['portfolio'] || 0,
    scanner: badges['scanner'] || 0
  })

  // Update notifications from badges prop
  useEffect(() => {
    setNotifications(prev => ({
      ...prev,
      ai: badges['ai-hub'] || prev.ai,
      alerts: badges['alerts'] || prev.alerts,
      trades: badges['portfolio'] || prev.trades,
      scanner: badges['scanner'] || prev.scanner
    }))
  }, [badges])

  // Primary navigation items with Lucide icons
  const primaryNav = [
    {
      id: 'chart',
      label: 'Chart',
      Icon: LineChart,
      color: '#06B6D4', // cyan
      gradient: 'from-cyan-500/20 to-blue-500/20'
    },
    {
      id: 'ai-hub',
      label: 'AI Hub',
      Icon: Brain,
      color: '#8B5CF6', // purple
      gradient: 'from-violet-500/20 to-purple-500/20',
      badge: notifications.ai > 0 ? notifications.ai : null
    },
    {
      id: 'scanner',
      label: 'Scanner',
      Icon: Search,
      color: '#14B8A6', // teal
      gradient: 'from-teal-500/20 to-emerald-500/20',
      badge: notifications.scanner > 0 ? notifications.scanner : null
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      Icon: Briefcase,
      color: '#F59E0B', // amber
      gradient: 'from-amber-500/20 to-orange-500/20',
      badge: notifications.trades > 0 ? notifications.trades : null
    },
    {
      id: 'ava-mind',
      label: 'AVA',
      Icon: IAVALogo, // Custom logo
      color: '#8B5CF6', // purple matching logo gradient
      gradient: 'from-purple-500/20 to-emerald-500/20',
      isLogo: true // Flag to render differently
    }
  ]

  // Secondary navigation with Lucide icons
  const secondaryNav = [
    { id: 'ai-chat', label: 'AI Chat', Icon: MessageSquare, color: 'blue' },
    { id: 'market-sentiment', label: 'Sentiment', Icon: BarChart3, color: 'emerald' },
    { id: 'pattern-recognition', label: 'Patterns', Icon: Eye, color: 'pink' },
    { id: 'trade-journal', label: 'Journal', Icon: BookOpen, color: 'slate' },
    { id: 'multi-timeframe', label: 'Multi-TF', Icon: Clock, color: 'amber' },
    { id: 'settings', label: 'Settings', Icon: Settings, color: 'gray' }
  ]

  // Enhanced haptic feedback
  const triggerHaptic = useCallback((intensity = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: [10, 50, 10],
        heavy: [20, 50, 20]
      }
      navigator.vibrate(patterns[intensity] || 10)
    }
  }, [])

  // Handle navigation with press state
  const handleNavClick = useCallback((item) => {
    triggerHaptic('light')
    setPressedItem(item.id)

    // Reset pressed state after animation
    setTimeout(() => setPressedItem(null), 150)

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
  }, [showMoreMenu, onTabChange, triggerHaptic])

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
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden">
          <div className="absolute bottom-20 left-0 right-0 mobile-more-menu">
            <div
              className="mx-4 rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">More Features</h3>
                <div className="grid grid-cols-3 gap-2">
                  {secondaryNav.map((item) => {
                    const IconComponent = item.Icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id)
                          setShowMoreMenu(false)
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                          activeTab === item.id
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-xs">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div
                className="px-4 py-3"
                style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>17 AI Features</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                    Market Open
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar - 44px+ touch targets */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden layer-nav"
        style={{
          background: 'var(--bg-base)',
          borderTop: '1px solid var(--border-subtle)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          zIndex: 'var(--z-nav)'
        }}
      >
        <div className="flex items-stretch justify-around px-1 py-1">
          {primaryNav.map((item) => {
            const isActive = activeTab === item.id
            const isPressed = pressedItem === item.id
            const IconComponent = item.Icon

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                onTouchStart={() => setPressedItem(item.id)}
                onTouchEnd={() => setTimeout(() => setPressedItem(null), 100)}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[56px] min-h-[56px] py-2 px-2 rounded-xl
                  transition-all duration-150 ease-out
                  ${isActive
                    ? `bg-gradient-to-b ${item.gradient} border border-white/10`
                    : 'active:bg-white/5'
                  }
                  ${isPressed ? 'scale-90' : 'scale-100'}
                `}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                {/* Active indicator dot at top */}
                {isActive && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}

                {/* Icon with badge */}
                <div className="relative">
                  <IconComponent
                    className={`w-5 h-5 transition-transform duration-150 ${
                      isActive ? 'scale-110' : 'scale-100'
                    } ${isPressed ? 'scale-125' : ''}`}
                    style={{ color: isActive ? item.color : '#94a3b8' }}
                  />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-medium mt-1 transition-colors duration-150 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                  style={{ color: isActive ? item.color : undefined }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* iPhone-style home indicator */}
        <div className="flex justify-center pt-1 pb-2">
          <div className="w-32 h-1 bg-slate-700 rounded-full" />
        </div>
      </nav>

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