import React from 'react'

export default function SignalFeed({ items = [], onSelect }) {
  if (!items.length) return null

  return (
    <div className="card overflow-hidden">
      {/* Premium Header */}
      <div className="p-4 bg-slate-800/30 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📡</span>
            <h3 className="text-sm font-bold text-emerald-300">Signal Timeline</h3>
          </div>
          <span className="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            {items.length} signal{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Premium Signal List */}
      <div className="p-4 space-y-3">
        {items.map((item) => {
          // Determine score color theme
          const isHigh = item.score >= 70
          const isMed = item.score >= 40
          const dotColor = isHigh ? '#10b981' : isMed ? '#f59e0b' : '#64748b'
          const glowColor = isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-slate-500'
          const borderColor = isHigh ? 'border-emerald-500/30' : isMed ? 'border-amber-500/30' : 'border-slate-600/30'
          const textColor = isHigh ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-slate-400'

          return (
            <div
              key={item.time}
              className="relative group cursor-pointer"
              onClick={() => onSelect?.(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(item) }}
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 ${glowColor} blur-xl opacity-0 group-hover:opacity-5 rounded-lg transition-opacity`} />

              {/* Content */}
              <div className={`relative flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border ${borderColor} hover:border-opacity-60 transition-all`}>
                {/* Premium Indicator Dot */}
                <div className="relative mt-2">
                  <div className={`absolute inset-0 ${glowColor} blur-md opacity-40`} />
                  <div
                    className="relative w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                </div>

                {/* Signal Details */}
                <div className="flex-1 min-w-0">
                  {/* Time Label */}
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    {item.timeLabel}
                  </div>

                  {/* Score & Tags Row */}
                  <div className="flex items-center gap-3">
                    {/* Premium Score Badge */}
                    <div className={`px-2 py-1 rounded-md border ${borderColor} ${glowColor}/10`}>
                      <div className={`text-lg font-bold ${textColor}`}>
                        {item.score}
                      </div>
                    </div>

                    {/* Premium Tags */}
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/50 text-slate-300 font-medium hover:bg-slate-600/50 hover:border-slate-500/50 transition-all"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hover Arrow Indicator */}
                <div className="text-slate-600 group-hover:text-emerald-500 transition-colors mt-2">
                  <span className="text-sm">→</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
