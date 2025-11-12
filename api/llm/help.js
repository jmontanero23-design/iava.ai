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
    const { question = '', context = {} } = body || {}
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Missing question' })

    const system = `You are an in-app trading assistant for iAVA.ai.
Answer succinctly. You can explain indicators (EMA clouds, Pivot Ribbon, Ichimoku, SATY, TTM Squeeze), scoring (Unicorn Score), Daily confluence rules, backtesting panels, scanner usage, and risk guards.
Do not give financial advice; provide usage guidance and interpretations only.`
    const prompt = `User question: ${question}\n\nCurrent context (JSON): ${JSON.stringify(context)}`

    let out
    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })
      out = await callOpenAI({ apiKey: openaiKey, model: process.env.LLM_MODEL_EXPLAIN || 'gpt-5', system, prompt })
    } else if (provider === 'anthropic') {
      if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' })
      out = await callAnthropic({ apiKey: anthropicKey, model: process.env.LLM_MODEL_EXPLAIN || 'claude-sonnet-4-5', system, prompt })
    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
    }
    res.status(200).json({ answer: out })
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

async function callOpenAI({ apiKey, model, system, prompt }) {
  // Simple text answer; robust to models without JSON mode
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [ { role: 'system', content: system }, { role: 'user', content: prompt } ], temperature: 0.2, max_tokens: 350 }),
    signal: ctrl.signal,
  })
  const j = await r.json()
  if (!r.ok) { clearTimeout(t); throw new Error(j?.error?.message || `OpenAI ${r.status}`) }
  clearTimeout(t); return (j?.choices?.[0]?.message?.content || '').trim()
}

async function callAnthropic({ apiKey, model, system, prompt }) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 350, system, messages: [{ role: 'user', content: prompt }] }),
    signal: ctrl.signal,
  })
  const j = await r.json()
  if (!r.ok) { clearTimeout(t); throw new Error(j?.error?.message || `Anthropic ${r.status}`) }
  clearTimeout(t); return (j?.content?.[0]?.text || '').trim()
}
