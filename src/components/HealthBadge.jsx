import React, { useEffect, useState } from 'react'

export default function HealthBadge() {
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/health')
        const json = await r.json()
        if (mounted) setState({ loading: false, ok: true, data: json })
      } catch (e) {
        if (mounted) setState({ loading: false, ok: false, error: String(e) })
      }
    })()
    return () => { mounted = false }
  }, [])

  if (state.loading) return <span className="text-xs text-slate-400">Health: …</span>
  if (!state.ok) return <span className="text-xs text-rose-400">Health: error</span>
  const d = state.data || {}
  const live = d.api?.hasKeys && d.api?.alpacaAccount
  return (
    <span className="text-xs">
      <span className={live ? 'text-emerald-400' : 'text-amber-400'}>
        ● {live ? 'Live' : 'Sample'}
      </span>
      <span className="text-slate-500"> · </span>
      <span className="text-slate-300">{d.env || 'env'}</span>
      {d.commit ? <span className="text-slate-500"> · <span className="text-slate-400">{d.commit}</span></span> : null}
    </span>
  )
}

