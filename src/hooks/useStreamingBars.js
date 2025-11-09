import { useEffect, useRef } from 'react'

export default function useStreamingBars({ symbol, timeframe, enabled, onBar }) {
  const eventRef = useRef(null)
  useEffect(() => {
    if (!enabled || !symbol || !timeframe) return
    const src = new EventSource(`/api/stream/bars?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`)
    eventRef.current = src
    src.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload?.bar) onBar?.(payload.bar)
      } catch (_) {
        // ignore
      }
    }
    src.onerror = () => {
      src.close()
      eventRef.current = null
    }
    return () => {
      src.close()
      eventRef.current = null
    }
  }, [enabled, symbol, timeframe, onBar])
}

