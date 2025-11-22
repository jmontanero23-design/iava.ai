#!/bin/bash

echo "🚀 Adding missing environment variables to Vercel..."

# GPT-5 Model Tiers
echo "Adding LLM_MODEL_COMPLEX..."
echo "gpt-5" | vercel env add LLM_MODEL_COMPLEX production
echo "gpt-5" | vercel env add LLM_MODEL_COMPLEX preview
echo "gpt-5" | vercel env add LLM_MODEL_COMPLEX development

echo "Adding LLM_MODEL_MEDIUM..."
echo "gpt-5-mini" | vercel env add LLM_MODEL_MEDIUM production
echo "gpt-5-mini" | vercel env add LLM_MODEL_MEDIUM preview
echo "gpt-5-mini" | vercel env add LLM_MODEL_MEDIUM development

echo "Adding LLM_MODEL_SIMPLE..."
echo "gpt-5-nano" | vercel env add LLM_MODEL_SIMPLE production
echo "gpt-5-nano" | vercel env add LLM_MODEL_SIMPLE preview
echo "gpt-5-nano" | vercel env add LLM_MODEL_SIMPLE development

# Elite Features
echo "Adding ENABLE_COPY_TRADING..."
echo "true" | vercel env add ENABLE_COPY_TRADING production
echo "true" | vercel env add ENABLE_COPY_TRADING preview
echo "true" | vercel env add ENABLE_COPY_TRADING development

echo "Adding ENABLE_ACHIEVEMENTS..."
echo "true" | vercel env add ENABLE_ACHIEVEMENTS production
echo "true" | vercel env add ENABLE_ACHIEVEMENTS preview
echo "true" | vercel env add ENABLE_ACHIEVEMENTS development

echo "Adding ENABLE_VOICE_SYNTHESIS..."
echo "true" | vercel env add ENABLE_VOICE_SYNTHESIS production
echo "true" | vercel env add ENABLE_VOICE_SYNTHESIS preview
echo "true" | vercel env add ENABLE_VOICE_SYNTHESIS development

# Scanner Configuration
echo "Adding SCAN_SYMBOLS..."
echo "SPY,QQQ,AAPL,MSFT,NVDA,TSLA,AMZN,META,GOOGL,NFLX,AMD,SMCI,AVGO,COST,JPM,UNH,XOM" | vercel env add SCAN_SYMBOLS production
echo "SPY,QQQ,AAPL,MSFT,NVDA,TSLA,AMZN,META,GOOGL,NFLX,AMD,SMCI,AVGO,COST,JPM,UNH,XOM" | vercel env add SCAN_SYMBOLS preview
echo "SPY,QQQ,AAPL,MSFT,NVDA,TSLA,AMZN,META,GOOGL,NFLX,AMD,SMCI,AVGO,COST,JPM,UNH,XOM" | vercel env add SCAN_SYMBOLS development

echo "Adding CRYPTO_SYMBOLS..."
echo "BTC/USD,ETH/USD,SOL/USD,AVAX/USD,DOGE/USD,ADA/USD,MATIC/USD,XRP/USD" | vercel env add CRYPTO_SYMBOLS production
echo "BTC/USD,ETH/USD,SOL/USD,AVAX/USD,DOGE/USD,ADA/USD,MATIC/USD,XRP/USD" | vercel env add CRYPTO_SYMBOLS preview
echo "BTC/USD,ETH/USD,SOL/USD,AVAX/USD,DOGE/USD,ADA/USD,MATIC/USD,XRP/USD" | vercel env add CRYPTO_SYMBOLS development

# Feature Flags
echo "Adding N8N_ENABLED..."
echo "false" | vercel env add N8N_ENABLED production
echo "false" | vercel env add N8N_ENABLED preview
echo "false" | vercel env add N8N_ENABLED development

echo "Adding VITE_SHOW_RATE_BANNER..."
echo "false" | vercel env add VITE_SHOW_RATE_BANNER production
echo "false" | vercel env add VITE_SHOW_RATE_BANNER preview
echo "false" | vercel env add VITE_SHOW_RATE_BANNER development

# Add Modal Chronos to preview and development (already in production)
echo "Adding MODAL_CHRONOS_API to preview and development..."
echo "https://jmontanero23-design--iava-chronos-forecasting-api-forecast.modal.run" | vercel env add MODAL_CHRONOS_API preview
echo "https://jmontanero23-design--iava-chronos-forecasting-api-forecast.modal.run" | vercel env add MODAL_CHRONOS_API development

# Add order rules to preview and development (some only in production)
echo "Adding ORDER_RULE_MARKET_OPEN_REQUIRED to preview and development..."
echo "true" | vercel env add ORDER_RULE_MARKET_OPEN_REQUIRED preview
echo "true" | vercel env add ORDER_RULE_MARKET_OPEN_REQUIRED development

echo "Adding ORDER_RULE_MAX_POSITIONS to preview and development..."
echo "5" | vercel env add ORDER_RULE_MAX_POSITIONS preview
echo "5" | vercel env add ORDER_RULE_MAX_POSITIONS development

echo "Adding ORDER_RULE_MAX_RISK_PCT to preview and development..."
echo "2.0" | vercel env add ORDER_RULE_MAX_RISK_PCT preview
echo "2.0" | vercel env add ORDER_RULE_MAX_RISK_PCT development

echo "✅ All environment variables added to Vercel!"