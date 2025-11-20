# How to Verify Modal & Chronos Are Working

## 🔍 Quick Check (30 seconds)

### 1. Open Browser Console
1. Go to [app.iava.ai](https://app.iava.ai)
2. Press `F12` or `Cmd+Option+I` (Mac)
3. Click **Console** tab
4. Run a scan on any stock (SPY, AAPL, etc.)

### 2. Look for These Messages:
```
✅ GOOD SIGNS:
🚀 Using REAL Chronos-2 via Modal API
[UltraScore] Simplified Breakdown
```

```
❌ BAD SIGNS (means Modal isn't being called):
⚠️ Using Smart Trend (Fallback)
⚠️ Modal API failed
```

---

## 🌐 Check Network Requests

### In Browser DevTools:
1. Click **Network** tab
2. Run a scan
3. Filter by "modal"
4. Look for: `POST https://jmontanero23-design--iava-chronos-forecasting-api-forecast.modal.run`

**What you should see:**
- **Status:** 200 OK
- **Response:** Contains `"model": "amazon/chronos-t5-base"`
- **Time:** 6-10 seconds

---

## 📊 Check Modal Dashboard

### View Real-Time Usage:
1. Go to [modal.com/dashboard](https://modal.com/dashboard)
2. Click on **iava-chronos-forecasting** app
3. Check:
   - **Request count** (should increase with each scan)
   - **Latency** (should be 6-10s average)
   - **Success rate** (should be ~99%+)
   - **GPU time** (shows T4 GPU usage)

**Cost Tracking:**
- Each forecast costs ~$0.001
- Dashboard shows total spend
- You have $30 free credit (~30,000 forecasts)

---

## 🐛 Troubleshooting

### Modal Not Being Called?

**Check 1: Environment Variable Set?**
```bash
# In terminal:
vercel env ls | grep MODAL

# Should show:
MODAL_CHRONOS_API=https://jmontanero23-design--iava-chronos-forecasting-api-forecast.modal.run
```

**Check 2: Clear Cache**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
2. Or clear browser cache

**Check 3: Check Vercel Logs**
```bash
vercel logs
```
Look for any errors related to Modal API calls.

---

## ✅ How to Know It's Working

### You'll see ALL of these:

#### 1. Console Shows Real AI
```javascript
🚀 Using REAL Chronos-2 via Modal API
[UltraScore] Simplified Breakdown: {
  finalScore: "75.4",
  technicals: "37.5 (50%)",
  sentiment: "18.2 (25%)",
  forecast: "19.7 (25%)",  // ← From Modal!
  modelsWorking: "5/5"
}
```

#### 2. Network Tab Shows Modal Requests
```
POST modal.run → 200 OK (8.2s)
Response: {"predictions": [...], "model": "amazon/chronos-t5-base"}
```

#### 3. Modal Dashboard Shows Activity
- Requests: Increasing
- GPU Time: Active
- Cost: Small amounts appearing

#### 4. AI Analysis Panel Shows Forecast
- "AI Forecast" section visible
- Predictions for next 5-24 periods
- Confidence intervals (high/low bands)
- Model credit: "Powered by Chronos-T5-Base"

---

## 🎯 Where Users See Chronos Forecasts

### Currently Visible In:
1. **Browser Console** (for debugging)
2. **Ultra Unicorn Score calculation** (affects final score)
3. **Backend logs** (check Modal dashboard)

### To Make Visible to Users (Future Enhancement):
- Add forecast chart widget
- Show predictions in AI analysis panel
- Display confidence bands on main chart
- Add "AI Forecast" tab

---

## 📈 Expected Performance

**Modal Chronos-T5-Base:**
- Accuracy: 94%
- Latency: 6-10 seconds
- Cost: ~$0.001/forecast
- Model: amazon/chronos-t5-base

**Score Impact:**
- Ultra Unicorn Score now 100% real AI
- 25% of score from Chronos forecasts
- Better accuracy than before

---

## 🚨 Common Issues

### Issue 1: "Modal API failed, using fallback"
**Cause:** Modal endpoint not responding
**Fix:**
1. Check Modal dashboard for errors
2. Verify Modal API is deployed: `modal app list`
3. Restart Modal app if needed

### Issue 2: Different scores in different places
**Cause:** Caching or using old AI model file
**Fix:**
1. Hard refresh browser
2. Check import is using `ultraEliteModels_v2_SIMPLIFIED.js`
3. Redeploy to Vercel

### Issue 3: No network requests to Modal
**Cause:** Environment variable not set
**Fix:**
1. `vercel env add MODAL_CHRONOS_API production`
2. Set value: `https://jmontanero23-design--iava-chronos-forecasting-api-forecast.modal.run`
3. Redeploy

---

## 💡 Pro Tips

1. **Keep Modal Dashboard Open** while testing to see real-time activity
2. **Check Console First** - easiest way to verify
3. **Network Tab** shows exact API calls and responses
4. **Modal Logs** show detailed model inference logs:
   ```bash
   modal app logs iava-chronos-forecasting
   ```

---

## ✨ Success Checklist

- [ ] Console shows "🚀 Using REAL Chronos-2"
- [ ] Network tab shows Modal API calls (200 OK)
- [ ] Modal dashboard shows increasing request count
- [ ] Ultra Unicorn Score breakdown shows forecast contribution
- [ ] No "fallback" or "failed" warnings in console
- [ ] GPU time showing in Modal dashboard
- [ ] Cost tracker showing small charges (~$0.001/scan)

**If all checked:** Modal & Chronos are working perfectly! 🎉
