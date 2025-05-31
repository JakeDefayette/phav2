import { createClient } from '@supabase/supabase-js';
import { config } from '@/shared/config';

// Enhanced client configuration for production readiness
export const supabase = createClient(
  config.database.url,
  config.database.anon_key,
  {
    auth: {
      // Security enhancements
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Enhanced security with PKCE
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      debug: config.app.environment === 'development',
    },
    global: {
      headers: {
        'X-Client-Info': 'pha-v2-web',
        'X-Requested-With': 'XMLHttpRequest',
      },
      // Enhanced fetch configuration
      fetch: (url: RequestInfo | URL, options: RequestInit = {}) => {
        const enhancedOptions: RequestInit = {
          ...options,
          headers: {
            ...options.headers,
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          // Add timeout for all requests
          signal: options.signal || AbortSignal.timeout(30000),
        };

        return fetch(url, enhancedOptions).catch(error => {
          // Enhanced error handling
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - please check your connection');
          }
          if (error.name === 'NetworkError') {
            throw new Error(
              'Network error - please check your internet connection'
            );
          }
          throw error;
        });
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
        // Add heartbeat for connection monitoring
        heartbeatIntervalMs: 30000,
        // Reconnection settings
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
      },
      // Add error handling for realtime connections
      logger:
        config.app.environment === 'development' ? console.log : undefined,
    },
  }
);

// Enhanced error handling wrapper
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Connection state monitoring
let connectionState: 'connected' | 'disconnected' | 'connecting' =
  'disconnected';
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 60000; // 1 minute

/**
 * Monitor Supabase connection state
 */
export function getConnectionState():
  | 'connected'
  | 'disconnected'
  | 'connecting' {
  return connectionState;
}

/**
 * Check Supabase connection with caching
 */
export async function checkConnection(force = false): Promise<boolean> {
  const now = Date.now();

  if (!force && now - lastConnectionCheck < CONNECTION_CHECK_INTERVAL) {
    return connectionState === 'connected';
  }

  connectionState = 'connecting';
  lastConnectionCheck = now;

  try {
    // Simple connection test using a public table or basic auth check
    // Use auth session check instead of querying a protected table
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // For anonymous users, consider connection as working if no network error occurs
    connectionState = 'connected';
    return true;
  } catch (error) {
    console.log('Connection check failed:', error);
    connectionState = 'disconnected';
    return false;
  }
}

/**
 * Enhanced error wrapper for Supabase operations
 */
export async function withErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context?: string
): Promise<{ data: T | null; error: SupabaseError | null }> {
  try {
    const result = await operation();

    if (result.error) {
      const enhancedError = new SupabaseError(
        result.error.message || 'Operation failed',
        result.error.code,
        result.error.details,
        result.error.status
      );

      // Add context if provided
      if (context) {
        enhancedError.message = `${context}: ${enhancedError.message}`;
      }

      return { data: null, error: enhancedError };
    }

    return { data: result.data, error: null };
  } catch (error) {
    const enhancedError = new SupabaseError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'UNEXPECTED_ERROR',
      error,
      500
    );

    if (context) {
      enhancedError.message = `${context}: ${enhancedError.message}`;
    }

    return { data: null, error: enhancedError };
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on certain error types
      if (error instanceof SupabaseError) {
        if (error.statusCode === 401 || error.statusCode === 403) {
          throw error; // Don't retry auth errors
        }
      }

      if (attempt === maxRetries) {
        break; // Don't delay on final attempt
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Initialize connection monitoring
if (typeof window !== 'undefined') {
  // Don't automatically check connection on page load to avoid 401 errors for anonymous users
  // checkConnection();

  // Monitor online/offline status
  window.addEventListener('online', () => {
    // Only check connection if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkConnection(true);
      }
    });
  });
  
  window.addEventListener('offline', () => {
    connectionState = 'disconnected';
  });

  // Only do periodic connection checks for authenticated users
  setInterval(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkConnection();
      }
    });
  }, CONNECTION_CHECK_INTERVAL);
}
