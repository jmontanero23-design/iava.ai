import React from 'react'
import { createRoot } from 'react-dom/client'
import AppSimple from './AppSimple.jsx' // AI Features App
import ErrorBoundary from './ErrorBoundary.jsx'
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
      console.log('[App] PWA features enabled')
    }
  })
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppSimple />
    </ErrorBoundary>
  </React.StrictMode>
)
