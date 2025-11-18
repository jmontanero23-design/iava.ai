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
    const ALPACA_ENV = process.env.ALPACA_ENV || 'paper'
    const BASE_URL = ALPACA_ENV === 'paper'
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets'

    if (!ALPACA_KEY || !ALPACA_SECRET) {
      console.warn('[News API] No Alpaca credentials - returning sample data. Check ALPACA_KEY_ID and ALPACA_SECRET_KEY in Vercel environment variables.')
      return res.status(200).json({
        news: getSampleNews(symbol),
        source: 'sample_no_credentials',
        symbol
      })
    }

    // Fetch news from Alpaca News API
    // https://docs.alpaca.markets/reference/news-1
    const newsUrl = `${BASE_URL}/v1beta1/news?symbols=${symbol}&limit=${Math.min(limit, 50)}&sort=desc`

    console.log('[News API] Fetching news for:', symbol)

    const response = await fetch(newsUrl, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[News API] Alpaca error:', response.status, errorText)

      // Fallback to sample data
      return res.status(200).json({
        news: getSampleNews(symbol),
        source: 'sample_fallback',
        symbol,
        error: `Alpaca API error: ${response.status}`
      })
    }

    const data = await response.json()

    if (!data.news || data.news.length === 0) {
      console.log('[News API] No news found for', symbol, '- using sample')
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

    console.log(`[News API] Fetched ${formattedNews.length} real news items for ${symbol}`)

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
