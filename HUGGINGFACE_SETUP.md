# HuggingFace API Setup - Enable Real PhD++ Sentiment Analysis

## Why You Need This

Currently, your Market Sentiment panel shows **GENERIC/FAKE** sentiment scores because there's no HuggingFace API key configured. The news headlines are REAL (from Alpaca), but the sentiment analysis returns neutral fallback data.

**With HuggingFace API key**:
- ✅ Real PhD++ 3-model ensemble sentiment analysis
- ✅ FinBERT (financial specialist) + BERTweet (social) + DistilBERT (general)
- ✅ Unique sentiment scores for each symbol based on actual news
- ✅ Confidence levels from real AI models (not hardcoded 50%)
- ✅ Strong positive/negative/mixed consensus detection

## Step 1: Get Your FREE HuggingFace API Key

1. Go to https://huggingface.co/join
2. Sign up for a FREE account (no credit card required)
3. After logging in, go to https://huggingface.co/settings/tokens
4. Click **"New token"**
5. Name it: `iava-sentiment`
6. Type: Select **"Read"** (that's all you need)
7. Click **"Generate token"**
8. **COPY the token** (starts with `hf_...`)

## Step 2: Add to Vercel Environment Variables

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: **iava.ai**
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add this variable:
   - **Name**: `HUGGINGFACE_API_KEY`
   - **Value**: `hf_xxxxxxxxxxxxxxxxxxxxx` (your token from Step 1)
   - **Environments**: Check all three (Production, Preview, Development)
6. Click **"Save"**

## Step 3: Redeploy

Option A - Automatic (recommended):
```bash
git push origin main
```
Vercel will auto-deploy with the new environment variable.

Option B - Manual:
- Go to your Vercel project
- Click **"Deployments"**
- Click **"Redeploy"** on the latest deployment

## Step 4: Verify It's Working

1. Open your app: https://iava-ai.vercel.app
2. Go to **Market Sentiment** panel
3. Click **"🔄 Refresh"**
4. Open browser console (F12)
5. Look for:
   ```
   [Sentiment] ✅ All items analyzed with REAL HuggingFace models!
   ```

6. Check the sentiment scores - they should now be DIFFERENT for each symbol!

**Before (fallback data)**:
```
[Sentiment] ⚠️ WARNING: 10/10 items using fallback data!
AAPL: 50/100 (neutral, 50% confidence)
NVDA: 50/100 (neutral, 50% confidence)
SPY: 50/100 (neutral, 50% confidence)
```

**After (REAL HuggingFace analysis)**:
```
[Sentiment] ✅ All items analyzed with REAL HuggingFace models!
AAPL: 78/100 (bullish, 89% confidence) - Strong positive consensus
NVDA: 42/100 (bearish, 76% confidence) - Mixed signals
SPY: 65/100 (bullish, 81% confidence) - Positive lean
```

## How the PhD++ Sentiment System Works

### 3-Model Ensemble (World-Class Accuracy)

1. **ProsusAI/finbert**
   - Financial news specialist
   - Trained on 10K+ financial articles
   - Best for: Earnings, market news, analyst reports

2. **finiteautomata/bertweet-base-sentiment-analysis**
   - Twitter/social media trained
   - Fast and efficient
   - Best for: Social sentiment, trending topics

3. **distilbert-base-uncased-finetuned-sst-2-english**
   - General sentiment (fallback)
   - Robust and reliable
   - Best for: Generic text analysis

### Consensus Calculation

- Each model analyzes the news headline
- Scores are weighted by confidence
- Final sentiment determined by consensus:
  - **Strong Positive**: All 3 models agree positive
  - **Positive**: Majority positive
  - **Mixed**: Models disagree
  - **Negative**: Majority negative
  - **Strong Negative**: All 3 models agree negative

### Real-Time Analysis

- Fetches 10 latest news headlines from Alpaca
- Analyzes each headline with all 3 models in parallel
- Calculates weighted average based on confidence
- Blends with technical sentiment (60% news, 40% technical)
- Updates every 5 minutes or on manual refresh

## Cost & Rate Limits

**HuggingFace Free Tier**:
- ✅ 30,000 requests/month FREE
- ✅ No credit card required
- ✅ More than enough for this app

**Your Usage**:
- 10 headlines × 3 models = 30 API calls per symbol
- With 5-minute refresh rate = ~8,640 calls/month
- Well within free tier limits!

## Troubleshooting

### Still seeing fallback data?

Check Vercel logs:
```bash
vercel logs
```

Look for:
```
[Sentiment API] HuggingFace API key not configured - returning neutral
```

If you see this, the environment variable didn't save correctly. Try:
1. Delete the variable in Vercel
2. Add it again
3. Redeploy

### Getting 503 errors?

```
[Sentiment API] Model loading, returning neutral sentiment
```

This is NORMAL on first use. HuggingFace models need ~30 seconds to "wake up". Wait a minute and refresh.

### Rate limit exceeded?

```
[Sentiment API] 🚨 RATE LIMIT EXCEEDED
```

You've hit the free tier limit. Upgrade to HuggingFace Pro ($9/month) for 100K requests/month, or reduce refresh frequency in the code.

## Elite Features Enabled

Once HuggingFace is configured, you get:

1. **Real-time news sentiment tracking**
   - See which headlines are bullish vs bearish
   - Track sentiment shifts over time
   - Identify contrarian opportunities

2. **Symbol-specific insights**
   - Different scores for each stock
   - Understand market perception
   - Spot divergences between news and price

3. **Multi-model confidence**
   - Know when models agree (high confidence)
   - Identify uncertain markets (low consensus)
   - Make better-informed decisions

4. **Actionable recommendations**
   - "High greed detected - watch for reversals"
   - "Extreme fear - potential contrarian opportunity"
   - "Bullish sentiment - favorable for longs"

---

## Questions?

Check the logs:
```bash
# Local development
npm run dev

# Production (Vercel)
vercel logs --follow
```

Look for these key messages:
- ✅ `[Sentiment] ✅ All items analyzed with REAL HuggingFace models!`
- ❌ `[Sentiment] ⚠️ WARNING: X/X items using fallback data!`

The system will tell you exactly what's happening!
