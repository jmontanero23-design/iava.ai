/**
 * Redis Client using ioredis
 * Works with standard Redis URL from Vercel
 */

import { Redis } from 'ioredis';

// Initialize Redis client with your REDIS_URL
const redis = new Redis(process.env.REDIS_URL);

// Handle connection events
redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

// Export Redis methods with simpler API
export const kv = {
  // Get value
  async get(key) {
    const value = await redis.get(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },

  // Set value with optional TTL
  async set(key, value, ttlSeconds) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      return await redis.setex(key, ttlSeconds, serialized);
    }
    return await redis.set(key, serialized);
  },

  // Set with expiry
  async setex(key, seconds, value) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    return await redis.setex(key, seconds, serialized);
  },

  // Delete key(s)
  async del(...keys) {
    return await redis.del(...keys);
  },

  // Increment
  async incr(key) {
    return await redis.incr(key);
  },

  // Get all keys matching pattern
  async keys(pattern) {
    return await redis.keys(pattern);
  },

  // Set expiry
  async expire(key, seconds) {
    return await redis.expire(key, seconds);
  },

  // Get TTL
  async ttl(key) {
    return await redis.ttl(key);
  }
};

// Export the raw Redis client for advanced operations
export default redis;