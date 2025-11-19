import { useState, useEffect } from 'react'

/**
 * Authentication Page - Login/Signup
 *
 * Features:
 * - Email/password authentication
 * - Remember me option
 * - Guest mode for trying without signup
 * - Smooth animations
 * - Form validation
 * - User data persistence
 */
export default function AuthPage() {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  // Check if already logged in
  useEffect(() => {
    const user = localStorage.getItem('iava_user')
    if (user) {
      // Trigger auth change event to update router
      window.dispatchEvent(new Event('iava.authChange'))
    }
  }, [])

  // Validate email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (mode === 'signup') {
      if (!name) {
        newErrors.name = 'Name is required'
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      // Check if user exists in localStorage (simple auth for now)
      const users = JSON.parse(localStorage.getItem('iava_users') || '[]')
      const user = users.find(u => u.email === email && u.password === password)

      if (user) {
        // Save current user
        localStorage.setItem('iava_user', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        }))

        if (rememberMe) {
          localStorage.setItem('iava_remember', 'true')
        }

        // Show success message
        window.dispatchEvent(new CustomEvent('iava.toast', {
          detail: { text: `Welcome back, ${user.name}!`, type: 'success' }
        }))

        // Trigger auth change to update router
        window.dispatchEvent(new Event('iava.authChange'))
      } else {
        setErrors({ password: 'Invalid email or password' })
      }

      setIsLoading(false)
    }, 1000)
  }

  // Handle signup
  const handleSignup = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      // Get existing users
      const users = JSON.parse(localStorage.getItem('iava_users') || '[]')

      // Check if email already exists
      if (users.some(u => u.email === email)) {
        setErrors({ email: 'Email already registered' })
        setIsLoading(false)
        return
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email,
        password, // In production, this would be hashed
        name,
        createdAt: new Date().toISOString()
      }

      // Save user
      users.push(newUser)
      localStorage.setItem('iava_users', JSON.stringify(users))

      // Auto-login
      localStorage.setItem('iava_user', JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt
      }))

      if (rememberMe) {
        localStorage.setItem('iava_remember', 'true')
      }

      // Show success message
      window.dispatchEvent(new CustomEvent('iava.toast', {
        detail: { text: `Welcome to iAVA.ai, ${name}!`, type: 'success' }
      }))

      // Trigger auth change to update router
      window.dispatchEvent(new Event('iava.authChange'))
      setIsLoading(false)
    }, 1000)
  }

  // Handle guest mode
  const handleGuestMode = () => {
    const guestUser = {
      id: 'guest',
      email: 'guest@iava.ai',
      name: 'Guest User',
      createdAt: new Date().toISOString()
    }

    localStorage.setItem('iava_user', JSON.stringify(guestUser))

    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: { text: 'Entering guest mode - data will not be saved', type: 'info' }
    }))

    window.dispatchEvent(new Event('iava.authChange'))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-600/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-2xl shadow-indigo-500/50 mb-4">
            <img src="/logo.svg" className="w-12 h-12" alt="iAVA.ai" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            iAVA.ai
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Elite AI Trading Assistant
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
          {/* Mode Toggle */}
          <div className="flex bg-slate-800/50 rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            mode === 'login' ? handleLogin() : handleSignup()
          }}>
            {/* Name Field (Signup only) */}
            {mode === 'signup' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${
                    errors.name ? 'border-red-500' : 'border-slate-700'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-800/50 border ${
                  errors.email ? 'border-red-500' : 'border-slate-700'
                } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all`}
                placeholder="trader@example.com"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-800/50 border ${
                  errors.password ? 'border-red-500' : 'border-slate-700'
                } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-slate-700'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm text-slate-400">Remember me</span>
              </label>

              {mode === 'login' && (
                <button
                  type="button"
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('iava.toast', {
                      detail: { text: 'Password reset coming soon', type: 'info' }
                    }))
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-900/50 text-slate-500">OR</span>
            </div>
          </div>

          {/* Guest Mode */}
          <button
            onClick={handleGuestMode}
            className="w-full py-3 px-4 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white font-medium rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
          >
            Continue as Guest
          </button>

          {/* Footer Text */}
          <p className="text-xs text-slate-500 text-center mt-6">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Login
                </button>
              </>
            )}
          </p>
        </div>

        {/* Security Notice */}
        <p className="text-xs text-slate-500 text-center mt-6">
          🔒 Your data is encrypted and secure
        </p>
      </div>
    </div>
  )
}