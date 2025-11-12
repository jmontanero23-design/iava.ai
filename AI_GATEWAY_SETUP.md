# AI Gateway Setup Guide

This guide explains how to set up the AI Gateway for your iava.ai app using Vercel.

## Current Status

✅ **Mock Mode Active** - The app automatically falls back to mock AI responses when the backend is unavailable.
🔧 **Backend Needed** - To get real AI insights, you need to set up the AI Gateway backend.

---

## Option 1: Vercel AI Gateway (Recommended)

### Step 1: Create API Route Handler

Create the file: `/api/ai/gateway/route.js` (or `.ts` for TypeScript)

```javascript
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export async function POST(request) {
  try {
    const { model, messages, options } = await request.json()

    const startTime = Date.now()

    const completion = await openai.createChatCompletion({
      model: model || 'gpt-4o-mini',
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.max_tokens || 500,
    })

    const latency = Date.now() - startTime

    return Response.json({
      content: completion.data.choices[0]?.message?.content || '',
      usage: completion.data.usage,
      cost: calculateCost(completion.data.usage, model),
      latency,
      cached: false,
      model: model || 'gpt-4o-mini'
    })

  } catch (error) {
    console.error('AI Gateway error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Health check endpoint
  return Response.json({
    status: 'ok',
    timestamp: Date.now(),
    message: 'AI Gateway is running'
  })
}

function calculateCost(usage, model) {
  const rates = {
    'gpt-4o-mini': { prompt: 0.00015 / 1000, completion: 0.0006 / 1000 },
    'gpt-4o': { prompt: 0.005 / 1000, completion: 0.015 / 1000 },
    'gpt-3.5-turbo': { prompt: 0.0005 / 1000, completion: 0.0015 / 1000 }
  }

  const rate = rates[model] || rates['gpt-4o-mini']

  return (usage.prompt_tokens * rate.prompt) +
         (usage.completion_tokens * rate.completion)
}
```

### Step 2: Set Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add:
   - `OPENAI_API_KEY` = your OpenAI API key

### Step 3: Deploy

```bash
git add api/ai/gateway/route.js
git commit -m "Add AI Gateway endpoint"
git push
```

Vercel will automatically deploy your changes.

---

## Option 2: Vercel AI SDK (Modern Approach)

### Step 1: Install Vercel AI SDK

```bash
npm install ai @ai-sdk/openai
```

### Step 2: Create API Route

Create `/api/ai/gateway/route.ts`:

```typescript
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages, model, options } = await req.json()

  const result = await streamText({
    model: openai(model || 'gpt-4o-mini'),
    messages,
    temperature: options?.temperature || 0.7,
    maxTokens: options?.max_tokens || 500,
  })

  // Convert to expected format
  const text = await result.text

  return Response.json({
    content: text,
    usage: result.usage,
    cost: calculateCost(result.usage, model),
    latency: result.latency,
    model: model || 'gpt-4o-mini'
  })
}
```

### Step 3: Set Environment Variables

```bash
OPENAI_API_KEY=sk-...
```

---

## Option 3: Custom Backend (Advanced)

If you're running a custom backend:

### Step 1: Create Express/Node.js Server

```javascript
const express = require('express')
const OpenAI = require('openai')
const app = express()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.use(express.json())

app.post('/api/ai/gateway', async (req, res) => {
  try {
    const { model, messages, options } = req.body
    const startTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.max_tokens || 500
    })

    res.json({
      content: completion.choices[0]?.message?.content || '',
      usage: completion.usage,
      cost: calculateCost(completion.usage, model),
      latency: Date.now() - startTime,
      cached: false,
      model: model || 'gpt-4o-mini'
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(3001, () => {
  console.log('AI Gateway running on port 3001')
})
```

### Step 2: Proxy Configuration

In your `vite.config.js`:

```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
}
```

---

## Testing the Setup

### 1. Check Backend Health

```bash
curl http://localhost:5173/api/ai/gateway
# or for production:
curl https://your-app.vercel.app/api/ai/gateway
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "message": "AI Gateway is running"
}
```

### 2. Test AI Chat

1. Open your app
2. Go to "AI Chat" feature
3. Send a message
4. You should see a real AI response (not mock)

### 3. Check Console

No more timeout errors! You should see:
```
[AI Gateway] Using real backend
```

Instead of:
```
[AI Gateway] Backend unavailable, using mock mode
```

---

## Troubleshooting

### Still Seeing Timeouts?

**Check:**
1. Environment variable is set correctly in Vercel
2. API route file exists at `/api/ai/gateway/route.js`
3. Deploy completed successfully
4. No 500 errors in Vercel logs

### 401 Authentication Error?

**Fix:**
- Verify OpenAI API key is valid
- Check environment variable name matches (`OPENAI_API_KEY`)
- Redeploy after adding environment variables

### Mock Mode Still Active?

**Solutions:**
1. Hard refresh the page (Ctrl+Shift+R)
2. Clear browser cache
3. Check Network tab - is `/api/ai/gateway` returning 200?
4. Wait 60 seconds (backend availability is cached)

---

## Cost Estimation

**Average Costs per Request:**

| Feature | Model | Tokens | Cost/Request |
|---------|-------|--------|--------------|
| AI Chat | gpt-4o-mini | ~300 | $0.00018 |
| Signal Analysis | gpt-4o-mini | ~200 | $0.00012 |
| Watchlist Suggestions | gpt-4o-mini | ~400 | $0.00024 |
| NLP Scanner | gpt-4o-mini | ~150 | $0.00009 |

**Monthly Estimates:**
- Light usage (10 requests/day): ~$0.50/month
- Medium usage (50 requests/day): ~$2.50/month
- Heavy usage (200 requests/day): ~$10/month

---

## Alternative: Use Anthropic Claude

Replace OpenAI with Claude in your backend:

```javascript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const message = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 500,
  messages: messages
})
```

Set `ANTHROPIC_API_KEY` instead of `OPENAI_API_KEY`.

---

## Next Steps

1. ✅ Choose your setup method (Vercel AI Gateway recommended)
2. ✅ Add API key to environment variables
3. ✅ Create the API route file
4. ✅ Deploy to Vercel
5. ✅ Test in your app - no more mock mode!

**Need help?** Check Vercel docs: https://vercel.com/docs/functions/serverless-functions
