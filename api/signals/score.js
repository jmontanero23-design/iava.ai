/**
 * Signal Score API Endpoint
 * PhD Elite+++ Quality Signal Analysis
 */

import jwt from 'jsonwebtoken';
import { signalScores, users } from '../../lib/db/neon.js';
import { cache } from '../../lib/redis/client.js';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;

    // Handle different methods
    switch (req.method) {
      case 'POST':
        // Record new signal score
        const { symbol, timeframe, score, components, regime } = req.body;

        if (!symbol || !timeframe || score === undefined) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Store in database
        const newScore = await signalScores.create({
          userId,
          symbol,
          timeframe,
          score,
          components,
          regime
        });

        // Cache for quick access (5 minute TTL)
        await cache.set(
          `signal:${userId}:${symbol}:${timeframe}`,
          newScore,
          300
        );

        return res.status(201).json({
          success: true,
          score: newScore
        });

      case 'GET':
        // Get signal scores
        const querySymbol = req.query.symbol;
        const limit = parseInt(req.query.limit) || 10;

        if (!querySymbol) {
          return res.status(400).json({ error: 'Symbol required' });
        }

        // Check cache first
        const cacheKey = `signal:${userId}:${querySymbol}:recent`;
        const cached = await cache.get(cacheKey);
        if (cached) {
          return res.status(200).json({
            success: true,
            scores: cached,
            cached: true
          });
        }

        // Get from database
        const scores = await signalScores.findBySymbol(userId, querySymbol, limit);

        // Cache for next time
        if (scores.length > 0) {
          await cache.set(cacheKey, scores, 60); // 1 minute cache
        }

        return res.status(200).json({
          success: true,
          scores
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Signal Score API] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}