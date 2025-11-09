export default async function handler(req, res) {
  try {
    const chunks = []
    for await (const c of req) chunks.push(c)
    const raw = Buffer.concat(chunks).toString('utf8')
    let payload = null
    try { payload = raw ? JSON.parse(raw) : null } catch {}
    console.error('[client-log]', {
      time: new Date().toISOString(),
      ua: req.headers['user-agent'],
      host: req.headers.host,
      payload,
    })
    res.status(204).end()
  } catch (e) {
    res.status(500).json({ error: e?.message || 'log error' })
  }
}

