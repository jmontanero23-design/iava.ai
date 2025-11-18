/**
 * Diagnostic endpoint to verify all API keys and services
 * Access: /api/diagnostic
 */

export default async function handler(req, res) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    services: {}
  }

  // Check HuggingFace API Key
  const hfKey = process.env.HUGGINGFACE_API_KEY
  diagnostics.services.huggingface = {
    configured: !!hfKey,
    keyLength: hfKey ? hfKey.length : 0,
    keyPrefix: hfKey ? hfKey.substring(0, 6) + '...' : 'NOT SET',
    status: hfKey ? 'READY' : 'MISSING'
  }

  // Check OpenAI API Key
  const openaiKey = process.env.OPENAI_API_KEY
  diagnostics.services.openai = {
    configured: !!openaiKey,
    keyLength: openaiKey ? openaiKey.length : 0,
    keyPrefix: openaiKey ? openaiKey.substring(0, 7) + '...' : 'NOT SET',
    status: openaiKey ? 'READY' : 'MISSING'
  }

  // Check Alpaca API Keys
  const alpacaKey = process.env.ALPACA_API_KEY
  const alpacaSecret = process.env.ALPACA_API_SECRET
  diagnostics.services.alpaca = {
    apiKeyConfigured: !!alpacaKey,
    secretConfigured: !!alpacaSecret,
    keyPrefix: alpacaKey ? alpacaKey.substring(0, 6) + '...' : 'NOT SET',
    status: (alpacaKey && alpacaSecret) ? 'READY' : 'INCOMPLETE'
  }

  // Check News API Key
  const newsKey = process.env.NEWS_API_KEY
  diagnostics.services.news = {
    configured: !!newsKey,
    keyLength: newsKey ? newsKey.length : 0,
    keyPrefix: newsKey ? newsKey.substring(0, 6) + '...' : 'NOT SET',
    status: newsKey ? 'READY' : 'MISSING'
  }

  // Overall status
  const allReady = diagnostics.services.huggingface.status === 'READY' &&
                   diagnostics.services.openai.status === 'READY' &&
                   diagnostics.services.alpaca.status === 'READY'

  diagnostics.overallStatus = allReady ? 'ALL_SYSTEMS_GO' : 'CONFIGURATION_NEEDED'
  diagnostics.readyServices = Object.values(diagnostics.services).filter(s => s.status === 'READY').length
  diagnostics.totalServices = Object.keys(diagnostics.services).length

  // Return diagnostics
  return res.status(200).json(diagnostics)
}
