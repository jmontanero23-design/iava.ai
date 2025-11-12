# OpenAI API Key Setup Guide

## 🔴 URGENT: Your Current API Key is Invalid

Your OpenAI API key in Vercel is **not working**. This is why you're seeing "9/12 AI features, 3 need setup".

**Test result:**
```json
{
  "error": {
    "message": "Invalid authorization header",
    "type": "server_error"
  }
}
```

---

## ✅ Step-by-Step Fix

### **Step 1: Get a NEW OpenAI API Key**

1. Go to: **https://platform.openai.com/api-keys**
2. Log in with your OpenAI account
3. Click **"+ Create new secret key"** button
4. Give it a name: `iava-ai-production`
5. **IMPORTANT:** Copy the key immediately - you can only see it once!
6. It should look like: `sk-proj-abcdef123456...` (starts with `sk-proj-` or `sk-`)

**Cost Info:**
- You need billing set up in OpenAI
- GPT-5 costs: $10/1M input tokens, $30/1M output tokens
- Typical usage: $1-5/month for light use
- You can set spending limits in OpenAI dashboard

---

### **Step 2: Update Vercel Environment Variables**

1. Go to: **https://vercel.com/dashboard**
2. Select your **iava-ai** project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Find `OPENAI_API_KEY` in the list
6. Click the **three dots (...)** → **Edit**
7. **Paste your NEW API key** (replace the old one)
8. Make sure it's enabled for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
9. Click **Save**

---

### **Step 3: Redeploy Your App**

**Option A: Trigger Redeploy from Vercel Dashboard**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **three dots (...)** → **Redeploy**
4. Click **Redeploy** again to confirm

**Option B: Push a Small Change to GitHub**
1. Make any small edit (add a space to a comment)
2. Commit and push to main branch
3. Vercel will auto-deploy

---

### **Step 4: Verify It Works**

After redeployment (takes ~2 minutes):

1. Open your app: **https://iava-ai.vercel.app**
2. Look at the **AI Features badge** (top right)
3. It should now show: **12/12 AI Features** ✅
4. The badge will turn **GREEN** with no warnings
5. Hover over it to see "All Features Active"

**Test AI Chat:**
1. Click the **AI Chat** tab
2. Send a test message: "What is the Unicorn Score?"
3. You should get a real AI response (not a mock/error)

**Test NLP Scanner:**
1. Click **NLP Scanner** tab
2. Try: "Show me stocks with bullish momentum above 70"
3. Should work without errors

---

## 🔍 Troubleshooting

### **Still showing 9/12 after setup?**

**Problem:** Badge is cached or deployment didn't update env vars

**Fix:**
1. Hard refresh browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Check Vercel deployment logs for errors
3. Verify env var is saved in **all environments** (Production, Preview, Development)
4. Wait 60 seconds for backend health check to refresh

---

### **Getting "Rate Limit" errors?**

**Problem:** Free tier OpenAI account has low limits

**Fix:**
1. Add payment method to OpenAI account: https://platform.openai.com/account/billing
2. Set usage limits to avoid surprise charges
3. Start with $5-10 credit

---

### **Getting "Insufficient Quota" errors?**

**Problem:** No credits remaining in OpenAI account

**Fix:**
1. Add credits: https://platform.openai.com/account/billing
2. Check current usage: https://platform.openai.com/usage

---

## 📊 What Gets Fixed

Once the API key is valid, these 3 features will activate:

| Feature | What It Does | Location |
|---------|-------------|----------|
| **AI Chat** | Ask questions about indicators, strategies, market analysis | AI Chat tab |
| **NLP Scanner** | Search stocks using plain English queries | NLP Scanner tab |
| **Smart Watchlist** | AI-powered stock recommendations based on your style | Watchlist Builder |

The other 9 features work WITHOUT an API key (client-side calculations).

---

## 🚨 Security Best Practices

1. ❌ **NEVER commit API keys to GitHub**
   - Keys in `.env` are gitignored (safe)
   - Keys in Vercel are encrypted (safe)

2. ✅ **Use environment variables only**
   - Set in Vercel dashboard
   - NOT in your code

3. ✅ **Set spending limits in OpenAI**
   - Dashboard → Usage limits
   - Start with $10/month cap

4. ✅ **Rotate keys periodically**
   - Generate new key every 3-6 months
   - Delete old keys from OpenAI dashboard

---

## 💡 Tips

- **Monitor costs:** Check https://platform.openai.com/usage weekly
- **Start small:** Set $5/month limit to test
- **Optimize:** Use gpt-4o-mini for simple tasks (cheaper)
- **Cache:** The app caches AI responses to save money

---

## Need Help?

If you're still having issues:

1. **Check Vercel Logs:**
   - Vercel Dashboard → Functions → View Logs
   - Look for errors mentioning "OpenAI" or "API key"

2. **Test API Key Manually:**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY_HERE"
   ```
   Should return a list of models (not an error)

3. **Verify Environment:**
   - Vercel Settings → Environment Variables
   - Make sure `OPENAI_API_KEY` exists
   - Make sure it starts with `sk-proj-` or `sk-`

---

**Once your API key is valid and deployed, you'll have ALL 12 AI features running with GPT-5 🚀**
