/**
 * AI Gateway - Vercel Serverless Function
 * Handles AI requests with OpenAI GPT-5 (latest model)
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      timestamp: Date.now(),
      message: 'AI Gateway is running'
    })
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { model, messages, options } = req.body

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' })
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured. Set OPENAI_API_KEY in environment variables.'
      })
    }

    const startTime = Date.now()
    const selectedModel = model || 'gpt-5'

    // GPT-5 only supports default parameter values - can't customize temperature, top_p, etc.
    // Other models (gpt-4o, gpt-4o-mini, gpt-3.5-turbo) support custom parameters
    const isGPT5 = selectedModel.startsWith('gpt-5') || selectedModel.startsWith('gpt-4.1')

    const payload = {
      model: selectedModel,
      messages,
      max_completion_tokens: options?.max_tokens ?? 500
    }

    // Only add optional parameters for models that support them
    if (!isGPT5) {
      payload.temperature = options?.temperature ?? 0.7
      payload.top_p = options?.top_p ?? 1
      payload.frequency_penalty = options?.frequency_penalty ?? 0
      payload.presence_penalty = options?.presence_penalty ?? 0
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[AI Gateway] OpenAI error:', error)
      return res.status(response.status).json({
        error: error.error?.message || 'OpenAI API error'
      })
    }

    const data = await response.json()
    const latency = Date.now() - startTime

    // Calculate cost
    const cost = calculateCost(data.usage, model || 'gpt-5')

    // Return formatted response
    return res.status(200).json({
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      cost,
      latency,
      cached: false,
      model: data.model
    })

  } catch (error) {
    console.error('[AI Gateway] Error:', error)
    return res.status(500).json({
      error: error.message || 'Internal server error'
    })
  }
}

/**
 * Calculate API cost based on token usage
 */
function calculateCost(usage, model) {
  // Pricing as of 2025 (per 1K tokens)
  const pricing = {
    'gpt-5': {
      prompt: 0.01,
      completion: 0.03
    },
    'gpt-4.1': {
      prompt: 0.005,
      completion: 0.015
    },
    'gpt-4.1-mini': {
      prompt: 0.0002,
      completion: 0.0008
    },
    'gpt-4o': {
      prompt: 0.005,
      completion: 0.015
    },
    'gpt-4o-mini': {
      prompt: 0.00015,
      completion: 0.0006
    },
    'gpt-4-turbo': {
      prompt: 0.01,
      completion: 0.03
    },
    'gpt-3.5-turbo': {
      prompt: 0.0005,
      completion: 0.0015
    }
  }

  const rates = pricing[model] || pricing['gpt-5']

  const promptCost = (usage.prompt_tokens / 1000) * rates.prompt
  const completionCost = (usage.completion_tokens / 1000) * rates.completion

  return parseFloat((promptCost + completionCost).toFixed(6))
}
