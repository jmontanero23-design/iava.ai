/**
 * Voice Synthesis Utility
 * Shared ElevenLabs TTS functionality for AI components
 */

// Clean text for TTS processing
export function cleanTextForTTS(text) {
  return text
    .replace(/[*_~`#]/g, '') // Remove markdown
    .replace(/\n+/g, '. ') // Newlines to pauses
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/╔.*?╝/gs, '') // Remove box characters
    .replace(/[🔴🟢⚠️💡🧠🎯📊✅❌]/g, '') // Remove emojis
    .trim()
}

// Main TTS function using ElevenLabs
export async function speakText(text, options = {}) {
  const {
    voiceId = 'pNInz6obpgDQGcFmaJgB', // Adam - professional male voice
    playbackRate = 1.1,
    onEnd = null,
    onError = null
  } = options

  try {
    const cleanText = cleanTextForTTS(text)

    if (!cleanText) {
      console.warn('🔊 No text to speak after cleaning')
      return
    }

    // Call ElevenLabs API
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voiceId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'TTS generation failed')
    }

    const { audio } = await response.json()

    // Create and play audio
    const audioElement = new Audio(audio)
    audioElement.playbackRate = playbackRate

    if (onEnd) audioElement.onended = onEnd
    if (onError) audioElement.onerror = onError

    await audioElement.play()
    return audioElement

  } catch (error) {
    console.error('[TTS] Error:', error)
    if (onError) onError(error)

    // Fallback to browser TTS
    return fallbackBrowserTTS(text, options)
  }
}

// Fallback browser TTS
export function fallbackBrowserTTS(text, options = {}) {
  if (!('speechSynthesis' in window)) {
    console.warn('🔊 Speech synthesis not supported')
    return null
  }

  const { playbackRate = 1.1, onEnd = null } = options

  window.speechSynthesis.cancel()

  const cleanText = cleanTextForTTS(text)
  if (!cleanText) return null

  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.rate = playbackRate
  if (onEnd) utterance.onend = onEnd

  window.speechSynthesis.speak(utterance)
  return utterance
}

// Voice presets for different contexts
export const VoicePresets = {
  ALERT: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - urgent, clear
    playbackRate: 1.2
  },
  ANALYSIS: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - professional
    playbackRate: 1.0
  },
  COPILOT: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - friendly guide
    playbackRate: 1.1
  }
}

// Queue system for multiple voice messages
class VoiceQueue {
  constructor() {
    this.queue = []
    this.isPlaying = false
  }

  async add(text, options = {}) {
    this.queue.push({ text, options })
    if (!this.isPlaying) {
      this.processQueue()
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isPlaying = false
      return
    }

    this.isPlaying = true
    const { text, options } = this.queue.shift()

    await speakText(text, {
      ...options,
      onEnd: () => {
        this.processQueue() // Process next in queue
        if (options.onEnd) options.onEnd()
      }
    })
  }

  clear() {
    this.queue = []
    this.isPlaying = false
    window.speechSynthesis?.cancel()
  }
}

// Create singleton instance
export const voiceQueue = new VoiceQueue()

// Helper to speak important alerts
export async function speakAlert(message, priority = 'normal') {
  const preset = priority === 'high' ?
    { ...VoicePresets.ALERT, playbackRate: 1.3 } :
    VoicePresets.ALERT

  return speakText(message, preset)
}

// Helper for AI analysis readouts
export async function speakAnalysis(analysis) {
  return speakText(analysis, VoicePresets.ANALYSIS)
}

// Helper for copilot guidance
export async function speakGuidance(guidance) {
  return speakText(guidance, VoicePresets.COPILOT)
}