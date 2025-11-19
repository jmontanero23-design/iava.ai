/**
 * iAVA.ai Service Worker
 * Provides offline capabilities, caching strategies, and background sync
 *
 * Strategy:
 * - Network-first for HTML & API calls (always get latest)
 * - Cache-first for images, fonts, CSS (fast loading)
 * - Stale-while-revalidate for JS (show cached, update in background)
 */

const CACHE_VERSION = 'iava-v2.1.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const API_CACHE = `${CACHE_VERSION}-api`

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  // Fonts are loaded from Google Fonts CDN, we'll cache them at runtime
]

// Cache duration in seconds
const CACHE_DURATION = {
  api: 60,        // 1 minute for API responses
  static: 86400,  // 1 day for static assets
  runtime: 3600   // 1 hour for runtime assets
}

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets')
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => {
      console.log('[SW] Skip waiting')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete caches that don't match current version
            return cacheName.startsWith('iava-') && cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => {
      console.log('[SW] Claiming clients')
      return self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests for different hosts
  if (url.origin !== location.origin && !url.host.includes('fonts.googleapis.com') && !url.host.includes('fonts.gstatic.com')) {
    return
  }

  // API requests: Network-first with fallback to cache (GET only)
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET requests - POST/PUT/DELETE cannot be cached
    if (request.method === 'GET') {
      event.respondWith(networkFirstStrategy(request, API_CACHE))
    } else {
      // POST/PUT/DELETE: Network-only, no caching
      event.respondWith(fetch(request))
    }
    return
  }

  // Streaming endpoints: Network-only (no caching)
  if (url.pathname.includes('/stream') || url.pathname.includes('/sse')) {
    event.respondWith(fetch(request))
    return
  }

  // HTML requests: Network-first (always get latest to ensure correct JS references)
  if (request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE))
    return
  }

  // Static assets (CSS, images, fonts): Cache-first
  if (
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.host.includes('fonts.googleapis.com') ||
    url.host.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE))
    return
  }

  // JavaScript files: Stale-while-revalidate (show cached, update in background)
  if (request.destination === 'script') {
    event.respondWith(staleWhileRevalidateStrategy(request, STATIC_CACHE))
    return
  }

  // Other requests: Stale-while-revalidate
  event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE))
})

/**
 * Network-first strategy
 * Try network first, fall back to cache on failure
 * Best for: API calls, dynamic content
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request)

    // Only cache successful GET/HEAD requests (Cache API doesn't support POST)
    if (response.ok && (request.method === 'GET' || request.method === 'HEAD')) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline fallback if no cache
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No network connection and no cached data available'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Cache-first strategy
 * Try cache first, fall back to network
 * Best for: Static assets, fonts, images
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)

    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.error('[SW] Cache-first failed:', request.url, error)
    throw error
  }
}

/**
 * Stale-while-revalidate strategy
 * Return cached response immediately, update cache in background
 * Best for: HTML, CSS, JS that can show stale content
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request)

  const fetchPromise = fetch(request).then((response) => {
    // Clone the response BEFORE any async operations
    const responseToCache = response.clone()

    if (response.ok) {
      // Update cache in background (don't await)
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseToCache).catch(err => {
          console.log('[SW] Failed to cache:', err.message)
        })
      })
    }
    return response
  }).catch(() => {
    // Silently fail - we already have cached response
  })

  return cachedResponse || fetchPromise
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-trades') {
    event.waitUntil(syncPendingTrades())
  }
})

async function syncPendingTrades() {
  // TODO: Implement background sync for pending trades
  console.log('[SW] Syncing pending trades...')
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)

  const options = {
    body: event.data ? event.data.text() : 'New signal detected',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'iava-notification',
    requireInteraction: false,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Signal'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('iAVA.ai', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action)
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handler for communication with app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
})

console.log('[SW] Service worker loaded')
