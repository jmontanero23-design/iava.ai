import crypto from 'node:crypto'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if ((process.env.N8N_ENABLED || 'true').toLowerCase() === 'false') {
      return res.status(503).json({ error: 'n8n disabled by env (N8N_ENABLED=false)' })
    }
    const target = process.env.N8N_WEBHOOK_URL
    if (!target) return res.status(500).json({ error: 'N8N_WEBHOOK_URL not set' })
    const chunks = []
    for await (const c of req) chunks.push(c)
    const raw = Buffer.concat(chunks).toString('utf8')
    let body
    try { body = JSON.parse(raw) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }
    const secret = process.env.N8N_SHARED_SECRET
    const headers = { 'Content-Type': 'application/json' }
    // Sign the exact bytes we will send to n8n to avoid JSON re-stringify mismatch
    const forward = JSON.stringify(body)
    if (secret) {
      const sig = crypto.createHmac('sha256', secret).update(forward).digest('hex')
      headers['X-Signature'] = sig
    }
    const r = await fetch(target, { method: 'POST', headers, body: forward })
    const text = await r.text()
    res.status(r.ok ? 200 : r.status).send(text)
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Unexpected error' })
  }
}
