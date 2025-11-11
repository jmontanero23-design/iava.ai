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
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-${statusColor}-600/20 to-transparent border border-${statusColor}-500/30 hover:border-${statusColor}-400/50 transition-all hover:scale-105`}
      >
        {/* Status Dot */}
        <span className={`w-2 h-2 rounded-full bg-${statusColor}-400 ${needsSetup === 0 ? 'animate-pulse' : ''}`} />

        {/* Count */}
        <span className="text-sm font-semibold text-slate-200">
          {activeCount}/{features.total}
        </span>

        {/* Label */}
        <span className="text-xs text-slate-400">AI Features</span>

        {/* Warning if needs setup */}
        {needsSetup > 0 && (
          <span className="text-xs text-amber-400">
            ({needsSetup} need setup)
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 text-left">
          <div className="text-xs space-y-2">
            <div className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <span className="text-lg">🤖</span>
              AI Features Status
            </div>

            {/* Active Features */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Client-Side (Always On)</span>
              <span className="text-emerald-400 font-semibold">{features.clientSide}</span>
            </div>

            {/* API Features */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">API-Powered</span>
              <span className={apiKeysConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                {apiKeysConfigured ? features.apiRequired : `0/${features.apiRequired}`}
              </span>
            </div>

            {!apiKeysConfigured && (
              <div className="pt-2 mt-2 border-t border-slate-700">
                <p className="text-amber-300 text-xs mb-1">⚠️ Setup Required:</p>
                <ul className="text-slate-400 text-xs space-y-1 ml-3">
                  <li>• AI Chat</li>
                  <li>• NLP Scanner</li>
                  <li>• Smart Watchlist</li>
                </ul>
                <p className="text-slate-500 text-xs mt-2">
                  Add OpenAI API key in Vercel settings
                </p>
              </div>
            )}

            {/* Click hint */}
            <div className="pt-2 mt-2 border-t border-slate-700 text-slate-500 text-xs">
              Click to view all features →
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
