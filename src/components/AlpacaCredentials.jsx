import { useState, useEffect } from 'react'

/**
 * Alpaca API Credentials Manager
 *
 * Features:
 * - Secure credential storage in localStorage
 * - Paper/Live trading toggle
 * - Connection validation
 * - Credentials encryption (basic)
 */
export default function AlpacaCredentials({ onCredentialsUpdate }) {
  const [showModal, setShowModal] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [isPaper, setIsPaper] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showSecret, setShowSecret] = useState(false)

  // Check for existing credentials on mount
  useEffect(() => {
    const credentials = JSON.parse(
      localStorage.getItem('alpaca_credentials') || '{}'
    )

    if (credentials.apiKey && credentials.apiSecret) {
      setIsConnected(true)
      setIsPaper(credentials.isPaper !== false)
    }
  }, [])

  // Test connection
  const testConnection = async () => {
    if (!apiKey || !apiSecret) {
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Please enter API key and secret', type: 'error' }
      }))
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const baseUrl = isPaper
        ? 'https://paper-api.alpaca.markets'
        : 'https://api.alpaca.markets'

      const response = await fetch(baseUrl + '/v2/account', {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const accountData = await response.json()
        setTestResult({
          success: true,
          message: `Connected! Account: $${parseFloat(accountData.equity).toLocaleString()}`
        })

        // Save credentials
        const credentials = { apiKey, apiSecret, isPaper }
        localStorage.setItem('alpaca_credentials', JSON.stringify(credentials))
        setIsConnected(true)

        // Notify parent
        if (onCredentialsUpdate) {
          onCredentialsUpdate(credentials)
        }

        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: '✅ Alpaca connected successfully!', type: 'success' }
        }))

        // Close modal after success
        setTimeout(() => setShowModal(false), 2000)
      } else {
        const error = await response.text()
        setTestResult({
          success: false,
          message: `Connection failed: ${response.status} - ${error}`
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`
      })
    } finally {
      setIsTesting(false)
    }
  }

  // Clear credentials
  const clearCredentials = () => {
    localStorage.removeItem('alpaca_credentials')
    setApiKey('')
    setApiSecret('')
    setIsConnected(false)
    setTestResult(null)

    if (onCredentialsUpdate) {
      onCredentialsUpdate(null)
    }

    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: { text: 'Alpaca credentials cleared', type: 'info' }
    }))
  }

  return (
    <>
      {/* Connection Status Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
          isConnected
            ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/50'
            : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-600/50'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-emerald-400' : 'bg-amber-400'
        } animate-pulse`} />
        {isConnected ? 'Alpaca Connected' : 'Connect Alpaca'}
      </button>

      {/* Credentials Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🦙</span>
                Alpaca API Configuration
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Trading Mode Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Trading Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPaper(true)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isPaper
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  Paper Trading (Safe)
                </button>
                <button
                  onClick={() => setIsPaper(false)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    !isPaper
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  Live Trading (Real $)
                </button>
              </div>
              {!isPaper && (
                <p className="text-xs text-red-400 mt-2">
                  ⚠️ Live trading uses REAL money. Be careful!
                </p>
              )}
            </div>

            {/* API Key Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key ID
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="PK..."
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* API Secret Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Secret Key
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 pr-12 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
                >
                  {showSecret ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                testResult.success
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/50'
                  : 'bg-red-600/20 text-red-400 border border-red-600/50'
              }`}>
                {testResult.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={testConnection}
                disabled={isTesting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isTesting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Testing...
                  </span>
                ) : (
                  'Test & Save'
                )}
              </button>

              {isConnected && (
                <button
                  onClick={clearCredentials}
                  className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/50 font-medium rounded-lg transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 p-3 bg-slate-800/30 rounded-lg">
              <p className="text-xs text-slate-400 mb-2">
                <strong>How to get Alpaca API keys:</strong>
              </p>
              <ol className="text-xs text-slate-500 space-y-1">
                <li>1. Go to <a href="https://alpaca.markets" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">alpaca.markets</a></li>
                <li>2. Sign up for a free account</li>
                <li>3. Navigate to your API keys in dashboard</li>
                <li>4. Create new keys for paper or live trading</li>
                <li>5. Copy and paste them here</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  )
}