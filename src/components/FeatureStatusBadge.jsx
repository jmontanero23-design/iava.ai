/**
 * Feature Status Badge
 * Shows how many AI features are active vs need setup
 * Helps users understand system status at a glance
 */

import { useState } from 'react'

export default function FeatureStatusBadge({ onClick }) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Count features by status
  const features = {
    clientSide: 9,  // Always active
    apiRequired: 3,  // Need OpenAI API key
    total: 12
  }

  // Check if API keys are configured (we can't check directly, but we can infer from failed calls)
  // For now, assume they're NOT configured (user would see errors if they try to use them)
  const apiKeysConfigured = false

  const activeCount = features.clientSide + (apiKeysConfigured ? features.apiRequired : 0)
  const needsSetup = apiKeysConfigured ? 0 : features.apiRequired

  const statusColor = needsSetup === 0 ? 'emerald' : needsSetup <= 3 ? 'cyan' : 'yellow'

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
          needsSetup === 0 ? 'bg-emerald-600' : 'bg-cyan-600'
        } blur-lg opacity-20 group-hover:opacity-30 rounded-xl transition-opacity`} />

        {/* Badge content */}
        <div className={`relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg transition-all group-hover:scale-105 ${
          needsSetup === 0
            ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 border-emerald-500/40 group-hover:border-emerald-400/60'
            : 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/20 border-cyan-500/40 group-hover:border-cyan-400/60'
        }`}>
          {/* Status Dot with pulse */}
          <span className={`w-2.5 h-2.5 rounded-full ${
            needsSetup === 0 ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400 animate-pulse'
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
                      <span>Setup Required:</span>
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
                    <p className="text-slate-500 text-xs pt-2 italic">
                      Add OpenAI API key in Vercel settings
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
