/**
 * Cookie utilities for reading session from cookies
 * Client-side cookie management
 */

/**
 * Get cookie by name
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }

  return null;
}

/**
 * Get session from cookie
 * Reads from user_info cookie (non-HttpOnly, readable by JavaScript)
 */
export function getSessionFromCookie() {
  try {
    const userInfoCookie = getCookie('user_info');

    if (!userInfoCookie) {
      console.log('⚠️ No user_info cookie found');
      return null;
    }

    // Decode and parse JSON
    const decoded = decodeURIComponent(userInfoCookie);
    const session = JSON.parse(decoded);
    console.log('✅ Session loaded from cookie:', session.email, '- Role:', session.role);
    return session;
  } catch (error) {
    console.error('❌ Error parsing user_info cookie:', error);
    return null;
  }
}

/**
 * Delete cookie by name
 */
export function deleteCookie(name) {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Clear all session cookies
 */
export function clearSessionCookies() {
  if (typeof document === 'undefined') return;

  const cookiesToClear = ['session', 'session_timestamp', 'user_info'];

  cookiesToClear.forEach(cookieName => {
    deleteCookie(cookieName);
  });
}
