/**
 * WebSocket Streaming API
 * Real-time market data and order updates
 */

import jwt from 'jsonwebtoken';
import { websocket } from '../../lib/redis/client.js';

// Note: Vercel doesn't support persistent WebSocket connections
// This endpoint returns connection details for client-side WebSocket
export default async function handler(req, res) {
  try {
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

    // Get Alpaca credentials
    const alpacaKey = process.env.ALPACA_KEY_ID;
    const alpacaSecret = process.env.ALPACA_SECRET_KEY;
    const isPaper = process.env.ALPACA_ENV !== 'live';

    if (!alpacaKey || !alpacaSecret) {
      return res.status(400).json({ error: 'Streaming not configured' });
    }

    // Generate WebSocket connection details for client
    const wsConfig = {
      // Data stream (quotes, trades, bars)
      dataStream: {
        url: isPaper
          ? 'wss://stream.data.alpaca.markets/v2/iex'
          : 'wss://stream.data.alpaca.markets/v2/sip',
        auth: {
          action: 'auth',
          key: alpacaKey,
          secret: alpacaSecret
        },
        subscriptions: {
          trades: [],
          quotes: [],
          bars: []
        }
      },
      // Trading stream (order updates, account updates)
      tradingStream: {
        url: isPaper
          ? 'wss://paper-api.alpaca.markets/stream'
          : 'wss://api.alpaca.markets/stream',
        auth: {
          action: 'auth',
          key: alpacaKey,
          secret: alpacaSecret
        },
        subscriptions: {
          trades: true,
          account: true
        }
      }
    };

    // Store WebSocket state in Redis
    await websocket.setState(userId, {
      connected: false,
      streams: ['data', 'trading'],
      lastActivity: Date.now()
    });

    // Return connection configuration
    return res.status(200).json({
      success: true,
      config: wsConfig,
      instructions: {
        connect: 'Use these credentials to establish WebSocket connections client-side',
        auth: 'Send auth message immediately after connection',
        subscribe: 'Send subscription messages for desired symbols',
        heartbeat: 'Send ping every 30 seconds to maintain connection'
      }
    });

  } catch (error) {
    console.error('[WebSocket Stream] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}