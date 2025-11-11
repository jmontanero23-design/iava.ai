import React from 'react'

export default function Hero() {
  return (
    <header className="glass-panel p-8 relative overflow-hidden group">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-indigo-600 via-sky-500 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute inset-0 opacity-20 bg-gradient-to-l from-cyan-500 via-indigo-500 to-transparent blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <img src="/logo.svg" alt="iAVA.ai" className="w-16 h-16 md:w-20 md:h-20" />
            <div>
              <p className="uppercase tracking-[0.35em] text-[11px] font-medium text-slate-400/80 mb-2 inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                AI SIGNAL FLIGHT DECK
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-200 via-sky-200 to-cyan-300 bg-clip-text text-transparent leading-tight">
                iAVA.ai
              </h1>
              <p className="text-lg md:text-xl text-slate-300/90 font-light mt-1 tracking-wide">
                Intelligent Alpha Velocity Assistant
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm md:text-base text-slate-300/80 mt-4 max-w-3xl leading-relaxed">
          Confluence-grade trading intelligence blending <span className="text-emerald-400 font-medium">SATY ATR</span>, <span className="text-cyan-400 font-medium">Ripster</span>, <span className="text-indigo-400 font-medium">Ichimoku</span>, and <span className="text-sky-400 font-medium">TTM</span> volatility—automated through <span className="font-medium">Alpaca</span> + <span className="font-medium">n8n</span> pipelines.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-slate-900/70 border border-emerald-500/30 text-emerald-300 inline-flex items-center gap-1.5 hover:bg-slate-900/90 transition-all">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Streaming Ready
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-900/70 border border-indigo-500/30 text-indigo-300 hover:bg-slate-900/90 transition-all">
            ⚡ Unicorn Score Engine
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-900/70 border border-cyan-500/30 text-cyan-300 hover:bg-slate-900/90 transition-all">
            🛡️ Alpaca Guardrails
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-900/70 border border-rose-500/30 text-rose-300 hover:bg-slate-900/90 transition-all">
            🤖 12 AI Features
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-900/70 border border-purple-500/30 text-purple-300 hover:bg-slate-900/90 transition-all">
            📱 PWA Ready
          </span>
        </div>
      </div>
    </header>
  )
}
