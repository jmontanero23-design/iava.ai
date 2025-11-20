/**
 * Market Regime Detection API
 * PhD Elite+++ Quality Market Analysis
 */

import jwt from 'jsonwebtoken';
import { marketRegimes } from '../../lib/db/neon.js';
import { cache, marketData } from '../../lib/redis/client.js';

export default async function handler(req, res) {
  try {
    // Verify authentication (optional for read, required for write)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch {
        // Continue without auth for public reads
      }
    }

    switch (req.method) {
      case 'POST':
        // Store new regime detection (requires auth)
        if (!userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const {
          symbol,
          timeframe,
          regime,
          confidence,
          indicators,
          validMinutes = 60
        } = req.body;

        if (!symbol || !timeframe || !regime) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Calculate valid until time
        const validUntil = new Date(Date.now() + validMinutes * 60 * 1000);

        // Store in database (upsert)
        const savedRegime = await marketRegimes.upsert({
          symbol,
          timeframe,
          regime,
          confidence,
          indicators,
          validUntil
        });

        // Cache in Redis for fast access
        const cacheKey = `regime:${symbol}:${timeframe}`;
        await cache.set(cacheKey, savedRegime, validMinutes * 60);

        return res.status(201).json({
          success: true,
          regime: savedRegime
        });

      case 'GET':
        // Get current regime for symbol
        const querySymbol = req.query.symbol;
        const queryTimeframe = req.query.timeframe || '1Hour';

        if (!querySymbol) {
          return res.status(400).json({ error: 'Symbol required' });
        }

        // Check cache first
        const cacheKey = `regime:${querySymbol}:${queryTimeframe}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
          return res.status(200).json({
            success: true,
            regime: cached,
            cached: true
          });
        }

        // Get from database
        const currentRegime = await marketRegimes.getCurrent(querySymbol, queryTimeframe);

        if (currentRegime) {
          // Cache for next time (5 minute cache)
          await cache.set(cacheKey, currentRegime, 300);

          return res.status(200).json({
            success: true,
            regime: currentRegime
          });
        }

        return res.status(404).json({
          success: false,
          error: 'No current regime data available'
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Regime API] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}