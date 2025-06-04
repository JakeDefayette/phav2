import { supabase } from '@/shared/services/supabase';
import {
  validateSession,
  clearSession,
  initializeSessionTracking,
  refreshSession as refreshSessionUtil,
  getSessionInfo,
} from '@/shared/services/session';
import type {
  UserProfile,
  LoginCredentials,
  RegisterCredentials,
  UserRole,
} from '@/shared/types/auth';

// Re-export types for convenience
export type {
  LoginCredentials,
  RegisterCredentials,
  UserProfile,
} from '@/shared/types/auth';

// Additional types
export interface RegisterData extends RegisterCredentials {}
export interface AuthUser extends UserProfile {}

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * AuthService class for object-oriented usage
 */
export class AuthService {
  async register(credentials: RegisterCredentials): Promise<UserProfile> {
    return registerUser(credentials);
  }

  async login(credentials: LoginCredentials): Promise<UserProfile> {
    return loginUser(credentials);
  }

  async logout(): Promise<void> {
    return logoutUser();
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    return getCurrentUser();
  }

  async isAuthenticated(): Promise<boolean> {
    return isAuthenticated();
  }

  async refreshSession(): Promise<boolean> {
    return refreshUserSession();
  }

  async getSessionInfo() {
    return getUserSessionInfo();
  }
}

// Create singleton instance
export const authService = new AuthService();

/**
 * Register a new user with email and password
 */
export async function registerUser(
  credentials: RegisterCredentials
): Promise<UserProfile> {
  try {
    // Frontend role values match database role values now
    const dbRole = credentials.role; // 'chiropractor' or 'parent'

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: `${credentials.firstName} ${credentials.lastName}`,
          role: dbRole,
          practiceId: credentials.practiceId,
        },
      },
    });

    if (authError) {
      throw new AuthError(authError.message, authError.message);
    }

    if (!authData.user) {
      throw new AuthError('Registration failed - no user data returned');
    }

    // Initialize session tracking for new session
    initializeSessionTracking();

    // The profile will be created automatically by the database trigger
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Call ensure_user_profile as a fallback in case the trigger didn't work
    const { error: ensureError } = await supabase.rpc('ensure_user_profile', {
      user_id: authData.user.id,
    });

    if (ensureError) {
      // Profile creation fallback failed, but continue anyway
    }

    // Fetch the created profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      throw new AuthError(
        `Failed to fetch user profile: ${profileError.message}`
      );
    }

    // Transform the profile data to match the expected UserProfile type
    // Map database role values back to frontend role values
    const frontendRole = profileData.role as UserRole;

    const userProfile: UserProfile = {
      id: profileData.id as string,
      email: profileData.email as string,
      role: frontendRole,
      firstName: (profileData.first_name as string) || credentials.firstName,
      lastName: (profileData.last_name as string) || credentials.lastName,
      practiceId: credentials.practiceId,
      createdAt: profileData.created_at as string,
      updatedAt: profileData.updated_at as string,
    };

    return userProfile;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('Registration failed. Please try again.');
  }
}

/**
 * Sign in user with email and password
 */
export async function loginUser(
  credentials: LoginCredentials
): Promise<UserProfile> {
  try {
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

    if (authError) {
      throw new AuthError(authError.message, authError.message);
    }

    if (!authData.user) {
      throw new AuthError('Login failed - no user data returned');
    }

    // Initialize session tracking for new session
    initializeSessionTracking();

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      throw new AuthError(
        `Failed to fetch user profile: ${profileError.message}`
      );
    }

    // Get the user metadata for additional info
    const userMetadata = authData.user.user_metadata;

    // Transform the profile data to match the expected UserProfile type
    // Use role directly from database (practitioner, parent, admin)
    console.log('User role from database during login:', profileData.role);
    const frontendRole = profileData.role as UserRole;

    const userProfile: UserProfile = {
      id: profileData.id as string,
      email: profileData.email as string,
      role: frontendRole,
      firstName: userMetadata?.firstName || profileData.first_name || '',
      lastName: userMetadata?.lastName || profileData.last_name || '',
      practiceId: userMetadata?.practiceId,
      createdAt: profileData.created_at as string,
      updatedAt: profileData.updated_at as string,
    };

    return userProfile;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      'Login failed. Please check your credentials and try again.'
    );
  }
}

/**
 * Sign out the current user with enhanced session cleanup
 */
export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
    await clearSession(); // Clear client-side session tracking
  } catch (error) {
    // console.error('Error during logout:', error);
    // Even if Supabase signout fails, try to clear local session
    await clearSession();
    throw new AuthError('Logout failed');
  }
}

/**
 * Get the current user session
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError.message);
      throw new AuthError(sessionError.message);
    }

    if (!session?.user) {
      console.log('No active session found');
      return null;
    }

    console.log('Session found for user:', session.user.id);
    console.log('JWT token present:', !!session.access_token);
    console.log(
      'Token expires at:',
      new Date(session.expires_at! * 1000).toISOString()
    );

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.error('JWT token is expired');
      throw new AuthError('Session expired. Please log in again.');
    }

    // Fetch user profile with better error handling
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      // Log the specific error for debugging
      console.error('Profile fetch error:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
        userId: session.user.id,
      });

      // If it's an API key error, throw it to surface the real issue
      if (
        profileError.message.includes('API key') ||
        profileError.message.includes('Unauthorized')
      ) {
        throw new AuthError(
          `Failed to fetch user profile: ${profileError.message}`
        );
      }

      // For other errors, return null (user might need to complete registration)
      return null;
    }

    console.log('Profile fetched successfully for user:', session.user.id);

    // Get the user metadata for additional info
    const userMetadata = session.user.user_metadata;

    // Transform the profile data to match the expected UserProfile type
    // Use role directly from database (practitioner, parent, admin)
    const frontendRole = profileData.role as UserRole;

    const userProfile: UserProfile = {
      id: profileData.id as string,
      email: profileData.email as string,
      role: frontendRole,
      firstName: userMetadata?.firstName || profileData.first_name || '',
      lastName: userMetadata?.lastName || profileData.last_name || '',
      practiceId: userMetadata?.practiceId,
      createdAt: profileData.created_at as string,
      updatedAt: profileData.updated_at as string,
    };

    return userProfile;
  } catch (error) {
    // Error getting current user, return null
    return null;
  }
}

/**
 * Check if user is authenticated with enhanced validation
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const validation = await validateSession();
    return validation.isValid;
  } catch (error) {
    return false;
  }
}

/**
 * Refresh the current session with enhanced security
 */
export async function refreshUserSession(): Promise<boolean> {
  try {
    const refreshResult = await refreshSessionUtil();
    return refreshResult.success;
  } catch (error) {
    // console.error('Session refresh failed:', error);
    return false;
  }
}

/**
 * Get comprehensive session information
 */
export async function getUserSessionInfo() {
  try {
    return await getSessionInfo();
  } catch (error) {
    // console.error('Failed to get session info:', error);
    return null;
  }
}
