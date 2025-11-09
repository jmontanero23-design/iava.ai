import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function CandleChart({ bars = [], overlays = {}, markers = [] }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const overlaySeriesRef = useRef({})

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
      overlaySeriesRef.current = {}
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current) return
    // Convert bars to chart format
    const data = bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close }))
    seriesRef.current.setData(data)
    if (chartRef.current) chartRef.current.timeScale().fitContent()
    // Markers (e.g., EMA crosses)
    if (Array.isArray(markers)) {
      try { seriesRef.current.setMarkers(markers) } catch (_) {}
    }
  }, [bars])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    // Ensure containers for series
    const ref = overlaySeriesRef.current
    ref.ema = ref.ema || { clouds: {} }
    ref.ichi = ref.ichi || {}
    ref.saty = ref.saty || {}

    // EMA Clouds (multiple pairs)
    const clouds = ref.ema.clouds
    // Hide all existing clouds by default
    Object.keys(clouds).forEach(k => {
      const pair = clouds[k]
      pair.upper.setData([])
      pair.lower.setData([])
    })
    if (Array.isArray(overlays.emaClouds)) {
      overlays.emaClouds.forEach(cloud => {
        const key = cloud.key || 'x'
        if (!clouds[key]) {
          clouds[key] = {
            upper: chart.addLineSeries({ color: cloud.color || '#f59e0b', lineWidth: 1 }),
            lower: chart.addLineSeries({ color: cloud.color || '#f59e0b', lineWidth: 1 })
          }
        }
        const up = bars.map((b, i) => cloud.fast[i] == null ? null : { time: b.time, value: cloud.fast[i] }).filter(Boolean)
        const dn = bars.map((b, i) => cloud.slow[i] == null ? null : { time: b.time, value: cloud.slow[i] }).filter(Boolean)
        clouds[key].upper.setData(up)
        clouds[key].lower.setData(dn)
      })
    }

    // Ichimoku
    if (!ref.ichi.t) ref.ichi.t = chart.addLineSeries({ color: '#93c5fd', lineWidth: 1 })
    if (!ref.ichi.k) ref.ichi.k = chart.addLineSeries({ color: '#60a5fa', lineWidth: 1 })
    if (!ref.ichi.a) ref.ichi.a = chart.addLineSeries({ color: '#34d399', lineWidth: 1 })
    if (!ref.ichi.b) ref.ichi.b = chart.addLineSeries({ color: '#ef4444', lineWidth: 1 })
    if (!ref.ichi.c) ref.ichi.c = chart.addLineSeries({ color: '#a78bfa', lineWidth: 1 })
    if (overlays.ichimoku) {
      const tenk = bars.map((bar, i) => overlays.ichimoku.tenkan[i] == null ? null : { time: bar.time, value: overlays.ichimoku.tenkan[i] }).filter(Boolean)
      const kij = bars.map((bar, i) => overlays.ichimoku.kijun[i] == null ? null : { time: bar.time, value: overlays.ichimoku.kijun[i] }).filter(Boolean)
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
      ref.ichi.t.setData(tenk)
      ref.ichi.k.setData(kij)
      ref.ichi.a.setData(aData)
      ref.ichi.b.setData(bData)
      ref.ichi.c.setData(chik)
    } else {
      ref.ichi.t.setData([])
      ref.ichi.k.setData([])
      ref.ichi.a.setData([])
      ref.ichi.b.setData([])
      ref.ichi.c.setData([])
    }

    // SATY ATR
    if (!ref.saty.pivot) ref.saty.pivot = chart.addLineSeries({ color: '#e5e7eb', lineWidth: 2 })
    const mk = (key, color) => {
      if (!ref.saty[key]) ref.saty[key] = chart.addLineSeries({ color, lineWidth: 1 })
      return ref.saty[key]
    }
    const t0 = bars.length ? bars[0].time : undefined
    const t1 = bars.length ? bars[bars.length - 1].time : undefined
    const hline = (value) => (t0 != null && t1 != null && value != null) ? [{ time: t0, value }, { time: t1, value }] : []
    if (overlays.saty && overlays.saty.levels) {
      const { pivot, levels } = overlays.saty
      ref.saty.pivot.setData(hline(pivot))
      mk('t0236u', '#94a3b8').setData(hline(levels.t0236.up))
      mk('t0236d', '#94a3b8').setData(hline(levels.t0236.dn))
      mk('t0618u', '#38bdf8').setData(hline(levels.t0618.up))
      mk('t0618d', '#38bdf8').setData(hline(levels.t0618.dn))
      mk('t1000u', '#14b8a6').setData(hline(levels.t1000.up))
      mk('t1000d', '#14b8a6').setData(hline(levels.t1000.dn))
      mk('t1236u', '#f59e0b').setData(hline(levels.t1236.up))
      mk('t1236d', '#f59e0b').setData(hline(levels.t1236.dn))
      mk('t1618u', '#a78bfa').setData(hline(levels.t1618.up))
      mk('t1618d', '#a78bfa').setData(hline(levels.t1618.dn))
    } else {
      ref.saty.pivot.setData([])
      ;['t0236u','t0236d','t0618u','t0618d','t1000u','t1000d','t1236u','t1236d','t1618u','t1618d'].forEach(k => {
        if (ref.saty[k]) ref.saty[k].setData([])
      })
    }
  }, [overlays, bars])

  return (
    <div className="card w-full h-[520px] overflow-hidden relative">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
