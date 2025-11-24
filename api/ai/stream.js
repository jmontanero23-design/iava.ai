/**
 * Streaming AI Chat Endpoint
 * Provides real-time token streaming for better UX
 * Users see responses as they're generated, not after 15-30 seconds
 */

import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const config = {
  runtime: 'edge',
  maxDuration: 30,
}

// System prompt for trading context
const TRADING_SYSTEM_PROMPT = `You are an elite AI trading assistant for iAVA.ai, a sophisticated trading platform.
You have access to real-time market data, technical indicators, and advanced analytics.

Key capabilities:
- Unicorn Score: AI-powered trade scoring (0-100)
- Multi-timeframe analysis (1min to Daily)
- Technical indicators: EMA Cloud, Pivot Ribbon, Ichimoku, TTM Squeeze, SATY
- Backtesting and optimization
- Market regime detection
- Options Greeks analysis
- Volume profile analysis

Always provide actionable, data-driven insights. Be concise but thorough.
When discussing trades, mention relevant indicators and confluence factors.
Never provide financial advice, only analysis and education.`

export default async function handler(req) {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const body = await req.json()
    const { messages, model = 'gpt-5-nano' } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    console.log('[Stream API] Processing request for model:', model)
    console.log('[Stream API] Messages:', messages.length)

    // Determine if it's a reasoning model
    const isReasoningModel = model.includes('gpt-5') || model.includes('o1') || model.includes('o3') || model.includes('o4')
    const isNewModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o1') || model.includes('o3') || model.includes('o4')

    // Stream the response
    const result = await streamText({
      model: openai(model, { apiKey: openaiKey }),
      system: TRADING_SYSTEM_PROMPT,
      messages,
      maxTokens: isNewModel ? 2000 : 500,
      temperature: isNewModel ? undefined : 0.2,
    })

    // Use the toTextStreamResponse() method for proper streaming
    const response = result.toTextStreamResponse()

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response

  } catch (error) {
    console.error('[Stream API] Error:', error)
    return new Response(
      JSON.stringify({
        error: error?.message || 'Streaming failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}