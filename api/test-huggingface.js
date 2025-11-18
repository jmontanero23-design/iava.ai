/**
 * Test HuggingFace API Key & Models
 *
 * Visit: /api/test-huggingface
 *
 * This endpoint tests:
 * 1. If HUGGINGFACE_API_KEY is loaded
 * 2. If the API key is valid
 * 3. If models are accessible
 * 4. If sentiment analysis actually works
 */

export default async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  // Test 1: Check if API key exists
  const apiKey = process.env.HUGGINGFACE_API_KEY
  results.tests.push({
    name: 'API Key Exists',
    status: !!apiKey ? 'PASS' : 'FAIL',
    details: apiKey ? `Key starts with: ${apiKey.substring(0, 6)}...` : 'No API key found'
  })

  if (!apiKey) {
    return res.status(200).json(results)
  }

  // Test 2: Try to call HuggingFace API with FinBERT
  try {
    const testText = "Apple stock surges on strong earnings report"
    const model = 'ProsusAI/finbert'

    console.log('[HF Test] Testing model:', model)
    console.log('[HF Test] Test text:', testText)

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: testText,
          options: { wait_for_model: true }
        }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      }
    )

    console.log('[HF Test] Response status:', response.status)

    if (response.status === 503) {
      const errorText = await response.text()
      results.tests.push({
        name: 'HuggingFace API Call (FinBERT)',
        status: 'LOADING',
        details: 'Model is loading - wait 30-60 seconds and refresh',
        error: errorText
      })
    } else if (!response.ok) {
      const errorText = await response.text()
      console.error('[HF Test] Error:', errorText)
      results.tests.push({
        name: 'HuggingFace API Call (FinBERT)',
        status: 'FAIL',
        details: `API returned ${response.status}`,
        error: errorText
      })
    } else {
      const data = await response.json()
      console.log('[HF Test] Success! Data:', JSON.stringify(data))

      results.tests.push({
        name: 'HuggingFace API Call (FinBERT)',
        status: 'PASS',
        details: 'Model responded successfully',
        response: data
      })
    }
  } catch (error) {
    console.error('[HF Test] Exception:', error)
    results.tests.push({
      name: 'HuggingFace API Call (FinBERT)',
      status: 'FAIL',
      details: error.message,
      error: error.stack
    })
  }

  // Test 3: Try BERTweet (faster model)
  try {
    const testText = "This is great news for traders!"
    const model = 'finiteautomata/bertweet-base-sentiment-analysis'

    console.log('[HF Test] Testing model:', model)

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: testText,
          options: { wait_for_model: true }
        }),
        signal: AbortSignal.timeout(15000)
      }
    )

    if (response.status === 503) {
      const errorText = await response.text()
      results.tests.push({
        name: 'HuggingFace API Call (BERTweet)',
        status: 'LOADING',
        details: 'Model is loading',
        error: errorText
      })
    } else if (!response.ok) {
      const errorText = await response.text()
      results.tests.push({
        name: 'HuggingFace API Call (BERTweet)',
        status: 'FAIL',
        details: `API returned ${response.status}`,
        error: errorText
      })
    } else {
      const data = await response.json()
      results.tests.push({
        name: 'HuggingFace API Call (BERTweet)',
        status: 'PASS',
        details: 'Model responded successfully',
        response: data
      })
    }
  } catch (error) {
    results.tests.push({
      name: 'HuggingFace API Call (BERTweet)',
      status: 'FAIL',
      details: error.message
    })
  }

  // Test 4: Test the actual /api/sentiment endpoint
  try {
    const testResponse = await fetch(`${req.headers.host}/api/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Strong bullish momentum for tech stocks',
        useMultiModel: false
      })
    })

    const sentimentData = await testResponse.json()

    results.tests.push({
      name: 'Sentiment API Endpoint',
      status: sentimentData.fallback ? 'FAIL' : 'PASS',
      details: sentimentData.fallback
        ? 'Returning fallback data (API not working)'
        : `Working! Sentiment: ${sentimentData.sentiment}`,
      response: sentimentData
    })
  } catch (error) {
    results.tests.push({
      name: 'Sentiment API Endpoint',
      status: 'FAIL',
      details: error.message
    })
  }

  // Summary
  const passCount = results.tests.filter(t => t.status === 'PASS').length
  const failCount = results.tests.filter(t => t.status === 'FAIL').length
  const loadingCount = results.tests.filter(t => t.status === 'LOADING').length

  results.summary = {
    total: results.tests.length,
    passed: passCount,
    failed: failCount,
    loading: loadingCount,
    overallStatus: failCount === 0 && loadingCount === 0 ? 'ALL SYSTEMS GO' :
                   loadingCount > 0 ? 'MODELS LOADING - RETRY IN 60 SECONDS' :
                   'ISSUES DETECTED - SEE DETAILS BELOW'
  }

  console.log('[HF Test] Summary:', results.summary)

  return res.status(200).json(results)
}
