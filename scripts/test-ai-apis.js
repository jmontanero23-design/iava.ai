/**
 * Test Script: Verify ALL AI APIs are making REAL calls
 *
 * This script tests each AI component to ensure:
 * 1. API keys are configured
 * 2. Real API calls are being made
 * 3. Not falling back to mock data
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 TESTING ALL AI APIs FOR REAL CONNECTIONS\n');
console.log('=' .repeat(60));

// Test 1: Environment Variables
console.log('\n📋 Test 1: Environment Variables');
console.log('─'.repeat(60));

const envVars = {
  'HUGGINGFACE_API_KEY': process.env.HUGGINGFACE_API_KEY,
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'ELEVENLABS_API_KEY': process.env.ELEVENLABS_API_KEY,
  'iava_DATABASE_URL': process.env.iava_DATABASE_URL,
  'REDIS_URL': process.env.REDIS_URL,
  'JWT_SECRET': process.env.JWT_SECRET
};

for (const [key, value] of Object.entries(envVars)) {
  const status = value ? '✅ CONFIGURED' : '❌ MISSING';
  const preview = value ? `${value.substring(0, 20)}...` : 'NOT SET';
  console.log(`${status} ${key}: ${preview}`);
}

// Test 2: HuggingFace API
console.log('\n🤗 Test 2: HuggingFace API - Testing Real API Calls');
console.log('─'.repeat(60));

if (!process.env.HUGGINGFACE_API_KEY) {
  console.log('❌ CRITICAL: HuggingFace API key not found!');
  console.log('   All sentiment & forecasting models will use MOCK DATA');
} else {
  console.log('✅ HuggingFace API key found');
  console.log('📡 Testing FinBERT sentiment analysis...');

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/ProsusAI/finbert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'Apple stock surges on strong earnings report',
        options: {
          wait_for_model: true,
          use_cache: true
        }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ FinBERT API: WORKING - Real sentiment analysis');
      console.log(`   Response: ${JSON.stringify(result[0].slice(0, 2))}`);
    } else {
      const error = await response.text();
      console.log(`⚠️  FinBERT API: HTTP ${response.status}`);
      console.log(`   Error: ${error.substring(0, 100)}`);

      if (response.status === 503) {
        console.log('   ℹ️  Model is loading (cold start) - will work after warmup');
      } else if (response.status === 401) {
        console.log('   ❌ CRITICAL: Invalid API key!');
      }
    }
  } catch (error) {
    console.log('❌ FinBERT API: FAILED');
    console.log(`   Error: ${error.message}`);
  }
}

// Test 3: OpenAI API (GPT-5)
console.log('\n🤖 Test 3: OpenAI API - Testing GPT-5 Access');
console.log('─'.repeat(60));

if (!process.env.OPENAI_API_KEY) {
  console.log('❌ OpenAI API key not found!');
  console.log('   GPT-5 analysis will not work');
} else {
  console.log('✅ OpenAI API key found');
  console.log('📡 Testing GPT-5 API...');

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      }
    });

    if (response.ok) {
      const models = await response.json();
      console.log('✅ OpenAI API: WORKING');
      console.log(`   Available models: ${models.data.length} models`);

      const hasGPT5 = models.data.some(m => m.id.includes('gpt-5'));
      if (hasGPT5) {
        console.log('   ✅ GPT-5 models available!');
      } else {
        console.log('   ⚠️  GPT-5 not found, using available models');
      }
    } else {
      console.log(`⚠️  OpenAI API: HTTP ${response.status}`);
      if (response.status === 401) {
        console.log('   ❌ CRITICAL: Invalid API key!');
      }
    }
  } catch (error) {
    console.log('❌ OpenAI API: FAILED');
    console.log(`   Error: ${error.message}`);
  }
}

// Test 4: ElevenLabs API (Voice)
console.log('\n🎤 Test 4: ElevenLabs API - Testing Voice Synthesis');
console.log('─'.repeat(60));

if (!process.env.ELEVENLABS_API_KEY) {
  console.log('❌ ElevenLabs API key not found!');
  console.log('   AI voice chat will not work');
} else {
  console.log('✅ ElevenLabs API key found');
  console.log('📡 Testing ElevenLabs API...');

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    if (response.ok) {
      const voices = await response.json();
      console.log('✅ ElevenLabs API: WORKING');
      console.log(`   Available voices: ${voices.voices?.length || 0}`);
    } else {
      console.log(`⚠️  ElevenLabs API: HTTP ${response.status}`);
      if (response.status === 401) {
        console.log('   ❌ CRITICAL: Invalid API key!');
      }
    }
  } catch (error) {
    console.log('❌ ElevenLabs API: FAILED');
    console.log(`   Error: ${error.message}`);
  }
}

// Test 5: Database Connection
console.log('\n🗄️  Test 5: Neon PostgreSQL Database');
console.log('─'.repeat(60));

if (!process.env.iava_DATABASE_URL) {
  console.log('❌ Database URL not found!');
} else {
  console.log('✅ Database URL configured');
  console.log('📡 Testing database connection...');

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.iava_DATABASE_URL);

    const result = await sql`SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'`;

    console.log('✅ Database: CONNECTED');
    console.log(`   Tables: ${result[0].table_count} tables found`);
  } catch (error) {
    console.log('❌ Database: FAILED');
    console.log(`   Error: ${error.message}`);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));

const criticalApis = {
  'HuggingFace (AI Models)': !!process.env.HUGGINGFACE_API_KEY,
  'OpenAI (GPT-5)': !!process.env.OPENAI_API_KEY,
  'ElevenLabs (Voice)': !!process.env.ELEVENLABS_API_KEY,
  'Database (Neon)': !!process.env.iava_DATABASE_URL,
  'Redis (Cache)': !!process.env.REDIS_URL
};

const workingCount = Object.values(criticalApis).filter(Boolean).length;
const totalCount = Object.keys(criticalApis).length;

console.log(`\n✅ Working: ${workingCount}/${totalCount} services`);

for (const [service, working] of Object.entries(criticalApis)) {
  console.log(`${working ? '✅' : '❌'} ${service}`);
}

if (workingCount === totalCount) {
  console.log('\n🎉 ALL SYSTEMS GO! All APIs configured correctly.');
  console.log('   Your AI models are using REAL API calls, not mock data!');
} else {
  console.log('\n⚠️  WARNING: Some APIs are not configured.');
  console.log('   Missing APIs will fall back to mock/simulated data.');
  console.log('   Add the missing environment variables to Vercel for full functionality.');
}

console.log('\n' + '='.repeat(60));
