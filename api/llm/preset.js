/**
 * Preset Recommendation API
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

    // Parse request body
    const chunks = []
    for await (const c of req) chunks.push(c)
    let body
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' })
    }

    const { state = {}, presets = [] } = body || {}
    const prompt = buildPresetPrompt(state, presets)

    let result

    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })

      const model = process.env.LLM_MODEL_PRESET || 'gpt-5-nano'
      const isReasoningModel = model.includes('gpt-5') || model.includes('o1') || model.includes('o3') || model.includes('o4')
      const isNewModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o1') || model.includes('o3') || model.includes('o4')

      // Use Vercel AI SDK with JSON mode
      result = await generateText({
        model: openai(model, { apiKey: openaiKey }),
        messages: [
          { role: 'system', content: SYSTEM_PRESET },
          { role: 'user', content: prompt }
        ],
        maxTokens: isNewModel ? 2000 : 300,
        temperature: isNewModel ? undefined : 0.2,
        responseFormat: { type: 'json' },
        abortSignal: AbortSignal.timeout(isReasoningModel ? 60000 : 15000)
      })

    } else if (provider === 'anthropic') {
      if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' })

      const model = process.env.LLM_MODEL_PRESET || 'claude-sonnet-4-5'

      // Use Vercel AI SDK for Anthropic
      result = await generateText({
        model: anthropic(model, { apiKey: anthropicKey }),
        system: SYSTEM_PRESET,
        messages: [
          { role: 'user', content: prompt }
        ],
        maxTokens: 300,
        abortSignal: AbortSignal.timeout(15000)
      })

    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
    }

    // Parse and normalize output
    let out = safePresetFromText(result.text)

    // Normalize output: ensure numeric th/hz and canonical regime values
    try {
      if (out && typeof out === 'object') {
        const p = out.params || {}
        const thRaw = Number(p.th)
        const hzRaw = Number(p.hz)
        const regimeRaw = (p.regime || '').toString().toLowerCase()
        const regime = regimeRaw === 'bullish' ? 'bull' : regimeRaw === 'bearish' ? 'bear' : (regimeRaw || 'none')
        out.params = {
          th: Number.isFinite(thRaw) ? Math.max(0, Math.min(100, Math.round(thRaw))) : 70,
          hz: Number.isFinite(hzRaw) ? Math.max(1, Math.min(100, Math.round(hzRaw))) : 10,
          regime,
        }
      }
    } catch {}

    res.status(200).json(out)

  } catch (e) {
    console.error('[Preset API] Error:', e)
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

const SYSTEM_PRESET = `You recommend a strategy preset based on structured market context.
Return strict JSON with keys: presetId (one of known presets), reason (string), params { th, hz, regime }.
No financial advice or execution instructions.`

function buildPresetPrompt(state, presets) {
  const allowed = presets && presets.length ? presets : [
    'trendDaily','pullbackDaily','intradayBreakout','dailyTrendFollow','meanRevertIntraday','breakoutDailyStrong','momentumContinuation'
  ]
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
    allowedPresets: allowed,
  })
  return `Context: ${s}
Pick the best preset id and propose params {th,hz,regime}. No advice.`
}

function safePresetFromText(text) {
  const fallback = { presetId: 'manual', reason: (text || 'AI preset'), params: { th: 70, hz: 10, regime: 'none' } }
  if (!text) return fallback

  // Try direct parse
  try {
    return JSON.parse(text)
  } catch {}

  // Try to extract JSON from code fences
  const m = text.match(/\{[\s\S]*\}/)
  if (m) {
    try {
      return JSON.parse(m[0])
    } catch {}
  }

  return fallback
}
