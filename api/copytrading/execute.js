/**
 * Ultra Elite++ Copy Trading Execution Engine
 *
 * Real-time trade replication system with:
 * - Smart position sizing
 * - Risk management
 * - Multi-strategy support
 * - Performance tracking
 * - AI-powered trade validation
 */

import { selectGPT5Model } from '../../src/utils/modelSelector.js'

// In-memory trade queue (production would use Redis)
const tradeQueue = new Map()
const executionHistory = new Map()
const followerPositions = new Map()

// Strategy performance tracking
const strategyMetrics = new Map()

export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handleTradeSignal(req, res)
    case 'GET':
      return getExecutionStatus(req, res)
    case 'PUT':
      return updateSettings(req, res)
    case 'DELETE':
      return cancelCopyTrading(req, res)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

/**
 * Handle incoming trade signal from master trader
 */
async function handleTradeSignal(req, res) {
  try {
    const {
      strategyId,
      masterId,
      signal,
      metadata = {}
    } = req.body

    // Validate required fields
    if (!strategyId || !masterId || !signal) {
      return res.status(400).json({
        error: 'Missing required fields: strategyId, masterId, signal'
      })
    }

    // Validate signal structure
    const validatedSignal = validateSignal(signal)
    if (!validatedSignal.valid) {
      return res.status(400).json({
        error: validatedSignal.error
      })
    }

    // Get followers for this strategy
    const followers = await getStrategyFollowers(strategyId)
    if (followers.length === 0) {
      return res.status(200).json({
        message: 'No active followers',
        processed: 0
      })
    }

    // AI validation of trade quality
    const aiValidation = await validateTradeWithAI(signal, metadata)
    if (!aiValidation.approved) {
      console.log(`[CopyTrading] AI rejected trade: ${aiValidation.reason}`)
      return res.status(200).json({
        message: 'Trade rejected by AI validation',
        reason: aiValidation.reason,
        processed: 0
      })
    }

    // Process trade for each follower
    const executionResults = []
    for (const follower of followers) {
      const result = await processFollowerTrade(follower, signal, {
        strategyId,
        masterId,
        aiScore: aiValidation.score,
        aiRecommendations: aiValidation.recommendations
      })
      executionResults.push(result)
    }

    // Update strategy metrics
    updateStrategyMetrics(strategyId, {
      signal,
      executionResults,
      aiScore: aiValidation.score
    })

    // Return execution summary
    const successful = executionResults.filter(r => r.status === 'executed').length
    const failed = executionResults.filter(r => r.status === 'failed').length
    const skipped = executionResults.filter(r => r.status === 'skipped').length

    return res.status(200).json({
      message: 'Trade signal processed',
      strategyId,
      masterId,
      signal: validatedSignal.signal,
      aiValidation: {
        score: aiValidation.score,
        confidence: aiValidation.confidence
      },
      execution: {
        total: followers.length,
        successful,
        failed,
        skipped
      },
      results: executionResults
    })

  } catch (error) {
    console.error('[CopyTrading] Execution error:', error)
    return res.status(500).json({
      error: 'Trade execution failed',
      details: error.message
    })
  }
}

/**
 * Validate trade signal with AI
 */
async function validateTradeWithAI(signal, metadata) {
  try {
    const prompt = `As an elite trading risk manager, validate this copy trading signal:

    Trade Signal:
    - Symbol: ${signal.symbol}
    - Action: ${signal.action} (${signal.orderType})
    - Price: ${signal.price || 'market'}
    - Quantity: ${signal.quantity}
    - Stop Loss: ${signal.stopLoss || 'none'}
    - Take Profit: ${signal.takeProfit || 'none'}

    Market Context:
    - Volatility: ${metadata.volatility || 'unknown'}
    - Volume: ${metadata.volume || 'average'}
    - Trend: ${metadata.trend || 'neutral'}
    - Time: ${new Date().toISOString()}

    Analyze for:
    1. Risk/reward ratio acceptability
    2. Market conditions alignment
    3. Potential manipulation or errors
    4. Position sizing appropriateness

    Return JSON with:
    - approved: boolean
    - score: 0-100 quality score
    - confidence: 0-1
    - reason: explanation if rejected
    - recommendations: array of improvements
    - riskLevel: 'low'|'medium'|'high'
    - expectedOutcome: brief prediction`

    // Use GPT-5-mini for trade validation (medium complexity)
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        feature: 'copy-trading-validation',
        temperature: 0.2,
        max_tokens: 400
      })
    })

    if (response.ok) {
      const data = await response.json()
      const validation = JSON.parse(data.text || '{}')

      // Default to approved if AI fails
      return validation.approved !== undefined ? validation : {
        approved: true,
        score: 75,
        confidence: 0.7,
        reason: 'AI validation bypassed',
        recommendations: []
      }
    }
  } catch (error) {
    console.error('[CopyTrading] AI validation error:', error)
  }

  // Fallback: approve with caution
  return {
    approved: true,
    score: 50,
    confidence: 0.5,
    reason: 'AI validation unavailable',
    recommendations: ['Manual review recommended']
  }
}

/**
 * Process trade for individual follower
 */
async function processFollowerTrade(follower, signal, context) {
  try {
    const { followerId, settings } = follower

    // Check if follower is active
    if (!settings.active) {
      return {
        followerId,
        status: 'skipped',
        reason: 'Follower inactive'
      }
    }

    // Calculate position size based on follower settings
    const positionSize = calculatePositionSize(signal, settings, context)

    // Check risk limits
    const riskCheck = checkRiskLimits(followerId, positionSize, settings)
    if (!riskCheck.passed) {
      return {
        followerId,
        status: 'skipped',
        reason: riskCheck.reason
      }
    }

    // Adjust stops based on follower preferences
    const adjustedSignal = adjustSignalForFollower(signal, settings)

    // Execute trade (simulated - would integrate with broker API)
    const execution = await executeTrade({
      ...adjustedSignal,
      quantity: positionSize.quantity,
      followerId,
      strategyId: context.strategyId
    })

    // Track position
    trackFollowerPosition(followerId, execution)

    return {
      followerId,
      status: 'executed',
      orderId: execution.orderId,
      quantity: positionSize.quantity,
      price: execution.price,
      commission: execution.commission
    }

  } catch (error) {
    console.error(`[CopyTrading] Follower ${follower.followerId} execution error:`, error)
    return {
      followerId: follower.followerId,
      status: 'failed',
      reason: error.message
    }
  }
}

/**
 * Calculate position size for follower
 */
function calculatePositionSize(signal, settings, context) {
  const {
    allocationMode = 'percentage',
    allocationValue = 10,
    maxPositionSize = 1000,
    scaleWithConfidence = true,
    accountBalance = 10000
  } = settings

  let quantity = signal.quantity

  // Percentage-based allocation
  if (allocationMode === 'percentage') {
    const positionValue = accountBalance * (allocationValue / 100)
    quantity = Math.floor(positionValue / signal.price)
  }

  // Fixed dollar allocation
  if (allocationMode === 'fixed') {
    quantity = Math.floor(allocationValue / signal.price)
  }

  // Scale with AI confidence
  if (scaleWithConfidence && context.aiScore) {
    const confidenceFactor = context.aiScore / 100
    quantity = Math.floor(quantity * confidenceFactor)
  }

  // Apply position size limits
  quantity = Math.min(quantity, maxPositionSize)
  quantity = Math.max(quantity, 1) // Minimum 1 share

  return {
    quantity,
    value: quantity * signal.price,
    allocationUsed: (quantity * signal.price) / accountBalance
  }
}

/**
 * Check risk limits for follower
 */
function checkRiskLimits(followerId, positionSize, settings) {
  const {
    maxDailyTrades = 10,
    maxOpenPositions = 5,
    maxDailyLoss = 500,
    maxPositionValue = 5000
  } = settings

  // Get follower's current stats
  const positions = followerPositions.get(followerId) || []
  const todaysTrades = getTodaysTrades(followerId)
  const dailyPnL = calculateDailyPnL(followerId)

  // Check daily trade limit
  if (todaysTrades >= maxDailyTrades) {
    return {
      passed: false,
      reason: `Daily trade limit reached (${maxDailyTrades})`
    }
  }

  // Check open positions limit
  if (positions.length >= maxOpenPositions) {
    return {
      passed: false,
      reason: `Max open positions reached (${maxOpenPositions})`
    }
  }

  // Check daily loss limit
  if (dailyPnL < -maxDailyLoss) {
    return {
      passed: false,
      reason: `Daily loss limit exceeded ($${maxDailyLoss})`
    }
  }

  // Check position value limit
  if (positionSize.value > maxPositionValue) {
    return {
      passed: false,
      reason: `Position value exceeds limit ($${maxPositionValue})`
    }
  }

  return { passed: true }
}

/**
 * Adjust signal based on follower preferences
 */
function adjustSignalForFollower(signal, settings) {
  const adjusted = { ...signal }
  const {
    stopLossMultiplier = 1.0,
    takeProfitMultiplier = 1.0,
    useTrailingStop = false,
    trailingStopPercent = 2
  } = settings

  // Adjust stop loss
  if (signal.stopLoss && stopLossMultiplier !== 1.0) {
    const stopDistance = Math.abs(signal.price - signal.stopLoss)
    adjusted.stopLoss = signal.action === 'buy' ?
      signal.price - (stopDistance * stopLossMultiplier) :
      signal.price + (stopDistance * stopLossMultiplier)
  }

  // Adjust take profit
  if (signal.takeProfit && takeProfitMultiplier !== 1.0) {
    const profitDistance = Math.abs(signal.takeProfit - signal.price)
    adjusted.takeProfit = signal.action === 'buy' ?
      signal.price + (profitDistance * takeProfitMultiplier) :
      signal.price - (profitDistance * takeProfitMultiplier)
  }

  // Add trailing stop if requested
  if (useTrailingStop) {
    adjusted.trailingStop = trailingStopPercent
  }

  return adjusted
}

/**
 * Execute trade (simulated)
 */
async function executeTrade(trade) {
  // In production, this would call broker API
  // For now, simulate execution with slight slippage
  const slippage = (Math.random() - 0.5) * 0.001 // ±0.1% slippage
  const executionPrice = trade.price * (1 + slippage)
  const commission = trade.quantity * 0.005 // $0.005 per share

  const execution = {
    orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    symbol: trade.symbol,
    action: trade.action,
    quantity: trade.quantity,
    price: executionPrice,
    commission,
    timestamp: new Date().toISOString(),
    status: 'filled'
  }

  // Store execution
  const history = executionHistory.get(trade.followerId) || []
  history.push(execution)
  executionHistory.set(trade.followerId, history)

  return execution
}

/**
 * Track follower position
 */
function trackFollowerPosition(followerId, execution) {
  const positions = followerPositions.get(followerId) || []

  if (execution.action === 'buy') {
    positions.push({
      symbol: execution.symbol,
      quantity: execution.quantity,
      entryPrice: execution.price,
      entryTime: execution.timestamp,
      currentValue: execution.quantity * execution.price
    })
  } else {
    // Remove or reduce position on sell
    const posIndex = positions.findIndex(p => p.symbol === execution.symbol)
    if (posIndex !== -1) {
      const pos = positions[posIndex]
      if (pos.quantity <= execution.quantity) {
        positions.splice(posIndex, 1)
      } else {
        pos.quantity -= execution.quantity
      }
    }
  }

  followerPositions.set(followerId, positions)
}

/**
 * Get execution status
 */
async function getExecutionStatus(req, res) {
  const { followerId, strategyId } = req.query

  if (followerId) {
    const history = executionHistory.get(followerId) || []
    const positions = followerPositions.get(followerId) || []

    return res.status(200).json({
      followerId,
      executionHistory: history.slice(-50), // Last 50 trades
      openPositions: positions,
      stats: calculateFollowerStats(followerId)
    })
  }

  if (strategyId) {
    const metrics = strategyMetrics.get(strategyId) || {}
    return res.status(200).json({
      strategyId,
      metrics,
      lastUpdate: metrics.lastUpdate || null
    })
  }

  return res.status(200).json({
    totalStrategies: strategyMetrics.size,
    totalFollowers: followerPositions.size,
    totalExecutions: Array.from(executionHistory.values()).flat().length
  })
}

/**
 * Helper functions
 */

function validateSignal(signal) {
  const required = ['symbol', 'action', 'quantity']
  const missing = required.filter(field => !signal[field])

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`
    }
  }

  if (!['buy', 'sell'].includes(signal.action)) {
    return {
      valid: false,
      error: 'Action must be "buy" or "sell"'
    }
  }

  if (signal.quantity <= 0) {
    return {
      valid: false,
      error: 'Quantity must be positive'
    }
  }

  return {
    valid: true,
    signal
  }
}

async function getStrategyFollowers(strategyId) {
  // In production, fetch from database
  // Mock data for demonstration
  return [
    {
      followerId: 'follower-001',
      settings: {
        active: true,
        allocationMode: 'percentage',
        allocationValue: 5,
        maxPositionSize: 100,
        scaleWithConfidence: true,
        accountBalance: 50000,
        maxDailyTrades: 20,
        maxOpenPositions: 10,
        maxDailyLoss: 1000,
        maxPositionValue: 5000,
        stopLossMultiplier: 1.1,
        takeProfitMultiplier: 0.9,
        useTrailingStop: true,
        trailingStopPercent: 2
      }
    }
  ]
}

function getTodaysTrades(followerId) {
  const history = executionHistory.get(followerId) || []
  const today = new Date().toDateString()
  return history.filter(t =>
    new Date(t.timestamp).toDateString() === today
  ).length
}

function calculateDailyPnL(followerId) {
  // Simplified P&L calculation
  return 0 // Would calculate from positions and market prices
}

function calculateFollowerStats(followerId) {
  const history = executionHistory.get(followerId) || []
  const positions = followerPositions.get(followerId) || []

  return {
    totalTrades: history.length,
    openPositions: positions.length,
    totalValue: positions.reduce((sum, p) => sum + p.currentValue, 0),
    winRate: 0, // Would calculate from closed positions
    avgReturn: 0 // Would calculate from closed positions
  }
}

function updateStrategyMetrics(strategyId, data) {
  const current = strategyMetrics.get(strategyId) || {
    totalSignals: 0,
    successfulExecutions: 0,
    avgAIScore: 0
  }

  current.totalSignals++
  current.successfulExecutions += data.executionResults.filter(r => r.status === 'executed').length
  current.avgAIScore = ((current.avgAIScore * (current.totalSignals - 1)) + data.aiScore) / current.totalSignals
  current.lastUpdate = new Date().toISOString()

  strategyMetrics.set(strategyId, current)
}

/**
 * Update follower settings
 */
async function updateSettings(req, res) {
  return res.status(200).json({
    message: 'Settings update endpoint - to be implemented'
  })
}

/**
 * Cancel copy trading
 */
async function cancelCopyTrading(req, res) {
  return res.status(200).json({
    message: 'Cancellation endpoint - to be implemented'
  })
}

// Export for testing
export const helpers = {
  validateSignal,
  calculatePositionSize,
  checkRiskLimits,
  adjustSignalForFollower
}