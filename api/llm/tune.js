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
    const { backtest, preference = 'robust' } = body || {}
    if (!backtest || typeof backtest !== 'object') return res.status(400).json({ error: 'Missing backtest' })

    const prompt = buildTunePrompt(backtest, preference)
    const model = process.env.LLM_MODEL_TUNE || process.env.LLM_MODEL_EXPLAIN || 'gpt-5-nano'

    let out
    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })
      out = await callOpenAI({ apiKey: openaiKey, model, prompt })
    } else if (provider === 'anthropic') {
      if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' })
      out = await callAnthropic({ apiKey: anthropicKey, model: process.env.LLM_MODEL_TUNE || 'claude-sonnet-4-5', prompt })
    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
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

async function callOpenAI({ apiKey, model, prompt }) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)

  // ALL gpt-5 and gpt-4.1 models use new API (max_completion_tokens, no temperature)
  // Old models (gpt-4o, gpt-3.5) use old API (max_tokens, temperature)
  const isNewModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o1') || model.includes('o3') || model.includes('o4')

  const payload = {
    model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  }

  // New models: max_completion_tokens, no temperature customization
  // Old models: max_tokens, temperature allowed
  if (isNewModel) {
    // GPT-5 models are reasoning models that use tokens for internal thinking
    // Need 2000+ tokens to allow for reasoning + output
    payload.max_completion_tokens = 2000
    // No temperature - new models only support default
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
  try { return JSON.parse(text) } catch { return { params: {}, reason: text } }
}

async function callAnthropic({ apiKey, model, prompt }) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 300, system: 'Return concise JSON only.', messages: [{ role: 'user', content: prompt }] }),
    signal: ctrl.signal,
  })
  const j = await r.json()
  clearTimeout(t)
  if (!r.ok) throw new Error(j?.error?.message || `Anthropic ${r.status}`)
  const text = (j?.content?.[0]?.text || '{}').trim()
  try { return JSON.parse(text) } catch { return { params: {}, reason: text } }
}

