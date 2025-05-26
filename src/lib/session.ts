import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

// Session configuration
export const SESSION_CONFIG = {
  // Session timeout in milliseconds (default: 24 hours)
  TIMEOUT_DURATION: 24 * 60 * 60 * 1000,
  // Refresh threshold in milliseconds (refresh when 5 minutes left)
  REFRESH_THRESHOLD: 5 * 60 * 1000,
  // Maximum session duration before forced re-authentication (7 days)
  MAX_SESSION_DURATION: 7 * 24 * 60 * 60 * 1000,
  // Storage keys
  STORAGE_KEYS: {
    SESSION_START: 'session_start_time',
    LAST_ACTIVITY: 'last_activity_time',
    REFRESH_COUNT: 'refresh_count',
  },
} as const;

export interface SessionInfo {
  session: Session | null;
  user: User | null;
  isExpired: boolean;
  timeUntilExpiry: number;
  needsRefresh: boolean;
  sessionAge: number;
}

/**
 * Get comprehensive session information
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return {
      session: null,
      user: null,
      isExpired: true,
      timeUntilExpiry: 0,
      needsRefresh: false,
      sessionAge: 0,
    };
  }

  const now = Date.now();
  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
  const timeUntilExpiry = expiresAt - now;
  const isExpired = timeUntilExpiry <= 0;
  const needsRefresh =
    timeUntilExpiry < SESSION_CONFIG.REFRESH_THRESHOLD && timeUntilExpiry > 0;

  // Calculate session age
  const sessionStart = getSessionStartTime();
  const sessionAge = sessionStart ? now - sessionStart : 0;

  return {
    session,
    user: session.user,
    isExpired,
    timeUntilExpiry,
    needsRefresh,
    sessionAge,
  };
}

/**
 * Initialize session tracking
 */
export function initializeSessionTracking(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();

  // Set session start time if not already set
  if (!localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_START)) {
    localStorage.setItem(
      SESSION_CONFIG.STORAGE_KEYS.SESSION_START,
      now.toString()
    );
  }

  // Update last activity time
  updateLastActivity();

  // Set up activity listeners
  setupActivityListeners();
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  localStorage.setItem(
    SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY,
    now.toString()
  );
}

/**
 * Get session start time
 */
export function getSessionStartTime(): number | null {
  if (typeof window === 'undefined') return null;

  const startTime = localStorage.getItem(
    SESSION_CONFIG.STORAGE_KEYS.SESSION_START
  );
  return startTime ? parseInt(startTime, 10) : null;
}

/**
 * Get last activity time
 */
export function getLastActivityTime(): number | null {
  if (typeof window === 'undefined') return null;

  const lastActivity = localStorage.getItem(
    SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY
  );
  return lastActivity ? parseInt(lastActivity, 10) : null;
}

/**
 * Check if session has timed out due to inactivity
 */
export function isSessionTimedOut(): boolean {
  const lastActivity = getLastActivityTime();
  if (!lastActivity) return false;

  const now = Date.now();
  const timeSinceLastActivity = now - lastActivity;

  return timeSinceLastActivity > SESSION_CONFIG.TIMEOUT_DURATION;
}

/**
 * Check if session has exceeded maximum duration
 */
export function isSessionTooOld(): boolean {
  const sessionStart = getSessionStartTime();
  if (!sessionStart) return false;

  const now = Date.now();
  const sessionAge = now - sessionStart;

  return sessionAge > SESSION_CONFIG.MAX_SESSION_DURATION;
}

/**
 * Refresh session with enhanced security
 */
export async function refreshSession(): Promise<{
  success: boolean;
  session: Session | null;
  error?: string;
}> {
  try {
    // Check if session is too old for refresh
    if (isSessionTooOld()) {
      await clearSession();
      return {
        success: false,
        session: null,
        error: 'Session too old, please log in again',
      };
    }

    // Attempt to refresh the session
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      await clearSession();
      return {
        success: false,
        session: null,
        error: error.message,
      };
    }

    if (data.session) {
      // Update activity tracking
      updateLastActivity();

      // Increment refresh count for monitoring
      incrementRefreshCount();

      return {
        success: true,
        session: data.session,
      };
    }

    return {
      success: false,
      session: null,
      error: 'No session returned from refresh',
    };
  } catch (error) {
    await clearSession();
    return {
      success: false,
      session: null,
      error: 'Session refresh failed',
    };
  }
}

/**
 * Clear all session data
 */
export async function clearSession(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Clear Supabase session
  await supabase.auth.signOut();

  // Clear local storage
  Object.values(SESSION_CONFIG.STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear any session cookies
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.includes('supabase')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
}

/**
 * Validate current session
 */
export async function validateSession(): Promise<{
  isValid: boolean;
  session: Session | null;
  reason?: string;
}> {
  // Check for inactivity timeout
  if (isSessionTimedOut()) {
    await clearSession();
    return {
      isValid: false,
      session: null,
      reason: 'Session timed out due to inactivity',
    };
  }

  // Check for maximum session age
  if (isSessionTooOld()) {
    await clearSession();
    return {
      isValid: false,
      session: null,
      reason: 'Session exceeded maximum duration',
    };
  }

  // Get current session info
  const sessionInfo = await getSessionInfo();

  if (sessionInfo.isExpired) {
    await clearSession();
    return {
      isValid: false,
      session: null,
      reason: 'Session token expired',
    };
  }

  if (sessionInfo.needsRefresh) {
    const refreshResult = await refreshSession();
    if (!refreshResult.success) {
      return {
        isValid: false,
        session: null,
        reason: refreshResult.error || 'Failed to refresh session',
      };
    }
    return {
      isValid: true,
      session: refreshResult.session,
    };
  }

  // Update activity on successful validation
  updateLastActivity();

  return {
    isValid: true,
    session: sessionInfo.session,
  };
}

/**
 * Set up activity listeners for session management
 */
function setupActivityListeners(): void {
  if (typeof window === 'undefined') return;

  const events = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ];

  const activityHandler = () => {
    updateLastActivity();
  };

  // Add event listeners
  events.forEach(event => {
    document.addEventListener(event, activityHandler, true);
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    events.forEach(event => {
      document.removeEventListener(event, activityHandler, true);
    });
  });
}

/**
 * Increment refresh count for monitoring
 */
function incrementRefreshCount(): void {
  if (typeof window === 'undefined') return;

  const currentCount = parseInt(
    localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.REFRESH_COUNT) || '0',
    10
  );
  localStorage.setItem(
    SESSION_CONFIG.STORAGE_KEYS.REFRESH_COUNT,
    (currentCount + 1).toString()
  );
}

/**
 * Get refresh count for monitoring
 */
export function getRefreshCount(): number {
  if (typeof window === 'undefined') return 0;

  return parseInt(
    localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.REFRESH_COUNT) || '0',
    10
  );
}
