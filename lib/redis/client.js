/**
 * Redis Client for Session Management & Caching
 * PhD Elite+++ Quality Redis Implementation
 *
 * Using ioredis with standard Redis URL
 */

import { kv } from './redis-client.js';

// Redis key prefixes
const PREFIXES = {
  SESSION: 'session:',
  USER: 'user:',
  CACHE: 'cache:',
  RATE_LIMIT: 'rate:',
  MARKET_DATA: 'market:',
  AI_RESULT: 'ai:',
  WEBSOCKET: 'ws:',
  ALERT: 'alert:'
};

// Session management
export const sessions = {
  /**
   * Create new session
   * @param {string} sessionId - Session ID
   * @param {object} data - Session data
   * @param {number} ttl - Time to live in seconds (default 24 hours)
   */
  async create(sessionId, data, ttl = 86400) {
    const key = `${PREFIXES.SESSION}${sessionId}`;
    await kv.setex(key, ttl, JSON.stringify({
      ...data,
      createdAt: Date.now()
    }));
    return sessionId;
  },

  /**
   * Get session data
   * @param {string} sessionId - Session ID
   */
  async get(sessionId) {
    const key = `${PREFIXES.SESSION}${sessionId}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Extend session TTL
   * @param {string} sessionId - Session ID
   * @param {number} ttl - New TTL in seconds
   */
  async extend(sessionId, ttl = 86400) {
    const key = `${PREFIXES.SESSION}${sessionId}`;
    return await kv.expire(key, ttl);
  },

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   */
  async delete(sessionId) {
    const key = `${PREFIXES.SESSION}${sessionId}`;
    return await kv.del(key);
  },

  /**
   * Get all active sessions for a user
   * @param {string} userId - User ID
   */
  async getUserSessions(userId) {
    const pattern = `${PREFIXES.SESSION}*`;
    const keys = await kv.keys(pattern);
    const sessions = [];

    for (const key of keys) {
      const session = await kv.get(key);
      if (session && JSON.parse(session).userId === userId) {
        sessions.push({
          sessionId: key.replace(PREFIXES.SESSION, ''),
          ...JSON.parse(session)
        });
      }
    }

    return sessions;
  }
};

// Cache management
export const cache = {
  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = 300) {
    const cacheKey = `${PREFIXES.CACHE}${key}`;
    await kv.setex(cacheKey, ttl, JSON.stringify(value));
  },

  /**
   * Get cache value
   * @param {string} key - Cache key
   */
  async get(key) {
    const cacheKey = `${PREFIXES.CACHE}${key}`;
    const data = await kv.get(cacheKey);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Delete cache value
   * @param {string} key - Cache key
   */
  async delete(key) {
    const cacheKey = `${PREFIXES.CACHE}${key}`;
    return await kv.del(cacheKey);
  },

  /**
   * Clear all cache entries matching pattern
   * @param {string} pattern - Pattern to match
   */
  async clear(pattern = '*') {
    const keys = await kv.keys(`${PREFIXES.CACHE}${pattern}`);
    if (keys.length > 0) {
      await kv.del(...keys);
    }
    return keys.length;
  }
};

// Rate limiting
export const rateLimit = {
  /**
   * Check and update rate limit
   * @param {string} identifier - User ID or IP address
   * @param {number} limit - Request limit
   * @param {number} window - Time window in seconds
   */
  async check(identifier, limit = 100, window = 60) {
    const key = `${PREFIXES.RATE_LIMIT}${identifier}`;
    const current = await kv.incr(key);

    if (current === 1) {
      await kv.expire(key, window);
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      reset: Date.now() + (window * 1000)
    };
  },

  /**
   * Get current rate limit status
   * @param {string} identifier - User ID or IP address
   * @param {number} limit - Request limit
   */
  async status(identifier, limit = 100) {
    const key = `${PREFIXES.RATE_LIMIT}${identifier}`;
    const current = await kv.get(key) || 0;
    const ttl = await kv.ttl(key);

    return {
      used: current,
      remaining: Math.max(0, limit - current),
      reset: ttl > 0 ? Date.now() + (ttl * 1000) : null
    };
  }
};

// Market data caching
export const marketData = {
  /**
   * Cache market data
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe
   * @param {object} data - Market data
   * @param {number} ttl - Cache duration (default 60s for intraday)
   */
  async set(symbol, timeframe, data, ttl = 60) {
    const key = `${PREFIXES.MARKET_DATA}${symbol}:${timeframe}`;
    await kv.setex(key, ttl, JSON.stringify({
      ...data,
      cachedAt: Date.now()
    }));
  },

  /**
   * Get cached market data
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe
   */
  async get(symbol, timeframe) {
    const key = `${PREFIXES.MARKET_DATA}${symbol}:${timeframe}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Cache latest price
   * @param {string} symbol - Stock symbol
   * @param {number} price - Current price
   */
  async setPrice(symbol, price) {
    const key = `${PREFIXES.MARKET_DATA}${symbol}:price`;
    await kv.setex(key, 5, price); // 5 second cache for real-time prices
  },

  /**
   * Get cached price
   * @param {string} symbol - Stock symbol
   */
  async getPrice(symbol) {
    const key = `${PREFIXES.MARKET_DATA}${symbol}:price`;
    return await kv.get(key);
  }
};

// AI result caching
export const aiResults = {
  /**
   * Cache AI analysis result
   * @param {string} type - Analysis type
   * @param {string} key - Unique key
   * @param {object} result - AI result
   * @param {number} ttl - Cache duration (default 5 minutes)
   */
  async set(type, key, result, ttl = 300) {
    const cacheKey = `${PREFIXES.AI_RESULT}${type}:${key}`;
    await kv.setex(cacheKey, ttl, JSON.stringify({
      ...result,
      cachedAt: Date.now()
    }));
  },

  /**
   * Get cached AI result
   * @param {string} type - Analysis type
   * @param {string} key - Unique key
   */
  async get(type, key) {
    const cacheKey = `${PREFIXES.AI_RESULT}${type}:${key}`;
    const data = await kv.get(cacheKey);
    return data ? JSON.parse(data) : null;
  }
};

// WebSocket state management
export const websocket = {
  /**
   * Store WebSocket connection state
   * @param {string} userId - User ID
   * @param {object} state - Connection state
   */
  async setState(userId, state) {
    const key = `${PREFIXES.WEBSOCKET}${userId}`;
    await kv.setex(key, 3600, JSON.stringify(state)); // 1 hour TTL
  },

  /**
   * Get WebSocket connection state
   * @param {string} userId - User ID
   */
  async getState(userId) {
    const key = `${PREFIXES.WEBSOCKET}${userId}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Update heartbeat
   * @param {string} userId - User ID
   */
  async heartbeat(userId) {
    const key = `${PREFIXES.WEBSOCKET}${userId}:heartbeat`;
    await kv.setex(key, 60, Date.now()); // 60 second heartbeat
  },

  /**
   * Check if connection is alive
   * @param {string} userId - User ID
   */
  async isAlive(userId) {
    const key = `${PREFIXES.WEBSOCKET}${userId}:heartbeat`;
    const lastHeartbeat = await kv.get(key);
    if (!lastHeartbeat) return false;

    const elapsed = Date.now() - parseInt(lastHeartbeat);
    return elapsed < 90000; // Consider alive if heartbeat within 90 seconds
  }
};

// Alert management
export const alerts = {
  /**
   * Store alert state
   * @param {string} userId - User ID
   * @param {string} alertId - Alert ID
   * @param {object} state - Alert state
   */
  async setState(userId, alertId, state) {
    const key = `${PREFIXES.ALERT}${userId}:${alertId}`;
    await kv.set(key, JSON.stringify(state));
  },

  /**
   * Get alert state
   * @param {string} userId - User ID
   * @param {string} alertId - Alert ID
   */
  async getState(userId, alertId) {
    const key = `${PREFIXES.ALERT}${userId}:${alertId}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Get all active alerts for user
   * @param {string} userId - User ID
   */
  async getUserAlerts(userId) {
    const pattern = `${PREFIXES.ALERT}${userId}:*`;
    const keys = await kv.keys(pattern);
    const alerts = [];

    for (const key of keys) {
      const alert = await kv.get(key);
      if (alert) {
        const alertId = key.split(':').pop();
        alerts.push({
          alertId,
          ...JSON.parse(alert)
        });
      }
    }

    return alerts;
  }
};

// Utility functions
export const utils = {
  /**
   * Flush all Redis data (DANGER: Use only in development)
   */
  async flushAll() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot flush Redis in production');
    }
    // Note: @vercel/kv doesn't have flushAll, need to delete keys manually
    const keys = await kv.keys('*');
    if (keys.length > 0) {
      await kv.del(...keys);
    }
    return keys.length;
  },

  /**
   * Get Redis statistics
   */
  async stats() {
    const patterns = Object.entries(PREFIXES);
    const stats = {};

    for (const [name, prefix] of patterns) {
      const keys = await kv.keys(`${prefix}*`);
      stats[name] = keys.length;
    }

    return stats;
  }
};

// Export default client for raw operations
export default kv;