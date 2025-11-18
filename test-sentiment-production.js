/**
 * Test Production Sentiment API
 * Tests the deployed /api/sentiment endpoint on Vercel
 */

const PRODUCTION_URL = 'https://iava-ai.vercel.app'

async function testSentiment() {
  console.log('🧪 Testing Production Sentiment API')
  console.log('=' .repeat(60))

  const testCases = [
    { text: 'Apple stock surges on strong earnings report', expected: 'positive' },
    { text: 'Market crashes as fears grow about recession', expected: 'negative' },
    { text: 'Trading volume remains steady', expected: 'neutral' }
  ]

  for (const testCase of testCases) {
    console.log(`\n📝 Test: "${testCase.text}"`)
    console.log(`   Expected: ${testCase.expected}`)

    try {
      const response = await fetch(`${PRODUCTION_URL}/api/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testCase.text,
          useMultiModel: false
        })
      })

      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`)
        continue
      }

      const data = await response.json()

      if (data.fallback) {
        console.log(`   ⚠️  FALLBACK DATA (API not working)`)
        console.log(`   Reason: ${data.reason || data.error || 'Unknown'}`)
      } else {
        console.log(`   ✅ SUCCESS!`)
        console.log(`   Sentiment: ${data.sentiment}`)
        console.log(`   Confidence: ${(data.confidence * 100).toFixed(1)}%`)
        console.log(`   Score: ${data.score?.toFixed(3)}`)
        console.log(`   Model: ${data.model}`)
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
}

testSentiment().catch(console.error)
