import React from 'react'

export default function Hero() {
  return (
    <header className="glass-panel p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-indigo-600 via-sky-500 to-transparent blur-3xl" />
      <div className="relative">
        <p className="uppercase tracking-[0.3em] text-xs text-slate-300/70 mb-3">AI SIGNAL FLIGHT DECK</p>
        <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-indigo-200 via-sky-200 to-cyan-200 bg-clip-text text-transparent">
          iAVA.ai · Intelligent Alpha Velocity Assistant
        </h1>
        <p className="text-slate-300 mt-3 max-w-3xl">
          Confluence-grade trading intelligence blending SATY ATR levels, Ripster clouds,
          Ichimoku context, and TTM volatility workflows—automated through Alpaca + n8n pipelines.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-300">
          <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700">Streaming Ready</span>
          <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700">Unicorn Score Engine</span>
          <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700">Alpaca Guardrails</span>
        </div>
      </div>
    </header>
  )
}
