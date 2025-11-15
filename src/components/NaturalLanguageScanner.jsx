/**
 * Natural Language Scanner Component
 * Allows users to query markets using natural language
 * Converts NL queries to structured technical filters AND RUNS MARKET SCAN
 */

import { useState } from 'react'
import { parseNaturalQuery } from '../utils/aiGateway.js'

export default function NaturalLanguageScanner({ onFiltersGenerated, onLoadSymbol }) {
  const [query, setQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [scanResults, setScanResults] = useState(null)

  const exampleQueries = [
    "Find stocks breaking out with high volume",
    "Show me bullish momentum stocks",
    "Stocks with Unicorn Score above 70",
    "Find strong trending stocks",
    "High quality setups ready to trade"
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsProcessing(true)
    setScanning(false)
    setScanResults(null)
    setError(null)

    try {
      // Step 1: Parse natural language to filters
      const result = await parseNaturalQuery(query)

      if (result.error) {
        setError(result.error)
        setIsProcessing(false)
        return
      }

      setLastResult(result)

      // Notify parent component
      if (onFiltersGenerated) {
        onFiltersGenerated(result)
      }

      // Step 2: Run market scan with parsed filters
      setIsProcessing(false)
      setScanning(true)

      // Fetch universe and scan (limit to 500 stocks for speed)
      const universeResponse = await fetch('/api/universe?assetClass=stocks')
      if (!universeResponse.ok) throw new Error('Failed to fetch stock universe')
      const universeData = await universeResponse.json()
      const allSymbols = (universeData.symbols || []).slice(0, 500)

      // Determine threshold from filters
      const threshold = result.unicornScore?.min || 60

      // Scan in batches
      const chunk = (arr, n) => arr.reduce((acc, x, i) => {
        if (i % n === 0) acc.push([])
        acc[acc.length-1].push(x)
        return acc
      }, [])

      const chunks = chunk(allSymbols, 25)
      const accumulated = { longs: [], shorts: [] }

      for (let i = 0; i < chunks.length; i++) {
        const batch = chunks[i].join(',')
        const params = new URLSearchParams({
          symbols: batch,
          timeframe: '5Min',
          threshold: String(threshold),
          top: '100',
          enforceDaily: result.dailyRegime ? '1' : '0',
          requireConsensus: '0',
          consensusBonus: '0',
          assetClass: 'stocks',
          returnAll: '1'
        })

        const response = await fetch(`/api/scan?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          accumulated.longs.push(...(data.longs || []))
          accumulated.shorts.push(...(data.shorts || []))
        }
      }

      // Filter by parsed criteria (price range, etc.)
      const filterResults = (stocks) => {
        return stocks.filter(stock => {
          // Apply price range filter
          if (result.priceRange) {
            const price = stock.last?.close
            if (result.priceRange.min && price < result.priceRange.min) return false
            if (result.priceRange.max && price > result.priceRange.max) return false
          }

          // Apply EMA cloud filter
          if (result.emaCloud && stock.emaCloudNow) {
            if (result.emaCloud !== stock.emaCloudNow.toLowerCase()) return false
          }

          // Apply pivot filter
          if (result.pivotRibbon && stock.pivotNow) {
            if (result.pivotRibbon !== stock.pivotNow.toLowerCase()) return false
          }

          return true
        })
      }

      accumulated.longs = filterResults(accumulated.longs)
      accumulated.shorts = filterResults(accumulated.shorts)

      // Sort and limit
      accumulated.longs.sort((a,b) => b.score - a.score)
      accumulated.shorts.sort((a,b) => b.score - a.score)

      setScanResults({
        longs: accumulated.longs.slice(0, 10),
        shorts: accumulated.shorts.slice(0, 10),
        totalScanned: allSymbols.length,
        query,
        filters: result
      })

    } catch (err) {
      setError(err.message || 'Failed to process query')
    } finally {
      setIsProcessing(false)
      setScanning(false)
    }
  }

  const handleExampleClick = (example) => {
    setQuery(example)
  }

  const handleLoadSymbol = (symbol) => {
    if (onLoadSymbol) {
      onLoadSymbol(symbol)
    } else {
      // Fallback: dispatch event
      window.dispatchEvent(new CustomEvent('iava.loadSymbol', {
        detail: { symbol }
      }))
    }
  }

  return (
    <div className="glass-panel overflow-hidden">
      {/* Premium Header */}
      <div className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
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
            <span className="font-semibold">Ask for stocks in plain English → Get real picks</span>
          </p>
        </div>
      </div>

      {/* Premium Search Form */}
      <form onSubmit={handleSubmit} className="px-6 pb-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 opacity-0 group-focus-within:opacity-10 rounded-xl transition-opacity blur-xl" />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Find bullish momentum stocks with high volume..."
            className="relative w-full px-5 py-4 bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-lg pr-32"
            disabled={isProcessing || scanning}
          />

          <button
            type="submit"
            disabled={isProcessing || scanning || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group/btn"
          >
            <div className={`absolute inset-0 ${
              isProcessing || scanning || !query.trim()
                ? 'bg-slate-700'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 group-hover/btn:from-cyan-500 group-hover/btn:to-indigo-500'
            } transition-all`} />

            {query.trim() && !isProcessing && !scanning && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 blur-lg opacity-30 group-hover/btn:opacity-50 transition-opacity" />
            )}

            <span className="relative text-white text-sm flex items-center gap-2">
              {isProcessing ? (
                <><span className="animate-pulse">Parsing...</span></>
              ) : scanning ? (
                <><span className="animate-pulse">Scanning...</span></>
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

      {/* Scan Results - ACTUAL STOCK PICKS */}
      {scanResults && !error && (
        <div className="mx-6 mb-4 space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-10 rounded-xl" />
            <div className="relative p-4 bg-gradient-to-r from-cyan-500/20 to-indigo-600/10 border border-cyan-500/40 rounded-xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✓</span>
                <div className="text-sm font-bold text-cyan-300 uppercase tracking-wider">
                  {scanResults.query}
                </div>
              </div>
              <div className="text-xs text-slate-400">
                Scanned {scanResults.totalScanned} stocks • Found {scanResults.longs.length} longs, {scanResults.shorts.length} shorts
              </div>
            </div>
          </div>

          {/* Longs */}
          {scanResults.longs.length > 0 && (
            <div>
              <div className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">
                🟢 Top Longs ({scanResults.longs.length})
              </div>
              <div className="space-y-2">
                {scanResults.longs.map((stock, idx) => (
                  <div key={stock.symbol} className="relative group">
                    <div className="absolute inset-0 bg-emerald-600 blur-lg opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                    <div className="relative flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:border-emerald-500/40 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-4">{idx + 1}</span>
                        <span className="text-base font-bold text-slate-100">{stock.symbol}</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                          {Math.round(stock.score)}
                        </span>
                        <span className="text-xs text-slate-400">${stock.last?.close?.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => handleLoadSymbol(stock.symbol)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white transition-all"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shorts */}
          {scanResults.shorts.length > 0 && (
            <div>
              <div className="text-sm font-bold text-rose-400 mb-2 uppercase tracking-wider">
                🔴 Top Shorts ({scanResults.shorts.length})
              </div>
              <div className="space-y-2">
                {scanResults.shorts.map((stock, idx) => (
                  <div key={stock.symbol} className="relative group">
                    <div className="absolute inset-0 bg-rose-600 blur-lg opacity-0 group-hover:opacity-10 rounded-lg transition-opacity" />
                    <div className="relative flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:border-rose-500/40 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-4">{idx + 1}</span>
                        <span className="text-base font-bold text-slate-100">{stock.symbol}</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                          {Math.round(stock.score)}
                        </span>
                        <span className="text-xs text-slate-400">${stock.last?.close?.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => handleLoadSymbol(stock.symbol)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white transition-all"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scanResults.longs.length === 0 && scanResults.shorts.length === 0 && (
            <div className="text-center py-6 text-slate-400">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">No stocks found matching these criteria. Try lowering the Unicorn Score threshold.</div>
            </div>
          )}
        </div>
      )}

      {/* Filters (collapsed, shown only if no results yet) */}
      {lastResult && !scanResults && !error && (
        <div className="mx-6 mb-4 relative group">
          <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-10 rounded-xl" />
          <div className="relative p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">✓</span>
              <div className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                Filters Generated - Scanning...
              </div>
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
