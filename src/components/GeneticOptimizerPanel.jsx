import { useState } from 'react'
import { optimizeWithGA } from '../utils/geneticOptimizer.js'

export default function GeneticOptimizerPanel() {
  const [config, setConfig] = useState({
    populationSize: 20,
    generations: 30,
    mutationRate: 0.15,
    parameters: ['threshold', 'horizon', 'atrMultiplier', 'stopLoss', 'takeProfit']
  })

  const [optimizing, setOptimizing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const allParameters = [
    { id: 'threshold', name: 'Signal Threshold', range: '0-100' },
    { id: 'horizon', name: 'Time Horizon', range: '1-100 bars' },
    { id: 'atrMultiplier', name: 'ATR Multiplier', range: '0.5-5.0' },
    { id: 'stopLoss', name: 'Stop Loss %', range: '0.5-10.0' },
    { id: 'takeProfit', name: 'Take Profit %', range: '1.0-20.0' },
    { id: 'minADX', name: 'Min ADX', range: '10-50' },
    { id: 'rsiOversold', name: 'RSI Oversold', range: '10-40' },
    { id: 'rsiOverbought', name: 'RSI Overbought', range: '60-90' }
  ]

  const toggleParameter = (paramId) => {
    setConfig(prev => ({
      ...prev,
      parameters: prev.parameters.includes(paramId)
        ? prev.parameters.filter(p => p !== paramId)
        : [...prev.parameters, paramId]
    }))
  }

  const handleOptimize = async () => {
    if (config.parameters.length === 0) {
      setError('Select at least one parameter to optimize')
      return
    }

    setOptimizing(true)
    setProgress({ generation: 0, best: null })
    setError(null)
    setResults(null)

    try {
      // Mock evaluation function (in production, this would backtest strategies)
      const evaluateFunction = async (params) => {
        // Simulate backtesting with random results
        await new Promise(resolve => setTimeout(resolve, 50))

        return {
          avgReturn: Math.random() * 0.2 - 0.05,
          winRate: 0.4 + Math.random() * 0.3,
          profitFactor: 1 + Math.random() * 2,
          maxDrawdown: Math.random() * 0.3,
          sharpeRatio: Math.random() * 2,
          volatility: 0.01 + Math.random() * 0.05,
          trades: Math.floor(Math.random() * 100) + 50
        }
      }

      const result = await optimizeWithGA({
        parameters: config.parameters,
        evaluateFunction,
        populationSize: config.populationSize,
        generations: config.generations,
        mutationRate: config.mutationRate,
        onProgress: (gen, best) => {
          setProgress({
            generation: gen + 1,
            totalGenerations: config.generations,
            best: best ? {
              fitness: best.fitness,
              avgReturn: best.results.avgReturn,
              winRate: best.results.winRate,
              sharpeRatio: best.results.sharpeRatio
            } : null
          })
        }
      })

      setResults(result)

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Optimization completed successfully', type: 'success' }
      }))
    } catch (err) {
      console.error('Optimization failed:', err)
      setError(err.message)
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Optimization failed: ' + err.message, type: 'error' }
      }))
    } finally {
      setOptimizing(false)
    }
  }

  const formatValue = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(value < 1 ? 4 : 2)
    }
    return value
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600 blur-lg opacity-50 animate-pulse" />
                <span className="relative text-2xl filter drop-shadow-lg">🧬</span>
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-200 to-pink-300 bg-clip-text text-transparent">
                  Genetic Algorithm Optimizer
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Evolutionary strategy parameter optimization
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Population Size</label>
              <input
                type="number"
                min="10"
                max="100"
                value={config.populationSize}
                onChange={e => setConfig({ ...config, populationSize: parseInt(e.target.value) || 20 })}
                disabled={optimizing}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Generations</label>
              <input
                type="number"
                min="5"
                max="100"
                value={config.generations}
                onChange={e => setConfig({ ...config, generations: parseInt(e.target.value) || 30 })}
                disabled={optimizing}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Mutation Rate</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={config.mutationRate}
                onChange={e => setConfig({ ...config, mutationRate: parseFloat(e.target.value) || 0.15 })}
                disabled={optimizing}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Parameters to Optimize</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allParameters.map(param => (
                <button
                  key={param.id}
                  onClick={() => toggleParameter(param.id)}
                  disabled={optimizing}
                  className={`p-3 rounded-lg text-left transition-all ${
                    config.parameters.includes(param.id)
                      ? 'bg-purple-600/20 border border-purple-500/50 text-purple-200'
                      : 'bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:bg-slate-700/30'
                  }`}
                >
                  <div className="text-sm font-semibold">{param.name}</div>
                  <div className="text-xs opacity-70">{param.range}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleOptimize}
            disabled={optimizing || config.parameters.length === 0}
            className="w-full relative group px-6 py-3 rounded-lg text-sm font-semibold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-500 group-hover:to-pink-500 transition-all" />
            <span className="relative text-white">
              {optimizing ? '🧬 Evolving Solutions...' : '🚀 Start Optimization'}
            </span>
          </button>
        </div>
      </div>

      {/* Progress */}
      {progress && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-200">Optimization Progress</h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Generation {progress.generation} / {progress.totalGenerations}</span>
                <span className="text-purple-300 font-semibold">
                  {Math.round((progress.generation / progress.totalGenerations) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-300"
                  style={{ width: `${(progress.generation / progress.totalGenerations) * 100}%` }}
                />
              </div>
            </div>

            {progress.best && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Best Return</div>
                  <div className="text-base font-bold text-emerald-300">
                    {(progress.best.avgReturn * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Win Rate</div>
                  <div className="text-base font-bold text-cyan-300">
                    {(progress.best.winRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Sharpe Ratio</div>
                  <div className="text-base font-bold text-blue-300">
                    {progress.best.sharpeRatio.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
            <h3 className="text-sm font-bold text-purple-200">Optimal Parameters Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Best solution after {results.convergence?.generation || config.generations} generations
            </p>
          </div>
          <div className="p-5 space-y-4">
            {/* Best Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(results.best.params).map(([key, value]) => (
                <div key={key} className="p-3 bg-slate-800/30 rounded-lg border border-purple-500/20">
                  <div className="text-xs text-slate-400 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm font-bold text-purple-200">
                    {formatValue(value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Avg Return</div>
                <div className="text-base font-bold text-emerald-300">
                  {(results.best.results.avgReturn * 100).toFixed(2)}%
                </div>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Win Rate</div>
                <div className="text-base font-bold text-cyan-300">
                  {(results.best.results.winRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Profit Factor</div>
                <div className="text-base font-bold text-blue-300">
                  {results.best.results.profitFactor.toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Sharpe Ratio</div>
                <div className="text-base font-bold text-indigo-300">
                  {results.best.results.sharpeRatio.toFixed(2)}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const params = JSON.stringify(results.best.params, null, 2)
                navigator.clipboard.writeText(params)
                window.dispatchEvent(new CustomEvent('iava.toast', {
                  detail: { text: 'Parameters copied to clipboard', type: 'success' }
                }))
              }}
              className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all"
            >
              📋 Copy Optimal Parameters
            </button>
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
            <strong className="text-slate-300">Genetic Algorithm:</strong> Evolutionary optimization that mimics natural selection. Starting population evolves over generations through selection, crossover, and mutation.
          </p>
          <p>
            <strong className="text-slate-300">Multi-Objective:</strong> Optimizes multiple goals simultaneously (return, win rate, Sharpe ratio, drawdown) to find balanced parameter sets.
          </p>
          <p>
            <strong className="text-slate-300">Elite Preservation:</strong> Best solutions from each generation are preserved, ensuring convergence to optimal parameters.
          </p>
          <p className="text-xs text-amber-400">
            ⚠️ Note: Current version uses mock evaluation. In production, connect this to your backtesting engine for real strategy optimization.
          </p>
        </div>
      </div>
    </div>
  )
}
