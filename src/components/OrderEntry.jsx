/**
 * LEGENDARY Order Entry Panel
 *
 * Trade execution interface with buy/sell toggle
 * Based on: iAVA-LEGENDARY-DESKTOP_1.html (Order Entry section)
 */

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  ChevronDown,
  Info,
} from 'lucide-react'
import { colors, gradients, animation, spacing, radius, typography } from '../styles/tokens'

const orderTypes = ['Market', 'Limit', 'Stop', 'Stop Limit']

export default function OrderEntry({
  symbol = 'SPY',
  currentPrice = 594.82,
  onSubmit,
}) {
  const [side, setSide] = useState('buy') // 'buy' or 'sell'
  const [orderType, setOrderType] = useState('Market')
  const [quantity, setQuantity] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [showOrderTypes, setShowOrderTypes] = useState(false)

  const isBuy = side === 'buy'
  const estimatedTotal = quantity ? parseFloat(quantity) * currentPrice : 0

  const handleSubmit = () => {
    if (!quantity) return
    onSubmit?.({
      symbol,
      side,
      orderType,
      quantity: parseFloat(quantity),
      limitPrice: limitPrice ? parseFloat(limitPrice) : null,
      estimatedTotal,
    })
  }

  return (
    <div
      style={{
        background: colors.depth1,
        borderRadius: radius.xl,
        border: `1px solid ${colors.glass.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Buy/Sell Toggle */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          padding: 2,
          background: colors.depth2,
        }}
      >
        <button
          onClick={() => setSide('buy')}
          style={{
            padding: spacing[3],
            background: isBuy ? colors.emerald[500] : 'transparent',
            border: 'none',
            borderRadius: radius.lg,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
            transition: `all ${animation.duration.fast}ms`,
          }}
        >
          <TrendingUp size={18} style={{ color: isBuy ? '#fff' : colors.text[50] }} />
          <span
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              color: isBuy ? '#fff' : colors.text[50],
            }}
          >
            Buy
          </span>
        </button>
        <button
          onClick={() => setSide('sell')}
          style={{
            padding: spacing[3],
            background: !isBuy ? colors.red[500] : 'transparent',
            border: 'none',
            borderRadius: radius.lg,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
            transition: `all ${animation.duration.fast}ms`,
          }}
        >
          <TrendingDown size={18} style={{ color: !isBuy ? '#fff' : colors.text[50] }} />
          <span
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              color: !isBuy ? '#fff' : colors.text[50],
            }}
          >
            Sell
          </span>
        </button>
      </div>

      {/* Order Form */}
      <div
        style={{
          padding: spacing[4],
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[4],
        }}
      >
        {/* Symbol & Price */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.black,
                color: colors.text[100],
              }}
            >
              {symbol}
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text[50],
              }}
            >
              Current Price
            </div>
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text[100],
              fontFamily: typography.fontFamily.mono,
            }}
          >
            ${currentPrice.toFixed(2)}
          </div>
        </div>

        {/* Order Type Selector */}
        <div style={{ position: 'relative' }}>
          <label
            style={{
              display: 'block',
              fontSize: typography.fontSize.xs,
              fontWeight: '600',
              color: colors.text[50],
              marginBottom: spacing[1],
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
            }}
          >
            Order Type
          </label>
          <button
            onClick={() => setShowOrderTypes(!showOrderTypes)}
            style={{
              width: '100%',
              padding: spacing[3],
              background: colors.depth2,
              border: `1px solid ${colors.glass.border}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: '600',
                color: colors.text[90],
              }}
            >
              {orderType}
            </span>
            <ChevronDown
              size={16}
              style={{
                color: colors.text[50],
                transform: showOrderTypes ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${animation.duration.fast}ms`,
              }}
            />
          </button>

          {/* Dropdown */}
          {showOrderTypes && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: spacing[1],
                background: colors.glass.bgHeavy,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.glass.border}`,
                borderRadius: radius.lg,
                overflow: 'hidden',
                zIndex: 10,
              }}
            >
              {orderTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setOrderType(type)
                    setShowOrderTypes(false)
                  }}
                  style={{
                    width: '100%',
                    padding: spacing[3],
                    background: orderType === type ? colors.purple.dim : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${colors.glass.border}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: orderType === type ? '600' : '500',
                      color: orderType === type ? colors.purple[400] : colors.text[70],
                    }}
                  >
                    {type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quantity Input */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: typography.fontSize.xs,
              fontWeight: '600',
              color: colors.text[50],
              marginBottom: spacing[1],
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
            }}
          >
            Quantity
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              style={{
                flex: 1,
                padding: spacing[3],
                background: colors.depth2,
                border: `1px solid ${colors.glass.border}`,
                borderRadius: radius.lg,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
                fontFamily: typography.fontFamily.mono,
                outline: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: spacing[1],
              }}
            >
              {['25%', '50%', '100%'].map((pct) => (
                <button
                  key={pct}
                  style={{
                    padding: `${spacing[2]}px ${spacing[3]}px`,
                    background: colors.depth2,
                    border: `1px solid ${colors.glass.border}`,
                    borderRadius: radius.md,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.xs,
                    fontWeight: '600',
                    color: colors.text[50],
                  }}
                >
                  {pct}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Limit Price - Only show for limit orders */}
        {(orderType === 'Limit' || orderType === 'Stop Limit') && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.xs,
                fontWeight: '600',
                color: colors.text[50],
                marginBottom: spacing[1],
                textTransform: 'uppercase',
                letterSpacing: typography.letterSpacing.wider,
              }}
            >
              Limit Price
            </label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={currentPrice.toFixed(2)}
              style={{
                width: '100%',
                padding: spacing[3],
                background: colors.depth2,
                border: `1px solid ${colors.glass.border}`,
                borderRadius: radius.lg,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
                fontFamily: typography.fontFamily.mono,
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Estimated Total */}
        <div
          style={{
            padding: spacing[4],
            background: colors.depth2,
            borderRadius: radius.lg,
            border: `1px solid ${colors.glass.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing[2],
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text[50],
              }}
            >
              Estimated Total
            </span>
            <span
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text[100],
                fontFamily: typography.fontFamily.mono,
              }}
            >
              ${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* AVA Warning/Insight */}
          {quantity && parseFloat(quantity) > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing[2],
                padding: spacing[3],
                background: `${colors.amber[400]}10`,
                borderRadius: radius.md,
                border: `1px solid ${colors.amber[400]}30`,
              }}
            >
              <Zap size={14} style={{ color: colors.amber[400], marginTop: 2 }} />
              <p
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.amber[400],
                  lineHeight: 1.4,
                }}
              >
                AVA: Consider setting a stop-loss at ${(currentPrice * 0.95).toFixed(2)} to manage risk.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!quantity || parseFloat(quantity) <= 0}
          style={{
            padding: spacing[4],
            background: quantity && parseFloat(quantity) > 0
              ? isBuy ? colors.emerald[500] : colors.red[500]
              : colors.depth3,
            border: 'none',
            borderRadius: radius.lg,
            cursor: quantity && parseFloat(quantity) > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
            transition: `all ${animation.duration.fast}ms`,
            boxShadow: quantity && parseFloat(quantity) > 0
              ? `0 0 30px ${isBuy ? colors.emerald.glow : colors.red.glow}`
              : 'none',
          }}
        >
          <Zap size={18} style={{ color: '#fff' }} />
          <span
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: '#fff',
            }}
          >
            {isBuy ? 'Buy' : 'Sell'} {symbol}
          </span>
        </button>

        {/* Disclaimer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[1],
          }}
        >
          <Info size={12} style={{ color: colors.text[30] }} />
          <span
            style={{
              fontSize: 10,
              color: colors.text[30],
            }}
          >
            Trading involves risk. Past performance doesn't guarantee future results.
          </span>
        </div>
      </div>
    </div>
  )
}
