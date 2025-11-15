/**
 * Yahoo Finance CORS Proxy
 *
 * Yahoo Finance blocks direct browser requests with CORS policy.
 * This serverless function proxies requests server-side (no CORS restrictions).
 */

export default async function handler(req, res) {
  // Enable CORS for our domain
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { symbol, interval, range } = req.query

  if (!symbol || !interval || !range) {
    return res.status(400).json({
      error: 'Missing required parameters: symbol, interval, range'
    })
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`

    console.log('[Yahoo Proxy] Fetching:', url)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }

    const data = await response.json()

    // Return the data (our frontend will parse it)
    return res.status(200).json(data)

  } catch (error) {
    console.error('[Yahoo Proxy] Error:', error)
    return res.status(500).json({
      error: 'Failed to fetch from Yahoo Finance',
      details: error.message
    })
  }
}
