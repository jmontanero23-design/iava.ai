/**
 * Risk Validation API Endpoint
 *
 * Validates trades against risk controls before execution
 */

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { symbol, side, entry, stop, sector } = req.body

    if (!symbol || !side || !entry || !stop) {
      return res.status(400).json({ error: 'Missing required fields: symbol, side, entry, stop' })
    }

    // Get account info from Alpaca
    const key = process.env.ALPACA_KEY_ID
    const secret = process.env.ALPACA_SECRET_KEY
    const env = process.env.ALPACA_ENV || 'paper'

    if (!key || !secret) {
      return res.status(500).json({ error: 'Missing Alpaca keys' })
    }

    const base = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets'

    // Fetch account and positions
    const [accountRes, positionsRes] = await Promise.all([
      fetch(`${base}/v2/account`, {
        headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret }
      }),
      fetch(`${base}/v2/positions`, {
        headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret }
      })
    ])

    if (!accountRes.ok) {
      const err = await accountRes.json()
      return res.status(accountRes.status).json({ error: err?.message || 'Failed to fetch account' })
    }

    const account = await accountRes.json()
    const equity = parseFloat(account.equity || account.portfolio_value || 0)

    if (equity === 0) {
      return res.status(400).json({ error: 'Account equity is zero' })
    }

    let positions = []
    if (positionsRes.ok) {
      positions = await positionsRes.json()
    }

    // Import validation function (using dynamic import for API routes)
    const { validateTrade } = await import('../../src/utils/riskControls.js')

    // Validate the trade
    const validation = validateTrade({
      symbol,
      side,
      entry: parseFloat(entry),
      stop: parseFloat(stop),
      equity,
      currentPositions: positions,
      sector
    })

    res.status(200).json({
      ...validation,
      account: {
        equity,
        buyingPower: parseFloat(account.buying_power || 0),
        daytradeCount: parseInt(account.daytrade_count || 0, 10),
        patternDayTrader: account.pattern_day_trader === true
      }
    })
  } catch (e) {
    console.error('[Risk API] Error:', e)
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}
