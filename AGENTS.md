# AGENTS — Collaboration Guide for AI + Humans

This repository welcomes multiple agents (AI and humans). Please adhere to these rules to maintain world‑class quality:

Principles
- Build production‑safe features only. No stubs or mocked endpoints in main.
- Keep changes small, focused, and reversible. Prefer incremental PRs.
- Preserve UX clarity: add concise in‑app guidance (InfoPopover) for new panels/controls.
- Respect performance: cache where appropriate (bars/backtest), throttle URL/state writes.
- Explainability first: surface “why” for scores and decisions.

Code Style
- Frontend: React + Vite, functional components, minimal state, hooks, Tailwind.
- Indicators live in `src/utils/indicators.js`. Extend with pure functions and keep them deterministic.
- Serverless routes under `api/` use only environment variables for secrets. Never expose keys to the client.
- Prefer composition over complex monoliths. One component per concern.

Implementation Checklist
1. Add small guidance via `InfoPopover` where new UX might confuse.
2. Add caching if an endpoint may be hit frequently.
3. Add URL/deep‑link support if state is shareable.
4. Update `.env.example` if new env keys/guardrails are used.
5. Validate in dev and on Vercel. Keep an eye on guardrails.

Scope Map
- UI/UX: `src/components/*`
- Indicators/Signals: `src/utils/indicators.js`
- Data/Providers: `src/services/*` and `api/alpaca/*`
- Backtest/Analytics: `api/backtest*.js`, `scripts/backtest.mjs`
- Trading Ops: `api/alpaca/order*.js`, `api/alpaca/positions*.js`

