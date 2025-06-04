import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid issues with environment variables
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    try {
      // Check if we have the required environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          'NEXT_PUBLIC_SUPABASE_URL is required but not found in environment variables'
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          'NEXT_PUBLIC_SUPABASE_ANON_KEY is required but not found in environment variables'
        );
      }

      console.log('Creating Supabase client with:', {
        url: supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        anonKeyLength: supabaseAnonKey?.length,
      });

      // Enhanced client configuration for production readiness
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // Security enhancements
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce', // Enhanced security with PKCE
          storage:
            typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'supabase.auth.token',
          debug: process.env.NODE_ENV === 'development',
        },
        global: {
          headers: {
            'X-Client-Info': 'pha-v2-web',
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
            process.env.NODE_ENV === 'development' ? console.log : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  return supabaseClient;
}

// Export the client getter function
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop as keyof typeof client];
  },
});

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
    await supabase.auth.getSession();

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
        checkConnection(false);
      }
    });
  }, CONNECTION_CHECK_INTERVAL);
}
