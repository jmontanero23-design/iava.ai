import React from 'react'

export default function Hero() {
  return (
    <header className="glass-panel p-6 md:p-8 relative overflow-hidden group">
      {/* Animated gradient background - More vibrant */}
      <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute inset-0 opacity-30 bg-gradient-to-l from-cyan-400 via-indigo-600 to-purple-600 blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            {/* Logo with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 blur-xl opacity-50 animate-pulse" />
              <img src="/logo.svg" alt="iAVA.ai" className="relative w-16 h-16 md:w-20 md:h-20" />
            </div>

            <div>
              <p className="uppercase tracking-[0.35em] text-[10px] md:text-[11px] font-medium text-slate-400/80 mb-2 inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                AI SIGNAL INTELLIGENCE
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-300 bg-clip-text text-transparent leading-tight">
                iAVA.ai
              </h1>
              <p className="text-base md:text-lg text-slate-300/90 font-light mt-1 tracking-wide">
                Intelligent Alpha Velocity Assistant
              </p>
            </div>
          </div>

          {/* Right: Unicorn Callout */}
          <div className="shrink-0">
            <div className="relative group/unicorn">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-lg opacity-60 group-hover/unicorn:opacity-80 transition-opacity" />
              <div className="relative px-5 py-3 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/50 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce" style={{ animationDuration: '2s' }}>
                    🦄
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-purple-300 font-semibold mb-0.5">
                      Unicorn Signals
                    </div>
                    <div className="text-lg font-bold text-white">
                      Rare. Powerful. AI-Validated.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description with highlighted indicators */}
        <p className="text-sm md:text-base text-slate-300/80 max-w-4xl leading-relaxed mb-5">
          Multi-indicator confluence detection combining{' '}
          <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium rounded">SATY ATR</span>,{' '}
          <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium rounded">Ripster EMA</span>,{' '}
          <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium rounded">Ichimoku Cloud</span>, and{' '}
          <span className="px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 text-sky-300 font-medium rounded">TTM Squeeze</span>
          {' '}with automated execution via <span className="text-slate-200 font-medium">Alpaca</span>.
        </p>

        {/* Feature badges - More prominent with hover effects */}
        <div className="flex flex-wrap gap-2 md:gap-3 text-xs">
          <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border border-emerald-500/40 text-emerald-300 inline-flex items-center gap-2 hover:scale-105 hover:border-emerald-400/60 transition-all cursor-default shadow-lg shadow-emerald-500/10">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-semibold">Live Streaming</span>
          </span>

          <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/40 text-purple-300 inline-flex items-center gap-2 hover:scale-105 hover:border-purple-400/60 transition-all cursor-default shadow-lg shadow-purple-500/10">
            <span className="text-base">🦄</span>
            <span className="font-semibold">Unicorn Detection</span>
          </span>

          <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 border border-cyan-500/40 text-cyan-300 inline-flex items-center gap-2 hover:scale-105 hover:border-cyan-400/60 transition-all cursor-default shadow-lg shadow-cyan-500/10">
            <span className="text-base">🤖</span>
            <span className="font-semibold">12 AI Features</span>
          </span>

          <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 border border-indigo-500/40 text-indigo-300 inline-flex items-center gap-2 hover:scale-105 hover:border-indigo-400/60 transition-all cursor-default shadow-lg shadow-indigo-500/10">
            <span className="text-base">🛡️</span>
            <span className="font-semibold">Risk Managed</span>
          </span>

          <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600/20 to-rose-500/10 border border-rose-500/40 text-rose-300 inline-flex items-center gap-2 hover:scale-105 hover:border-rose-400/60 transition-all cursor-default shadow-lg shadow-rose-500/10">
            <span className="text-base">📱</span>
            <span className="font-semibold">PWA Ready</span>
          </span>
        </div>
      </div>
    </header>
  )
}
