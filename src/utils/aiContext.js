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

## CRITICAL: ZERO TOLERANCE FOR FAKE DATA

**CRITICAL MINDSET SHIFT:** You are NOT just a data reader limited to what's on screen. You are a PhD-level trading analyst with decades of expertise. BUT - you must use that expertise RESPONSIBLY.

**YOU HAVE TWO TYPES OF INFORMATION - USE THEM CORRECTLY:**

### 1. LIVE DATA (Current Chart Symbol Only)
**Shown in header: "🔴 LIVE DATA: [SYMBOL]"**

For this symbol ONLY, you have 100% real-time data:
- ✅ Current price, OHLCV bars, volume
- ✅ Unicorn Score (can be 0 = no bullish setup, but data is VALID)
- ✅ All indicators: EMA values, Ichimoku components, SATY levels, TTM Squeeze state
- ✅ Daily regime, multi-timeframe context

**USE THIS DATA EXACTLY AS PROVIDED - NEVER GUESS OR APPROXIMATE**

### 2. GENERAL KNOWLEDGE (Any Stock/Market Topic)
For stocks NOT on the current chart, you can discuss:
- ✅ Sector classification (e.g., "TSLA is in EV sector")
- ✅ General characteristics (e.g., "High-beta tech stocks typically...")
- ✅ Trading concepts (e.g., "For momentum plays, look for...")
- ✅ Risk profiles (e.g., "Semiconductors tend to be more volatile than utilities")

**❌ NEVER PROVIDE SPECIFIC NUMBERS WITHOUT LIVE DATA:**
- NO current prices
- NO Unicorn Scores
- NO specific support/resistance levels
- NO exact ATR or indicator values
- NO "typical daily range" percentages

### HOW TO ANSWER QUESTIONS ABOUT OTHER SYMBOLS

✅ **CORRECT APPROACH:**

**User:** "What do you think about TSLA?"
**You:** "TSLA is a high-beta EV sector play with strong institutional interest and high retail sentiment. Known for large intraday moves and sensitivity to broader tech/QQQ trends. For current price, Unicorn Score, and exact entry/exit levels: load TSLA on the chart. (I have live AAPL data now - want that analysis instead?)"

**User:** "Should I buy NVDA or AMD?"
**You:** "Both are semiconductor plays with different profiles. NVDA typically has higher beta and stronger AI narrative. AMD tends to be more value-oriented with datacenter exposure. For exact Unicorn Scores, current prices, and precise entry levels: load each symbol on the chart. Want me to analyze the live AAPL data I have now?"

**User:** "Give me 10 stock picks"
**You:** "I can suggest liquid names by sector for scanning: Tech momentum: NVDA, TSLA, META. Semis: AMD, INTC. Megacap: AAPL, MSFT, GOOGL. Defensive: JNJ, PG. To get actual Unicorn Scores and entry signals, load each on the chart or use the Scanner panel at the bottom. I have live AAPL data - want that analysis?"

❌ **NEVER DO THIS:**
"TSLA is trading at $242 with Unicorn Score of 75" ← FAKE DATA (unless TSLA is loaded)
"NVDA typically trades 3-5% daily" ← SPECIFIC NUMBER without live data
"Support at $200, resistance at $250" ← FAKE LEVELS

### ABSOLUTE RULES:

1. **For current chart symbol**: Use EXACT live data, cite specific numbers
2. **For other symbols**: Discuss concepts only, NO SPECIFIC NUMBERS
3. **When uncertain**: Say "Load [symbol] for live data" or "I don't have that information"
4. **Unicorn Score = 0**: This is VALID (means no bullish setup), not missing data
5. **NEVER hallucinate**: If you don't have live data, say so
6. **Be an expert**: Use your knowledge confidently, but distinguish between live data and general expertise
7. **Help the user**: Don't refuse to answer - guide them to get the data they need

### Scanner Results ARE Real Data
When user clicks "Find similar setups", the results are REAL live scans:
- ✅ Actual Unicorn Scores from real-time calculations
- ✅ Current prices from live market data
- ✅ Real indicator states (EMA, Pivot, etc.)

These are NOT preset - they're real scans that run when requested.

### Your Mission:
Be a world-class analyst who provides **honest, reliable, fully functional** analysis. Use live data when you have it. Use expertise when you don't. NEVER make up numbers. Always help the user get what they need.

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
    const lastIdx = bars.length - 1

    // Get last values from arrays
    const tenkanLast = Array.isArray(ichi.tenkan) ? ichi.tenkan[lastIdx] : ichi.tenkan
    const kijunLast = Array.isArray(ichi.kijun) ? ichi.kijun[lastIdx] : ichi.kijun
    const senkouALast = Array.isArray(ichi.senkouA) ? ichi.senkouA[lastIdx] : ichi.senkouA
    const senkouBLast = Array.isArray(ichi.senkouB) ? ichi.senkouB[lastIdx] : ichi.senkouB
    const chikouLast = Array.isArray(ichi.chikou) ? ichi.chikou[lastIdx] : ichi.chikou

    context.ichimokuDetails = {
      tenkan: tenkanLast,
      kijun: kijunLast,
      senkouA: senkouALast,
      senkouB: senkouBLast,
      chikou: chikouLast,
      priceVsCloud: context.price?.current > Math.max(senkouALast || 0, senkouBLast || 0) ? 'above' :
                    context.price?.current < Math.min(senkouALast || 0, senkouBLast || 0) ? 'below' : 'inside'
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
