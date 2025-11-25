/**
 * Authentication Service
 * Client-side authentication management
 */

import { getSessionFromCookie } from './cookie-utils';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.loadUserFromSession();
  }

  /**
   * Load user from session cookie
   */
  loadUserFromSession() {
    if (typeof window === 'undefined') return;

    try {
      const userData = getSessionFromCookie();

      if (userData && userData.email) {
        this.currentUser = userData;
      }
    } catch (error) {
      console.error('Failed to load user from session cookie:', error);
      this.currentUser = null;
    }
  }

  /**
   * Login with SSO (call backend API)
   */
  async loginWithSSO(email, password) {
    try {
      // Call backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: include cookies
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      this.currentUser = data.user;

      console.log('=== LOGIN DEBUG ===');
      console.log('Email:', this.currentUser.email);
      console.log('Role assigned:', this.currentUser.role);
      console.log('==================');

      return this.currentUser;
    } catch (error) {
      console.error('SSO login failed:', error);
      throw error;
    }
  }

  /**
   * Logout (call backend API)
   */
  async logout() {
    try {
      // Call API logout endpoint to clear server-side cookies
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Important: include cookies
      });

      if (!response.ok) {
        console.error('Logout API failed:', response.statusText);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear in-memory user even if API call fails
      this.currentUser = null;

      // Clear all cookies client-side
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    // Always try to reload from cookie if currentUser is null
    if (!this.currentUser && typeof window !== 'undefined') {
      this.loadUserFromSession();
    }
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  /**
   * Check if user has permission
   */
  hasPermission(action) {
    const user = this.getCurrentUser();
    if (!user) return false;

    const adminActions = [
      'manage_models',
      'manage_users',
      'export_reports',
      'configure_system'
    ];

    if (adminActions.includes(action)) {
      return user.role === 'admin';
    }

    return true; // Default allow for regular user actions
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
