/**
 * AVA Mind Trades API
 * Handles trade storage, retrieval, and learning stats
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
        return await getTrades(req, res, userId)
      case 'POST':
        return await createTrade(req, res, userId)
      case 'PUT':
        return await updateTrade(req, res, userId)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('[AVA Mind API] Error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Get trades for user
 */
async function getTrades(req, res, userId) {
  const { limit = 100, offset = 0, symbol, outcome } = req.query

  let query = `
    SELECT * FROM ava_mind_trades
    WHERE user_id = $1
  `
  const params = [userId]
  let paramCount = 1

  if (symbol) {
    paramCount++
    query += ` AND symbol = $${paramCount}`
    params.push(symbol)
  }

  if (outcome) {
    paramCount++
    query += ` AND outcome = $${paramCount}`
    params.push(outcome)
  }

  query += ` ORDER BY entry_time DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
  params.push(parseInt(limit), parseInt(offset))

  const trades = await sql(query, params)

  return res.status(200).json({
    trades,
    count: trades.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  })
}

/**
 * Create new trade
 */
async function createTrade(req, res, userId) {
  const trade = req.body

  // Validate required fields
  if (!trade.symbol || !trade.side || !trade.entry_price || !trade.quantity) {
    return res.status(400).json({
      error: 'Missing required fields: symbol, side, entry_price, quantity'
    })
  }

  const result = await sql`
    INSERT INTO ava_mind_trades (
      user_id, symbol, side, quantity, entry_price, exit_price,
      outcome, pnl, pnl_percent, entry_time, exit_time, hold_duration_minutes,
      day_of_week, hour_of_day, timeframe, setup_type, market_condition,
      indicators, stop_loss, take_profit, risk_reward_ratio,
      ai_confidence, ai_target_price, unicorn_score, notes, tags
    ) VALUES (
      ${userId}, ${trade.symbol}, ${trade.side}, ${trade.quantity}, ${trade.entry_price},
      ${trade.exit_price || null}, ${trade.outcome || 'OPEN'}, ${trade.pnl || null},
      ${trade.pnl_percent || null}, ${trade.entry_time || new Date().toISOString()},
      ${trade.exit_time || null}, ${trade.hold_duration_minutes || null},
      ${trade.day_of_week || null}, ${trade.hour_of_day || null}, ${trade.timeframe || null},
      ${trade.setup_type || null}, ${trade.market_condition || null},
      ${JSON.stringify(trade.indicators || {})}, ${trade.stop_loss || null},
      ${trade.take_profit || null}, ${trade.risk_reward_ratio || null},
      ${trade.ai_confidence || null}, ${trade.ai_target_price || null},
      ${trade.unicorn_score || null}, ${trade.notes || null},
      ${JSON.stringify(trade.tags || [])}
    )
    RETURNING *
  `

  // Update learning stats after trade creation
  await updateLearningStats(userId)

  return res.status(201).json({
    trade: result[0],
    message: 'Trade recorded successfully'
  })
}

/**
 * Update existing trade (typically when closing)
 */
async function updateTrade(req, res, userId) {
  const { id } = req.query
  const updates = req.body

  if (!id) {
    return res.status(400).json({ error: 'Trade ID required' })
  }

  // Build dynamic UPDATE query
  const fields = []
  const values = []
  let paramCount = 1

  const allowedFields = [
    'exit_price', 'outcome', 'pnl', 'pnl_percent', 'exit_time',
    'hold_duration_minutes', 'notes', 'tags'
  ]

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = $${paramCount}`)
      values.push(updates[field])
      paramCount++
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' })
  }

  values.push(userId, id)
  const query = `
    UPDATE ava_mind_trades
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE user_id = $${paramCount} AND id = $${paramCount + 1}
    RETURNING *
  `

  const result = await sql(query, values)

  if (result.length === 0) {
    return res.status(404).json({ error: 'Trade not found' })
  }

  // Update learning stats after trade update
  await updateLearningStats(userId)

  return res.status(200).json({
    trade: result[0],
    message: 'Trade updated successfully'
  })
}

/**
 * Update learning statistics for user
 */
async function updateLearningStats(userId) {
  try {
    // Get all closed trades
    const trades = await sql`
      SELECT * FROM ava_mind_trades
      WHERE user_id = ${userId} AND outcome IN ('WIN', 'LOSS', 'BREAKEVEN')
      ORDER BY entry_time DESC
    `

    if (trades.length === 0) {
      // Initialize empty learning record
      await sql`
        INSERT INTO ava_mind_learning (user_id)
        VALUES (${userId})
        ON CONFLICT (user_id) DO NOTHING
      `
      return
    }

    // Calculate statistics
    const totalTrades = trades.length
    const winningTrades = trades.filter(t => t.outcome === 'WIN').length
    const losingTrades = trades.filter(t => t.outcome === 'LOSS').length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    const wins = trades.filter(t => t.outcome === 'WIN')
    const losses = trades.filter(t => t.outcome === 'LOSS')

    const totalPnl = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0)
    const averageWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (parseFloat(t.pnl_percent) || 0), 0) / wins.length : 0
    const averageLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (parseFloat(t.pnl_percent) || 0), 0) / losses.length) : 0

    const grossProfit = wins.reduce((sum, t) => sum + Math.abs(parseFloat(t.pnl) || 0), 0)
    const grossLoss = losses.reduce((sum, t) => sum + Math.abs(parseFloat(t.pnl) || 0), 0)
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0

    // Calculate current streak
    let currentStreak = 0
    for (const trade of trades) {
      if (trade.outcome === 'WIN') currentStreak++
      else if (trade.outcome === 'LOSS') currentStreak--
      else break
    }

    // Calculate best/worst streaks
    let bestStreak = 0
    let worstStreak = 0
    let streak = 0

    for (const trade of [...trades].reverse()) {
      if (trade.outcome === 'WIN') {
        streak = streak >= 0 ? streak + 1 : 1
      } else if (trade.outcome === 'LOSS') {
        streak = streak <= 0 ? streak - 1 : -1
      }
      bestStreak = Math.max(bestStreak, streak)
      worstStreak = Math.min(worstStreak, streak)
    }

    // Find best dimensions
    const symbolStats = {}
    const dayStats = {}
    const hourStats = {}

    for (const trade of trades) {
      if (trade.symbol) {
        symbolStats[trade.symbol] = symbolStats[trade.symbol] || { wins: 0, total: 0 }
        symbolStats[trade.symbol].total++
        if (trade.outcome === 'WIN') symbolStats[trade.symbol].wins++
      }

      if (trade.day_of_week) {
        dayStats[trade.day_of_week] = dayStats[trade.day_of_week] || { wins: 0, total: 0 }
        dayStats[trade.day_of_week].total++
        if (trade.outcome === 'WIN') dayStats[trade.day_of_week].wins++
      }

      if (trade.hour_of_day !== null) {
        hourStats[trade.hour_of_day] = hourStats[trade.hour_of_day] || { wins: 0, total: 0 }
        hourStats[trade.hour_of_day].total++
        if (trade.outcome === 'WIN') hourStats[trade.hour_of_day].wins++
      }
    }

    // Find best performers (min 5 trades)
    const getBest = (stats) => {
      let best = { key: null, winRate: 0 }
      for (const [key, data] of Object.entries(stats)) {
        if (data.total >= 5) {
          const rate = (data.wins / data.total) * 100
          if (rate > best.winRate) {
            best = { key, winRate: rate }
          }
        }
      }
      return best
    }

    const bestSymbol = getBest(symbolStats)
    const bestDay = getBest(dayStats)
    const bestHour = getBest(hourStats)

    // Calculate average hold time
    const holdTimes = trades.filter(t => t.hold_duration_minutes).map(t => t.hold_duration_minutes)
    const averageHold = holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0

    // Update or insert learning record
    await sql`
      INSERT INTO ava_mind_learning (
        user_id, total_trades, winning_trades, losing_trades, win_rate,
        total_pnl, average_win, average_loss, profit_factor,
        current_streak, best_streak, worst_streak,
        best_symbol, best_symbol_win_rate,
        best_day_of_week, best_day_win_rate,
        best_hour_of_day, best_hour_win_rate,
        average_hold_minutes, last_trade_at, last_updated
      ) VALUES (
        ${userId}, ${totalTrades}, ${winningTrades}, ${losingTrades}, ${winRate},
        ${totalPnl}, ${averageWin}, ${averageLoss}, ${profitFactor},
        ${currentStreak}, ${bestStreak}, ${worstStreak},
        ${bestSymbol.key}, ${bestSymbol.winRate},
        ${bestDay.key}, ${bestDay.winRate},
        ${bestHour.key}, ${bestHour.winRate},
        ${averageHold}, ${trades[0].entry_time}, NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        total_trades = EXCLUDED.total_trades,
        winning_trades = EXCLUDED.winning_trades,
        losing_trades = EXCLUDED.losing_trades,
        win_rate = EXCLUDED.win_rate,
        total_pnl = EXCLUDED.total_pnl,
        average_win = EXCLUDED.average_win,
        average_loss = EXCLUDED.average_loss,
        profit_factor = EXCLUDED.profit_factor,
        current_streak = EXCLUDED.current_streak,
        best_streak = EXCLUDED.best_streak,
        worst_streak = EXCLUDED.worst_streak,
        best_symbol = EXCLUDED.best_symbol,
        best_symbol_win_rate = EXCLUDED.best_symbol_win_rate,
        best_day_of_week = EXCLUDED.best_day_of_week,
        best_day_win_rate = EXCLUDED.best_day_win_rate,
        best_hour_of_day = EXCLUDED.best_hour_of_day,
        best_hour_win_rate = EXCLUDED.best_hour_win_rate,
        average_hold_minutes = EXCLUDED.average_hold_minutes,
        last_trade_at = EXCLUDED.last_trade_at,
        last_updated = NOW()
    `

    console.log('[AVA Mind] Learning stats updated for user:', userId)
  } catch (error) {
    console.error('[AVA Mind] Error updating learning stats:', error)
  }
}
