/**
 * System Health & Performance Monitoring
 * Real-time browser, storage, and feature metrics
 * NO MOCK DATA - ALL REAL METRICS
 */

import { useState, useEffect } from 'react'

export default function ModelMonitoring() {
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const collectSystemMetrics = () => {
    // 1. Memory Usage (Chrome/Edge only)
    const memory = performance.memory ? {
      used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      percentage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1)
    } : null

    // 2. LocalStorage Usage
    let localStorageSize = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorageSize += localStorage[key].length + key.length
      }
    }
    const storageMB = (localStorageSize / 1024 / 1024).toFixed(3)

    // 3. Feature Usage from LocalStorage
    const signalQuality = JSON.parse(localStorage.getItem('iava_signal_quality') || '{"signals":[]}')
    const tradeJournal = JSON.parse(localStorage.getItem('iava_trade_journal') || '{"trades":[]}')
    const learningProgress = JSON.parse(localStorage.getItem('iava_learning_progress') || '{"completed":[]}')

    // 4. Performance Metrics
    const navigation = performance.getEntriesByType('navigation')[0]
    const pageLoadTime = navigation ? (navigation.loadEventEnd - navigation.fetchStart).toFixed(0) : 0

    // 5. System Capabilities
    const capabilities = {
      webGL: !!document.createElement('canvas').getContext('webgl'),
      webWorkers: typeof Worker !== 'undefined',
      localStorage: typeof Storage !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled
    }

    // 6. Browser Info
    const browserInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cores: navigator.hardwareConcurrency || 'Unknown',
      deviceMemory: navigator.deviceMemory || 'Unknown'
    }

    // 7. Network Status
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const networkInfo = connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    } : null

    setSystemMetrics({
      memory,
      storage: {
        sizeMB: storageMB,
        items: Object.keys(localStorage).length
      },
      features: {
        signalsTracked: signalQuality.signals?.length || 0,
        tradesLogged: tradeJournal.trades?.length || 0,
        lessonsCompleted: learningProgress.completed?.length || 0
      },
      performance: {
        pageLoadTime,
        timestamp: Date.now()
      },
      capabilities,
      browser: browserInfo,
      network: networkInfo
    })
  }

  useEffect(() => {
    collectSystemMetrics()

    if (!autoRefresh) return

    const interval = setInterval(collectSystemMetrics, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [autoRefresh])

  if (!systemMetrics) {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="text-slate-400">Collecting system metrics...</div>
      </div>
    )
  }

  const healthScore = () => {
    let score = 100
    if (systemMetrics.memory && parseFloat(systemMetrics.memory.percentage) > 90) score -= 20
    if (parseFloat(systemMetrics.storage.sizeMB) > 4) score -= 10
    if (systemMetrics.performance.pageLoadTime > 3000) score -= 15
    if (!systemMetrics.capabilities.online) score -= 30
    Object.values(systemMetrics.capabilities).filter(v => !v).forEach(() => score -= 5)
    return Math.max(0, score)
  }

  const health = healthScore()
  const healthColor = health >= 90 ? 'emerald' : health >= 70 ? 'cyan' : health >= 50 ? 'yellow' : 'rose'
  const healthStatus = health >= 90 ? 'Excellent' : health >= 70 ? 'Good' : health >= 50 ? 'Fair' : 'Needs Attention'

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-600 via-indigo-500 to-purple-500 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Icon with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-indigo-600 blur-xl opacity-50 animate-pulse" />
                <span className="relative text-4xl filter drop-shadow-lg">🏥</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-200 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                  System Health Monitor
                </h2>
                <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-semibold">Real-time browser, storage, and performance metrics</span>
                </p>
              </div>
            </div>

            {/* Premium Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="relative group px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-lg overflow-hidden"
              >
                <div className={`absolute inset-0 ${
                  autoRefresh
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                    : 'bg-slate-700'
                } transition-all`} />
                {autoRefresh && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                )}
                <span className="relative text-white flex items-center gap-2">
                  {autoRefresh ? '● Live (5s)' : 'Auto-refresh OFF'}
                </span>
              </button>

              <button
                onClick={collectSystemMetrics}
                className="relative group px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <span className="relative text-white flex items-center gap-2">
                  <span>Refresh Now</span>
                  <span className="text-base">🔄</span>
                </span>
              </button>
            </div>
          </div>

          {/* Premium Overall Health Score */}
          <div className="relative group">
            <div className={`absolute inset-0 ${
              health >= 90 ? 'bg-emerald-600' :
              health >= 70 ? 'bg-cyan-600' :
              health >= 50 ? 'bg-yellow-600' :
              'bg-rose-600'
            } blur-xl opacity-10 rounded-xl`} />
            <div className="relative p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                    Overall System Health
                  </div>
                  <div className={`text-5xl font-bold ${
                    health >= 90 ? 'text-emerald-400' :
                    health >= 70 ? 'text-cyan-400' :
                    health >= 50 ? 'text-yellow-400' :
                    'text-rose-400'
                  }`}>
                    {health}/100
                  </div>
                  <div className={`text-sm font-semibold mt-2 ${
                    health >= 90 ? 'text-emerald-300' :
                    health >= 70 ? 'text-cyan-300' :
                    health >= 50 ? 'text-yellow-300' :
                    'text-rose-300'
                  }`}>
                    {healthStatus}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-7xl filter drop-shadow-lg">
                    {health >= 90 ? '💚' : health >= 70 ? '💙' : health >= 50 ? '💛' : '❤️'}
                  </div>
                </div>
              </div>

              {/* Premium Health Bar */}
              <div className="mt-5 h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${
                    health >= 90 ? 'from-emerald-600 to-emerald-400' :
                    health >= 70 ? 'from-cyan-600 to-cyan-400' :
                    health >= 50 ? 'from-yellow-600 to-yellow-400' :
                    'from-rose-600 to-rose-400'
                  } transition-all duration-500 shadow-lg`}
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Memory Usage */}
      {systemMetrics.memory && (
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🧠</span>
            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-200 to-indigo-300 bg-clip-text text-transparent">
              Memory Usage
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-cyan-500/40 transition-all">
                <div className="text-xs uppercase tracking-wider text-cyan-400/80 font-semibold mb-2">Used Heap</div>
                <div className="text-2xl font-bold text-cyan-400">{systemMetrics.memory.used} MB</div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-blue-500/40 transition-all">
                <div className="text-xs uppercase tracking-wider text-blue-400/80 font-semibold mb-2">Total Heap</div>
                <div className="text-2xl font-bold text-blue-400">{systemMetrics.memory.total} MB</div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-indigo-500/40 transition-all">
                <div className="text-xs uppercase tracking-wider text-indigo-400/80 font-semibold mb-2">Heap Limit</div>
                <div className="text-2xl font-bold text-indigo-400">{systemMetrics.memory.limit} MB</div>
              </div>
            </div>
            <div className="relative group">
              <div className={`absolute inset-0 ${
                parseFloat(systemMetrics.memory.percentage) > 90 ? 'bg-rose-600' :
                parseFloat(systemMetrics.memory.percentage) > 70 ? 'bg-yellow-600' :
                'bg-emerald-600'
              } blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`} />
              <div className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-emerald-500/40 transition-all">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Usage</div>
                <div className={`text-2xl font-bold ${
                  parseFloat(systemMetrics.memory.percentage) > 90 ? 'text-rose-400' :
                  parseFloat(systemMetrics.memory.percentage) > 70 ? 'text-yellow-400' :
                  'text-emerald-400'
                }`}>
                  {systemMetrics.memory.percentage}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Premium LocalStorage Usage */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">💾</span>
            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-200 to-blue-300 bg-clip-text text-transparent">
              Local Storage
            </h3>
          </div>
          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-cyan-500/40 transition-all">
                <span className="text-sm font-semibold text-slate-300">Storage Size</span>
                <span className="text-lg font-bold text-cyan-400">{systemMetrics.storage.sizeMB} MB</span>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-blue-500/40 transition-all">
                <span className="text-sm font-semibold text-slate-300">Total Items</span>
                <span className="text-lg font-bold text-blue-400">{systemMetrics.storage.items}</span>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-slate-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-slate-600/40 transition-all">
                <span className="text-sm font-semibold text-slate-300">Approximate Limit</span>
                <span className="text-lg font-bold text-slate-400">~5-10 MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Feature Usage */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">📊</span>
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-200 to-cyan-300 bg-clip-text text-transparent">
              Feature Usage
            </h3>
          </div>
          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-emerald-500/40 transition-all">
                <span className="text-sm font-semibold text-slate-300">Signals Tracked</span>
                <span className="text-lg font-bold text-emerald-400">{systemMetrics.features.signalsTracked}</span>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-cyan-500/40 transition-all">
                <span className="text-sm font-semibold text-slate-300">Trades Logged</span>
                <span className="text-lg font-bold text-cyan-400">{systemMetrics.features.tradesLogged}</span>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-indigo-500/40 transition-all">
                <span className="text-sm font-semibold text-slate-300">Lessons Completed</span>
                <span className="text-lg font-bold text-indigo-400">{systemMetrics.features.lessonsCompleted}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium System Capabilities */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">⚙️</span>
          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-200 to-indigo-300 bg-clip-text text-transparent">
            System Capabilities
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(systemMetrics.capabilities).map(([key, value]) => (
            <div key={key} className="relative group">
              <div className={`absolute inset-0 ${value ? 'bg-emerald-600' : 'bg-rose-600'} blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`} />
              <div className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-slate-600/40 transition-all text-center">
                <div className={`text-3xl mb-2 filter drop-shadow-lg ${value ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {value ? '✓' : '✗'}
                </div>
                <div className="text-xs text-slate-400 capitalize font-semibold">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Network Status */}
      {systemMetrics.network && (
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🌐</span>
            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-200 to-blue-300 bg-clip-text text-transparent">
              Network Status
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-cyan-500/40 transition-all">
                <div className="text-xs uppercase tracking-wider text-cyan-400/80 font-semibold mb-2">Connection Type</div>
                <div className="text-xl font-bold text-cyan-400 uppercase">{systemMetrics.network.effectiveType}</div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-blue-500/40 transition-all">
                <div className="text-xs uppercase tracking-wider text-blue-400/80 font-semibold mb-2">Downlink</div>
                <div className="text-xl font-bold text-blue-400">{systemMetrics.network.downlink} Mbps</div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
              <div className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-indigo-500/40 transition-all">
                <div className="text-xs uppercase tracking-wider text-indigo-400/80 font-semibold mb-2">Round Trip Time</div>
                <div className="text-xl font-bold text-indigo-400">{systemMetrics.network.rtt} ms</div>
              </div>
            </div>
            <div className="relative group">
              <div className={`absolute inset-0 ${systemMetrics.network.saveData ? 'bg-emerald-600' : 'bg-slate-600'} blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`} />
              <div className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-slate-600/40 transition-all">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Data Saver</div>
                <div className={`text-xl font-bold ${systemMetrics.network.saveData ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {systemMetrics.network.saveData ? 'ON' : 'OFF'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Browser Info */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">🌍</span>
          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-200 to-cyan-300 bg-clip-text text-transparent">
            Browser Information
          </h3>
        </div>
        <div className="grid gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-slate-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-slate-600/40 transition-all">
              <span className="text-sm font-semibold text-slate-300">Platform</span>
              <span className="text-sm font-mono text-slate-400 font-semibold">{systemMetrics.browser.platform}</span>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-slate-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-slate-600/40 transition-all">
              <span className="text-sm font-semibold text-slate-300">Language</span>
              <span className="text-sm font-mono text-slate-400 font-semibold">{systemMetrics.browser.language}</span>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-cyan-500/40 transition-all">
              <span className="text-sm font-semibold text-slate-300">CPU Cores</span>
              <span className="text-sm font-mono text-cyan-400 font-semibold">{systemMetrics.browser.cores}</span>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600 blur-xl opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            <div className="relative flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg hover:border-blue-500/40 transition-all">
              <span className="text-sm font-semibold text-slate-300">Device Memory</span>
              <span className="text-sm font-mono text-blue-400 font-semibold">
                {systemMetrics.browser.deviceMemory !== 'Unknown' ? `${systemMetrics.browser.deviceMemory} GB` : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Performance Insights */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">💡</span>
          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text text-transparent">
            Performance Insights
          </h3>
        </div>
        <div className="space-y-3">
          {systemMetrics.memory && parseFloat(systemMetrics.memory.percentage) > 90 && (
            <div className="relative group">
              <div className="absolute inset-0 bg-rose-600 blur-xl opacity-10 rounded-xl" />
              <div className="relative p-4 bg-gradient-to-r from-rose-500/20 to-rose-600/10 border border-rose-500/40 rounded-xl shadow-lg backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <div className="text-sm font-bold text-rose-300 mb-1">High Memory Usage</div>
                    <div className="text-sm text-rose-200/80">
                      Memory at {systemMetrics.memory.percentage}% - Consider closing other tabs or refreshing the page
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {parseFloat(systemMetrics.storage.sizeMB) > 4 && (
            <div className="relative group">
              <div className="absolute inset-0 bg-yellow-600 blur-xl opacity-10 rounded-xl" />
              <div className="relative p-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/40 rounded-xl shadow-lg backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <div className="text-sm font-bold text-yellow-300 mb-1">High Storage Usage</div>
                    <div className="text-sm text-yellow-200/80">
                      LocalStorage at {systemMetrics.storage.sizeMB} MB - Some browsers limit to 5-10 MB
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!systemMetrics.capabilities.online && (
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-600 blur-xl opacity-10 rounded-xl" />
              <div className="relative p-4 bg-gradient-to-r from-orange-500/20 to-orange-600/10 border border-orange-500/40 rounded-xl shadow-lg backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔌</span>
                  <div>
                    <div className="text-sm font-bold text-orange-300 mb-1">Offline Mode</div>
                    <div className="text-sm text-orange-200/80">
                      You're offline - Some features may be unavailable
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {systemMetrics.capabilities.online && systemMetrics.memory && parseFloat(systemMetrics.memory.percentage) < 70 && (
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-600 blur-xl opacity-10 rounded-xl" />
              <div className="relative p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 rounded-xl shadow-lg backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <span className="text-xl">✓</span>
                  <div>
                    <div className="text-sm font-bold text-emerald-300 mb-1">Optimal Performance</div>
                    <div className="text-sm text-emerald-200/80">
                      System performing optimally - All features available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
