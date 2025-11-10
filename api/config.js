export default async function handler(req, res) {
  try {
    const env = process.env.VERCEL_ENV || 'unknown'
    const llmProvider = (process.env.LLM_PROVIDER || '').toLowerCase()
    const llmConfigured = llmProvider === 'openai'
      ? Boolean(process.env.OPENAI_API_KEY)
      : llmProvider === 'anthropic'
        ? Boolean(process.env.ANTHROPIC_API_KEY)
        : false
    const order = {
      marketOpenRequired: (process.env.ORDER_RULE_MARKET_OPEN_REQUIRED || 'true').toLowerCase() === 'true',
      maxPositions: Number(process.env.ORDER_RULE_MAX_POSITIONS || 0),
      maxRiskPct: Number(process.env.ORDER_RULE_MAX_RISK_PCT || 0),
      maxDailyLossPct: Number(process.env.ORDER_RULE_MAX_DAILY_LOSS_PCT || 0),
      maxExposurePct: Number(process.env.ORDER_RULE_MAX_EXPOSURE_PCT || 0),
      minMinutesBetweenOrders: Number(process.env.ORDER_RULE_MIN_MINUTES_BETWEEN_ORDERS || 0),
    }
    const n8n = {
      enabled: (process.env.N8N_ENABLED || 'true').toLowerCase() !== 'false',
      configured: Boolean(process.env.N8N_WEBHOOK_URL),
    }
    const scanner = {
      maxConcurrency: Number(process.env.SCAN_MAX_CONCURRENCY || 0) || 0,
    }
    res.status(200).json({ env, llm: { provider: llmProvider || null, configured: llmConfigured }, order, n8n, scanner })
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}

