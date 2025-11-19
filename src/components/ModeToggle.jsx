import { useState, useEffect } from 'react'

/**
 * Lite/Pro Mode Toggle
 * Allows users to switch between simplified (Lite) and advanced (Pro) interface
 *
 * Lite Mode:
 * - Simplified navigation
 * - Basic features only
 * - Less visual complexity
 * - Perfect for beginners
 *
 * Pro Mode:
 * - All features visible
 * - Advanced indicators
 * - Maximum customization
 * - For experienced traders
 */
export default function ModeToggle() {
  const [mode, setMode] = useState(() => {
    // Load saved preference or default to 'lite'
    return localStorage.getItem('iava_ui_mode') || 'lite'
  })

  useEffect(() => {
    // Save preference
    localStorage.setItem('iava_ui_mode', mode)

    // Dispatch event for components to react to mode changes
    window.dispatchEvent(new CustomEvent('iava.modeChange', {
      detail: { mode }
    }))

    // Apply CSS class to body for global styling
    document.body.classList.remove('mode-lite', 'mode-pro')
    document.body.classList.add(`mode-${mode}`)
  }, [mode])

  // Listen for keyboard shortcut Alt+M
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        toggleMode()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [mode])

  const toggleMode = () => {
    const newMode = mode === 'lite' ? 'pro' : 'lite'
    setMode(newMode)

    // Show toast notification
    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: {
        text: `Switched to ${newMode === 'lite' ? 'Lite' : 'Pro'} Mode`,
        type: 'success'
      }
    }))
  }

  const isLite = mode === 'lite'
  const isPro = mode === 'pro'

  return (
    <div className="relative">
      <button
        onClick={toggleMode}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-slate-700/50 hover:border-slate-600/50 group"
        title={`Switch to ${isLite ? 'Pro' : 'Lite'} Mode (Alt+M)`}
        aria-label={`Current mode: ${mode}. Click to switch to ${isLite ? 'Pro' : 'Lite'} mode`}
      >
        {/* Icon with glow effect */}
        <div className="relative">
          <div className={`absolute inset-0 blur-lg opacity-50 transition-opacity ${
            isPro ? 'bg-violet-500' : 'bg-cyan-500'
          } ${isPro ? 'opacity-70' : 'opacity-40'} group-hover:opacity-100`} />
          <span className="relative text-xl filter drop-shadow-lg transition-transform group-hover:scale-110">
            {isLite ? '🎯' : '🚀'}
          </span>
        </div>

        {/* Mode label with gradient */}
        <div className="flex flex-col items-start">
          <span className={`text-sm font-bold bg-gradient-to-r ${
            isPro
              ? 'from-violet-200 to-fuchsia-300'
              : 'from-cyan-200 to-blue-300'
          } bg-clip-text text-transparent transition-all`}>
            {isLite ? 'Lite Mode' : 'Pro Mode'}
          </span>
          <span className="text-[10px] text-slate-400">
            {isLite ? 'Simplified' : 'Advanced'}
          </span>
        </div>

        {/* Keyboard shortcut */}
        <kbd className="text-xs px-2 py-1 bg-slate-900/50 rounded border border-slate-700 text-slate-400 font-mono">
          Alt+M
        </kbd>

        {/* Toggle indicator */}
        <div className={`w-10 h-6 rounded-full transition-all ${
          isPro ? 'bg-violet-600' : 'bg-cyan-600'
        } relative`}>
          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            isPro ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </div>
      </button>

      {/* Feature comparison tooltip (shows on hover) */}
      <div className="absolute top-full mt-2 right-0 w-72 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4 shadow-2xl">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold text-cyan-400 mb-1.5">🎯 Lite Mode</h4>
              <ul className="text-[10px] text-slate-400 space-y-0.5">
                <li>• Simplified navigation</li>
                <li>• Core features only</li>
                <li>• Beginner-friendly</li>
                <li>• Faster load times</li>
              </ul>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <h4 className="text-xs font-bold text-violet-400 mb-1.5">🚀 Pro Mode</h4>
              <ul className="text-[10px] text-slate-400 space-y-0.5">
                <li>• All 17+ AI features</li>
                <li>• Advanced indicators</li>
                <li>• Multi-timeframe analysis</li>
                <li>• Expert customization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for components to check current mode
export function useUIMode() {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('iava_ui_mode') || 'lite'
  })

  useEffect(() => {
    const handleModeChange = (event) => {
      setMode(event.detail.mode)
    }

    window.addEventListener('iava.modeChange', handleModeChange)
    return () => window.removeEventListener('iava.modeChange', handleModeChange)
  }, [])

  return {
    mode,
    isLite: mode === 'lite',
    isPro: mode === 'pro'
  }
}
