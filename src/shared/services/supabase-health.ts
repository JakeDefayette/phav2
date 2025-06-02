import { supabase } from './supabase';
import { supabaseServer } from './supabase-server';

export interface SupabaseHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: {
    connection: boolean;
    auth: boolean;
    database: boolean;
    realtime: boolean;
  };
  latency?: number;
  error?: string;
}

/**
 * Comprehensive health check for Supabase services
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthCheck> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  const result: SupabaseHealthCheck = {
    status: 'healthy',
    timestamp,
    checks: {
      connection: false,
      auth: false,
      database: false,
      realtime: false,
    },
  };

  try {
    // Test basic connection using a table we know exists
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    result.checks.connection = !connectionError;

    // Test database access with a simple query
    const { data: dbTest, error: dbError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    result.checks.database = !dbError;

    // Test auth service
    const { data: authTest, error: authError } =
      await supabase.auth.getSession();
    result.checks.auth = !authError;

    // Test realtime capabilities (basic check)
    try {
      const channel = supabase.channel('health-check');
      result.checks.realtime = true;
      channel.unsubscribe();
    } catch (realtimeError) {
      result.checks.realtime = false;
    }

    // Calculate latency
    result.latency = Date.now() - startTime;

    // Determine overall status
    const allChecks = Object.values(result.checks);
    const healthyChecks = allChecks.filter(Boolean).length;

    if (healthyChecks === allChecks.length) {
      result.status = 'healthy';
    } else if (healthyChecks > allChecks.length / 2) {
      result.status = 'degraded';
    } else {
      result.status = 'unhealthy';
    }
  } catch (error) {
    result.status = 'unhealthy';
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.latency = Date.now() - startTime;
  }

  return result;
}

/**
 * Validate Supabase configuration and credentials
 */
export async function validateSupabaseConfig(): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push(
      'SUPABASE_SERVICE_ROLE_KEY is not configured (admin operations may be limited)'
    );
  }

  // Test connection
  try {
    const healthCheck = await checkSupabaseHealth();
    if (healthCheck.status === 'unhealthy') {
      errors.push(`Supabase connection failed: ${healthCheck.error}`);
    } else if (healthCheck.status === 'degraded') {
      warnings.push('Some Supabase services are not responding properly');
    }
  } catch (error) {
    errors.push('Failed to perform health check');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Test authentication flow
 */
export async function testAuthFlow(): Promise<{
  success: boolean;
  error?: string;
  latency?: number;
}> {
  const startTime = Date.now();

  try {
    // Test session retrieval
    const { data: session, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }

    return {
      success: true,
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - startTime,
    };
  }
}

/**
 * Monitor real-time connection status
 */
export function createRealtimeMonitor(
  onStatusChange?: (status: string) => void
) {
  const channel = supabase.channel('connection-monitor');

  channel
    .on('system', {}, payload => {
      if (onStatusChange) {
        onStatusChange(payload.type);
      }
    })
    .subscribe(status => {
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

  return {
    unsubscribe: () => channel.unsubscribe(),
    getStatus: () => channel.state,
  };
}
