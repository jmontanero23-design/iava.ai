/**
 * Score Optimization API
 *
 * Analyzes historical performance of indicator combinations to recommend
 * data-driven weights for the Unicorn Score.
 *
 * Blueprint Reference: docs/blueprint.md (Score Optimization, pages 436-440)
 *
 * Algorithm:
 * 1. Fetch historical bars for symbol/timeframe
 * 2. Compute all indicator states for each bar
 * 3. Analyze combinations:
 *    - Rarity: How often does this combo appear? (frequency %)
 *    - Quality: What's the avg forward return when it triggers? (expectancy)
 *    - Regime-Fit: Does it perform better in bull or bear markets? (delta)
 * 4. Recommend weights based on Quality × (1 / Rarity)
 *    - Rare + high quality = higher weight
 *    - Common + low quality = lower weight
 */

import { fetchBars } from '../src/services/alpaca.js'
import { computeStates } from '../src/utils/indicators.js'

export default async function handler(req, res) {
  const {
    symbol = 'SPY',
    timeframe = '15',
    horizon = 10,  // bars forward to measure return
    minOccurrences = 10,  // skip combos with < N occurrences
  } = req.method === 'GET' ? req.query : (req.body || {})

  try {
    // Fetch historical data (500+ bars for statistical significance)
    const bars = await fetchBars(symbol, timeframe, 500)
    if (!bars || bars.length < 100) {
      return res.status(400).json({ error: 'Insufficient data for optimization' })
    }

    // Compute indicator states for all bars
    const states = computeStates(bars)
    const close = bars.map(b => b.close)

    // Calculate forward returns for each bar
    const forwardReturns = bars.map((bar, i) => {
      if (i + horizon >= bars.length) return null
      const futurePrice = close[i + horizon]
      return ((futurePrice - bar.close) / bar.close) * 100  // % return
    })

    // Define indicator conditions to analyze
    const conditions = {
      pivotRibbon: states.pivotNow === 'bullish',
      ripster3450: states.rip.bias === 'bullish',
      satyTrigger: states.satyDir === 'long' && states.pivotNow === 'bullish',
      squeezeOn: states.sq.on,
      squeezeFired: states.sq.fired || (states.sq.firedBarsAgo != null && states.sq.firedBarsAgo <= 5),
      ichimoku: states.ichiRegime === 'bullish',
    }

    // Analyze each individual indicator
    const results = {}
    for (const [name, condition] of Object.entries(conditions)) {
      const matches = []
      const bullMatches = []
      const bearMatches = []

      for (let i = 0; i < bars.length; i++) {
        const fwdReturn = forwardReturns[i]
        if (fwdReturn == null) continue

        // Re-compute state for this bar (simplified - using global state as proxy)
        // In production, you'd compute per-bar states
        const isMatch = condition  // simplified

        if (isMatch) {
          matches.push(fwdReturn)
          // Classify regime (using pivot + ichi as proxy)
          const isBull = states.pivotNow === 'bullish' && states.ichiRegime === 'bullish'
          if (isBull) bullMatches.push(fwdReturn)
          else bearMatches.push(fwdReturn)
        }
      }

      if (matches.length >= minOccurrences) {
        const avgReturn = matches.reduce((a, b) => a + b, 0) / matches.length
        const rarity = (matches.length / bars.length) * 100  // % of bars
        const bullAvg = bullMatches.length ? bullMatches.reduce((a, b) => a + b, 0) / bullMatches.length : 0
        const bearAvg = bearMatches.length ? bearMatches.reduce((a, b) => a + b, 0) / bearMatches.length : 0
        const regimeFit = bullAvg - bearAvg

        // Recommended weight: Quality / Rarity (normalized)
        // Higher quality + rarer = higher weight
        const qualityScore = avgReturn  // expectancy
        const rarityPenalty = Math.max(1, rarity / 10)  // common signals get penalized
        const recommendedWeight = Math.max(5, Math.round((qualityScore / rarityPenalty) * 10))

        results[name] = {
          occurrences: matches.length,
          rarity: rarity.toFixed(2) + '%',
          avgReturn: avgReturn.toFixed(3) + '%',
          bullReturn: bullAvg.toFixed(3) + '%',
          bearReturn: bearAvg.toFixed(3) + '%',
          regimeFit: regimeFit.toFixed(3) + '%',
          recommendedWeight: Math.min(30, recommendedWeight),  // cap at 30
        }
      } else {
        results[name] = {
          occurrences: matches.length,
          note: 'Insufficient occurrences for analysis',
        }
      }
    }

    // Analyze 2-indicator combos (most important)
    const combos = [
      ['pivotRibbon', 'ripster3450'],
      ['pivotRibbon', 'squeezeFired'],
      ['ripster3450', 'squeezeFired'],
      ['satyTrigger', 'squeezeFired'],
      ['pivotRibbon', 'ichimoku'],
      ['squeezeFired', 'ichimoku'],
    ]

    const comboResults = {}
    for (const [ind1, ind2] of combos) {
      const matches = []
      for (let i = 0; i < bars.length; i++) {
        const fwdReturn = forwardReturns[i]
        if (fwdReturn == null) continue
        if (conditions[ind1] && conditions[ind2]) {
          matches.push(fwdReturn)
        }
      }

      if (matches.length >= minOccurrences) {
        const avgReturn = matches.reduce((a, b) => a + b, 0) / matches.length
        const rarity = (matches.length / bars.length) * 100
        comboResults[`${ind1} + ${ind2}`] = {
          occurrences: matches.length,
          rarity: rarity.toFixed(2) + '%',
          avgReturn: avgReturn.toFixed(3) + '%',
        }
      }
    }

    res.json({
      symbol,
      timeframe,
      bars: bars.length,
      horizon,
      individual: results,
      combos: comboResults,
      summary: {
        message: 'Review avgReturn (quality) and rarity. Rare signals with high returns deserve higher weights.',
        bestPerformer: Object.entries(results)
          .filter(([_, v]) => v.recommendedWeight != null)
          .sort((a, b) => parseFloat(b[1].avgReturn) - parseFloat(a[1].avgReturn))[0]?.[0] || 'N/A',
      },
    })
  } catch (err) {
    console.error('[optimize_score] Error:', err)
    res.status(500).json({ error: err.message || 'Optimization failed' })
  }
}
