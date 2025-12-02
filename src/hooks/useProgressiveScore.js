/**
 * Progressive Score Hook
 *
 * Returns a Unicorn Score that "builds up" as data arrives:
 * 1. Technical score (instant, local calculation) → shows up to 50% ring fill
 * 2. Full Ultra Elite score (API) → shows 100% ring fill
 *
 * BIDIRECTIONAL INTERPRETATION:
 * - Score >= 60: BULLISH → LONG opportunity
 * - Score 45-59: NEUTRAL → Wait for clarity
 * - Score <= 44: BEARISH → SHORT opportunity
 *
 * Based on: iAVA-CLAUDE-CODE-MASTER-PROMPT.md
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { computeStates } from '../utils/indicators.js'

/**
 * Get direction from score value
 */
function getDirection(score) {
  if (score >= 60) return 'bullish'
  if (score <= 44) return 'bearish'
  return 'neutral'
}

/**
 * Get quality label from score
 */
function getQuality(score) {
  if (score >= 80) return 'EXCEPTIONAL'
  if (score >= 70) return 'STRONG'
  if (score >= 60) return 'GOOD'
  if (score >= 45) return 'NEUTRAL'
  if (score >= 20) return 'BEARISH'
  return 'STRONG BEARISH'
}

/**
 * Get recommendation based on score direction
 */
function getRecommendation(score, direction) {
  if (direction === 'bullish') {
    if (score >= 80) return { action: 'STRONG LONG', confidence: 'high' }
    if (score >= 70) return { action: 'LONG', confidence: 'high' }
    return { action: 'LONG', confidence: 'medium' }
  }
  if (direction === 'bearish') {
    if (score <= 19) return { action: 'STRONG SHORT', confidence: 'high' }
    if (score <= 30) return { action: 'SHORT', confidence: 'high' }
    return { action: 'SHORT', confidence: 'medium' }
  }
  return { action: 'WAIT', confidence: 'low' }
}

/**
 * useProgressiveScore Hook
 *
 * @param {string} symbol - Stock symbol to calculate score for
 * @param {Array} bars - Optional price bars (OHLCV) for local calculation
 * @param {Object} options - Configuration options
 * @returns {Object} Progressive score state
 */
export function useProgressiveScore(symbol, bars = null, options = {}) {
  const {
    autoFetchFull = true,  // Auto-fetch full score from API
    skipTechnical = false, // Skip local technical calculation
  } = options

  const [state, setState] = useState({
    score: 0,              // Current display score
    maxPossible: 50,       // Max possible with current data (50 = technical only, 100 = complete)
    isComplete: false,     // All components loaded
    loading: true,
    direction: 'neutral',  // 'bullish' | 'bearish' | 'neutral'
    quality: 'NEUTRAL',
    recommendation: { action: 'WAIT', confidence: 'low' },
    breakdown: {
      technical: null,     // 0-50 (weighted)
      sentiment: null,     // 0-25 (weighted)
      forecast: null       // 0-25 (weighted)
    },
    bonuses: null,
    error: null
  })

  // Track if component is mounted
  const mountedRef = useRef(true)

  // Calculate technical score from bars (instant, local)
  const calculateTechnicalScore = useCallback((barsData) => {
    if (!barsData || barsData.length < 30) {
      return { score: 50, direction: 'neutral' }  // Default neutral if insufficient data
    }

    try {
      const states = computeStates(barsData)
      const technicalScore = states.score ?? 50

      // Clamp to 0-100
      const clampedScore = Math.max(0, Math.min(100, technicalScore))

      return {
        score: clampedScore,
        direction: getDirection(clampedScore),
        states
      }
    } catch (error) {
      console.error('[useProgressiveScore] Technical calculation error:', error)
      return { score: 50, direction: 'neutral' }
    }
  }, [])

  // Fetch full Ultra Elite score from API
  const fetchFullScore = useCallback(async (sym, technicalData = {}) => {
    if (!sym) return null

    try {
      const response = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: sym,
          data: {
            technicals: {
              score: technicalData.score ?? 50,
              ...technicalData.states
            },
            // Other data will be fetched by the API if needed
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      return result.score || result
    } catch (error) {
      console.error('[useProgressiveScore] API fetch error:', error)
      return null
    }
  }, [])

  // Progressive loading effect
  useEffect(() => {
    if (!symbol) {
      setState(s => ({ ...s, loading: false, error: 'No symbol provided' }))
      return
    }

    let cancelled = false

    const loadScores = async () => {
      // Phase 1: Calculate technical score instantly (if bars provided)
      if (bars && !skipTechnical) {
        const technicalResult = calculateTechnicalScore(bars)

        if (!cancelled && mountedRef.current) {
          const direction = getDirection(technicalResult.score)
          setState(s => ({
            ...s,
            score: technicalResult.score,
            maxPossible: 50,  // Technical only = 50% capacity
            loading: true,
            isComplete: false,
            direction,
            quality: getQuality(technicalResult.score),
            recommendation: getRecommendation(technicalResult.score, direction),
            breakdown: {
              technical: Math.round(technicalResult.score / 2), // Scale to 0-50 for display
              sentiment: null,
              forecast: null
            }
          }))
        }

        // Phase 2: Fetch full score from API
        if (autoFetchFull) {
          const fullResult = await fetchFullScore(symbol, technicalResult)

          if (!cancelled && mountedRef.current && fullResult) {
            const finalScore = fullResult.ultraUnicornScore ?? fullResult.score ?? technicalResult.score
            const direction = getDirection(finalScore)

            setState({
              score: finalScore,
              maxPossible: 100,
              isComplete: true,
              loading: false,
              direction,
              quality: getQuality(finalScore),
              recommendation: fullResult.recommendation || getRecommendation(finalScore, direction),
              breakdown: {
                technical: fullResult.components?.technical ?? Math.round(technicalResult.score / 2),
                sentiment: fullResult.components?.sentiment ?? null,
                forecast: fullResult.components?.forecast ?? null
              },
              bonuses: fullResult.bonuses || null,
              error: null
            })
          } else if (!cancelled && mountedRef.current) {
            // API failed, keep technical score
            setState(s => ({
              ...s,
              loading: false,
              isComplete: false,
              error: 'Full score unavailable'
            }))
          }
        }
      } else if (autoFetchFull) {
        // No bars provided, fetch directly from API
        setState(s => ({ ...s, loading: true }))

        const fullResult = await fetchFullScore(symbol)

        if (!cancelled && mountedRef.current && fullResult) {
          const finalScore = fullResult.ultraUnicornScore ?? fullResult.score ?? 50
          const direction = getDirection(finalScore)

          setState({
            score: finalScore,
            maxPossible: 100,
            isComplete: true,
            loading: false,
            direction,
            quality: getQuality(finalScore),
            recommendation: fullResult.recommendation || getRecommendation(finalScore, direction),
            breakdown: {
              technical: fullResult.components?.technical ?? null,
              sentiment: fullResult.components?.sentiment ?? null,
              forecast: fullResult.components?.forecast ?? null
            },
            bonuses: fullResult.bonuses || null,
            error: null
          })
        } else if (!cancelled && mountedRef.current) {
          setState(s => ({
            ...s,
            score: 50,
            direction: 'neutral',
            loading: false,
            isComplete: false,
            error: 'Score unavailable'
          }))
        }
      }
    }

    loadScores()

    return () => {
      cancelled = true
    }
  }, [symbol, bars, skipTechnical, autoFetchFull, calculateTechnicalScore, fetchFullScore])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!symbol) return

    setState(s => ({ ...s, loading: true }))

    const technicalResult = bars ? calculateTechnicalScore(bars) : { score: 50, direction: 'neutral' }
    const fullResult = await fetchFullScore(symbol, technicalResult)

    if (mountedRef.current && fullResult) {
      const finalScore = fullResult.ultraUnicornScore ?? fullResult.score ?? technicalResult.score
      const direction = getDirection(finalScore)

      setState({
        score: finalScore,
        maxPossible: 100,
        isComplete: true,
        loading: false,
        direction,
        quality: getQuality(finalScore),
        recommendation: fullResult.recommendation || getRecommendation(finalScore, direction),
        breakdown: {
          technical: fullResult.components?.technical ?? null,
          sentiment: fullResult.components?.sentiment ?? null,
          forecast: fullResult.components?.forecast ?? null
        },
        bonuses: fullResult.bonuses || null,
        error: null
      })
    }
  }, [symbol, bars, calculateTechnicalScore, fetchFullScore])

  return {
    ...state,
    refresh,
    // Helper computed values
    isBullish: state.direction === 'bullish',
    isBearish: state.direction === 'bearish',
    isNeutral: state.direction === 'neutral',
    isLongOpportunity: state.direction === 'bullish' && state.score >= 60,
    isShortOpportunity: state.direction === 'bearish' && state.score <= 44,
  }
}

export default useProgressiveScore
