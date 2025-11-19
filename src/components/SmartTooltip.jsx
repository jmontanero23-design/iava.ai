import { useState, useRef, useEffect } from 'react'

/**
 * Smart Tooltip with AI Explanations
 * Shows contextual help with optional AI-powered detailed explanations
 *
 * Features:
 * - Hover-triggered tooltips
 * - AI-powered detailed explanations (on demand)
 * - Smart positioning
 * - Keyboard accessible
 */
export default function SmartTooltip({ children, title, description, aiExplain = false, feature = null }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [aiExplanation, setAiExplanation] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [showAIExplain, setShowAIExplain] = useState(false)
  const tooltipRef = useRef(null)
  const timeoutRef = useRef(null)

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowTooltip(true), 300) // Delay to prevent flashing
  }

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false)
      setShowAIExplain(false)
    }, 200)
  }

  const fetchAIExplanation = async () => {
    if (!aiExplain || !feature || aiExplanation) return

    setLoadingAI(true)
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: feature.name || title,
          context: feature.description || description
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiExplanation(data.explanation || 'AI explanation unavailable')
      } else {
        setAiExplanation('Could not fetch AI explanation')
      }
    } catch (error) {
      console.error('[SmartTooltip] AI explanation error:', error)
      setAiExplanation('AI service temporarily unavailable')
    } finally {
      setLoadingAI(false)
    }
  }

  const handleAIExplainClick = () => {
    setShowAIExplain(true)
    if (!aiExplanation && !loadingAI) {
      fetchAIExplanation()
    }
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ minWidth: '200px', maxWidth: '320px' }}
        >
          {/* Tooltip arrow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700" />

          {/* Tooltip content */}
          <div className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-lg p-3 shadow-2xl">
            {/* Title */}
            {title && (
              <div className="font-medium text-sm text-slate-200 mb-1.5">
                {title}
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="text-xs text-slate-400 mb-2">
                {description}
              </div>
            )}

            {/* AI Explanation Section */}
            {aiExplain && (
              <div className="pt-2 border-t border-slate-700/50">
                {!showAIExplain ? (
                  <button
                    onClick={handleAIExplainClick}
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <span>🤖</span>
                    <span>Get AI explanation</span>
                    <span className="text-violet-500">→</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-violet-400">
                      <span>🤖</span>
                      <span className="font-medium">AI Explanation</span>
                    </div>
                    {loadingAI ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <span>AI is thinking...</span>
                      </div>
                    ) : (
                      <div className="text-xs text-violet-300 leading-relaxed">
                        {aiExplanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Feature metadata (if provided) */}
            {feature && feature.category && (
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
                    {feature.category}
                  </span>
                  {feature.status && (
                    <span className={`px-1.5 py-0.5 rounded border ${
                      feature.status === 'active'
                        ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400'
                        : 'bg-slate-800 border-slate-700'
                    }`}>
                      {feature.status}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Inline Info Tooltip
 * Compact version for inline help icons
 */
export function InfoTooltip({ text, aiExplain = false, feature = null }) {
  return (
    <SmartTooltip
      description={text}
      aiExplain={aiExplain}
      feature={feature}
    >
      <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 hover:border-slate-500 transition-all group">
        <span className="text-[10px] text-slate-400 group-hover:text-slate-300">?</span>
      </button>
    </SmartTooltip>
  )
}

/**
 * Feature Badge with Tooltip
 * Shows feature status with hover explanation
 */
export function FeatureTooltip({ feature, children }) {
  return (
    <SmartTooltip
      title={feature.name}
      description={feature.description}
      aiExplain={true}
      feature={feature}
    >
      {children}
    </SmartTooltip>
  )
}
