/**
 * Sentiment Analysis API - HuggingFace DistilBERT
 * Analyzes text sentiment using state-of-the-art NLP model
 *
 * Model: distilbert-base-uncased-finetuned-sst-2-english
 * Returns: sentiment (positive/negative/neutral) + confidence score
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body

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
        score: 0.5,
        fallback: true,
        reason: 'API key not configured'
      })
    }

    console.log('[Sentiment API] Analyzing:', text.substring(0, 100))

    // Call HuggingFace Inference API with DistilBERT sentiment model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
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
      console.error('[Sentiment API] HuggingFace error:', response.status, errorText)

      // If model is loading, return neutral sentiment
      if (response.status === 503) {
        console.log('[Sentiment API] Model loading, returning neutral sentiment')
        return res.status(200).json({
          sentiment: 'neutral',
          label: 'NEUTRAL',
          score: 0.5,
          modelLoading: true
        })
      }

      throw new Error(`HuggingFace API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('[Sentiment API] Raw result:', JSON.stringify(result))

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

    // Normalize label to lowercase sentiment
    const sentiment = topSentiment.label.toLowerCase() === 'positive' ? 'positive' :
                      topSentiment.label.toLowerCase() === 'negative' ? 'negative' :
                      'neutral'

    console.log('[Sentiment API] Result:', sentiment, topSentiment.score)

    return res.status(200).json({
      sentiment,
      label: topSentiment.label,
      score: topSentiment.score,
      text: text.substring(0, 200), // Echo back first 200 chars
      allScores: sentimentData
    })

  } catch (error) {
    console.error('[Sentiment API] Error:', error)
    // Return 200 with neutral sentiment instead of 500 to avoid breaking the UI
    return res.status(200).json({
      sentiment: 'neutral',
      label: 'NEUTRAL',
      score: 0.5,
      error: error.message || 'Sentiment analysis failed',
      fallback: true
    })
  }
}
