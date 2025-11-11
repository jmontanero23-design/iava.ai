// Service Worker - Version 2.0
// This service worker will force clear old caches

const CACHE_VERSION = 'v2.0';
const CACHE_NAME = `iava-${CACHE_VERSION}`;

// Install event - clean up old caches
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker', CACHE_VERSION);
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - network first strategy for JavaScript files
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For JavaScript and CSS files, always fetch from network
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails, return a basic error response
        return new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // For other resources, use cache first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

console.log('[SW] Service worker loaded');
