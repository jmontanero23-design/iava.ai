Scheduled Scans on Vercel (Cron)

Overview
- Use Vercel Cron to call a serverless endpoint that scans a symbol universe and (optionally) forwards top picks to your n8n webhook.

Endpoint
- GET /api/schedule/scan

Query params
- timeframe: 1Min|5Min|15Min|1Hour|1Day (default 5Min)
- threshold: 0..100 (default 70)
- top: 1..100 (default 20)
- enforceDaily: 1|0 (default 1)
- requireConsensus: 1|0 (default 0)
- assetClass: stocks|crypto (default stocks)
- symbols: optional comma-separated list (if omitted, uses Alpaca active universe)

Auth
- Set CRON_SECRET in Vercel (Project Settings → Environment Variables).
- Vercel Cron must include header X-Cron-Secret: your_secret.

Example Vercel Cron config
- Project Settings → Cron Jobs → Create
  - URL: https://YOUR_DOMAIN/api/schedule/scan?timeframe=5Min&threshold=75&top=30&enforceDaily=1&requireConsensus=1
  - Schedule: Every 15 minutes (choose as needed)
  - Region: Same as your project
  - Headers: X-Cron-Secret: YOUR_SECRET

Forwarding to n8n
- If N8N_ENABLED != false and N8N_WEBHOOK_URL is set, the job forwards the JSON result body to your n8n webhook.
- If N8N_SHARED_SECRET is set, the body is signed with HMAC (header: X-Signature, hex sha256).

Env needed
- ALPACA_KEY_ID, ALPACA_SECRET_KEY, ALPACA_DATA_URL
- CRON_SECRET (to secure the endpoint)
- Optional n8n: N8N_ENABLED, N8N_WEBHOOK_URL, N8N_SHARED_SECRET

Response
- JSON { at, timeframe, threshold, top, enforceDaily, requireConsensus, counts, longs[], shorts[] }

