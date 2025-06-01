export type UserRole = 'practitioner' | 'parent' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  practiceId?: string; // For chiropractors
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: UserRole;
  practiceId?: string;
}

// Legacy type alias for backward compatibility
export type ChiropractorRole = 'practitioner';
export const CHIROPRACTOR_ROLE: ChiropractorRole = 'practitioner';
