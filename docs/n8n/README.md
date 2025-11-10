N8N Workflow — Unicorn Signal Intake

Overview
- This workflow receives Unicorn Signal payloads from the app, validates the HMAC signature, optionally notifies channels, and can call back to the app’s serverless APIs to place a paper order (guardrailed).

What the app sends
- Endpoint: POST to your n8n Webhook URL (N8N_WEBHOOK_URL)
- Headers: X-Signature: <hex HMAC-SHA256 of raw body with N8N_SHARED_SECRET>
- Body JSON shape:
  {
    "type": "unicorn_signal",
    "at": "2025-01-01T00:00:00.000Z",
    "score": 85,
    "facts": ["Pivot: bullish", "Squeeze: fired up", ...],
    "context": {
      "satyDir": "long"|"short"|null,
      "pivotNow": "bullish"|"bearish"|"neutral",
      "ichiRegime": "bullish"|"bearish"|"neutral",
      "components": { ... },
      "_timeframe": "5Min",
      "_bars": [{ time, open, high, low, close, volume, symbol } ...],
      "_daily": { pivotNow, ichiRegime },
      "_enforceDaily": true|false,
      "_consensus": { align: true|false } | null
    }
  }

Environment in n8n (recommended)
- N8N_SHARED_SECRET: must match your Vercel env N8N_SHARED_SECRET (used for HMAC verification)
- APP_BASE_URL: e.g., https://app.iava.ai (used for callbacks to /api/*)
- Optional: SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL (only if you add those notify nodes)

Import the workflow
1) In n8n, New → Import from file → docs/n8n/unicorn-signal.workflow.json
2) Open the Workflow, set Webhook path to your desired route (or leave as imported).
3) Set environment variables (Settings → Environment → Add variable): N8N_SHARED_SECRET, APP_BASE_URL.
4) Save and activate.

How it works
- Webhook (POST) receives the payload
- Verify HMAC (Code node) using N8N_SHARED_SECRET and header X-Signature
- IF node routes by score ≥ threshold (default 70)
- Optional: HTTP Request sends a paper order to APP_BASE_URL/api/alpaca/order (guardrails enforced server‑side)
- Optional: HTTP Request posts to APP_BASE_URL/api/log for an audit trail
- Optional: Add Slack/Discord/Email nodes on the “notify” branch

Mapping for paper order (example)
- Method: POST
- URL: {{$env.APP_BASE_URL}}/api/alpaca/order
- Body JSON:
  {
    "symbol": {{$json["context"]["_bars"][($json["context"]["_bars"].length - 1)].symbol}},
    "side": {{$json["context"]["satyDir"] === "short" ? "sell" : "buy"}},
    "qty": 1,
    "type": "market",
    "orderClass": "bracket",
    "takeProfit": { "limit_price": {{$json["context"]["_bars"][($json["context"]["_bars"].length - 1)].close * 1.01}} },
    "stopLoss": { "stop_price": {{$json["context"]["_bars"][($json["context"]["_bars"].length - 1)].close * 0.995}} },
    "entry": {{$json["context"]["_bars"][($json["context"]["_bars"].length - 1)].close}}
  }

Notes
- Use paper trading first. All guardrails are re‑enforced by the app’s API (market open, exposure, risk %, cooldown, daily loss cap).
- You can expand the flow with alerts (Slack/Discord/Email) and sheets/DB logging.

