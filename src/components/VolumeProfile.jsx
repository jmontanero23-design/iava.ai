/**
 * Volume Profile Chart Component - Elite PhD Level
 * TPO, VWAP, POC, Value Area, Market Profile
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'
import {
  calculateVolumeProfile,
  calculateVWAP,
  calculateMarketProfile,
  calculateCVD,
  identifyVolumeNodes,
  analyzeVolumePriceRelationship
} from '../utils/volumeProfile.js'

export default function VolumeProfile() {
  const { marketData } = useMarketData()
  const [profileData, setProfileData] = useState(null)
  const [vwapData, setVwapData] = useState([])
  const [marketProfile, setMarketProfile] = useState(null)
  const [cvdData, setCvdData] = useState([])
  const [volumeNodes, setVolumeNodes] = useState(null)
  const [volumeAnalysis, setVolumeAnalysis] = useState(null)
  const [viewMode, setViewMode] = useState('profile') // profile, tpo, delta, analysis
  const [bins, setBins] = useState(30)
  const [showVWAP, setShowVWAP] = useState(true)
  const [showValueArea, setShowValueArea] = useState(true)
  const [showNodes, setShowNodes] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(true)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // Calculate all volume metrics when chart data changes
  useEffect(() => {
    if (!marketData?.chart || marketData.chart.length < 20) return

    const bars = marketData.chart

    // Calculate Volume Profile
    const profile = calculateVolumeProfile(bars, bins)
    setProfileData(profile)

    // Calculate VWAP
    const vwap = calculateVWAP(bars)
    setVwapData(vwap)

    // Calculate Market Profile
    const tpo = calculateMarketProfile(bars)
    setMarketProfile(tpo)

    // Calculate CVD
    const cvd = calculateCVD(bars)
    setCvdData(cvd)

    // Identify Volume Nodes
    if (profile) {
      const nodes = identifyVolumeNodes(profile)
      setVolumeNodes(nodes)
    }

    // Analyze Volume-Price Relationship
    const analysis = analyzeVolumePriceRelationship(bars)
    setVolumeAnalysis(analysis)
  }, [marketData?.chart, bins])

  // AI Volume Analysis
  const analyzeVolumeWithAI = async () => {
    if (!profileData || aiLoading) return

    setAiLoading(true)
    try {
      const prompt = `As an AI volume profile analyst using ML models, analyze this market structure:

      Volume Profile:
      - POC (Point of Control): $${profileData.poc.toFixed(2)}
      - Value Area High: $${profileData.valueAreaHigh.toFixed(2)}
      - Value Area Low: $${profileData.valueAreaLow.toFixed(2)}
      - Total Volume: ${profileData.totalVolume.toLocaleString()}
      - HVN Count: ${volumeNodes?.hvn.length || 0}
      - LVN Count: ${volumeNodes?.lvn.length || 0}
      - Current Price: $${marketData?.price.toFixed(2)}

      Volume Analysis:
      - Trend: ${volumeAnalysis?.trend}
      - Momentum: ${volumeAnalysis?.momentum}
      - Accumulation/Distribution: ${volumeAnalysis?.accumulation}

      Provide JSON analysis with:
      1. supportResistance: array of {price, strength: 0-100, type: 'support'|'resistance', reasoning}
      2. institutionalFlow: {detected: boolean, type: 'accumulation'|'distribution'|'neutral', confidence: 0-1}
      3. volumePattern: identified pattern name with explanation
      4. priceTarget: {short_term: price, medium_term: price, confidence: 0-1}
      5. migrationSignal: POC migration direction and strength
      6. liquidityPockets: array of price levels with trapped liquidity
      7. optimalEntry: {price, stop_loss, take_profit, risk_reward_ratio}`

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          feature: 'volume-profile', // Uses GPT-5-mini for market structure analysis
          temperature: 0.3,
          max_tokens: 600
        })
      })

      if (response.ok) {
        const data = await response.json()
        const analysis = JSON.parse(data.content || '{}')
        setAiAnalysis(analysis)

        // Alert on institutional flow detection
        if (analysis.institutionalFlow?.detected) {
          window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: {
              text: `🏦 Institutional ${analysis.institutionalFlow.type} detected (${(analysis.institutionalFlow.confidence * 100).toFixed(0)}% confidence)`,
              type: 'info'
            }
          }))
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error)
    }
    setAiLoading(false)
  }

  // Auto-analyze when profile data changes
  useEffect(() => {
    if (showAI && profileData && volumeNodes) {
      const timer = setTimeout(() => {
        analyzeVolumeWithAI()
      }, 1500) // Debounce
      return () => clearTimeout(timer)
    }
  }, [profileData, volumeNodes, showAI])

  // Draw volume profile on canvas
  useEffect(() => {
    if (!canvasRef.current || !profileData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    const profile = profileData.profile
    const maxVolume = profileData.maxBinVolume
    const priceRange = profileData.priceRange

    // Draw value area background
    if (showValueArea) {
      const vaHighY = ((priceRange.max - profileData.valueAreaHigh) / (priceRange.max - priceRange.min)) * rect.height
      const vaLowY = ((priceRange.max - profileData.valueAreaLow) / (priceRange.max - priceRange.min)) * rect.height

      ctx.fillStyle = 'rgba(139, 92, 246, 0.1)' // Purple with low opacity
      ctx.fillRect(0, vaHighY, rect.width, vaLowY - vaHighY)
    }

    // Draw POC line
    const pocY = ((priceRange.max - profileData.poc) / (priceRange.max - priceRange.min)) * rect.height
    ctx.strokeStyle = '#fbbf24' // Amber
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, pocY)
    ctx.lineTo(rect.width, pocY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw volume bars
    profile.forEach(bin => {
      const y = ((priceRange.max - bin.price) / (priceRange.max - priceRange.min)) * rect.height
      const width = (bin.volume / maxVolume) * rect.width * 0.8
      const height = rect.height / bins

      // Determine color based on delta
      if (bin.deltaPercent > 10) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.7)' // Green for buying
      } else if (bin.deltaPercent < -10) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)' // Red for selling
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)' // Gray for neutral
      }

      ctx.fillRect(0, y - height/2, width, height)

      // Draw volume text for significant levels
      if (bin.volumePercent > 5) {
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '10px monospace'
        ctx.fillText(
          `${bin.volume.toFixed(0)}`,
          width + 5,
          y + 3
        )
      }
    })

    // Draw HVN and LVN markers
    if (showNodes && volumeNodes) {
      // High Volume Nodes
      volumeNodes.hvn.forEach(node => {
        const y = ((priceRange.max - node.price) / (priceRange.max - priceRange.min)) * rect.height
        ctx.fillStyle = '#8b5cf6'
        ctx.beginPath()
        ctx.arc(rect.width - 20, y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      // Low Volume Nodes
      volumeNodes.lvn.forEach(node => {
        const y = ((priceRange.max - node.price) / (priceRange.max - priceRange.min)) * rect.height
        ctx.fillStyle = '#06b6d4'
        ctx.beginPath()
        ctx.arc(rect.width - 20, y, 4, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }, [profileData, volumeNodes, showValueArea, showNodes, bins])

  // Format number with suffix
  const formatVolume = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toFixed(0)
  }

  // Get current VWAP value
  const currentVWAP = useMemo(() => {
    if (vwapData.length === 0) return null
    return vwapData[vwapData.length - 1]
  }, [vwapData])

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="panel-icon text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-slate-200 text-lg">Volume Profile</h3>
              <p className="text-xs text-slate-400">
                TPO, VWAP, POC & Market Profile
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVWAP(!showVWAP)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showVWAP ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              VWAP
            </button>
            <button
              onClick={() => setShowValueArea(!showValueArea)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showValueArea ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              VA
            </button>
            <button
              onClick={() => setShowNodes(!showNodes)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showNodes ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              Nodes
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                showAI ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'
              }`}
            >
              🤖 AI
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-2">
          {['profile', 'tpo', 'delta', 'analysis'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                viewMode === mode
                  ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400">Bins:</span>
            <select
              value={bins}
              onChange={(e) => setBins(parseInt(e.target.value))}
              className="bg-slate-700 rounded px-2 py-1 text-xs"
            >
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {profileData && (
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-slate-500">POC:</span>
              <div className="text-sm font-semibold text-yellow-400">
                ${profileData.poc.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">
                {formatVolume(profileData.pocVolume)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Value Area:</span>
              <div className="text-sm font-semibold text-purple-400">
                ${profileData.valueAreaLow.toFixed(2)}-${profileData.valueAreaHigh.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">
                70% vol
              </div>
            </div>
            {currentVWAP && (
              <div>
                <span className="text-slate-500">VWAP:</span>
                <div className="text-sm font-semibold text-cyan-400">
                  ${currentVWAP.vwap.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400">
                  ±${((currentVWAP.upper1 - currentVWAP.vwap)).toFixed(2)}
                </div>
              </div>
            )}
            {marketProfile && (
              <div>
                <span className="text-slate-500">Shape:</span>
                <div className="text-sm font-semibold text-indigo-400">
                  {marketProfile.shape.type.toUpperCase()}
                </div>
                <div className="text-xs text-slate-400">
                  {marketProfile.periods} periods
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chart Area */}
        <div className="flex-1 relative" ref={containerRef}>
          {viewMode === 'profile' && (
            <>
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
              {/* Price Scale */}
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-slate-900/50 border-l border-slate-700/50">
                {profileData && Array.from({ length: 10 }).map((_, i) => {
                  const price = profileData.priceRange.max -
                    (i * (profileData.priceRange.max - profileData.priceRange.min) / 9)
                  return (
                    <div
                      key={i}
                      className="absolute right-0 px-1 text-xs text-slate-400"
                      style={{ top: `${i * 11}%` }}
                    >
                      ${price.toFixed(2)}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {viewMode === 'tpo' && marketProfile && (
            <div className="p-4 overflow-y-auto h-full">
              <div className="space-y-1 font-mono text-xs">
                {marketProfile.profile.slice(0, 50).map((level, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-500 w-16 text-right">
                      ${level.price.toFixed(2)}
                    </span>
                    <span className={`${
                      level.price === marketProfile.poc ? 'text-yellow-400' : 'text-slate-300'
                    }`}>
                      {level.tpo.join('')}
                    </span>
                    {level.price === marketProfile.poc && (
                      <span className="text-xs text-yellow-400 ml-2">← POC</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'delta' && cvdData.length > 0 && (
            <div className="p-4 h-full">
              <div className="h-full flex flex-col">
                {/* CVD Chart */}
                <div className="flex-1 relative">
                  <div className="absolute inset-0">
                    {cvdData.slice(-100).map((point, idx) => {
                      const height = Math.abs(point.delta) / 1000
                      const isPositive = point.delta > 0
                      return (
                        <div
                          key={idx}
                          className={`absolute bottom-0 ${
                            isPositive ? 'bg-emerald-500/50' : 'bg-red-500/50'
                          }`}
                          style={{
                            left: `${idx}%`,
                            width: '1%',
                            height: `${Math.min(height, 100)}%`,
                            bottom: isPositive ? '50%' : 'auto',
                            top: isPositive ? 'auto' : '50%'
                          }}
                        />
                      )
                    })}
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-600" />
                  </div>
                </div>
                {/* CVD Stats */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Current CVD:</span>
                    <div className={`text-sm font-semibold ${
                      cvdData[cvdData.length - 1]?.cumulative > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatVolume(Math.abs(cvdData[cvdData.length - 1]?.cumulative || 0))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Buy Ratio:</span>
                    <div className="text-sm font-semibold text-emerald-400">
                      {((cvdData[cvdData.length - 1]?.ratio || 1) * 100 - 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Direction:</span>
                    <div className="text-sm font-semibold text-indigo-400">
                      {cvdData[cvdData.length - 1]?.cumulative > 0 ? 'BUYING' : 'SELLING'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'analysis' && volumeAnalysis && (
            <div className="p-4 overflow-y-auto h-full space-y-4">
              {/* Volume Analysis Summary */}
              <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-400 mb-2">VOLUME ANALYSIS</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Trend:</span>
                    <span className={`ml-2 font-semibold ${
                      volumeAnalysis.summary.trend === 'accumulation' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {volumeAnalysis.summary.trend.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Strength:</span>
                    <span className="ml-2 font-semibold text-purple-400">
                      {(volumeAnalysis.summary.strength * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Avg Vol ROC:</span>
                    <span className="ml-2 font-semibold text-cyan-400">
                      {volumeAnalysis.summary.avgVolumeROC.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Efficiency:</span>
                    <span className="ml-2 font-semibold text-amber-400">
                      {volumeAnalysis.summary.avgEfficiency.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Volume Nodes */}
              {volumeNodes && (
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">VOLUME NODES</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-purple-400 mb-1">High Volume Nodes (Support/Resistance)</div>
                      {volumeNodes.hvn.slice(0, 3).map((node, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">${node.price.toFixed(2)}</span>
                          <span className="text-slate-500">{formatVolume(node.volume)}</span>
                          <span className="text-purple-400">Strength: {node.strength.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs text-cyan-400 mb-1">Low Volume Nodes (Breakout Zones)</div>
                      {volumeNodes.lvn.slice(0, 3).map((node, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">${node.price.toFixed(2)}</span>
                          <span className="text-slate-500">{formatVolume(node.volume)}</span>
                          <span className="text-cyan-400">Speed: {node.strength.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Market Profile Shape */}
              {marketProfile && (
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-3 border border-indigo-500/30">
                  <h4 className="text-xs font-semibold text-indigo-400 mb-2">MARKET PROFILE SHAPE</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-semibold text-white">
                        {marketProfile.shape.type.toUpperCase()} PROFILE
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      {marketProfile.shape.description}
                    </div>
                    <div className="text-xs text-slate-400">
                      POC Position: {(marketProfile.shape.pocPosition * 100).toFixed(1)}%
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div>
                        <span className="text-slate-500">Upper:</span>
                        <span className="ml-1 text-slate-300">{marketProfile.shape.balance.upper}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Middle:</span>
                        <span className="ml-1 text-slate-300">{marketProfile.shape.balance.middle}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Lower:</span>
                        <span className="ml-1 text-slate-300">{marketProfile.shape.balance.lower}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* VWAP Bands (right sidebar) */}
        {showVWAP && currentVWAP && viewMode === 'profile' && (
          <div className="w-48 border-l border-slate-700/50 p-3 overflow-y-auto">
            <h4 className="text-xs font-semibold text-slate-400 mb-3">VWAP BANDS</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-red-400">+3σ</span>
                <span className="text-slate-300">${currentVWAP.upper3.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-400">+2σ</span>
                <span className="text-slate-300">${currentVWAP.upper2.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400">+1σ</span>
                <span className="text-slate-300">${currentVWAP.upper1.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-y border-cyan-500/50 py-1">
                <span className="text-cyan-400 font-semibold">VWAP</span>
                <span className="text-cyan-400 font-semibold">${currentVWAP.vwap.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400">-1σ</span>
                <span className="text-slate-300">${currentVWAP.lower1.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-400">-2σ</span>
                <span className="text-slate-300">${currentVWAP.lower2.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-400">-3σ</span>
                <span className="text-slate-300">${currentVWAP.lower3.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/50">
              <div className="text-xs text-slate-400 mb-2">VOLUME</div>
              <div className="text-sm font-semibold text-white">
                {formatVolume(currentVWAP.volume)}
              </div>
            </div>

            {/* AI Analysis */}
            {showAI && (
              <div className="mt-4 pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">🤖</span>
                    <span className="text-xs font-semibold text-purple-400">AI ANALYSIS</span>
                  </div>
                  {aiLoading && (
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  )}
                </div>

                {aiAnalysis ? (
                  <div className="space-y-2">
                    {/* Support & Resistance */}
                    {aiAnalysis.supportResistance && aiAnalysis.supportResistance.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-slate-400">AI Levels</div>
                        {aiAnalysis.supportResistance.slice(0, 3).map((level, idx) => (
                          <div key={idx} className="text-xs bg-slate-800/50 rounded p-1">
                            <div className="flex items-center justify-between">
                              <span className={level.type === 'support' ? 'text-emerald-400' : 'text-red-400'}>
                                {level.type === 'support' ? '🛡️' : '🚫'} ${level.price?.toFixed(2)}
                              </span>
                              <span className="text-slate-400">{level.strength}%</span>
                            </div>
                            {level.reasoning && (
                              <div className="text-xs text-slate-500 mt-0.5">{level.reasoning}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Institutional Flow */}
                    {aiAnalysis.institutionalFlow && (
                      <div className={`p-2 rounded text-xs ${
                        aiAnalysis.institutionalFlow.type === 'accumulation'
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : aiAnalysis.institutionalFlow.type === 'distribution'
                          ? 'bg-red-500/20 border border-red-500/30'
                          : 'bg-slate-700/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={
                            aiAnalysis.institutionalFlow.type === 'accumulation' ? 'text-emerald-400' :
                            aiAnalysis.institutionalFlow.type === 'distribution' ? 'text-red-400' :
                            'text-slate-400'
                          }>
                            🏦 {aiAnalysis.institutionalFlow.type?.toUpperCase()}
                          </span>
                          <span className="text-xs">
                            {(aiAnalysis.institutionalFlow.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Volume Pattern */}
                    {aiAnalysis.volumePattern && (
                      <div className="bg-indigo-500/10 rounded p-2 text-xs">
                        <div className="text-indigo-400 mb-1">📊 Pattern</div>
                        <div className="text-slate-300">{aiAnalysis.volumePattern}</div>
                      </div>
                    )}

                    {/* Price Targets */}
                    {aiAnalysis.priceTarget && (
                      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded p-2">
                        <div className="text-xs text-cyan-400 mb-1">🎯 AI Targets</div>
                        <div className="space-y-1">
                          {aiAnalysis.priceTarget.short_term && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Short:</span>
                              <span className="text-white font-semibold">
                                ${aiAnalysis.priceTarget.short_term.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {aiAnalysis.priceTarget.medium_term && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Medium:</span>
                              <span className="text-white font-semibold">
                                ${aiAnalysis.priceTarget.medium_term.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Liquidity Pockets */}
                    {aiAnalysis.liquidityPockets && aiAnalysis.liquidityPockets.length > 0 && (
                      <div className="bg-amber-500/10 rounded p-2">
                        <div className="text-xs text-amber-400 mb-1">💧 Liquidity</div>
                        <div className="space-y-0.5">
                          {aiAnalysis.liquidityPockets.slice(0, 2).map((pocket, idx) => (
                            <div key={idx} className="text-xs text-slate-300">
                              ${pocket.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optimal Entry */}
                    {aiAnalysis.optimalEntry && (
                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded p-2 border border-purple-500/30">
                        <div className="text-xs text-purple-400 mb-1">💡 Entry Setup</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Entry:</span>
                            <span className="text-emerald-400">${aiAnalysis.optimalEntry.price?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stop:</span>
                            <span className="text-red-400">${aiAnalysis.optimalEntry.stop_loss?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target:</span>
                            <span className="text-cyan-400">${aiAnalysis.optimalEntry.take_profit?.toFixed(2)}</span>
                          </div>
                          {aiAnalysis.optimalEntry.risk_reward_ratio && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">R:R:</span>
                              <span className="text-purple-400">1:{aiAnalysis.optimalEntry.risk_reward_ratio.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : aiLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-8 bg-slate-800/30 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={analyzeVolumeWithAI}
                    className="w-full py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-all"
                  >
                    Analyze Volume
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}