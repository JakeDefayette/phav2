import { supabase } from '@/shared/services/supabase';
import type {
  LoginCredentials,
  RegisterCredentials,
  UserProfile,
} from '@/types/auth';

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

    // Get the user metadata for additional info
    const userMetadata = authData.user.user_metadata;

    // Transform the profile data to match the expected UserProfile type
    // Map database role values back to frontend role values
    const frontendRole =
      profileData.role === 'Chiropractor' ? 'chiropractor' : 'parent';

    const userProfile: UserProfile = {
      id: profileData.id as string,
      email: profileData.email as string,
      role: frontendRole,
      firstName: (profileData.first_name as string) || credentials.firstName,
      lastName: (profileData.last_name as string) || credentials.lastName,
      practiceId: credentials.practiceId,
      createdAt: profileData.createdAt as string,
      updatedAt: profileData.updatedAt as string,
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
    // Map database role values back to frontend role values
    const frontendRole =
      profileData.role === 'Chiropractor' ? 'chiropractor' : 'parent';

    const userProfile: UserProfile = {
      id: profileData.id as string,
      email: profileData.email as string,
      role: frontendRole,
      firstName:
        userMetadata?.firstName || (profileData.first_name as string) || '',
      lastName:
        userMetadata?.lastName || (profileData.last_name as string) || '',
      practiceId: userMetadata?.practiceId,
      createdAt: profileData.createdAt as string,
      updatedAt: profileData.updatedAt as string,
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
 * Sign out the current user
 */
export async function logoutUser(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AuthError(error.message);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('Logout failed. Please try again.');
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
      throw new AuthError(sessionError.message);
    }

    if (!session?.user) {
      return null;
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist, return null (user might need to complete registration)
      return null;
    }

    // Get the user metadata for additional info
    const userMetadata = session.user.user_metadata;

    // Transform the profile data to match the expected UserProfile type
    // Map database role values back to frontend role values
    const frontendRole =
      profileData.role === 'Chiropractor' ? 'chiropractor' : 'parent';

    const userProfile: UserProfile = {
      id: profileData.id as string,
      email: profileData.email as string,
      role: frontendRole,
      firstName:
        userMetadata?.firstName || (profileData.first_name as string) || '',
      lastName:
        userMetadata?.lastName || (profileData.last_name as string) || '',
      practiceId: userMetadata?.practiceId,
      createdAt: profileData.createdAt as string,
      updatedAt: profileData.updatedAt as string,
    };

    return userProfile;
  } catch (error) {
    // Error getting current user, return null
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session?.user;
  } catch (error) {
    // Error checking authentication, return false
    return false;
  }
}
