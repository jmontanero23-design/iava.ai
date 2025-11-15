/**
 * Elite Toast Notification Helper
 * Easy-to-use wrapper for the ToastHub system
 *
 * Usage:
 *   import { toast } from './utils/toast.js'
 *
 *   toast.success('Trade placed successfully!')
 *   toast.error('API error occurred')
 *   toast.warning('Market is closed')
 *   toast.info('Scanner completed')
 */

function showToast(text, type = 'info', ttl = 4000, action = null) {
  window.dispatchEvent(new CustomEvent('iava.toast', {
    detail: { text, type, ttl, action }
  }))
}

export const toast = {
  success: (text, ttl) => showToast(text, 'success', ttl),
  error: (text, ttl) => showToast(text, 'error', ttl),
  warning: (text, ttl) => showToast(text, 'warning', ttl),
  info: (text, ttl) => showToast(text, 'info', ttl),
  signal: (text, ttl) => showToast(text, 'signal', ttl)
}

export default toast
