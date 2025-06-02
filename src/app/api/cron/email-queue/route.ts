import { NextRequest, NextResponse } from 'next/server';
import { emailScheduler } from '@/features/dashboard/services/emailScheduler';

// This API route will be called by external cron services to process email queue
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (optional - use API key or other auth method)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get current queue metrics before processing
    const beforeMetrics = emailScheduler.getMetrics();
    
    // Process the email queue manually (this triggers the processing)
    // The emailScheduler automatically processes emails, but we can also trigger manually
    const healthStatus = emailScheduler.getHealthStatus();
    const currentMetrics = emailScheduler.getMetrics();

    return NextResponse.json({
      success: true,
      message: 'Email queue processing triggered',
      metrics: {
        before: beforeMetrics,
        current: currentMetrics
      },
      healthStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email queue cron job error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// Optional: Support GET for health checking
export async function GET() {
  try {
    const healthStatus = emailScheduler.getHealthStatus();
    const metrics = emailScheduler.getMetrics();

    return NextResponse.json({
      status: 'healthy',
      emailScheduler: {
        healthStatus,
        metrics
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email queue health check error:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 