import App from './App.jsx'
import AuthPage from './components/AuthPage.jsx'
import { useAuth } from './hooks/useAuth.jsx'

/**
 * Simple Router Component
 * Handles authentication routing with JWT
 */
export default function Router() {
  const { user, loading } = useAuth()

  // Loading state
  if (loading) {
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
  if (!user) {
    return <AuthPage />
  }

  // Show main app if authenticated
  return <App />
}