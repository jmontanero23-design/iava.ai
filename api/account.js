/**
 * Alpaca Account API
 * Returns account information including buying power
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

    const response = await fetch(`${base}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Alpaca account error:', error)
      return res.status(response.status).json({ error })
    }

    const account = await response.json()

    // Return relevant account information
    res.status(200).json({
      account_number: account.account_number,
      status: account.status,
      currency: account.currency,
      buying_power: account.buying_power,
      regt_buying_power: account.regt_buying_power,
      daytrading_buying_power: account.daytrading_buying_power,
      cash: account.cash,
      portfolio_value: account.portfolio_value,
      pattern_day_trader: account.pattern_day_trader,
      trading_blocked: account.trading_blocked,
      transfers_blocked: account.transfers_blocked,
      account_blocked: account.account_blocked,
      trade_suspended_by_user: account.trade_suspended_by_user,
      multiplier: account.multiplier,
      shorting_enabled: account.shorting_enabled,
      equity: account.equity,
      last_equity: account.last_equity,
      long_market_value: account.long_market_value,
      short_market_value: account.short_market_value,
      initial_margin: account.initial_margin,
      maintenance_margin: account.maintenance_margin,
      last_maintenance_margin: account.last_maintenance_margin,
      sma: account.sma,
      daytrade_count: account.daytrade_count
    })
  } catch (error) {
    console.error('Account API error:', error)
    res.status(500).json({
      error: error.message || 'Failed to fetch account information'
    })
  }
}