/**
 * NLP Stock Scanner - ELITE EDITION
 *
 * Natural language stock scanner powered by AI.
 * Ask in plain English, get intelligent filter criteria.
 *
 * Examples:
 * - "Find stocks with strong bullish momentum"
 * - "Show me high quality setups above $50"
 * - "Oversold stocks with good Unicorn Scores"
 * - "Pullbacks in uptrends with daily confluence"
 */

import { useState } from 'react'
import { parseNaturalQuery } from '../utils/aiGateway.js'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

export default function NLPScanner() {
  const { marketData } = useMarketData()
  const [query, setQuery] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState(null)
  const [interpretation, setInterpretation] = useState('')

  const exampleQueries = [
    "Strong bullish momentum setups",
    "High quality pullbacks in uptrends",
    "Oversold stocks ready to bounce",
    "Breaking out with high volume",
    `Stocks similar to ${marketData.symbol || 'SPY'}`
  ]

  const handleScan = async (e) => {
    e.preventDefault()
    if (!query.trim() || isScanning) return

    setIsScanning(true)
    setResults(null)
    setInterpretation('')

    try {

      // Parse natural language to filter criteria
      const parsed = await parseNaturalQuery(query)

      if (parsed.error) {
        throw new Error(parsed.error)
      }


      setInterpretation(parsed.interpretation || 'Searching...')

      // Simulate scanning (replace with actual market data scanner)
      // In production, this would call your market scanner API with the parsed filters
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock results (replace with actual scan results)
      const mockResults = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          score: 85,
          price: 178.25,
          emaCloud: 'bullish',
          pivotRibbon: 'bullish',
          matchReason: 'Strong bullish confluence, above all key levels'
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corp',
          score: 82,
          price: 412.50,
          emaCloud: 'bullish',
          pivotRibbon: 'bullish',
          matchReason: 'High Unicorn Score with bullish EMA cloud'
        },
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corp',
          score: 78,
          price: 495.75,
          emaCloud: 'bullish',
          pivotRibbon: 'neutral',
          matchReason: 'Good setup quality, watching for pivot confirmation'
        }
      ]

      setResults({
        filters: parsed,
        matches: mockResults,
        scannedCount: 500,
        matchCount: mockResults.length
      })

    } catch (error) {
      console.error('[NLP Scanner] Error:', error)
      setInterpretation(`Error: ${error.message}`)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Premium Header */}
      <div className="relative">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-emerald-600 via-cyan-500 to-indigo-600 blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 blur-xl opacity-50 animate-pulse" />
            <span className="relative text-3xl filter drop-shadow-lg">🔍</span>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-200 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
              NLP Stock Scanner
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ask in plain English, AI finds the setups
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleScan} className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-focus-within:opacity-10 rounded-xl transition-opacity blur-xl" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe what you're looking for in plain English..."
            className="relative w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 focus:border-emerald-500/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-lg"
            disabled={isScanning}
          />
        </div>

        <button
          type="submit"
          disabled={!query.trim() || isScanning}
          className="relative group w-full py-3 font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className={`absolute inset-0 ${
            !query.trim() || isScanning
              ? 'bg-slate-700'
              : 'bg-gradient-to-r from-emerald-600 to-cyan-600 group-hover:from-emerald-500 group-hover:to-cyan-500'
          } transition-all`} />

          {query.trim() && !isScanning && (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
          )}

          <span className="relative text-white flex items-center justify-center gap-2">
            {isScanning ? (
              <>
                <span className="animate-pulse">🔍 Scanning...</span>
              </>
            ) : (
              <>
                <span>🚀 Scan Market</span>
              </>
            )}
          </span>
        </button>
      </form>

      {/* Example Queries */}
      {!results && !isScanning && (
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span>💡</span>
            <span>Try These Examples</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="relative group px-3 py-2 text-xs font-medium bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-200 rounded-lg transition-all shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                <span className="relative">{example}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interpretation */}
      {interpretation && (
        <div className="glass-panel p-4 bg-slate-800/30 border-emerald-500/30">
          <div className="text-sm text-emerald-300">
            <span className="font-semibold">AI Understanding:</span> {interpretation}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Found <span className="font-bold text-emerald-400">{results.matchCount}</span> matches out of {results.scannedCount} stocks
            </div>
            <button
              onClick={() => {
                setResults(null)
                setInterpretation('')
                setQuery('')
              }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2">
            {results.matches.map((stock, idx) => (
              <div
                key={idx}
                className="relative group glass-panel p-4 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />

                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg text-emerald-400">{stock.symbol}</span>
                      <span className="text-sm text-slate-400">{stock.name}</span>
                      <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-xs font-bold text-emerald-300">
                        {stock.score}/100
                      </div>
                    </div>

                    <div className="text-sm text-slate-300 mb-2">
                      ${stock.price.toFixed(2)}
                    </div>

                    <div className="text-xs text-slate-400 italic">
                      {stock.matchReason}
                    </div>

                    <div className="flex gap-2 mt-2">
                      {stock.emaCloud === 'bullish' && (
                        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400">
                          ☁️ EMA Bullish
                        </div>
                      )}
                      {stock.pivotRibbon === 'bullish' && (
                        <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400">
                          📊 Pivot Bullish
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="relative group/btn px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-lg text-xs font-semibold text-emerald-300 transition-all"
                    onClick={() => {
                      // Load this symbol into the chart
                    }}
                  >
                    View Chart →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
