import React, { useState } from 'react'
import InfoPopover from './InfoPopover.jsx'

export default function ScannerPanel({ onLoadSymbol, defaultTimeframe = '5Min' }) {
  const [symbols, setSymbols] = useState('SPY,QQQ,AAPL,MSFT,NVDA,TSLA,AMZN,META,GOOGL,NFLX')
  const [timeframe, setTimeframe] = useState(defaultTimeframe)
  const [threshold, setThreshold] = useState(70)
  const [top, setTop] = useState(10)
  const [enforceDaily, setEnforceDaily] = useState(true)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [res, setRes] = useState(null)

  async function run() {
    try {
      setLoading(true); setErr('')
      const qs = new URLSearchParams({ symbols, timeframe, threshold: String(threshold), top: String(top), enforceDaily: enforceDaily ? '1' : '0' })
      const r = await fetch(`/api/scan?${qs.toString()}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
      setRes(j)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  const Section = ({ title, items }) => (
    <div>
      <div className="text-xs text-slate-400 mb-1">{title}</div>
      <div className="space-y-1 max-h-64 overflow-auto pr-1">
        {!items?.length && <div className="text-xs text-slate-500">No results</div>}
        {items?.map(it => (
          <div key={it.symbol} className="border border-slate-800 rounded px-2 py-1 flex items-center justify-between">
            <div className="text-slate-200">{it.symbol} <span className="text-slate-500 text-xs">{Math.round(it.score)}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => onLoadSymbol?.(it.symbol, timeframe)} className="text-xs bg-slate-800 hover:bg-slate-700 rounded px-2 py-0.5 border border-slate-700">Load</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">Market Scanner <InfoPopover title="Scanner">Scans a symbol list and surfaces the highest Unicorn Scores for longs/shorts, optional daily confluence.</InfoPopover></h3>
        <div className="flex items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-2">TF
            <select value={timeframe} onChange={e=>setTimeframe(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
              <option value="1Min">1Min</option>
              <option value="5Min">5Min</option>
              <option value="15Min">15Min</option>
              <option value="1Hour">1Hour</option>
              <option value="1Day">1Day</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2">Threshold
            <input type="number" min={0} max={100} value={threshold} onChange={e=>setThreshold(parseInt(e.target.value,10)||0)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-16" />
          </label>
          <label className="inline-flex items-center gap-2">Top
            <input type="number" min={1} max={50} value={top} onChange={e=>setTop(Math.max(1,parseInt(e.target.value,10)||10))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-16" />
          </label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={enforceDaily} onChange={e=>setEnforceDaily(e.target.checked)} />Daily</label>
          <button onClick={run} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-xs rounded px-2 py-1 border border-slate-700">{loading ? 'Scanning…' : 'Scan'}</button>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-400">Symbols</div>
      <textarea value={symbols} onChange={e=>setSymbols(e.target.value)} className="mt-1 w-full h-16 bg-slate-800 border border-slate-700 rounded p-2 text-sm" />
      {err && <div className="text-xs text-rose-400 mt-2">{err}</div>}
      {res && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title={`Top Longs (${res.longs?.length || 0})`} items={res.longs} />
          <Section title={`Top Shorts (${res.shorts?.length || 0})`} items={res.shorts} />
        </div>
      )}
    </div>
  )
}

