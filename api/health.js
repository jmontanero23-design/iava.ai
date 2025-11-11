export default async function handler(req, res) {
  const started = Date.now()
  const env = process.env.VERCEL_ENV || 'unknown'
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7)
  const msg = process.env.VERCEL_GIT_COMMIT_MESSAGE || ''
  const hasKeys = Boolean(process.env.ALPACA_KEY_ID && process.env.ALPACA_SECRET_KEY)
  const llmProvider = (process.env.LLM_PROVIDER || '').toLowerCase()
  const llmConfigured = llmProvider === 'openai'
    ? Boolean(process.env.OPENAI_API_KEY)
    : llmProvider === 'anthropic'
      ? Boolean(process.env.ANTHROPIC_API_KEY)
      : false
  const llmModels = {
    explain: process.env.LLM_MODEL_EXPLAIN || null,
    preset: process.env.LLM_MODEL_PRESET || null,
  }
  const n8nConfigured = Boolean(process.env.N8N_WEBHOOK_URL)
  const n8nEnabled = (process.env.N8N_ENABLED || 'true').toLowerCase() !== 'false'
  // Probe Alpaca account directly to avoid relying on intra-lambda fetches
  let alpacaOk = false
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const alpEnv = process.env.ALPACA_ENV || 'paper'
    if (key && secret) {
      const base = alpEnv === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'
      const r = await fetch(`${base}/v2/account`, { headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret } })
      alpacaOk = r.ok
    }
  } catch {
    alpacaOk = false
  }
  res.status(200).json({
    status: 'ok',
    env,
    commit: sha,
    message: msg.substring(0, 120),
    api: { alpacaAccount: alpacaOk, hasKeys, llm: { provider: llmProvider || null, configured: llmConfigured, models: llmModels }, n8n: { configured: n8nConfigured, enabled: n8nEnabled } },
    host: req.headers.host,
    ms: Date.now() - started,
  })
}
