export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const provider = (process.env.LLM_PROVIDER || '').toLowerCase()
    const openaiKey = process.env.OPENAI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!provider) return res.status(500).json({ error: 'LLM_PROVIDER not set' })

    // Read raw body
    const chunks = []
    for await (const c of req) chunks.push(c)
    let body
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }
    const { result } = body || {}
    if (!result || typeof result !== 'object') return res.status(400).json({ error: 'Missing scan result' })

    const prompt = buildScanSummaryPrompt(result)
    const model = process.env.LLM_MODEL_EXPLAIN || 'gpt-5-nano'

    let out
    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })
      out = await callOpenAI({ apiKey: openaiKey, model, prompt })
    } else if (provider === 'anthropic') {
      if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' })
      out = await callAnthropic({ apiKey: anthropicKey, model: process.env.LLM_MODEL_EXPLAIN || 'claude-sonnet-4-5', prompt })
    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
    }

    res.status(200).json({ summary: out })
  } catch (e) {
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

async function callOpenAI({ apiKey, model, prompt }) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 12000)

  // Reasoning models use different parameters
  // New OpenAI models (2025+) use max_completion_tokens
  // Old models (gpt-4o, gpt-3.5) use max_tokens
  const isNewModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o1') || model.includes('o3') || model.includes('o4')

  // Only reasoning models (gpt-5, o1, etc) skip temperature
  const isReasoningModel = model === 'gpt-5' || model.startsWith('o1') || model.startsWith('o3')

  const payload = {
    model,
    messages,
    response_format: { type: 'json_object' },
  }

  // Set token limit parameter based on API version
  if (isNewModel) {
    payload.max_completion_tokens = 300
  } else {
    payload.max_tokens = 300
  }

  // Set temperature (reasoning models use default)
  if (!isReasoningModel) {
    payload.temperature = 0.2
  }
    response_format: { type: 'json_object' }
  }

  // Set token limit and temperature based on model type
  if (isReasoningModel) {
    payload.max_completion_tokens = 300
  } else {
    payload.max_tokens = 300
    payload.temperature = 0.2
  }

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: ctrl.signal,
  })
  const j = await r.json()
  clearTimeout(t)
  if (!r.ok) throw new Error(j?.error?.message || `OpenAI ${r.status}`)
  const text = (j?.choices?.[0]?.message?.content || '{}').trim()
  try { return JSON.parse(text) } catch { return { bullets: [text], quick_take: '' } }
}

async function callAnthropic({ apiKey, model, prompt }) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 12000)
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 300, system: 'Return concise JSON only.', messages: [{ role: 'user', content: prompt }] }),
    signal: ctrl.signal,
  })
  const j = await r.json()
  clearTimeout(t)
  if (!r.ok) throw new Error(j?.error?.message || `Anthropic ${r.status}`)
  const text = (j?.content?.[0]?.text || '{}').trim()
  try { return JSON.parse(text) } catch { return { bullets: [text], quick_take: '' } }
}

