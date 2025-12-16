# Authentication System Implementation

This document describes the authentication system implemented in FCApp, based on the Trips_Management_App architecture.

## Overview

The authentication system uses **cookie-based session management** with the following features:
- Email-based login (SSO simulation)
- Role-based access control (Admin / User)
- Session timeout (30 minutes of inactivity)
- Secure cookie storage (HttpOnly + non-HttpOnly for client reading)
- Client-side session persistence

## Architecture

### Backend (Express)

**Files Created:**
1. `backend/src/infrastructure/auth/AuthService.js` - Authentication service
2. `backend/src/api/routes/auth.routes.js` - Auth API routes (login, logout, me)
3. Updated `backend/src/server.js` - Added cookie-parser middleware and auth routes

**Key Features:**
- **AuthService**: Handles user authentication, role determination, and permission checking
- **Cookie-based sessions**: Uses 3 cookies:
  - `session` (HttpOnly) - Server-side validation
  - `user_info` (non-HttpOnly) - Client-side reading
  - `session_timestamp` - Inactivity tracking
- **Admin emails**: Defined in `AuthService.ADMIN_EMAILS`
- **Session timeout**: 30 minutes (configurable via `SESSION_MAX_AGE` env var)

**API Endpoints:**
```
POST /api/v1/auth/login   - Authenticate user and create session
POST /api/v1/auth/logout  - Clear session cookies
GET  /api/v1/auth/me      - Get current user from session
```

### Frontend (Next.js)

**Files Created:**
1. `frontend/lib/authService.js` - Client-side auth service
2. `frontend/lib/cookie-utils.js` - Cookie reading utilities
3. `frontend/components/AuthProvider.js` - Auth context provider and useAuth hook
4. `frontend/pages/login.js` - Login page
5. Updated `frontend/pages/_app.js` - Wrapped app with AuthProvider
6. Updated `frontend/components/DashboardLayout.js` - Added user menu and logout

**Key Features:**
- **AuthProvider**: Provides authentication context to the entire app
- **useAuth hook**: Exposes `user`, `login()`, `logout()`, `isAuthenticated`, `isAdmin`
- **Route protection**: Redirects unauthenticated users to `/login`
- **User menu**: Shows user info, role, department, and logout button

## User Roles

### Admin Emails (Full Access):
- Users with administrative privileges in the system.

### Regular Users:
- Standard access for company employees.

### Department Detection:
Departments are auto-detected from email username:
- `admin.*`, `manager.*` → Management
- `operations.*`, `ops.*` → Operations
- `forecast.*`, `analytics.*` → Analytics
- `finance.*` → Finance
- `sales.*` → Sales
- `procurement.*` → Procurement
- Others → General

## Usage

### Login

```javascript
// In a component
import { useAuth } from '../components/AuthProvider';

function MyComponent() {
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@cashew.com', 'password');
      // User is now authenticated and redirected to /dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
}
```

### Check Authentication

```javascript
import { useAuth } from '../components/AuthProvider';

function ProtectedComponent() {
  const { isAuthenticated, isAdmin, user } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### Logout

```javascript
import { useAuth } from '../components/AuthProvider';

function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Sign Out
    </button>
  );
}
```

## Session Management

### Session Timeout
- Default: 30 minutes of inactivity
- Configurable via `SESSION_MAX_AGE` environment variable (in seconds)
- Session timestamp updated every 5 minutes during activity

### Cookie Security
- **Development**: `secure: false` (works with HTTP)
- **Production**: `secure: true` (requires HTTPS)
- **SameSite**: `lax` (protects against CSRF)
- **HttpOnly**: `true` for session cookie (prevents XSS)

## Protected Routes

The following routes require authentication:
- `/dashboard`
- `/price-forecast`
- `/market-insights`
- `/news-watch`
- `/lstm-demo`

Unauthenticated users are automatically redirected to `/login`.

## Environment Variables

### Backend (`backend/.env`)
```bash
# Session configuration
SESSION_MAX_AGE=1800              # 30 minutes in seconds
COOKIE_SECRET=your-secret-key     # Cookie signing secret

# Company domain for email validation
COMPANY_DOMAIN=@cashew.com
```

### Frontend (`frontend/.env.local`)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Installation

### Backend
```bash
cd backend
npm install  # Will install cookie-parser
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing

1. **Start backend**:
   ```bash
   cd backend && npm start
   ```

2. **Start frontend**:
   ```bash
   cd frontend && npm run dev
   ```

3. **Open browser**: http://localhost:3000

4. **Login**: Use a valid company email

5. **Check session**: User info should appear in top-right corner

6. **Logout**: Click user menu → Sign Out

## Security Notes

1. **Production Deployment**:
   - Set `COOKIE_SECRET` to a strong random string
   - Ensure HTTPS is enabled (`secure: true` cookies)
   - Set appropriate `SESSION_MAX_AGE`
   - Enable CORS only for trusted origins

2. **Password Validation**:
   - Current implementation is SSO simulation (no password check)
   - In production, integrate with actual SSO provider (OAuth, SAML, etc.)
   - Or implement secure password hashing (bcrypt, argon2)

3. **Session Storage**:
   - Current implementation uses cookies (stateless)
   - For production, consider using Redis or database for session storage
   - Implement session revocation and refresh tokens

## Troubleshooting

### "Request failed" error in apiClient.js

This error occurs when the backend is not running or not accessible. Make sure:
1. Backend is running on http://localhost:8000
2. CORS is properly configured in `backend/src/server.js`
3. `NEXT_PUBLIC_API_URL` is set correctly in frontend

### Cookies not being set

Check:
1. `credentials: 'include'` is set in fetch requests
2. CORS `credentials: true` is set in backend
3. Frontend and backend are on compatible domains (localhost is OK)

### Session expires immediately

Check:
1. `SESSION_MAX_AGE` is set to appropriate value (default: 1800 seconds)
2. `session_timestamp` cookie is being set and updated
3. Browser is not blocking cookies

## Future Enhancements
1. **Real SSO Integration**: OAuth 2.0, SAML, or OIDC
2. **Password Authentication**: Secure password hashing and validation
3. **Multi-factor Authentication**: SMS, TOTP, or hardware tokens
4. **Session Management UI**: View and revoke active sessions
5. **Audit Logging**: Track login attempts and user actions
6. **Rate Limiting**: Prevent brute force attacks
7. **Remember Me**: Long-lived refresh tokens
8. **Email Verification**: Verify user email before granting access
