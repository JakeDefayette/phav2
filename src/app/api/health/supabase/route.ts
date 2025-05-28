import { NextRequest, NextResponse } from 'next/server';
import {
  checkSupabaseHealth,
  validateSupabaseConfig,
  testAuthFlow,
} from '@/shared/services/supabase-health';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Basic health check
    const healthCheck = await checkSupabaseHealth();

    if (!detailed) {
      return NextResponse.json({
        status: healthCheck.status,
        timestamp: healthCheck.timestamp,
        latency: healthCheck.latency,
      });
    }

    // Detailed health check
    const [configValidation, authTest] = await Promise.allSettled([
      validateSupabaseConfig(),
      testAuthFlow(),
    ]);

    const response = {
      health: healthCheck,
      config:
        configValidation.status === 'fulfilled'
          ? configValidation.value
          : {
              valid: false,
              errors: ['Failed to validate configuration'],
              warnings: [],
            },
      auth:
        authTest.status === 'fulfilled'
          ? authTest.value
          : {
              success: false,
              error: 'Failed to test auth flow',
            },
    };

    // Set appropriate status code
    const statusCode =
      healthCheck.status === 'healthy'
        ? 200
        : healthCheck.status === 'degraded'
          ? 207
          : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'validate-config':
        const validation = await validateSupabaseConfig();
        return NextResponse.json(validation);

      case 'test-auth':
        const authTest = await testAuthFlow();
        return NextResponse.json(authTest);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Health check action failed:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
