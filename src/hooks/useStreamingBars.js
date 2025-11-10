import { useEffect, useRef } from 'react'

export default function useStreamingBars({ symbol, timeframe, enabled, onBar, retryMsBase = 2000, maxRetries = 10 }) {
  const eventRef = useRef(null)
  const timerRef = useRef(null)
  const triesRef = useRef(0)

  useEffect(() => {
    if (!enabled || !symbol || !timeframe) return

    const connect = () => {
      try {
        const src = new EventSource(`/api/stream/bars?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`)
        eventRef.current = src
        src.onmessage = (event) => {
          triesRef.current = 0
          try {
            const payload = JSON.parse(event.data)
            if (payload?.bar) onBar?.(payload.bar)
          } catch (_) {}
        }
        src.onerror = () => {
          try { src.close() } catch {}
          eventRef.current = null
          if (triesRef.current < maxRetries) {
            const delay = Math.min(15000, retryMsBase * Math.pow(2, triesRef.current))
            triesRef.current += 1
            timerRef.current = setTimeout(connect, delay)
          }
        }
      } catch (_) {
        if (triesRef.current < maxRetries) {
          const delay = Math.min(15000, retryMsBase * Math.pow(2, triesRef.current))
          triesRef.current += 1
          timerRef.current = setTimeout(connect, delay)
        }
      }
    }

    connect()

    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      if (eventRef.current) { try { eventRef.current.close() } catch {} ; eventRef.current = null }
      triesRef.current = 0
    }
  }, [enabled, symbol, timeframe, onBar, retryMsBase, maxRetries])
}
