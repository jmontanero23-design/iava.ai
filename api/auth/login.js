/**
 * User Login API Endpoint
 * PhD Elite+++ Quality Authentication
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users, sessions } from '../../lib/db/neon.js';

// Make Redis optional
let redisSession = null;
try {
  const redisModule = await import('../../lib/redis/client.js');
  if (process.env.REDIS_URL) {
    redisSession = redisModule.sessions;
  }
} catch (error) {
  console.log('[Login] Redis not available, using database sessions only');
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store session in Redis (if available)
    const sessionId = `${user.id}-${Date.now()}`;
    if (redisSession) {
      try {
        await redisSession.create(sessionId, {
          userId: user.id,
          email: user.email,
          createdAt: Date.now()
        }, 604800); // 7 days in seconds
      } catch (error) {
        console.log('[Login] Redis session creation failed:', error.message);
        // Continue without Redis session
      }
    }

    // Store session in database
    const tokenHash = await bcrypt.hash(token, 10);
    await sessions.create({
      userId: user.id,
      tokenHash,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Return success with token
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPro: user.is_pro,
        settings: user.settings
      },
      token,
      sessionId
    });

  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}