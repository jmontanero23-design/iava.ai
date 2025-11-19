import { useState, useEffect } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

/**
 * Collapsible Sidebar Navigation
 *
 * Elite 2025 Bloomberg-inspired sidebar with intelligent collapse/expand
 * PhD++ quality with smooth animations and keyboard shortcuts
 */
export default function CollapsibleSidebar({ activeTab, onTabChange }) {
  const [isCollapsed, setIsCollapsed] = useState(() =>
    localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const [hoveredItem, setHoveredItem] = useState(null)
  const { marketData } = useMarketData()

  // Navigation items with full configuration
  const navigation = [
    {
      id: 'chart',
      label: 'Trading Chart',
      icon: '📊',
      hotkey: '1',
      badge: null,
      color: 'indigo',
      description: 'Advanced charting with TradingView'
    },
    {
      id: 'ai-hub',
      label: 'AI Hub',
      icon: '🤖',
      hotkey: '2',
      badge: '17',
      color: 'purple',
      description: 'Command center for all AI features'
    },
    {
      id: 'ai-features',
      label: 'AI Dashboard',
      icon: '🎯',
      hotkey: '3',
      badge: '12',
      color: 'indigo',
      description: 'Original AI features dashboard'
    },
    {
      id: 'ai-chat',
      label: 'AI Assistant',
      icon: '💬',
      hotkey: '4',
      badge: null,
      color: 'blue',
      description: 'Chat with AI trading assistant'
    },
    {
      id: 'nlp-scanner',
      label: 'NLP Scanner',
      icon: '🔤',
      hotkey: '5',
      badge: null,
      color: 'cyan',
      description: 'Natural language market queries'
    },
    {
      id: 'market-sentiment',
      label: 'Sentiment',
      icon: '💭',
      hotkey: '6',
      badge: null,
      color: 'emerald',
      description: 'Social & news sentiment analysis'
    },
    {
      id: 'multi-timeframe',
      label: 'Multi-TF',
      icon: '⏰',
      hotkey: '7',
      badge: null,
      color: 'amber',
      description: 'Cross-timeframe correlation'
    },
    {
      id: 'pattern-recognition',
      label: 'Patterns',
      icon: '🔍',
      hotkey: null,
      badge: null,
      color: 'pink',
      description: 'Chart pattern detection'
    },
    {
      id: 'trade-journal',
      label: 'Journal',
      icon: '📓',
      hotkey: null,
      badge: null,
      color: 'slate',
      description: 'Trade logging & analysis'
    },
    {
      id: 'monitoring',
      label: 'System',
      icon: '🔧',
      hotkey: null,
      badge: null,
      color: 'gray',
      description: 'System health monitoring'
    }
  ]

  // Quick actions section
  const quickActions = [
    { id: 'buy', label: 'Buy', icon: '📈', action: 'trade.buy' },
    { id: 'sell', label: 'Sell', icon: '📉', action: 'trade.sell' },
    { id: 'scan', label: 'Scan', icon: '🔍', action: 'scan.market' },
    { id: 'alert', label: 'Alert', icon: '🔔', action: 'alert.create' }
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
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-700 transition-all duration-300 z-40 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <img src="/logo.svg" className="w-8 h-8" alt="iAVA.ai" />
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  iAVA.ai
                </span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all"
              title={`${isCollapsed ? 'Expand' : 'Collapse'} Sidebar (Alt+S)`}
            >
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isCollapsed ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="py-2">
          {navigation.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? getColorClasses(item.color, true)
                    : `text-slate-300 ${getColorClasses(item.color, false)}`
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                        {item.badge}
                      </span>
                    )}
                    {item.hotkey && (
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-xs">
                        {item.hotkey}
                      </kbd>
                    )}
                  </>
                )}
              </button>

              {/* Tooltip for collapsed state */}
              {isCollapsed && hoveredItem === item.id && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50">
                  <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-xl p-3 whitespace-nowrap">
                    <div className="font-medium text-white mb-1">{item.label}</div>
                    <div className="text-xs text-slate-400">{item.description}</div>
                    {item.hotkey && (
                      <div className="mt-2 text-xs text-slate-500">
                        Press <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">{item.hotkey}</kbd>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <>
            <div className="px-4 py-2 border-t border-slate-700">
              <div className="text-xs text-slate-500 font-semibold mb-2">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.action)}
                    className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:text-white transition-all flex items-center gap-2"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Market Status */}
            <div className="px-4 py-3 border-t border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    marketData?.marketOpen ? 'bg-emerald-400' : 'bg-red-400'
                  } animate-pulse`} />
                  <span className="text-slate-400">
                    Market {marketData?.marketOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <span className="text-slate-500">{marketData?.symbol || 'SPY'}</span>
              </div>
            </div>
          </>
        )}

        {/* Collapsed Quick Actions */}
        {isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-slate-700">
            <button
              onClick={() => handleQuickAction('trade.buy')}
              className="w-full p-2 mb-1 bg-emerald-600/20 hover:bg-emerald-600/30 rounded text-emerald-400 transition-all"
              title="Buy"
            >
              📈
            </button>
            <button
              onClick={() => handleQuickAction('trade.sell')}
              className="w-full p-2 bg-red-600/20 hover:bg-red-600/30 rounded text-red-400 transition-all"
              title="Sell"
            >
              📉
            </button>
          </div>
        )}
      </div>

      {/* Main Content Offset */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Content will be rendered here */}
      </div>
    </>
  )
}