import { useState, useEffect, useRef } from 'react'
import {
  Search, Bell, Settings, User, Menu, TrendingUp, TrendingDown,
  ChevronDown, X, Mic, Activity
} from 'lucide-react'
import { useMarketData } from '../../contexts/MarketDataContext.jsx'

/**
 * TopBar Navigation - Elite 2025 Edition
 *
 * Professional top navigation bar with:
 * - Symbol search (prominent, center)
 * - Current symbol with price
 * - Market status
 * - Notifications
 * - Settings
 * - User menu
 *
 * Responsive: Different layouts for mobile vs desktop
 */
export default function TopBar({ onSymbolChange, currentSymbol, onMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef(null)
  const { marketData } = useMarketData()

  // Popular symbols for quick access
  const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'SPY', 'QQQ']

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search for symbols
  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.length < 1) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      // Filter popular symbols first
      const filtered = popularSymbols.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      ).map(s => ({ symbol: s, name: s }))

      setSearchResults(filtered.slice(0, 6))
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Select symbol
  const handleSelectSymbol = (symbol) => {
    onSymbolChange?.(symbol)
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  // Get price change styling
  const priceChange = marketData?.change || 0
  const isPositive = priceChange >= 0

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-4"
      style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5 text-slate-400" />
      </button>

      {/* Logo - Desktop only */}
      <div className="hidden md:flex items-center gap-2 md:ml-56 lg:ml-56">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Symbol Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div
          className={`flex items-center rounded-lg transition-all ${
            searchOpen
              ? 'bg-slate-800 ring-1 ring-indigo-500'
              : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          <Search className="w-4 h-4 ml-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search symbol..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="flex-1 bg-transparent border-none outline-none py-2 px-3 text-sm text-white placeholder-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
              }}
              className="p-1 mr-2 rounded hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            {searchResults.length > 0 ? (
              <div className="py-1">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectSymbol(result.symbol)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <span className="font-medium text-white">{result.symbol}</span>
                    <span className="text-slate-500 text-xs">{result.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3">
                <div className="text-xs text-slate-500 mb-2">Popular</div>
                <div className="flex flex-wrap gap-1.5">
                  {popularSymbols.slice(0, 6).map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleSelectSymbol(symbol)}
                      className="px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Symbol & Price - Desktop */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{currentSymbol || 'SPY'}</span>
          <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${marketData?.price?.toFixed(2) || '0.00'}
          </span>
          <span className={`flex items-center text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-1">
        {/* Voice - Mobile */}
        <button className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Mic className="w-5 h-5 text-slate-400" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5 text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* Settings - Desktop only */}
        <button className="hidden md:block p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Settings className="w-5 h-5 text-slate-400" />
        </button>

        {/* User */}
        <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </button>
      </div>
    </header>
  )
}
