import React from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import Router from './Router.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { initClientLogging } from './utils/logging.js'
import { registerServiceWorker, initPWA, initOfflineDetection } from './utils/pwa.js'
import './index.css'

// Initialize Sentry for production error tracking
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out noisy errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],

    // Don't send PII
    beforeSend(event) {
      // Remove user IP addresses
      if (event.user) {
        delete event.user.ip_address
      }
      return event
    },
  })
}

const root = createRoot(document.getElementById('root'))
initClientLogging()

// Initialize PWA features
initPWA()
initOfflineDetection()

// Register service worker
if (import.meta.env.PROD) {
  registerServiceWorker().then((registration) => {
    if (registration) {
    }
  })
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
