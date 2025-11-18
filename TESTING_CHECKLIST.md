# 🧪 TESTING CHECKLIST - Verify What Actually Works
## One Feature at a Time

**Instructions**: Test each item below. Mark ✅ if it works, ❌ if broken.

---

## ✅ JUST FIXED (Test These First!)

### 1. AI Chat Symbol Loading
**Test Steps**:
1. Go to Tab 3 (AI Chat) by pressing `3`
2. Type: "analyze NVDA"
3. Hit Enter

**Expected Result**:
- ✅ Should auto-switch to Tab 1 (chart)
- ✅ Should load NVDA chart data
- ✅ AI should respond with NVDA analysis

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial

**If Broken, Note**: _______________________________________________

---

### 2. Real News API (Market Sentiment)
**Test Steps**:
1. Press `6` to go to Market Sentiment tab
2. Click "🔄 Refresh" button
3. Look at news headlines
4. Check console for "[News API] Fetched X real news items"

**Expected Result**:
- ✅ Should show real headlines (not generic "shows strong momentum")
- ✅ Console should say "source: alpaca"
- ✅ Headlines should be recent/relevant

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial

**If Broken, Note**: _______________________________________________

---

## 🔍 NEEDS TESTING (Existing Features)

### 3. Multi-Timeframe Panel
**Test Steps**:
1. Press `7` to go to Multi-TF Analysis tab
2. Wait for analysis to load
3. Check if all 5 timeframes show data (1Min, 5Min, 15Min, 1Hour, 1Day)
4. Click on "15Min" row to load that timeframe

**Expected Result**:
- ✅ Shows weighted score
- ✅ Shows consensus (bullish/bearish/mixed)
- ✅ Shows all 5 timeframe rows with scores
- ✅ Clicking timeframe switches to chart tab and loads it

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial

**If Broken, Note**: _______________________________________________

---

### 4. AI Chat Screenshot Upload
**Test Steps**:
1. Press `3` to go to AI Chat
2. Take a screenshot of NVDA chart (from another site/app)
3. Upload it to AI Chat using the upload button
4. Type: "analyze this chart"

**Expected Result**:
- ✅ Should recognize it's a chart image
- ✅ Should analyze the ticker/pattern
- ✅ Should provide relevant analysis

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial

**If Broken, Note**: _______________________________________________

---

### 5. AI Copilot Execute Button
**Test Steps**:
1. Go to Tab 1 (chart) - press `1`
2. Open a position (if you don't have one, skip this test)
3. Wait for AI Copilot to show an alert
4. Click "Execute" button if it appears

**Expected Result**:
- ✅ Should close the position
- ✅ Should show toast notification
- ✅ Orders panel should update

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial | [ ] ⏭️ Skipped (no position)

**If Broken, Note**: _______________________________________________

---

### 6. HuggingFace Sentiment (3-Model)
**Test Steps**:
1. Go to Market Sentiment (press `6`)
2. Click refresh
3. Expand one news headline (click "Show X model results")
4. Check if it shows 3 different models

**Expected Result**:
- ✅ Shows FinBERT, BERTweet, DistilBERT results
- ✅ Shows consensus badge
- ✅ Shows confidence scores

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial

**If Broken, Note**: _______________________________________________

---

### 7. Risk Controls Panel
**Test Steps**:
1. Go to AI Dashboard (press `2`)
2. Find and click "Risk Advisor" card
3. Check if risk metrics are shown
4. Try adjusting risk percentage

**Expected Result**:
- ✅ Shows risk metrics (VaR, exposure, etc.)
- ✅ Shows position sizing recommendations
- ✅ Controls are interactive

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial

**If Broken, Note**: _______________________________________________

---

### 8. Backtesting
**Test Steps**:
1. Go to chart (press `1`)
2. Scroll down to "Backtest & SATY" tab (Floor 3)
3. Click "Run Backtest" button
4. Wait for results

**Expected Result**:
- ✅ Shows win rate, profit factor, trades
- ✅ Shows equity curve
- ✅ Results make sense

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial

**If Broken, Note**: _______________________________________________

---

### 9. Scanner (Discover Tab)
**Test Steps**:
1. Go to chart (press `1`)
2. Scroll to Floor 3
3. Click "Discover (Scan & Watchlists)" tab
4. Try scanning for stocks with Unicorn Score > 75

**Expected Result**:
- ✅ Returns list of symbols
- ✅ Can click symbol to load it
- ✅ Shows scores

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial

**If Broken, Note**: _______________________________________________

---

### 10. Keyboard Shortcuts
**Test Steps**:
1. Press `1` → Should go to chart
2. Press `2` → Should go to AI Dashboard
3. Press `3` → Should go to AI Chat
4. Press `7` → Should go to Multi-TF
5. Press `Cmd/Ctrl + K` → Should open command palette

**Expected Result**:
- ✅ All number keys work (1-7)
- ✅ Command palette opens

**Status**: [ ] ✅ Works | [ ] ❌ Broken | [ ] ⚠️ Partial

**If Broken, Note**: _______________________________________________

---

## 📊 SUMMARY

**Total Features Tested**: _____ / 10

**Working**: _____ (%)
**Broken**: _____ (%)
**Partial**: _____ (%)

---

## 🚨 CRITICAL ISSUES FOUND

List any major broken features here:

1. ________________________________________________

2. ________________________________________________

3. ________________________________________________

4. ________________________________________________

5. ________________________________________________

---

## 💡 NEXT STEPS

Based on test results, prioritize fixes in this order:

**Priority 1 (Critical - Blocks Usage)**:
- [ ] ________________________________________________
- [ ] ________________________________________________

**Priority 2 (Important - Degrades UX)**:
- [ ] ________________________________________________
- [ ] ________________________________________________

**Priority 3 (Nice to Have - Polish)**:
- [ ] ________________________________________________
- [ ] ________________________________________________

---

## 📝 NOTES

Add any additional observations:

_______________________________________________________________

_______________________________________________________________

_______________________________________________________________

_______________________________________________________________
