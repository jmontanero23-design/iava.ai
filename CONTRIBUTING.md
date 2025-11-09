# Contributing

Setup
- Node 18+ (Node 22 preferred)
- `npm install`
- Copy `.env.example` values into Vercel Project settings (env vars). Do not commit credentials.

Dev
- `npm run dev` — local dev server
- `npm run build` — production build (Vite)
- `npm run backtest -- AAPL 1Min 1000` — CLI quick check

Quality
- Production‑safe only. No stubs or temporary keys in code.
- Add inline guidance with `InfoPopover` for non‑obvious UI.
- Keep indicators pure and deterministic.
- Cache where appropriate (bars/backtest daily cache).
- Use small, focused commits.

Architecture
- UI (React/Vite) under `src/`
- Serverless functions under `api/` (Vercel)
- Indicators and scoring in `src/utils/indicators.js`
- Trading ops via Alpaca endpoints in `api/alpaca/*`
- n8n relay in `api/n8n/notify.js`

