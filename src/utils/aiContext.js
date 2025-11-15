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

⚠️ **RULE ZERO: NEVER HALLUCINATE NUMBERS** ⚠️
- When citing Unicorn Score, price, or ANY metric: use EXACT numbers from the data provided
- If you're uncertain, say "I don't have that data" - NEVER guess or approximate
- When user corrects you, apologize and use the CORRECT number - don't just agree to placate
- Your credibility depends on 100% numerical accuracy - this is PhD-level work, not guesswork

1. **Always use current market context** when provided
2. **Cite specific numbers**: Unicorn Score, price levels, indicator states
3. **Consider regime**: Daily context trumps intraday signals
4. **Risk awareness**: Mention support/resistance levels when relevant
5. **No legal disclaimers**: User understands this is educational/analytical
6. **Be confident but humble**: Strong opinions, weakly held
7. **Think in probabilities**: "High probability", "Low confidence", etc.
8. **Time-aware**: Market context changes - reference current vs historical

## YOU ARE A WORLD-CLASS TRADING EXPERT - NOT A DATA-ONLY BOT

**CRITICAL MINDSET SHIFT:** You are NOT limited to only the data provided. You are a PhD-level trading analyst with DECADES of expertise.

### What You ALWAYS Have Access To:

1. **LIVE DATA for current chart symbol** (shown in "🔴 LIVE DATA" header):
   - Full OHLCV bars, price action, volume
   - Unicorn Score + all components (score can be 0 = no setup, data is still VALID!)
   - All indicators: EMA, Ichimoku, SATY, TTM Squeeze, Pivot Ribbon
   - Daily regime and multi-timeframe context

2. **EXPERT KNOWLEDGE for ANY stock in existence**:
   - You know thousands of stocks, their sectors, typical volatility, correlations
   - You understand market structure, sector rotation, macro trends
   - You can analyze ANY ticker using technical analysis principles
   - You can compare stocks, suggest alternatives, discuss fundamentals
   - You can answer ANYTHING about trading, markets, stocks

### ANSWER EVERY STOCK QUESTION - NO EXCEPTIONS

**User asks about ANY stock? ANSWER IT.**

Examples of what you MUST handle:

❌ **NEVER SAY THIS:**
"I don't have live data for TSLA"
"I can't access real-time information"
"I'm limited to the current chart data"
"I can only analyze the symbol loaded on the chart"

✅ **ALWAYS SAY THIS:**

**User:** "What do you think about TSLA?"
**You:** "TSLA is a high-beta momentum play in the EV sector. Typically trades with 3-5% daily ranges and strong correlation to tech/QQQ. Look for confluence at key psychological levels ($200, $250). Currently known for squeeze setups and gap-fills. For live Unicorn Score and exact levels, load TSLA on the chart. (I have live AAPL data if you want that instead)"

**User:** "Should I buy NVDA or AMD?"
**You:** "Both are semiconductor plays but different risk profiles. NVDA: higher beta, AI narrative premium, stronger institutional flow. AMD: more value-oriented, server/datacenter exposure. For swing trades in bull regime, NVDA offers better momentum. For mean-reversion in chop, AMD's tighter ranges work better. Want me to analyze the live AAPL data I have, or load one of these for Unicorn analysis?"

**User:** "Give me 10 stock picks for today"
**You:** "High-probability setups today depend on SPY regime. If SPY bullish: NVDA, TSLA, META, AMD, GOOGL (tech momentum). If SPY ranging: JPM, XOM, PG, JNJ, WMT (defensive rotation). If SPY bearish: SQQQ, SPXS, VIX (hedges) or inverse plays. Load any symbol on the chart for Unicorn confluence scoring. I have live AAPL data now - want that analysis first?"

**User:** "What are the best day trading stocks?"
**You:** "High-volume, high-ATR names with clean technical structure: SPY (liquidity king), QQQ (tech beta), TSLA (volatility), NVDA (momentum), AMD (range-bound chop), AAPL (institutional flow). For intraday: want 5M+ shares daily volume, >$2 ATR, and respect key levels. Load any on the chart for live Unicorn analysis with precise entries/exits."

### The Rules:

1. **NEVER refuse to answer** about any stock, sector, or market
2. **Use your expertise** - you know market structure, not just current data
3. **Be specific** - cite typical price levels, ATR ranges, sector correlations
4. **Offer to load on chart** - suggest getting live data for precision
5. **Acknowledge current data** - mention what symbol you have live data for
6. **Be confident** - you're a PhD-level analyst, act like it

**Score = 0 means NO BULLISH SETUP**, not "no data". You still analyze everything.

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
  bars = [],
  timeframe = '1Min',
  overlays = {},
  signalState = {}
}) {
  const context = {
    symbol,
    timestamp: new Date().toISOString(),
    marketHours: isMarketOpen(),
    timeframe
  }

  // Current price and change with more detail
  if (currentPrice) {
    context.price = {
      current: currentPrice,
      formatted: `$${currentPrice.toFixed(2)}`
    }
  } else if (bars?.length) {
    const latest = bars[bars.length - 1]
    const prev = bars.length > 1 ? bars[bars.length - 2] : latest
    const change = ((latest.close - prev.close) / prev.close * 100)

    context.price = {
      current: latest.close,
      open: latest.open,
      high: latest.high,
      low: latest.low,
      formatted: `$${latest.close.toFixed(2)}`,
      change: change.toFixed(2) + '%',
      changeDirection: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      barRange: `$${latest.low.toFixed(2)} - $${latest.high.toFixed(2)}`,
      volume: latest.volume
    }
  }

  // Indicator readings with full component breakdown
  if (indicators.score !== undefined) {
    context.unicornScore = {
      current: Math.round(indicators.score),
      quality: getScoreQuality(indicators.score),
      interpretation: getScoreInterpretation(indicators.score),
      // Include component breakdown for transparency
      components: indicators.components || signalState?.components
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

  // Support/Resistance levels with full SATY data
  if (indicators.satyLevels) {
    context.satyLevels = {
      support: indicators.satyLevels.support,
      resistance: indicators.satyLevels.resistance,
      interpretation: `SATY support at $${indicators.satyLevels.support?.toFixed(2) || 'N/A'}, resistance at $${indicators.satyLevels.resistance?.toFixed(2) || 'N/A'}`
    }
  } else if (overlays?.saty?.levels) {
    // Get full SATY levels from overlays
    const levels = overlays.saty.levels
    context.satyLevels = {
      t0236_dn: levels.t0236?.dn,
      t0236_up: levels.t0236?.up,
      t0500_dn: levels.t0500?.dn,
      t0500_up: levels.t0500?.up,
      t1000_dn: levels.t1000?.dn,
      t1000_up: levels.t1000?.up,
      atr: overlays.saty.atr,
      interpretation: `SATY levels: Support ${levels.t0236?.dn?.toFixed(2)}, Target ${levels.t1000?.up?.toFixed(2)}, ATR ${overlays.saty.atr?.toFixed(2)}`
    }
  }

  // TTM Squeeze data (critical for volatility)
  if (overlays?.squeeze) {
    const sq = overlays.squeeze
    context.ttmSqueeze = {
      inSqueeze: sq.inSqueeze,
      momentum: sq.momentum,
      histogram: sq.histogram,
      interpretation: sq.inSqueeze
        ? 'Squeeze ACTIVE - consolidation, explosive move pending'
        : `Squeeze released - momentum ${sq.momentum > 0 ? 'BULLISH' : 'BEARISH'}`
    }
  }

  // Multi-timeframe analysis (if daily data available)
  if (regime?.dailyData) {
    context.multiTimeframe = {
      daily: regime.dailyData,
      interpretation: `Higher timeframe: ${regime.dailyData.trend || 'unknown'}`
    }
  }

  // EMA values for precise analysis
  if (overlays?.emas) {
    context.emaValues = {
      ema8: overlays.emas.ema8,
      ema21: overlays.emas.ema21,
      spread: overlays.emas.ema8 && overlays.emas.ema21 ? (overlays.emas.ema8 - overlays.emas.ema21).toFixed(2) : null
    }
  }

  // Ichimoku detailed components
  if (overlays?.ichimoku) {
    const ichi = overlays.ichimoku
    context.ichimokuDetails = {
      tenkan: ichi.tenkan,
      kijun: ichi.kijun,
      senkouA: ichi.senkouA,
      senkouB: ichi.senkouB,
      chikou: ichi.chikou,
      priceVsCloud: context.price?.current > Math.max(ichi.senkouA || 0, ichi.senkouB || 0) ? 'above' :
                    context.price?.current < Math.min(ichi.senkouA || 0, ichi.senkouB || 0) ? 'below' : 'inside'
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

  // Header - Make it very clear which symbol has live data
  parts.push(`╔════════════════════════════════════════╗`)
  parts.push(`║  🔴 LIVE DATA: ${context.symbol.padEnd(24)} ║`)
  parts.push(`╚════════════════════════════════════════╝`)
  parts.push(`Time: ${context.timestamp}`)
  parts.push(`Market: ${context.marketHours ? '🟢 OPEN' : '🔴 CLOSED'}`)
  parts.push(`Timeframe: ${context.timeframe || '1Min'}`)
  parts.push('')

  // Price with full OHLCV
  if (context.price) {
    parts.push(`💰 PRICE: ${context.price.formatted} (${context.price.change || '0%'}) ${context.price.changeDirection || ''}`)
    if (context.price.barRange) {
      parts.push(`└─ Range: ${context.price.barRange}, Vol: ${context.price.volume?.toLocaleString() || 'N/A'}`)
    }
  }

  // Unicorn Score (most important) with component breakdown
  if (context.unicornScore !== undefined) {
    parts.push(`\n🦄 **UNICORN SCORE: ${context.unicornScore.current}/100** (${context.unicornScore.quality})`)
    parts.push(`└─ ${context.unicornScore.interpretation}`)

    // Show component breakdown
    if (context.unicornScore.components) {
      const comps = context.unicornScore.components
      const breakdown = []
      if (comps.pivotRibbon !== undefined) breakdown.push(`Pivot: ${comps.pivotRibbon}`)
      if (comps.ripster3450 !== undefined) breakdown.push(`Ripster: ${comps.ripster3450}`)
      if (comps.satyTrigger !== undefined) breakdown.push(`SATY: ${comps.satyTrigger}`)
      if (comps.squeeze !== undefined) breakdown.push(`Squeeze: ${comps.squeeze}`)
      if (comps.ichimoku !== undefined) breakdown.push(`Ichi: ${comps.ichimoku}`)
      if (breakdown.length > 0) {
        parts.push(`└─ Components: ${breakdown.join(', ')}`)
      }
    }

    // If score is 0, explicitly state why
    if (context.unicornScore.current === 0) {
      parts.push(`└─ ⚠️ Score is 0 because NO bullish conditions are met (data is VALID, just no setup)`)
    }
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

  // Support/Resistance with detailed SATY levels
  if (context.satyLevels) {
    parts.push(`\n📊 SATY Levels:`)
    if (context.satyLevels.t0236_dn) {
      parts.push(`└─ Stop Zone: $${context.satyLevels.t0236_dn.toFixed(2)} - $${context.satyLevels.t0236_up?.toFixed(2)}`)
      parts.push(`└─ Target Zone: $${context.satyLevels.t1000_dn?.toFixed(2)} - $${context.satyLevels.t1000_up?.toFixed(2)}`)
      parts.push(`└─ ATR: $${context.satyLevels.atr?.toFixed(2)}`)
    } else {
      parts.push(`└─ ${context.satyLevels.interpretation}`)
    }
  }

  // TTM Squeeze (critical for volatility)
  if (context.ttmSqueeze) {
    parts.push(`\n💥 TTM Squeeze: ${context.ttmSqueeze.inSqueeze ? '🔴 ACTIVE' : '🟢 RELEASED'}`)
    parts.push(`└─ ${context.ttmSqueeze.interpretation}`)
    if (context.ttmSqueeze.momentum !== undefined) {
      parts.push(`└─ Momentum: ${context.ttmSqueeze.momentum.toFixed(2)}`)
    }
  }

  // EMA precise values
  if (context.emaValues) {
    parts.push(`\n📈 EMA Values:`)
    parts.push(`└─ EMA 8: $${context.emaValues.ema8?.toFixed(2)}, EMA 21: $${context.emaValues.ema21?.toFixed(2)}`)
    if (context.emaValues.spread) {
      parts.push(`└─ Spread: $${context.emaValues.spread} (${parseFloat(context.emaValues.spread) > 0 ? 'bullish gap' : 'bearish gap'})`)
    }
  }

  // Ichimoku detailed components
  if (context.ichimokuDetails) {
    const ichi = context.ichimokuDetails
    parts.push(`\n☁️ Ichimoku Components:`)
    parts.push(`└─ Tenkan: $${ichi.tenkan?.toFixed(2)}, Kijun: $${ichi.kijun?.toFixed(2)}`)
    parts.push(`└─ Cloud: $${ichi.senkouA?.toFixed(2)} - $${ichi.senkouB?.toFixed(2)}`)
    parts.push(`└─ Price vs Cloud: ${ichi.priceVsCloud.toUpperCase()}`)
  }

  // Multi-timeframe context
  if (context.multiTimeframe) {
    parts.push(`\n⏰ Higher Timeframe Context:`)
    parts.push(`└─ ${context.multiTimeframe.interpretation}`)
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
