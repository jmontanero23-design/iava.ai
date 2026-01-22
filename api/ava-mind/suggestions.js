/**
 * AVA Mind Suggestions API
 * Creates and tracks AI-generated trade suggestions
 * Enables real-time learning loop by tracking prediction accuracy
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // TODO: Add proper auth - for now use demo user
    const userId = req.headers['x-user-id'] || 'demo-user-id'

    switch (req.method) {
      case 'GET':
        return await getSuggestions(req, res, userId)
      case 'POST':
        return await createSuggestion(req, res, userId)
      case 'PUT':
        return await updateSuggestion(req, res, userId)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('[AVA Mind Suggestions API] Error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Get active suggestions for user
 */
async function getSuggestions(req, res, userId) {
  const { symbol, limit = 10, includeExpired = false } = req.query

  let query = `
    SELECT * FROM ava_mind_suggestions
    WHERE user_id = $1
  `
  const params = [userId]
  let paramCount = 1

  if (!includeExpired) {
    query += ` AND (expires_at IS NULL OR expires_at > NOW())`
  }

  if (symbol) {
    paramCount++
    query += ` AND symbol = $${paramCount}`
    params.push(symbol)
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`
  params.push(parseInt(limit))

  const suggestions = await sql(query, params)

  // Calculate accuracy stats for user's followed suggestions
  const accuracyStats = await sql`
    SELECT
      COUNT(*) as total_followed,
      SUM(CASE WHEN outcome = 'WIN' THEN 1 ELSE 0 END) as wins,
      ROUND(AVG(CASE WHEN outcome = 'WIN' THEN 100 ELSE 0 END), 2) as accuracy_rate,
      ROUND(AVG(prediction_accuracy), 2) as avg_prediction_accuracy
    FROM ava_mind_suggestions
    WHERE user_id = ${userId}
      AND was_followed = true
      AND outcome IS NOT NULL
  `

  return res.status(200).json({
    suggestions,
    count: suggestions.length,
    accuracyStats: accuracyStats[0] || { total_followed: 0, wins: 0, accuracy_rate: 0, avg_prediction_accuracy: 0 }
  })
}

/**
 * Create new suggestion
 */
async function createSuggestion(req, res, userId) {
  const {
    symbol,
    action,
    confidence,
    reasoning,
    market_context,
    personalized_score,
    suggested_entry,
    suggested_stop,
    suggested_target,
    suggested_position_size,
    expires_in_hours = 24
  } = req.body

  // Validate required fields
  if (!symbol || !action || !confidence) {
    return res.status(400).json({
      error: 'Missing required fields: symbol, action, confidence'
    })
  }

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expires_in_hours)

  const result = await sql`
    INSERT INTO ava_mind_suggestions (
      user_id, symbol, action, confidence, reasoning,
      market_context, personalized_score,
      suggested_entry, suggested_stop, suggested_target, suggested_position_size,
      expires_at
    ) VALUES (
      ${userId}, ${symbol}, ${action}, ${confidence}, ${reasoning || null},
      ${JSON.stringify(market_context || {})}, ${personalized_score || null},
      ${suggested_entry || null}, ${suggested_stop || null}, ${suggested_target || null},
      ${suggested_position_size || null}, ${expiresAt.toISOString()}
    )
    RETURNING *
  `

  return res.status(201).json({
    suggestion: result[0],
    message: 'Suggestion created successfully'
  })
}

/**
 * Update suggestion (mark as followed, record outcome)
 */
async function updateSuggestion(req, res, userId) {
  const { id } = req.query
  const {
    was_followed,
    outcome,
    actual_pnl,
    prediction_accuracy
  } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Suggestion ID required' })
  }

  const result = await sql`
    UPDATE ava_mind_suggestions
    SET
      was_followed = COALESCE(${was_followed}, was_followed),
      followed_at = CASE WHEN ${was_followed} = true THEN NOW() ELSE followed_at END,
      outcome = COALESCE(${outcome || null}, outcome),
      actual_pnl = COALESCE(${actual_pnl || null}, actual_pnl),
      prediction_accuracy = COALESCE(${prediction_accuracy || null}, prediction_accuracy)
    WHERE user_id = ${userId} AND id = ${id}
    RETURNING *
  `

  if (result.length === 0) {
    return res.status(404).json({ error: 'Suggestion not found' })
  }

  return res.status(200).json({
    suggestion: result[0],
    message: 'Suggestion updated successfully'
  })
}
