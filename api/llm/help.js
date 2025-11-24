/**
 * Ask AI / HelpFab - In-app Trading Assistant
 * Using Vercel AI SDK with OpenAI
 */

import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const provider = (process.env.LLM_PROVIDER || '').toLowerCase()
    const openaiKey = process.env.OPENAI_API_KEY

    if (!provider) return res.status(500).json({ error: 'LLM_PROVIDER not set' })

    // Vercel automatically parses JSON body
    const { question = '', context = {} } = req.body || {}
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Missing question' })
    }

    const system = `You are an in-app trading assistant for iAVA.ai.
Answer succinctly. You can explain indicators (EMA clouds, Pivot Ribbon, Ichimoku, SATY, TTM Squeeze), scoring (Unicorn Score), Daily confluence rules, backtesting panels, scanner usage, and risk guards.
Do not give financial advice; provide usage guidance and interpretations only.`

    const prompt = `User question: ${question}\n\nCurrent context (JSON): ${JSON.stringify(context)}`

    let result

    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })

      const model = process.env.LLM_MODEL_EXPLAIN || 'gpt-5-nano'
      const isReasoningModel = model.includes('gpt-5') || model.includes('o1') || model.includes('o3') || model.includes('o4')
      const isNewModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o1') || model.includes('o3') || model.includes('o4')

      // Use Vercel AI SDK - same as AI Gateway
      result = await generateText({
        model: openai(model, { apiKey: openaiKey }),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        maxTokens: isNewModel ? 2000 : 350,
        temperature: isNewModel ? undefined : 0.2,
        abortSignal: AbortSignal.timeout(isReasoningModel ? 60000 : 15000)
      })

    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
    }

    // Return answer in same format as before
    res.status(200).json({ answer: result.text })

  } catch (e) {
    console.error('[Help API] Error:', e)
    // Ensure we always return JSON even on error
    const errorMessage = e?.message || 'Unexpected error'
    // Make sure response is JSON
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json')
      res.status(500).json({
        error: errorMessage,
        answer: 'I apologize, but I am currently unable to process your request. Please try again later or check if all AI services are properly configured.'
      })
    }
  }
}
