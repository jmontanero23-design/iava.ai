/**
 * Natural Language Scanner Component
 * Allows users to query markets using natural language
 * Converts NL queries to structured technical filters
 */

import { useState } from 'react'
import { parseNaturalQuery } from '../utils/aiGateway.js'

export default function NaturalLanguageScanner({ onFiltersGenerated }) {
  const [query, setQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  const exampleQueries = [
    "Find stocks breaking out with high volume",
    "Show me oversold tech stocks under $100",
    "Large cap stocks with bullish momentum and ADX > 25",
    "Mid cap growth stocks pulling back in uptrend",
    "High volatility small caps with strong volume"
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await parseNaturalQuery(query)

      if (result.error) {
        setError(result.error)
        return
      }

      setLastResult(result)

      // Notify parent component
      if (onFiltersGenerated) {
        onFiltersGenerated(result)
      }

    } catch (err) {
      setError(err.message || 'Failed to process query')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExampleClick = (example) => {
    setQuery(example)
  }

  return (
    <div className="glass-panel overflow-hidden">
      {/* Premium Header */}
      <div className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            {/* Icon with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 blur-xl opacity-50 animate-pulse" />
              <span className="relative text-3xl filter drop-shadow-lg">🔍</span>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-200 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              Natural Language Scanner
            </h3>
          </div>
          <p className="text-sm text-slate-400 ml-12 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold">Describe what you're looking for in plain English</span>
          </p>
        </div>
      </div>

      {/* Premium Search Form */}
      <form onSubmit={handleSubmit} className="px-6 pb-4">
        <div className="relative group">
          {/* Input glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 opacity-0 group-focus-within:opacity-10 rounded-xl transition-opacity blur-xl" />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Find bullish momentum stocks with high volume..."
            className="relative w-full px-5 py-4 bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-lg pr-32"
            disabled={isProcessing}
          />

          {/* Premium button */}
          <button
            type="submit"
            disabled={isProcessing || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group/btn"
          >
            <div className={`absolute inset-0 ${
              isProcessing || !query.trim()
                ? 'bg-slate-700'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 group-hover/btn:from-cyan-500 group-hover/btn:to-indigo-500'
            } transition-all`} />

            {query.trim() && !isProcessing && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 blur-lg opacity-30 group-hover/btn:opacity-50 transition-opacity" />
            )}

            <span className="relative text-white text-sm flex items-center gap-2">
              {isProcessing ? (
                <>
                  <span className="animate-pulse">Processing...</span>
                </>
              ) : (
                <>
                  <span>Scan</span>
                  <span className="text-base">🔍</span>
                </>
              )}
            </span>
          </button>
        </div>
      </form>

      {/* Premium Error State */}
      {error && (
        <div className="mx-6 mb-4 relative group">
          <div className="absolute inset-0 bg-rose-600 blur-xl opacity-10 rounded-xl" />
          <div className="relative p-4 bg-gradient-to-r from-rose-500/20 to-rose-600/10 border border-rose-500/40 rounded-xl shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="text-sm font-semibold text-rose-300 mb-1">Error</div>
                <div className="text-sm text-rose-200/80">{error}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Success State */}
      {lastResult && !error && (
        <div className="mx-6 mb-4 relative group">
          <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-10 rounded-xl" />
          <div className="relative p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">✓</span>
              <div className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                Filters Generated
              </div>
            </div>
            <div className="space-y-2.5">
              {Object.entries(lastResult).map(([key, value]) => {
                if (key === 'error' || value === undefined) return null
                return (
                  <div key={key} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <span className="text-sm text-emerald-400/80 capitalize font-medium">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-sm font-mono text-slate-200 font-semibold">
                      {typeof value === 'object' ? JSON.stringify(value) : value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Premium Example Queries */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <span className="text-base">💡</span>
          <span className="font-semibold uppercase tracking-wider">Example Queries</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(example)}
              className="relative group px-3 py-2 text-xs font-medium bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
              <span className="relative">{example}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
