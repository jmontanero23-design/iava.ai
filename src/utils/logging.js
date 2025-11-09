export function initClientLogging() {
  const send = (body) => {
    try {
      navigator.sendBeacon?.('/api/log', new Blob([JSON.stringify(body)], { type: 'application/json' }))
    } catch (_) {
      // fallback
      fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {})
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
      send({ level: 'error', message: e?.message, stack: e?.error?.stack, src: 'onerror' })
    })
    window.addEventListener('unhandledrejection', (e) => {
      send({ level: 'error', message: String(e?.reason), stack: e?.reason?.stack, src: 'unhandledrejection' })
    })
  }
}

