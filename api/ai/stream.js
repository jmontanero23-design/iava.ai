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

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { messages, model = 'gpt-5-nano' } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
    }

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
      // Enable tool calling for market data access
      tools: {
        getMarketData: {
          description: 'Fetch live market data for analysis',
          parameters: {
            type: 'object',
            properties: {
              symbol: { type: 'string', description: 'Stock symbol' },
              timeframe: { type: 'string', description: 'Timeframe (1, 5, 15, 60, D)' }
            },
            required: ['symbol']
          },
          execute: async ({ symbol, timeframe = '15' }) => {
            // This would call your existing market data API
            const response = await fetch(`${process.env.VERCEL_URL || ''}/api/market/bars`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symbol, timeframe, limit: 100 })
            })
            const data = await response.json()
            return data
          }
        },
        calculateUnicornScore: {
          description: 'Calculate AI-powered Unicorn Score for a symbol',
          parameters: {
            type: 'object',
            properties: {
              symbol: { type: 'string', description: 'Stock symbol' }
            },
            required: ['symbol']
          },
          execute: async ({ symbol }) => {
            // This would call your existing score API
            const response = await fetch(`${process.env.VERCEL_URL || ''}/api/ai/score`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symbol, data: {} })
            })
            const score = await response.json()
            return score
          }
        }
      }
    })

    // Return as a streaming response
    return result.toDataStreamResponse()

  } catch (error) {
    console.error('[Stream API] Error:', error)
    return res.status(500).json({
      error: error?.message || 'Streaming failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}