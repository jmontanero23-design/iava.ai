import React from 'react'

export default function Hero() {
  return (
    <header className="relative overflow-hidden rounded-2xl">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900" />
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/30 via-transparent to-violet-950/30 animate-gradient" />

      {/* Glass panel */}
      <div className="glass-panel border-0 relative">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4">
            {/* Logo - ALWAYS visible */}
            <img src="/logo.svg" alt="iAVA.ai" className="w-12 h-12 md:w-16 md:h-16 drop-shadow-2xl shrink-0" />

            {/* Title & Badge */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-4xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
                  iAVA.ai
                </span>
              </h1>
              <p className="text-sm md:text-base text-slate-400 mt-1">
                AI-Powered Trading Intelligence
              </p>
            </div>

            {/* Live Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-500/20 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-300">LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
