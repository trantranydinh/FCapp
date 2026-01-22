/**
 * Authentication Routes
 * Handles login, logout, and session management
 */

import express from 'express';
import authService from '../../infrastructure/auth/AuthService.js';
import { settings } from '../../settings.js';

const router = express.Router();

// Session configuration
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '1800'); // 30 minutes in seconds
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'cashew-forecast-secret-change-in-production';

/**
 * Get cookie configuration based on environment
 */
function getCookieConfig(isSecure = false) {
  return {
    httpOnly: true,
    secure: isSecure || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE * 1000, // Convert to milliseconds
    path: '/'
  };
}

/**
 * POST /api/v1/auth/login
 * Authenticate user and create session
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Authenticate user
    const user = await authService.authenticateUser(email, password);

    // Set session cookies
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const cookieConfig = getCookieConfig(isSecure);

    // HttpOnly cookie for server-side validation (secure)
    res.cookie('session', JSON.stringify(user), cookieConfig);

    // Non-HttpOnly cookie for client-side reading (user info only)
    res.cookie('user_info', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId
    }), {
      ...cookieConfig,
      httpOnly: false // Allow JavaScript to read this cookie
    });

    // Session timestamp for inactivity tracking
    res.cookie('session_timestamp', Date.now().toString(), cookieConfig);

    console.log('✅ Login successful, cookies set for:', user.email);
    console.log('✅ User role:', user.role);

    return res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed'
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Clear session cookies
 */
router.post('/logout', (req, res) => {
  try {
    // Clear all session-related cookies
    const cookiesToClear = ['session', 'session_timestamp', 'user_info'];
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    cookiesToClear.forEach(cookieName => {
      res.clearCookie(cookieName, {
        httpOnly: cookieName !== 'user_info',
        secure: isSecure || process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    });

    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    console.log('✅ Logout successful');

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user from session
 */
router.get('/me', (req, res) => {
  try {
    // Check for session cookie
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Parse session data
    const user = JSON.parse(sessionCookie);

    // Check session timeout
    const sessionTimestamp = req.cookies.session_timestamp;
    if (sessionTimestamp) {
      const lastActivity = parseInt(sessionTimestamp);
      const now = Date.now();
      const inactiveDuration = (now - lastActivity) / 1000; // in seconds

      if (inactiveDuration > SESSION_MAX_AGE) {
        // Session expired
        return res.status(401).json({
          success: false,
          error: 'Session expired due to inactivity'
        });
      }

      // Update session timestamp
      const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
      res.cookie('session_timestamp', Date.now().toString(), getCookieConfig(isSecure));
    }

    return res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid session'
    });
  }
});

// Helper to determine the Callback URI
const getRedirectUri = () => {
  if (process.env.AZURE_AD_REDIRECT_URI) return process.env.AZURE_AD_REDIRECT_URI;
  const baseUrl = process.env.BASE_URL || `http://localhost:${settings.port}`;
  return `${baseUrl}/api/v1/auth/azure/callback`;
};

/**
 * GET /api/v1/auth/azure/login
 * Initiate Azure AD SSO
 */
router.get('/azure/login', (req, res) => {
  const redirectUri = getRedirectUri();
  const authorizationUrl = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize` +
    `?client_id=${process.env.AZURE_AD_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_mode=query` +
    `&scope=openid%20profile%20email%20User.Read` +
    `&state=12345`; // Should specific secure state in production

  console.log('[AzureAuth] Redirecting to:', authorizationUrl);
  res.redirect(authorizationUrl);
});

/**
 * GET /api/v1/auth/azure/callback
 * Handle Azure AD Callback
 */
router.get('/azure/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    console.log('[AzureAuth] Received code, identifying user...');

    const redirectUri = getRedirectUri();

    // Exchange code for token
    const tokenUrl = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', process.env.AZURE_AD_CLIENT_ID);
    params.append('scope', 'openid profile email User.Read');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');
    params.append('client_secret', process.env.AZURE_AD_CLIENT_SECRET);


    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('[AzureAuth] Token exchange failed:', tokenData);
      throw new Error('Failed to exchange token');
    }

    const accessToken = tokenData.access_token;

    // Get User Profile
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const profile = await graphResponse.json();
    console.log('[AzureAuth] User Profile:', profile.mail || profile.userPrincipalName);

    // Authenticate/Sync User via AuthService
    const user = await authService.authenticateAzureUser(profile);

    // Set Cookies
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const cookieConfig = getCookieConfig(isSecure);

    res.cookie('session', JSON.stringify(user), cookieConfig);
    res.cookie('user_info', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      legacyId: user.legacyId // Important for frontend to see
    }), { ...cookieConfig, httpOnly: false });

    res.cookie('session_timestamp', Date.now().toString(), cookieConfig);

    // Redirect to Dashboard
    res.redirect('/dashboard');

  } catch (error) {
    console.error('[AzureAuth] Callback Error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

export default router;
