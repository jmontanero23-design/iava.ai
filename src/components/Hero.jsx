import React from 'react'

export default function Hero() {
  return (
    <header className="glass-panel panel-header group">
      {/* Enhanced gradient background layers (more vibrant than default panel-header) */}
      <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
      <div className="absolute inset-0 opacity-30 bg-gradient-to-l from-cyan-400 via-indigo-600 to-purple-600 blur-2xl animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }} />

      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            {/* Logo with glow effect */}
            <div className="relative panel-icon" style={{ fontSize: '3.5rem' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 blur-xl opacity-50 animate-pulse" />
              <img src="/logo.svg" alt="iAVA.ai" className="relative w-12 h-12 md:w-14 md:h-14" />
            </div>

            <div>
              <p className="uppercase tracking-[0.35em] font-medium text-slate-400/80 mb-1 inline-flex items-center gap-2" style={{ fontSize: 'var(--text-xs)' }}>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                AI SIGNAL INTELLIGENCE
              </p>
              <h1 className="font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-300 bg-clip-text text-transparent leading-tight" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-extrabold)' }}>
                iAVA.ai
              </h1>
              <p className="text-slate-300/90 mt-0.5 tracking-wide" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-normal)' }}>
                Intelligent Alpha Velocity Assistant
              </p>
            </div>
          </div>

          {/* Right: Unicorn Callout */}
          <div className="shrink-0">
            <div className="relative group/unicorn">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-lg opacity-60 group-hover/unicorn:opacity-80 transition-all duration-300" />
              <div className="relative px-4 py-3 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/50 backdrop-blur-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="flex items-center gap-3">
                  <span className="animate-bounce" style={{ fontSize: 'var(--text-2xl)', animationDuration: '2s' }}>
                    🦄
                  </span>
                  <div>
                    <div className="uppercase tracking-widest text-purple-300 mb-0.5" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>
                      Unicorn Signals
                    </div>
                    <div className="text-white" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>
                      Rare. Powerful. AI-Validated.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description with highlighted indicators */}
        <p className="text-slate-300/80 max-w-4xl leading-relaxed mb-3" style={{ fontSize: 'var(--text-sm)' }}>
          Multi-indicator confluence detection combining{' '}
          <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium rounded" style={{ fontSize: 'var(--text-xs)' }}>SATY ATR</span>,{' '}
          <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium rounded" style={{ fontSize: 'var(--text-xs)' }}>Ripster EMA</span>,{' '}
          <span className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium rounded" style={{ fontSize: 'var(--text-xs)' }}>Ichimoku Cloud</span>, and{' '}
          <span className="px-2 py-1 bg-sky-500/20 border border-sky-500/30 text-sky-300 font-medium rounded" style={{ fontSize: 'var(--text-xs)' }}>TTM Squeeze</span>
          {' '}with automated execution via <span className="text-slate-200" style={{ fontWeight: 'var(--font-medium)' }}>Alpaca</span>.
        </p>

        {/* Feature badges - More prominent with hover effects */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-2 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border border-emerald-500/40 text-emerald-300 inline-flex items-center gap-2 hover:scale-105 hover:border-emerald-400/60 cursor-default shadow-lg shadow-emerald-500/10" style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)' }}>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>Live Streaming</span>
          </span>

          <span className="px-3 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/40 text-purple-300 inline-flex items-center gap-2 hover:scale-105 hover:border-purple-400/60 cursor-default shadow-lg shadow-purple-500/10" style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)' }}>
            <span style={{ fontSize: 'var(--text-sm)' }}>🦄</span>
            <span>Unicorn Detection</span>
          </span>

          <span className="px-3 py-2 bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 border border-cyan-500/40 text-cyan-300 inline-flex items-center gap-2 hover:scale-105 hover:border-cyan-400/60 cursor-default shadow-lg shadow-cyan-500/10" style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)' }}>
            <span style={{ fontSize: 'var(--text-sm)' }}>🤖</span>
            <span>12 AI Features</span>
          </span>

          <span className="px-3 py-2 bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 border border-indigo-500/40 text-indigo-300 inline-flex items-center gap-2 hover:scale-105 hover:border-indigo-400/60 cursor-default shadow-lg shadow-indigo-500/10" style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)' }}>
            <span style={{ fontSize: 'var(--text-sm)' }}>🛡️</span>
            <span>Risk Managed</span>
          </span>

          <span className="px-3 py-2 bg-gradient-to-r from-rose-600/20 to-rose-500/10 border border-rose-500/40 text-rose-300 inline-flex items-center gap-2 hover:scale-105 hover:border-rose-400/60 cursor-default shadow-lg shadow-rose-500/10" style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)' }}>
            <span style={{ fontSize: 'var(--text-sm)' }}>📱</span>
            <span>PWA Ready</span>
          </span>
        </div>
      </div>
    </header>
  )
}
