import React from 'react'

export default function Hero() {
  return (
    <header className="relative overflow-hidden rounded-2xl">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900" />
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/30 via-transparent to-violet-950/30 animate-gradient" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl opacity-20 animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Glass panel */}
      <div className="glass-panel border-0 relative">
        <div className="p-8 md:p-12">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="hidden md:block shrink-0">
              <img src="/logo.svg" alt="iAVA.ai" className="w-20 h-20 drop-shadow-2xl" />
            </div>

            {/* Content */}
            <div className="flex-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-500/20 backdrop-blur-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-medium text-slate-300 tracking-wider uppercase">AI-Powered Trading Intelligence</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent drop-shadow-lg">
                  iAVA.ai
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 font-light mb-3">
                Intelligent Alpha Velocity Assistant
              </p>

              {/* Description */}
              <p className="text-slate-400 max-w-3xl leading-relaxed mb-6">
                Advanced confluence trading system combining <span className="text-indigo-300 font-medium">SATY ATR Levels</span>,
                <span className="text-violet-300 font-medium"> Ripster EMA Clouds</span>,
                <span className="text-emerald-300 font-medium"> Ichimoku</span>, and
                <span className="text-cyan-300 font-medium"> TTM Squeeze</span> with AI-driven signal optimization and institutional-grade risk management.
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm text-sm text-slate-300 hover:border-indigo-500/50 transition-colors">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Real-Time Streaming
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm text-sm text-slate-300 hover:border-violet-500/50 transition-colors">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Unicorn Score Engine
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm text-sm text-slate-300 hover:border-emerald-500/50 transition-colors">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  6-Layer Risk Guardrails
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm text-sm text-slate-300 hover:border-cyan-500/50 transition-colors">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Paper Trading Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
