/**
 * HuggingFace Sentiment Analysis API Endpoint
 *
 * Provides sentiment analysis using HuggingFace models
 * with caching and multiple model support
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, texts, model = 'bertweet', useMultipleModels = false } = req.body

    if (!text && (!texts || !Array.isArray(texts))) {
      return res.status(400).json({ error: 'Missing text or texts parameter' })
    }

    const API_KEY = process.env.HUGGINGFACE_API_KEY

    if (!API_KEY) {
      return res.status(500).json({
        error: 'HuggingFace API key not configured',
        fallback: true,
        sentiment: 'neutral',
        score: 0
      })
    }

    // Single text analysis
    if (text) {
      if (useMultipleModels) {
        const result = await analyzeMultiModel(text, API_KEY)
        return res.status(200).json(result)
      } else {
        const result = await analyzeSingle(text, model, API_KEY)
        return res.status(200).json(result)
      }
    }

    // Batch analysis
    if (texts) {
      const results = await Promise.all(
        texts.map(t => analyzeSingle(t, model, API_KEY))
      )
      return res.status(200).json({ results })
    }

  } catch (error) {
    console.error('[HuggingFace API] Error:', error)
    return res.status(500).json({
      error: error.message,
      fallback: true,
      sentiment: 'neutral',
      score: 0
    })
  }
}

/**
 * Analyze single text with specified model
 */
async function analyzeSingle(text, modelKey, apiKey) {
  const MODELS = {
    bertweet: 'finiteautomata/bertweet-base-sentiment-analysis',
    finbert: 'ProsusAI/finbert',
    roberta: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
  }

  const modelName = MODELS[modelKey] || MODELS.bertweet

  try {
    const truncatedText = text.length > 512 ? text.substring(0, 512) : text

    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${modelName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: truncatedText }),
      }
    )

    if (!response.ok) {
      // Model loading - wait and retry
      if (response.status === 503) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        return analyzeSingle(text, modelKey, apiKey)
      }

      throw new Error(`API returned ${response.status}`)
    }

    const result = await response.json()

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Invalid API response')
    }

    const topResult = result[0][0] || result[0]
    const label = (topResult.label || '').toLowerCase()
    const score = topResult.score || 0

    let sentiment = 'neutral'
    let normalizedScore = 0

    if (label.includes('pos') || label.includes('bullish')) {
      sentiment = 'positive'
      normalizedScore = score
    } else if (label.includes('neg') || label.includes('bearish')) {
      sentiment = 'negative'
      normalizedScore = -score
    }

    return {
      sentiment,
      score: normalizedScore,
      confidence: score,
      label: topResult.label,
      model: modelName.split('/')[1]
    }

  } catch (error) {
    console.error('[HuggingFace] Single analysis error:', error)
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      error: error.message
    }
  }
}

/**
 * Analyze with multiple models and aggregate
 */
async function analyzeMultiModel(text, apiKey) {
  try {
    const results = await Promise.allSettled([
      analyzeSingle(text, 'bertweet', apiKey),
      analyzeSingle(text, 'finbert', apiKey),
      analyzeSingle(text, 'roberta', apiKey)
    ])

    const successful = results
      .filter(r => r.status === 'fulfilled' && !r.value.error)
      .map(r => r.value)

    if (successful.length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        error: 'All models failed'
      }
    }

    const totalConfidence = successful.reduce((sum, r) => sum + r.confidence, 0)
    const weightedScore = successful.reduce(
      (sum, r) => sum + (r.score * r.confidence),
      0
    ) / totalConfidence

    const positive = successful.filter(r => r.sentiment === 'positive').length
    const negative = successful.filter(r => r.sentiment === 'negative').length

    let consensus = 'mixed'
    if (positive === successful.length) consensus = 'strong_positive'
    else if (negative === successful.length) consensus = 'strong_negative'
    else if (positive > negative) consensus = 'positive'
    else if (negative > positive) consensus = 'negative'

    return {
      sentiment: weightedScore > 0.1 ? 'positive' :
                 weightedScore < -0.1 ? 'negative' : 'neutral',
      score: weightedScore,
      confidence: totalConfidence / successful.length,
      consensus,
      models: successful
    }

  } catch (error) {
    console.error('[HuggingFace] Multi-model error:', error)
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      error: error.message
    }
  }
}
