/**
 * Backtest Tuning API
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
    const { backtest, preference = 'robust' } = req.body || {}
    if (!backtest || typeof backtest !== 'object') {
      return res.status(400).json({ error: 'Missing backtest' })
    }

    const prompt = buildTunePrompt(backtest, preference)
    const model = process.env.LLM_MODEL_TUNE || process.env.LLM_MODEL_EXPLAIN || 'gpt-5-nano'

    let result

    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })

      const isReasoningModel = model.includes('gpt-5') || model.includes('o1') || model.includes('o3') || model.includes('o4')
      const isNewModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o1') || model.includes('o3') || model.includes('o4')

      // Use Vercel AI SDK with JSON mode
      result = await generateText({
        model: openai(model, { apiKey: openaiKey }),
        messages: [
          { role: 'user', content: prompt }
        ],
        maxTokens: isNewModel ? 2000 : 300,
        temperature: isNewModel ? undefined : 0.2,
        responseFormat: { type: 'json' },
        abortSignal: AbortSignal.timeout(isReasoningModel ? 60000 : 15000)
      })

    } else if (provider === 'anthropic') {
      if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' })

      const anthropicModel = process.env.LLM_MODEL_TUNE || 'claude-sonnet-4-5'

      // Use Vercel AI SDK for Anthropic
      result = await generateText({
        model: anthropic(anthropicModel, { apiKey: anthropicKey }),
        system: 'Return concise JSON only.',
        messages: [
          { role: 'user', content: prompt }
        ],
        maxTokens: 300,
        abortSignal: AbortSignal.timeout(15000)
      })

    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
    }

    // Parse JSON response
    let out
    try {
      out = JSON.parse(result.text)
    } catch {
      out = { params: {}, reason: result.text }
    }

    // Normalize
    try {
      const th = Number(out?.params?.th)
      const hz = Number(out?.params?.hz)
      out.params = {
        th: Number.isFinite(th) ? Math.max(0, Math.min(100, Math.round(th))) : undefined,
        hz: Number.isFinite(hz) ? Math.max(1, Math.min(100, Math.round(hz))) : undefined,
      }
    } catch {}

    res.status(200).json(out)

  } catch (e) {
    console.error('[Tune API] Error:', e)
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

function buildTunePrompt(bt, preference) {
  const compact = {
    threshold: bt.threshold,
    horizon: bt.horizon,
    events: bt.events,
    winRate: bt.winRate,
    avgFwd: bt.avgFwd,
    medianFwd: bt.medianFwd,
    profitFactor: bt.profitFactor,
    curve: (bt.curve || []).map(p => ({ th: p.th, avgFwd: p.avgFwd, medianFwd: p.medianFwd, winRate: p.winRate, events: p.events })),
    matrix: (bt.matrix || []).map(row => ({ hz: row.hz, curve: (row.curve || []).map(c => ({ th: c.th, avgFwd: c.avgFwd, medianFwd: c.medianFwd, winRate: c.winRate, events: c.events })) })),
  }
  return `Backtest summary: ${JSON.stringify(compact)}\n\nRecommend robust threshold/horizon (JSON only): { params: { th, hz }, reason }. Preference: ${preference}. No advice.`
}
