import type { UserRole, UserProfile } from '@/shared/types/auth';

/**
 * Role verification utilities for user role management
 */

/**
 * Check if a user has a specific role
 */
export function hasRole(user: UserProfile | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(
  user: UserProfile | null,
  roles: UserRole[]
): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if a user is a chiropractor/practitioner
 */
export function isChiropractor(user: UserProfile | null): boolean {
  return hasRole(user, 'practitioner');
}

/**
 * Check if a user is a practitioner
 */
export function isPractitioner(user: UserProfile | null): boolean {
  return hasRole(user, 'practitioner');
}

/**
 * Check if a user is a parent
 */
export function isParent(user: UserProfile | null): boolean {
  return hasRole(user, 'parent');
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'practitioner':
      return 'Chiropractor';
    case 'parent':
      return 'Parent/Guardian';
    case 'admin':
      return 'Administrator';
    default:
      return 'Unknown Role';
  }
}

/**
 * Check if a role requires a practice ID
 */
export function roleRequiresPracticeId(role: UserRole): boolean {
  return role === 'practitioner';
}

/**
 * Validate role permissions for specific actions
 */
export interface RolePermissions {
  canCreateAssessments: boolean;
  canViewAllAssessments: boolean;
  canManagePractice: boolean;
  canViewReports: boolean;
  canManageChildren: boolean;
}

/**
 * Get permissions for a user role
 */
export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'practitioner':
      return {
        canCreateAssessments: true,
        canViewAllAssessments: true,
        canManagePractice: true,
        canViewReports: true,
        canManageChildren: false,
      };
    case 'parent':
      return {
        canCreateAssessments: false,
        canViewAllAssessments: false,
        canManagePractice: false,
        canViewReports: true,
        canManageChildren: true,
      };
    case 'admin':
      return {
        canCreateAssessments: true,
        canViewAllAssessments: true,
        canManagePractice: true,
        canViewReports: true,
        canManageChildren: true,
      };
    default:
      return {
        canCreateAssessments: false,
        canViewAllAssessments: false,
        canManagePractice: false,
        canViewReports: false,
        canManageChildren: false,
      };
  }
}

/**
 * Check if user has permission for a specific action
 */
export function hasPermission(
  user: UserProfile | null,
  permission: keyof RolePermissions
): boolean {
  if (!user) return false;
  const permissions = getRolePermissions(user.role);
  return permissions[permission];
}
