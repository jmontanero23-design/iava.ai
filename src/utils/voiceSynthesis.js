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

// Queue system for multiple voice messages - prevents overlapping speech
class VoiceQueue {
  constructor() {
    this.queue = []
    this.isPlaying = false
    this.currentAudio = null
  }

  async add(text, options = {}) {
    return new Promise((resolve) => {
      this.queue.push({ text, options, resolve })
      if (!this.isPlaying) {
        this.processQueue()
      }
    })
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isPlaying = false
      this.currentAudio = null
      return
    }

    this.isPlaying = true
    const { text, options, resolve } = this.queue.shift()

    try {
      this.currentAudio = await speakText(text, {
        ...options,
        onEnd: () => {
          this.currentAudio = null
          if (options.onEnd) options.onEnd()
          resolve()
          this.processQueue() // Process next in queue
        },
        onError: (err) => {
          this.currentAudio = null
          if (options.onError) options.onError(err)
          resolve()
          this.processQueue() // Continue even on error
        }
      })
    } catch (err) {
      console.warn('[VoiceQueue] Error playing:', err)
      resolve()
      this.processQueue()
    }
  }

  clear() {
    this.queue = []
    this.isPlaying = false

    // Stop currently playing audio
    if (this.currentAudio) {
      if (this.currentAudio.pause) {
        this.currentAudio.pause()
        this.currentAudio.currentTime = 0
      }
      this.currentAudio = null
    }

    // Also stop browser TTS if active
    window.speechSynthesis?.cancel()
  }

  // Check if currently speaking
  get isSpeaking() {
    return this.isPlaying
  }

  // Get queue length
  get length() {
    return this.queue.length
  }
}

// Create singleton instance
export const voiceQueue = new VoiceQueue()

// Helper to speak important alerts - uses queue to prevent overlap
export async function speakAlert(message, priority = 'normal') {
  const preset = priority === 'high' ?
    { ...VoicePresets.ALERT, playbackRate: 1.3 } :
    VoicePresets.ALERT

  // High priority alerts skip the queue and play immediately
  if (priority === 'high') {
    voiceQueue.clear() // Stop current speech
    return speakText(message, preset)
  }

  // Normal alerts go through the queue
  return voiceQueue.add(message, preset)
}

// Helper for AI analysis readouts - uses queue to prevent overlap
export async function speakAnalysis(analysis) {
  return voiceQueue.add(analysis, VoicePresets.ANALYSIS)
}

// Helper for copilot guidance - uses queue to prevent overlap
export async function speakGuidance(guidance) {
  return voiceQueue.add(guidance, VoicePresets.COPILOT)
}

// Stop all speech immediately
export function stopSpeech() {
  voiceQueue.clear()
}