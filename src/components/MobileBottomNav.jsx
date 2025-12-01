import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Brain, Search, Briefcase,
  MessageSquare, BarChart3, Eye, BookOpen, Clock, Settings
} from 'lucide-react'
import { LogoMark } from './ui/Logo'
import { colors, gradients, animation } from '../styles/tokens'

/**
 * Mobile Bottom Navigation - LEGENDARY Edition
 *
 * THE signature mobile navigation with unicorn gradient styling
 * - 44px+ touch targets (iOS/Android HIG compliance)
 * - Haptic feedback on tap
 * - Safe area support for notched devices
 * - Glass morphism with depth
 * - Unicorn gradient active states
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

  // Primary navigation items matching mockup: Trade, Discover, AI Hub, Portfolio, AVA
  const primaryNav = [
    {
      id: 'chart',
      label: 'Trade',
      Icon: LineChart,
      color: colors.cyan[400],
      dimColor: colors.cyan.dim,
      glowColor: colors.cyan.glow,
    },
    {
      id: 'discover',
      label: 'Discover',
      Icon: Search,
      color: colors.emerald[400],
      dimColor: colors.emerald.dim,
      glowColor: colors.emerald.glow,
    },
    {
      id: 'ai-hub',
      label: 'AI Hub',
      Icon: Brain,
      color: colors.purple[500],
      dimColor: colors.purple.dim,
      glowColor: colors.purple.glow,
      badge: notifications.ai > 0 ? notifications.ai : null
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      Icon: Briefcase,
      color: colors.amber[400],
      dimColor: colors.amber.dim,
      glowColor: colors.amber.glow,
      badge: notifications.trades > 0 ? notifications.trades : null
    },
    {
      id: 'ava-mind',
      label: 'AVA',
      Icon: LogoMark,
      color: colors.indigo[400],
      dimColor: colors.indigo.dim,
      glowColor: colors.indigo.glow,
      isLogo: true // Flag to render the logo with unicorn gradient
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
      {/* More Menu Overlay - LEGENDARY glass morphism */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div className="absolute bottom-24 left-0 right-0 mobile-more-menu px-4">
            <div
              style={{
                background: colors.glass.bgHeavy,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: `1px solid ${colors.glass.border}`,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ padding: 16 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.text[70],
                    marginBottom: 12,
                  }}
                >
                  More Features
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {secondaryNav.map((item) => {
                    const IconComponent = item.Icon
                    const isActive = activeTab === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id)
                          setShowMoreMenu(false)
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          padding: 12,
                          borderRadius: 12,
                          border: isActive
                            ? `1px solid ${colors.purple[500]}40`
                            : '1px solid transparent',
                          background: isActive
                            ? colors.purple.dim
                            : 'rgba(255, 255, 255, 0.03)',
                          transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
                        }}
                      >
                        <IconComponent
                          style={{
                            width: 20,
                            height: 20,
                            color: isActive ? colors.purple[400] : colors.text[30],
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: isActive ? colors.purple[400] : colors.text[50],
                          }}
                        >
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Stats footer */}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderTop: `1px solid ${colors.glass.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 11, color: colors.text[30] }}>
                  17 AI Features
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      background: colors.emerald[400],
                      borderRadius: '50%',
                      boxShadow: `0 0 6px ${colors.emerald.glow}`,
                    }}
                  />
                  <span style={{ fontSize: 11, color: colors.emerald[400] }}>
                    Market Open
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar - LEGENDARY glass morphism */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: colors.glass.bgHeavy,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${colors.glass.border}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
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
                className="relative flex flex-col items-center justify-center"
                style={{
                  minWidth: 56,
                  minHeight: 56,
                  padding: '8px',
                  borderRadius: 12,
                  transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
                  background: isActive ? item.dimColor : 'transparent',
                  border: isActive ? `1px solid ${item.color}30` : '1px solid transparent',
                  transform: isPressed ? 'scale(0.9)' : 'scale(1)',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                {/* Active indicator bar at top */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 32,
                      height: 3,
                      borderRadius: 2,
                      background: item.isLogo ? gradients.unicorn : item.color,
                      boxShadow: `0 0 8px ${item.glowColor}`,
                    }}
                  />
                )}

                {/* Icon with badge */}
                <div style={{ position: 'relative' }}>
                  {item.isLogo ? (
                    <IconComponent
                      size={22}
                      style={{
                        transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        filter: isActive
                          ? `drop-shadow(0 0 10px ${colors.purple.glow})`
                          : 'none',
                        opacity: isActive ? 1 : 0.6,
                      }}
                    />
                  ) : (
                    <IconComponent
                      style={{
                        width: 22,
                        height: 22,
                        transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        color: isActive ? item.color : colors.text[30],
                        filter: isActive
                          ? `drop-shadow(0 0 6px ${item.glowColor})`
                          : 'none',
                      }}
                    />
                  )}
                  {item.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -10,
                        minWidth: 16,
                        height: 16,
                        padding: '0 4px',
                        background: colors.red[500],
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 8px ${colors.red.glow}`,
                      }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    marginTop: 4,
                    transition: `color ${animation.duration.fast}ms ${animation.easing.smooth}`,
                    color: isActive ? item.color : colors.text[30],
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* iPhone-style home indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 4,
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              width: 134,
              height: 5,
              background: colors.text[20],
              borderRadius: 3,
            }}
          />
        </div>
      </nav>

      {/* CSS for animations */}
      <style>{`
        @media (max-width: 768px) {
          .main-content {
            padding-bottom: 100px !important;
          }
        }

        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }

        .mobile-more-menu {
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
}