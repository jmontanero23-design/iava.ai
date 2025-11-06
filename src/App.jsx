import React, { useMemo, useState } from 'react'
import Hero from './components/Hero.jsx'
import CandleChart from './components/chart/CandleChart.jsx'
import { emaCloud, ichimoku } from './utils/indicators.js'

function generateSampleOHLC(n = 200, start = Math.floor(Date.now()/1000) - n*3600, step = 3600) {
  const out = []
  let price = 100
  for (let i = 0; i < n; i++) {
    const time = start + i * step
    const drift = (Math.random() - 0.5) * 1.5
    const open = price
    const close = Math.max(1, open + drift)
    const high = Math.max(open, close) + Math.random() * 1.2
    const low = Math.min(open, close) - Math.random() * 1.2
    const volume = 100 + Math.round(Math.random() * 50)
    out.push({ time, open, high, low, close, volume })
    price = close
  }
  return out
}

export default function App() {
  const [bars] = useState(() => generateSampleOHLC())
  const [showEma, setShowEma] = useState(true)
  const [showIchi, setShowIchi] = useState(true)

  const overlays = useMemo(() => {
    const close = bars.map(b => b.close)
    const base = {}
    if (showEma) base.emaCloud = emaCloud(close, 8, 21)
    if (showIchi) base.ichimoku = ichimoku(bars)
    return base
  }, [bars, showEma, showIchi])

  return (
    <div className="min-h-screen p-6 space-y-6">
      <Hero />
      <div className="card p-4 flex items-center gap-4">
        <span className="text-sm text-slate-400">Overlays</span>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-indigo-500" checked={showEma} onChange={e => setShowEma(e.target.checked)} />
          <span>EMA Cloud (8/21)</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="accent-indigo-500" checked={showIchi} onChange={e => setShowIchi(e.target.checked)} />
          <span>Ichimoku</span>
        </label>
      </div>
      <CandleChart bars={bars} overlays={overlays} />
      <section className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Project Structure</h2>
        <ul className="list-disc pl-6 text-slate-300">
          <li><code>src/components</code> – UI and frontend components</li>
          <li><code>src/services</code> – API and backend-facing logic</li>
          <li><code>src/utils</code> – Utilities and shared helpers</li>
        </ul>
      </section>
    </div>
  )
}
