/**
 * RBAC (Role-Based Access Control) Rules
 * Defines permissions for user and admin roles
 */

export type UserRole = 'user' | 'admin';
export type Permission =
  | 'read:dashboard'
  | 'read:forecast'
  | 'read:market'
  | 'read:news'
  | 'read:ensemble'
  | 'create:profile'
  | 'update:profile'
  | 'delete:profile'
  | 'trigger:forecast'
  | 'admin:schedules'
  | 'admin:sources'
  | 'admin:models'
  | 'admin:logs'
  | 'admin:users';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'read:dashboard',
    'read:forecast',
    'read:market',
    'read:news',
    'read:ensemble',
    'create:profile',
    'update:profile',
    'delete:profile',
    'trigger:forecast',
  ],
  admin: [
    'read:dashboard',
    'read:forecast',
    'read:market',
    'read:news',
    'read:ensemble',
    'create:profile',
    'update:profile',
    'delete:profile',
    'trigger:forecast',
    'admin:schedules',
    'admin:sources',
    'admin:models',
    'admin:logs',
    'admin:users',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}
