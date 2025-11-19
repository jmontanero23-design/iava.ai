import { useState, useRef, useEffect } from 'react'

/**
 * User Profile Dropdown Menu
 *
 * Features:
 * - User avatar with initial
 * - Dropdown menu with user info
 * - Quick settings access
 * - Logout functionality
 */
export default function UserProfile() {
  const [user, setUser] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Load user data
  useEffect(() => {
    const userData = localStorage.getItem('iava_user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('iava_user')
    localStorage.removeItem('iava_remember')

    // Show toast
    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: { text: 'Logged out successfully', type: 'success' }
    }))

    // Trigger auth change to show login page
    window.dispatchEvent(new Event('iava.authChange'))
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!user) return null

  const isGuest = user.id === 'guest'

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-all group"
        title={user.name}
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          isGuest
            ? 'bg-gradient-to-br from-gray-600 to-gray-700'
            : 'bg-gradient-to-br from-indigo-600 to-purple-600'
        } text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
          {getInitials(user.name)}
        </div>

        {/* Name (desktop only) */}
        <span className="hidden md:block text-sm text-slate-300 font-medium">
          {user.name}
        </span>

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50">
          {/* User Info Section */}
          <div className="p-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                isGuest
                  ? 'bg-gradient-to-br from-gray-600 to-gray-700'
                  : 'bg-gradient-to-br from-indigo-600 to-purple-600'
              } text-white shadow-lg`}>
                {getInitials(user.name)}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {user.name}
                </div>
                <div className="text-xs text-slate-400">
                  {user.email}
                </div>
                {isGuest && (
                  <div className="text-[10px] text-amber-400 mt-0.5">
                    Guest Mode
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Profile */}
            <button
              onClick={() => {
                setShowMenu(false)
                window.dispatchEvent(new CustomEvent('iava.toast', {
                  detail: { text: 'Profile settings coming soon', type: 'info' }
                }))
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors flex items-center gap-3"
            >
              <span className="text-lg">👤</span>
              <span>My Profile</span>
            </button>

            {/* Watchlists */}
            <button
              onClick={() => {
                setShowMenu(false)
                window.location.hash = '#chart'
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors flex items-center gap-3"
            >
              <span className="text-lg">👁️</span>
              <span>My Watchlists</span>
            </button>

            {/* Trade Journal */}
            <button
              onClick={() => {
                setShowMenu(false)
                window.location.hash = '#trade-journal'
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors flex items-center gap-3"
            >
              <span className="text-lg">📓</span>
              <span>Trade Journal</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                setShowMenu(false)
                window.dispatchEvent(new CustomEvent('iava.toast', {
                  detail: { text: 'Settings page coming soon', type: 'info' }
                }))
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors flex items-center gap-3"
            >
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </button>

            {/* Help */}
            <button
              onClick={() => {
                setShowMenu(false)
                window.dispatchEvent(new CustomEvent('iava.toggleTour'))
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors flex items-center gap-3"
            >
              <span className="text-lg">❓</span>
              <span>Help & Tour</span>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-slate-700" />

            {/* Upgrade (for guest users) */}
            {isGuest && (
              <button
                onClick={() => {
                  setShowMenu(false)
                  handleLogout()
                }}
                className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors flex items-center gap-3"
              >
                <span className="text-lg">⭐</span>
                <span>Create Account</span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-3"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
              <span>v0.1.3</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}