/**
 * Signal Trade Recording API
 * Records trades associated with specific signal types
 */

import jwt from 'jsonwebtoken';
import { trades, signalScores } from '../../lib/db/neon.js';
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

    switch (req.method) {
      case 'POST':
        // Record new trade
        const {
          symbol,
          side,
          quantity,
          price,
          orderType,
          signalType,
          stopLoss,
          takeProfit,
          notes
        } = req.body;

        // Validation
        if (!symbol || !side || !quantity || !price) {
          return res.status(400).json({ error: 'Missing required trade fields' });
        }

        // Create trade record
        const newTrade = await trades.create({
          userId,
          symbol,
          side,
          quantity,
          price,
          orderType: orderType || 'market',
          status: 'pending',
          stopLoss,
          takeProfit,
          notes,
          tags: signalType ? [signalType] : []
        });

        // Clear cache for this user's trades
        await cache.delete(`trades:${userId}:recent`);

        // If signal type provided, update signal scoring
        if (signalType) {
          // This will be used for performance tracking
          await cache.set(
            `trade:signal:${newTrade.id}`,
            { signalType, userId, symbol },
            86400 // 24 hour TTL
          );
        }

        return res.status(201).json({
          success: true,
          trade: newTrade
        });

      case 'GET':
        // Get user's trades
        const limit = parseInt(req.query.limit) || 100;
        const cacheKey = `trades:${userId}:recent`;

        // Check cache
        const cached = await cache.get(cacheKey);
        if (cached) {
          return res.status(200).json({
            success: true,
            trades: cached,
            cached: true
          });
        }

        // Get from database
        const userTrades = await trades.findByUser(userId, limit);

        // Cache for quick access
        if (userTrades.length > 0) {
          await cache.set(cacheKey, userTrades, 60); // 1 minute cache
        }

        return res.status(200).json({
          success: true,
          trades: userTrades
        });

      case 'PATCH':
        // Update trade (e.g., when filled, or updating P&L)
        const { tradeId } = req.query;
        const updates = req.body;

        if (!tradeId) {
          return res.status(400).json({ error: 'Trade ID required' });
        }

        let updatedTrade;

        // Handle status update
        if (updates.status) {
          updatedTrade = await trades.updateStatus(
            tradeId,
            updates.status,
            updates.filledAt || new Date()
          );
        }

        // Handle P&L update
        if (updates.pnl !== undefined && updates.pnlPercent !== undefined) {
          updatedTrade = await trades.updatePnL(
            tradeId,
            updates.pnl,
            updates.pnlPercent
          );

          // Update signal performance metrics if this trade has a signal type
          const signalData = await cache.get(`trade:signal:${tradeId}`);
          if (signalData) {
            // Record the performance for the signal type
            const score = updates.pnl > 0 ? 1 : -1; // Simple win/loss tracking
            await signalScores.create({
              userId: signalData.userId,
              symbol: signalData.symbol,
              timeframe: '1d', // Default to daily
              score,
              components: {
                trade: tradeId,
                pnl: updates.pnl,
                pnlPercent: updates.pnlPercent,
                signalType: signalData.signalType
              },
              regime: 'trading'
            });
          }
        }

        // Clear cache
        await cache.delete(`trades:${userId}:recent`);

        return res.status(200).json({
          success: true,
          trade: updatedTrade
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Signal Trade API] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}