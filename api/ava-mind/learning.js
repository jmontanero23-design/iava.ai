/**
 * AVA Mind Learning Stats API
 * Returns aggregated learning statistics and patterns
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // TODO: Add proper auth - for now use demo user
    const userId = req.headers['x-user-id'] || 'demo-user-id'

    // Get learning stats
    const learning = await sql`
      SELECT * FROM ava_mind_learning
      WHERE user_id = ${userId}
    `

    // Get patterns
    const patterns = await sql`
      SELECT * FROM ava_mind_patterns
      WHERE user_id = ${userId}
      ORDER BY significance DESC, win_rate DESC
      LIMIT 20
    `

    // Get recent trades for context
    const recentTrades = await sql`
      SELECT * FROM ava_mind_trades
      WHERE user_id = ${userId}
      ORDER BY entry_time DESC
      LIMIT 10
    `

    return res.status(200).json({
      learning: learning[0] || null,
      patterns: patterns || [],
      recentTrades: recentTrades || [],
      hasData: learning.length > 0
    })
  } catch (error) {
    console.error('[AVA Mind Learning API] Error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
