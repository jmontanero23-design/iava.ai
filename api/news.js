/**
 * News API - Fetch real market news from Alpaca
 * Used by Market Sentiment panel for HuggingFace analysis
 */

export default async function handler(req, res) {
  const { symbol = 'SPY', limit = 10 } = req.query

  try {
    // Use correct server-side environment variable names (not VITE_ prefixed)
    const ALPACA_KEY = process.env.ALPACA_KEY_ID
    const ALPACA_SECRET = process.env.ALPACA_SECRET_KEY

    // PhD++ DEBUG: Enhanced logging for credentials check
    console.log('[News API] Environment check:')
    console.log('  - ALPACA_KEY_ID exists:', !!ALPACA_KEY)
    console.log('  - ALPACA_KEY_ID first 4 chars:', ALPACA_KEY?.substring(0, 4))
    console.log('  - ALPACA_SECRET_KEY exists:', !!ALPACA_SECRET)
    console.log('  - ALPACA_SECRET_KEY length:', ALPACA_SECRET?.length)

    if (!ALPACA_KEY || !ALPACA_SECRET) {
      console.warn('[News API] ❌ No Alpaca credentials - returning sample data.')
      console.warn('[News API] Check ALPACA_KEY_ID and ALPACA_SECRET_KEY in Vercel environment variables.')
      return res.status(200).json({
        news: getSampleNews(symbol),
        source: 'sample_no_credentials',
        symbol
      })
    }

    // CRITICAL FIX: News API is on data.alpaca.markets (market data domain)
    // NOT paper-api.alpaca.markets (trading domain)
    // The news endpoint is the same for both paper and live accounts
    // https://docs.alpaca.markets/reference/news-1
    const DATA_URL = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets'
    const newsUrl = `${DATA_URL}/v1beta1/news?symbols=${symbol}&limit=${Math.min(limit, 50)}&sort=desc`

    console.log('[News API] 🔄 Fetching from:', newsUrl)
    console.log('[News API] Request params:', { symbol, limit: Math.min(limit, 50) })

    const response = await fetch(newsUrl, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET,
      }
    })

    console.log('[News API] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      const errorHeaders = Object.fromEntries(response.headers.entries())

      // PhD++ ENHANCED ERROR LOGGING
      console.error('[News API] ❌ Alpaca API Error Details:')
      console.error('  - Status:', response.status, response.statusText)
      console.error('  - Headers:', JSON.stringify(errorHeaders, null, 2))
      console.error('  - Body:', errorText)

      // Specific error handling
      if (response.status === 401) {
        console.error('[News API] 🚨 AUTHENTICATION FAILED - Check API keys')
      } else if (response.status === 403) {
        console.error('[News API] 🚨 FORBIDDEN - Check API permissions for market data')
      } else if (response.status === 429) {
        console.error('[News API] 🚨 RATE LIMIT EXCEEDED')
      } else if (response.status === 404) {
        console.error('[News API] 🚨 ENDPOINT NOT FOUND - Check URL:', newsUrl)
      }

      // Fallback to sample data
      return res.status(200).json({
        news: getSampleNews(symbol),
        source: 'sample_fallback',
        symbol,
        error: `Alpaca API error: ${response.status}`,
        errorDetails: errorText
      })
    }

    const data = await response.json()

    if (!data.news || data.news.length === 0) {
      console.log('[News API] ⚠️ No news found for', symbol, '- using sample')
      return res.status(200).json({
        news: getSampleNews(symbol),
        source: 'sample_no_data',
        symbol
      })
    }

    // Format news items
    const formattedNews = data.news.map(item => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      author: item.author,
      created_at: item.created_at,
      updated_at: item.updated_at,
      url: item.url,
      images: item.images,
      symbols: item.symbols,
      source: item.source
    }))

    console.log(`[News API] ✅ SUCCESS! Fetched ${formattedNews.length} REAL news items for ${symbol}`)
    console.log('[News API] Headlines:', formattedNews.slice(0, 3).map(n => n.headline))

    return res.status(200).json({
      news: formattedNews,
      source: 'alpaca',
      symbol,
      count: formattedNews.length
    })

  } catch (error) {
    console.error('[News API] Error:', error)

    // Always return something - fallback to sample
    return res.status(200).json({
      news: getSampleNews(symbol),
      source: 'sample_error',
      symbol,
      error: error.message
    })
  }
}

/**
 * Sample news for when real API is unavailable
 */
function getSampleNews(symbol) {
  const now = new Date().toISOString()

  return [
    {
      id: 'sample-1',
      headline: `${symbol} shows strong momentum in recent trading session`,
      summary: `${symbol} shares demonstrate bullish technical indicators with increased volume.`,
      created_at: now,
      source: 'sample',
      symbols: [symbol]
    },
    {
      id: 'sample-2',
      headline: `Market volatility increases amid economic uncertainty`,
      summary: 'Traders monitor Federal Reserve policy decisions and inflation data.',
      created_at: now,
      source: 'sample',
      symbols: [symbol]
    },
    {
      id: 'sample-3',
      headline: `Technical indicators suggest bullish trend for ${symbol}`,
      summary: 'Chart patterns show potential for continued upward movement.',
      created_at: now,
      source: 'sample',
      symbols: [symbol]
    },
    {
      id: 'sample-4',
      headline: `Analysts update price targets for ${symbol}`,
      summary: 'Wall Street analysts revise forecasts based on recent earnings.',
      created_at: now,
      source: 'sample',
      symbols: [symbol]
    },
    {
      id: 'sample-5',
      headline: `Trading volume surges for ${symbol} as investors react to news`,
      summary: 'Institutional buying interest increases according to market data.',
      created_at: now,
      source: 'sample',
      symbols: [symbol]
    }
  ]
}
