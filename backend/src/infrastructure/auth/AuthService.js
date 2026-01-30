/**
 * Authentication Service
 * Handles user authentication, session management, and role-based access
 */

import { v4 as uuidv4 } from 'uuid';
import db from '../../db/mysqlClient.js';

class AuthService {
  constructor() {
    // Define admin emails - only these emails have admin access
    this.ADMIN_EMAILS = [
      'admin@intersnack.com',
      'manager@intersnack.com',
      'operations@intersnack.com'
    ];

    // Company domain for email validation
    this.COMPANY_DOMAIN = '@intersnack.com';
  }

  /**
   * Normalize email to lowercase and trim
   */
  normalizeEmail(email) {
    return email.toLowerCase().trim();
  }

  /**
   * FNV-1a 32-bit hash for stable user ID generation
   */
  fnv1aHashHex(input) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = (hash >>> 0) * 0x01000193;
      hash = hash >>> 0;
    }
    return ('0000000' + hash.toString(16)).slice(-8);
  }

  /**
   * Generate stable user ID from email
   */
  stableUserIdFromEmail(email) {
    const hex = this.fnv1aHashHex(this.normalizeEmail(email));
    return `user-${hex}`;
  }

  /**
   * Generate stable employee ID from email
   */
  stableEmployeeIdFromEmail(email) {
    const hex = this.fnv1aHashHex(this.normalizeEmail(email));
    return `EMP${hex.slice(0, 6).toUpperCase()}`;
  }

  /**
   * Determine user role based on email
   */
  determineRole(email) {
    const normalizedEmail = this.normalizeEmail(email);

    // Check if email is in admin list
    for (const adminEmail of this.ADMIN_EMAILS) {
      if (normalizedEmail === this.normalizeEmail(adminEmail)) {
        console.log(`✅ ${email} is ADMIN`);
        return 'admin';
      }
    }

    console.log(`✅ ${email} is USER`);
    return 'user';
  }

  /**
   * Extract department from email
   */
  getDepartmentFromEmail(email) {
    const username = email.split('@')[0];

    if (username.includes('admin') || username.includes('manager')) {
      return 'Management';
    } else if (username.includes('operations') || username.includes('ops')) {
      return 'Operations';
    } else if (username.includes('forecast') || username.includes('analytics')) {
      return 'Analytics';
    } else if (username.includes('finance')) {
      return 'Finance';
    } else if (username.includes('sales')) {
      return 'Sales';
    } else if (username.includes('procurement')) {
      return 'Procurement';
    } else {
      return 'General';
    }
  }

  /**
   * Extract user name from email
   */
  getNameFromEmail(email) {
    return email.split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /**
   * Authenticate user with email (SSO simulation)
   * In production, this would integrate with actual SSO provider
   */

  /**
   * Authenticate user with Azure AD profile
   */
  async authenticateAzureUser(profile) {
    console.log('[AuthService] Authenticating Azure User:', profile.mail || profile.userPrincipalName);

    const email = this.normalizeEmail(profile.mail || profile.userPrincipalName);
    const role = this.determineRole(email);

    // 1. Sync with NEW Database (UUID)
    const userData = {
      email: email,
      name: profile.displayName || this.getNameFromEmail(email),
      role: role,
      department: this.getDepartmentFromEmail(email)
    };

    // Sync with Databases in parallel
    const [dbUser, legacyId] = await Promise.all([
      this.syncUserWithDatabase(userData),
      this.syncUserWithLegacyTable(userData)
    ]);

    const user = {
      id: dbUser.id || this.stableUserIdFromEmail(email),
      legacyId: legacyId, // IMPORTANT: Integer ID for Stored Procedures
      email: email,
      name: userData.name,
      role: role,
      department: userData.department,
      provider: 'azure-ad',
      azureId: profile.id
    };

    return user;
  }

  /**
   * Sync user with main application database (users table - UUID)
   */
  async syncUserWithDatabase(userData) {
    if (!db) {
      console.warn('[AuthService] DB client not available, skipping sync');
      return {};
    }

    try {
      // Check if user exists
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [userData.email]);

      if (rows.length > 0) {
        // Update updated_at (schema doesn't have last_login_at)
        await db.query('UPDATE users SET updated_at = NOW() WHERE id = ?', [rows[0].id]);
        return rows[0];
      } else {
        // Insert new user
        // Schema: id, email, name, role, created_at, updated_at
        const newId = uuidv4();
        const insertQuery = `
                INSERT INTO users (id, email, name, role, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            `;
        await db.query(insertQuery, [
          newId,
          userData.email,
          userData.name,
          userData.role
        ]);
        return { id: newId, ...userData };
      }
    } catch (error) {
      console.error('[AuthService] DB Sync Error:', error.message);
      return {};
    }
  }

  /**
   * Sync user with LEGACY database (PTool_users table - INT ID)
   * This ensures compatibility with existing Stored Procedures
   */
  async syncUserWithLegacyTable(userData) {
    if (!db) return 1;

    try {
      const { email, name, role, department } = userData;
      const username = email.split('@')[0];

      // 1. Check existence
      const selectQuery = 'SELECT id FROM PTool_users WHERE email = ?';
      const [rows] = await db.query(selectQuery, [email]);

      if (rows && rows.length > 0) {
        const existingId = rows[0].id;
        // Update login time
        await db.query('UPDATE PTool_users SET last_login = NOW() WHERE id = ?', [existingId]);
        console.log(`[AuthService] User exists in LEGACY DB. ID: ${existingId}`);
        return existingId;
      }

      // 2. User does not exist - INSERT new user
      // Map role to valid ENUM ('viewer','editor','admin')
      // Defaulting to 'editor' if role is 'user' to satisfy ENUM constraint
      let legacyRole = role === 'admin' ? 'admin' : 'editor';

      console.log(`[AuthService] Syncing new user to LEGACY DB. Role mapped: ${role} -> ${legacyRole}`);

      const insertQuery = `
        INSERT INTO PTool_users 
        (username, email, full_name, role, department, password_hash, is_active, last_login, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())
      `;

      const [result] = await db.query(insertQuery, [
        username,
        email,
        name,
        legacyRole,
        department || 'General',
        'SSO_LOGIN_NO_PASS'
      ]);

      console.log(`[AuthService] Created new user in LEGACY DB. ID: ${result.insertId}`);
      return result.insertId;

    } catch (error) {
      console.error('[AuthService] CRITICAL Legacy DB Sync Error:', error);
      // Fallback: Return 1 (likely Admin) to prevent SP failure if sync fails
      return 1;
    }
  }

  /**
   * Authenticate user with email (Manual Login)
   */
  async authenticateUser(email, password) {
    // Validate email domain
    if (!email.endsWith('@intersnack.com') && !email.endsWith('@intersnack.com.vn')) {
      throw new Error('Please use your company email (@intersnack.com or @intersnack.com.vn)');
    }

    // Validate password (FIXED PASSWORD FOR DEMO - Upgrade to Hash in Production)
    const validPassword = process.env.ADMIN_PASSWORD;
    if (password !== validPassword) {
      throw new Error('Invalid password');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const role = this.determineRole(normalizedEmail);

    // User Data Object
    const userData = {
      email: normalizedEmail,
      name: this.getNameFromEmail(email),
      role: role,
      department: this.getDepartmentFromEmail(email)
    };

    // SYNC DBs in parallel to reduce wait time if DB is slow or unreachable
    const [dbUser, legacyId] = await Promise.all([
      this.syncUserWithDatabase(userData),
      this.syncUserWithLegacyTable(userData)
    ]);

    const user = {
      id: dbUser.id || this.stableUserIdFromEmail(normalizedEmail),
      legacyId: legacyId, // IMPORTANT
      email: normalizedEmail,
      name: userData.name,
      role: role,
      department: userData.department,
      employeeId: this.stableEmployeeIdFromEmail(normalizedEmail),
      createdAt: new Date().toISOString()
    };

    console.log('=== LOGIN DEBUG ===');
    console.log('Email:', user.email);
    console.log('Legacy ID:', user.legacyId);
    console.log('Role:', user.role);
    console.log('==================');

    return user;
  }


  /**
   * Check if user has permission for specific action
   */
  hasPermission(user, action) {
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
const authService = new AuthService();
export default authService;
