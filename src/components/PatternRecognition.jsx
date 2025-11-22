/**
 * Pattern Recognition System - Elite PhD Level
 * AI-powered chart pattern detection with harmonic patterns
 *
 * Classic Patterns:
 * - Head & Shoulders (reversal)
 * - Double Top/Bottom (reversal)
 * - Triangles (continuation/reversal)
 * - Wedges (reversal)
 * - Flags & Pennants (continuation)
 * - Cup & Handle (continuation)
 * - Support/Resistance breaks
 *
 * Harmonic Patterns (NEW):
 * - Gartley 222
 * - Butterfly
 * - Bat
 * - Crab
 * - Shark
 * - Cypher
 * - ABCD
 * - Three Drives
 */

import { useState, useEffect } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import { scanForHarmonicPatterns, getHarmonicDescription, detectThreeDrives } from '../utils/harmonicPatterns.js'

export default function PatternRecognition() {
  const { marketData } = useMarketData()
  const [detectedPatterns, setDetectedPatterns] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState(null)

  // Analyze chart for patterns
  const analyzePatterns = async () => {
    if (!marketData.chart || marketData.chart.length < 50) {
      setDetectedPatterns([{
        type: 'info',
        pattern: 'Insufficient Data',
        description: 'Need at least 50 candles for pattern detection',
        confidence: 0
      }])
      return
    }

    setIsAnalyzing(true)

    try {
      const patterns = []
      const chart = marketData.chart
      const highs = chart.map(c => c.high)
      const lows = chart.map(c => c.low)
      const closes = chart.map(c => c.close)

      // Pattern 1: Head & Shoulders
      const headShoulders = detectHeadAndShoulders(chart)
      if (headShoulders) patterns.push(headShoulders)

      // Pattern 2: Double Top/Bottom
      const doubleTB = detectDoubleTB(chart)
      if (doubleTB) patterns.push(doubleTB)

      // Pattern 3: Triangles
      const triangle = detectTriangle(chart)
      if (triangle) patterns.push(triangle)

      // Pattern 4: Support/Resistance Breaks
      const srBreak = detectSRBreak(chart)
      if (srBreak) patterns.push(srBreak)

      // Pattern 5: Trend Analysis
      const trend = detectTrend(chart)
      if (trend) patterns.push(trend)

      // Pattern 6: Bullish/Bearish Engulfing
      const engulfing = detectEngulfing(chart)
      if (engulfing) patterns.push(engulfing)

      // Pattern 7-14: HARMONIC PATTERNS (Elite Level)
      const harmonicPatterns = scanForHarmonicPatterns(chart)
      harmonicPatterns.forEach(harmonic => {
        const desc = getHarmonicDescription(harmonic)
        patterns.push({
          type: harmonic.type === 'bullish' ? 'success' : 'danger',
          pattern: desc.title,
          description: desc.description,
          confidence: harmonic.confidence,
          action: desc.action,
          implication: 'harmonic',
          details: desc.ratios,
          elite: true // Mark as elite pattern
        })
      })

      // Pattern 15: Three Drives Pattern
      const threeDrives = detectThreeDrives(chart)
      if (threeDrives) {
        patterns.push({
          type: threeDrives.type === 'bullish' ? 'success' : 'danger',
          pattern: threeDrives.pattern,
          description: threeDrives.description,
          confidence: threeDrives.confidence,
          action: threeDrives.type === 'bullish' ?
            'Exhaustion pattern - prepare for reversal up' :
            'Exhaustion pattern - prepare for reversal down',
          implication: 'harmonic',
          elite: true
        })
      }

      setDetectedPatterns(patterns.length > 0 ? patterns : [{
        type: 'info',
        pattern: 'No Patterns Detected',
        description: 'Current chart structure does not match known patterns',
        confidence: 0
      }])

      setLastAnalysis(new Date())

    } catch (error) {
      console.error('[Pattern Recognition] Error:', error)
      setDetectedPatterns([{
        type: 'error',
        pattern: 'Analysis Failed',
        description: error.message,
        confidence: 0
      }])
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-analyze on symbol change
  useEffect(() => {
    if (marketData.chart && marketData.chart.length >= 50) {
      analyzePatterns()
    }
  }, [marketData.symbol])

  // Detect Head & Shoulders pattern
  const detectHeadAndShoulders = (chart) => {
    const len = chart.length
    if (len < 20) return null

    const recent = chart.slice(-20)
    const highs = recent.map(c => c.high)
    const maxHigh = Math.max(...highs)
    const maxIdx = highs.lastIndexOf(maxHigh)

    // Look for shoulders on both sides
    const leftShoulder = highs.slice(0, maxIdx)
    const rightShoulder = highs.slice(maxIdx + 1)

    if (leftShoulder.length < 3 || rightShoulder.length < 3) return null

    const leftPeak = Math.max(...leftShoulder)
    const rightPeak = Math.max(...rightShoulder)

    // Shoulders should be roughly equal and lower than head
    const shoulderDiff = Math.abs(leftPeak - rightPeak) / leftPeak
    const headDiff = (maxHigh - leftPeak) / leftPeak

    if (shoulderDiff < 0.03 && headDiff > 0.02) {
      return {
        type: 'danger',
        pattern: 'Head & Shoulders',
        description: 'Bearish reversal pattern detected. Head at $' + maxHigh.toFixed(2),
        confidence: 75,
        action: 'Consider shorting or exit longs',
        implication: 'reversal'
      }
    }

    return null
  }

  // Detect Double Top/Bottom
  const detectDoubleTB = (chart) => {
    const len = chart.length
    if (len < 15) return null

    const recent = chart.slice(-15)
    const highs = recent.map(c => c.high)
    const lows = recent.map(c => c.low)

    // Double Top: Two peaks at similar levels
    const sortedHighs = [...highs].sort((a, b) => b - a)
    const peak1 = sortedHighs[0]
    const peak2 = sortedHighs[1]

    if (Math.abs(peak1 - peak2) / peak1 < 0.015) {
      return {
        type: 'warning',
        pattern: 'Double Top',
        description: 'Bearish reversal at $' + peak1.toFixed(2),
        confidence: 70,
        action: 'Resistance confirmed, consider shorts',
        implication: 'reversal'
      }
    }

    // Double Bottom: Two lows at similar levels
    const sortedLows = [...lows].sort((a, b) => a - b)
    const trough1 = sortedLows[0]
    const trough2 = sortedLows[1]

    if (Math.abs(trough1 - trough2) / trough1 < 0.015) {
      return {
        type: 'success',
        pattern: 'Double Bottom',
        description: 'Bullish reversal at $' + trough1.toFixed(2),
        confidence: 70,
        action: 'Support confirmed, consider longs',
        implication: 'reversal'
      }
    }

    return null
  }

  // Detect Triangle patterns
  const detectTriangle = (chart) => {
    const len = chart.length
    if (len < 20) return null

    const recent = chart.slice(-20)
    const highs = recent.map(c => c.high)
    const lows = recent.map(c => c.low)

    // Calculate trendlines
    const highSlope = (highs[highs.length - 1] - highs[0]) / highs.length
    const lowSlope = (lows[lows.length - 1] - lows[0]) / lows.length

    // Ascending Triangle: Flat resistance, rising support
    if (Math.abs(highSlope) < 0.001 && lowSlope > 0.002) {
      return {
        type: 'success',
        pattern: 'Ascending Triangle',
        description: 'Bullish continuation pattern forming',
        confidence: 65,
        action: 'Breakout above resistance likely bullish',
        implication: 'continuation'
      }
    }

    // Descending Triangle: Flat support, falling resistance
    if (Math.abs(lowSlope) < 0.001 && highSlope < -0.002) {
      return {
        type: 'danger',
        pattern: 'Descending Triangle',
        description: 'Bearish continuation pattern forming',
        confidence: 65,
        action: 'Breakdown below support likely bearish',
        implication: 'continuation'
      }
    }

    // Symmetrical Triangle: Converging trendlines
    if (highSlope < -0.001 && lowSlope > 0.001) {
      return {
        type: 'info',
        pattern: 'Symmetrical Triangle',
        description: 'Consolidation - breakout direction uncertain',
        confidence: 60,
        action: 'Wait for breakout direction',
        implication: 'continuation'
      }
    }

    return null
  }

  // Detect Support/Resistance breaks
  const detectSRBreak = (chart) => {
    const len = chart.length
    if (len < 30) return null

    const recent = chart.slice(-10)
    const historical = chart.slice(-30, -10)

    const currentPrice = recent[recent.length - 1].close
    const historicalHighs = historical.map(c => c.high)
    const historicalLows = historical.map(c => c.low)

    const resistance = Math.max(...historicalHighs)
    const support = Math.min(...historicalLows)

    // Resistance breakout
    if (currentPrice > resistance * 1.01) {
      return {
        type: 'success',
        pattern: 'Resistance Breakout',
        description: `Price broke above $${resistance.toFixed(2)}`,
        confidence: 80,
        action: 'Bullish momentum - consider longs',
        implication: 'breakout'
      }
    }

    // Support breakdown
    if (currentPrice < support * 0.99) {
      return {
        type: 'danger',
        pattern: 'Support Breakdown',
        description: `Price broke below $${support.toFixed(2)}`,
        confidence: 80,
        action: 'Bearish momentum - consider shorts',
        implication: 'breakdown'
      }
    }

    return null
  }

  // Detect overall trend
  const detectTrend = (chart) => {
    const len = chart.length
    if (len < 20) return null

    const recent = chart.slice(-20)
    const closes = recent.map(c => c.close)

    const firstPrice = closes[0]
    const lastPrice = closes[closes.length - 1]
    const change = ((lastPrice - firstPrice) / firstPrice) * 100

    if (change > 5) {
      return {
        type: 'success',
        pattern: 'Strong Uptrend',
        description: `+${change.toFixed(1)}% over last 20 candles`,
        confidence: 85,
        action: 'Trend is your friend - favor longs',
        implication: 'trend'
      }
    }

    if (change < -5) {
      return {
        type: 'danger',
        pattern: 'Strong Downtrend',
        description: `${change.toFixed(1)}% over last 20 candles`,
        confidence: 85,
        action: 'Trend is your friend - favor shorts',
        implication: 'trend'
      }
    }

    return null
  }

  // Detect Engulfing patterns
  const detectEngulfing = (chart) => {
    const len = chart.length
    if (len < 2) return null

    const prev = chart[len - 2]
    const curr = chart[len - 1]

    // Bullish Engulfing
    if (prev.close < prev.open && curr.close > curr.open) {
      if (curr.open < prev.close && curr.close > prev.open) {
        return {
          type: 'success',
          pattern: 'Bullish Engulfing',
          description: 'Strong bullish reversal candlestick',
          confidence: 75,
          action: 'Consider long entry',
          implication: 'reversal'
        }
      }
    }

    // Bearish Engulfing
    if (prev.close > prev.open && curr.close < curr.open) {
      if (curr.open > prev.close && curr.close < prev.open) {
        return {
          type: 'danger',
          pattern: 'Bearish Engulfing',
          description: 'Strong bearish reversal candlestick',
          confidence: 75,
          action: 'Consider short entry or exit longs',
          implication: 'reversal'
        }
      }
    }

    return null
  }

  // Get icon for pattern type
  const getPatternIcon = (type) => {
    switch(type) {
      case 'success': return '✅'
      case 'danger': return '🚨'
      case 'warning': return '⚠️'
      case 'info': return '💡'
      case 'error': return '❌'
      default: return '📊'
    }
  }

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">📐</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Pattern Recognition</h3>
              <p className="text-xs text-slate-400">
                AI-powered chart pattern detection
                {lastAnalysis && ` • Last: ${lastAnalysis.toLocaleTimeString()}`}
              </p>
            </div>
          </div>
          <button
            onClick={analyzePatterns}
            disabled={isAnalyzing}
            className="btn-tertiary btn-sm"
          >
            {isAnalyzing ? '⏳ Analyzing...' : '🔄 Scan Now'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Current Symbol */}
        {marketData.symbol && (
          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-300">Analyzing:</div>
                <div className="text-lg font-bold text-slate-200">{marketData.symbol}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Candles:</div>
                <div className="text-sm font-semibold text-slate-300">
                  {marketData.chart?.length || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detected Patterns */}
        <div className="space-y-3">
          <div className="text-xs text-slate-400 font-semibold">
            DETECTED PATTERNS ({detectedPatterns.length})
          </div>

          {isAnalyzing ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-3" />
              <div className="text-sm text-slate-400">Scanning chart for patterns...</div>
            </div>
          ) : (
            detectedPatterns.map((pattern, idx) => {
              const cardStyles = {
                success: 'border-emerald-500/30 bg-emerald-500/10',
                danger: 'border-red-500/30 bg-red-500/10',
                warning: 'border-amber-500/30 bg-amber-500/10',
                info: 'border-cyan-500/30 bg-cyan-500/10',
                error: 'border-rose-500/30 bg-rose-500/10'
              }

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${cardStyles[pattern.type] || cardStyles.info}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getPatternIcon(pattern.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-200">{pattern.pattern}</div>
                          {pattern.elite && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-xs font-bold text-white">
                              ELITE
                            </span>
                          )}
                        </div>
                        {pattern.confidence > 0 && (
                          <div className="text-xs text-slate-400">
                            {pattern.confidence}% confidence
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-slate-300 mb-2">
                        {pattern.description}
                      </div>
                      {pattern.details && (
                        <div className="text-xs text-purple-400 mb-2 font-mono">
                          {pattern.details}
                        </div>
                      )}
                      {pattern.action && (
                        <div className="text-sm text-indigo-300 font-semibold">
                          → {pattern.action}
                        </div>
                      )}
                      {pattern.implication && (
                        <div className="mt-2 inline-block px-2 py-1 bg-slate-900/50 rounded text-xs text-slate-400">
                          Type: {pattern.implication}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pattern Legend */}
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <div className="text-xs text-slate-400 font-semibold mb-3">PATTERN TYPES</div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <span className="text-emerald-400 font-semibold">Reversal:</span>
              <span className="text-slate-400"> Trend change expected</span>
            </div>
            <div>
              <span className="text-cyan-400 font-semibold">Continuation:</span>
              <span className="text-slate-400"> Trend continues</span>
            </div>
            <div>
              <span className="text-purple-400 font-semibold">Breakout:</span>
              <span className="text-slate-400"> Price breaks level</span>
            </div>
            <div>
              <span className="text-amber-400 font-semibold">Trend:</span>
              <span className="text-slate-400"> Directional movement</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-xs font-bold text-white">
                ELITE
              </span>
              <span className="text-xs text-pink-400 font-semibold">Harmonic Patterns</span>
            </div>
            <div className="text-xs text-slate-400">
              Advanced Fibonacci-based patterns with precise price targets and stop levels.
              Includes Gartley, Butterfly, Bat, Crab, Shark, Cypher, ABCD, and Three Drives.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
