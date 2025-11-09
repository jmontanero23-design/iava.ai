import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function CandleChart({ bars = [], overlays = {} }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const overlaySeriesRef = useRef(new Set())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const chart = createChart(container, {
      layout: { background: { type: 'solid', color: '#0b1020' }, textColor: '#cbd5e1' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      crosshair: { mode: 0 },
      width: container.clientWidth,
      height: container.clientHeight,
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155' },
    })
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981', downColor: '#ef4444', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444',
    })
    chartRef.current = chart
    seriesRef.current = candleSeries

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      overlaySeriesRef.current = new Set()
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current) return
    // Convert bars to chart format
    const data = bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close }))
    seriesRef.current.setData(data)
    if (chartRef.current) chartRef.current.timeScale().fitContent()
  }, [bars])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    try {
      // Remove any previously created overlay series
      if (overlaySeriesRef.current && overlaySeriesRef.current.size) {
        for (const s of overlaySeriesRef.current) {
          if (s && typeof s.setData === 'function') {
            try { chart.removeSeries(s) } catch (_) {}
          }
        }
        overlaySeriesRef.current.clear()
      }

    if (overlays.emaCloud) {
      const upper = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1 })
      const lower = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1 })
      const { fast, slow } = overlays.emaCloud
      const dataUpper = bars.map((b, i) => fast[i] == null ? null : { time: b.time, value: fast[i] }).filter(Boolean)
      const dataLower = bars.map((b, i) => slow[i] == null ? null : { time: b.time, value: slow[i] }).filter(Boolean)
      upper.setData(dataUpper)
      lower.setData(dataLower)
      overlaySeriesRef.current.add(upper)
      overlaySeriesRef.current.add(lower)
    }

    if (overlays.ichimoku) {
      const t = chart.addLineSeries({ color: '#93c5fd', lineWidth: 1 })
      const k = chart.addLineSeries({ color: '#60a5fa', lineWidth: 1 })
      const a = chart.addLineSeries({ color: '#34d399', lineWidth: 1 })
      const b = chart.addLineSeries({ color: '#ef4444', lineWidth: 1 })
      const c = chart.addLineSeries({ color: '#a78bfa', lineWidth: 1 })
      const tenk = bars.map((bar, i) => overlays.ichimoku.tenkan[i] == null ? null : { time: bar.time, value: overlays.ichimoku.tenkan[i] }).filter(Boolean)
      const kij = bars.map((bar, i) => overlays.ichimoku.kijun[i] == null ? null : { time: bar.time, value: overlays.ichimoku.kijun[i] }).filter(Boolean)
      // spanA/spanB arrays are shifted forward; align with extended timeline where present
      const lastIdx = Math.max(0, bars.length - 1)
      const lastTime = bars.length ? bars[lastIdx].time : undefined
      const prevTime = bars.length > 1 ? bars[lastIdx - 1].time : undefined
      const step = lastTime != null && prevTime != null ? (lastTime - prevTime) : 60
      const aData = overlays.ichimoku.spanA.map((v, i) => {
        if (v == null) return null
        const tCandidate = bars[i] ? bars[i].time : (lastTime != null ? lastTime + (i - lastIdx) * step : undefined)
        if (tCandidate == null) return null
        return { time: tCandidate, value: v }
      }).filter(Boolean)
      const bData = overlays.ichimoku.spanB.map((v, i) => {
        if (v == null) return null
        const tCandidate = bars[i] ? bars[i].time : (lastTime != null ? lastTime + (i - lastIdx) * step : undefined)
        if (tCandidate == null) return null
        return { time: tCandidate, value: v }
      }).filter(Boolean)
      const chik = bars.map((bar, i) => overlays.ichimoku.chikou[i] == null ? null : { time: bar.time, value: overlays.ichimoku.chikou[i] }).filter(Boolean)
      t.setData(tenk)
      k.setData(kij)
      a.setData(aData)
      b.setData(bData)
      c.setData(chik)
      overlaySeriesRef.current.add(t)
      overlaySeriesRef.current.add(k)
      overlaySeriesRef.current.add(a)
      overlaySeriesRef.current.add(b)
      overlaySeriesRef.current.add(c)
    }

    if (overlays.saty) {
      const { pivot, levels } = overlays.saty
      const t0 = bars.length ? bars[0].time : undefined
      const t1 = bars.length ? bars[bars.length - 1].time : undefined
      const makeHLine = (value, color, lineWidth = 1, style = 0) => {
        const s = chart.addLineSeries({ color, lineWidth, lineStyle: style })
        const data = []
        if (t0 != null && t1 != null && value != null) {
          data.push({ time: t0, value })
          data.push({ time: t1, value })
        }
        s.setData(data)
        return s
      }
      overlaySeriesRef.current.add(makeHLine(pivot, '#e5e7eb', 2))
      overlaySeriesRef.current.add(makeHLine(levels.t0236.up, '#94a3b8'))
      overlaySeriesRef.current.add(makeHLine(levels.t0236.dn, '#94a3b8'))
      overlaySeriesRef.current.add(makeHLine(levels.t0618.up, '#38bdf8'))
      overlaySeriesRef.current.add(makeHLine(levels.t0618.dn, '#38bdf8'))
      overlaySeriesRef.current.add(makeHLine(levels.t1000.up, '#14b8a6'))
      overlaySeriesRef.current.add(makeHLine(levels.t1000.dn, '#14b8a6'))
      overlaySeriesRef.current.add(makeHLine(levels.t1236.up, '#f59e0b'))
      overlaySeriesRef.current.add(makeHLine(levels.t1236.dn, '#f59e0b'))
      overlaySeriesRef.current.add(makeHLine(levels.t1618.up, '#a78bfa'))
      overlaySeriesRef.current.add(makeHLine(levels.t1618.dn, '#a78bfa'))
    }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Overlay render error:', e)
    }
  }, [overlays, bars])

  return (
    <div className="card w-full h-[520px] overflow-hidden relative">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
