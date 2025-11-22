/**
 * Alpaca Positions API
 * Returns current open positions
 */

export default async function handler(req, res) {
  try {
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const env = process.env.ALPACA_ENV || 'paper'

    if (!key || !secret) {
      return res.status(500).json({ error: 'Missing Alpaca credentials' })
    }

    const base = env === 'live'
      ? 'https://api.alpaca.markets'
      : 'https://paper-api.alpaca.markets'

    const response = await fetch(`${base}/v2/positions`, {
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Alpaca positions error:', error)

      // Return empty positions array if no positions
      if (response.status === 404) {
        return res.status(200).json({ positions: [] })
      }

      return res.status(response.status).json({ error })
    }

    const positions = await response.json()

    // Format positions for frontend
    const formattedPositions = positions.map(pos => ({
      asset_id: pos.asset_id,
      symbol: pos.symbol,
      exchange: pos.exchange,
      asset_class: pos.asset_class,
      avg_entry_price: pos.avg_entry_price,
      qty: pos.qty,
      side: pos.side,
      market_value: pos.market_value,
      cost_basis: pos.cost_basis,
      unrealized_pl: pos.unrealized_pl,
      unrealized_plpc: pos.unrealized_plpc,
      unrealized_intraday_pl: pos.unrealized_intraday_pl,
      unrealized_intraday_plpc: pos.unrealized_intraday_plpc,
      current_price: pos.current_price,
      lastday_price: pos.lastday_price,
      change_today: pos.change_today
    }))

    res.status(200).json({
      positions: formattedPositions,
      count: formattedPositions.length
    })
  } catch (error) {
    console.error('Positions API error:', error)
    res.status(500).json({
      error: error.message || 'Failed to fetch positions',
      positions: []
    })
  }
}