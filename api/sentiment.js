/**
 * Sentiment Analysis API - PhD++ Financial Sentiment
 * Analyzes text sentiment using financial-tuned NLP models
 *
 * Models (in order of priority):
 * 1. ProsusAI/finbert - Financial news specialist
 * 2. finiteautomata/bertweet-base-sentiment-analysis - Twitter-trained (fast)
 * 3. cardiffnlp/twitter-roberta-base-sentiment-latest - Latest RoBERTa (PhD++ FIXED!)
 *
 * Returns: sentiment (positive/negative/neutral) + confidence score (-1 to +1)
 */

const MODELS = [
  'ProsusAI/finbert',                                      // Primary: Financial specialist
  'finiteautomata/bertweet-base-sentiment-analysis',      // Secondary: Fast, Twitter-trained
  'cardiffnlp/twitter-roberta-base-sentiment-latest'      // Fallback: Latest RoBERTa (PhD++ FIXED: distilbert returned 404!)
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, useMultiModel = false } = req.body

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' })
  }

  try {
    const hfApiKey = process.env.HUGGINGFACE_API_KEY

    if (!hfApiKey) {
      console.warn('[Sentiment API] HuggingFace API key not configured - returning neutral')
      return res.status(200).json({
        sentiment: 'neutral',
        label: 'NEUTRAL',
        score: 0,
        confidence: 0.5,
        fallback: true,
        reason: 'API key not configured'
      })
    }


    // Multi-model ensemble analysis for higher accuracy
    if (useMultiModel) {
      const multiResult = await analyzeMultiModel(text, hfApiKey)
      return res.status(200).json(multiResult)
    }

    // Single model analysis with fallback chain
    for (const model of MODELS) {
      try {
        // ✅ FIXED: Updated to new HuggingFace Inference API endpoint (Jan 2025)
        const response = await fetch(
          `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Sentiment API] ❌ HuggingFace API error:', {
        model,
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        headers: Object.fromEntries(response.headers.entries())
      })

      // If model is loading, return neutral sentiment
      if (response.status === 503) {
        return res.status(200).json({
          sentiment: 'neutral',
          label: 'NEUTRAL',
          score: 0.5,
          modelLoading: true
        })
      }

      // Continue to next model instead of throwing
      console.warn(`[Sentiment API] Model ${model} failed with ${response.status}, trying next model...`)
      continue
    }

    const result = await response.json()

    // HuggingFace returns array of label/score pairs
    // Format: [[{label: "POSITIVE", score: 0.9}, {label: "NEGATIVE", score: 0.1}]]
    let sentimentData

    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0])) {
        // Nested array format
        sentimentData = result[0]
      } else {
        // Direct array format
        sentimentData = result
      }
    } else {
      throw new Error('Unexpected response format from HuggingFace')
    }

    // Find the highest confidence sentiment
    const topSentiment = sentimentData.reduce((max, current) =>
      current.score > max.score ? current : max
    )

        // Normalize label and convert to -1 to +1 scale
        const label = topSentiment.label.toLowerCase()
        let sentiment = 'neutral'
        let normalizedScore = 0

        if (label.includes('pos') || label.includes('bullish')) {
          sentiment = 'positive'
          normalizedScore = topSentiment.score
        } else if (label.includes('neg') || label.includes('bearish')) {
          sentiment = 'negative'
          normalizedScore = -topSentiment.score
        }


        return res.status(200).json({
          sentiment,
          label: topSentiment.label,
          score: normalizedScore,
          confidence: topSentiment.score,
          model: model.split('/')[1],
          text: text.substring(0, 200),
          allScores: sentimentData
        })

      } catch (modelError) {
        console.error(`[Sentiment API] ❌ Model ${model} exception:`, {
          error: modelError.message,
          stack: modelError.stack
        })
        // Continue to next model
        continue
      }
    }

    // All models failed - return detailed error
    console.error('[Sentiment API] 🚨 ALL MODELS FAILED - Check HuggingFace API key and quota')
    console.error('[Sentiment API] Tried models:', MODELS)
    throw new Error('All sentiment models failed - check API key validity and rate limits')

  } catch (error) {
    console.error('[Sentiment API] Error:', error)
    // Return 200 with neutral sentiment instead of 500 to avoid breaking the UI
    return res.status(200).json({
      sentiment: 'neutral',
      label: 'NEUTRAL',
      score: 0,
      confidence: 0.5,
      error: error.message || 'Sentiment analysis failed',
      fallback: true
    })
  }
}

/**
 * Multi-model ensemble analysis for PhD++ accuracy
 */
async function analyzeMultiModel(text, apiKey) {
  try {
    const results = await Promise.allSettled(
      MODELS.map(model => analyzeSingleModel(text, model, apiKey))
    )

    const successful = results
      .filter(r => r.status === 'fulfilled' && r.value && !r.value.error)
      .map(r => r.value)

    if (successful.length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        error: 'All models failed',
        fallback: true
      }
    }

    // Calculate weighted average (higher confidence = higher weight)
    const totalConfidence = successful.reduce((sum, r) => sum + r.confidence, 0)
    const weightedScore = successful.reduce(
      (sum, r) => sum + (r.score * r.confidence),
      0
    ) / totalConfidence

    // Determine consensus
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
      models: successful.map(r => ({
        model: r.model,
        sentiment: r.sentiment,
        score: r.score,
        confidence: r.confidence
      })),
      modelsUsed: successful.length,
      text: text.substring(0, 200)
    }

  } catch (error) {
    console.error('[Sentiment API] Multi-model error:', error)
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      error: error.message,
      fallback: true
    }
  }
}

/**
 * Analyze with a single model
 */
async function analyzeSingleModel(text, model, apiKey) {
  const truncatedText = text.length > 512 ? text.substring(0, 512) : text

  // ✅ FIXED: Updated to new HuggingFace Inference API endpoint (Jan 2025)
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: truncatedText,
        options: { wait_for_model: true }
      })
    }
  )

  if (!response.ok) {
    if (response.status === 503) {
      // Model loading - wait and retry once
      await new Promise(resolve => setTimeout(resolve, 2000))
      return analyzeSingleModel(text, model, apiKey)
    }
    throw new Error(`Model ${model} returned ${response.status}`)
  }

  const result = await response.json()

  let sentimentData
  if (Array.isArray(result) && result.length > 0) {
    sentimentData = Array.isArray(result[0]) ? result[0] : result
  } else {
    throw new Error('Invalid response format')
  }

  const topSentiment = sentimentData.reduce((max, current) =>
    current.score > max.score ? current : max
  )

  const label = topSentiment.label.toLowerCase()
  let sentiment = 'neutral'
  let normalizedScore = 0

  if (label.includes('pos') || label.includes('bullish')) {
    sentiment = 'positive'
    normalizedScore = topSentiment.score
  } else if (label.includes('neg') || label.includes('bearish')) {
    sentiment = 'negative'
    normalizedScore = -topSentiment.score
  }

  return {
    sentiment,
    score: normalizedScore,
    confidence: topSentiment.score,
    model: model.split('/')[1]
  }
}
