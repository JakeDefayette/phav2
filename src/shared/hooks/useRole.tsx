'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  hasRole,
  hasAnyRole,
  isChiropractor,
  isParent,
  getRoleDisplayName,
  getRolePermissions,
  hasPermission,
  type RolePermissions,
} from '@/shared/utils/roleUtils';
import type { UserRole } from '@/shared/types/auth';

/**
 * Custom hook for role-based functionality
 */
export function useRole() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canCreateAssessments: false,
        canViewAllAssessments: false,
        canManagePractice: false,
        canViewReports: false,
        canManageChildren: false,
      };
    }
    return getRolePermissions(user.role);
  }, [user]);

  const roleInfo = useMemo(() => {
    if (!user) return null;

    return {
      role: user.role,
      displayName: getRoleDisplayName(user.role),
      isChiropractor: isChiropractor(user),
      isParent: isParent(user),
    };
  }, [user]);

  return {
    user,
    roleInfo,
    permissions,

    // Role checking functions
    hasRole: (role: UserRole) => hasRole(user, role),
    hasAnyRole: (roles: UserRole[]) => hasAnyRole(user, roles),
    isChiropractor: () => isChiropractor(user),
    isParent: () => isParent(user),

    // Permission checking
    hasPermission: (permission: keyof RolePermissions) =>
      hasPermission(user, permission),

    // Convenience methods
    canCreateAssessments: permissions.canCreateAssessments,
    canViewAllAssessments: permissions.canViewAllAssessments,
    canManagePractice: permissions.canManagePractice,
    canViewReports: permissions.canViewReports,
    canManageChildren: permissions.canManageChildren,
  };
}
