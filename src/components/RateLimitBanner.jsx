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
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-md border border-amber-600/50 bg-amber-900/30 text-amber-200 text-sm shadow">
      Rate limited by data provider · retry in {secs}s
    </div>
  )
}

