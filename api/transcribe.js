/**
 * Speech-to-Text Transcription API using OpenAI Whisper
 * Converts voice recordings to text for mobile devices
 *
 * Cost: ~$0.006 per minute of audio
 * Works with iPhone, Android, and all browsers
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { audio, format = 'webm' } = req.body

    if (!audio || typeof audio !== 'string') {
      return res.status(400).json({ error: 'Audio data is required (base64)' })
    }

      format,
      size: audio.length
    })

    // Use HuggingFace Whisper API (faster and free tier available)
    const hfApiKey = process.env.HUGGINGFACE_API_KEY

    if (!hfApiKey) {
      console.error('[Transcribe] HuggingFace API key not configured')
      return res.status(500).json({ error: 'Transcription service not configured' })
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio.replace(/^data:audio\/\w+;base64,/, ''), 'base64')

    // Call HuggingFace Whisper API
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'audio/wav'
        },
        body: audioBuffer
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[Transcribe] HuggingFace error:', error)

      // If model is loading, try again in a moment
      if (error.error && error.error.includes('loading')) {
        return res.status(503).json({
          error: 'Model is loading, please try again in a moment',
          retry: true
        })
      }

      throw new Error(error.error || 'Transcription failed')
    }

    const result = await response.json()


    res.status(200).json({
      text: result.text,
      confidence: result.confidence || null
    })

  } catch (error) {
    console.error('[Transcribe] Error:', error)
    res.status(500).json({
      error: error.message || 'Transcription failed'
    })
  }
}

/**
 * Config for Vercel serverless function
 * Increase body size limit for audio uploads
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}
