/**
 * Ultra Elite AI Score API Endpoint
 * Calculates AI-powered trading score on the backend
 */

import { EnhancedUnicornScore } from '../../src/services/ai/enhancedUnicornScore.js';

const scorer = new EnhancedUnicornScore();

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
      priceCount: data.prices?.length,
      candleCount: data.candles?.length
    });
    console.log(`[AI Score] HuggingFace API Key configured:`, !!process.env.HUGGINGFACE_API_KEY);

    // Calculate the Ultra Elite AI Score on the backend
    // This has access to HUGGINGFACE_API_KEY environment variable
    const result = await scorer.calculateUltraUnicornScore(symbol, data);

    console.log(`[AI Score] Raw result ultraUnicornScore:`, result.ultraUnicornScore);
    console.log(`[AI Score] Result quality:`, result.quality);
    console.log(`[AI Score] Result type:`, typeof result.ultraUnicornScore);
    console.log(`[AI Score] Is NaN:`, isNaN(result.ultraUnicornScore));

    // Log AI Model Transparency
    if (result.breakdown?.aiTransparency) {
      console.log(`[AI Score] 🤖 AI Models:`, {
        total: result.breakdown.aiTransparency.totalModels,
        working: result.breakdown.aiTransparency.modelsWorking,
        failed: result.breakdown.aiTransparency.modelsFailed,
        successRate: result.breakdown.aiTransparency.successRate,
        workingModels: result.breakdown.aiTransparency.workingModels,
        failedModels: result.breakdown.aiTransparency.failedModels
      });
    }

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
          components: {},
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
