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
    <div className="glass-panel p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔍</span>
          <h3 className="text-lg font-semibold text-slate-200">
            Natural Language Scanner
          </h3>
        </div>
        <p className="text-sm text-slate-400">
          Describe what you're looking for in plain English
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Find bullish momentum stocks with high volume..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-24"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Scan'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
          {error}
        </div>
      )}

      {lastResult && !error && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <div className="text-sm font-medium text-emerald-300 mb-2">
            ✓ Filters Generated
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            {Object.entries(lastResult).map(([key, value]) => {
              if (key === 'error' || value === undefined) return null
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="font-mono">
                    {typeof value === 'object' ? JSON.stringify(value) : value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-medium text-slate-400 mb-2">
          Example queries:
        </div>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(example)}
              className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-md transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
