# iAVA.ai — Implementation Plan (Digest of Blueprint)

This plan distills the PDF blueprint into phases, components, and concrete tasks. It aligns the UI, indicator engine, “Unicorn Score” signal logic, LLM/n8n orchestration, broker integration, and WordPress/Pages delivery.

## Executive Summary
- Core edge: confluence of independent signals (trend + volatility + momentum + structure) to surface rare, high‑quality trades (“Unicorns”).
- Indicators: SATY ATR Levels (+ Pivot Ribbon), Ripster EMA Clouds, TTM Squeeze, Ichimoku (Tenkan/Kijun, Span A/B, Chikou).
- Decisioning: Unicorn Score = Rarity × Quality × Regime‑fit. Start heuristic, evolve via backtests/analytics.
- Automation: n8n workflow drives an LLM with strict JSON schema → action: order | notify | pass. Orders as paper trades (Alpaca) with bracket (SL/TP).
- UX: Web UI (React/Vite) for charts, overlays, signals; WordPress endpoint for live feed and dashboard embed. GitHub Pages for the app (subdomain recommended).

## Architecture
- Frontend (React + Vite): charting with `lightweight-charts`, overlays, signal toggles, symbol/timeframe controls.
- Indicator Engine (TS/JS): OHLCV in → indicators + signal states → Unicorn Score.
- Data Layer: market data provider (e.g., Alpaca/Polygon/Finnhub), caching, timeframe adapters.
- Orchestration (n8n): cron/webhook → fetch data → compute signals → score → LLM decision (JSON) → route (order/notify/log).
- Broker: Alpaca (paper) for bracket orders and fills; risk guardrails before order.
- CMS/Reporting: WordPress plugin endpoint `wp-json/iava/v1/signal` to receive signal/trade updates; dashboard shortcode.
- Storage/Logs: Append signal/trade decisions and P/L to DB or Sheets for analytics and model tuning.

## Indicators (specs)
- SATY ATR Levels: prior close pivot ± {0.236, 0.618, 1.0, 1.236, 1.618} × ATR(14) bands; mode‑driven ATR timeframe; info panel (trend via EMA ribbon, ATR range%). Signals: triggers crossing in trend.
- Pivot Ribbon: EMA set (8/21/34) base, Pro (8/13/21/48/200) optional; color flips on crossovers; conviction arrows on 13/48 cross.
- Ripster EMA Clouds: 5/12 (fast), 8/9 (very fast), 20/21 (medium), 34/50 (anchor). Bias from 34/50; entries on pullbacks to fast clouds within bullish context.
- TTM Squeeze: BB(20, 2σ) inside KC(20, 1.5×ATR) → Squeeze ON; fires on expansion with momentum histogram for direction.
- Ichimoku: Tenkan(9), Kijun(26), Span A/B (52; shifted), Chikou; TK crosses, price vs cloud, slope for regime.

## Unicorn Score (confluence)
- Inputs (booleans/grades): SATY trigger, Pivot trend, Ripster 34/50 bias, Squeeze state + momentum dir, Ichimoku TK cross/cloud, optional volume surge.
- Scoring: Rarity (empirical overlap frequency), Quality (historical expectancy), Regime‑fit (performance by trend/volatility regime). Initial heuristic weights → later data‑driven.
- Threshold T: trigger actions only when score ≥ T (optimize via backtests; target high precision low frequency).

## Risk & Execution
- Position sizing: 1–2% risk per trade; size from stop distance (e.g., ATR or ATR band boundary).
- Orders: bracket with SL/TP; TIF: DAY or GTC; daily loss cap; max concurrent trades; pause on limits.
- Logging: every decision, params, fills, P/L; feed analytics.

## n8n Workflow (MVP)
1) Trigger (cron or webhook with symbol/timeframe)
2) Fetch OHLCV → compute indicators & unicorn score
3) LLM guardrailed decision (JSON schema): {action, order{side, qty, stop, takeProfit…}, notes}
4) Branch:
   - order → Alpaca (paper) bracket
   - notify → Discord/Telegram/Email
   - pass → log only
5) Post summary to WordPress endpoint; persist to DB/Sheets

## Web Delivery
- UI app: GitHub Pages at subdomain (e.g., app.iava.ai). WordPress remains on apex.
- WordPress plugin: REST endpoint to receive updates; shortcode dashboard to render stream/stats.

## Milestones
1) Indicators & UI
   - Implement SATY ATR levels + shading and Pivot Ribbon
   - Finalize Ichimoku + TK crosses; finish TTM squeeze with histogram
   - UI toggles, symbol/timeframe, presets
2) Data Integration
   - Provider selection (Alpaca/Polygon/Finnhub)
   - OHLC adapters, rate‑limit/caching, env config
3) Signal Engine
   - Normalize indicator states (trend/up/down/flat, squeeze on/off, crosses)
   - Heuristic Unicorn Score v1; event stream
4) Backtesting
   - Historical runner, metrics (win%, PF, Sharpe), param grid
   - Calibrate T threshold, SL/TP defaults
5) Automation
   - n8n workflow + LLM schema + Alpaca paper trading
   - WordPress endpoint + dashboard widget
6) Hardening & Deploy
   - CI checks, Pages deploy, custom domain, secrets handling
   - Monitoring/logging and on‑call alerts (basic)

## Sprint 1 (7–10 days)
- UI: add SATY ATR overlays (pivot ± bands), Pivot Ribbon, TTM Squeeze histogram panel
- Data: plug in provider (Alpaca Data API v2 or Polygon) for 1m/5m/15m/1h/d bars
- Engine: compute normalized states (bool/enum) for each indicator per bar
- Score: Unicorn Score v1 (rule‑based), signal cards in UI
- Docs: environment setup, keys, and indicator math references

## Sprint 2 (7–10 days)
- Backtester: run N symbols/timeframes; store results; choose T threshold
- n8n: build full workflow; connect LLM with JSON schema; Alpaca paper orders
- WordPress: plugin endpoint + dashboard page
- Risk: daily loss cap and position sizing rules

## Key Decisions (open)
- Data source: Alpaca vs Polygon vs Finnhub (costs, limits, coverage)
- Custom domain: `app.iava.ai` CNAME to GitHub Pages vs apex migration
- LLM provider and model choice; rate limits and cost controls
- Backtester stack: Node only vs add a Python submodule for speed/TA libs

## Risks & Mitigations
- Overfitting: insist on out‑of‑sample tests, walk‑forward validation
- Latency/quotas: cache and batch; configurable polling
- WordPress rate limits: throttle posts; queue via n8n
- Compliance: paper trade first; clear disclosures; audit logs




## AI Feature Integration Plan (Phased)

Phase 1 — Guardrailed AI Assist (Near-term)
- Natural-language “Explain This” for current signal: send structured state (indicators, score, daily regime) to an LLM with a constrained prompt to produce a short, non-actionable explanation. Output rendered only in the UI; never executed.
- Auto-preset suggestion: LLM recommends a strategy preset based on symbol liquidity, timeframe, regime and Squeeze/ATR context. Only sets UI preset; requires user confirmation.
- Parameter helper: propose threshold/horizon tweaks for Backtest; user can click “Apply”.

Phase 2 — Orchestrated Actions (n8n)
- Structured signal payloads to n8n for: watchlist maintenance, Discord/Slack posts (deferred), and summary reports. HMAC signing enabled.
- Optional: n8n schedules periodic scans with Vercel Cron, writes results to a DB; UI reads summaries.

Phase 3 — ML Scoring Augmentation (Later)
- Add a learned component to the Unicorn score using historical labels (e.g., light GBM / logistic regression). Train offline; serve as a deterministic function on the server.
- Add meta-features: volatility regime, session-of-day, gap/earnings proximity, to improve discriminability.

Phase 4 — Generative UX (Opt-in)
- Chat interface for: “scan 5Min >80 with daily bull consensus”; converts to query and runs scanner.
- Risk reasoning: “why reduce size?” referencing daily mismatch/ATR extension and backtest expectancy.

Guardrails
- No live trade execution driven by AI; any AI suggestion requires explicit user confirmation.
- Strict separation of client and server secrets; LLM calls proxied via server with redaction.

Open Tasks (near-term)
- [ ] Add “Explain” button in UnicornCallout to call /api/llm/explain (stub with mock text until key configured).
- [ ] Add “Suggest Preset” in Presets area, using /api/llm/preset with structured state.
- [ ] Add scan consensus mode (done), score consensus bonus toggle (next), and preset overlay chips (done).
