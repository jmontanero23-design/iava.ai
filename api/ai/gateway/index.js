/**
 * AI Gateway - Vercel AI SDK
 * Clean, simple gateway using official Vercel AI SDK
 */

import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

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
      message: 'AI Gateway is running with Vercel AI SDK'
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
        error: 'OpenAI API key not configured'
      })
    }

    const startTime = Date.now()
    const selectedModel = model || 'gpt-5-nano'

    console.log('[AI Gateway SDK] Calling:', selectedModel, 'messages:', messages.length)

    // Use Vercel AI SDK
    const result = await generateText({
      model: openai(selectedModel),
      messages,
      maxTokens: options?.max_tokens || 500,
      temperature: options?.temperature !== undefined ? options.temperature : 0.7,
    })

    const latency = Date.now() - startTime

    console.log('[AI Gateway SDK] Success! Latency:', latency, 'ms')

    // Calculate cost
    const cost = calculateCost(result.usage, selectedModel)

    // Return formatted response
    return res.status(200).json({
      content: result.text,
      usage: {
        prompt_tokens: result.usage.promptTokens,
        completion_tokens: result.usage.completionTokens,
        total_tokens: result.usage.totalTokens
      },
      cost,
      latency,
      cached: false,
      model: selectedModel
    })

  } catch (error) {
    console.error('[AI Gateway SDK] Error:', error)
    return res.status(500).json({
      error: error.message || 'Internal server error'
    })
  }
}

/**
 * Calculate cost based on model pricing
 */
function calculateCost(usage, model) {
  // Pricing per 1M tokens (updated 2025)
  // GPT-5 and GPT-5-mini support vision at same text pricing!
  const pricing = {
    'gpt-5-nano': { input: 0.05, output: 0.40 },
    'gpt-5-mini': { input: 0.25, output: 2.00 }, // Vision supported
    'gpt-5': { input: 1.25, output: 10.00 }, // Vision supported
    'gpt-4.1-nano': { input: 0.10, output: 0.40 },
    'gpt-4.1-mini': { input: 0.40, output: 1.60 },
    'gpt-4.1': { input: 2.00, output: 8.00 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
  }

  const rates = pricing[model] || pricing['gpt-5-nano']

  const promptCost = (usage.promptTokens / 1000000) * rates.input
  const completionCost = (usage.completionTokens / 1000000) * rates.output

  return parseFloat((promptCost + completionCost).toFixed(6))
}
