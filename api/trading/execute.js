/**
 * Enhanced Trading Execution API
 * PhD Elite+++ Quality Order Management with Database Integration
 */

import jwt from 'jsonwebtoken';
import { trades, users } from '../../lib/db/neon.js';
import { cache, rateLimit } from '../../lib/redis/client.js';

export default async function handler(req, res) {
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;

    // Rate limiting (max 10 orders per minute)
    const rateLimitResult = await rateLimit.check(`trading:${userId}`, 10, 60);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      });
    }

    // Get user's Alpaca credentials
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse request body
    const {
      symbol,
      side,
      qty,
      type = 'market',
      timeInForce = 'day',
      takeProfit,
      stopLoss,
      orderClass,
      signalType,
      notes
    } = req.body;

    // Validation
    if (!symbol || !side || !qty) {
      return res.status(400).json({ error: 'Missing required fields: symbol, side, qty' });
    }

    // Use environment Alpaca keys or user's custom keys (if they have them)
    const alpacaKey = user.alpaca_key_encrypted || process.env.ALPACA_KEY_ID;
    const alpacaSecret = user.alpaca_secret_encrypted || process.env.ALPACA_SECRET_KEY;
    const isPaper = user.alpaca_is_paper !== false; // Default to paper trading

    if (!alpacaKey || !alpacaSecret) {
      return res.status(400).json({ error: 'Alpaca credentials not configured' });
    }

    // Create trade record in database (pending status)
    const tradeRecord = await trades.create({
      userId,
      symbol,
      side,
      quantity: qty,
      price: 0, // Will be updated when order fills
      orderType: type,
      status: 'pending',
      stopLoss: stopLoss?.stop_price,
      takeProfit: takeProfit?.limit_price,
      notes: notes || `Signal: ${signalType || 'manual'}`,
      tags: signalType ? [signalType] : ['manual']
    });

    try {
      // Forward to Alpaca order endpoint with enhanced payload
      const alpacaBase = isPaper ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets';

      // Build order payload
      const orderPayload = {
        symbol,
        side,
        qty: String(qty),
        type,
        time_in_force: timeInForce
      };

      // Add bracket order if specified
      if (orderClass === 'bracket' && (takeProfit || stopLoss)) {
        orderPayload.order_class = 'bracket';
        if (takeProfit?.limit_price) {
          orderPayload.take_profit = { limit_price: Number(takeProfit.limit_price) };
        }
        if (stopLoss?.stop_price) {
          orderPayload.stop_loss = { stop_price: Number(stopLoss.stop_price) };
          if (stopLoss.limit_price) {
            orderPayload.stop_loss.limit_price = Number(stopLoss.limit_price);
          }
        }
      }

      // Submit order to Alpaca
      const alpacaResponse = await fetch(`${alpacaBase}/v2/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret
        },
        body: JSON.stringify(orderPayload)
      });

      const alpacaOrder = await alpacaResponse.json();

      if (!alpacaResponse.ok) {
        // Update trade record with error
        await trades.updateStatus(tradeRecord.id, 'rejected');
        return res.status(alpacaResponse.status).json({
          error: alpacaOrder.message || 'Order rejected by Alpaca',
          details: alpacaOrder
        });
      }

      // Update trade record with Alpaca order ID
      await trades.updateStatus(tradeRecord.id, 'submitted');

      // Store order mapping in cache for webhook updates
      await cache.set(
        `order:${alpacaOrder.id}`,
        { tradeId: tradeRecord.id, userId },
        86400 // 24 hour TTL
      );

      // Clear user's trade cache
      await cache.delete(`trades:${userId}:recent`);

      // Return success with both database and Alpaca info
      return res.status(200).json({
        success: true,
        trade: {
          id: tradeRecord.id,
          alpacaOrderId: alpacaOrder.id,
          status: alpacaOrder.status,
          symbol: alpacaOrder.symbol,
          side: alpacaOrder.side,
          qty: alpacaOrder.qty,
          type: alpacaOrder.order_type,
          createdAt: alpacaOrder.created_at
        },
        message: `Order ${alpacaOrder.status} for ${alpacaOrder.qty} shares of ${alpacaOrder.symbol}`
      });

    } catch (orderError) {
      // Update trade record with error
      await trades.updateStatus(tradeRecord.id, 'error');
      console.error('[Trading Execute] Order error:', orderError);

      return res.status(500).json({
        error: 'Failed to submit order',
        details: orderError.message
      });
    }

  } catch (error) {
    console.error('[Trading Execute] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}