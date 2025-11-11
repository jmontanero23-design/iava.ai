/**
 * React Hook for Genetic Algorithm Optimization
 * Makes it easy to run GA optimization in React components
 */

import { useState, useCallback, useRef } from 'react'
import { optimizeWithGA, quickOptimize } from '../utils/geneticOptimizer.js'

export function useGeneticOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const abortRef = useRef(false)

  const optimize = useCallback(async (options) => {
    setIsOptimizing(true)
    setProgress(null)
    setResult(null)
    setError(null)
    abortRef.current = false

    try {
      const { mode = 'ga', ...restOptions } = options

      const onProgress = (data) => {
        if (abortRef.current) {
          throw new Error('Optimization aborted')
        }
        setProgress(data)
      }

      let optimizationResult

      if (mode === 'quick') {
        optimizationResult = await quickOptimize({
          ...restOptions,
          onProgress
        })
      } else {
        optimizationResult = await optimizeWithGA({
          ...restOptions,
          onProgress
        })
      }

      setResult(optimizationResult)
      return optimizationResult

    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsOptimizing(false)
    }
  }, [])

  const abort = useCallback(() => {
    abortRef.current = true
  }, [])

  const reset = useCallback(() => {
    setIsOptimizing(false)
    setProgress(null)
    setResult(null)
    setError(null)
    abortRef.current = false
  }, [])

  return {
    optimize,
    abort,
    reset,
    isOptimizing,
    progress,
    result,
    error
  }
}

export default useGeneticOptimizer
