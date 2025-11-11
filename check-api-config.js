#!/usr/bin/env node

/**
 * API Configuration Checker
 * Tests if all required API keys are configured and working
 */

// Get URL from command line argument or use default
const urlArg = process.argv[2];
const BASE_URL = urlArg ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

if (!BASE_URL) {
  console.log('❌ No URL provided!\n');
  console.log('Usage: node check-api-config.js <your-vercel-url>');
  console.log('Example: node check-api-config.js https://iava-ai.vercel.app\n');
  process.exit(1);
}

console.log('🔍 iAVA.ai API Configuration Checker\n');
console.log(`Testing against: ${BASE_URL}\n`);
console.log('=' .repeat(60));

async function checkHealth() {
  console.log('\n📊 Checking /api/health endpoint...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();

    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('\n' + '─'.repeat(60));

    // Analyze results
    console.log('\n📋 CONFIGURATION STATUS:\n');

    // Alpaca Keys
    if (data.api?.hasKeys) {
      console.log('✅ Alpaca API Keys: CONFIGURED');
    } else {
      console.log('❌ Alpaca API Keys: MISSING');
      console.log('   → Add ALPACA_KEY_ID and ALPACA_SECRET_KEY to Vercel env vars');
    }

    // Alpaca Connection
    if (data.api?.alpacaAccount) {
      console.log('✅ Alpaca Connection: WORKING');
    } else {
      console.log('❌ Alpaca Connection: FAILED');
      console.log('   → Keys might be invalid or expired');
    }

    // LLM Configuration
    const llm = data.api?.llm;
    if (llm?.configured) {
      console.log(`✅ AI Provider (${llm.provider}): CONFIGURED`);
      if (llm.models?.explain) {
        console.log(`   Model: ${llm.models.explain}`);
      }
    } else {
      console.log('⚠️  AI Provider: NOT CONFIGURED (optional)');
      console.log('   → Add OPENAI_API_KEY or ANTHROPIC_API_KEY for AI features');
    }

    // n8n
    const n8n = data.api?.n8n;
    if (n8n?.configured) {
      console.log('✅ n8n Webhooks: CONFIGURED');
    } else {
      console.log('⚠️  n8n Webhooks: NOT CONFIGURED (optional)');
    }

    console.log('\n' + '─'.repeat(60));

    return data;
  } catch (error) {
    console.error('❌ Failed to check health endpoint:', error.message);
    console.log('\n💡 This might mean:');
    console.log('   1. Server is not running');
    console.log('   2. Network connection issue');
    console.log('   3. Health endpoint has an error');
    return null;
  }
}

async function testAlpacaData() {
  console.log('\n📈 Testing Alpaca Data API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/alpaca/bars?symbol=AAPL&timeframe=1Min&limit=10`);
    const data = await response.json();

    if (response.ok && data.bars?.length > 0) {
      const lastBar = data.bars[data.bars.length - 1];
      console.log('✅ Alpaca Data API: WORKING');
      console.log(`   Symbol: ${data.symbol}`);
      console.log(`   Timeframe: ${data.timeframe}`);
      console.log(`   Bars received: ${data.bars.length}`);
      console.log(`   Last close: $${lastBar.close}`);
      console.log(`   Last update: ${new Date(lastBar.time * 1000).toLocaleString()}`);
      return true;
    } else if (response.status === 500) {
      console.log('❌ Alpaca Data API: FAILED');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      if (data.error?.includes('Missing')) {
        console.log('   → Add ALPACA_KEY_ID and ALPACA_SECRET_KEY to environment');
      }
      return false;
    } else if (response.status === 429) {
      console.log('⚠️  Alpaca Data API: RATE LIMITED');
      console.log('   → Wait a minute and try again');
      return false;
    } else {
      console.log('❌ Alpaca Data API: ERROR');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Alpaca Data API: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testAIFeatures(healthData) {
  console.log('\n🤖 Testing AI Features...\n');

  if (!healthData?.api?.llm?.configured) {
    console.log('⚠️  AI Features: NOT CONFIGURED (skipping test)');
    console.log('   → Add OPENAI_API_KEY or ANTHROPIC_API_KEY to enable');
    return false;
  }

  try {
    const testState = {
      score: 75,
      pivotNow: 'bullish',
      ichiRegime: 'bullish',
      components: { pivot: 30, ichimoku: 25, saty: 20 }
    };

    const response = await fetch(`${BASE_URL}/api/llm/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: testState, threshold: 70 })
    });

    const data = await response.json();

    if (response.ok && data.explanation) {
      console.log('✅ AI Explanations: WORKING');
      console.log(`   Provider: ${healthData.api.llm.provider}`);
      console.log(`   Confidence: ${(data.confidence * 100).toFixed(0)}%`);
      console.log(`   Explanation: "${data.explanation.substring(0, 80)}..."`);
      return true;
    } else {
      console.log('❌ AI Explanations: FAILED');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ AI Explanations: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testAccount() {
  console.log('\n💰 Testing Alpaca Account...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/alpaca/account`);
    const data = await response.json();

    if (response.ok && data.account_number) {
      console.log('✅ Alpaca Account: CONNECTED');
      console.log(`   Account: ${data.account_number}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Equity: $${parseFloat(data.equity || 0).toFixed(2)}`);
      console.log(`   Buying Power: $${parseFloat(data.buying_power || 0).toFixed(2)}`);
      return true;
    } else {
      console.log('❌ Alpaca Account: FAILED');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Alpaca Account: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const healthData = await checkHealth();

  if (!healthData) {
    console.log('\n❌ Cannot continue - health endpoint failed\n');
    process.exit(1);
  }

  const alpacaWorks = await testAlpacaData();
  await testAccount();
  await testAIFeatures(healthData);

  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 SUMMARY:\n');

  if (healthData.api?.hasKeys && alpacaWorks) {
    console.log('✅ Your app is FULLY CONFIGURED for trading!');
    console.log('\n📊 Working Features:');
    console.log('   • Live market data');
    console.log('   • Historical charts');
    console.log('   • All indicators');
    console.log('   • Paper trading');
    console.log('   • Backtesting');
    console.log('   • Scanner');
  } else if (healthData.api?.hasKeys && !alpacaWorks) {
    console.log('⚠️  Keys are configured but NOT working');
    console.log('\n🔧 Possible Issues:');
    console.log('   1. Keys might be expired or invalid');
    console.log('   2. Rate limited - wait 60 seconds');
    console.log('   3. Network/firewall issue');
    console.log('\n💡 Solution:');
    console.log('   • Check your Alpaca dashboard');
    console.log('   • Regenerate API keys (Paper Trading)');
    console.log('   • Update Vercel environment variables');
  } else {
    console.log('❌ Your app needs API configuration');
    console.log('\n🔑 Missing Configuration:');
    console.log('   1. ALPACA_KEY_ID');
    console.log('   2. ALPACA_SECRET_KEY');
    console.log('   3. ALPACA_ENV=paper');
    console.log('\n📝 Quick Setup:');
    console.log('   • Go to https://alpaca.markets');
    console.log('   • Generate Paper Trading API keys');
    console.log('   • Add to Vercel → Settings → Environment Variables');
    console.log('   • Redeploy');
  }

  if (healthData.api?.llm?.configured) {
    console.log('\n🤖 AI Features: ENABLED');
  } else {
    console.log('\n⚠️  AI Features: DISABLED (optional)');
    console.log('   • Add OPENAI_API_KEY to enable AI explanations, chat, etc.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📖 For detailed setup: See SETUP.md in your repo\n');
}

main().catch(console.error);
