import React from 'react'

const SYMBOLS = ['AAPL','SPY','NVDA','MSFT','TSLA']
const TFS = ['1Min','5Min','15Min','1Hour','1Day']

export default function Presets({ symbol, setSymbol, timeframe, setTimeframe, onLoad }) {
  return (
    <div className="flex flex-wrap gap-2 items-center text-sm">
      <div className="flex items-center gap-1">
        <span className="text-slate-400">Symbols:</span>
        {SYMBOLS.map(s => (
          <button key={s} onClick={() => { setSymbol(s); onLoad?.(s, timeframe) }} className={`px-2 py-1 rounded border ${symbol===s? 'bg-slate-800 border-slate-600' : 'border-slate-800 hover:border-slate-700'}`}>{s}</button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-slate-400">Timeframes:</span>
        {TFS.map(tf => (
          <button key={tf} onClick={() => { setTimeframe(tf); onLoad?.(symbol, tf) }} className={`px-2 py-1 rounded border ${timeframe===tf? 'bg-slate-800 border-slate-600' : 'border-slate-800 hover:border-slate-700'}`}>{tf}</button>
        ))}
      </div>
    </div>
  )
}

