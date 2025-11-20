/**
 * Authentication Hook
 * PhD Elite+++ Quality Auth Management
 */

import React, { useState, useEffect, createContext, useContext } from 'react';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('iava_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('iava_token');
        localStorage.removeItem('iava_session');
      }
    } catch (error) {
      console.error('[Auth] Check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (email, password, name) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token and session
      localStorage.setItem('iava_token', data.token);
      localStorage.setItem('iava_session', data.sessionId);

      setUser(data.user);

      // Notify app of auth change
      window.dispatchEvent(new Event('iava.authChange'));

      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and session
      localStorage.setItem('iava_token', data.token);
      localStorage.setItem('iava_session', data.sessionId);

      setUser(data.user);

      // Notify app of auth change
      window.dispatchEvent(new Event('iava.authChange'));

      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Could call logout endpoint here to invalidate session on server

      // Clear local storage
      localStorage.removeItem('iava_token');
      localStorage.removeItem('iava_session');
      localStorage.removeItem('iava_user'); // Clear old localStorage auth

      setUser(null);

      // Notify app of auth change
      window.dispatchEvent(new Event('iava.authChange'));

      return { success: true };
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user settings
  const updateSettings = async (settings) => {
    try {
      const token = localStorage.getItem('iava_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setUser(prev => ({ ...prev, settings: data.settings }));

      return { success: true };
    } catch (error) {
      console.error('[Auth] Settings update failed:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    checkAuth,
    updateSettings,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// HOC for protected routes
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      );
    }

    if (!user) {
      // Redirect to login or show auth page
      return null;
    }

    return <Component {...props} />;
  };
}