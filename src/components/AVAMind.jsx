import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

/**
 * AVA Mind - AI Digital Twin
 * Your personal AI that learns your trading style and thinks like you
 * Next-gen feature for 2025 and beyond
 */
export default function AVAMind({ onClose }) {
  const [mindState, setMindState] = useState('learning') // learning, thinking, suggesting, executing
  const [personality, setPersonality] = useState(null)
  const [memories, setMemories] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [autonomyLevel, setAutonomyLevel] = useState(1) // 1-5 scale
  const [isListening, setIsListening] = useState(true)
  const [brainActivity, setBrainActivity] = useState([])
  const [confidence, setConfidence] = useState(0)
  const [learningProgress, setLearningProgress] = useState(0)
  const { marketData } = useMarketData()
  const animationRef = useRef(null)

  // Load or initialize AI personality
  useEffect(() => {
    const savedPersonality = localStorage.getItem('ava.mind.personality')
    if (savedPersonality) {
      setPersonality(JSON.parse(savedPersonality))
      setMindState('thinking')
    } else {
      initializePersonality()
    }

    // Start learning from user patterns
    startLearning()
  }, [])

  // Initialize AI personality based on user's trading history
  const initializePersonality = () => {
    const newPersonality = {
      riskTolerance: 'moderate',
      tradingStyle: 'swing',
      preferredTimeframes: ['5Min', '1Hour'],
      favoriteIndicators: ['RSI', 'MACD', 'EMA'],
      patterns: [],
      strengths: [],
      weaknesses: [],
      emotionalState: 'calm',
      learningRate: 0.1,
      adaptability: 0.8,
      intuition: 0.6
    }
    setPersonality(newPersonality)
    localStorage.setItem('ava.mind.personality', JSON.stringify(newPersonality))
  }

  // Learn from user actions
  const startLearning = () => {
    // Listen to user trading events
    const handleTrade = (e) => {
      const trade = e.detail
      addMemory('trade', trade)
      updatePersonality(trade)
      setLearningProgress(prev => Math.min(prev + 5, 100))
    }

    const handleAnalysis = (e) => {
      const analysis = e.detail
      addMemory('analysis', analysis)
      learnFromAnalysis(analysis)
      setLearningProgress(prev => Math.min(prev + 2, 100))
    }

    window.addEventListener('iava.trade', handleTrade)
    window.addEventListener('iava.analysis', handleAnalysis)

    return () => {
      window.removeEventListener('iava.trade', handleTrade)
      window.removeEventListener('iava.analysis', handleAnalysis)
    }
  }

  // Add memory to AI
  const addMemory = (type, data) => {
    const memory = {
      type,
      data,
      timestamp: Date.now(),
      marketCondition: marketData.signalState,
      emotion: detectEmotion(data)
    }

    setMemories(prev => [...prev.slice(-99), memory]) // Keep last 100 memories

    // Neural network simulation
    simulateBrainActivity(memory)
  }

  // Detect emotional state from trading patterns
  const detectEmotion = (data) => {
    if (data.action === 'panic_sell') return 'fear'
    if (data.action === 'fomo_buy') return 'greed'
    if (data.profit > 0.1) return 'euphoria'
    if (data.loss > 0.1) return 'frustration'
    return 'neutral'
  }

  // Simulate brain activity visualization
  const simulateBrainActivity = (memory) => {
    const neurons = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      intensity: Math.random(),
      connections: Array.from({ length: 3 }, () => Math.floor(Math.random() * 20))
    }))

    setBrainActivity(neurons)

    // Animate neural firing
    setTimeout(() => {
      setBrainActivity(prev => prev.map(n => ({
        ...n,
        intensity: Math.random()
      })))
    }, 200)
  }

  // Update personality based on trading patterns
  const updatePersonality = (trade) => {
    if (!personality) return

    const newPersonality = { ...personality }

    // Adjust risk tolerance based on outcomes
    if (trade.outcome === 'win') {
      newPersonality.riskTolerance = adjustValue(newPersonality.riskTolerance, 0.05, 'up')
      newPersonality.emotionalState = 'confident'
    } else if (trade.outcome === 'loss') {
      newPersonality.riskTolerance = adjustValue(newPersonality.riskTolerance, 0.05, 'down')
      newPersonality.emotionalState = 'cautious'
    }

    // Learn trading patterns
    if (!newPersonality.patterns.includes(trade.pattern)) {
      newPersonality.patterns.push(trade.pattern)
    }

    setPersonality(newPersonality)
    localStorage.setItem('ava.mind.personality', JSON.stringify(newPersonality))
  }

  const adjustValue = (current, change, direction) => {
    const values = ['conservative', 'moderate', 'aggressive']
    const index = values.indexOf(current)
    const newIndex = direction === 'up'
      ? Math.min(index + 1, values.length - 1)
      : Math.max(index - 1, 0)
    return values[newIndex]
  }

  // Learn from analysis patterns
  const learnFromAnalysis = (analysis) => {
    // Deep learning simulation
    setMindState('thinking')

    setTimeout(() => {
      const suggestion = generateSuggestion(analysis)
      if (suggestion) {
        setSuggestions(prev => [suggestion, ...prev.slice(0, 4)])
      }
      setMindState('suggesting')
    }, 1500)
  }

  // Generate intelligent suggestions
  const generateSuggestion = (analysis) => {
    const { symbol, indicators, sentiment } = analysis
    const confidence = calculateConfidence(analysis)

    setConfidence(confidence)

    if (confidence > 70) {
      return {
        id: Date.now(),
        type: 'trade',
        action: sentiment > 0 ? 'BUY' : 'SELL',
        symbol,
        confidence,
        reasoning: generateReasoning(analysis),
        timing: 'NOW',
        risk: calculateRisk(analysis)
      }
    }

    return null
  }

  const calculateConfidence = (analysis) => {
    // Complex confidence calculation based on multiple factors
    const factors = [
      analysis.technical_score * 0.3,
      analysis.sentiment_score * 0.2,
      analysis.volume_score * 0.2,
      analysis.pattern_score * 0.15,
      analysis.momentum_score * 0.15
    ]

    return Math.min(factors.reduce((a, b) => a + b, 0) * 100, 100)
  }

  const calculateRisk = (analysis) => {
    const volatility = analysis.volatility || 0.5
    const trend = analysis.trend || 0
    const volume = analysis.volume || 0.5

    const risk = (volatility * 0.5) + (Math.abs(1 - trend) * 0.3) + ((1 - volume) * 0.2)

    if (risk < 0.3) return 'LOW'
    if (risk < 0.6) return 'MEDIUM'
    return 'HIGH'
  }

  const generateReasoning = (analysis) => {
    const reasons = []

    if (analysis.technical_score > 0.7) reasons.push('Strong technical setup')
    if (analysis.sentiment_score > 0.6) reasons.push('Positive market sentiment')
    if (analysis.volume_score > 0.8) reasons.push('High volume confirmation')
    if (analysis.pattern_score > 0.7) reasons.push('Recognized bullish pattern')

    return reasons.join(' • ')
  }

  // Execute autonomous trade (if permitted)
  const executeTrade = (suggestion) => {
    if (autonomyLevel < 3) {
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Autonomy level too low. Increase to level 3+ for auto-trading', type: 'warning' }
      }))
      return
    }

    setMindState('executing')

    // Simulate trade execution
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('iava.executeTrade', {
        detail: {
          ...suggestion,
          executedBy: 'AVA Mind',
          timestamp: Date.now()
        }
      }))

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: `AVA Mind executed: ${suggestion.action} ${suggestion.symbol}`, type: 'success' }
      }))

      setMindState('thinking')
    }, 1000)
  }

  // Render brain visualization
  const renderBrain = () => (
    <svg className="w-full h-full" viewBox="0 0 100 100">
      {/* Neural connections */}
      {brainActivity.map(neuron =>
        neuron.connections.map(targetId => {
          const target = brainActivity[targetId]
          if (!target) return null
          return (
            <line
              key={`${neuron.id}-${targetId}`}
              x1={neuron.x}
              y1={neuron.y}
              x2={target.x}
              y2={target.y}
              stroke={`rgba(139, 92, 246, ${neuron.intensity * 0.3})`}
              strokeWidth="0.5"
              className="animate-pulse"
            />
          )
        })
      )}

      {/* Neurons */}
      {brainActivity.map(neuron => (
        <circle
          key={neuron.id}
          cx={neuron.x}
          cy={neuron.y}
          r={2 + neuron.intensity * 3}
          fill={`rgba(139, 92, 246, ${neuron.intensity})`}
          className="animate-pulse"
        >
          <animate
            attributeName="r"
            values={`${2 + neuron.intensity * 3};${4 + neuron.intensity * 3};${2 + neuron.intensity * 3}`}
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  )

  return (
    <div className="fixed right-4 top-20 w-96 max-h-[calc(100vh-6rem)] bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden z-40">
      {/* Holographic gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-cyan-500/10 to-pink-500/10 animate-gradient-shift pointer-events-none" />

      {/* Header */}
      <div className="relative p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-pulse" />
              <div className="absolute inset-1 bg-slate-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AVA Mind</h2>
              <div className="text-xs text-purple-400 capitalize">{mindState}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Learning Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Learning Progress</span>
            <span>{learningProgress}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${learningProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Brain Visualization */}
      <div className="relative h-32 bg-slate-950/50 border-b border-purple-500/20">
        {renderBrain()}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{confidence}%</div>
            <div className="text-xs text-purple-400">Confidence</div>
          </div>
        </div>
      </div>

      {/* Personality Traits */}
      {personality && (
        <div className="p-4 border-b border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-300 mb-3">Personality Matrix</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-500">Risk Profile</div>
              <div className="text-sm font-medium text-white capitalize">{personality.riskTolerance}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-500">Trading Style</div>
              <div className="text-sm font-medium text-white capitalize">{personality.tradingStyle}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-500">Emotional State</div>
              <div className="text-sm font-medium text-white capitalize">{personality.emotionalState}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-500">Adaptability</div>
              <div className="text-sm font-medium text-white">{(personality.adaptability * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Autonomy Control */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-purple-300">Autonomy Level</h3>
          <span className="text-xs text-slate-400">
            {autonomyLevel === 1 && 'Observe Only'}
            {autonomyLevel === 2 && 'Suggest'}
            {autonomyLevel === 3 && 'Assist'}
            {autonomyLevel === 4 && 'Co-pilot'}
            {autonomyLevel === 5 && 'Autonomous'}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              onClick={() => setAutonomyLevel(level)}
              className={`flex-1 h-8 rounded transition-all ${
                level <= autonomyLevel
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500'
                  : 'bg-slate-800'
              }`}
            >
              <span className="text-xs text-white/70">{level}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Level {autonomyLevel >= 3 ? '3+' : '3'} required for auto-execution
        </div>
      </div>

      {/* Active Suggestions */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        <h3 className="text-sm font-semibold text-purple-300 mb-2">Mind Suggestions</h3>
        {suggestions.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-sm">
            Observing and learning your patterns...
          </div>
        ) : (
          suggestions.map(suggestion => (
            <div key={suggestion.id} className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${
                  suggestion.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {suggestion.action} {suggestion.symbol}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  suggestion.risk === 'LOW'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : suggestion.risk === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {suggestion.risk} RISK
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-2">{suggestion.reasoning}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500">Confidence</div>
                  <div className="text-sm font-medium text-purple-400">{suggestion.confidence}%</div>
                </div>
                {autonomyLevel >= 3 && (
                  <button
                    onClick={() => executeTrade(suggestion)}
                    className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs transition-all"
                  >
                    Execute
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mind State Indicator */}
      <div className="p-4 border-t border-purple-500/20 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              mindState === 'learning' ? 'bg-cyan-500' :
              mindState === 'thinking' ? 'bg-purple-500' :
              mindState === 'suggesting' ? 'bg-amber-500' :
              'bg-emerald-500'
            }`} />
            <span className="text-xs text-slate-400">
              {mindState === 'learning' && 'Learning from your patterns...'}
              {mindState === 'thinking' && 'Processing market data...'}
              {mindState === 'suggesting' && 'Generating suggestions...'}
              {mindState === 'executing' && 'Executing trade...'}
            </span>
          </div>
          <button
            onClick={() => setIsListening(!isListening)}
            className={`p-1.5 rounded-md transition-all ${
              isListening
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-slate-800 text-slate-500'
            }`}
            title={isListening ? "Mind is active" : "Mind is paused"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isListening ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}