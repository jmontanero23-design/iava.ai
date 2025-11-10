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
    const { state = {}, presets = [] } = body || {}
    const prompt = buildPresetPrompt(state, presets)

    let out
    if (provider === 'openai') {
      if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })
      const model = process.env.LLM_MODEL_PRESET || 'gpt-4o-mini'
      out = await callOpenAI({ apiKey: openaiKey, model, system: SYSTEM_PRESET, prompt, response_format: { type: 'json_object' } })
    } else if (provider === 'anthropic') {
      if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' })
      const model = process.env.LLM_MODEL_PRESET || 'claude-3-5-sonnet-20240620'
      out = await callAnthropic({ apiKey: anthropicKey, model, system: SYSTEM_PRESET, prompt })
    } else {
      return res.status(400).json({ error: `Unsupported LLM_PROVIDER ${provider}` })
    }

    res.status(200).json(out)
  } catch (e) {
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

async function callOpenAI({ apiKey, model, system, prompt, response_format }) {
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
      body: JSON.stringify(payload)
    })
    const j = await r.json()
    return { ok: r.ok, status: r.status, body: j }
  }
  let first = await makeReq(Boolean(response_format))
  if (!first.ok) {
    const second = await makeReq(false)
    if (!second.ok) {
      const msg = second?.body?.error?.message || first?.body?.error?.message || `OpenAI ${second.status || first.status}`
      throw new Error(msg)
    }
    const text2 = (second.body?.choices?.[0]?.message?.content || '').trim()
    return safePresetFromText(text2)
  }
  const text = (first.body?.choices?.[0]?.message?.content || '').trim()
  try { return JSON.parse(text) } catch { return safePresetFromText(text) }
}

function safePresetFromText(text) {
  const fallback = { presetId: 'manual', reason: (text || 'AI preset'), params: { th: 70, hz: 10, regime: 'none' } }
  if (!text) return fallback
  const m = text.match(/\{[\s\S]*\}/)
  if (m) {
    try { return JSON.parse(m[0]) } catch { return fallback }
  }
  return fallback
}

async function callAnthropic({ apiKey, model, system, prompt }) {
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
    })
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j?.error?.message || `Anthropic ${r.status}`)
  const text = j?.content?.[0]?.text?.trim() || '{}'
  try { return JSON.parse(text) } catch { return { presetId: 'manual', reason: text, params: { th: 70, hz: 10, regime: 'none' } } }
}
