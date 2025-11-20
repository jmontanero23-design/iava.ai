/**
 * Token Verification API Endpoint
 * Checks if user is authenticated
 */

import jwt from 'jsonwebtoken';
import { users } from '../../lib/db/neon.js';
import { sessions as redisSession } from '../../lib/redis/client.js';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user from database
    const user = await users.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check Redis session (optional - for extra security)
    // Could check if session exists in Redis here

    // Return user data
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPro: user.is_pro,
        isVerified: user.is_verified,
        settings: user.settings,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('[Verify] Error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}