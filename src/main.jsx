import React from 'react'
import { createRoot } from 'react-dom/client'
import Router from './Router.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { initClientLogging } from './utils/logging.js'
import { registerServiceWorker, initPWA, initOfflineDetection } from './utils/pwa.js'
import './index.css'

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
