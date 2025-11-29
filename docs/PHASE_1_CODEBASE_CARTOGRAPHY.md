# PHASE 1: COMPLETE CODEBASE CARTOGRAPHY
## iAVA.ai Elite Platform Audit

**Audit Date:** November 29, 2025
**Total Source Files:** 211 files (excluding node_modules, dist, .vercel)
**Total Lines of Code:** ~76,500 lines (68,680 src + 7,835 api)
**Framework:** Vite + React 18 + Tailwind CSS
**Deployment:** Vercel Serverless Functions

---

## 1.1 PROJECT STRUCTURE ANALYSIS

### Visual Architecture Map

```
iava.ai/
├── 📁 api/                          # Vercel Serverless Functions (57 files, 7,835 LOC)
│   ├── 📁 ai/                       # AI/ML Endpoints
│   │   ├── gateway/index.js         # Central AI gateway router
│   │   ├── score.js                 # Unicorn Score calculation
│   │   └── stream.js                # NEW: AI SDK streaming endpoint
│   ├── 📁 alpaca/                   # Alpaca Markets Integration (11 files)
│   │   ├── account.js               # Account info
│   │   ├── assets.js                # Asset lookup
│   │   ├── bars.js                  # Historical OHLCV data
│   │   ├── clock.js                 # Market hours
│   │   ├── order.js                 # Place orders
│   │   ├── order_cancel.js          # Cancel single order
│   │   ├── orders.js                # List orders
│   │   ├── orders_cancel_all.js     # Cancel all orders
│   │   ├── position_close.js        # Close single position
│   │   ├── positions.js             # List positions
│   │   └── positions_close_all.js   # Close all positions
│   ├── 📁 auth/                     # Authentication (3 files)
│   │   ├── login.js                 # JWT login
│   │   ├── register.js              # User registration
│   │   └── verify.js                # Token verification
│   ├── 📁 llm/                      # LLM/GPT Endpoints (6 files)
│   │   ├── index.js                 # Central LLM router
│   │   ├── explain.js               # AI explanations
│   │   ├── help.js                  # AI help responses
│   │   ├── preset.js                # Strategy preset suggestions
│   │   ├── scan_summary.js          # Scanner AI summaries
│   │   └── tune.js                  # Strategy tuning
│   ├── 📁 market/                   # Market Data (3 files)
│   │   ├── depth.js                 # Level 2 market depth
│   │   ├── regime.js                # Market regime detection
│   │   └── volume-profile.js        # Volume profile analysis
│   ├── 📁 portfolio/                # Portfolio Analytics
│   │   └── analytics.js             # Advanced portfolio metrics (641 LOC)
│   ├── 📁 copytrading/              # Social Trading
│   │   └── execute.js               # Copy trade execution (621 LOC)
│   ├── 📁 signals/                  # Trading Signals
│   │   ├── score.js                 # Signal scoring
│   │   └── trade.js                 # Signal-based trades
│   ├── 📁 options/                  # Options Trading
│   │   └── chain.js                 # Options chain data
│   ├── 📁 risk/                     # Risk Management
│   │   └── validate.js              # Risk validation
│   ├── 📁 trading/                  # Trade Execution
│   │   └── execute.js               # Order execution
│   ├── 📁 schedule/                 # Scheduled Tasks
│   │   └── scan.js                  # Automated scans
│   ├── 📁 websocket/                # Real-time Data
│   │   └── stream.js                # WebSocket streaming
│   ├── 📁 stream/                   # Data Streaming
│   │   └── bars.js                  # Live bar data
│   ├── 📁 n8n/                      # Automation Integration
│   │   └── notify.js                # N8N webhooks
│   └── [Other endpoints]
│       ├── account.js               # Account management
│       ├── backtest.js              # Strategy backtesting
│       ├── backtest_batch.js        # Batch backtesting
│       ├── config.js                # App configuration
│       ├── diagnostic.js            # System diagnostics
│       ├── forecast.js              # Price forecasting
│       ├── health.js                # Health checks
│       ├── log.js                   # Logging
│       ├── news.js                  # News API
│       ├── optimize_score.js        # Score optimization
│       ├── ping.js                  # Availability check
│       ├── positions.js             # Position summary
│       ├── scan.js                  # Market scanning
│       ├── sentiment.js             # Sentiment analysis
│       ├── trade_log.js             # Trade history
│       ├── transcribe.js            # Voice transcription
│       ├── tts.js                   # Text-to-speech
│       ├── universe.js              # Stock universe
│       ├── yahoo-proxy.js           # Yahoo Finance proxy
│       └── test-huggingface.js      # HF model testing
│
├── 📁 src/                          # Frontend Application (134 files, 68,680 LOC)
│   ├── 📄 main.jsx                  # Entry point
│   ├── 📄 Router.jsx                # Auth routing (31 LOC)
│   ├── 📄 App.jsx                   # Main app shell (445 LOC)
│   ├── 📄 AppChart.jsx              # Trading chart view (1,085 LOC)
│   ├── 📄 ErrorBoundary.jsx         # Error handling
│   ├── 📄 index.css                 # Design system (1,650 LOC)
│   │
│   ├── 📁 components/               # React Components (80 files)
│   │   ├── [AI Components]
│   │   │   ├── AIChat.jsx           # Main AI chat (1,775 LOC) ⭐
│   │   │   ├── AIChatStream.jsx     # NEW streaming chat
│   │   │   ├── AIFeaturesDashboard.jsx
│   │   │   ├── AIHub.jsx            # AI command center
│   │   │   ├── AIInsightsPanel.jsx
│   │   │   ├── AITradeCopilot.jsx   # Trading assistant (1,745 LOC) ⭐
│   │   │   └── AVAMind.jsx          # AI digital twin
│   │   │
│   │   ├── [Trading Components]
│   │   │   ├── TradingViewChart.jsx
│   │   │   ├── TradingViewChartEmbed.jsx
│   │   │   ├── TradingPanel.jsx
│   │   │   ├── TradePanel.jsx
│   │   │   ├── OrdersPanel.jsx
│   │   │   ├── Portfolio.jsx
│   │   │   ├── PortfolioAnalytics.jsx (1,176 LOC)
│   │   │   ├── Level2MarketDepth.jsx (1,040 LOC)
│   │   │   └── VolumeProfile.jsx (1,162 LOC)
│   │   │
│   │   ├── [Analysis Components]
│   │   │   ├── SignalsPanel.jsx
│   │   │   ├── ScannerPanel.jsx
│   │   │   ├── BacktestPanel.jsx
│   │   │   ├── UnicornScorePanel.jsx
│   │   │   ├── PatternRecognition.jsx
│   │   │   ├── OptionsGreeksCalculator.jsx (1,389 LOC)
│   │   │   ├── ChronosForecast.jsx
│   │   │   ├── MarketSentiment.jsx
│   │   │   ├── MultiSymbolAnalysis.jsx
│   │   │   └── MultiTimeframePanel.jsx
│   │   │
│   │   ├── [AI Feature Panels]
│   │   │   ├── SignalQualityScorerPanel.jsx
│   │   │   ├── RiskAdvisorPanel.jsx (687 LOC)
│   │   │   ├── TradeJournalAIPanel.jsx (778 LOC)
│   │   │   ├── MarketRegimeDetectorPanel.jsx
│   │   │   ├── AnomalyDetectorPanel.jsx
│   │   │   ├── SmartWatchlistBuilderPanel.jsx
│   │   │   ├── PredictiveConfidencePanel.jsx
│   │   │   ├── PersonalizedLearningPanel.jsx
│   │   │   ├── GeneticOptimizerPanel.jsx
│   │   │   └── NaturalLanguageScanner.jsx
│   │   │
│   │   ├── [UI Components]
│   │   │   ├── Hero.jsx
│   │   │   ├── CollapsibleSidebar.jsx
│   │   │   ├── CommandPalette.jsx (807 LOC)
│   │   │   ├── SymbolSearch.jsx
│   │   │   ├── WatchlistPanel.jsx
│   │   │   ├── WatchlistNavigator.jsx
│   │   │   ├── StatusBar.jsx
│   │   │   ├── EnhancedStatusBar.jsx
│   │   │   ├── ToastHub.jsx
│   │   │   ├── SkeletonLoader.jsx
│   │   │   ├── InfoPopover.jsx
│   │   │   ├── SmartTooltip.jsx
│   │   │   └── [etc...]
│   │   │
│   │   ├── [Social/Community]
│   │   │   ├── SocialTradingRooms.jsx
│   │   │   ├── AchievementSystem.jsx
│   │   │   └── UserProfile.jsx
│   │   │
│   │   └── 📁 chart/
│   │       └── SqueezePanel.jsx
│   │
│   ├── 📁 contexts/                 # React Contexts (1 file)
│   │   └── MarketDataContext.jsx    # Global market state (53 LOC)
│   │
│   ├── 📁 hooks/                    # Custom Hooks (4 files)
│   │   ├── useAuth.jsx              # Authentication hook
│   │   ├── useGeneticOptimizer.js
│   │   ├── useStreamingBars.js      # Real-time bar data
│   │   └── useWebSocket.js          # WebSocket connection
│   │
│   ├── 📁 pages/                    # Page Components (1 file)
│   │   └── AIChatDemo.jsx           # Streaming chat demo
│   │
│   ├── 📁 services/                 # Data Services (10 files)
│   │   ├── alpaca.js                # Alpaca client
│   │   ├── alpacaQueue.js           # Request queue
│   │   ├── api.js                   # General API client
│   │   ├── huggingface.js           # HuggingFace client
│   │   ├── orderExecution.js        # Order execution logic
│   │   ├── orders.js                # Order management
│   │   ├── websocket.js             # WebSocket client
│   │   ├── yahooFinance.js          # Yahoo Finance data
│   │   └── 📁 ai/                   # AI Services (4 files)
│   │       ├── enhancedUnicornScore.js (673 LOC)
│   │       ├── huggingfaceAPI.js
│   │       ├── ultraEliteModels.js
│   │       └── ultraEliteModels_v2_SIMPLIFIED.js
│   │
│   └── 📁 utils/                    # Utility Functions (31 files, ~22,000 LOC)
│       ├── [AI/ML Utilities]
│       │   ├── signalQualityScorer.js (3,290 LOC) ⭐ LARGEST
│       │   ├── geneticOptimizer.js (2,815 LOC) ⭐
│       │   ├── personalizedLearning.js (2,655 LOC) ⭐
│       │   ├── aiChatAssistant.js (2,600 LOC) ⭐
│       │   ├── multiTimeframeAnalyst.js (2,421 LOC) ⭐
│       │   ├── predictiveConfidence.js (2,321 LOC) ⭐
│       │   ├── nlpScanner.js (2,008 LOC) ⭐
│       │   ├── smartWatchlist.js (1,884 LOC) ⭐
│       │   ├── regimeDetector.js (1,593 LOC)
│       │   ├── anomalyDetector.js (1,414 LOC)
│       │   ├── riskAdvisor.js (1,450 LOC)
│       │   ├── aiContext.js (629 LOC)
│       │   ├── aiEnhancements.js
│       │   └── aiGateway.js
│       │
│       ├── [Trading Utilities]
│       │   ├── tradeJournal.js (1,522 LOC)
│       │   ├── indicators.js        # Technical indicators
│       │   ├── harmonicPatterns.js
│       │   ├── optionsGreeks.js
│       │   ├── volumeProfile.js
│       │   ├── multiTimeframeAnalysis.js
│       │   ├── scoreConfig.js
│       │   └── riskControls.js
│       │
│       ├── [Infrastructure]
│       │   ├── rateLimiter.js
│       │   ├── requestQueue.js
│       │   ├── tradeLogger.js
│       │   ├── logging.js
│       │   ├── toast.js
│       │   ├── format.js
│       │   ├── urlState.js
│       │   ├── pwa.js
│       │   └── watchlists.js
│       │
│       └── [User Experience]
│           ├── advancedGestures.js
│           └── voiceSynthesis.js
│
├── 📁 lib/                          # Shared Libraries (4 files)
│   ├── cache.js                     # In-memory caching
│   └── 📁 db/
│   │   └── neon.js                  # Neon PostgreSQL client
│   └── 📁 redis/
│       ├── client.js                # Redis client
│       └── redis-client.js          # Redis utilities
│
├── 📁 scripts/                      # Build/Setup Scripts (8 files)
│   ├── setup-database.js
│   ├── check-neon-tables.js
│   ├── create-tables-direct.js
│   ├── create-remaining-tables.js
│   ├── extract-pdf.js
│   ├── generate-icons.js
│   ├── remove-console-logs.js
│   └── test-ai-apis.js
│
├── 📁 docs/                         # Documentation
│   ├── 00_COMPETITIVE_INTEL_NOV2025.md ⭐ NEW
│   ├── DEPLOYMENT.md
│   ├── UX_AUDIT_AND_IMPROVEMENTS.md
│   └── [etc...]
│
├── 📁 public/                       # Static Assets
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service worker
│
└── [Config Files]
    ├── package.json                 # Dependencies
    ├── vite.config.js               # Vite configuration
    ├── tailwind.config.js           # Tailwind configuration
    ├── postcss.config.js            # PostCSS configuration
    ├── vercel.json                  # Vercel deployment config
    └── index.html                   # HTML entry point
```

---

## 1.2 FILE-BY-FILE INVENTORY

### Top 20 Largest Files (Complexity Hotspots)

| Rank | File | Lines | Purpose | Quality | Tech Debt | Priority |
|------|------|-------|---------|---------|-----------|----------|
| 1 | `src/utils/signalQualityScorer.js` | 3,290 | ML signal scoring | 7/10 | Medium | HIGH |
| 2 | `src/utils/geneticOptimizer.js` | 2,815 | Strategy optimization | 7/10 | Medium | MEDIUM |
| 3 | `src/utils/personalizedLearning.js` | 2,655 | User learning AI | 6/10 | High | LOW |
| 4 | `src/utils/aiChatAssistant.js` | 2,600 | Chat logic | 7/10 | Medium | HIGH |
| 5 | `src/utils/multiTimeframeAnalyst.js` | 2,421 | MTF analysis | 7/10 | Medium | MEDIUM |
| 6 | `src/utils/predictiveConfidence.js` | 2,321 | Prediction models | 6/10 | High | MEDIUM |
| 7 | `src/utils/nlpScanner.js` | 2,008 | NLP market scanner | 7/10 | Medium | HIGH |
| 8 | `src/utils/smartWatchlist.js` | 1,884 | Smart watchlists | 7/10 | Low | LOW |
| 9 | `src/components/AIChat.jsx` | 1,775 | Main AI chat UI | 8/10 | Low | CRITICAL |
| 10 | `src/components/AITradeCopilot.jsx` | 1,745 | Trading assistant | 7/10 | Medium | HIGH |
| 11 | `src/index.css` | 1,650 | Design system | 8/10 | Low | MEDIUM |
| 12 | `src/utils/regimeDetector.js` | 1,593 | Market regime | 7/10 | Medium | MEDIUM |
| 13 | `src/utils/tradeJournal.js` | 1,522 | Trade logging | 7/10 | Medium | LOW |
| 14 | `src/utils/riskAdvisor.js` | 1,450 | Risk management | 7/10 | Medium | HIGH |
| 15 | `src/utils/anomalyDetector.js` | 1,414 | Anomaly detection | 6/10 | High | MEDIUM |
| 16 | `src/components/OptionsGreeksCalculator.jsx` | 1,389 | Options analytics | 8/10 | Low | LOW |
| 17 | `src/components/PortfolioAnalytics.jsx` | 1,176 | Portfolio view | 7/10 | Medium | MEDIUM |
| 18 | `src/components/VolumeProfile.jsx` | 1,162 | Volume analysis | 7/10 | Medium | LOW |
| 19 | `src/AppChart.jsx` | 1,085 | Chart view | 7/10 | Medium | HIGH |
| 20 | `src/components/Level2MarketDepth.jsx` | 1,040 | L2 data | 7/10 | Medium | LOW |

### Component Categories

#### Core UI Components (Essential)
| Component | Lines | Status | Notes |
|-----------|-------|--------|-------|
| `App.jsx` | 445 | ✅ Working | Main shell, tab navigation |
| `Router.jsx` | 31 | ✅ Working | Simple auth routing |
| `AppChart.jsx` | 1,085 | ✅ Working | Primary trading view |
| `Hero.jsx` | ~150 | ✅ Working | Header/branding |
| `CommandPalette.jsx` | 807 | ✅ Working | Cmd+K interface |
| `ToastHub.jsx` | ~200 | ✅ Working | Notifications |

#### AI Components (Differentiators)
| Component | Lines | Status | Notes |
|-----------|-------|--------|-------|
| `AIChat.jsx` | 1,775 | ✅ Working | Core AI chat |
| `AIChatStream.jsx` | ~300 | ⚠️ New | Streaming chat (needs testing) |
| `AITradeCopilot.jsx` | 1,745 | ✅ Working | Proactive assistant |
| `AVAMind.jsx` | ~500 | ✅ Working | AI digital twin |
| `AIHub.jsx` | ~400 | ✅ Working | AI feature hub |
| `AIFeaturesDashboard.jsx` | ~300 | ✅ Working | Feature overview |

#### Trading Components
| Component | Lines | Status | Notes |
|-----------|-------|--------|-------|
| `TradingViewChartEmbed.jsx` | ~400 | ✅ Working | TradingView integration |
| `Portfolio.jsx` | ~500 | ✅ Working | Portfolio view |
| `PortfolioAnalytics.jsx` | 1,176 | ✅ Working | Advanced analytics |
| `OrdersPanel.jsx` | ~300 | ✅ Working | Order management |
| `TradePanel.jsx` | ~400 | ✅ Working | Trade execution |
| `Level2MarketDepth.jsx` | 1,040 | ✅ Working | Market depth |
| `VolumeProfile.jsx` | 1,162 | ✅ Working | Volume analysis |

---

## 1.3 FEATURE INVENTORY MATRIX

| Feature | Status | Files Involved | Completeness | UX Quality | Performance | Mobile | A11y |
|---------|--------|----------------|--------------|------------|-------------|--------|------|
| **Auth/Login** | ✅ Working | Router, AuthPage, useAuth, api/auth/* | 95% | 7/10 | Good | ✅ | ⚠️ |
| **Dashboard** | ✅ Working | App.jsx, Hero.jsx | 90% | 8/10 | Good | ✅ | ⚠️ |
| **Portfolio View** | ✅ Working | Portfolio.jsx, PortfolioAnalytics.jsx | 85% | 7/10 | Good | ⚠️ | ⚠️ |
| **Trade Execution** | ✅ Working | TradePanel, OrdersPanel, api/alpaca/* | 80% | 7/10 | Good | ⚠️ | ⚠️ |
| **Watchlists** | ✅ Working | WatchlistPanel, WatchlistNavigator | 85% | 7/10 | Good | ✅ | ⚠️ |
| **Charts/TradingView** | ✅ Working | TradingViewChartEmbed, AppChart | 90% | 8/10 | Good | ⚠️ | ❌ |
| **AI Chat/Assistant** | ✅ Working | AIChat.jsx, aiChatAssistant.js | 85% | 8/10 | Good | ✅ | ⚠️ |
| **AI Streaming** | 🆕 New | AIChatStream.jsx, api/ai/stream.js | 60% | 7/10 | TBD | ✅ | ⚠️ |
| **Alerts/Notifications** | ✅ Working | ToastHub.jsx, toast.js | 80% | 7/10 | Good | ✅ | ⚠️ |
| **Settings** | ⚠️ Partial | ModeToggle, UserProfile | 60% | 6/10 | Good | ⚠️ | ⚠️ |
| **Paper Trading** | ✅ Working | Alpaca paper mode toggle | 75% | 6/10 | Good | ✅ | ⚠️ |
| **Market Data** | ✅ Working | MarketDataContext, yahooFinance | 90% | N/A | Good | N/A | N/A |
| **News Feed** | ✅ Working | api/news.js | 70% | 6/10 | Good | ⚠️ | ⚠️ |
| **Social/Community** | ⚠️ Partial | SocialTradingRooms.jsx | 40% | 5/10 | TBD | ⚠️ | ⚠️ |
| **Search** | ✅ Working | SymbolSearch, CommandPalette | 85% | 8/10 | Good | ⚠️ | ⚠️ |
| **Onboarding** | ✅ Working | WelcomeTour.jsx | 70% | 7/10 | Good | ⚠️ | ⚠️ |
| **Voice Input** | ⚠️ Partial | transcribe.js, tts.js | 50% | 5/10 | TBD | ⚠️ | ⚠️ |
| **Scanner** | ✅ Working | ScannerPanel, NaturalLanguageScanner | 85% | 7/10 | Good | ⚠️ | ⚠️ |
| **Backtesting** | ✅ Working | BacktestPanel, api/backtest.js | 80% | 7/10 | Medium | ❌ | ⚠️ |
| **Options** | ✅ Working | OptionsGreeksCalculator, api/options/* | 75% | 7/10 | Good | ❌ | ⚠️ |

### Legend
- ✅ = Full support
- ⚠️ = Partial/Needs work
- ❌ = Not supported
- 🆕 = New feature

---

## 1.4 INTEGRATION DEEP-DIVE

### Alpaca Markets Integration

**Files:** `api/alpaca/*` (11 files), `src/services/alpaca.js`

| Endpoint | Purpose | Auth | Rate Limiting | Caching | Status |
|----------|---------|------|---------------|---------|--------|
| `/api/alpaca/account` | Account info | ✅ APCA headers | ❌ | ❌ | Working |
| `/api/alpaca/assets` | Asset lookup | ✅ APCA headers | ❌ | ❌ | Working |
| `/api/alpaca/bars` | OHLCV data | ✅ APCA headers | ✅ 429 handling | ✅ TTL-based | Working |
| `/api/alpaca/clock` | Market hours | ✅ APCA headers | ❌ | ❌ | Working |
| `/api/alpaca/order` | Place order | ✅ APCA headers | ❌ | ❌ | Working |
| `/api/alpaca/orders` | List orders | ✅ APCA headers | ❌ | ❌ | Working |
| `/api/alpaca/positions` | List positions | ✅ APCA headers | ❌ | ❌ | Working |

**Configuration:**
```javascript
// Environment Variables Required
ALPACA_KEY_ID        // API Key
ALPACA_SECRET_KEY    // API Secret
ALPACA_DATA_URL      // Default: https://data.alpaca.markets
ALPACA_STOCKS_FEED   // Default: 'iex' (free tier)
ALPACA_DISABLE_CACHE // Default: false
```

**Order Types Supported:**
- Market orders
- Limit orders
- Stop orders
- Stop-limit orders
- Trailing stop orders

**Paper vs Live:**
- Toggle in `AlpacaCredentials.jsx`
- Environment-based URL switching

### TradingView Integration

**Files:** `TradingViewChartEmbed.jsx`, `TradingViewChart.jsx`

**Implementation:**
- Uses TradingView widget embed
- Custom indicator overlays via `lightweight-charts`
- Timeframe sync with market data context

**Features Enabled:**
- Multi-timeframe charts
- Drawing tools
- Technical indicators
- Symbol switching

### OpenAI/GPT Integration

**Files:** `api/llm/*` (6 files), `api/ai/stream.js`

**Models Used:**
```javascript
const GPT5_MODELS = {
  COMPLEX: 'gpt-5',      // Complex analysis
  MEDIUM: 'gpt-5-mini',  // Standard queries
  SIMPLE: 'gpt-5-nano'   // Quick responses
}
```

**Streaming Implementation:**
- Uses Vercel AI SDK (`@ai-sdk/openai`, `ai`)
- Edge runtime for streaming
- `useChat` hook on frontend

**Features:**
- Trading analysis
- Strategy suggestions
- Chart explanations
- Risk assessment
- Natural language scanning

### Yahoo Finance Integration

**Files:** `src/services/yahooFinance.js`, `api/yahoo-proxy.js`

**Purpose:** Free unlimited market data backup
- Real-time quotes
- Historical OHLCV
- Fallback when Alpaca rate limited

### HuggingFace Integration

**Files:** `src/services/huggingface.js`, `api/test-huggingface.js`

**Models/Use Cases:**
- Sentiment analysis
- Time series forecasting (Chronos)
- Embeddings for similarity

### Database (Neon PostgreSQL)

**Files:** `lib/db/neon.js`

**Tables:**
- Users
- Trades
- Signals
- Sessions

### Redis (Caching/Sessions)

**Files:** `lib/redis/client.js`, `lib/redis/redis-client.js`

**Use Cases:**
- Session storage
- Rate limit tracking
- Real-time data caching

---

## 1.5 DEPENDENCY ANALYSIS

### Production Dependencies

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `@ai-sdk/openai` | ^2.0.65 | OpenAI integration | Low |
| `@ai-sdk/react` | ^2.0.101 | AI SDK React hooks | Low |
| `@neondatabase/serverless` | ^1.0.2 | PostgreSQL client | Low |
| `ai` | ^5.0.92 | Vercel AI SDK | Low |
| `bcryptjs` | ^3.0.3 | Password hashing | Low |
| `dotenv` | ^17.2.3 | Env management | Low |
| `drizzle-orm` | ^0.44.7 | ORM (unused?) | Medium |
| `fuse.js` | ^7.1.0 | Fuzzy search | Low |
| `ioredis` | ^5.8.2 | Redis client | Low |
| `jsonwebtoken` | ^9.0.2 | JWT auth | Low |
| `lightweight-charts` | ^4.2.3 | Chart library | Low |
| `lucide-react` | ^0.554.0 | Icons | Low |
| `react` | ^18.3.1 | UI framework | Low |
| `react-dom` | ^18.3.1 | React DOM | Low |
| `react-markdown` | ^10.1.0 | Markdown render | Low |
| `react-syntax-highlighter` | ^16.1.0 | Code highlighting | Low |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@vitejs/plugin-react` | ^4.3.4 | Vite React plugin |
| `autoprefixer` | ^10.4.20 | CSS autoprefixer |
| `postcss` | ^8.4.47 | CSS processing |
| `tailwindcss` | ^3.4.14 | CSS framework |
| `vite` | ^7.2.2 | Build tool |
| `sharp` | ^0.34.5 | Image processing |

---

## 1.6 ARCHITECTURE OBSERVATIONS

### Strengths
1. **Clean separation** between API layer and frontend
2. **Comprehensive AI integration** with multiple models
3. **Well-structured design system** in CSS variables
4. **Mobile-first responsive design** built in
5. **Multiple data source fallbacks** (Alpaca → Yahoo)
6. **PWA-ready** with manifest and service worker

### Technical Debt Identified
1. **Large utility files** - Several files >2000 LOC need splitting
2. **Missing TypeScript** - No type safety
3. **Limited testing** - No visible test files
4. **Console.log pollution** - Scripts exist to remove but likely still present
5. **Unused dependencies** - `drizzle-orm` appears unused
6. **Mixed state management** - Context + local state + URL state

### Architectural Concerns
1. **Single context** for all market data may not scale
2. **No error boundary hierarchy** - Single top-level boundary
3. **WebSocket reconnection** handling unclear
4. **Rate limiting** only on some endpoints

---

## PHASE 1 SUMMARY

### Key Metrics
- **211 source files** across frontend and API
- **~76,500 lines of code**
- **80+ React components**
- **57 API endpoints**
- **31 utility modules**

### Critical Components
1. `AIChat.jsx` - Main AI interface, well-structured
2. `AppChart.jsx` - Trading chart, needs mobile optimization
3. `signalQualityScorer.js` - Largest file, may need refactoring
4. `index.css` - Design system is comprehensive

### Next Phase Focus
Phase 2 will analyze the design system in depth, extracting all colors, typography, spacing, and component patterns to create a unified design language.

---

*Phase 1 Complete - November 29, 2025*
