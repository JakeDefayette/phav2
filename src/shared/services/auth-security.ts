import { supabase } from './supabase';

// Rate limiting configuration
const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  REGISTER_ATTEMPTS: 3,
  PASSWORD_RESET: 3,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
} as const;

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface SecurityConfig {
  enableRateLimit: boolean;
  enableIPBlocking: boolean;
  enablePasswordPolicy: boolean;
  enableSessionValidation: boolean;
}

export class AuthSecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthSecurityError';
  }
}

/**
 * Rate limiting for authentication operations
 */
export function checkRateLimit(
  identifier: string,
  operation: keyof typeof RATE_LIMITS
): { allowed: boolean; retryAfter?: number } {
  const key = `${operation}:${identifier}`;
  const now = Date.now();
  const limit = RATE_LIMITS[operation];

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First attempt or window has reset
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMITS.WINDOW_MS,
    });
    return { allowed: true };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);

  return { allowed: true };
}

/**
 * Enhanced password validation
 */
export function validatePasswordSecurity(password: string): {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Common password patterns
  const commonPatterns = [/^password/i, /^123456/, /^qwerty/i, /^abc123/i];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    errors.push('Password cannot contain common patterns');
    score = Math.max(0, score - 2);
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 5) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Session security validation
 */
export async function validateSessionSecurity(): Promise<{
  valid: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    const { data: session, error } = await supabase.auth.getSession();

    if (error) {
      issues.push('Failed to retrieve session');
      return { valid: false, issues, recommendations };
    }

    if (!session?.session) {
      return { valid: true, issues, recommendations }; // No session is valid
    }

    const { session: userSession } = session;
    const now = Math.floor(Date.now() / 1000);

    // Check session expiration
    if (userSession.expires_at && userSession.expires_at < now) {
      issues.push('Session has expired');
    }

    // Check refresh token expiration
    const refreshTokenExp = userSession.refresh_token
      ? extractTokenExpiration(userSession.refresh_token)
      : null;

    if (refreshTokenExp && refreshTokenExp < now) {
      issues.push('Refresh token has expired');
    }

    // Check if session is close to expiring (within 5 minutes)
    if (userSession.expires_at && userSession.expires_at - now < 300) {
      recommendations.push('Session will expire soon, consider refreshing');
    }

    // Check user metadata for security flags
    const user = userSession.user;
    if (user.user_metadata?.security_flags) {
      const flags = user.user_metadata.security_flags;
      if (flags.force_password_reset) {
        issues.push('Password reset required');
      }
      if (flags.suspicious_activity) {
        recommendations.push('Account flagged for suspicious activity');
      }
    }
  } catch (error) {
    issues.push('Session validation failed');
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Sanitize authentication errors for client consumption
 */
export function sanitizeAuthError(error: any): {
  message: string;
  code: string;
  retryable: boolean;
} {
  // Map of internal errors to user-friendly messages
  const errorMap: Record<string, { message: string; retryable: boolean }> = {
    'Invalid login credentials': {
      message: 'Invalid email or password',
      retryable: true,
    },
    'Email not confirmed': {
      message: 'Please check your email and confirm your account',
      retryable: false,
    },
    'Too many requests': {
      message: 'Too many attempts. Please try again later',
      retryable: true,
    },
    'Signup disabled': {
      message: 'Account registration is currently unavailable',
      retryable: false,
    },
    'User already registered': {
      message: 'An account with this email already exists',
      retryable: false,
    },
  };

  const errorMessage = error?.message || 'An unknown error occurred';
  const mapped = errorMap[errorMessage];

  if (mapped) {
    return {
      message: mapped.message,
      code: errorMessage.toLowerCase().replace(/\s+/g, '_'),
      retryable: mapped.retryable,
    };
  }

  // Default sanitized error
  return {
    message: 'Authentication failed. Please try again',
    code: 'auth_failed',
    retryable: true,
  };
}

/**
 * Extract expiration time from JWT token
 */
function extractTokenExpiration(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload.exp || null;
  } catch {
    return null;
  }
}

/**
 * Generate secure session metadata
 */
export function generateSessionMetadata(
  request?: Request
): Record<string, any> {
  const metadata: Record<string, any> = {
    timestamp: new Date().toISOString(),
    client: 'pha-v2-web',
  };

  if (request) {
    // Extract safe headers for session tracking
    const userAgent = request.headers.get('user-agent');
    const acceptLanguage = request.headers.get('accept-language');

    if (userAgent) {
      metadata.userAgent = userAgent.substring(0, 200); // Limit length
    }

    if (acceptLanguage) {
      metadata.language = acceptLanguage.split(',')[0];
    }
  }

  return metadata;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimit(): void {
  const now = Date.now();

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up rate limit store every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}
