/**
 * Authentication Service
 * Handles user authentication, session management, and role-based access
 */

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
  async authenticateUser(email, password) {
    // Validate email domain
    if (!email.endsWith('@intersnack.com') && !email.endsWith('@intersnack.com.vn')) {
      throw new Error('Please use your company email (@intersnack.com or @intersnack.com.vn)');
    }

    // Validate password
    if (password !== 'Vicc@2025') {
      throw new Error('Invalid password');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const role = this.determineRole(normalizedEmail);

    const user = {
      id: this.stableUserIdFromEmail(normalizedEmail),
      email: normalizedEmail,
      name: this.getNameFromEmail(email),
      role: role,
      department: this.getDepartmentFromEmail(email),
      employeeId: this.stableEmployeeIdFromEmail(normalizedEmail),
      createdAt: new Date().toISOString()
    };

    console.log('=== LOGIN DEBUG ===');
    console.log('Email:', user.email);
    console.log('Role assigned:', user.role);
    console.log('Department:', user.department);
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
