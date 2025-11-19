import { useState, useEffect } from 'react'
import { orderExecutor } from '../services/orderExecution.js'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

/**
 * REAL Trading Panel - Actually executes orders
 *
 * Features:
 * - Live order execution via Alpaca
 * - Position sizing calculator
 * - Risk management controls
 * - Stop loss & take profit
 * - Order validation
 * - Real account info display
 */
export default function TradingPanel() {
  // Market data
  const { marketData } = useMarketData()
  const currentSymbol = marketData.symbol || 'AAPL'
  const currentPrice = marketData.bars?.[marketData.bars.length - 1]?.close || 0

  // Account state
  const [account, setAccount] = useState(null)
  const [positions, setPositions] = useState([])
  const [orders, setOrders] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  // Order form state
  const [orderType, setOrderType] = useState('market') // market, limit, stop, stop_limit
  const [orderSide, setOrderSide] = useState('buy') // buy, sell
  const [quantity, setQuantity] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [useBracket, setUseBracket] = useState(false)

  // Risk management
  const [riskPercent, setRiskPercent] = useState(1) // Default 1% risk
  const [usePositionSizing, setUsePositionSizing] = useState(true)

  // UI state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderResult, setOrderResult] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // Initialize connection
  useEffect(() => {
    initializeConnection()
  }, [])

  // Auto-refresh account data
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(async () => {
      await refreshAccountData()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [isConnected])

  const initializeConnection = async () => {
    try {
      // Check for saved credentials
      const credentials = JSON.parse(
        localStorage.getItem('alpaca_credentials') || '{}'
      )

      if (!credentials.apiKey || !credentials.apiSecret) {
        setConnectionError('Please configure your Alpaca API credentials')
        return
      }

      // Initialize order executor
      await orderExecutor.initialize(
        credentials.apiKey,
        credentials.apiSecret,
        credentials.isPaper !== false // Default to paper trading
      )

      setIsConnected(true)
      await refreshAccountData()

    } catch (error) {
      console.error('[TradingPanel] Connection error:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    }
  }

  const refreshAccountData = async () => {
    try {
      const [accountData, positionsData, ordersData] = await Promise.all([
        orderExecutor.getAccount(),
        orderExecutor.refreshPositions(),
        orderExecutor.refreshOrders()
      ])

      setAccount(accountData)
      setPositions(positionsData)
      setOrders(ordersData)
    } catch (error) {
      console.error('[TradingPanel] Refresh error:', error)
    }
  }

  const calculatePositionSize = () => {
    if (!usePositionSizing || !account || !stopLoss) {
      return parseInt(quantity) || 0
    }

    const equity = parseFloat(account.equity)
    const riskAmount = equity * (riskPercent / 100)
    const entryPrice = orderType === 'market' ? currentPrice : parseFloat(limitPrice)
    const stopDistance = Math.abs(entryPrice - parseFloat(stopLoss))

    if (stopDistance === 0) return 0

    return Math.floor(riskAmount / stopDistance)
  }

  const validateOrder = () => {
    const errors = []

    if (!currentSymbol) errors.push('No symbol selected')
    if (!quantity || quantity <= 0) errors.push('Invalid quantity')

    if (orderType === 'limit' && !limitPrice) {
      errors.push('Limit price required')
    }
    if (orderType === 'stop' && !stopPrice) {
      errors.push('Stop price required')
    }
    if (orderType === 'stop_limit' && (!stopPrice || !limitPrice)) {
      errors.push('Stop and limit prices required')
    }

    if (useBracket && (!stopLoss || !takeProfit)) {
      errors.push('Stop loss and take profit required for bracket orders')
    }

    return errors
  }

  const placeOrder = async () => {
    const errors = validateOrder()
    if (errors.length > 0) {
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: errors.join(', '), type: 'error' }
      }))
      return
    }

    setIsPlacingOrder(true)
    setOrderResult(null)

    try {
      let order
      const qty = usePositionSizing ? calculatePositionSize() : parseInt(quantity)

      if (useBracket && orderType === 'limit') {
        // Place bracket order
        order = await orderExecutor.placeBracketOrder(
          currentSymbol,
          qty,
          orderSide,
          parseFloat(limitPrice),
          parseFloat(stopLoss),
          parseFloat(takeProfit)
        )
      } else if (orderType === 'market') {
        order = await orderExecutor.placeMarketOrder(
          currentSymbol,
          qty,
          orderSide
        )
      } else if (orderType === 'limit') {
        order = await orderExecutor.placeLimitOrder(
          currentSymbol,
          qty,
          orderSide,
          parseFloat(limitPrice)
        )
      } else {
        // Handle stop and stop_limit orders
        order = await orderExecutor.placeOrder({
          symbol: currentSymbol,
          qty,
          side: orderSide,
          type: orderType,
          limit_price: orderType === 'stop_limit' ? parseFloat(limitPrice) : undefined,
          stop_price: parseFloat(stopPrice),
          time_in_force: 'gtc'
        })
      }

      setOrderResult({
        success: true,
        order
      })

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: {
          text: `✅ Order placed: ${orderSide.toUpperCase()} ${qty} ${currentSymbol}`,
          type: 'success'
        }
      }))

      // Refresh account data
      await refreshAccountData()

      // Reset form
      setQuantity('')
      setLimitPrice('')
      setStopPrice('')
      setStopLoss('')
      setTakeProfit('')

    } catch (error) {
      console.error('[TradingPanel] Order error:', error)
      setOrderResult({
        success: false,
        error: error.message
      })

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: `❌ Order failed: ${error.message}`, type: 'error' }
      }))
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const cancelOrder = async (orderId) => {
    try {
      await orderExecutor.cancelOrder(orderId)
      await refreshAccountData()

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: 'Order cancelled', type: 'success' }
      }))
    } catch (error) {
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: `Cancel failed: ${error.message}`, type: 'error' }
      }))
    }
  }

  const closePosition = async (symbol) => {
    try {
      await orderExecutor.closePosition(symbol)
      await refreshAccountData()

      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: `Position closed: ${symbol}`, type: 'success' }
      }))
    } catch (error) {
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: `Close failed: ${error.message}`, type: 'error' }
      }))
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Trading Panel</h2>
        {connectionError ? (
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">{connectionError}</div>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Configure API Credentials
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    )
  }

  const portfolioSummary = orderExecutor.getPortfolioSummary()

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-lg p-6">
      {/* Header with Account Info */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Trading Panel</h2>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Equity:</span>
            <span className="text-white font-semibold">
              ${portfolioSummary?.totalValue.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Buying Power:</span>
            <span className="text-white font-semibold">
              ${portfolioSummary?.buyingPower.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">P&L:</span>
            <span className={portfolioSummary?.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}>
              ${portfolioSummary?.totalPL.toFixed(2)} ({portfolioSummary?.totalPLPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Order Form */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left Column - Order Details */}
        <div className="space-y-4">
          {/* Symbol & Price */}
          <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
            <span className="text-lg font-semibold text-white">{currentSymbol}</span>
            <span className="text-lg text-cyan-400">${currentPrice.toFixed(2)}</span>
          </div>

          {/* Order Side */}
          <div className="flex gap-2">
            <button
              onClick={() => setOrderSide('buy')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                orderSide === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setOrderSide('sell')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                orderSide === 'sell'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              SELL
            </button>
          </div>

          {/* Order Type */}
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          >
            <option value="market">Market Order</option>
            <option value="limit">Limit Order</option>
            <option value="stop">Stop Order</option>
            <option value="stop_limit">Stop-Limit Order</option>
          </select>

          {/* Quantity */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Quantity</label>
            <input
              type="number"
              value={usePositionSizing ? calculatePositionSize() : quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={usePositionSizing}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
              placeholder="0"
            />
          </div>

          {/* Limit Price (for limit and stop-limit) */}
          {(orderType === 'limit' || orderType === 'stop_limit') && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Limit Price</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          )}

          {/* Stop Price (for stop and stop-limit) */}
          {(orderType === 'stop' || orderType === 'stop_limit') && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Stop Price</label>
              <input
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          )}
        </div>

        {/* Right Column - Risk Management */}
        <div className="space-y-4">
          {/* Position Sizing */}
          <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={usePositionSizing}
                onChange={(e) => setUsePositionSizing(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
              />
              <span className="text-sm font-medium text-white">Use Position Sizing</span>
            </label>

            {usePositionSizing && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Risk %</label>
                  <input
                    type="number"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm"
                    min="0.1"
                    max="5"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stop Loss</label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bracket Order */}
          <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useBracket}
                onChange={(e) => setUseBracket(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
              />
              <span className="text-sm font-medium text-white">Bracket Order</span>
            </label>

            {useBracket && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stop Loss</label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Take Profit</label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white text-sm"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Place Order Button */}
          <button
            onClick={placeOrder}
            disabled={isPlacingOrder}
            className={`w-full py-4 rounded-lg font-bold text-white transition-all ${
              isPlacingOrder
                ? 'bg-slate-700 cursor-not-allowed'
                : orderSide === 'buy'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isPlacingOrder ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Order...
              </span>
            ) : (
              `${orderSide.toUpperCase()} ${currentSymbol}`
            )}
          </button>
        </div>
      </div>

      {/* Positions */}
      {positions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Open Positions</h3>
          <div className="space-y-2">
            {positions.map((position) => (
              <div
                key={position.symbol}
                className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="font-medium text-white">{position.symbol}</span>
                  <span className="text-sm text-slate-400">{position.qty} shares</span>
                  <span className="text-sm text-slate-400">
                    Avg: ${parseFloat(position.avg_entry_price).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={
                      parseFloat(position.unrealized_pl) >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    ${parseFloat(position.unrealized_pl).toFixed(2)}
                  </span>
                  <button
                    onClick={() => closePosition(position.symbol)}
                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Orders */}
      {orders.filter(o => ['new', 'partially_filled', 'accepted', 'pending_new'].includes(o.status)).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Open Orders</h3>
          <div className="space-y-2">
            {orders
              .filter(o => ['new', 'partially_filled', 'accepted', 'pending_new'].includes(o.status))
              .map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-white">{order.symbol}</span>
                    <span
                      className={`text-sm ${
                        order.side === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {order.side.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-400">{order.qty} @ ${order.limit_price || 'Market'}</span>
                    <span className="text-xs text-slate-500">{order.order_type}</span>
                  </div>
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}