/**
 * Authentication Provider
 * Provides authentication context to the app
 */

import { useEffect, useRef, createContext, useContext, useState } from 'react';
import { useRouter } from 'next/router';
import authService from '../lib/authService';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * AuthProvider component
 * Wraps the app and provides authentication state
 */
export function AuthProvider({ children }) {
  const router = useRouter();
  const isChecking = useRef(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (isChecking.current) return;

    const checkAuth = async () => {
      isChecking.current = true;

      try {
        const user = authService.getCurrentUser();
        const pathname = router.pathname;

        // If on protected route without auth
        if (!user && (pathname === '/' || pathname.startsWith('/dashboard') || pathname.startsWith('/price-forecast') || pathname.startsWith('/market-insights') || pathname.startsWith('/news-watch') || pathname.startsWith('/lstm-demo'))) {
          await router.push('/login');
          return;
        }

        // If on login page while authenticated
        if (user && pathname === '/login') {
          await router.push('/');
          return;
        }
      } finally {
        isChecking.current = false;
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router.pathname]);

  // Show nothing or loading spinner while checking auth
  if (isLoading) {
    return null; // Or a loading spinner component
  }

  return <AuthContext.Provider value={authService}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook
 * Provides authentication methods and state
 */
export function useAuth() {
  const router = useRouter();
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  const login = async (email, password) => {
    try {
      const user = await authService.loginWithSSO(email, password);

      // Redirect to home page (section selector)
      router.replace('/');

      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();

      // Hard redirect to clear any cached state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect anyway
      window.location.href = '/login';
    }
  };

  const user = authService.getCurrentUser();

  return {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    hasPermission: (action) => authService.hasPermission(action)
  };
}
