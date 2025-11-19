import { useState, useEffect } from 'react'
import App from './App.jsx'
import AuthPage from './components/AuthPage.jsx'

/**
 * Simple Router Component
 * Handles authentication routing without react-router
 */
export default function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(null) // null = loading
  const [checkAuth, setCheckAuth] = useState(0) // Force re-check

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('iava_user')
    const remember = localStorage.getItem('iava_remember')

    // If user exists and remember me is true, or user just exists
    if (user) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }

    // Listen for auth changes
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('iava_user')
      setIsAuthenticated(!!updatedUser)
    }

    window.addEventListener('storage', handleStorageChange)

    // Custom event for login/logout
    const handleAuthChange = () => {
      setCheckAuth(prev => prev + 1)
    }

    window.addEventListener('iava.authChange', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('iava.authChange', handleAuthChange)
    }
  }, [checkAuth])

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading iAVA.ai...</p>
        </div>
      </div>
    )
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // Show main app if authenticated
  return <App />
}