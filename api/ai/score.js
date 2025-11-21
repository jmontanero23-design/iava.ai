/**
 * Ultra Elite AI Score API Endpoint
 * Calculates AI-powered trading score on the backend
 *
 * FIXED: Now uses ultraEliteModels_v2_SIMPLIFIED.js directly
 * - Correct technical score (reads data.technicals.score)
 * - Correct sentiment score (reads ensemble_scores.positive)
 * - No more RL, Quantum, Patterns (removed)
 * - Clean 50/25/25 formula
 */

import { UltraEliteAI } from '../../src/services/ai/ultraEliteModels_v2_SIMPLIFIED.js';

const scorer = new UltraEliteAI();

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
    const { symbol, data } = req.body;

    if (!symbol || !data) {
      return res.status(400).json({ error: 'Symbol and data required' });
    }

    console.log(`[AI Score] Calculating for ${symbol}...`);
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
    console.log(`[AI Score] HuggingFace API Key configured:`, !!process.env.HUGGINGFACE_API_KEY);
    console.log(`[AI Score] Modal Chronos API configured:`, !!process.env.MODAL_CHRONOS_API || !!process.env.VITE_MODAL_CHRONOS_API);

    // Calculate the Ultra Elite AI Score using SIMPLIFIED module
    // This correctly reads data.technicals.score and sentiment.ensemble_scores
    const rawResult = await scorer.generateUltraSignal(symbol, data);

    // Map to expected response format
    const ultraScore = rawResult.ultraScore;
    const result = {
      symbol,
      ultraUnicornScore: ultraScore,
      quality: getQuality(ultraScore),
      risk: getRiskLevel(ultraScore),
      recommendation: getRecommendation(rawResult.action, ultraScore, rawResult.confidence),
      components: {
        technical: data.technicals?.score || 50,
        sentiment: rawResult.signals?.sentiment?.ensemble_scores?.positive * 100 || 50,
        forecast: rawResult.signals?.ai_forecast?.accuracy_score * 100 || 50
      },
      signals: {
        technical: data.technicals?.score || 50,
        ai: ultraScore,
        bonuses: 0
      },
      breakdown: {
        ...rawResult.breakdown,
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
    console.log(`[AI Score] Components:`, result.components);
    console.log(`[AI Score] Quality:`, result.quality);
    console.log(`[AI Score] Action:`, rawResult.action);

    // Log AI Model Transparency
    console.log(`[AI Score] 🤖 AI Models:`, {
      working: rawResult.breakdown?.modelsUsed || [],
      failed: rawResult.breakdown?.modelsFailed || [],
      successRate: rawResult.breakdown?.successRate || 'N/A'
    });

    // Validate result - if invalid, return fallback
    if (!result || typeof result.ultraUnicornScore !== 'number' || isNaN(result.ultraUnicornScore)) {
      console.error(`[AI Score] Invalid score calculated - returning fallback`);
      return res.status(200).json({
        success: true,
        score: {
          symbol,
          ultraUnicornScore: 50,
          quality: 'MODERATE 👍',
          risk: { level: 'medium', factors: [], score: 50 },
          recommendation: { action: 'HOLD/WAIT', positionSize: 0, reasoning: ['AI models loading - using fallback'] },
          components: { technical: 50, sentiment: 50, forecast: 50 },
          signals: { technical: 50, ai: 50, bonuses: 0 },
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
