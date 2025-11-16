/**
 * Mobile Push-to-Talk Component
 * Elite touch-optimized voice interface for mobile devices
 *
 * Features:
 * - Large touch-friendly button (optimized for one-handed use)
 * - Visual recording feedback (pulsing animation, waveform)
 * - Recording timer
 * - Automatic transcription via Whisper API
 * - Sends transcribed text to AI Chat
 */

import { useState, useRef, useEffect } from 'react'
import { toast } from '../utils/toast.js'

export default function MobilePushToTalk({ onTranscript, isListening: externalListening }) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // Start recording
  const startRecording = async () => {
    try {
      console.log('[Push-to-Talk] Starting recording...')

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Setup audio level monitoring
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)
      analyser.fftSize = 256
      analyserRef.current = analyser

      // Start audio level monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateAudioLevel = () => {
        if (!analyserRef.current) return
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(Math.min(100, (average / 128) * 100))
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }
      updateAudioLevel()

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('[Push-to-Talk] Recording stopped')
        setIsRecording(false)
        setRecordingTime(0)

        // Stop audio level monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setAudioLevel(0)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        // Process the recording
        await processRecording()
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()

      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      console.log('[Push-to-Talk] Recording started')

    } catch (error) {
      console.error('[Push-to-Talk] Error starting recording:', error)
      toast.error('Failed to access microphone')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  // Process and transcribe recording
  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      console.warn('[Push-to-Talk] No audio data recorded')
      return
    }

    setIsProcessing(true)

    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      console.log('[Push-to-Talk] Audio blob created:', audioBlob.size, 'bytes')

      // Convert to base64
      const base64Audio = await blobToBase64(audioBlob)

      // Call transcription API
      console.log('[Push-to-Talk] Sending to Whisper API...')
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64Audio,
          format: 'webm'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transcription failed')
      }

      const { text } = await response.json()
      console.log('[Push-to-Talk] Transcription:', text)

      if (text && text.trim()) {
        // Send transcribed text to parent (AI Chat)
        if (onTranscript) {
          onTranscript(text.trim())
        }
        toast.success('Voice recorded successfully')
      } else {
        toast.warning('No speech detected')
      }

    } catch (error) {
      console.error('[Push-to-Talk] Error processing recording:', error)
      toast.error('Failed to transcribe audio: ' + error.message)
    } finally {
      setIsProcessing(false)
      audioChunksRef.current = []
    }
  }

  // Helper: Convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Toggle recording
  const handleToggle = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Don't show if desktop voice is active
  if (externalListening) {
    return null
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">
      {/* Recording Status Card */}
      {(isRecording || isProcessing) && (
        <div className="bg-slate-900/95 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 shadow-2xl animate-slide-in-right">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
              {isRecording && (
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <span className="text-sm font-semibold text-slate-200">
              {isRecording ? 'Recording...' : 'Processing...'}
            </span>
            {isRecording && (
              <span className="text-sm text-slate-400 font-mono">
                {formatTime(recordingTime)}
              </span>
            )}
          </div>

          {/* Audio Level Waveform */}
          {isRecording && (
            <div className="flex items-center gap-1 h-12">
              {[...Array(20)].map((_, i) => {
                const height = Math.random() * audioLevel + 10
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-full transition-all duration-75"
                    style={{
                      height: `${height}%`,
                      minHeight: '8px',
                      opacity: 0.3 + (audioLevel / 200)
                    }}
                  />
                )
              })}
            </div>
          )}

          {isProcessing && (
            <div className="text-xs text-slate-400 text-center">
              Transcribing with Whisper AI...
            </div>
          )}
        </div>
      )}

      {/* Push-to-Talk Button */}
      <button
        onClick={handleToggle}
        disabled={isProcessing}
        className={`
          relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300
          flex items-center justify-center text-2xl
          ${isRecording
            ? 'bg-gradient-to-br from-red-500 to-red-600 scale-110 shadow-red-500/50'
            : isProcessing
            ? 'bg-gradient-to-br from-amber-500 to-amber-600 animate-pulse'
            : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 hover:scale-105 active:scale-95'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        style={{
          boxShadow: isRecording
            ? '0 0 30px rgba(239, 68, 68, 0.6)'
            : '0 0 30px rgba(99, 102, 241, 0.4)'
        }}
      >
        {isProcessing ? (
          <span className="animate-spin">⏳</span>
        ) : isRecording ? (
          <span>⏹️</span>
        ) : (
          <span>🎤</span>
        )}

        {/* Pulse Ring Animation */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-50" />
        )}
      </button>

      {/* Hint Text */}
      {!isRecording && !isProcessing && (
        <div className="text-xs text-slate-400 text-center bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full">
          Tap to speak
        </div>
      )}
    </div>
  )
}
