import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function CandleChart({ bars = [], overlays = {}, markers = [], loading = false, focusTime = null, overlayToggles = null, presetLabel = '' }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const overlaySeriesRef = useRef({})
  const volumeSeriesRef = useRef(null)
  const tooltipRef = useRef(null)
  const bandsRef = useRef(null)
  const priceLinesRef = useRef({ saty: {} })
  const cloudCanvasRef = useRef(null)
  const cloudUnsubRef = useRef(null)
  const dockRef = useRef(null)
  const lastFocusRef = useRef(null)
  const squeezeCanvasRef = useRef(null)

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
    const volSeries = chart.addHistogramSeries({
      color: '#64748b',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      baseLineVisible: false,
      overlay: true,
    })
    chartRef.current = chart
    seriesRef.current = candleSeries
    volumeSeriesRef.current = volSeries
    // Create SATY bands overlay container
    let bands = bandsRef.current
    if (!bands) {
      bands = document.createElement('div')
      bands.style.position = 'absolute'
      bands.style.left = '0'
      bands.style.top = '0'
      bands.style.right = '0'
      bands.style.bottom = '0'
      bands.style.pointerEvents = 'none'
      bandsRef.current = bands
      container.appendChild(bands)
    }
    // Ichimoku cloud canvas
    if (!cloudCanvasRef.current) {
      const c = document.createElement('canvas')
      c.style.position = 'absolute'
      c.style.left = '0'
      c.style.top = '0'
      c.style.right = '0'
      c.style.bottom = '0'
      c.style.pointerEvents = 'none'
      cloudCanvasRef.current = c
      container.appendChild(c)
    }

    // Floating info dock (bottom-left)
    if (!dockRef.current) {
      const d = document.createElement('div')
      d.style.position = 'absolute'
      d.style.left = '8px'
      d.style.bottom = '8px'
      d.style.pointerEvents = 'none'
      d.style.background = 'rgba(2,6,23,0.7)'
      d.style.border = '1px solid rgba(51,65,85,0.8)'
      d.style.borderRadius = '8px'
      d.style.padding = '6px 8px'
      d.style.fontSize = '12px'
      d.style.fontWeight = '500'
      d.style.letterSpacing = '0.2px'
      d.style.color = '#e2e8f0'
      d.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)'
      dockRef.current = d
      container.appendChild(d)
    }

    // Squeeze shading canvas (vertical bands)
    if (!squeezeCanvasRef.current) {
      const c2 = document.createElement('canvas')
      c2.style.position = 'absolute'
      c2.style.left = '0'
      c2.style.top = '0'
      c2.style.right = '0'
      c2.style.bottom = '0'
      c2.style.pointerEvents = 'none'
      squeezeCanvasRef.current = c2
      container.appendChild(c2)
    }

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      volumeSeriesRef.current = null
      overlaySeriesRef.current = {}
      priceLinesRef.current = { saty: {} }
      const el = bandsRef.current
      if (el && el.parentNode) el.parentNode.removeChild(el)
      bandsRef.current = null
      const cc = cloudCanvasRef.current
      if (cc && cc.parentNode) cc.parentNode.removeChild(cc)
      cloudCanvasRef.current = null
      const sc = squeezeCanvasRef.current
      if (sc && sc.parentNode) sc.parentNode.removeChild(sc)
      squeezeCanvasRef.current = null
      const dk = dockRef.current
      if (dk && dk.parentNode) dk.parentNode.removeChild(dk)
      dockRef.current = null
      if (cloudUnsubRef.current && chart.timeScale) {
        try { chart.timeScale().unsubscribeVisibleTimeRangeChange(cloudUnsubRef.current) } catch(_) {}
      }
      cloudUnsubRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current) return
    // Convert bars to chart format
    const data = bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close }))
    seriesRef.current.setData(data)
    // Volume histogram (color by up/down)
    if (volumeSeriesRef.current) {
      const v = bars.map(b => ({ time: b.time, value: b.volume, color: (b.close >= b.open) ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)' }))
      volumeSeriesRef.current.setData(v)
    }
    if (chartRef.current) chartRef.current.timeScale().fitContent()
    // Markers (e.g., EMA crosses)
    if (Array.isArray(markers)) {
      try { seriesRef.current.setMarkers(markers) } catch (_) {}
    }
  }, [bars])

  // Crosshair tooltip
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    let tooltip = tooltipRef.current
    if (!tooltip) {
      tooltip = document.createElement('div')
      tooltip.className = 'pointer-events-none absolute bg-slate-900/90 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 shadow'
      tooltip.style.transform = 'translate(8px, -24px)'
      tooltip.style.display = 'none'
      tooltipRef.current = tooltip
      const el = containerRef.current
      if (el) el.appendChild(tooltip)
    }
    const onMove = (param) => {
      if (!param || !param.point || !param.time) {
        tooltip.style.display = 'none'
        return
      }
      const { x, y } = param.point
      const t = param.time
      const bar = bars.find(b => b.time === t)
      if (!bar) { tooltip.style.display = 'none'; return }
      tooltip.innerHTML = `O ${bar.open.toFixed(2)} H ${bar.high.toFixed(2)} L ${bar.low.toFixed(2)} C ${bar.close.toFixed(2)} V ${bar.volume}`
      tooltip.style.left = `${x}px`
      tooltip.style.top = `${y}px`
      tooltip.style.display = 'block'
    }
    chart.subscribeCrosshairMove(onMove)
    return () => { try { chart.unsubscribeCrosshairMove(onMove) } catch (_) {} }
  }, [bars])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    // Ensure containers for series
    const ref = overlaySeriesRef.current
    ref.ema = ref.ema || { clouds: {} }
    ref.ichi = ref.ichi || {}
    ref.saty = ref.saty || {}
    ref.ribbon = ref.ribbon || {}

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

    // Pivot Ribbon (8/21/34)
    if (!ref.ribbon.e8) ref.ribbon.e8 = chart.addLineSeries({ color: '#94a3b8', lineWidth: 1 })
    if (!ref.ribbon.e34) ref.ribbon.e34 = chart.addLineSeries({ color: '#94a3b8', lineWidth: 1 })
    if (!ref.ribbon.e21g) ref.ribbon.e21g = chart.addLineSeries({ color: '#10b981', lineWidth: 2 })
    if (!ref.ribbon.e21r) ref.ribbon.e21r = chart.addLineSeries({ color: '#ef4444', lineWidth: 2 })
    if (overlays.ribbon) {
      const { e8, e21, e34, state } = overlays.ribbon
      const e8data = bars.map((b, i) => e8[i] == null ? null : { time: b.time, value: e8[i] }).filter(Boolean)
      const e34data = bars.map((b, i) => e34[i] == null ? null : { time: b.time, value: e34[i] }).filter(Boolean)
      const g = []
      const r = []
      for (let i = 0; i < bars.length; i++) {
        if (e21[i] == null) continue
        const point = { time: bars[i].time, value: e21[i] }
        if (state[i] === 'bullish') g.push(point)
        else if (state[i] === 'bearish') r.push(point)
      }
      ref.ribbon.e8.setData(e8data)
      ref.ribbon.e34.setData(e34data)
      ref.ribbon.e21g.setData(g)
      ref.ribbon.e21r.setData(r)
    } else {
      ref.ribbon.e8.setData([])
      ref.ribbon.e34.setData([])
      ref.ribbon.e21g.setData([])
      ref.ribbon.e21r.setData([])
    }

    // SATY price lines on candle series for labeled targets
    if (seriesRef.current) {
      const lines = priceLinesRef.current.saty || {}
      const ensure = (key, price, color, title) => {
        if (price == null) return
        if (!lines[key]) {
          lines[key] = seriesRef.current.createPriceLine({ price, color, lineWidth: 1, title, axisLabelVisible: true })
        } else {
          try { lines[key].applyOptions({ price, color, title }) } catch (_) {}
        }
      }
      const removeKeys = (keys) => {
        for (const k of keys) {
          if (lines[k]) {
            try { seriesRef.current.removePriceLine(lines[k]) } catch (_) {}
            delete lines[k]
          }
        }
      }
      if (overlays.saty && overlays.saty.levels) {
        const { pivot, levels } = overlays.saty
        ensure('pivot', pivot, '#e5e7eb', 'Pivot')
        ensure('t0236u', levels.t0236.up, '#94a3b8', '+0.236 ATR')
        ensure('t0236d', levels.t0236.dn, '#94a3b8', '-0.236 ATR')
        ensure('t1000u', levels.t1000.up, '#14b8a6', '+1.0 ATR')
        ensure('t1000d', levels.t1000.dn, '#14b8a6', '-1.0 ATR')
        ensure('t1618u', levels.t1618.up, '#a78bfa', '+1.618 ATR')
        ensure('t1618d', levels.t1618.dn, '#a78bfa', '-1.618 ATR')
      } else {
        removeKeys(Object.keys(lines))
      }
      priceLinesRef.current.saty = lines
    }

    // Squeeze Bands (BB and KC)
    if (!ref.squeeze) ref.squeeze = {}
    if (overlays.squeezeBands) {
      const { upperBB, lowerBB, upperKC, lowerKC } = overlays.squeezeBands
      const mk = (key, opts) => { if (!ref.squeeze[key]) ref.squeeze[key] = chart.addLineSeries(opts); return ref.squeeze[key] }
      const map = (arr) => bars.map((b, i) => (arr[i] == null ? null : { time: b.time, value: arr[i] })).filter(Boolean)
      mk('bbU', { color: 'rgba(148,163,184,0.7)', lineWidth: 1, priceLineVisible: false }).setData(map(upperBB))
      mk('bbL', { color: 'rgba(148,163,184,0.7)', lineWidth: 1, priceLineVisible: false }).setData(map(lowerBB))
      mk('kcU', { color: 'rgba(99,102,241,0.7)', lineWidth: 1, lineStyle: 1, priceLineVisible: false }).setData(map(upperKC))
      mk('kcL', { color: 'rgba(99,102,241,0.7)', lineWidth: 1, lineStyle: 1, priceLineVisible: false }).setData(map(lowerKC))
    } else if (ref.squeeze) {
      ['bbU','bbL','kcU','kcL'].forEach(k => { if (ref.squeeze[k]) ref.squeeze[k].setData([]) })
    }

    // SATY shaded bands (horizontal regions across full width)
    const bandsEl = bandsRef.current
    const s = overlays.saty
    const series = seriesRef.current
    if (bandsEl && s && s.levels && series) {
      const { pivot, levels } = s
      const y = (v) => series.priceToCoordinate(v)
      const make = (key, y1, y2, color) => {
        if (y1 == null || y2 == null) return
        let el = bandsEl.querySelector(`.band-${key}`)
        if (!el) {
          el = document.createElement('div')
          el.className = `band-${key}`
          el.style.position = 'absolute'
          el.style.left = '0'
          el.style.right = '0'
          el.style.pointerEvents = 'none'
          bandsEl.appendChild(el)
        }
        const top = Math.min(y1, y2)
        const height = Math.max(1, Math.abs(y2 - y1))
        el.style.top = `${top}px`
        el.style.height = `${height}px`
        el.style.background = color
      }
      // Trigger bands around pivot
      make('t0236u', y(pivot), y(levels.t0236.up), 'rgba(148,163,184,0.08)')
      make('t0236d', y(levels.t0236.dn), y(pivot), 'rgba(148,163,184,0.08)')
      // ATR bands beyond triggers
      make('t1000u', y(levels.t0236.up), y(levels.t1000.up), 'rgba(20,184,166,0.06)')
      make('t1000d', y(levels.t1000.dn), y(levels.t0236.dn), 'rgba(20,184,166,0.06)')
    } else if (bandsEl) {
      bandsEl.innerHTML = ''
    }

    // Ichimoku cloud shading
    const drawCloud = () => {
      const c = cloudCanvasRef.current
      const sref = seriesRef.current
      const ts = chartRef.current?.timeScale?.()
      const ichi = overlays.ichimoku
      const el = containerRef.current
      if (!c || !sref || !ts || !ichi || !el) return
      c.width = el.clientWidth
      c.height = el.clientHeight
      const ctx = c.getContext('2d')
      ctx.clearRect(0,0,c.width,c.height)
      const A = ichi.spanA || []
      const B = ichi.spanB || []
      let seg = []
      const commit = () => {
        if (seg.length < 2) { seg = []; return }
        const last = seg[seg.length - 1]
        const up = A[last] >= B[last]
        ctx.beginPath()
        let started = false
        for (let idx of seg) {
          const x = ts.timeToCoordinate(bars[idx]?.time)
          const y = sref.priceToCoordinate(A[idx])
          if (x == null || y == null) continue
          if (!started) { ctx.moveTo(x,y); started = true } else { ctx.lineTo(x,y) }
        }
        for (let k = seg.length - 1; k >= 0; k--) {
          const idx = seg[k]
          const x = ts.timeToCoordinate(bars[idx]?.time)
          const y = sref.priceToCoordinate(B[idx])
          if (x == null || y == null) continue
          ctx.lineTo(x,y)
        }
        ctx.closePath()
        ctx.fillStyle = up ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)'
        ctx.fill()
        seg = []
      }
      for (let i = 0; i < bars.length && i < A.length && i < B.length; i++) {
        if (A[i] != null && B[i] != null) seg.push(i)
        else commit()
      }
      commit()
    }
    drawCloud()
    if (cloudUnsubRef.current && chart.timeScale) {
      try { chart.timeScale().unsubscribeVisibleTimeRangeChange(cloudUnsubRef.current) } catch(_) {}
      cloudUnsubRef.current = null
    }
    const handler = () => drawCloud()
    chart.timeScale().subscribeVisibleTimeRangeChange(handler)
    cloudUnsubRef.current = handler

    // Update floating dock content
    try {
      const d = dockRef.current
      if (d) {
        const last = bars[bars.length - 1]
        if (last) {
          const saty = overlays?.saty
          const fmt = (n) => (n == null ? '—' : Number(n).toFixed(2))
          const lines = []
          lines.push(`O ${fmt(last.open)}  H ${fmt(last.high)}  L ${fmt(last.low)}  C ${fmt(last.close)}`)
          if (saty?.atr && saty?.levels) {
            const pivot = saty.pivot
            const up0236 = saty.levels.t0236.up
            const dn0236 = saty.levels.t0236.dn
            const up1000 = saty.levels.t1000.up
            const dn1000 = saty.levels.t1000.dn
            const dist = (t) => (t == null ? null : (t - last.close))
            const abs = (x) => (x == null ? null : Math.abs(x))
            const toAtr = (x) => (x == null || !saty.atr ? null : x / saty.atr)
            const nearestUp = [up0236, up1000].filter(v => v != null && v > last.close).sort((a,b) => a - b)[0]
            const nearestDn = [dn0236, dn1000].filter(v => v != null && v < last.close).sort((a,b) => abs(a-last.close) - abs(b-last.close))[0]
            lines.push(`ATR ${fmt(saty.atr)}  Pivot ${fmt(pivot)}`)
            lines.push(`±0.236 ${fmt(dn0236)} / ${fmt(up0236)}  ±1.0 ${fmt(dn1000)} / ${fmt(up1000)}`)
            if (nearestUp != null) {
              const dpx = dist(nearestUp)
              const datr = toAtr(abs(dpx))
              lines.push(`Next ↑ ${fmt(nearestUp)}  Δ ${fmt(dpx)} (${datr==null?'—':datr.toFixed(2)} ATR)`)
            }
            if (nearestDn != null) {
              const dpx = dist(nearestDn)
              const datr = toAtr(abs(dpx))
              lines.push(`Next ↓ ${fmt(nearestDn)}  Δ ${fmt(dpx)} (${datr==null?'—':datr.toFixed(2)} ATR)`)
            }
          }
          d.innerHTML = `<div style="line-height:1.2">${lines.map(l => `<div>${l}</div>`).join('')}</div>`
        }
      }
    } catch (_) {}
    // Draw Squeeze ON shading (vertical faint stripes)
    try {
      const c2 = squeezeCanvasRef.current
      const sref = seriesRef.current
      const ts = chartRef.current?.timeScale?.()
      const onArr = overlays?.squeezeOn
      const el = containerRef.current
      if (c2 && sref && ts && onArr && el) {
        c2.width = el.clientWidth
        c2.height = el.clientHeight
        const ctx2 = c2.getContext('2d')
        ctx2.clearRect(0,0,c2.width,c2.height)
        // Build segments of consecutive ON bars
        let segStart = -1
        for (let i = 0; i < bars.length; i++) {
          const on = onArr[i] === 1
          if (on && segStart === -1) segStart = i
          if ((!on || i === bars.length - 1) && segStart !== -1) {
            const endIdx = on ? i : i - 1
            const x1 = ts.timeToCoordinate(bars[segStart]?.time)
            const x2 = ts.timeToCoordinate(bars[endIdx]?.time)
            if (x1 != null && x2 != null) {
              const left = Math.min(x1, x2)
              const right = Math.max(x1, x2)
              ctx2.fillStyle = 'rgba(244,63,94,0.06)'
              ctx2.fillRect(left, 0, Math.max(1, right - left), c2.height)
            }
            segStart = -1
          }
        }
      }
    } catch (_) {}
  }, [overlays, bars])

  // Optional focus to a specific time (center visible range around that bar)
  useEffect(() => {
    if (!focusTime || !chartRef.current || !bars?.length) return
    if (lastFocusRef.current === focusTime) return
    lastFocusRef.current = focusTime
    // find nearest index by time
    let idx = bars.findIndex(b => b.time === focusTime)
    if (idx === -1) {
      // nearest by abs diff
      let best = 0, bestDiff = Math.abs(bars[0].time - focusTime)
      for (let i = 1; i < bars.length; i++) {
        const d = Math.abs(bars[i].time - focusTime)
        if (d < bestDiff) { best = i; bestDiff = d }
      }
      idx = best
    }
    const left = Math.max(0, idx - 60)
    const right = Math.min(bars.length - 1, idx + 60)
    try {
      chartRef.current.timeScale().setVisibleRange({ from: bars[left].time, to: bars[right].time })
    } catch (_) {}
  }, [focusTime, bars])

  return (
    <div className="card w-full h-[560px] overflow-hidden relative">
      <div ref={containerRef} className="w-full h-full" />

      {overlayToggles ? (
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-900/70 border border-slate-700 rounded px-2 py-1 text-[11px]" style={{ pointerEvents:'auto' }}>
          {presetLabel ? (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300" title="Active strategy preset">{presetLabel}</span>
          ) : null}
          {['ema821','ema512','ema89','ema3450','ribbon','ichi','saty','squeeze'].map(key => (
            overlayToggles[key] ? (
              <button key={key} onClick={overlayToggles[key]} className="px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500" title={`Toggle ${key}`}>{key}</button>
            ) : null
          ))}
          {/* Active overlay chips */}
          <div className="flex items-center gap-1 ml-2">
            {(() => {
              const chips = []
              try {
                if (Array.isArray(overlays?.emaClouds)) overlays.emaClouds.forEach(c => chips.push({ label: `EMA ${c.key}`, color: c.color || '#94a3b8' }))
                if (overlays?.ribbon) chips.push({ label: 'Ribbon', color: '#94a3b8' })
                if (overlays?.ichimoku) chips.push({ label: 'Ichi', color: '#60a5fa' })
                if (overlays?.saty) chips.push({ label: 'SATY', color: '#14b8a6' })
                if (overlays?.squeezeBands) chips.push({ label: 'Squeeze', color: '#f43f5e' })
              } catch {}
              return chips.slice(0,6).map((c,i) => (
                <span key={i} className="px-1.5 py-0.5 rounded-full border border-slate-700" style={{ background:'rgba(2,6,23,0.6)'}} title={c.label}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background:c.color }}></span>{c.label}
                </span>
              ))
            })()}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="animate-spin h-6 w-6 border-2 border-slate-600 border-t-transparent rounded-full" />
        </div>
      ) : null}
    </div>
  )
}
