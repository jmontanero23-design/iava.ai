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
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
              System Health Monitor
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Real-time browser, storage, and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {autoRefresh ? '● Live (5s)' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={collectSystemMetrics}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Overall Health Score */}
        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 mb-1">Overall System Health</div>
              <div className="text-4xl font-bold text-{healthColor}-400">{health}/100</div>
              <div className="text-sm text-slate-300 mt-1">{healthStatus}</div>
            </div>
            <div className="text-right">
              <div className={`text-6xl ${
                health >= 90 ? 'text-emerald-400' :
                health >= 70 ? 'text-cyan-400' :
                health >= 50 ? 'text-yellow-400' :
                'text-rose-400'
              }`}>
                {health >= 90 ? '💚' : health >= 70 ? '💙' : health >= 50 ? '💛' : '❤️'}
              </div>
            </div>
          </div>

          {/* Health Bar */}
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-${healthColor}-600 to-${healthColor}-400 transition-all duration-500`}
              style={{ width: `${health}%` }}
            />
          </div>
        </div>
      </div>

      {/* Memory & Storage */}
      {systemMetrics.memory && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span>🧠</span> Memory Usage
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Used Heap</div>
              <div className="text-2xl font-bold text-cyan-400">{systemMetrics.memory.used} MB</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Total Heap</div>
              <div className="text-2xl font-bold text-blue-400">{systemMetrics.memory.total} MB</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Heap Limit</div>
              <div className="text-2xl font-bold text-indigo-400">{systemMetrics.memory.limit} MB</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Usage</div>
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LocalStorage Usage */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span>💾</span> Local Storage
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-slate-300">Storage Size</span>
              <span className="text-lg font-bold text-cyan-400">{systemMetrics.storage.sizeMB} MB</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-slate-300">Total Items</span>
              <span className="text-lg font-bold text-blue-400">{systemMetrics.storage.items}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-slate-300">Approximate Limit</span>
              <span className="text-lg font-bold text-slate-400">~5-10 MB</span>
            </div>
          </div>
        </div>

        {/* Feature Usage */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span>📊</span> Feature Usage
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-slate-300">Signals Tracked</span>
              <span className="text-lg font-bold text-emerald-400">{systemMetrics.features.signalsTracked}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-slate-300">Trades Logged</span>
              <span className="text-lg font-bold text-cyan-400">{systemMetrics.features.tradesLogged}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-slate-300">Lessons Completed</span>
              <span className="text-lg font-bold text-indigo-400">{systemMetrics.features.lessonsCompleted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Capabilities */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span>⚙️</span> System Capabilities
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(systemMetrics.capabilities).map(([key, value]) => (
            <div key={key} className="p-3 bg-slate-800/30 rounded-lg text-center">
              <div className={`text-2xl mb-1 ${value ? 'text-emerald-400' : 'text-rose-400'}`}>
                {value ? '✓' : '✗'}
              </div>
              <div className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Status */}
      {systemMetrics.network && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span>🌐</span> Network Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Connection Type</div>
              <div className="text-xl font-bold text-cyan-400 uppercase">{systemMetrics.network.effectiveType}</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Downlink</div>
              <div className="text-xl font-bold text-blue-400">{systemMetrics.network.downlink} Mbps</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Round Trip Time</div>
              <div className="text-xl font-bold text-indigo-400">{systemMetrics.network.rtt} ms</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Data Saver</div>
              <div className={`text-xl font-bold ${systemMetrics.network.saveData ? 'text-emerald-400' : 'text-slate-500'}`}>
                {systemMetrics.network.saveData ? 'ON' : 'OFF'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Browser Info */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span>🌍</span> Browser Information
        </h3>
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <span className="text-sm text-slate-300">Platform</span>
            <span className="text-sm font-mono text-slate-400">{systemMetrics.browser.platform}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <span className="text-sm text-slate-300">Language</span>
            <span className="text-sm font-mono text-slate-400">{systemMetrics.browser.language}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <span className="text-sm text-slate-300">CPU Cores</span>
            <span className="text-sm font-mono text-cyan-400">{systemMetrics.browser.cores}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <span className="text-sm text-slate-300">Device Memory</span>
            <span className="text-sm font-mono text-blue-400">
              {systemMetrics.browser.deviceMemory !== 'Unknown' ? `${systemMetrics.browser.deviceMemory} GB` : 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="glass-panel p-6 border-indigo-500/30">
        <h3 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
          <span>💡</span> Performance Insights
        </h3>
        <div className="space-y-2">
          {systemMetrics.memory && parseFloat(systemMetrics.memory.percentage) > 90 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-300">
              ⚠️ High memory usage ({systemMetrics.memory.percentage}%) - Consider closing other tabs or refreshing the page
            </div>
          )}

          {parseFloat(systemMetrics.storage.sizeMB) > 4 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-300">
              ⚠️ LocalStorage usage is high ({systemMetrics.storage.sizeMB} MB) - Some browsers limit to 5-10 MB
            </div>
          )}

          {!systemMetrics.capabilities.online && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm text-orange-300">
              🔌 You're offline - Some features may be unavailable
            </div>
          )}

          {systemMetrics.capabilities.online && systemMetrics.memory && parseFloat(systemMetrics.memory.percentage) < 70 && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-300">
              ✓ System performing optimally - All features available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
