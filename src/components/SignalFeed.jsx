import React from 'react'

export default function SignalFeed({ items = [], onSelect }) {
  if (!items.length) return null
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="logo-badge">
          <img src="/logo.svg" alt="iAVA.ai" className="w-5 h-5" />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
            Signal Timeline
          </h3>
          <p className="text-xs text-slate-400">Last {items.length} signals</p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map(item => {
          const scoreColor = item.score >= 70 ? 'text-cyan-400' : item.score >= 40 ? 'text-amber-400' : 'text-slate-400'
          const dotColor = item.score >= 70 ? '#22d3ee' : item.score >= 40 ? '#f97316' : '#64748b'
          return (
            <div
              key={item.time}
              className="tile p-3 cursor-pointer hover:bg-slate-800/60 transition-colors"
              onClick={() => onSelect?.(item)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter') onSelect?.(item)
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1 shadow-sm"
                  style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}80` }}
                />
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
                    {item.timeLabel}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`text-2xl font-bold ${scoreColor}`}>{item.score}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/60 border border-slate-700/60 text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
