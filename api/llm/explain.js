export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const provider = (process.env.LLM_PROVIDER || '').toLowerCase()
    const openaiKey = process.env.OPENAI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!provider) return res.status(500).json({ error: 'LLM_PROVIDER not set' })

    const chunks = []
    for await (const c of req) chunks.push(c)
    let body
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }
    const { state = {}, threshold = 70, enforceDaily = false } = body || {}
    const prompt = buildExplainPrompt(state, { threshold, enforceDaily })

    let out
    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })
      const model = process.env.LLM_MODEL_EXPLAIN || 'gpt-5'
      out = await callOpenAI({ apiKey: openaiKey, model, system: SYSTEM_EXPLAIN, prompt, response_format: { type: 'json_object' } })
    } else if (provider === 'anthropic') {
      if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' })
      const model = process.env.LLM_MODEL_EXPLAIN || 'claude-sonnet-4-5'
      out = await callAnthropic({ apiKey: anthropicKey, model, system: SYSTEM_EXPLAIN, prompt })
    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
    }

    res.status(200).json(out)
  } catch (e) {
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

async function callOpenAI({ apiKey, model, system, prompt, response_format }) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  const makeReq = async (withJsonMode) => {
    const payload = {
      model,
      messages: [ { role: 'system', content: system }, { role: 'user', content: prompt } ],
      temperature: 0.2,
      max_tokens: 300,
    }
    if (withJsonMode && response_format) payload.response_format = response_format
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    const j = await r.json()
    return { ok: r.ok, status: r.status, body: j }
  }
  // First try with JSON mode, then fallback to plain text
  let first = await makeReq(Boolean(response_format))
  if (!first.ok) {
    // Fallback: retry without response_format (some models may not support JSON mode)
    const second = await makeReq(false)
    if (!second.ok) {
      const msg = second?.body?.error?.message || first?.body?.error?.message || `OpenAI ${second.status || first.status}`
      throw new Error(msg)
    }
    const text2 = (second.body?.choices?.[0]?.message?.content || '').trim()
    clearTimeout(t); return safeJsonFromText(text2)
  }
  const text = (first.body?.choices?.[0]?.message?.content || '').trim()
  // If model honored JSON mode, content should be JSON; still guard with safe parse
  try { clearTimeout(t); return JSON.parse(text) } catch { clearTimeout(t); return safeJsonFromText(text) }
}

function safeJsonFromText(text) {
  if (!text) return { explanation: '', highlights: [], confidence: 0.5 }
  // Try to extract a JSON object if wrapped in code fences
  const m = text.match(/\{[\s\S]*\}/)
  if (m) {
    try { return JSON.parse(m[0]) } catch {}
  }
  return { explanation: text, highlights: [], confidence: 0.5 }
}

async function callAnthropic({ apiKey, model, system, prompt }) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: ctrl.signal,
  })
  const j = await r.json()
  if (!r.ok) { clearTimeout(t); throw new Error(j?.error?.message || `Anthropic ${r.status}`) }
  const text = j?.content?.[0]?.text?.trim() || '{}'
  try { clearTimeout(t); return JSON.parse(text) } catch { clearTimeout(t); return { explanation: text, highlights: [], confidence: 0.5 } }
}
