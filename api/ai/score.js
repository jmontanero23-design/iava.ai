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

    // Calculate the Ultra Elite AI Score on the backend
    // This has access to HUGGINGFACE_API_KEY environment variable
    const result = await scorer.calculateUltraUnicornScore(symbol, data);

    console.log(`[AI Score] Calculated for ${symbol}:`, result.ultraUnicornScore);

    res.status(200).json({
      success: true,
      score: result
    });

  } catch (error) {
    console.error('[AI Score] Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to calculate AI score'
    });
  }
}
