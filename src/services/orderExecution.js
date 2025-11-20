/**
 * REAL Order Execution System
 * Integrates with Alpaca for actual trading
 *
 * Features:
 * - Live and paper trading modes
 * - Order types: Market, Limit, Stop, Stop-Limit
 * - Risk validation
 * - Position management
 * - Real-time order updates
 */

import { getAlpacaClient } from './alpacaClient.js'

class OrderExecutionService {
  constructor() {
    this.client = null
    this.accountInfo = null
    this.positions = []
    this.orders = []
    this.isPaperTrading = true // Default to paper for safety
  }

  /**
   * Initialize with API credentials
   */
  async initialize(apiKey, apiSecret, isPaper = true) {
    try {
      this.isPaperTrading = isPaper
      this.client = getAlpacaClient(apiKey, apiSecret, isPaper)

      // Verify connection and get account info
      this.accountInfo = await this.getAccount()

      // Load current positions
      await this.refreshPositions()

      // Load open orders
      await this.refreshOrders()


      return true
    } catch (error) {
      console.error('[OrderExecution] ❌ Initialization failed:', error)
      throw error
    }
  }

  /**
   * Get account information
   */
  async getAccount() {
    try {
      const response = await fetch(this.getBaseUrl() + '/v2/account', {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Account fetch failed: ${response.status}`)
      }

      const account = await response.json()
      this.accountInfo = account
      return account
    } catch (error) {
      console.error('[OrderExecution] Account fetch error:', error)
      throw error
    }
  }

  /**
   * Get current positions
   */
  async refreshPositions() {
    try {
      const response = await fetch(this.getBaseUrl() + '/v2/positions', {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Positions fetch failed: ${response.status}`)
      }

      this.positions = await response.json()
      return this.positions
    } catch (error) {
      console.error('[OrderExecution] Positions fetch error:', error)
      throw error
    }
  }

  /**
   * Get open orders
   */
  async refreshOrders() {
    try {
      const response = await fetch(this.getBaseUrl() + '/v2/orders', {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Orders fetch failed: ${response.status}`)
      }

      this.orders = await response.json()
      return this.orders
    } catch (error) {
      console.error('[OrderExecution] Orders fetch error:', error)
      throw error
    }
  }

  /**
   * Calculate position size based on risk
   */
  calculatePositionSize(price, stopLoss, riskAmount = null) {
    if (!this.accountInfo) {
      throw new Error('Account not initialized')
    }

    // Default to 1% risk if not specified
    const risk = riskAmount || (parseFloat(this.accountInfo.equity) * 0.01)
    const stopDistance = Math.abs(price - stopLoss)

    if (stopDistance === 0) {
      throw new Error('Invalid stop loss distance')
    }

    const shares = Math.floor(risk / stopDistance)
    const positionValue = shares * price

    // Check if we have enough buying power
    const buyingPower = parseFloat(this.accountInfo.buying_power)
    if (positionValue > buyingPower) {
      // Adjust shares to fit buying power
      const adjustedShares = Math.floor(buyingPower / price)
      return {
        shares: adjustedShares,
        positionValue: adjustedShares * price,
        risk: adjustedShares * stopDistance,
        warning: 'Position size adjusted to fit buying power'
      }
    }

    return {
      shares,
      positionValue,
      risk,
      stopDistance
    }
  }

  /**
   * Validate order before submission
   */
  validateOrder(order) {
    const errors = []

    // Check required fields
    if (!order.symbol) errors.push('Symbol is required')
    if (!order.qty || order.qty <= 0) errors.push('Quantity must be positive')
    if (!order.side || !['buy', 'sell'].includes(order.side)) {
      errors.push('Side must be buy or sell')
    }
    if (!order.type || !['market', 'limit', 'stop', 'stop_limit'].includes(order.type)) {
      errors.push('Invalid order type')
    }

    // Type-specific validation
    if (order.type === 'limit' && !order.limit_price) {
      errors.push('Limit price required for limit orders')
    }
    if (order.type === 'stop' && !order.stop_price) {
      errors.push('Stop price required for stop orders')
    }
    if (order.type === 'stop_limit' && (!order.stop_price || !order.limit_price)) {
      errors.push('Stop and limit prices required for stop-limit orders')
    }

    // Risk checks
    if (order.side === 'buy') {
      const orderValue = order.qty * (order.limit_price || order.stop_price || 0)
      const buyingPower = parseFloat(this.accountInfo?.buying_power || 0)

      if (orderValue > buyingPower) {
        errors.push(`Insufficient buying power: ${buyingPower.toFixed(2)} available`)
      }
    }

    // Pattern day trader check
    if (this.accountInfo && !this.accountInfo.pattern_day_trader) {
      const dayTradeCount = parseInt(this.accountInfo.daytrade_count || 0)
      if (dayTradeCount >= 3) {
        errors.push('Pattern day trader limit reached (3 day trades in 5 days)')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Place a market order
   */
  async placeMarketOrder(symbol, qty, side) {
    const order = {
      symbol,
      qty,
      side,
      type: 'market',
      time_in_force: 'gtc'
    }

    return this.placeOrder(order)
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(symbol, qty, side, limitPrice) {
    const order = {
      symbol,
      qty,
      side,
      type: 'limit',
      limit_price: limitPrice,
      time_in_force: 'gtc'
    }

    return this.placeOrder(order)
  }

  /**
   * Place a bracket order (entry + stop loss + take profit)
   */
  async placeBracketOrder(symbol, qty, side, limitPrice, stopLoss, takeProfit) {
    const order = {
      symbol,
      qty,
      side,
      type: 'limit',
      limit_price: limitPrice,
      time_in_force: 'gtc',
      order_class: 'bracket',
      stop_loss: {
        stop_price: stopLoss
      },
      take_profit: {
        limit_price: takeProfit
      }
    }

    return this.placeOrder(order)
  }

  /**
   * Submit order to broker
   */
  async placeOrder(order) {
    // Validate order
    const validation = this.validateOrder(order)
    if (!validation.valid) {
      throw new Error(`Order validation failed: ${validation.errors.join(', ')}`)
    }

    try {

      const response = await fetch(this.getBaseUrl() + '/v2/orders', {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Order failed: ${response.status}`)
      }

      const placedOrder = await response.json()


      // Update orders list
      await this.refreshOrders()

      // Update positions if order is filled
      if (placedOrder.status === 'filled') {
        await this.refreshPositions()
      }

      return placedOrder
    } catch (error) {
      console.error('[OrderExecution] ❌ Order placement failed:', error)
      throw error
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId) {
    try {
      const response = await fetch(this.getBaseUrl() + `/v2/orders/${orderId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Cancel failed: ${response.status}`)
      }


      // Update orders list
      await this.refreshOrders()

      return true
    } catch (error) {
      console.error('[OrderExecution] Cancel error:', error)
      throw error
    }
  }

  /**
   * Cancel all open orders
   */
  async cancelAllOrders() {
    try {
      const response = await fetch(this.getBaseUrl() + '/v2/orders', {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Cancel all failed: ${response.status}`)
      }


      // Update orders list
      await this.refreshOrders()

      return true
    } catch (error) {
      console.error('[OrderExecution] Cancel all error:', error)
      throw error
    }
  }

  /**
   * Close a position
   */
  async closePosition(symbol, qty = null) {
    try {
      const url = qty
        ? `${this.getBaseUrl()}/v2/positions/${symbol}?qty=${qty}`
        : `${this.getBaseUrl()}/v2/positions/${symbol}`

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Close position failed: ${response.status}`)
      }

      const order = await response.json()


      // Update positions
      await this.refreshPositions()

      return order
    } catch (error) {
      console.error('[OrderExecution] Close position error:', error)
      throw error
    }
  }

  /**
   * Close all positions
   */
  async closeAllPositions() {
    try {
      const response = await fetch(this.getBaseUrl() + '/v2/positions', {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Close all positions failed: ${response.status}`)
      }

      const orders = await response.json()


      // Update positions
      await this.refreshPositions()

      return orders
    } catch (error) {
      console.error('[OrderExecution] Close all positions error:', error)
      throw error
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(status = 'all', limit = 100) {
    try {
      const params = new URLSearchParams({
        status,
        limit,
        direction: 'desc'
      })

      const response = await fetch(
        this.getBaseUrl() + `/v2/orders?${params}`,
        { headers: this.getHeaders() }
      )

      if (!response.ok) {
        throw new Error(`Order history failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[OrderExecution] Order history error:', error)
      throw error
    }
  }

  /**
   * Helper: Get base URL for API
   */
  getBaseUrl() {
    return this.isPaperTrading
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets'
  }

  /**
   * Helper: Get auth headers
   */
  getHeaders() {
    // Get credentials from localStorage or env
    const credentials = JSON.parse(
      localStorage.getItem('alpaca_credentials') || '{}'
    )

    return {
      'APCA-API-KEY-ID': credentials.apiKey || '',
      'APCA-API-SECRET-KEY': credentials.apiSecret || ''
    }
  }

  /**
   * Get portfolio summary
   */
  getPortfolioSummary() {
    if (!this.accountInfo) return null

    const totalValue = parseFloat(this.accountInfo.equity)
    const cashBalance = parseFloat(this.accountInfo.cash)
    const positionsValue = totalValue - cashBalance
    const buyingPower = parseFloat(this.accountInfo.buying_power)
    const dayTradeCount = parseInt(this.accountInfo.daytrade_count)

    // Calculate P&L
    const totalPL = this.positions.reduce((sum, pos) => {
      return sum + parseFloat(pos.unrealized_pl)
    }, 0)

    const totalPLPercent = totalValue > 0
      ? (totalPL / totalValue) * 100
      : 0

    return {
      totalValue,
      cashBalance,
      positionsValue,
      buyingPower,
      dayTradeCount,
      totalPL,
      totalPLPercent,
      positionCount: this.positions.length,
      openOrderCount: this.orders.filter(o =>
        ['new', 'partially_filled', 'accepted', 'pending_new'].includes(o.status)
      ).length
    }
  }
}

// Export singleton instance
export const orderExecutor = new OrderExecutionService()

// Export class for testing
export { OrderExecutionService }