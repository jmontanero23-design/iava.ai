/**
 * PWA Utilities
 * Service worker registration, installation prompts, and offline detection
 */

/**
 * Register service worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    })

    console.log('[PWA] Service worker registered:', registration.scope)

    // Check for updates every hour
    setInterval(() => {
      registration.update()
    }, 60 * 60 * 1000)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      console.log('[PWA] Service worker update found')

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWA] New service worker installed, prompting reload')

          // Notify user of update
          window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: {
              text: 'New version available! Click to reload.',
              type: 'info',
              duration: 10000,
              action: {
                label: 'Reload',
                onClick: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                  window.location.reload()
                }
              }
            }
          }))
        }
      })
    })

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service worker controller changed')
    })

    return registration
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error)
    return null
  }
}

/**
 * Prompt user to install PWA
 * @returns {Promise<boolean>} True if user accepted, false otherwise
 */
export async function promptInstall() {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('[PWA] Already installed')
    return false
  }

  // Check if beforeinstallprompt event was captured
  if (!window.__pwaInstallPrompt) {
    console.log('[PWA] No install prompt available')
    return false
  }

  try {
    const prompt = window.__pwaInstallPrompt
    window.__pwaInstallPrompt = null

    // Show the install prompt
    prompt.prompt()

    // Wait for user response
    const { outcome } = await prompt.userChoice
    console.log('[PWA] Install prompt outcome:', outcome)

    return outcome === 'accepted'
  } catch (error) {
    console.error('[PWA] Install prompt error:', error)
    return false
  }
}

/**
 * Check if app is installed as PWA
 * @returns {boolean}
 */
export function isInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/**
 * Check if install prompt is available
 * @returns {boolean}
 */
export function canInstall() {
  return Boolean(window.__pwaInstallPrompt)
}

/**
 * Initialize PWA event listeners
 */
export function initPWA() {
  // Capture beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt available')
    e.preventDefault()
    window.__pwaInstallPrompt = e

    // Dispatch custom event for UI to show install button
    window.dispatchEvent(new CustomEvent('iava.pwa.installable', {
      detail: { canInstall: true }
    }))
  })

  // App installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully')
    window.__pwaInstallPrompt = null

    // Show success toast
    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: {
        text: 'iAVA.ai installed successfully!',
        type: 'success'
      }
    }))

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('iava.pwa.installed'))
  })

  // Log install status
  if (isInstalled()) {
    console.log('[PWA] Running as installed app')
  } else {
    console.log('[PWA] Running in browser')
  }
}

/**
 * Offline/online detection
 */
export function initOfflineDetection() {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine
    console.log('[PWA] Connection status:', isOnline ? 'online' : 'offline')

    window.dispatchEvent(new CustomEvent('iava.connection', {
      detail: { online: isOnline }
    }))

    // Show toast notification
    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: {
        text: isOnline ? 'Back online' : 'You are offline. Limited functionality.',
        type: isOnline ? 'success' : 'warning',
        duration: 3000
      }
    }))
  }

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
}

/**
 * Request notification permission
 * @returns {Promise<NotificationPermission>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    console.log('[PWA] Notification permission:', permission)
    return permission
  }

  return Notification.permission
}

/**
 * Show notification
 * @param {string} title - Notification title
 * @param {NotificationOptions} options - Notification options
 */
export async function showNotification(title, options = {}) {
  const permission = await requestNotificationPermission()

  if (permission !== 'granted') {
    console.warn('[PWA] Notification permission denied')
    return
  }

  const registration = await navigator.serviceWorker.ready

  await registration.showNotification(title, {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    ...options
  })
}

/**
 * Clear all caches (useful for debugging)
 * @returns {Promise<void>}
 */
export async function clearCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map((name) => caches.delete(name)))
  console.log('[PWA] All caches cleared')
}

/**
 * Get cache size estimate
 * @returns {Promise<{usage: number, quota: number, percent: number}>}
 */
export async function getCacheSize() {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return { usage: 0, quota: 0, percent: 0 }
  }

  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  const percent = quota > 0 ? (usage / quota) * 100 : 0

  return {
    usage,
    quota,
    percent,
    usageMB: (usage / (1024 * 1024)).toFixed(2),
    quotaMB: (quota / (1024 * 1024)).toFixed(2)
  }
}
