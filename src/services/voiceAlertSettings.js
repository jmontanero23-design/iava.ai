/**
 * Voice Alert Settings - Quiet Hours & Preferences
 *
 * PhD++ Quality voice alert management:
 * - Quiet hours scheduling
 * - Alert priority filtering
 * - Volume control
 * - Voice selection
 * - Do Not Disturb mode
 */

const STORAGE_KEY = 'ava.voice.settings'

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  volume: 0.8, // 0-1
  voice: 'default', // ElevenLabs voice ID or 'default' for browser TTS
  speed: 1.0, // 0.5-2.0

  // Quiet hours
  quietHours: {
    enabled: false,
    start: '22:00', // 10 PM
    end: '08:00',   // 8 AM
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  },

  // Do Not Disturb
  dnd: {
    enabled: false,
    until: null // Timestamp when DND ends
  },

  // Alert priorities to speak
  priorities: {
    critical: true,
    high: true,
    medium: true,
    low: false
  },

  // Alert types to speak
  alertTypes: {
    priceAlerts: true,
    tradeSignals: true,
    riskWarnings: true,
    forecasts: true,
    positionUpdates: true,
    marketNews: false
  },

  // Confirmation sounds
  sounds: {
    messageReceived: true,
    tradePlaced: true,
    alertTriggered: true
  }
}

/**
 * Load settings
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch (e) {}
  return { ...DEFAULT_SETTINGS }
}

/**
 * Save settings
 */
function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

  // Dispatch event for listeners
  window.dispatchEvent(new CustomEvent('ava.voiceSettingsChanged', {
    detail: settings
  }))
}

/**
 * Check if currently in quiet hours
 */
export function isQuietHours() {
  const settings = loadSettings()

  // Check DND first
  if (settings.dnd.enabled) {
    if (settings.dnd.until && Date.now() > settings.dnd.until) {
      // DND expired, disable it
      settings.dnd.enabled = false
      settings.dnd.until = null
      saveSettings(settings)
    } else {
      return true
    }
  }

  // Check quiet hours
  if (!settings.quietHours.enabled) return false

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const [startHour, startMin] = settings.quietHours.start.split(':').map(Number)
  const [endHour, endMin] = settings.quietHours.end.split(':').map(Number)

  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime
  }

  return currentTime >= startTime && currentTime < endTime
}

/**
 * Check if voice should play for given alert
 */
export function shouldSpeak(priority = 'medium', alertType = 'general') {
  const settings = loadSettings()

  // Check if voice is enabled
  if (!settings.enabled) return false

  // Check quiet hours
  if (isQuietHours()) return false

  // Check priority
  if (!settings.priorities[priority]) return false

  // Check alert type
  const typeMap = {
    price: 'priceAlerts',
    signal: 'tradeSignals',
    risk: 'riskWarnings',
    forecast: 'forecasts',
    position: 'positionUpdates',
    news: 'marketNews'
  }

  const settingKey = typeMap[alertType]
  if (settingKey && !settings.alertTypes[settingKey]) return false

  return true
}

/**
 * Get current settings
 */
export function getVoiceSettings() {
  return loadSettings()
}

/**
 * Update settings
 */
export function updateVoiceSettings(updates) {
  const current = loadSettings()
  const updated = { ...current, ...updates }
  saveSettings(updated)
  return updated
}

/**
 * Enable Do Not Disturb
 */
export function enableDND(durationMinutes = 60) {
  const settings = loadSettings()
  settings.dnd.enabled = true
  settings.dnd.until = Date.now() + (durationMinutes * 60 * 1000)
  saveSettings(settings)

  return settings.dnd.until
}

/**
 * Disable Do Not Disturb
 */
export function disableDND() {
  const settings = loadSettings()
  settings.dnd.enabled = false
  settings.dnd.until = null
  saveSettings(settings)
}

/**
 * Set quiet hours
 */
export function setQuietHours(enabled, start = '22:00', end = '08:00') {
  const settings = loadSettings()
  settings.quietHours.enabled = enabled
  settings.quietHours.start = start
  settings.quietHours.end = end
  saveSettings(settings)

  return settings.quietHours
}

/**
 * Set volume
 */
export function setVolume(volume) {
  const settings = loadSettings()
  settings.volume = Math.max(0, Math.min(1, volume))
  saveSettings(settings)

  return settings.volume
}

/**
 * Toggle voice enabled
 */
export function toggleVoice(enabled = null) {
  const settings = loadSettings()
  settings.enabled = enabled !== null ? enabled : !settings.enabled
  saveSettings(settings)

  return settings.enabled
}

/**
 * Get remaining DND time
 */
export function getDNDRemaining() {
  const settings = loadSettings()

  if (!settings.dnd.enabled || !settings.dnd.until) return null

  const remaining = settings.dnd.until - Date.now()
  if (remaining <= 0) {
    disableDND()
    return null
  }

  const minutes = Math.ceil(remaining / 60000)
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }
  return `${minutes}m`
}

/**
 * Get next quiet hours transition
 */
export function getQuietHoursStatus() {
  const settings = loadSettings()

  if (!settings.quietHours.enabled) {
    return { active: false, message: 'Quiet hours disabled' }
  }

  const inQuietHours = isQuietHours()
  const now = new Date()

  const [startHour, startMin] = settings.quietHours.start.split(':').map(Number)
  const [endHour, endMin] = settings.quietHours.end.split(':').map(Number)

  if (inQuietHours) {
    // Calculate time until quiet hours end
    const end = new Date()
    end.setHours(endHour, endMin, 0, 0)
    if (end <= now) end.setDate(end.getDate() + 1)

    const diff = end - now
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)

    return {
      active: true,
      message: `Quiet until ${settings.quietHours.end}`,
      remaining: `${hours}h ${mins}m`
    }
  } else {
    // Calculate time until quiet hours start
    const start = new Date()
    start.setHours(startHour, startMin, 0, 0)
    if (start <= now) start.setDate(start.getDate() + 1)

    const diff = start - now
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)

    return {
      active: false,
      message: `Quiet hours at ${settings.quietHours.start}`,
      startsIn: `${hours}h ${mins}m`
    }
  }
}

export default {
  isQuietHours,
  shouldSpeak,
  getVoiceSettings,
  updateVoiceSettings,
  enableDND,
  disableDND,
  setQuietHours,
  setVolume,
  toggleVoice,
  getDNDRemaining,
  getQuietHoursStatus
}
