/**
 * Feature Status Badge
 * Shows how many AI features are active vs need setup
 * Helps users understand system status at a glance
 */

import { useState, useEffect } from 'react'

export default function FeatureStatusBadge({ onClick }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Count features by status
  const features = {
    clientSide: 9,  // Always active
    apiRequired: 3,  // Need AI API key
    total: 12
  }

  // Check if AI Gateway is available on mount
  useEffect(() => {
    const checkAPIHealth = async () => {
      try {
        const response = await fetch('/api/ai/gateway', {
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        })

        if (response.ok) {
          const data = await response.json()
          // If we get a 200 OK with proper structure, API is available
          setApiKeysConfigured(data.status === 'ok')
        } else {
          setApiKeysConfigured(false)
        }
      } catch (error) {
        // Network error or timeout = API not configured
        console.warn('[FeatureStatus] AI Gateway unavailable:', error.message)
        setApiKeysConfigured(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAPIHealth()
  }, [])

  const activeCount = features.clientSide + (apiKeysConfigured ? features.apiRequired : 0)
  const needsSetup = apiKeysConfigured ? 0 : features.apiRequired

  const statusColor = needsSetup === 0 ? 'emerald' : needsSetup <= 3 ? 'cyan' : 'yellow'

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="relative">
        <div className="relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-slate-800/50 border-slate-600/40 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-pulse filter drop-shadow-lg" />
          <span className="text-base font-bold text-slate-400">
            {features.clientSide}/{features.total}
          </span>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Checking...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Premium Badge Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative group"
      >
        {/* Background glow effect */}
        <div className={`absolute inset-0 ${
          needsSetup === 0 ? 'bg-emerald-600' : 'bg-amber-600'
        } blur-lg opacity-20 group-hover:opacity-30 rounded-xl transition-opacity`} />

        {/* Badge content */}
        <div className={`relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg transition-all group-hover:scale-105 ${
          needsSetup === 0
            ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 border-emerald-500/40 group-hover:border-emerald-400/60'
            : 'bg-gradient-to-r from-amber-600/30 to-amber-500/20 border-amber-500/40 group-hover:border-amber-400/60'
        }`}>
          {/* Status Dot with pulse */}
          <span className={`w-2.5 h-2.5 rounded-full ${
            needsSetup === 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'
          } filter drop-shadow-lg`} />

          {/* Count - Bold */}
          <span className="text-base font-bold text-white">
            {activeCount}/{features.total}
          </span>

          {/* Label */}
          <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
            AI Features
          </span>

          {/* Warning badge if needs setup */}
          {needsSetup > 0 && (
            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-md">
              {needsSetup} need setup
            </span>
          )}
        </div>
      </button>

      {/* Premium Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-3 w-72 z-50">
          <div className="relative group">
            {/* Tooltip glow */}
            <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-20 rounded-xl" />

            {/* Tooltip content */}
            <div className="relative bg-slate-900/95 border border-slate-700/50 rounded-xl shadow-2xl backdrop-blur-sm overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <span className="font-bold text-lg bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text text-transparent">
                    AI Features Status
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Active Features */}
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <span className="text-sm text-emerald-300 font-semibold">Client-Side (Always On)</span>
                  <span className="text-lg font-bold text-emerald-400">{features.clientSide}</span>
                </div>

                {/* API Features */}
                <div className={`flex items-center justify-between p-3 border rounded-lg ${
                  apiKeysConfigured
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <span className={`text-sm font-semibold ${
                    apiKeysConfigured ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    API-Powered
                  </span>
                  <span className={`text-lg font-bold ${
                    apiKeysConfigured ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {apiKeysConfigured ? features.apiRequired : `0/${features.apiRequired}`}
                  </span>
                </div>

                {!apiKeysConfigured && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
                      <span>⚠️</span>
                      <span>3 Features Need API Key:</span>
                    </div>
                    <ul className="space-y-1.5 ml-1">
                      <li className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        <span>AI Chat</span>
                      </li>
                      <li className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        <span>NLP Scanner</span>
                      </li>
                      <li className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        <span>Smart Watchlist</span>
                      </li>
                    </ul>
                    <div className="pt-3 space-y-2 border-t border-slate-700/50">
                      <p className="text-amber-300 text-xs font-semibold">Contact Support:</p>
                      <p className="text-xs text-slate-400">
                        Advanced AI features require additional configuration. Contact your administrator for setup.
                      </p>
                    </div>
                  </div>
                )}

                {apiKeysConfigured && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-emerald-300 text-sm">
                      <span>✅</span>
                      <span className="font-semibold">All Features Active</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      Using GPT-5 for world-class AI insights
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700/50 text-slate-400 text-xs flex items-center justify-center gap-2">
                <span>Click to view all features</span>
                <span className="text-indigo-400">→</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
