/**
 * Unicorn Score Weights Configuration
 *
 * Blueprint Reference: docs/blueprint.md (Score Optimization section)
 *
 * These weights determine how much each indicator contributes to the Unicorn Score.
 * Initial values are heuristic; run optimization to get data-driven weights.
 *
 * Score Formula:
 * - pivotRibbon: Saty Pivot Ribbon bullish state (8>21>34)
 * - ripster3450: Ripster 34-50 EMA cloud bullish bias
 * - satyTrigger: SATY ATR trigger in direction of trend
 * - squeeze: TTM Squeeze state (ON=10, fired aligned=25 decayed)
 * - ichimoku: Ichimoku regime bullish (price above cloud)
 *
 * Max Possible Score: 100 (all conditions perfect)
 * Threshold: 70+ triggers unicorn signals
 */

export const UNICORN_WEIGHTS = {
  pivotRibbon: 20,      // Trend confirmation via EMA ribbon
  ripster3450: 20,      // Core trend filter (Ripster's "decider")
  satyTrigger: 20,      // Breakout structure + trend alignment
  squeezeOn: 10,        // Volatility compression building
  squeezeFired: 25,     // Squeeze release (decays to 5 over 5 bars)
  ichimoku: 15,         // Multi-timeframe regime confirmation
}

export const THRESHOLD_DEFAULT = 70

/**
 * Regime-specific threshold adjustments
 * In choppy/ranging markets, require higher score
 * In strong trends, can lower threshold slightly
 */
export const REGIME_THRESHOLDS = {
  trending: 65,    // Lower threshold in strong trends
  ranging: 75,     // Higher threshold in choppy markets
  volatile: 70,    // Normal threshold in volatile regimes
  default: 70,
}

/**
 * Update weights from optimization results
 */
export function updateWeights(newWeights) {
  Object.assign(UNICORN_WEIGHTS, newWeights)
}

/**
 * Reset to defaults
 */
export function resetWeights() {
  UNICORN_WEIGHTS.pivotRibbon = 20
  UNICORN_WEIGHTS.ripster3450 = 20
  UNICORN_WEIGHTS.satyTrigger = 20
  UNICORN_WEIGHTS.squeezeOn = 10
  UNICORN_WEIGHTS.squeezeFired = 25
  UNICORN_WEIGHTS.ichimoku = 15
}
