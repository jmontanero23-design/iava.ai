import React from 'react'

export default function SignalFeed({ items = [], onSelect }) {
  if (!items.length) return null
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-200">Signal Timeline</h3>
        <span className="text-xs text-slate-500">last {items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.time} className="flex items-start gap-3 cursor-pointer hover:bg-slate-900/40 rounded p-1" onClick={() => onSelect?.(item)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(item) }}>
            <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: item.score >= 70 ? '#22d3ee' : item.score >= 40 ? '#f97316' : '#64748b' }} />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-slate-500">{item.timeLabel}</div>
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-slate-100">{item.score}</div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-800">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
