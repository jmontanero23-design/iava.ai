import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    DEV: true,
    VITE_DEBUG: 'false'
  }
})

describe('Logger Utility', () => {
  let consoleLogSpy
  let consoleInfoSpy
  let consoleWarnSpy
  let consoleErrorSpy
  let mockPerformance

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockPerformance = vi.spyOn(performance, 'now').mockReturnValue(100)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('in development mode', () => {
    beforeEach(async () => {
      vi.stubGlobal('import.meta', { env: { DEV: true, VITE_DEBUG: 'false' } })
      // Re-import to get fresh module with new env
      vi.resetModules()
    })

    it('logger module exports expected functions', async () => {
      const logger = await import('../../src/utils/logger.js')
      expect(logger.default).toBeDefined()
      expect(typeof logger.default.debug).toBe('function')
      expect(typeof logger.default.info).toBe('function')
      expect(typeof logger.default.warn).toBe('function')
      expect(typeof logger.default.error).toBe('function')
      expect(typeof logger.default.trade).toBe('function')
      expect(typeof logger.default.ai).toBe('function')
      expect(typeof logger.default.api).toBe('function')
      expect(typeof logger.default.perf).toBe('function')
    })

    it('exports named functions', async () => {
      const logger = await import('../../src/utils/logger.js')
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.trade).toBe('function')
      expect(typeof logger.ai).toBe('function')
      expect(typeof logger.api).toBe('function')
      expect(typeof logger.perf).toBe('function')
    })
  })

  describe('warn and error always log', () => {
    it('warn always logs regardless of environment', async () => {
      vi.stubGlobal('import.meta', { env: { DEV: false, VITE_DEBUG: 'false' } })
      vi.resetModules()
      const logger = await import('../../src/utils/logger.js')

      logger.default.warn('test warning')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('error always logs regardless of environment', async () => {
      vi.stubGlobal('import.meta', { env: { DEV: false, VITE_DEBUG: 'false' } })
      vi.resetModules()
      const logger = await import('../../src/utils/logger.js')

      logger.default.error('test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('trade logging', () => {
    it('trade always logs', async () => {
      vi.stubGlobal('import.meta', { env: { DEV: false, VITE_DEBUG: 'false' } })
      vi.resetModules()
      const logger = await import('../../src/utils/logger.js')

      logger.default.trade('test trade action')
      expect(consoleLogSpy).toHaveBeenCalled()
    })
  })
})
