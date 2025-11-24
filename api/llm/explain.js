/**
 * Signal Explanation API
 * Now using Vercel AI SDK (same as AI Gateway)
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
    const { state = {}, threshold = 70, enforceDaily = false } = req.body || {}
    const prompt = buildExplainPrompt(state, { threshold, enforceDaily })

    let result

    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })

      const model = process.env.LLM_MODEL_EXPLAIN || 'gpt-5-nano'
      const isReasoningModel = model.includes('gpt-5') || model.includes('o1') || model.includes('o3') || model.includes('o4')
      const isNewModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o1') || model.includes('o3') || model.includes('o4')

      // Use Vercel AI SDK with JSON mode
      result = await generateText({
        model: openai(model, { apiKey: openaiKey }),
        messages: [
          { role: 'system', content: SYSTEM_EXPLAIN },
          { role: 'user', content: prompt }
        ],
        maxTokens: isNewModel ? 2000 : 300,
        temperature: isNewModel ? undefined : 0.2,
        responseFormat: { type: 'json' },
        abortSignal: AbortSignal.timeout(isReasoningModel ? 60000 : 15000)
      })

    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
    }

    // Parse JSON response
    const out = safeJsonFromText(result.text)
    res.status(200).json(out)

  } catch (e) {
    console.error('[Explain API] Error:', e)
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

const SYSTEM_EXPLAIN = `You explain trading signals succinctly without giving financial advice.
Return strict JSON with keys: explanation (string), highlights (array of strings), confidence (0..1).
Do not include recommendations or guarantees.`

function buildExplainPrompt(state, opts) {
  const s = JSON.stringify({
    symbol: state?._bars?.[state?._bars?.length-1]?.symbol || 'UNKNOWN',
    timeframe: state?._timeframe || 'UNKNOWN',
    score: state?.score,
    components: state?.components,
    pivot: state?.pivotNow,
    ripster3450: state?.rip?.bias,
    ichimoku: state?.ichiRegime,
    satyDir: state?.satyDir,
    squeeze: state?.sq?.fired ? `fired ${state?.sq?.dir}` : (state?.sq?.on ? 'on' : 'off'),
    daily: state?._daily ? { pivot: state._daily.pivotNow, ichi: state._daily.ichiRegime } : null,
    threshold: opts.threshold,
    enforceDaily: !!opts.enforceDaily,
  })
  return `Context: ${s}
Explain briefly why the current score looks the way it does. No advice.`
}

function safeJsonFromText(text) {
  if (!text) return { explanation: '', highlights: [], confidence: 0.5 }

  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {}

  // Try to extract JSON object if wrapped in code fences
  const m = text.match(/\{[\s\S]*\}/)
  if (m) {
    try {
      return JSON.parse(m[0])
    } catch {}
  }

  // Fallback: return text as explanation
  return { explanation: text, highlights: [], confidence: 0.5 }
}
