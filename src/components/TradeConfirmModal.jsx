/**
 * TradeConfirmModal - Elite Trade Confirmation Dialog
 *
 * PhD++ Quality trade execution confirmation:
 * - Clear order summary
 * - Risk warnings
 * - Position size validation
 * - One-click execute or cancel
 * - Countdown for auto-cancel
 */

import React, { useState, useEffect, useCallback } from 'react'

// Risk level colors
const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  extreme: '#DC2626'
}

export default function TradeConfirmModal({
  isOpen,
  trade,
  onConfirm,
  onCancel,
  onModify,
  accountBalance = 10000,
  autoCloseSeconds = 30
}) {
  const [countdown, setCountdown] = useState(autoCloseSeconds)
  const [isExecuting, setIsExecuting] = useState(false)
  const [modifiedTrade, setModifiedTrade] = useState(null)

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(autoCloseSeconds)
      setModifiedTrade(null)
      setIsExecuting(false)
    }
  }, [isOpen, autoCloseSeconds])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onCancel?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, countdown, onCancel])

  // Calculate trade metrics
  const activeTrade = modifiedTrade || trade
  if (!activeTrade) return null

  const {
    symbol,
    side,
    quantity,
    price,
    stopLoss,
    takeProfit,
    orderType = 'market'
  } = activeTrade

  const positionValue = price * quantity
  const positionPercent = (positionValue / accountBalance) * 100

  // Risk calculations
  const riskAmount = stopLoss ? Math.abs(price - stopLoss) * quantity : positionValue * 0.1
  const riskPercent = (riskAmount / accountBalance) * 100

  const rewardAmount = takeProfit ? Math.abs(takeProfit - price) * quantity : null
  const rrRatio = rewardAmount && riskAmount ? (rewardAmount / riskAmount).toFixed(1) : null

  // Risk level assessment
  const getRiskLevel = () => {
    if (riskPercent > 10) return 'extreme'
    if (riskPercent > 5) return 'high'
    if (riskPercent > 2) return 'medium'
    return 'low'
  }

  const riskLevel = getRiskLevel()

  // Handle confirm
  const handleConfirm = async () => {
    setIsExecuting(true)
    try {
      await onConfirm?.(activeTrade)
    } catch (error) {
      console.error('Trade execution failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  // Handle quantity change
  const handleQuantityChange = (newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1)
    setModifiedTrade({ ...activeTrade, quantity: qty })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={`p-4 ${side === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                side === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}>
                {side === 'buy' ? '📈' : '📉'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {side.toUpperCase()} {symbol}
                </h2>
                <p className="text-sm text-slate-400">
                  {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Order
                </p>
              </div>
            </div>

            {/* Countdown */}
            <div className="text-right">
              <div className={`text-2xl font-bold ${countdown <= 10 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                {countdown}s
              </div>
              <div className="text-xs text-slate-500">Auto-cancel</div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-4 space-y-4">
          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Quantity</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  value={activeTrade.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-16 text-center bg-transparent text-white text-xl font-bold focus:outline-none"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Price</div>
              <div className="text-xl font-bold text-white">
                ${price?.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500">
                {orderType === 'market' ? 'Market price' : 'Limit price'}
              </div>
            </div>
          </div>

          {/* Position Value */}
          <div className="bg-slate-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Position Value</div>
                <div className="text-lg font-bold text-white">${positionValue.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Of Account</div>
                <div className={`text-lg font-bold ${
                  positionPercent > 20 ? 'text-red-400' :
                  positionPercent > 10 ? 'text-amber-400' :
                  'text-slate-300'
                }`}>
                  {positionPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Stop Loss & Take Profit */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-3 ${stopLoss ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-800/50 border border-dashed border-slate-700'}`}>
              <div className="text-xs text-slate-400 mb-1">Stop Loss</div>
              {stopLoss ? (
                <>
                  <div className="text-lg font-bold text-red-400">${stopLoss.toFixed(2)}</div>
                  <div className="text-xs text-red-300">
                    Risk: ${riskAmount.toFixed(2)} ({riskPercent.toFixed(1)}%)
                  </div>
                </>
              ) : (
                <div className="text-amber-400 text-sm font-medium">⚠️ Not Set</div>
              )}
            </div>

            <div className={`rounded-xl p-3 ${takeProfit ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50 border border-dashed border-slate-700'}`}>
              <div className="text-xs text-slate-400 mb-1">Take Profit</div>
              {takeProfit ? (
                <>
                  <div className="text-lg font-bold text-emerald-400">${takeProfit.toFixed(2)}</div>
                  <div className="text-xs text-emerald-300">
                    Target: ${rewardAmount?.toFixed(2)}
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-sm">Not Set</div>
              )}
            </div>
          </div>

          {/* Risk/Reward Ratio */}
          {rrRatio && (
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-slate-400 text-sm">Risk/Reward:</span>
              <span className={`font-bold ${
                parseFloat(rrRatio) >= 2 ? 'text-emerald-400' :
                parseFloat(rrRatio) >= 1 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                1:{rrRatio}
              </span>
            </div>
          )}

          {/* Risk Warning */}
          {(riskLevel === 'high' || riskLevel === 'extreme' || !stopLoss) && (
            <div className={`p-3 rounded-xl ${
              riskLevel === 'extreme' || !stopLoss ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{riskLevel === 'extreme' || !stopLoss ? '🚨' : '⚠️'}</span>
                <div className="flex-1">
                  <div className={`font-semibold ${riskLevel === 'extreme' || !stopLoss ? 'text-red-300' : 'text-amber-300'}`}>
                    {!stopLoss ? 'No Stop Loss!' :
                     riskLevel === 'extreme' ? 'Extreme Risk!' :
                     'High Risk Trade'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {!stopLoss
                      ? 'Consider setting a stop loss to protect your capital.'
                      : `This trade risks ${riskPercent.toFixed(1)}% of your account. Consider reducing position size.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-800/30 border-t border-slate-800">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isExecuting}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isExecuting}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                side === 'buy'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white'
              }`}
            >
              {isExecuting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Executing...
                </span>
              ) : (
                <>
                  {side === 'buy' ? '✅ Confirm BUY' : '✅ Confirm SELL'}
                </>
              )}
            </button>
          </div>

          {/* Modify button */}
          {onModify && (
            <button
              onClick={() => onModify(activeTrade)}
              className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Modify Order →
            </button>
          )}
        </div>

        <style jsx>{`
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-scale-in {
            animation: scale-in 0.15s ease-out;
          }
        `}</style>
      </div>
    </div>
  )
}

// Hook for using trade confirmation
export function useTradeConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingTrade, setPendingTrade] = useState(null)
  const [resolver, setResolver] = useState(null)

  const confirm = useCallback((trade) => {
    return new Promise((resolve) => {
      setPendingTrade(trade)
      setIsOpen(true)
      setResolver(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback((trade) => {
    setIsOpen(false)
    resolver?.({ confirmed: true, trade })
  }, [resolver])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    resolver?.({ confirmed: false, trade: null })
  }, [resolver])

  return {
    isOpen,
    pendingTrade,
    confirm,
    handleConfirm,
    handleCancel
  }
}
