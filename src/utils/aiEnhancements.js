/**
 * AI Enhancements - PhD++ Intelligence Layer
 *
 * Integrates HuggingFace models to supercharge ALL AI features:
 * - AI Chat gets smarter with multi-model analysis
 * - AI Copilot gets predictive capabilities
 * - Market analysis gets PhD-level depth
 *
 * This is the intelligence layer that makes iAVA.ai world-class elite 1%
 */

/**
 * Detect stock symbols in text
 * Supports: AAPL, $AAPL, Apple (AAPL), etc.
 */
export function detectSymbols(text) {
  const symbols = new Set()

  // Pattern 1: $TICKER format
  const dollarPattern = /\$([A-Z]{1,5})\b/g
  let match
  while ((match = dollarPattern.exec(text)) !== null) {
    symbols.add(match[1])
  }

  // Pattern 2: Standalone tickers (2-5 uppercase letters)
  const standalonePattern = /\b([A-Z]{2,5})\b/g
  const commonWords = new Set(['I', 'A', 'THE', 'AND', 'OR', 'BUT', 'FOR', 'IS', 'IT', 'TO', 'OF', 'IN', 'ON', 'AT', 'BY', 'UP', 'SO', 'NO', 'GO', 'DO', 'BE', 'IF', 'MY', 'US', 'WE', 'HE', 'SHE', 'YOU', 'THEY', 'ARE', 'WAS', 'WERE', 'BEEN', 'HAVE', 'HAS', 'HAD', 'CAN', 'WILL', 'MAY', 'MUST', 'SHALL', 'COULD', 'WOULD', 'SHOULD'])

  while ((match = standalonePattern.exec(text)) !== null) {
    const word = match[1]
    if (!commonWords.has(word) && word.length >= 2) {
      symbols.add(word)
    }
  }

  // Pattern 3: Company name with ticker in parentheses
  const companyPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(([A-Z]{1,5})\)/g
  while ((match = companyPattern.exec(text)) !== null) {
    symbols.add(match[2])
  }

  return Array.from(symbols)
}

/**
 * Detect timeframe mentions in text
 */
export function detectTimeframe(text) {
  const lowerText = text.toLowerCase()

  const patterns = {
    '1Min': /\b(1\s*min|1\s*minute|one\s*minute)\b/i,
    '5Min': /\b(5\s*min|5\s*minute|five\s*minute)\b/i,
    '15Min': /\b(15\s*min|15\s*minute|fifteen\s*minute)\b/i,
    '1Hour': /\b(1\s*hour|1\s*hr|one\s*hour|hourly)\b/i,
    '1Day': /\b(1\s*day|daily|day\s*chart)\b/i
  }

  for (const [tf, pattern] of Object.entries(patterns)) {
    if (pattern.test(lowerText)) {
      return tf
    }
  }

  return null
}

/**
 * Detect trading intent in user message
 */
export function detectIntent(text) {
  const lowerText = text.toLowerCase()

  const intents = {
    analysis: /\b(analyze|analysis|look at|check|review|evaluate|assess)\b/i,
    buy: /\b(buy|long|purchase|enter|take position)\b/i,
    sell: /\b(sell|short|exit|close position|liquidate)\b/i,
    price: /\b(price|cost|value|worth|trading at)\b/i,
    forecast: /\b(predict|forecast|future|will|expect|outlook|projection)\b/i,
    risk: /\b(risk|stop|loss|danger|volatility|downside)\b/i,
    setup: /\b(setup|signal|entry|opportunity|trade idea)\b/i,
    news: /\b(news|headline|announcement|report|article)\b/i,
    compare: /\b(compare|versus|vs|difference|better)\b/i,
    portfolio: /\b(portfolio|positions|holdings|allocation)\b/i
  }

  const detectedIntents = []
  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(lowerText)) {
      detectedIntents.push(intent)
    }
  }

  return detectedIntents
}

/**
 * Extract trade parameters from text
 */
export function extractTradeParams(text) {
  const params = {
    entry: null,
    stop: null,
    target: null,
    quantity: null,
    side: null
  }

  // Extract prices
  const pricePattern = /\$?(\d+(?:\.\d{1,2})?)/g
  const prices = []
  let match
  while ((match = pricePattern.exec(text)) !== null) {
    prices.push(parseFloat(match[1]))
  }

  // Detect side
  if (/\b(buy|long|calls?)\b/i.test(text)) {
    params.side = 'buy'
  } else if (/\b(sell|short|puts?)\b/i.test(text)) {
    params.side = 'sell'
  }

  // Extract entry (usually first price mentioned)
  if (prices.length > 0) {
    if (/\b(entry|enter at|buy at|at)\b/i.test(text)) {
      params.entry = prices[0]
    }
  }

  // Extract stop
  const stopMatch = text.match(/\bstop\s*(?:loss)?\s*(?:at)?\s*\$?(\d+(?:\.\d{1,2})?)/i)
  if (stopMatch) {
    params.stop = parseFloat(stopMatch[1])
  }

  // Extract target
  const targetMatch = text.match(/\btarget\s*(?:price)?\s*(?:at)?\s*\$?(\d+(?:\.\d{1,2})?)/i)
  if (targetMatch) {
    params.target = parseFloat(targetMatch[1])
  }

  // Extract quantity
  const qtyMatch = text.match(/(\d+)\s*(?:shares?|contracts?|qty|quantity)/i)
  if (qtyMatch) {
    params.quantity = parseInt(qtyMatch[1], 10)
  }

  return params
}

/**
 * Build enhanced context for AI with Multi-TF analysis
 */
export async function buildEnhancedContext(marketData, symbol, options = {}) {
  const { includeMultiTF = true, includeSentiment = false } = options

  const context = {
    symbol: symbol || marketData.symbol,
    currentTimeframe: marketData.timeframe,
    currentPrice: marketData.currentPrice,
    unicornScore: marketData.signalState?.score,
    regime: marketData.signalState?.regime,
    timestamp: new Date().toISOString()
  }

  // Add multi-timeframe analysis
  if (includeMultiTF && symbol) {
    try {
      const { analyzeAllTimeframes } = await import('./multiTimeframeAnalysis.js')
      const multiTF = await analyzeAllTimeframes(symbol)

      context.multiTimeframe = {
        consensus: multiTF.consensus,
        weightedScore: multiTF.weightedScore,
        recommendation: multiTF.recommendation,
        bestEntryTF: multiTF.bestEntryTimeframe,
        warnings: multiTF.warnings,
        timeframes: {}
      }

      // Add each timeframe's key metrics
      Object.entries(multiTF.timeframes).forEach(([tf, data]) => {
        if (data.available) {
          context.multiTimeframe.timeframes[tf] = {
            score: data.score,
            regime: data.regime,
            rsi: data.rsi,
            relativeVolume: data.relativeVolume
          }
        }
      })
    } catch (e) {
      console.error('[AI Enhancements] Multi-TF analysis failed:', e)
    }
  }

  // Add sentiment analysis for news
  if (includeSentiment && symbol) {
    try {
      // Fetch recent news
      const newsRes = await fetch(`/api/news?symbol=${symbol}&limit=5`)
      if (newsRes.ok) {
        const { news } = await newsRes.json()

        if (news && news.length > 0) {
          // Analyze sentiment of top headlines
          const sentimentRes = await fetch('/api/sentiment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: news.slice(0, 3).map(n => n.headline).join('. '),
              useMultiModel: true
            })
          })

          if (sentimentRes.ok) {
            const sentiment = await sentimentRes.json()
            context.newsSentiment = {
              overall: sentiment.sentiment,
              score: sentiment.score,
              confidence: sentiment.confidence,
              consensus: sentiment.consensus,
              headlines: news.slice(0, 3).map(n => n.headline)
            }
          }
        }
      }
    } catch (e) {
      console.error('[AI Enhancements] Sentiment analysis failed:', e)
    }
  }

  return context
}

/**
 * Format enhanced context for AI prompt
 */
export function formatEnhancedContext(context) {
  const lines = []

  lines.push(`**Market Context for ${context.symbol}:**`)
  lines.push(`Current Timeframe: ${context.currentTimeframe}`)
  lines.push(`Price: $${context.currentPrice?.toFixed(2) || 'N/A'}`)
  lines.push(`Unicorn Score: ${context.unicornScore?.toFixed(0) || 'N/A'}/100`)
  lines.push(`Regime: ${context.regime || 'N/A'}`)
  lines.push('')

  if (context.multiTimeframe) {
    lines.push(`**Multi-Timeframe Analysis:**`)
    lines.push(`Consensus: ${context.multiTimeframe.consensus?.toUpperCase().replace(/_/g, ' ')}`)
    lines.push(`Weighted Score: ${context.multiTimeframe.weightedScore?.toFixed(1)}/100`)
    lines.push(`Recommendation: ${context.multiTimeframe.recommendation?.message || 'N/A'}`)

    if (context.multiTimeframe.bestEntryTF) {
      lines.push(`Best Entry TF: ${context.multiTimeframe.bestEntryTF.timeframe} - ${context.multiTimeframe.bestEntryTF.reason}`)
    }

    if (context.multiTimeframe.warnings && context.multiTimeframe.warnings.length > 0) {
      lines.push(`Warnings: ${context.multiTimeframe.warnings.map(w => w.message).join('; ')}`)
    }
    lines.push('')
  }

  if (context.newsSentiment) {
    lines.push(`**News Sentiment:**`)
    lines.push(`Overall: ${context.newsSentiment.overall.toUpperCase()} (${(context.newsSentiment.score * 100).toFixed(0)}%)`)
    lines.push(`Consensus: ${context.newsSentiment.consensus?.toUpperCase().replace(/_/g, ' ')}`)
    lines.push(`Recent Headlines:`)
    context.newsSentiment.headlines.forEach(h => {
      lines.push(`  - ${h}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

export default {
  detectSymbols,
  detectTimeframe,
  detectIntent,
  extractTradeParams,
  buildEnhancedContext,
  formatEnhancedContext
}
