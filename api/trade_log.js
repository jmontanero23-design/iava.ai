/**
 * Trade Logging API
 *
 * Logs all signals, decisions, orders, and P/L for analytics.
 *
 * Blueprint Reference: docs/implementation-plan.md (Logging section)
 *
 * Schema:
 * {
 *   timestamp: ISO string,
 *   type: 'signal' | 'decision' | 'order' | 'fill' | 'pnl',
 *   symbol: string,
 *   timeframe: string,
 *   score: number,
 *   components: { pivotRibbon: 20, ... },
 *   action: 'order' | 'notify' | 'pass',
 *   side: 'BUY' | 'SELL',
 *   qty: number,
 *   entry: number,
 *   sl: number,
 *   tp: number,
 *   fill_price: number,
 *   pnl: number,
 *   notes: string,
 * }
 *
 * Storage: In production, use Vercel KV, Supabase, or Google Sheets.
 * For now, we log to console and return in-memory cache.
 */

// In-memory trade log (resets on serverless function restart)
// TODO: Replace with persistent storage (Vercel KV, DB, Sheets)
const tradeLog = []

export default async function handler(req, res) {
  // CORS headers for client access
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    // Retrieve logs
    const { limit = 100, type, symbol } = req.query
    let filtered = [...tradeLog]

    if (type) {
      filtered = filtered.filter(log => log.type === type)
    }
    if (symbol) {
      filtered = filtered.filter(log => log.symbol === symbol)
    }

    // Return most recent first
    const result = filtered.reverse().slice(0, parseInt(limit))
    return res.json({ logs: result, count: result.length, total: tradeLog.length })
  }

  if (req.method === 'POST') {
    // Add new log entry
    try {
      const chunks = []
      for await (const c of req) chunks.push(c)
      const raw = Buffer.concat(chunks).toString('utf8')
      const entry = JSON.parse(raw)

      // Validate required fields
      if (!entry.type || !entry.symbol) {
        return res.status(400).json({ error: 'Missing required fields: type, symbol' })
      }

      // Add timestamp if not provided
      entry.timestamp = entry.timestamp || new Date().toISOString()

      // Add to in-memory log
      tradeLog.push(entry)

      // Log to console for Vercel logs
      console.log('[trade_log]', JSON.stringify(entry))

      // TODO: Persist to external storage
      // await saveToVercelKV(entry)
      // await saveToGoogleSheets(entry)
      // await saveToDatabase(entry)

      return res.status(201).json({ success: true, entry, total: tradeLog.length })
    } catch (err) {
      console.error('[trade_log] Error:', err)
      return res.status(500).json({ error: err.message })
    }
  }

  if (req.method === 'DELETE') {
    // Clear all logs (for testing)
    const count = tradeLog.length
    tradeLog.length = 0
    return res.json({ success: true, cleared: count })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

/**
 * Helper: Save to Vercel KV (uncomment when ready)
 */
// import kv from '@vercel/kv'
// async function saveToVercelKV(entry) {
//   const key = `trade_log:${entry.timestamp}:${entry.symbol}`
//   await kv.set(key, entry)
//   await kv.lpush('trade_log:all', key)
// }

/**
 * Helper: Save to Google Sheets (example)
 */
// async function saveToGoogleSheets(entry) {
//   const SHEET_URL = process.env.GOOGLE_SHEETS_WEBHOOK
//   if (!SHEET_URL) return
//   await fetch(SHEET_URL, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(entry),
//   })
// }
