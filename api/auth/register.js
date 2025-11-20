/**
 * User Registration API Endpoint
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
  console.log('[Register] Redis not available, using database sessions only');
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await users.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const newUser = await users.create({
      email,
      passwordHash,
      name: name || email.split('@')[0]
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store session in Redis (if available)
    const sessionId = `${newUser.id}-${Date.now()}`;
    if (redisSession) {
      try {
        await redisSession.create(sessionId, {
          userId: newUser.id,
          email: newUser.email,
          createdAt: Date.now()
        }, 604800); // 7 days in seconds
      } catch (error) {
        console.log('[Register] Redis session creation failed:', error.message);
        // Continue without Redis session
      }
    }

    // Store session in database
    const tokenHash = await bcrypt.hash(token, 10);
    await sessions.create({
      userId: newUser.id,
      tokenHash,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Return success with token
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      token,
      sessionId
    });

  } catch (error) {
    console.error('[Register] Error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}