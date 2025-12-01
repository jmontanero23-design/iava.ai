/**
 * TopBar - LEGENDARY Header Component
 *
 * The signature top navigation bar with glass morphism styling.
 * Features:
 * - Logo with unicorn gradient glow
 * - Symbol selector
 * - Market status indicator
 * - User menu
 * - Safe area support for mobile
 *
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html
 */

import { useState, useEffect } from 'react'
import { LogoFull, LogoMark } from '../ui/Logo'
import { useMarketData } from '../../contexts/MarketDataContext'
import { colors, gradients, animation } from '../../styles/tokens'
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Menu,
  X,
} from 'lucide-react'

export default function TopBar({
  onMenuClick,
  showMenu = false,
  onSymbolChange,
  currentSymbol,
  className = '',
}) {
  const { symbol, marketData, setSymbol } = useMarketData()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Use currentSymbol prop if provided, otherwise use context
  const displaySymbol = currentSymbol || symbol || 'SPY'

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get price change direction
  const getChangeInfo = () => {
    if (!marketData?.changePercent) {
      return { icon: Minus, color: colors.text[50], label: '0.00%' }
    }
    const percent = marketData.changePercent
    if (percent > 0) {
      return {
        icon: TrendingUp,
        color: colors.emerald[400],
        label: `+${percent.toFixed(2)}%`,
      }
    }
    if (percent < 0) {
      return {
        icon: TrendingDown,
        color: colors.red[400],
        label: `${percent.toFixed(2)}%`,
      }
    }
    return { icon: Minus, color: colors.text[50], label: '0.00%' }
  }

  const changeInfo = getChangeInfo()
  const ChangeIcon = changeInfo.icon

  // Market open check (simplified - just time-based for demo)
  const isMarketOpen = () => {
    const now = new Date()
    const hours = now.getHours()
    const day = now.getDay()
    return day >= 1 && day <= 5 && hours >= 9 && hours < 16
  }

  const marketOpen = isMarketOpen()

  // Handle symbol selection
  const handleSymbolSelect = (sym) => {
    if (onSymbolChange) {
      onSymbolChange(sym)
    }
    if (setSymbol) {
      setSymbol(sym)
    }
    setShowSearch(false)
    setSearchQuery('')
  }

  return (
    <header
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        height: 56,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: colors.glass.bgHeavy,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${colors.glass.border}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          maxWidth: 1800,
          margin: '0 auto',
        }}
      >
        {/* Left section - Logo & Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mobile menu toggle */}
          {isMobile && onMenuClick && (
            <button
              onClick={onMenuClick}
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                background: showMenu ? colors.purple.dim : 'transparent',
                border: showMenu ? `1px solid ${colors.purple[500]}30` : '1px solid transparent',
                transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
              }}
            >
              {showMenu ? (
                <X style={{ width: 20, height: 20, color: colors.purple[400] }} />
              ) : (
                <Menu style={{ width: 20, height: 20, color: colors.text[50] }} />
              )}
            </button>
          )}

          {/* Logo - On desktop, logo is in IconRail, so just show on mobile */}
          {isMobile && (
            <LogoMark size={32} />
          )}
        </div>

        {/* Center section - Symbol & Price */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Symbol selector button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 10,
              background: colors.glass.bg,
              border: `1px solid ${colors.glass.border}`,
              cursor: 'pointer',
              transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: colors.text[100],
                letterSpacing: '0.02em',
              }}
            >
              {displaySymbol}
            </span>
            <ChevronDown
              style={{
                width: 14,
                height: 14,
                color: colors.text[30],
                transition: `transform ${animation.duration.fast}ms`,
                transform: showSearch ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Price & Change (desktop only) */}
          {!isMobile && marketData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: colors.text[100],
                }}
              >
                ${marketData.price?.toFixed(2) || '0.00'}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: `${changeInfo.color}15`,
                }}
              >
                <ChangeIcon
                  style={{ width: 14, height: 14, color: changeInfo.color }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: changeInfo.color,
                  }}
                >
                  {changeInfo.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right section - Status & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Market Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 8,
              background: marketOpen ? colors.emerald.dim : colors.red.dim,
              border: `1px solid ${marketOpen ? colors.emerald[400] : colors.red[400]}30`,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: marketOpen ? colors.emerald[400] : colors.red[400],
                boxShadow: `0 0 6px ${marketOpen ? colors.emerald.glow : colors.red.glow}`,
                animation: marketOpen ? 'pulse 2s ease-in-out infinite' : 'none',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: marketOpen ? colors.emerald[400] : colors.red[400],
                display: isMobile ? 'none' : 'block',
              }}
            >
              {marketOpen ? 'LIVE' : 'CLOSED'}
            </span>
          </div>

          {/* Search (desktop) */}
          {!isMobile && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.border = '1px solid transparent'
              }}
            >
              <Search style={{ width: 18, height: 18, color: colors.text[50] }} />
            </button>
          )}

          {/* Notifications */}
          <button
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.border = '1px solid transparent'
            }}
          >
            <Bell style={{ width: 18, height: 18, color: colors.text[50] }} />
            {/* Notification dot */}
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: colors.red[500],
                border: `2px solid ${colors.depth1}`,
              }}
            />
          </button>

          {/* Settings (desktop only) */}
          {!isMobile && (
            <button
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.border = '1px solid transparent'
              }}
            >
              <Settings style={{ width: 18, height: 18, color: colors.text[50] }} />
            </button>
          )}
        </div>
      </div>

      {/* Search Dropdown */}
      {showSearch && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: isMobile ? 'calc(100% - 32px)' : 400,
            marginTop: 8,
            padding: 12,
            background: colors.glass.bgHeavy,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${colors.glass.border}`,
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${colors.glass.border}`,
              borderRadius: 10,
            }}
          >
            <Search style={{ width: 16, height: 16, color: colors.text[30] }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbols..."
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 14,
                color: colors.text[100],
              }}
            />
          </div>

          {/* Quick picks */}
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 11, color: colors.text[30], marginBottom: 8, display: 'block' }}>
              Popular
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'AMD'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => handleSymbolSelect(sym)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: displaySymbol === sym ? colors.purple.dim : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${displaySymbol === sym ? colors.purple[500] + '40' : 'transparent'}`,
                    color: displaySymbol === sym ? colors.purple[400] : colors.text[50],
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: `all ${animation.duration.fast}ms ${animation.easing.smooth}`,
                  }}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close search */}
      {showSearch && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
          }}
          onClick={() => setShowSearch(false)}
        />
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  )
}
