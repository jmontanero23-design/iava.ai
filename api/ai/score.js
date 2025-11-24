/**
 * Ultra Elite AI Score API Endpoint
 * Calculates AI-powered trading score on the backend
 *
 * PhD++ ENHANCED: Gated Bonus System
 * - Daily Confluence Gate: If enforceDaily=true and daily misaligned, cap at 50
 * - Daily Bonus: +5 when daily pivot + ichimoku agree with trade direction
 * - Consensus Bonus: +10 when secondary timeframe aligns
 * - Volume Breakout Bonus: +3 when volume > 2x average
 *
 * Formula: Base Score (50/25/25) + Bonuses (capped at 100)
 */

import { UltraEliteAI } from '../../src/services/ai/ultraEliteModels_v2_SIMPLIFIED.js';

// Helper to determine quality label from score
function getQuality(score) {
  if (score >= 80) return 'EXCEPTIONAL 🚀';
  if (score >= 70) return 'STRONG 💎';
  if (score >= 60) return 'GOOD 👍';
  if (score >= 50) return 'MODERATE 📊';
  if (score >= 40) return 'CAUTIOUS ⚠️';
  if (score >= 30) return 'WEAK 📉';
  return 'POOR ❌';
}

// Helper to determine risk level from score
function getRiskLevel(score) {
  if (score >= 70) return { level: 'low', factors: [], score };
  if (score >= 50) return { level: 'medium', factors: ['Mixed signals'], score };
  if (score >= 30) return { level: 'high', factors: ['Bearish indicators', 'Low confidence'], score };
  return { level: 'very_high', factors: ['Strong bearish signals', 'High risk'], score };
}

// Helper to get recommendation from action
function getRecommendation(action, score, confidence) {
  const recommendations = {
    'STRONG BUY': { action: 'STRONG BUY', positionSize: 100, reasoning: ['All signals aligned bullish', 'High confidence'] },
    'BUY': { action: 'BUY', positionSize: 75, reasoning: ['Bullish momentum', 'Good technical setup'] },
    'HOLD': { action: 'HOLD/WAIT', positionSize: 0, reasoning: ['Mixed signals', 'Wait for clearer direction'] },
    'SELL': { action: 'SELL', positionSize: 50, reasoning: ['Bearish momentum', 'Consider reducing position'] },
    'STRONG SELL': { action: 'STRONG SELL', positionSize: 100, reasoning: ['Strong bearish signals', 'Risk management priority'] }
  };
  return recommendations[action] || recommendations['HOLD'];
}

/**
 * PhD++ Gated Bonus System
 * @param {number} baseScore - The 50/25/25 weighted score
 * @param {object} options - Confluence options
 * @returns {{ finalScore: number, bonuses: object, gated: boolean }}
 */
function applyGatedBonuses(baseScore, options = {}) {
  const {
    enforceDaily = false,
    consensusBonus = false,
    dailyState = null,
    consensus = null,
    technicals = null
  } = options;

  const bonuses = {
    dailyConfluence: 0,
    consensusAlignment: 0,
    volumeBreakout: 0,
    total: 0
  };

  let gated = false;
  let gateReason = null;

  // Determine trade direction from base score
  const isBullish = baseScore >= 55;
  const isBearish = baseScore <= 45;

  // Check daily alignment
  let dailyAligned = true;
  if (dailyState) {
    const dailyPivotBullish = dailyState.pivotNow === 'bullish';
    const dailyIchiBullish = dailyState.ichiRegime === 'bullish';
    const dailyPivotBearish = dailyState.pivotNow === 'bearish';
    const dailyIchiBearish = dailyState.ichiRegime === 'bearish';

    // Daily is aligned if both pivot and ichi agree with our direction
    if (isBullish) {
      dailyAligned = dailyPivotBullish && dailyIchiBullish;
    } else if (isBearish) {
      dailyAligned = dailyPivotBearish && dailyIchiBearish;
    } else {
      // Neutral - no alignment needed
      dailyAligned = true;
    }
  }

  // GATE: If enforceDaily is ON and daily is NOT aligned, cap score at 50
  if (enforceDaily && !dailyAligned && (isBullish || isBearish)) {
    gated = true;
    gateReason = 'Daily confluence not met (Pivot/Ichimoku misaligned)';
    console.log(`[AI Score] ⛔ GATED: ${gateReason}`);
    return {
      finalScore: Math.min(baseScore, 50), // Cap at neutral
      bonuses,
      gated,
      gateReason
    };
  }

  // BONUS 1: Daily Confluence (+5)
  if (dailyAligned && dailyState && (isBullish || isBearish)) {
    bonuses.dailyConfluence = 5;
    console.log(`[AI Score] ✅ Daily Confluence Bonus: +5`);
  }

  // BONUS 2: Consensus Alignment (+10)
  if (consensusBonus && consensus?.align) {
    bonuses.consensusAlignment = 10;
    console.log(`[AI Score] ✅ Consensus Bonus: +10 (Secondary TF aligned)`);
  }

  // BONUS 3: Volume Breakout (+3)
  if (technicals?.relativeVolume > 2.0) {
    bonuses.volumeBreakout = 3;
    console.log(`[AI Score] ✅ Volume Breakout Bonus: +3 (${technicals.relativeVolume.toFixed(1)}x avg)`);
  }

  // Calculate total bonuses
  bonuses.total = bonuses.dailyConfluence + bonuses.consensusAlignment + bonuses.volumeBreakout;

  // Apply bonuses (capped at 100)
  const finalScore = Math.min(100, baseScore + bonuses.total);

  console.log(`[AI Score] 📊 Base: ${baseScore.toFixed(1)} + Bonuses: ${bonuses.total} = Final: ${finalScore.toFixed(1)}`);

  return {
    finalScore,
    bonuses,
    gated,
    gateReason
  };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol, data, settings = {} } = req.body;

    if (!symbol || !data) {
      return res.status(400).json({ error: 'Symbol and data required' });
    }

    // Extract settings for gated bonus system
    const {
      enforceDaily = false,
      consensusBonus = false,
      dailyState = null,
      consensus = null
    } = settings;

    console.log(`[AI Score] Calculating for ${symbol}...`);
    console.log(`[AI Score] Settings:`, { enforceDaily, consensusBonus, hasDaily: !!dailyState, hasConsensus: !!consensus });
    console.log(`[AI Score] Data structure:`, {
      hasPrices: !!data.prices,
      hasCandles: !!data.candles,
      hasNews: !!data.news,
      hasState: !!data.state,
      hasTechnicals: !!data.technicals,
      technicalScore: data.technicals?.score,
      priceCount: data.prices?.length,
      candleCount: data.candles?.length
    });

    // Create scorer instance inside handler for serverless compatibility
    const scorer = new UltraEliteAI();

    // Calculate the Ultra Elite AI Score using SIMPLIFIED module
    const rawResult = await scorer.generateUltraSignal(symbol, data);

    // Apply gated bonus system
    const bonusResult = applyGatedBonuses(rawResult.ultraScore, {
      enforceDaily,
      consensusBonus,
      dailyState,
      consensus,
      technicals: data.technicals
    });

    // Map to expected response format
    const ultraScore = bonusResult.finalScore;
    const result = {
      symbol,
      ultraUnicornScore: ultraScore,
      baseScore: rawResult.ultraScore, // Pre-bonus score
      quality: getQuality(ultraScore),
      risk: getRiskLevel(ultraScore),
      recommendation: getRecommendation(
        bonusResult.gated ? 'HOLD' : rawResult.action,
        ultraScore,
        rawResult.confidence
      ),
      components: {
        technical: data.technicals?.score || 50,
        sentiment: rawResult.signals?.sentiment?.ensemble_scores?.positive * 100 || 50,
        forecast: rawResult.signals?.ai_forecast?.accuracy_score * 100 || 50
      },
      signals: {
        technical: data.technicals?.score || 50,
        ai: ultraScore,
        bonuses: bonusResult.bonuses.total
      },
      bonuses: {
        ...bonusResult.bonuses,
        gated: bonusResult.gated,
        gateReason: bonusResult.gateReason
      },
      breakdown: {
        ...rawResult.breakdown,
        formula: `Base (${rawResult.ultraScore.toFixed(1)}) + Daily (${bonusResult.bonuses.dailyConfluence}) + Consensus (${bonusResult.bonuses.consensusAlignment}) + Volume (${bonusResult.bonuses.volumeBreakout}) = ${ultraScore.toFixed(1)}`,
        aiTransparency: {
          totalModels: rawResult.breakdown?.totalModels || 0,
          modelsWorking: rawResult.breakdown?.modelsUsed?.length || 0,
          modelsFailed: rawResult.breakdown?.modelsFailed?.length || 0,
          successRate: rawResult.breakdown?.successRate || 'N/A',
          workingModels: rawResult.breakdown?.modelsUsed || [],
          failedModels: rawResult.breakdown?.modelsFailed || []
        }
      },
      confidence: rawResult.confidence,
      timestamp: rawResult.timestamp
    };

    console.log(`[AI Score] ✅ Final ultraUnicornScore:`, result.ultraUnicornScore);
    console.log(`[AI Score] 📊 Breakdown:`, result.breakdown.formula);
    console.log(`[AI Score] Quality:`, result.quality);
    console.log(`[AI Score] Gated:`, bonusResult.gated ? `YES - ${bonusResult.gateReason}` : 'No');

    // Validate result - if invalid, return fallback
    if (!result || typeof result.ultraUnicornScore !== 'number' || isNaN(result.ultraUnicornScore)) {
      console.error(`[AI Score] Invalid score calculated - returning fallback`);
      return res.status(200).json({
        success: true,
        score: {
          symbol,
          ultraUnicornScore: 50,
          baseScore: 50,
          quality: 'MODERATE 📊',
          risk: { level: 'medium', factors: [], score: 50 },
          recommendation: { action: 'HOLD/WAIT', positionSize: 0, reasoning: ['AI models loading - using fallback'] },
          components: { technical: 50, sentiment: 50, forecast: 50 },
          signals: { technical: 50, ai: 50, bonuses: 0 },
          bonuses: { dailyConfluence: 0, consensusAlignment: 0, volumeBreakout: 0, total: 0, gated: false },
          confidence: 0.5,
          timestamp: Date.now(),
          fallback: true
        }
      });
    }

    res.status(200).json({
      success: true,
      score: result
    });

  } catch (error) {
    console.error('[AI Score] Error:', error);
    console.error('[AI Score] Stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Failed to calculate AI score'
    });
  }
}
