'use client';

import React from 'react';
import { useRole } from '@/shared/hooks';
import type { UserRole } from '@/shared/types/auth';
import type { RolePermissions } from '@/shared/utils/roleUtils';

export interface RoleGuardProps {
  children: React.ReactNode;

  // Role-based access
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;

  // Permission-based access
  requiredPermission?: keyof RolePermissions;
  requiredPermissions?: (keyof RolePermissions)[];

  // Fallback content
  fallback?: React.ReactNode;

  // Require authentication
  requireAuth?: boolean;
}

/**
 * Component that conditionally renders content based on user roles and permissions
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredRole,
  requiredPermission,
  requiredPermissions,
  fallback = null,
  requireAuth = true,
}) => {
  const { user, hasRole, hasAnyRole, hasPermission } = useRole();

  // Check authentication requirement
  if (requireAuth && !user) {
    return <>{fallback}</>;
  }

  // Check specific role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // Check allowed roles
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  // Check single permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions requirement (all must be true)
  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(permission)
    );
    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default RoleGuard;
