/**
 * Signal Trade Recording API - Stub Implementation
 * Returns empty data for now (uses localStorage on client)
 */

export default async function handler(req, res) {
  // This is a stub API that returns empty data
  // The actual data is stored in localStorage on the client

  switch (req.method) {
    case 'GET':
      // Return empty trades array
      return res.status(200).json({
        success: true,
        trades: [],
        message: 'Using client-side storage'
      })

    case 'POST':
      // Accept the request but don't store anything
      return res.status(201).json({
        success: true,
        trade: {
          id: `trade-${Date.now()}`,
          ...req.body,
          created_at: new Date().toISOString()
        },
        message: 'Trade recorded locally'
      })

    case 'PATCH':
      // Accept the update but don't store anything
      return res.status(200).json({
        success: true,
        trade: {
          id: req.query.tradeId,
          ...req.body,
          updated_at: new Date().toISOString()
        },
        message: 'Trade updated locally'
      })

    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}