# iAVA.ai — Implementation Plan (Digest of Blueprint)

This plan distills the PDF blueprint into phases, components, and concrete tasks. It aligns the UI, indicator engine, “Unicorn Score” signal logic, LLM/n8n orchestration, broker integration, and WordPress/Pages delivery.

## Executive Summary
- Core edge: confluence of independent signals (trend + volatility + momentum + structure) to surface rare, high‑quality trades (“Unicorns”).
- Indicators: SATY ATR Levels (+ Pivot Ribbon), Ripster EMA Clouds, TTM Squeeze, Ichimoku (Tenkan/Kijun, Span A/B, Chikou).
- Decisioning: Unicorn Score = Rarity × Quality × Regime‑fit. Start heuristic, evolve via backtests/analytics.
- Automation: n8n workflow drives an LLM with strict JSON schema → action: order | notify | pass. Orders as paper trades (Alpaca) with bracket (SL/TP).
- UX: Web UI (React/Vite) for charts, overlays, signals; GitHub Pages for the app (subdomain recommended).

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
- [ ] Add "Explain" button in UnicornCallout to call /api/llm/explain (stub with mock text until key configured).
- [ ] Add "Suggest Preset" in Presets area, using /api/llm/preset with structured state.
- [ ] Add scan consensus mode (done), score consensus bonus toggle (next), and preset overlay chips (done).

---

## PROGRESS UPDATE — UX Enhancement Sprints (December 2025)

### Completed: Sprint 1 — Critical UX Fixes ✅

**Sprint 1.1: AI Insights Panel Always Visible**
- ISSUE: Panel disappeared completely when no Unicorn signal (score < 70), users thought features were broken
- FIX: Panel now always renders with helpful empty states
- Added 3 contextual states:
  1. No data: "Load a symbol with at least 50 bars"
  2. Low score: Shows progress bar + current score (e.g., "45/100")
  3. Signal active: Full 12-feature analysis display
- Added visual feedback: ⏳ waiting icon, score progress bar, helpful tips
- Status: DEPLOYED ✅

**Sprint 1.2: Feature Status Badge in Navigation**
- ISSUE: Users didn't know which AI features were active
- FIX: Added prominent "9/12 AI Features" badge in navigation
- Badge shows:
  - Active count vs total (9 client-side always active)
  - Color-coded status dot (cyan = active, amber = needs setup)
  - Hover tooltip with breakdown (9 client-side + 3 API-required)
  - Click navigates to AI Dashboard
- Positioned on right side of nav bar for constant visibility
- Status: DEPLOYED ✅

**Sprint 1.3: Enhanced Loading States**
- ISSUE: Users confused during async operations (no feedback)
- FIX: Added comprehensive loading indicators to AIInsightsPanel
- New `isAnalyzing` state tracks 12-feature analysis
- Status indicator shows 3 states:
  - Cyan pulsing: "Analyzing with 12 Features..."
  - Emerald pulsing: "12 Features Active"
  - Yellow: "Waiting for Signal"
- Empty state icon changes: ✨ when analyzing, ⏳ when waiting
- All major components verified:
  - AI Chat: ✅ has `isTyping` with animated dots
  - NLP Scanner: ✅ has `isProcessing` with button text
  - Model Monitoring: ✅ has initial loading message
  - AppChart: ✅ has loading state
  - AI Insights Panel: ✅ NEW analyzing state
- Status: DEPLOYED ✅

**Sprint 1.4: Welcome Tour for New Users**
- ISSUE: Zero onboarding, users confused by UI complexity
- FIX: Created interactive 7-step tour
- Tour features:
  - Shows automatically on first visit (localStorage tracking)
  - 7 guided steps: Welcome → Nav tabs → Feature badge → Controls → Unicorn concept → AI panel → Getting started
  - Progress bar + visual step indicators
  - Dismissible with "Skip Tour" option
  - Backdrop blur overlay for focus
- Added floating "?" help button (bottom-right)
- Tour can be restarted anytime via help button
- Status: DEPLOYED ✅

**Sprint 1 Impact:**
- Reduced user confusion about feature availability
- Clear feedback during all async operations
- Guided onboarding for new users
- Always-visible AI panel prevents "broken feature" perception

---

### Completed: Sprint 2.1 — Hero Visual Redesign ✅

**Hero Section Modernization**
- ISSUE: Hero lacked visual impact, Unicorn concept not prominent
- FIX: Complete visual overhaul with modern design language
- Changes:
  1. **Vibrant Gradients**: Upgraded from basic gradients to more vibrant indigo/purple/cyan animations
  2. **Logo Glow Effect**: Added pulsing glow effect around logo for premium feel
  3. **Unicorn Callout** (NEW):
     - Prominent animated callout in top-right corner
     - Bouncing unicorn emoji (2s animation)
     - Gradient background with hover effect
     - Tagline: "Rare. Powerful. AI-Validated."
     - Emphasizes core value proposition
  4. **Enhanced Feature Badges**:
     - Larger, more prominent with gradient backgrounds
     - Each badge has unique color theme + icon
     - Hover scale animation (105%)
     - Shadow effects for depth
     - "Unicorn Detection" badge featured
  5. **Indicator Pills**: Converted text mentions to styled pill badges with color-coded borders
  6. **Responsive Layout**: Unicorn callout reflows gracefully on mobile
- Status: DEPLOYED ✅

**Sprint 2.1 Impact:**
- Immediately communicates the "Unicorn" value proposition
- More engaging and modern visual design
- Better feature hierarchy and discoverability
- Premium feel matches AI-powered capabilities

---

### In Progress: Sprint 2.2 — Navigation & Polish 🚧

**Remaining Sprint 2 Tasks:**
- [ ] Navigation simplification (reduce cognitive load)
- [ ] Add tooltips for technical terms (SATY, Ripster, etc.)
- [ ] Polish transitions and micro-interactions
- [ ] Improve color consistency across components

**Sprint 2 Target:** Modern, sleek, user-friendly interface with seamless interactions

---

### Upcoming: Sprint 3 — Infrastructure & Performance ⏳

**Sprint 3.1: API Key Management UI**
- Create settings panel for OpenAI/Anthropic API keys
- In-app key validation and testing
- Encrypted storage in Vercel environment
- Enable all 12 AI features without manual config

**Sprint 3.2: Performance Optimization**
- Code splitting to reduce bundle size (currently 552 KB / 164 KB gzipped)
- Lazy loading for route components
- Tree shaking unused dependencies
- Target: <400 KB bundle, <120 KB gzipped

**Sprint 3 Target:** Production-ready performance and zero-friction API setup

---

### Metrics

**Bundle Size:**
- Sprint 1 Start: 540.89 KB (162.15 KB gzipped)
- Sprint 1 End: 545.82 KB (163.28 KB gzipped) — +0.9% (welcome tour)
- Sprint 2.1 End: 552.26 KB (164.80 KB gzipped) — +2.1% (Hero redesign)
- Target (Sprint 3): <400 KB (<120 KB gzipped)

**Components Created:**
- FeatureStatusBadge.jsx (102 lines) — Status indicator
- WelcomeTour.jsx (196 lines) — Onboarding tour
- Enhanced: AIInsightsPanel.jsx — Always-visible with loading states
- Enhanced: Hero.jsx — Modern design with Unicorn callout

**Commits:**
1. `72292c9` - UX: Feature Status Badge (Sprint 1.2)
2. `e291d72` - UX: Enhanced loading states (Sprint 1.3)
3. `1b73317` - UX: Welcome Tour onboarding (Sprint 1.4)
4. `7902451` - UX: Modernized Hero with Unicorn callout (Sprint 2.1)

**Lines of Code Added:**
- Sprint 1: ~300 lines (status indicators + loading states + welcome tour)
- Sprint 2.1: ~100 lines (Hero redesign)
