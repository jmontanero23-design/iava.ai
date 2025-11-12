# iAVA.ai Production Deployment Guide

## Prerequisites

- Vercel account (free tier works)
- GitHub repository connected
- API keys ready (OpenAI, Anthropic, Alpaca)

## Deployment Steps

### 1. Vercel Configuration

Create `vercel.json` (already exists):
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. Environment Variables

Set these in Vercel Project Settings → Environment Variables:

**Required**:
```env
# AI Providers (choose at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Trading API
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
ALPACA_PAPER=true

# LLM Configuration
LLM_PROVIDER=openai
LLM_MODEL_EXPLAIN=gpt-5
LLM_MODEL_TUNE=gpt-5
```

**Optional**:
```env
# Vector Database (Pinecone)
PINECONE_API_KEY=your_key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=iava-signals

# Custom Configuration
NODE_ENV=production
VITE_API_BASE_URL=https://your-domain.vercel.app
```

### 3. Build & Deploy

**Option A: Auto-deploy from GitHub**
```bash
# Push to main branch
git push origin main

# Vercel will automatically deploy
```

**Option B: Manual deploy via CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### 4. Custom Domain (Optional)

1. Go to Vercel Project → Settings → Domains
2. Add your custom domain (e.g., `app.iava.ai`)
3. Update DNS records as instructed
4. SSL certificate automatically provisioned

### 5. Performance Optimization

**Already implemented:**
- ✅ Vite build optimization
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Service worker caching
- ✅ Image optimization (sharp)
- ✅ AI response caching (5min TTL)

**Additional recommendations:**
```javascript
// vite.config.js - Already optimized
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['lightweight-charts']
        }
      }
    }
  }
})
```

### 6. Monitoring & Analytics

**Built-in monitoring:**
- AI Gateway metrics at `/api/ai/gateway` (GET)
- Model Monitoring dashboard component
- Service Worker logging

**Recommended additions:**
```bash
# Vercel Analytics
npm i @vercel/analytics
```

```javascript
// src/main.jsx
import { inject } from '@vercel/analytics'
inject()
```

### 7. Security Checklist

- ✅ API keys in environment variables (not committed)
- ✅ CORS headers configured in API routes
- ✅ Rate limiting on AI Gateway (100 req/min)
- ✅ Input validation on all API endpoints
- ✅ HTTPS enforced (Vercel default)
- ⚠️ Add authentication if making public

### 8. Post-Deployment Testing

**Automated tests:**
```bash
# Build test
npm run build

# Preview build
npm run preview
```

**Manual QA checklist:**
- [ ] PWA installation works
- [ ] Service worker caches assets
- [ ] AI features respond correctly
- [ ] Market data loads
- [ ] Mobile responsive on iPhone/Android
- [ ] Works offline (cached data)
- [ ] Cross-browser (Chrome, Safari, Firefox)

### 9. Continuous Integration

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 10. Rollback Strategy

**Via Vercel Dashboard:**
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

**Via CLI:**
```bash
vercel rollback
```

## Performance Targets

- **Initial Load**: < 3s
- **Time to Interactive**: < 5s
- **Lighthouse Score**: > 90
- **PWA Installable**: Yes
- **Offline Capable**: Yes

## Cost Estimates

**Vercel (free tier):**
- 100GB bandwidth/month
- 100 serverless function invocations/day
- Plenty for MVP

**AI APIs (monthly estimates):**
- Signal Quality: ~$1-2 (cached heavily)
- Predictive Confidence: ~$2-3
- AI Chat: ~$5-10 (depends on usage)
- **Total**: ~$10-15/month for moderate use

## Troubleshooting

**Build fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

**API routes 404:**
- Ensure `vercel.json` rewrites are configured
- Check function files are in `/api` directory
- Verify `export default` in API files

**Environment variables not working:**
- Rebuild after adding env vars
- Check variable names match code
- Verify they're set for Production environment

**Slow performance:**
- Check AI Gateway cache hit rate
- Enable Vercel Analytics for insights
- Review service worker cache strategy

## Support

- **Docs**: https://docs.claude.com/claude-code
- **Vercel Docs**: https://vercel.com/docs
- **Issues**: GitHub repository issues

## Next Steps After Deployment

1. Monitor metrics dashboard
2. Collect user feedback
3. Iterate on AI features
4. Add authentication if needed
5. Scale AI infrastructure as usage grows
