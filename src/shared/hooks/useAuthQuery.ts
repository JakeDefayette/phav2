'use client';

/**
 * Authentication Query Hooks
 *
 * React Query hooks for managing authentication state
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/shared/config/queryClient';
import { AuthService } from '@/shared/services';
import { withErrorHandling } from '@/shared/utils/errorHandler';
import type {
  LoginCredentials,
  RegisterCredentials,
  UserProfile,
} from '@/shared/types';

/**
 * Hook to get current user session
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: QueryKeys.auth.user(),
    queryFn: () =>
      withErrorHandling('getCurrentUser', async () => {
        const authService = new AuthService();
        return await authService.getCurrentUser();
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error && 'statusCode' in error && error.statusCode === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to get current session
 */
export function useSession() {
  return useQuery({
    queryKey: QueryKeys.auth.session(),
    queryFn: () =>
      withErrorHandling('getSession', async () => {
        const authService = new AuthService();
        return await authService.getSessionInfo();
      }),
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry session checks
  });
}

/**
 * Hook to login user
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      withErrorHandling('login', async () => {
        const authService = new AuthService();
        return await authService.login(credentials);
      }),
    onSuccess: user => {
      // Update user cache
      queryClient.setQueryData(QueryKeys.auth.user(), user);

      // Invalidate other auth-related queries
      queryClient.invalidateQueries({ queryKey: QueryKeys.auth.all });
    },
    onError: error => {
      console.error('Login failed:', error);

      // Clear any stale auth data on login failure
      queryClient.removeQueries({ queryKey: QueryKeys.auth.all });
    },
  });
}

/**
 * Hook to register new user
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      withErrorHandling('register', async () => {
        const authService = new AuthService();
        return await authService.register(credentials);
      }),
    onSuccess: user => {
      // Update user cache if registration includes auto-login
      queryClient.setQueryData(QueryKeys.auth.user(), user);
    },
    onError: error => {
      console.error('Registration failed:', error);
    },
  });
}

/**
 * Hook to logout user
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      withErrorHandling('logout', async () => {
        const authService = new AuthService();
        await authService.logout();
      }),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
    onError: error => {
      console.error('Logout failed:', error);

      // Still clear auth data even if logout request failed
      queryClient.removeQueries({ queryKey: QueryKeys.auth.all });
    },
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<UserProfile>) =>
      withErrorHandling('updateProfile', async () => {
        // TODO: Implement updateProfile method in AuthService
        throw new Error('updateProfile method not implemented in AuthService');
      }),
    onSuccess: updatedUser => {
      queryClient.setQueryData(QueryKeys.auth.user(), updatedUser);
      queryClient.invalidateQueries({ queryKey: QueryKeys.auth.all });
    },
    onError: error => {
      console.error('Profile update failed:', error);
    },
  });
}

/**
 * Hook to reset password
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      withErrorHandling('resetPassword', async () => {
        // TODO: Implement resetPassword method in AuthService
        throw new Error('resetPassword method not implemented in AuthService');
      }),
    onError: error => {
      console.error('Password reset failed:', error);
    },
  });
}

/**
 * Hook to update password
 */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) =>
      withErrorHandling('updatePassword', async () => {
        // TODO: Implement updatePassword method in AuthService
        throw new Error('updatePassword method not implemented in AuthService');
      }),
    onError: error => {
      console.error('Password update failed:', error);
    },
  });
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}

/**
 * Hook to check user role
 */
export function useUserRole() {
  const { data: user } = useCurrentUser();
  return {
    role: user?.role,
    isChiropractor: user?.role === 'chiropractor',
    isParent: user?.role === 'parent',
  };
}
