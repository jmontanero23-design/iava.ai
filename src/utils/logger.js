/**
 * Logger Utility
 * Centralizes logging with environment-aware output
 * Replaces raw console.log statements throughout the app
 */

const isDev = import.meta.env.DEV
const isDebugEnabled = import.meta.env.VITE_DEBUG === 'true'

// Color codes for terminal (dev only)
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

// Format timestamp
const timestamp = () => {
  const now = new Date()
  return `${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}`
}

const logger = {
  /**
   * Debug logging - only in development
   */
  debug: (...args) => {
    if (isDev || isDebugEnabled) {
      console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.cyan}[DEBUG]${colors.reset}`, ...args)
    }
  },

  /**
   * Info logging - only in development
   */
  info: (...args) => {
    if (isDev || isDebugEnabled) {
      console.info(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.blue}[INFO]${colors.reset}`, ...args)
    }
  },

  /**
   * Warning logging - always shown
   */
  warn: (...args) => {
    console.warn(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset}`, ...args)
  },

  /**
   * Error logging - always shown
   */
  error: (...args) => {
    console.error(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.red}[ERROR]${colors.reset}`, ...args)
  },

  /**
   * Trading-specific logging - important actions
   */
  trade: (...args) => {
    console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.green}[TRADE]${colors.reset}`, ...args)
  },

  /**
   * AI-specific logging - only in development
   */
  ai: (...args) => {
    if (isDev || isDebugEnabled) {
      console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.magenta}[AI]${colors.reset}`, ...args)
    }
  },

  /**
   * API logging - only in development
   */
  api: (...args) => {
    if (isDev || isDebugEnabled) {
      console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.cyan}[API]${colors.reset}`, ...args)
    }
  },

  /**
   * Performance logging - only in development
   */
  perf: (label, startTime) => {
    if (isDev || isDebugEnabled) {
      const duration = performance.now() - startTime
      console.log(
        `${colors.dim}[${timestamp()}]${colors.reset} ${colors.yellow}[PERF]${colors.reset}`,
        label,
        `${duration.toFixed(2)}ms`
      )
    }
  },

  /**
   * Group logging - for related logs
   */
  group: (label) => {
    if (isDev || isDebugEnabled) {
      console.group(`${colors.blue}[${label}]${colors.reset}`)
    }
  },

  groupEnd: () => {
    if (isDev || isDebugEnabled) {
      console.groupEnd()
    }
  },

  /**
   * Table logging - for data structures
   */
  table: (data, columns) => {
    if (isDev || isDebugEnabled) {
      console.table(data, columns)
    }
  },
}

export default logger

// Named exports for convenience
export const { debug, info, warn, error, trade, ai, api, perf } = logger
