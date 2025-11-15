/**
 * SkeletonLoader - Premium loading placeholders
 *
 * Reusable skeleton components for data-heavy sections
 * with elite shimmer animations
 */

export function SkeletonText({ className = '', small = false, large = false }) {
  const sizeClass = large ? 'skeleton-text-lg' : small ? 'skeleton-text-sm' : 'skeleton-text'
  return <div className={`skeleton-loader ${sizeClass} ${className}`} />
}

export function SkeletonCircle({ className = '' }) {
  return <div className={`skeleton-loader skeleton-circle ${className}`} />
}

export function SkeletonButton({ className = '' }) {
  return <div className={`skeleton-loader skeleton-button ${className}`} />
}

export function SkeletonCard({ className = '' }) {
  return <div className={`skeleton-loader skeleton-card ${className}`} />
}

/**
 * Skeleton for scanner results (2 columns of items)
 */
export function SkeletonScannerResults() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in">
      {/* Left column - Longs */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-1 rounded-full skeleton-loader" />
          <SkeletonText className="w-32" small />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <SkeletonText className="w-16" />
                <SkeletonText className="w-12" small />
              </div>
              <SkeletonButton className="w-20 h-9" />
            </div>
          </div>
        ))}
      </div>

      {/* Right column - Shorts */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-1 rounded-full skeleton-loader" />
          <SkeletonText className="w-32" small />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <SkeletonText className="w-16" />
                <SkeletonText className="w-12" small />
              </div>
              <SkeletonButton className="w-20 h-9" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for AI chat messages
 */
export function SkeletonChatMessage({ isUser = false }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} fade-in`}>
      <div className={`max-w-[80%] rounded-2xl p-4 ${
        isUser
          ? 'bg-gradient-to-r from-indigo-600/30 to-indigo-500/20 border border-indigo-500/40'
          : 'bg-slate-800/50 border border-slate-700/50'
      }`}>
        <SkeletonText />
        <SkeletonText className="w-3/4" />
        <SkeletonText className="w-1/2" small />
      </div>
    </div>
  )
}

/**
 * Skeleton for backtest results
 */
export function SkeletonBacktestResults() {
  return (
    <div className="space-y-4 fade-in">
      <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <SkeletonText large className="w-48 mb-4" />
        <div className="space-y-2">
          <SkeletonText className="w-full" />
          <SkeletonText className="w-5/6" />
          <SkeletonText className="w-4/6" />
          <SkeletonText className="w-3/6" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

/**
 * Skeleton for data table rows
 */
export function SkeletonTableRow({ columns = 4 }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-slate-800/20 rounded-lg border border-slate-700/30">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonText key={i} className="flex-1" small />
      ))}
    </div>
  )
}

/**
 * Skeleton for stats grid
 */
export function SkeletonStatsGrid({ items = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-in">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <SkeletonText small className="w-20 mb-2" />
          <SkeletonText large className="w-16" />
        </div>
      ))}
    </div>
  )
}
