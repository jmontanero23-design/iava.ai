/**
 * Premium Text-to-Speech API using ElevenLabs
 * Converts AI responses to natural human voice
 *
 * Cost: ~$0.04 per 1K characters with ElevenLabs Turbo v2.5
 * Quality: 8.5/10 - Much better than browser TTS
 * Works on ALL devices including iPhone
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5'

  if (!apiKey) {
    console.error('[TTS] ElevenLabs API key not configured')
    return res.status(500).json({ error: 'TTS service not configured' })
  }

  try {
    const { text, voiceId = 'pNInz6obpgDQGcFmaJgB' } = req.body // Default: Adam (clear male voice)

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' })
    }

    // Limit text length to prevent abuse
    const maxLength = 5000 // ~5K characters max
    const cleanText = text.slice(0, maxLength)

    console.log('[TTS] Generating speech:', {
      length: cleanText.length,
      voiceId,
      model: modelId
    })

    // Call ElevenLabs Text-to-Speech API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[TTS] ElevenLabs error:', error)
      throw new Error(error.detail?.message || error.error || 'TTS generation failed')
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer()

    console.log('[TTS] Audio generated:', {
      size: audioBuffer.byteLength,
      format: 'audio/mpeg'
    })

    // Return audio as base64 for easy client-side playback
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    res.status(200).json({
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      length: cleanText.length,
      voiceId,
      model: modelId
    })

  } catch (error) {
    console.error('[TTS] Error:', error)
    res.status(500).json({
      error: error.message || 'Text-to-speech generation failed'
    })
  }
}
