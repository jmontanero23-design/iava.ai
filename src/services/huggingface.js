/**
 * HuggingFace Inference API Service
 *
 * PhD++ Quality: Production-ready sentiment analysis with multiple models,
 * caching, fallbacks, and error handling.
 *
 * Models Used:
 * 1. finiteautomata/bertweet-base-sentiment-analysis - Fast, Twitter-trained
 * 2. ProsusAI/finbert - Financial news specialist
 * 3. cardiffnlp/twitter-roberta-base-sentiment-latest - Latest Twitter model
 */

const MODELS = {
  bertweet: 'finiteautomata/bertweet-base-sentiment-analysis',
  finbert: 'ProsusAI/finbert',
  roberta: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache = new Map()

/**
 * Query HuggingFace Inference API
 */
async function queryHuggingFace(text, model = MODELS.bertweet) {
  const API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY ||
                  process.env.HUGGINGFACE_API_KEY

  if (!API_KEY) {
    console.warn('[HuggingFace] No API key configured')
    return null
  }

  const cacheKey = `${model}:${text}`
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[HuggingFace] Cache hit:', cacheKey.substring(0, 50))
    return cached.data
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('[HuggingFace] API error:', response.status, error)

      // Model is loading - retry after delay
      if (response.status === 503) {
        console.log('[HuggingFace] Model loading, will retry...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        return queryHuggingFace(text, model) // Retry once
      }

      return null
    }

    const result = await response.json()

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    // Clean old cache entries
    if (cache.size > 1000) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      entries.slice(0, 500).forEach(([key]) => cache.delete(key))
    }

    return result
  } catch (error) {
    console.error('[HuggingFace] Query error:', error)
    return null
  }
}

/**
 * Analyze sentiment with fallback models
 * Returns normalized sentiment score (-1 to +1)
 */
export async function analyzeSentiment(text, options = {}) {
  const {
    model = 'bertweet',
    useMultipleModels = false,
    timeout = 10000
  } = options

  if (!text || text.trim().length === 0) {
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      label: 'neutral',
      error: 'Empty text'
    }
  }

  // Truncate very long text
  const truncatedText = text.length > 512
    ? text.substring(0, 512) + '...'
    : text

  try {
    // Try primary model
    const modelName = MODELS[model] || MODELS.bertweet
    let result = await Promise.race([
      queryHuggingFace(truncatedText, modelName),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ])

    // Fallback to bertweet if primary fails
    if (!result && model !== 'bertweet') {
      console.log('[HuggingFace] Falling back to bertweet')
      result = await queryHuggingFace(truncatedText, MODELS.bertweet)
    }

    if (!result || !Array.isArray(result) || result.length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        label: 'neutral',
        error: 'No result from API'
      }
    }

    // Parse result (format: [{ label: 'POS', score: 0.9 }, ...])
    const topResult = result[0][0] || result[0]

    // Normalize label
    let sentiment = 'neutral'
    let normalizedScore = 0

    const label = (topResult.label || '').toLowerCase()
    const score = topResult.score || 0

    if (label.includes('pos') || label.includes('bullish')) {
      sentiment = 'positive'
      normalizedScore = score
    } else if (label.includes('neg') || label.includes('bearish')) {
      sentiment = 'negative'
      normalizedScore = -score
    } else {
      sentiment = 'neutral'
      normalizedScore = 0
    }

    return {
      sentiment,
      score: normalizedScore,
      confidence: score,
      label: topResult.label,
      raw: result[0],
      model: modelName.split('/')[1]
    }

  } catch (error) {
    console.error('[HuggingFace] Analysis error:', error)
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      label: 'neutral',
      error: error.message
    }
  }
}

/**
 * Analyze sentiment using multiple models and aggregate
 * PhD++ Quality: Ensemble approach for higher accuracy
 */
export async function analyzeMultiModel(text) {
  if (!text || text.trim().length === 0) {
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      consensus: 'none'
    }
  }

  try {
    // Query all models in parallel
    const results = await Promise.allSettled([
      analyzeSentiment(text, { model: 'bertweet' }),
      analyzeSentiment(text, { model: 'finbert' }),
      analyzeSentiment(text, { model: 'roberta' })
    ])

    // Extract successful results
    const successfulResults = results
      .filter(r => r.status === 'fulfilled' && !r.value.error)
      .map(r => r.value)

    if (successfulResults.length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        consensus: 'none',
        error: 'All models failed'
      }
    }

    // Calculate weighted average
    const totalConfidence = successfulResults.reduce((sum, r) => sum + r.confidence, 0)
    const weightedScore = successfulResults.reduce(
      (sum, r) => sum + (r.score * r.confidence),
      0
    ) / totalConfidence

    // Determine consensus
    const positive = successfulResults.filter(r => r.sentiment === 'positive').length
    const negative = successfulResults.filter(r => r.sentiment === 'negative').length
    const neutral = successfulResults.filter(r => r.sentiment === 'neutral').length

    let consensus = 'mixed'
    if (positive === successfulResults.length) consensus = 'strong_positive'
    else if (negative === successfulResults.length) consensus = 'strong_negative'
    else if (neutral === successfulResults.length) consensus = 'neutral'
    else if (positive > negative) consensus = 'positive'
    else if (negative > positive) consensus = 'negative'

    return {
      sentiment: weightedScore > 0.1 ? 'positive' :
                 weightedScore < -0.1 ? 'negative' : 'neutral',
      score: weightedScore,
      confidence: totalConfidence / successfulResults.length,
      consensus,
      models: successfulResults.map(r => ({
        model: r.model,
        sentiment: r.sentiment,
        score: r.score,
        confidence: r.confidence
      }))
    }

  } catch (error) {
    console.error('[HuggingFace] Multi-model error:', error)
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      consensus: 'none',
      error: error.message
    }
  }
}

/**
 * Batch analyze multiple texts
 */
export async function analyzeBatch(texts, options = {}) {
  const { maxConcurrent = 3 } = options

  const results = []
  for (let i = 0; i < texts.length; i += maxConcurrent) {
    const batch = texts.slice(i, i + maxConcurrent)
    const batchResults = await Promise.all(
      batch.map(text => analyzeSentiment(text, options))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache() {
  cache.clear()
  console.log('[HuggingFace] Cache cleared')
}

export default {
  analyzeSentiment,
  analyzeMultiModel,
  analyzeBatch,
  clearCache,
  MODELS
}
