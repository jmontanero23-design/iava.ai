import { useState, useEffect } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import {
  LineChart, Brain, Target, MessageSquare, Search, BarChart3,
  Clock, Eye, BookOpen, Settings, TrendingUp, TrendingDown,
  Bell, ChevronLeft, ChevronRight, Briefcase
} from 'lucide-react'
import { LogoMark, LogoFull } from './ui/Logo'

/**
 * Collapsible Sidebar Navigation - Elite 2025 Edition
 *
 * Professional Bloomberg-inspired sidebar with Lucide icons
 * Desktop only - hidden on mobile (mobile uses bottom nav)
 */
export default function CollapsibleSidebar({ activeTab, onTabChange }) {
  const [isCollapsed, setIsCollapsed] = useState(() =>
    localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const [hoveredItem, setHoveredItem] = useState(null)
  const { marketData } = useMarketData()

  // Navigation items with Lucide icons
  const navigation = [
    {
      id: 'chart',
      label: 'Chart',
      Icon: LineChart,
      hotkey: '1',
      badge: null,
      color: 'cyan',
      description: 'Advanced trading chart'
    },
    {
      id: 'ai-hub',
      label: 'AI Hub',
      Icon: Brain,
      hotkey: '2',
      badge: null,
      color: 'purple',
      description: 'AI command center'
    },
    {
      id: 'scanner',
      label: 'Scanner',
      Icon: Search,
      hotkey: '3',
      badge: null,
      color: 'teal',
      description: 'Market scanner'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      Icon: Briefcase,
      hotkey: '4',
      badge: null,
      color: 'amber',
      description: 'Positions & orders'
    },
    {
      id: 'ava-mind',
      label: 'AVA Mind',
      Icon: LogoMark,
      hotkey: '5',
      isLogo: true,
      badge: null,
      color: 'violet',
      description: 'AI digital twin'
    },
    {
      id: 'ai-chat',
      label: 'AI Chat',
      Icon: MessageSquare,
      hotkey: '6',
      badge: null,
      color: 'blue',
      description: 'Chat with AVA'
    },
    {
      id: 'market-sentiment',
      label: 'Sentiment',
      Icon: BarChart3,
      hotkey: '7',
      badge: null,
      color: 'emerald',
      description: 'Market sentiment'
    },
    {
      id: 'multi-timeframe',
      label: 'Multi-TF',
      Icon: Clock,
      hotkey: null,
      badge: null,
      color: 'amber',
      description: 'Multi-timeframe analysis'
    },
    {
      id: 'pattern-recognition',
      label: 'Patterns',
      Icon: Eye,
      hotkey: null,
      badge: null,
      color: 'pink',
      description: 'Pattern detection'
    },
    {
      id: 'trade-journal',
      label: 'Journal',
      Icon: BookOpen,
      hotkey: null,
      badge: null,
      color: 'slate',
      description: 'Trade journal'
    }
  ]

  // Quick actions with Lucide icons
  const quickActions = [
    { id: 'buy', label: 'Buy', Icon: TrendingUp, action: 'trade.buy', color: 'emerald' },
    { id: 'sell', label: 'Sell', Icon: TrendingDown, action: 'trade.sell', color: 'rose' },
    { id: 'scan', label: 'Scan', Icon: Search, action: 'scan.market', color: 'cyan' },
    { id: 'alert', label: 'Alert', Icon: Bell, action: 'alert.create', color: 'amber' }
  ]

  // Toggle sidebar
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', newState.toString())
  }

  // Keyboard shortcut for toggle (Alt+S)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isCollapsed])

  // Handle quick action
  const handleQuickAction = (action) => {
    window.dispatchEvent(new CustomEvent('iava.executeCommand', {
      detail: { action }
    }))

    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: { text: `Executing: ${action}`, type: 'info' }
    }))
  }

  // Get color classes for items
  const getColorClasses = (color, isActive) => {
    const colors = {
      indigo: isActive
        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
        : 'hover:bg-indigo-600/10 hover:text-indigo-400',
      purple: isActive
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
        : 'hover:bg-purple-600/10 hover:text-purple-400',
      blue: isActive
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
        : 'hover:bg-blue-600/10 hover:text-blue-400',
      cyan: isActive
        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
        : 'hover:bg-cyan-600/10 hover:text-cyan-400',
      emerald: isActive
        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30'
        : 'hover:bg-emerald-600/10 hover:text-emerald-400',
      amber: isActive
        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30'
        : 'hover:bg-amber-600/10 hover:text-amber-400',
      pink: isActive
        ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/30'
        : 'hover:bg-pink-600/10 hover:text-pink-400',
      slate: isActive
        ? 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/30'
        : 'hover:bg-slate-600/10 hover:text-slate-400',
      gray: isActive
        ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg shadow-gray-500/30'
        : 'hover:bg-gray-600/10 hover:text-gray-400'
    }
    return colors[color] || colors.slate
  }

  return (
    <div
      className={`hidden md:flex fixed left-0 top-0 h-full flex-col transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between">
          {!isCollapsed ? (
            <LogoFull size={28} />
          ) : (
            <LogoMark size={28} style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))' }} />
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
            title={`${isCollapsed ? 'Expand' : 'Collapse'} (Alt+S)`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-2 overflow-y-auto">
        {navigation.map((item) => {
          const IconComponent = item.Icon
          const isActive = activeTab === item.id

          return (
            <div key={item.id} className="relative px-2">
              <button
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.isLogo ? (
                  <IconComponent
                    size={20}
                    className="flex-shrink-0"
                    style={{
                      filter: isActive
                        ? 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.5))'
                        : 'none',
                      opacity: isActive ? 1 : 0.7
                    }}
                  />
                ) : (
                  <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                )}
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.hotkey && (
                      <kbd className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-black/30">
                        {item.hotkey}
                      </kbd>
                    )}
                  </>
                )}
              </button>

              {/* Tooltip for collapsed state */}
              {isCollapsed && hoveredItem === item.id && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50">
                  <div className="rounded-lg shadow-xl p-2.5 whitespace-nowrap" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                    <div className="font-medium text-white text-sm">{item.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="grid grid-cols-2 gap-1.5">
            {quickActions.map((action) => {
              const IconComponent = action.Icon
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.action)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5
                    ${action.color === 'emerald' ? 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20' : ''}
                    ${action.color === 'rose' ? 'bg-rose-600/10 text-rose-400 hover:bg-rose-600/20' : ''}
                    ${action.color === 'cyan' ? 'bg-cyan-600/10 text-cyan-400 hover:bg-cyan-600/20' : ''}
                    ${action.color === 'amber' ? 'bg-amber-600/10 text-amber-400 hover:bg-amber-600/20' : ''}
                  `}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Market Status */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              marketData?.marketOpen ? 'bg-emerald-400' : 'bg-slate-500'
            }`} />
            <span className="text-slate-500">
              {marketData?.marketOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          {!isCollapsed && (
            <span className="text-slate-600">{marketData?.symbol || 'SPY'}</span>
          )}
        </div>
      </div>

      {/* Collapsed Quick Actions */}
      {isCollapsed && (
        <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => handleQuickAction('trade.buy')}
            className="w-full p-2 mb-1 bg-emerald-600/10 hover:bg-emerald-600/20 rounded-lg text-emerald-400 transition-all"
            title="Buy"
          >
            <TrendingUp className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => handleQuickAction('trade.sell')}
            className="w-full p-2 bg-rose-600/10 hover:bg-rose-600/20 rounded-lg text-rose-400 transition-all"
            title="Sell"
          >
            <TrendingDown className="w-4 h-4 mx-auto" />
          </button>
        </div>
      )}
    </div>
  )
}