'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/shared/services/supabase';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  AuthError,
} from '@/shared/services/auth';
import type {
  AuthState,
  UserProfile,
  LoginCredentials,
  RegisterCredentials,
} from '@/shared/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (mounted) {
          setState({
            user,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            user: null,
            loading: false,
            error:
              error instanceof Error ? error.message : 'Authentication error',
          }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const user = await getCurrentUser();
          setState({
            user,
            loading: false,
            error: null,
          });
        } catch (error) {
          setState({
            user: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load user profile',
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const user = await loginUser(credentials);
      setState({
        user,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error instanceof AuthError ? error.message : 'Login failed',
      });
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const user = await registerUser(credentials);
      setState({
        user,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error:
          error instanceof AuthError ? error.message : 'Registration failed',
      });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await logoutUser();
      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof AuthError ? error.message : 'Logout failed',
      }));
      throw error;
    }
  };

  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
