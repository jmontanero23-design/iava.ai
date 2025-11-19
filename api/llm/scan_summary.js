/**
 * Scan Summary API
 * Now using Vercel AI SDK (same as AI Gateway)
 */

import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const provider = (process.env.LLM_PROVIDER || '').toLowerCase()
    const openaiKey = process.env.OPENAI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!provider) return res.status(500).json({ error: 'LLM_PROVIDER not set' })

    // Vercel automatically parses JSON body
    const { result } = req.body || {}
    if (!result || typeof result !== 'object') {
      return res.status(400).json({ error: 'Missing scan result' })
    }

    const prompt = buildScanSummaryPrompt(result)
    const model = process.env.LLM_MODEL_EXPLAIN || 'gpt-5-nano'

    let output

    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })

      const isReasoningModel = model.includes('gpt-5') || model.includes('o1') || model.includes('o3') || model.includes('o4')
      const isNewModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o1') || model.includes('o3') || model.includes('o4')

      // Use Vercel AI SDK with JSON mode
      output = await generateText({
        model: openai(model, { apiKey: openaiKey }),
        messages: [
          { role: 'user', content: prompt }
        ],
        maxTokens: isNewModel ? 2000 : 300,
        temperature: isNewModel ? undefined : 0.2,
        responseFormat: { type: 'json' },
        abortSignal: AbortSignal.timeout(isReasoningModel ? 60000 : 12000)
      })

    } else if (provider === 'anthropic') {
      if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' })

      const anthropicModel = process.env.LLM_MODEL_EXPLAIN || 'claude-sonnet-4-5'

      // Use Vercel AI SDK for Anthropic
      output = await generateText({
        model: anthropic(anthropicModel, { apiKey: anthropicKey }),
        system: 'Return concise JSON only.',
        messages: [
          { role: 'user', content: prompt }
        ],
        maxTokens: 300,
        abortSignal: AbortSignal.timeout(12000)
      })

    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
    }

    // Parse JSON response
    let summary
    try {
      summary = JSON.parse(output.text)
    } catch {
      summary = { bullets: [output.text], quick_take: '' }
    }

    res.status(200).json({ summary })

  } catch (e) {
    console.error('[Scan Summary API] Error:', e)
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

function buildScanSummaryPrompt(r) {
  const compact = {
    timeframe: r.timeframe,
    threshold: r.threshold,
    enforceDaily: !!r.enforceDaily,
    universe: r.universe,
    counts: r.counts || {},
    longs: (r.longs || []).slice(0, 20).map(x => ({ s: x.symbol, sc: Math.round(x.score) })),
    shorts: (r.shorts || []).slice(0, 20).map(x => ({ s: x.symbol, sc: Math.round(x.score) })),
  }
  return `Summarize this scan result for a trader in 5 bullets max (no advice). Focus on quality, alignment (daily if present), and standout scores. JSON only with { bullets: string[], quick_take: string }\n\n${JSON.stringify(compact)}`
}
