import { useState } from 'react'
import { scanForAnomalies, getAnomalyAlertLevel } from '../utils/anomalyDetector.js'
import { fetchBars, PRIORITY } from '../services/alpacaQueue.js'

export default function AnomalyDetectorPanel() {
  const [symbol, setSymbol] = useState('SPY')
  const [timeframe, setTimeframe] = useState('5Min')
  const [loading, setLoading] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')

  const handleScan = async () => {
    setLoading(true)
    setError('')
    setScanResult(null)

    try {
      // Fetch bars with panel analysis priority
      const bars = await fetchBars(symbol, timeframe, 500, PRIORITY.PANEL_ANALYSIS)

      if (!Array.isArray(bars) || bars.length === 0) {
        throw new Error('No data available for this symbol/timeframe')
      }

      // Scan for anomalies
      const result = scanForAnomalies(bars)
      const alertLevel = getAnomalyAlertLevel(result.anomalies)

      setScanResult({ ...result, alertLevel, symbol, timeframe })
    } catch (err) {
      console.error('Anomaly scan failed:', err)
      setError(err.message || 'Failed to scan for anomalies')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      high: 'rose',
      medium: 'amber',
      low: 'cyan'
    }
    return colors[severity] || 'slate'
  }

  const getTypeIcon = (type) => {
    const icons = {
      price_spike: '📊',
      wide_range: '📏',
      volume_surge: '📈',
      volume_drought: '📉',
      gap_up: '⬆️',
      gap_down: '⬇️',
      volatility_breakout: '⚡'
    }
    return icons[type] || '🔔'
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="card overflow-hidden">
        <div className="p-5 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-600 blur-lg opacity-50 animate-pulse" />
                  <span className="relative text-2xl filter drop-shadow-lg">🚨</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-orange-200 to-red-300 bg-clip-text text-transparent">
                    Anomaly Detector
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Detect unusual market conditions & outliers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Controls */}
        <div className="p-5 bg-slate-800/30 border-b border-slate-700/50">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                className="input w-full bg-slate-800/50 border-slate-700/50 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all uppercase"
                placeholder="SPY"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-slate-400 mb-1">Timeframe</label>
              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value)}
                className="select w-full bg-slate-800/50 border-slate-700/50 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all"
              >
                <option value="1Min">1 Min</option>
                <option value="5Min">5 Min</option>
                <option value="15Min">15 Min</option>
                <option value="1Hour">1 Hour</option>
                <option value="1Day">1 Day</option>
              </select>
            </div>

            <button
              onClick={handleScan}
              disabled={loading || !symbol}
              className="relative group px-6 py-2 rounded-lg text-sm font-semibold overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 group-hover:from-orange-500 group-hover:to-red-500 transition-all" />
              <span className="relative text-white">
                {loading ? 'Scanning...' : '🔍 Scan for Anomalies'}
              </span>
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-500/10 rounded-lg border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Quick Scan Buttons */}
        <div className="p-5">
          <div className="text-xs text-slate-400 mb-2">Quick Scan:</div>
          <div className="flex flex-wrap gap-2">
            {['SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL', 'MSFT'].map(sym => (
              <button
                key={sym}
                onClick={() => { setSymbol(sym); setTimeout(handleScan, 100) }}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Results */}
      {scanResult && (
        <div className="space-y-6">
          {/* Alert Level Card */}
          <div className="card overflow-hidden">
            <div
              className="p-6 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${
                  scanResult.alertLevel.color === 'emerald' ? '#10b98120' :
                  scanResult.alertLevel.color === 'rose' ? '#f4344420' :
                  scanResult.alertLevel.color === 'orange' ? '#f9731620' :
                  scanResult.alertLevel.color === 'yellow' ? '#f59e0b20' :
                  '#06b6d420'
                } 0%, transparent 100%)`
              }}
            >
              <div className="absolute inset-0 opacity-10 blur-2xl" style={{
                background: `radial-gradient(circle at 50% 50%, ${
                  scanResult.alertLevel.color === 'emerald' ? '#10b981' :
                  scanResult.alertLevel.color === 'rose' ? '#f43444' :
                  scanResult.alertLevel.color === 'orange' ? '#f97316' :
                  scanResult.alertLevel.color === 'yellow' ? '#f59e0b' :
                  '#06b6d4'
                } 0%, transparent 70%)`
              }} />

              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{scanResult.alertLevel.icon}</div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 mb-1">
                      {scanResult.symbol} • {scanResult.timeframe}
                    </div>
                    <div className={`text-2xl font-bold text-${scanResult.alertLevel.color}-300 mb-2 capitalize`}>
                      {scanResult.alertLevel.level} Risk
                    </div>
                    <div className={`text-sm text-${scanResult.alertLevel.color}-200`}>
                      {scanResult.alertLevel.message}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-1">Total Anomalies</div>
                    <div className="text-2xl font-bold text-slate-200">{scanResult.count.total}</div>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                    <div className="text-xs text-rose-400 mb-1">High Severity</div>
                    <div className="text-2xl font-bold text-rose-300">{scanResult.count.high}</div>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="text-xs text-amber-400 mb-1">Medium Severity</div>
                    <div className="text-2xl font-bold text-amber-300">{scanResult.count.medium}</div>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <div className="text-xs text-cyan-400 mb-1">Low Severity</div>
                    <div className="text-2xl font-bold text-cyan-300">{scanResult.count.low}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="p-5 border-t border-slate-700/50">
              <div className="text-sm font-semibold text-slate-300 mb-3">Anomaly Breakdown</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">📊 Price</div>
                  <div className="text-xl font-bold text-slate-200">{scanResult.breakdown.price}</div>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">📈 Volume</div>
                  <div className="text-xl font-bold text-slate-200">{scanResult.breakdown.volume}</div>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">⬆️ Gaps</div>
                  <div className="text-xl font-bold text-slate-200">{scanResult.breakdown.gaps}</div>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">⚡ Volatility</div>
                  <div className="text-xl font-bold text-slate-200">{scanResult.breakdown.volatility}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Anomalies List */}
          {scanResult.anomalies.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-200">Detected Anomalies ({scanResult.anomalies.length})</h3>
              </div>
              <div className="p-5 space-y-3">
                {scanResult.anomalies.map((anomaly, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border"
                    style={{
                      backgroundColor: `${getSeverityColor(anomaly.severity) === 'rose' ? '#f4344410' :
                                         getSeverityColor(anomaly.severity) === 'amber' ? '#f59e0b10' :
                                         '#06b6d410'}`,
                      borderColor: `${getSeverityColor(anomaly.severity) === 'rose' ? '#f4344430' :
                                      getSeverityColor(anomaly.severity) === 'amber' ? '#f59e0b30' :
                                      '#06b6d430'}`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getTypeIcon(anomaly.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`px-2 py-0.5 rounded text-xs font-bold bg-${getSeverityColor(anomaly.severity)}-500/20 text-${getSeverityColor(anomaly.severity)}-300 uppercase`}>
                            {anomaly.severity}
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            {anomaly.type.replace(/_/g, ' ')}
                          </div>
                          {anomaly.direction && (
                            <div className="text-xs text-slate-400">
                              • {anomaly.direction === 'up' ? '↑' : '↓'} {anomaly.direction}
                            </div>
                          )}
                        </div>
                        <div className={`text-sm font-semibold text-${getSeverityColor(anomaly.severity)}-200 mb-1`}>
                          {anomaly.message}
                        </div>
                        {anomaly.zScore !== undefined && (
                          <div className="text-xs text-slate-400">
                            Z-Score: {anomaly.zScore.toFixed(2)}σ
                            {anomaly.return !== undefined && ` • Return: ${(anomaly.return * 100).toFixed(2)}%`}
                            {anomaly.percentChange !== undefined && ` • Change: ${anomaly.percentChange.toFixed(1)}%`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-lg font-bold text-emerald-300 mb-2">No Anomalies Detected</div>
              <div className="text-sm text-slate-400">
                {scanResult.symbol} on {scanResult.timeframe} shows normal market behavior
              </div>
            </div>
          )}

          {/* Anomaly Guide */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-200">Understanding Anomalies</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📊</span>
                  <span className="text-sm font-bold text-slate-300">Price Spikes</span>
                </div>
                <div className="text-xs text-slate-400">
                  Unusual upward or downward price movements exceeding 2.5 standard deviations. May indicate news events or institutional activity.
                </div>
              </div>

              <div className="p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📈</span>
                  <span className="text-sm font-bold text-slate-300">Volume Surges/Droughts</span>
                </div>
                <div className="text-xs text-slate-400">
                  Trading volume significantly above or below average. Surges may indicate increased interest; droughts suggest low liquidity.
                </div>
              </div>

              <div className="p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">⬆️</span>
                  <span className="text-sm font-bold text-slate-300">Price Gaps</span>
                </div>
                <div className="text-xs text-slate-400">
                  Opening price significantly different from previous close. Common after earnings reports or overnight news events.
                </div>
              </div>

              <div className="p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm font-bold text-slate-300">Volatility Breakouts</span>
                </div>
                <div className="text-xs text-slate-400">
                  ATR expansion indicating increased market uncertainty. Consider wider stops and smaller position sizes.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!scanResult && !loading && !error && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🚨</div>
          <div className="text-xl font-bold text-slate-300 mb-2">
            Anomaly Detector
          </div>
          <div className="text-sm text-slate-400 mb-6">
            Scan any symbol to detect unusual market conditions, outliers, and statistical anomalies
          </div>
          <button
            onClick={handleScan}
            disabled={loading || !symbol}
            className="relative group px-6 py-2 rounded-lg text-sm font-semibold overflow-hidden inline-block disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 group-hover:from-orange-500 group-hover:to-red-500 transition-all" />
            <span className="relative text-white">Scan {symbol}</span>
          </button>
        </div>
      )}
    </div>
  )
}
