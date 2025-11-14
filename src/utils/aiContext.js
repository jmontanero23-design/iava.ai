/**
 * AI Context Builder - Injects Trading Intelligence
 *
 * Builds comprehensive market context for AI models including:
 * - Current prices and technical levels
 * - Indicator readings (Unicorn Score, SATY, Ichimoku, etc.)
 * - Market regime and trend
 * - Recent signals and setup quality
 *
 * This transforms generic AI into a world-class trading assistant.
 */

/**
 * Generate comprehensive world-class system prompt for trading AI
 */
export function generateTradingSystemPrompt() {
  return `You are an elite trading AI assistant for iAVA.ai (Intelligent Alpha Velocity Assistant), a confluence-based technical analysis platform.

## YOUR EXPERTISE
You have PhD-level knowledge in:
- Technical analysis and market microstructure
- Multi-timeframe confluence trading
- Risk management and position sizing
- Market regime detection
- Momentum and trend following strategies

## THE iAVA TRADING SYSTEM

### Core Philosophy: Confluence over Single Indicators
iAVA combines multiple technical indicators into a single "Unicorn Score" (0-100) that measures setup quality through confluence.

### Key Indicators You Must Understand:

1. **Unicorn Score (0-100)** - The Master Confluence Score
   - Aggregates ALL indicators below into a single quality metric
   - 70+ = High-quality setup with strong confluence
   - 40-70 = Moderate quality, mixed signals
   - <40 = Low quality, conflicting indicators
   - Higher scores = more indicators agreeing on direction

2. **EMA Cloud (8/21 Cross)**
   - Fast trend detection using 8 and 21 EMAs
   - Bullish: 8 EMA > 21 EMA (cloud green)
   - Bearish: 8 EMA < 21 EMA (cloud red)
   - Provides +20 points to Unicorn Score when bullish

3. **Pivot Ribbon Trend**
   - Multi-period pivot analysis showing trend strength
   - Bullish/Bearish/Neutral states based on pivot alignment
   - Contributes +20 points when trending

4. **Ichimoku Cloud**
   - Complete trend/momentum/support system
   - Bullish: Price > Cloud, Tenkan > Kijun, future cloud green
   - Bearish: Price < Cloud, Tenkan < Kijun, future cloud red
   - Contributes +20 points for bullish regime

5. **SATY (ATR-Based Support/Resistance)**
   - Dynamic support and resistance levels using ATR
   - Breakouts of SATY levels indicate momentum shifts
   - Provides target levels for entries/exits

6. **TTM Squeeze**
   - Volatility compression indicator
   - Squeeze = Consolidation (Bollinger Bands inside Keltner Channels)
   - Squeeze release = Explosive move imminent
   - Fire signals show directional momentum

7. **Daily Regime Filter**
   - Uses daily timeframe for higher-timeframe context
   - Filters intraday signals based on daily trend
   - Bull regime: Daily Pivot + Ichimoku both bullish
   - Bear regime: Daily Pivot + Ichimoku both bearish

### Market Regimes (Critical for Context):
- **Bullish Regime**: Daily Pivot bullish + Ichi bullish
- **Bearish Regime**: Daily Pivot bearish + Ichi bearish
- **Neutral/Mixed**: Conflicting daily signals

### Signal Generation:
- **Entry Signal**: Unicorn Score crosses threshold (typically 70)
- **Quality**: Higher scores = more confluence = better setups
- **Context Matters**: Same score has different meaning in bull vs bear regime

## YOUR COMMUNICATION STYLE

**Be Concise but Precise:**
- 2-4 sentences maximum per response
- Lead with actionable insight
- Cite specific technical levels when relevant
- Acknowledge uncertainty and risk

**Trading-Focused Language:**
- Use proper technical terms (confluence, regime, momentum, etc.)
- Cite specific price levels and indicator readings
- Focus on setup quality and risk/reward
- Never give generic "do your research" disclaimers

**Examples of World-Class Responses:**

❌ BAD (generic):
"AAPL looks interesting. The technicals are mixed. Consider your risk tolerance before trading."

✅ GOOD (specific, actionable):
"AAPL: Unicorn 76 (strong confluence). Price just broke above SATY resistance at $185.40 with EMA 8/21 bullish and daily regime confirming uptrend. Momentum building, but watch for squeeze release confirmation. Risk $184.20 support."

❌ BAD (vague):
"The market is showing some volatility. Be careful."

✅ GOOD (precise, contextual):
"SPY: Daily regime shifted bearish (Pivot + Ichi both red). Intraday Unicorn scores should be lower bar - look for 80+ for counter-trend longs or <30 shorts with daily confirmation. VIX expansion suggests continued chop."

## CRITICAL RULES

1. **Always use current market context** when provided
2. **Cite specific numbers**: Unicorn Score, price levels, indicator states
3. **Consider regime**: Daily context trumps intraday signals
4. **Risk awareness**: Mention support/resistance levels when relevant
5. **No legal disclaimers**: User understands this is educational/analytical
6. **Be confident but humble**: Strong opinions, weakly held
7. **Think in probabilities**: "High probability", "Low confidence", etc.
8. **Time-aware**: Market context changes - reference current vs historical

## WHEN YOU DON'T HAVE CONTEXT

If you're not provided specific market data:
- State clearly: "I don't have current market data for [symbol]"
- Offer general strategic guidance based on the question
- Suggest what indicators the user should check
- Still be valuable - teach concepts, explain indicators, discuss strategy

## REMEMBER

You are not just an AI - you are an **elite trading analyst** with deep expertise in the iAVA system. Trade
rs rely on you for **PhD-level insights**, not generic advice. Every response should demonstrate:
- Deep understanding of confluence trading
- Specific, actionable analysis
- Risk-aware thinking
- Market regime awareness

Your goal: Transform raw market data into **world-class trading intelligence**.`
}

/**
 * Build comprehensive market context from current state
 * This is what makes the AI truly intelligent and context-aware
 */
export async function buildMarketContext({
  symbol = 'SPY',
  currentPrice = null,
  indicators = {},
  regime = null,
  recentSignals = [],
  bars = []
}) {
  const context = {
    symbol,
    timestamp: new Date().toISOString(),
    marketHours: isMarketOpen(),
  }

  // Current price and change
  if (currentPrice) {
    context.price = {
      current: currentPrice,
      formatted: `$${currentPrice.toFixed(2)}`
    }
  } else if (bars?.length) {
    const latest = bars[bars.length - 1]
    context.price = {
      current: latest.close,
      formatted: `$${latest.close.toFixed(2)}`,
      change: bars.length > 1 ? ((latest.close - bars[bars.length - 2].close) / bars[bars.length - 2].close * 100).toFixed(2) + '%' : '0%'
    }
  }

  // Indicator readings
  if (indicators.score !== undefined) {
    context.unicornScore = {
      current: Math.round(indicators.score),
      quality: getScoreQuality(indicators.score),
      interpretation: getScoreInterpretation(indicators.score)
    }
  }

  if (indicators.emaCloudNow) {
    context.emaCloud = {
      status: indicators.emaCloudNow,
      bullish: indicators.emaCloudNow === 'bullish',
      interpretation: indicators.emaCloudNow === 'bullish' ? 'EMA 8 above 21 (uptrend)' :
                     indicators.emaCloudNow === 'bearish' ? 'EMA 8 below 21 (downtrend)' : 'Neutral/choppy'
    }
  }

  if (indicators.pivotNow) {
    context.pivotRibbon = {
      status: indicators.pivotNow,
      trending: indicators.pivotNow !== 'neutral',
      interpretation: indicators.pivotNow === 'bullish' ? 'Pivot ribbon trending up' :
                     indicators.pivotNow === 'bearish' ? 'Pivot ribbon trending down' : 'Sideways/no clear trend'
    }
  }

  if (indicators.ichiRegime) {
    context.ichimoku = {
      regime: indicators.ichiRegime,
      bullish: indicators.ichiRegime === 'bullish',
      interpretation: indicators.ichiRegime === 'bullish' ? 'Price above cloud, bullish momentum' :
                     indicators.ichiRegime === 'bearish' ? 'Price below cloud, bearish pressure' : 'Inside cloud or mixed'
    }
  }

  // Market regime (critical for context)
  if (regime) {
    context.regime = {
      type: regime.type || 'unknown',
      strength: regime.strength || 'moderate',
      interpretation: getRegimeInterpretation(regime)
    }
  } else if (indicators.pivotNow && indicators.ichiRegime) {
    // Infer regime from indicators
    const bullish = indicators.pivotNow === 'bullish' && indicators.ichiRegime === 'bullish'
    const bearish = indicators.pivotNow === 'bearish' && indicators.ichiRegime === 'bearish'
    context.regime = {
      type: bullish ? 'bull' : bearish ? 'bear' : 'neutral',
      interpretation: bullish ? 'Strong bullish regime - both Pivot and Ichimoku aligned up' :
                     bearish ? 'Strong bearish regime - both Pivot and Ichimoku aligned down' :
                     'Mixed/neutral regime - conflicting signals'
    }
  }

  // Recent signals (setup history)
  if (recentSignals?.length) {
    context.recentActivity = {
      signalCount: recentSignals.length,
      lastSignal: recentSignals[recentSignals.length - 1],
      summary: `${recentSignals.length} recent signal(s) detected`
    }
  }

  // Support/Resistance levels (if available)
  if (indicators.satyLevels) {
    context.satyLevels = {
      support: indicators.satyLevels.support,
      resistance: indicators.satyLevels.resistance,
      interpretation: `SATY support at $${indicators.satyLevels.support?.toFixed(2) || 'N/A'}, resistance at $${indicators.satyLevels.resistance?.toFixed(2) || 'N/A'}`
    }
  }

  return context
}

/**
 * Format market context for AI consumption
 * Converts data structure into natural language the AI can understand
 */
export function formatContextForAI(context) {
  if (!context || Object.keys(context).length === 0) {
    return 'No current market data available.'
  }

  const parts = []

  // Header
  parts.push(`=== CURRENT MARKET CONTEXT: ${context.symbol} ===`)
  parts.push(`Time: ${context.timestamp}`)
  parts.push(`Market: ${context.marketHours ? 'OPEN' : 'CLOSED'}`)
  parts.push('')

  // Price
  if (context.price) {
    parts.push(`Price: ${context.price.formatted}${context.price.change ? ` (${context.price.change})` : ''}`)
  }

  // Unicorn Score (most important)
  if (context.unicornScore) {
    parts.push(`\n**Unicorn Score: ${context.unicornScore.current}/100** (${context.unicornScore.quality})`)
    parts.push(`└─ ${context.unicornScore.interpretation}`)
  }

  // Indicators
  if (context.emaCloud) {
    parts.push(`\nEMA Cloud (8/21): ${context.emaCloud.status.toUpperCase()}`)
    parts.push(`└─ ${context.emaCloud.interpretation}`)
  }

  if (context.pivotRibbon) {
    parts.push(`\nPivot Ribbon: ${context.pivotRibbon.status.toUpperCase()}`)
    parts.push(`└─ ${context.pivotRibbon.interpretation}`)
  }

  if (context.ichimoku) {
    parts.push(`\nIchimoku: ${context.ichimoku.regime.toUpperCase()}`)
    parts.push(`└─ ${context.ichimoku.interpretation}`)
  }

  // Market Regime (critical)
  if (context.regime) {
    parts.push(`\n🎯 MARKET REGIME: ${context.regime.type.toUpperCase()}`)
    parts.push(`└─ ${context.regime.interpretation}`)
  }

  // Support/Resistance
  if (context.satyLevels) {
    parts.push(`\nSATY Levels:`)
    parts.push(`└─ ${context.satyLevels.interpretation}`)
  }

  // Recent signals
  if (context.recentActivity) {
    parts.push(`\n${context.recentActivity.summary}`)
  }

  return parts.join('\n')
}

// Helper functions
function getScoreQuality(score) {
  if (score >= 80) return 'EXCELLENT'
  if (score >= 70) return 'HIGH QUALITY'
  if (score >= 60) return 'GOOD'
  if (score >= 40) return 'MODERATE'
  return 'LOW'
}

function getScoreInterpretation(score) {
  if (score >= 80) return 'Exceptional confluence - multiple indicators strongly aligned'
  if (score >= 70) return 'Strong confluence - high-quality setup'
  if (score >= 60) return 'Good confluence - most indicators aligned'
  if (score >= 40) return 'Moderate - mixed signals, some confluence'
  return 'Low confluence - conflicting indicators'
}

function getRegimeInterpretation(regime) {
  if (regime.type === 'bull') {
    return regime.strength === 'strong'
      ? 'Strong bull regime - favor long setups with high Unicorn scores'
      : 'Moderate bull trend - selective longs, watch for reversals'
  }
  if (regime.type === 'bear') {
    return regime.strength === 'strong'
      ? 'Strong bear regime - favor short setups or high-conviction counter-trends'
      : 'Moderate bear trend - selective shorts, cautious on longs'
  }
  return 'Neutral/choppy regime - require higher Unicorn scores (80+) for trades'
}

function isMarketOpen() {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay() // 0 = Sunday, 6 = Saturday
  const hour = et.getHours()
  const minute = et.getMinutes()

  // Market closed on weekends
  if (day === 0 || day === 6) return false

  // Market hours: 9:30 AM - 4:00 PM ET
  if (hour < 9 || hour >= 16) return false
  if (hour === 9 && minute < 30) return false

  return true
}
