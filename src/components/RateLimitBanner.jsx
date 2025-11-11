import React, { useEffect, useState } from 'react'

export default function RateLimitBanner({ until = 0 }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!until || until <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [until])
  if (!until || until <= now) return null
  const secs = Math.max(0, Math.ceil((until - now) / 1000))
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-900/40 to-orange-900/40 backdrop-blur-sm shadow-xl">
      <div className="flex items-center gap-2">
        <span className="text-lg">⏳</span>
        <span className="text-sm font-medium text-amber-200">
          Rate limited by data provider · retry in <span className="font-bold">{secs}s</span>
        </span>
      </div>
    </div>
  )
}
