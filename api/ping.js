/**
 * Simple ping endpoint for connection health monitoring
 * Used by the status bar to check connection quality
 */

export default function handler(req, res) {
  // Return current timestamp for latency measurement
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    message: 'pong'
  })
}