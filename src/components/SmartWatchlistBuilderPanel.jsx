import { useState } from 'react'
import { buildUserProfile, scoreSymbolFit, SYMBOL_UNIVERSE } from '../utils/smartWatchlist.js'

export default function SmartWatchlistBuilderPanel() {
  const [userProfile, setUserProfile] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [building, setBuilding] = useState(false)

  const [preferences, setPreferences] = useState({
    tradingStyle: 'swing',
    riskTolerance: 'moderate',
    preferredSectors: [],
    marketCapPreference: 'large',
    maxSymbols: 10
  })

  const handleBuildProfile = () => {
    setBuilding(true)

    try {
      // Build user profile based on preferences
      const profile = buildUserProfile({
        tradingStyle: preferences.tradingStyle,
        riskTolerance: preferences.riskTolerance,
        sectorPreferences: preferences.preferredSectors,
        marketCapPreference: preferences.marketCapPreference
      })

      setUserProfile(profile)

      // Generate recommendations based on profile
      // For demo purposes, score a subset of symbols
      const symbols = Object.keys(SYMBOL_UNIVERSE).slice(0, 20)
      const scored = symbols.map(symbol => ({
        symbol,
        score: scoreSymbolFit(symbol, profile, {}),
        ...SYMBOL_UNIVERSE[symbol]
      }))

      // Sort by score and take top N
      const topRecommendations = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, preferences.maxSymbols)

      setRecommendations(topRecommendations)

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Watchlist generated successfully', type: 'success' }
      }))
    } catch (error) {
      console.error('Profile building failed:', error)
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Failed to build watchlist: ' + error.message, type: 'error' }
      }))
    } finally {
      setBuilding(false)
    }
  }

  const toggleSector = (sector) => {
    setPreferences(prev => ({
      ...prev,
      preferredSectors: prev.preferredSectors.includes(sector)
        ? prev.preferredSectors.filter(s => s !== sector)
        : [...prev.preferredSectors, sector]
    }))
  }

  const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial']

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-600 blur-lg opacity-50 animate-pulse" />
                <span className="relative text-2xl filter drop-shadow-lg">🎯</span>
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-teal-200 to-cyan-300 bg-clip-text text-transparent">
                  Smart Watchlist Builder
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  AI-powered symbol recommendations based on your profile
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Form */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Trading Style</label>
              <select
                value={preferences.tradingStyle}
                onChange={e => setPreferences({ ...preferences, tradingStyle: e.target.value })}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
              >
                <option value="scalp">Scalper (minutes)</option>
                <option value="day">Day Trader (intraday)</option>
                <option value="swing">Swing Trader (days)</option>
                <option value="position">Position Trader (weeks+)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Risk Tolerance</label>
              <select
                value={preferences.riskTolerance}
                onChange={e => setPreferences({ ...preferences, riskTolerance: e.target.value })}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Market Cap Preference</label>
              <select
                value={preferences.marketCapPreference}
                onChange={e => setPreferences({ ...preferences, marketCapPreference: e.target.value })}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
              >
                <option value="large">Large Cap (&gt;$10B)</option>
                <option value="mid">Mid Cap ($2-10B)</option>
                <option value="small">Small Cap (&lt;$2B)</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Max Symbols</label>
              <input
                type="number"
                min="5"
                max="20"
                value={preferences.maxSymbols}
                onChange={e => setPreferences({ ...preferences, maxSymbols: parseInt(e.target.value) || 10 })}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Preferred Sectors (optional)</label>
            <div className="flex flex-wrap gap-2">
              {sectors.map(sector => (
                <button
                  key={sector}
                  onClick={() => toggleSector(sector)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    preferences.preferredSectors.includes(sector)
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBuildProfile}
            disabled={building}
            className="w-full relative group px-6 py-3 rounded-lg text-sm font-semibold overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 group-hover:from-teal-500 group-hover:to-cyan-500 transition-all" />
            <span className="relative text-white">
              {building ? 'Building Watchlist...' : '🚀 Build Smart Watchlist'}
            </span>
          </button>
        </div>
      </div>

      {/* User Profile Summary */}
      {userProfile && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-200">Your Trading Profile</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Style</div>
              <div className="text-sm font-bold text-teal-300 capitalize">{userProfile.tradingStyle}</div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Risk Tolerance</div>
              <div className="text-sm font-bold text-cyan-300 capitalize">{userProfile.riskTolerance}</div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Horizon</div>
              <div className="text-sm font-bold text-blue-300">{userProfile.timeHorizon}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Recommended Symbols</h3>
              <p className="text-xs text-slate-400 mt-1">Top {recommendations.length} matches for your profile</p>
            </div>
            <button
              onClick={() => {
                const symbols = recommendations.map(r => r.symbol).join(', ')
                navigator.clipboard.writeText(symbols)
                window.dispatchEvent(new CustomEvent('iava.toast', {
                  detail: { text: 'Symbols copied to clipboard', type: 'success' }
                }))
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all"
            >
              📋 Copy All
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendations.map(rec => (
                <div
                  key={rec.symbol}
                  className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-teal-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-base font-bold text-slate-200">{rec.symbol}</div>
                      <div className="text-xs text-slate-400 capitalize">{rec.sector || 'Mixed'}</div>
                    </div>
                    <div className="px-2 py-1 rounded bg-teal-500/20 border border-teal-500/30">
                      <div className="text-xs font-bold text-teal-300">{Math.round(rec.score)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {rec.marketCap ? `${rec.marketCap} Cap` : 'Market data unavailable'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!userProfile && !building && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <div className="text-xl font-bold text-slate-300 mb-2">
            Build Your Smart Watchlist
          </div>
          <div className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Set your preferences above and let AI recommend symbols that match your trading style, risk tolerance, and sector preferences
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-200">How It Works</h3>
        </div>
        <div className="p-5 space-y-3 text-sm text-slate-400">
          <p>
            <strong className="text-slate-300">Profile Building:</strong> Your preferences are analyzed to create a trading profile that matches your style, risk tolerance, and time horizon.
          </p>
          <p>
            <strong className="text-slate-300">Symbol Scoring:</strong> Each symbol in our universe is scored based on factors like volatility match, sector alignment, liquidity, and technical setups.
          </p>
          <p>
            <strong className="text-slate-300">Recommendations:</strong> Top-ranked symbols are presented with their fit scores, helping you focus on opportunities that match your strategy.
          </p>
          <p className="text-xs text-amber-400">
            ⚠️ Note: Full functionality requires API integration for real-time market data. Current version uses demo scoring.
          </p>
        </div>
      </div>
    </div>
  )
}
