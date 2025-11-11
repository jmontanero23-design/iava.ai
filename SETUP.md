# iAVA.ai - Setup & Configuration Guide

## 🔑 REQUIRED API KEYS

### 1. Alpaca Markets (REQUIRED for data)
**What it does**: Provides live market data, historical data, paper trading
**Cost**: FREE for paper trading + market data
**Sign up**: https://alpaca.markets

**Environment Variables:**
```bash
ALPACA_KEY_ID=your_key_here
ALPACA_SECRET_KEY=your_secret_here
ALPACA_ENV=paper  # or 'live' for real trading (NOT RECOMMENDED)
```

**How to get keys:**
1. Go to https://alpaca.markets
2. Sign up for a free account
3. Go to Dashboard → API Keys → Generate New Key
4. Select "Paper Trading" (DO NOT use live trading without understanding risks)
5. Copy both Key ID and Secret Key

### 2. AI Provider (OPTIONAL - for AI features)

**Option A: OpenAI (Recommended)**
**What it does**: Powers AI explanations, chat assistant, preset recommendations
**Cost**: Pay-as-you-go (very cheap with GPT-4O Mini ~$0.15/1M tokens)
**Sign up**: https://platform.openai.com

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_MODEL_EXPLAIN=gpt-4o-mini
LLM_MODEL_PRESET=gpt-4o-mini
```

**Option B: Anthropic Claude (Alternative)**
**What it does**: Same as OpenAI but using Claude models
**Cost**: Pay-as-you-go
**Sign up**: https://console.anthropic.com

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. N8N (OPTIONAL - for notifications)
**What it does**: Sends signals to external webhooks
**Cost**: FREE (self-hosted) or paid (cloud)
**Skip this unless you need it**

```bash
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/...
N8N_SHARED_SECRET=your_secret
N8N_ENABLED=true
```

---

## 🚀 SETUP INSTRUCTIONS

### For Vercel Deployment:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add these variables** (one at a time):
   ```
   ALPACA_KEY_ID = PK... (from Alpaca)
   ALPACA_SECRET_KEY = ... (from Alpaca)
   ALPACA_ENV = paper
   LLM_PROVIDER = openai
   OPENAI_API_KEY = sk-... (optional, for AI features)
   ```

3. **Redeploy** - After adding env vars, trigger a new deployment

4. **Verify** - Visit `/api/health` to check configuration:
   ```json
   {
     "status": "ok",
     "api": {
       "alpacaAccount": true,  ← Should be true
       "hasKeys": true,        ← Should be true
       "llm": {
         "provider": "openai",
         "configured": true    ← Should be true if you added OPENAI_API_KEY
       }
     }
   }
   ```

### For Local Development:

1. **Copy .env.example to .env**:
   ```bash
   cp .env.example .env
   ```

2. **Edit .env** and add your keys:
   ```bash
   ALPACA_KEY_ID=PK...
   ALPACA_SECRET_KEY=...
   ALPACA_ENV=paper
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   ```

3. **Never commit .env** (it's already in .gitignore)

4. **Run locally**:
   ```bash
   npm install
   npm run dev
   ```

---

## ⚠️ CURRENT ISSUES & FIXES

### Issue #1: Price Inconsistencies Across Timeframes

**Problem**: 1Min shows $150, 5Min shows $151, 15Min shows $149

**Root Cause**:
- Server caches data for 15s-60s per timeframe
- Client ALSO caches data for 30s-2min per timeframe
- Each timeframe has independent cache
- When you switch between timeframes, you're seeing cached data from different timestamps

**Example Timeline**:
```
10:00:00 - Load 1Min → caches data from 10:00:00
10:00:30 - Switch to 5Min → caches data from 10:00:30 (different timestamp!)
10:00:45 - Switch to 15Min → caches data from 10:00:45 (even more different!)
Result: All three show different "last prices" because they were fetched at different times
```

**Solutions Applied**:
1. ✅ Reduced client cache TTL (30s for 1Min, 2min for 5Min)
2. ✅ Added "Force Refresh" button to clear ALL caches
3. ✅ Server already has short TTL (15s for 1Min)

**What You Need To Do**:
1. Use the "Force Refresh" button when switching timeframes
2. OR wait 30-60 seconds for caches to expire naturally
3. Prices will align once both timeframes have fresh data

### Issue #2: React Error #310 (Infinite Loop)

**Problem**: White screen, "too many re-renders" error

**Status**: ✅ FIXED in commit 059d29f
- Removed duplicate useEffect in WatchlistPanel
- App should now load without infinite loops

**If you still see this**: You're loading OLD code from Vercel/cache
- Vercel must deploy commit `6b8993c` or newer
- Clear browser cache completely
- Or use incognito mode

### Issue #3: Service Worker Cache Poisoning

**Problem**: "Expected JavaScript but got text/html" MIME type error

**Status**: ✅ FIXED in commit 6b8993c
- Added automatic service worker cleanup
- New SW with network-first strategy for JS files

**If you still see this**:
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- DevTools → Application → Service Workers → Unregister
- DevTools → Application → Storage → Clear site data

---

## 🧪 FEATURE STATUS

### ✅ Working WITHOUT API Keys:
- UI/UX (all redesigned components)
- Sample data mode (demo mode)
- Chart rendering
- Indicator calculations (local)
- Design system

### ⚠️ Needs ALPACA Keys:
- Live market data loading
- Historical data
- Price updates
- Account information
- Paper trading orders

### ⚠️ Needs AI Keys (OpenAI/Anthropic):
- AI Signal Explanations (#2)
- AI Chat Assistant (#12)
- Smart Watchlist recommendations (#10)
- NLP Scanner (#11)
- Backtest explanations

### ✅ Working Even Without AI Keys:
- Market Regime Detector (#3) - uses local indicators
- Risk Advisor (#4) - uses math calculations
- Multi-Timeframe Analyst (#6) - uses local data
- Signal Quality Scorer (#1) - tracks locally
- Trade Journal (#7) - uses IndexedDB
- Genetic Optimizer (#9) - pure math
- Anomaly Detector (#5) - statistical analysis

---

## 🎯 RECOMMENDED SETUP FOR FULL FUNCTIONALITY

**Minimum (Basic Trading)**:
```bash
ALPACA_KEY_ID=...
ALPACA_SECRET_KEY=...
ALPACA_ENV=paper
```
Cost: $0/month
Gets you: Live data, paper trading, all non-AI features

**Recommended (Full AI)**:
```bash
ALPACA_KEY_ID=...
ALPACA_SECRET_KEY=...
ALPACA_ENV=paper
LLM_PROVIDER=openai
OPENAI_API_KEY=...
LLM_MODEL_EXPLAIN=gpt-4o-mini
```
Cost: ~$0-5/month (depending on usage)
Gets you: Everything + all 12 AI features

**Advanced (Production)**:
Add all the above PLUS:
- N8N webhooks for signal alerts
- Custom risk rules
- Scheduled scans

---

## 📞 NEED HELP?

1. **Check /api/health** endpoint first
2. **Verify env vars** in Vercel dashboard
3. **Test with sample data** first (no keys needed)
4. **Add keys one at a time** and test after each

**Common Issues**:
- "Missing ALPACA_KEY_ID" → Add Alpaca keys to Vercel env vars
- "Rate limited" → Wait 60s, or disable Consensus Bonus in backtests
- "Prices don't match" → Click Force Refresh, wait for caches to expire
- "White screen" → Clear browser cache, hard refresh
- "AI features don't work" → Add OPENAI_API_KEY or ANTHROPIC_API_KEY

---

**This app is now FUNCTIONAL with proper API keys!** 🚀
