/**
 * LEGENDARY Haptic Feedback Utilities
 *
 * Premium haptic patterns for mobile interactions
 * Provides tactile feedback that makes the app feel native and responsive
 */

// Check if haptic feedback is supported
export const isHapticSupported = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

// Basic haptic patterns (in milliseconds)
const PATTERNS = {
  // Light tap - for subtle interactions like toggles
  light: [10],

  // Medium tap - for button presses, selections
  medium: [20],

  // Heavy tap - for confirmations, important actions
  heavy: [40],

  // Success pattern - for trade executed, alerts confirmed
  success: [10, 50, 10, 50, 30],

  // Error pattern - for failed actions, warnings
  error: [50, 100, 50],

  // Warning pattern - for stop loss, price alerts
  warning: [30, 50, 30],

  // Notification pattern - for new signals, updates
  notification: [10, 30, 10],

  // Selection change - for switching tabs, filters
  selection: [5, 10, 5],

  // Long press - for context menus
  longPress: [15, 50, 15, 50, 15],

  // Score update - celebratory pattern for high scores
  scoreHigh: [10, 20, 10, 20, 10, 20, 50],

  // Trade confirmed - satisfying confirmation
  tradeConfirmed: [20, 40, 20, 40, 80],

  // Swipe - for gesture feedback
  swipe: [8],

  // Double tap
  doubleTap: [10, 30, 10],
}

/**
 * Trigger a haptic feedback pattern
 * @param {keyof PATTERNS | number[]} pattern - Pattern name or custom vibration array
 * @returns {boolean} - Whether haptic was triggered
 */
export function haptic(pattern = 'medium') {
  if (!isHapticSupported()) return false

  try {
    const vibrationPattern = typeof pattern === 'string'
      ? PATTERNS[pattern] || PATTERNS.medium
      : pattern

    navigator.vibrate(vibrationPattern)
    return true
  } catch (e) {
    console.warn('Haptic feedback failed:', e)
    return false
  }
}

/**
 * Cancel any ongoing haptic feedback
 */
export function cancelHaptic() {
  if (isHapticSupported()) {
    navigator.vibrate(0)
  }
}

// Convenience functions for common haptics
export const hapticLight = () => haptic('light')
export const hapticMedium = () => haptic('medium')
export const hapticHeavy = () => haptic('heavy')
export const hapticSuccess = () => haptic('success')
export const hapticError = () => haptic('error')
export const hapticWarning = () => haptic('warning')
export const hapticNotification = () => haptic('notification')
export const hapticSelection = () => haptic('selection')
export const hapticSwipe = () => haptic('swipe')

/**
 * Create a haptic-enabled click handler
 * @param {Function} callback - The original click handler
 * @param {string} pattern - Haptic pattern to use
 * @returns {Function} - Enhanced click handler with haptic feedback
 */
export function withHaptic(callback, pattern = 'medium') {
  return (...args) => {
    haptic(pattern)
    return callback?.(...args)
  }
}

/**
 * Create a haptic-enabled event handler for buttons
 * @param {Object} options - Configuration options
 * @returns {Object} - Event handlers object
 */
export function useHapticButton({
  onClick,
  onPress,
  onRelease,
  pattern = 'medium',
  pressPattern = 'light',
} = {}) {
  return {
    onClick: (e) => {
      haptic(pattern)
      onClick?.(e)
    },
    onMouseDown: (e) => {
      haptic(pressPattern)
      onPress?.(e)
    },
    onMouseUp: (e) => {
      onRelease?.(e)
    },
    onTouchStart: (e) => {
      haptic(pressPattern)
      onPress?.(e)
    },
    onTouchEnd: (e) => {
      onRelease?.(e)
    },
  }
}

/**
 * Trade-specific haptic feedback
 */
export const tradeHaptics = {
  // When opening trade panel
  openPanel: () => haptic('medium'),

  // When changing quantity/price
  valueChange: () => haptic('light'),

  // When toggling buy/sell
  sideToggle: () => haptic('selection'),

  // When confirming trade
  confirm: () => haptic('tradeConfirmed'),

  // When trade executes successfully
  executed: () => haptic('success'),

  // When trade fails
  failed: () => haptic('error'),

  // When hitting stop loss
  stopLoss: () => haptic('warning'),

  // When hitting take profit
  takeProfit: () => haptic('success'),
}

/**
 * Score-specific haptic feedback
 */
export const scoreHaptics = {
  // Score above 80 - bullish
  high: () => haptic('scoreHigh'),

  // Score between 60-80 - neutral
  medium: () => haptic('notification'),

  // Score below 60 - bearish
  low: () => haptic('warning'),

  // Score update
  update: (score) => {
    if (score >= 80) return haptic('scoreHigh')
    if (score >= 60) return haptic('notification')
    return haptic('warning')
  },
}

/**
 * Navigation haptic feedback
 */
export const navHaptics = {
  // Tab switch
  tab: () => haptic('selection'),

  // Menu open
  menuOpen: () => haptic('medium'),

  // Menu close
  menuClose: () => haptic('light'),

  // Pull to refresh
  pullRefresh: () => haptic('medium'),

  // Swipe gesture
  swipe: () => haptic('swipe'),

  // Long press
  longPress: () => haptic('longPress'),
}

export default {
  haptic,
  cancelHaptic,
  isHapticSupported,
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticError,
  hapticWarning,
  hapticNotification,
  hapticSelection,
  hapticSwipe,
  withHaptic,
  useHapticButton,
  tradeHaptics,
  scoreHaptics,
  navHaptics,
  PATTERNS,
}
