import React from 'react'

const SYMBOLS = ['AAPL', 'SPY', 'NVDA', 'MSFT', 'TSLA']
const TFS = ['1Min', '5Min', '15Min', '1Hour', '1Day']

export default function Presets({ symbol, setSymbol, timeframe, setTimeframe, onLoad }) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold">Symbols:</span>
        <div className="flex gap-1">
          {SYMBOLS.map(s => (
            <button
              key={s}
              onClick={() => {
                setSymbol(s)
                onLoad?.(s, timeframe)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                symbol === s
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold">Timeframes:</span>
        <div className="flex gap-1">
          {TFS.map(tf => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf)
                onLoad?.(symbol, tf)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
