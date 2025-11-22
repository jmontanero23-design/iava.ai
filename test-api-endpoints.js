/**
 * Ultra Elite++ API Endpoint Test Suite
 *
 * Tests all critical endpoints to ensure:
 * - HuggingFace sentiment analysis works
 * - ElevenLabs voice synthesis works
 * - GPT-5 model selection works
 * - Copy trading validation works
 *
 * Run: node test-api-endpoints.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test configuration
const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const TEST_RESULTS = [];

/**
 * Test HuggingFace Sentiment Analysis
 */
async function testSentiment() {
  console.log(`\n${colors.cyan}🧠 Testing HuggingFace Sentiment Analysis...${colors.reset}`);

  const testCases = [
    { text: "NVDA stock is looking extremely bullish today! Great momentum!", expected: "positive" },
    { text: "The market crash is devastating portfolios everywhere", expected: "negative" },
    { text: "SPY is trading sideways with low volume", expected: "neutral" }
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${BASE_URL}/api/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testCase.text })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.fallback) {
        console.log(`${colors.yellow}⚠️  Sentiment API using fallback mode${colors.reset}`);
        console.log(`   Reason: ${result.reason || 'Unknown'}`);
        TEST_RESULTS.push({
          test: 'Sentiment Analysis',
          status: 'WARNING',
          message: 'Using fallback mode - check HUGGINGFACE_API_KEY'
        });
      } else {
        const match = result.sentiment === testCase.expected;
        console.log(`${match ? colors.green + '✅' : colors.red + '❌'} Text: "${testCase.text.substring(0, 50)}..."`);
        console.log(`   Sentiment: ${result.sentiment} (${result.confidence?.toFixed(2) || 'N/A'} confidence)`);
        console.log(`   Model: ${result.model || 'Unknown'}`);

        TEST_RESULTS.push({
          test: 'Sentiment: ' + testCase.expected,
          status: match ? 'PASS' : 'FAIL',
          details: result
        });
      }

    } catch (error) {
      console.log(`${colors.red}❌ Sentiment test failed: ${error.message}${colors.reset}`);
      TEST_RESULTS.push({
        test: 'Sentiment Analysis',
        status: 'FAIL',
        error: error.message
      });
    }
  }
}

/**
 * Test ElevenLabs TTS
 */
async function testTTS() {
  console.log(`\n${colors.magenta}🔊 Testing ElevenLabs Voice Synthesis...${colors.reset}`);

  const testText = "AVA AI trading assistant is now active. All systems operational.";

  try {
    const response = await fetch(`${BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testText })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.audio && result.audio.startsWith('data:audio/mpeg;base64,')) {
      const audioSize = (result.audio.length * 0.75 / 1024).toFixed(2); // Approximate size in KB
      console.log(`${colors.green}✅ TTS generated successfully${colors.reset}`);
      console.log(`   Voice ID: ${result.voiceId}`);
      console.log(`   Model: ${result.model}`);
      console.log(`   Audio size: ~${audioSize} KB`);
      console.log(`   Text length: ${result.length} characters`);

      TEST_RESULTS.push({
        test: 'ElevenLabs TTS',
        status: 'PASS',
        details: {
          voiceId: result.voiceId,
          model: result.model,
          audioSize: audioSize + ' KB'
        }
      });

      // Optional: Save audio file for manual testing
      const audioData = result.audio.replace('data:audio/mpeg;base64,', '');
      const audioBuffer = Buffer.from(audioData, 'base64');
      fs.writeFileSync('test-audio.mp3', audioBuffer);
      console.log(`   ${colors.cyan}Audio saved to test-audio.mp3 for playback testing${colors.reset}`);

    } else {
      throw new Error('Invalid audio response format');
    }

  } catch (error) {
    console.log(`${colors.red}❌ TTS test failed: ${error.message}${colors.reset}`);
    console.log(`   ${colors.yellow}Check ELEVENLABS_API_KEY configuration${colors.reset}`);
    TEST_RESULTS.push({
      test: 'ElevenLabs TTS',
      status: 'FAIL',
      error: error.message
    });
  }
}

/**
 * Test GPT-5 LLM Endpoint
 */
async function testLLM() {
  console.log(`\n${colors.blue}🤖 Testing GPT-5 Model Selection...${colors.reset}`);

  const testCases = [
    {
      feature: 'portfolio-optimization',
      prompt: 'Optimize my portfolio for maximum Sharpe ratio',
      expectedModel: 'gpt-5'
    },
    {
      feature: 'chart-patterns',
      prompt: 'Identify the chart pattern in this data',
      expectedModel: 'gpt-5-mini'
    },
    {
      feature: 'sentiment-quick',
      prompt: 'Quick sentiment check on NVDA',
      expectedModel: 'gpt-5-nano'
    }
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${BASE_URL}/api/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testCase.prompt,
          feature: testCase.feature,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.fallback) {
        console.log(`${colors.yellow}⚠️  LLM using fallback mode${colors.reset}`);
        console.log(`   Check OPENAI_API_KEY configuration`);
        TEST_RESULTS.push({
          test: 'GPT-5 LLM',
          status: 'WARNING',
          message: 'Using fallback mode'
        });
      } else {
        const modelMatch = result.model === testCase.expectedModel;
        console.log(`${modelMatch ? colors.green + '✅' : colors.yellow + '⚠️ '} Feature: ${testCase.feature}`);
        console.log(`   Model: ${result.model} ${modelMatch ? '(correct)' : `(expected ${testCase.expectedModel})`}`);
        console.log(`   Cost: $${result.usage?.estimated_cost?.toFixed(6) || 'N/A'}`);
        console.log(`   Tokens: ${result.usage?.total_tokens || 'N/A'}`);

        TEST_RESULTS.push({
          test: `LLM: ${testCase.feature}`,
          status: modelMatch ? 'PASS' : 'WARNING',
          model: result.model,
          cost: result.usage?.estimated_cost
        });
      }

    } catch (error) {
      console.log(`${colors.red}❌ LLM test failed: ${error.message}${colors.reset}`);
      TEST_RESULTS.push({
        test: 'GPT-5 LLM',
        status: 'FAIL',
        error: error.message
      });
    }
  }
}

/**
 * Test Copy Trading Validation
 */
async function testCopyTrading() {
  console.log(`\n${colors.bright}💼 Testing Copy Trading Engine...${colors.reset}`);

  const testSignal = {
    strategyId: 'test-strategy-001',
    masterId: 'master-trader-001',
    signal: {
      symbol: 'NVDA',
      action: 'buy',
      orderType: 'market',
      quantity: 100,
      price: 850.00,
      stopLoss: 820.00,
      takeProfit: 900.00
    },
    metadata: {
      volatility: 'high',
      volume: 'above_average',
      trend: 'bullish'
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/api/copytrading/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSignal)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.aiValidation) {
      const aiApproved = result.aiValidation.score > 70;
      console.log(`${aiApproved ? colors.green + '✅' : colors.yellow + '⚠️ '} AI Validation Score: ${result.aiValidation.score}/100`);
      console.log(`   Confidence: ${result.aiValidation.confidence || 'N/A'}`);
      console.log(`   Execution: ${result.execution.successful}/${result.execution.total} trades executed`);

      TEST_RESULTS.push({
        test: 'Copy Trading Engine',
        status: 'PASS',
        aiScore: result.aiValidation.score,
        execution: result.execution
      });
    } else {
      console.log(`${colors.yellow}⚠️  Copy trading executed without AI validation${colors.reset}`);
      TEST_RESULTS.push({
        test: 'Copy Trading Engine',
        status: 'WARNING',
        message: 'No AI validation performed'
      });
    }

  } catch (error) {
    console.log(`${colors.red}❌ Copy trading test failed: ${error.message}${colors.reset}`);
    TEST_RESULTS.push({
      test: 'Copy Trading Engine',
      status: 'FAIL',
      error: error.message
    });
  }
}

/**
 * Display Test Summary
 */
function displaySummary() {
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}📊 TEST SUMMARY${colors.reset}`);
  console.log(`${'='.repeat(60)}`);

  const passed = TEST_RESULTS.filter(r => r.status === 'PASS').length;
  const failed = TEST_RESULTS.filter(r => r.status === 'FAIL').length;
  const warnings = TEST_RESULTS.filter(r => r.status === 'WARNING').length;

  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);

  // Save detailed results
  const resultsFile = 'test-results.json';
  fs.writeFileSync(resultsFile, JSON.stringify(TEST_RESULTS, null, 2));
  console.log(`\n${colors.cyan}Detailed results saved to ${resultsFile}${colors.reset}`);

  // Environment check
  console.log(`\n${colors.bright}🔧 ENVIRONMENT CHECK${colors.reset}`);
  console.log(`${'='.repeat(60)}`);

  const envVars = [
    { name: 'OPENAI_API_KEY', exists: !!process.env.OPENAI_API_KEY, critical: true },
    { name: 'HUGGINGFACE_API_KEY', exists: !!process.env.HUGGINGFACE_API_KEY, critical: false },
    { name: 'ELEVENLABS_API_KEY', exists: !!process.env.ELEVENLABS_API_KEY, critical: false },
    { name: 'REDIS_URL', exists: !!process.env.REDIS_URL, critical: false },
    { name: 'iava_DATABASE_URL', exists: !!process.env.iava_DATABASE_URL, critical: false },
    { name: 'ALPACA_KEY_ID', exists: !!process.env.ALPACA_KEY_ID, critical: true },
    { name: 'ALPACA_SECRET_KEY', exists: !!process.env.ALPACA_SECRET_KEY, critical: true },
  ];

  envVars.forEach(env => {
    const icon = env.exists ? colors.green + '✅' : (env.critical ? colors.red + '❌' : colors.yellow + '⚠️ ');
    const value = env.exists ? 'Configured' : (env.critical ? 'MISSING (Required!)' : 'Not configured');
    console.log(`${icon} ${env.name}: ${value}${colors.reset}`);
  });

  // Recommendations
  if (failed > 0 || warnings > 0) {
    console.log(`\n${colors.bright}💡 RECOMMENDATIONS${colors.reset}`);
    console.log(`${'='.repeat(60)}`);

    if (!process.env.HUGGINGFACE_API_KEY) {
      console.log(`${colors.yellow}• Add HUGGINGFACE_API_KEY for real-time sentiment analysis${colors.reset}`);
      console.log(`  Get your key from: https://huggingface.co/settings/tokens`);
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.log(`${colors.yellow}• Add ELEVENLABS_API_KEY for premium voice synthesis${colors.reset}`);
      console.log(`  Get your key from: https://elevenlabs.io/api`);
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log(`${colors.red}• Add OPENAI_API_KEY for GPT-5 models (CRITICAL!)${colors.reset}`);
      console.log(`  Get your key from: https://platform.openai.com/api-keys`);
    }

    console.log(`\n${colors.cyan}Run 'npm run test:api' after adding missing keys${colors.reset}`);
  } else {
    console.log(`\n${colors.bright}${colors.green}🎯 ALL TESTS PASSED! Your Ultra Elite++ setup is complete!${colors.reset}`);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}🚀 ULTRA ELITE++ API ENDPOINT TEST SUITE${colors.reset}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // Check if running locally or against production
  if (BASE_URL.includes('localhost')) {
    console.log(`${colors.yellow}⚠️  Testing local environment${colors.reset}`);
    console.log(`   Make sure your dev server is running: npm run dev`);
  } else {
    console.log(`${colors.green}✅ Testing production/preview deployment${colors.reset}`);
  }

  try {
    await testSentiment();
    await testTTS();
    await testLLM();
    await testCopyTrading();
  } catch (error) {
    console.error(`${colors.red}Fatal error during testing: ${error.message}${colors.reset}`);
  } finally {
    displaySummary();
  }
}

// Run tests
runTests().catch(console.error);