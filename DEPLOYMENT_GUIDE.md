# 🚀 DEPLOYMENT GUIDE - Critical Fixes Ready

## ✅ FIXES COMPLETED (Ready for Deployment)

### 1. Symbol Detection - Enhanced Debug Logging
**File**: `src/utils/aiEnhancements.js`
- Added detailed console logging to trace regex matching
- Case-insensitive regex with `gi` flags
- `.toUpperCase()` normalization
- Logs will show: Input text → Pattern matches → Final result

### 2. Infinite Loop Fix - Debouncing
**File**: `src/App.jsx`
- Added 500ms debounce to prevent duplicate symbol load requests
- Added `_forwarded` flag to prevent event re-processing
- Console will show: `[App] Ignoring duplicate symbol load request (debounced)`

### 3. News API - Fixed Environment Variables
**File**: `api/news.js`
- **CRITICAL**: Changed from `VITE_ALPACA_KEY` → `ALPACA_KEY_ID`
- Changed from `VITE_ALPACA_SECRET` → `ALPACA_SECRET_KEY`
- Uses `ALPACA_ENV` for paper vs. live trading
- Better error messages when credentials missing

---

## 📋 DEPLOYMENT STEPS

### Option 1: Git Push (Vercel Auto-Deploy) ⭐ RECOMMENDED
```bash
# 1. Check what files changed
git status

# 2. Add all changes
git add .

# 3. Commit with descriptive message
git commit -m "🔧 Fix: Symbol detection, infinite loop, and Alpaca news API

- Added debug logging to symbol detection
- Fixed infinite loop with debouncing
- Corrected Alpaca env variable names (ALPACA_KEY_ID)
- Enhanced news sentiment source validation"

# 4. Push to trigger Vercel deployment
git push origin main

# 5. Watch Vercel deploy (should take 30-60 seconds)
# Visit: https://vercel.com/your-team/iava-ai/deployments
```

### Option 2: Manual Vercel Deploy
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod

# Follow prompts
```

---

## 🔑 VERCEL ENVIRONMENT VARIABLES (CRITICAL!)

Go to: **Vercel Dashboard → iava.ai Project → Settings → Environment Variables**

### Required for News API to Work:
```bash
# Alpaca Trading API
ALPACA_KEY_ID=pk_xxxxxxxxxxxxx           # Your Alpaca API Key
ALPACA_SECRET_KEY=xxxxxxxxxxxxxxxx       # Your Alpaca Secret Key
ALPACA_ENV=paper                         # Use 'paper' for testing, 'live' for real

# Alpaca Data URLs (optional, has defaults)
ALPACA_DATA_URL=https://data.alpaca.markets/v2
```

### Required for AI Chat:
```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx # Your OpenAI API Key
LLM_PROVIDER=openai
LLM_MODEL_EXPLAIN=gpt-5-nano
LLM_MODEL_PRESET=gpt-5-nano
```

### How to Get Alpaca Keys:
1. Go to [https://alpaca.markets/](https://alpaca.markets/)
2. Sign up for free paper trading account
3. Dashboard → API Keys → Generate New Key
4. Copy `API Key ID` → Use as `ALPACA_KEY_ID`
5. Copy `Secret Key` → Use as `ALPACA_SECRET_KEY`

---

## 🧪 TESTING CHECKLIST (After Deployment)

### Test 1: Verify Deployment
1. Go to [https://app.iava.ai/](https://app.iava.ai/)
2. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
3. Open DevTools Console (F12)
4. Look for build hash change in filename: `index-XXXXXXXX.js`

### Test 2: Symbol Detection Debug
1. Press `3` → AI Chat
2. Type: `analyze nvda` (lowercase)
3. **Expected Console Output**:
```
[detectSymbols] Input text: analyze nvda
[detectSymbols] Standalone pattern matched: ANALYZE isCommon: true
[detectSymbols] Standalone pattern matched: NVDA isCommon: false
[detectSymbols] Final result: Array(1) ["NVDA"]
```

4. **If you see `Array(0)`**: Symbol detection is still broken - report back

### Test 3: Infinite Loop Fix
1. Still in AI Chat, submit the message
2. **Expected Console Output**:
```
[App] Received symbol load request: NVDA null
[App] Ignoring duplicate symbol load request (debounced): NVDA  ← Should see this for subsequent requests
[AppChart] AI requesting symbol load: NVDA null
```

3. **If page freezes**: Infinite loop not fixed - report back

### Test 4: News API with Real Data
1. Press `6` → Market Sentiment
2. Click "🔄 Refresh"
3. **Expected Console Output**:
```
[Sentiment] Fetched X news headlines for NVDA from source: alpaca
```

4. **If you see `source: sample_no_credentials`**:
   - Alpaca credentials are NOT configured in Vercel
   - Go to Vercel → Environment Variables
   - Add `ALPACA_KEY_ID` and `ALPACA_SECRET_KEY`
   - Redeploy

5. **If you see `source: alpaca`**: ✅ WORKING!
   - Headlines should be real/specific (not generic)
   - Should show dates, authors, URLs

### Test 5: Symbol Actually Loads
1. Go to AI Chat (Tab 3)
2. Chart should be on AAPL initially
3. Type: `load TSLA`
4. **Expected**:
   - Switches to Tab 1 (chart)
   - Chart loads TSLA data
   - Console shows: `[AI Chat] ✅ Symbol loaded successfully: TSLA`

5. **If timeout**: Symbol not loading - check AppChart.jsx event handler

---

## 🐛 TROUBLESHOOTING

### Symbol Detection Still Returns Empty Array
**Possible Causes**:
1. Old build cached in browser
   - Solution: Hard refresh (`Cmd+Shift+R`)
2. Deployment didn't include latest changes
   - Solution: Check git commit hash matches Vercel deployment
3. Vite build issue
   - Solution: `rm -rf dist node_modules && npm install && npm run build`

**Debug**:
- Look for `[detectSymbols] Input text:` in console
- If you DON'T see this log → Old code is running
- If you DO see it but no matches → Regex issue

### Infinite Loop Persists
**Possible Causes**:
1. React 18 Strict Mode mounting components twice
   - Normal in development, won't happen in production
2. Multiple event listeners registered
   - Check: Search console for duplicate `[App] Received` logs

**Debug**:
- Look for `[App] Ignoring duplicate symbol load request`
- If you DON'T see this → Debounce code not running
- If loop continues → Need different approach (direct function call instead of events)

### News Shows Sample Data
**Possible Causes**:
1. Alpaca credentials not set in Vercel
2. Alpaca API rate limit hit
3. Symbol has no news available

**Debug**:
- Check console for: `source: sample_no_credentials` vs `source: alpaca`
- If `sample_no_credentials` → Add keys to Vercel
- If `source: sample_fallback` → Alpaca API error (check Alpaca dashboard)
- If `source: alpaca` but headlines generic → Real API is working, just not much news

---

## 📊 BUILD INFO

- **Bundle Size**: 802.56 KB (202.85 KB gzipped)
- **Build Time**: ~3 seconds
- **Files Modified**:
  - `src/utils/aiEnhancements.js` (symbol detection debug)
  - `src/App.jsx` (debounce + forwarded flag)
  - `src/components/MarketSentiment.jsx` (source validation)
  - `api/news.js` (env variable names)

---

## ✅ SUCCESS CRITERIA

After deployment and testing, you should see:

1. ✅ Symbol detection: `[detectSymbols] Final result: Array(1) ["NVDA"]`
2. ✅ No infinite loop: Page responsive, debounce logs visible
3. ✅ Real news data: `source: alpaca` with specific headlines
4. ✅ Symbol loading: Chart switches symbols when requested

---

## 🚨 IF EVERYTHING STILL BROKEN

If after deployment, testing, and Vercel env variable configuration, things still don't work:

1. **Export console logs**: Right-click console → Save as → Send to me
2. **Check Vercel deployment logs**: Settings → Deployments → Click latest → View logs
3. **Check Vercel function logs**: Monitoring → Functions → Select `/api/news` → View errors
4. **Verify build hash**: Look at network tab, find `index-XXXXXXXX.js`, confirm hash changed

---

Generated: November 18, 2025
Build: iava.ai v0.1.3
