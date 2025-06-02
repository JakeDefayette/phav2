import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/shared/services/email';

/**
 * Test endpoint for email service functionality
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, action = 'test' } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'test':
        // Send a test email
        const testResult = await emailService.sendTestEmail(to);
        return NextResponse.json({
          action: 'test',
          result: testResult,
        });

      case 'status':
        // Check service status
        const isConfigured = emailService.isConfigured();
        const rateLimitStatus = emailService.getRateLimitStatus();
        const connectionTest = await emailService.testConnection();

        return NextResponse.json({
          action: 'status',
          configured: isConfigured,
          rateLimit: rateLimitStatus,
          connection: connectionTest,
        });

      case 'report-delivery':
        // Test report delivery email
        const reportResult = await emailService.sendReportDeliveryEmail({
          to,
          childName: 'Test Child',
          assessmentDate: new Date().toISOString(),
          downloadUrl: 'https://example.com/download/test-report',
        });
        return NextResponse.json({
          action: 'report-delivery',
          result: reportResult,
        });

      case 'report-ready':
        // Test report ready notification
        const notificationResult =
          await emailService.sendReportReadyNotification({
            to,
            firstName: 'Test User',
            reportId: 'test-report-123',
            downloadUrl: 'https://example.com/download/test-report',
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
          });
        return NextResponse.json({
          action: 'report-ready',
          result: notificationResult,
        });

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: test, status, report-delivery, or report-ready',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Email test error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get email service status
 */
export async function GET() {
  try {
    const isConfigured = emailService.isConfigured();
    const rateLimitStatus = emailService.getRateLimitStatus();

    let connectionTest = { success: false, error: 'Not tested' };
    if (isConfigured) {
      connectionTest = await emailService.testConnection();
    }

    return NextResponse.json({
      configured: isConfigured,
      rateLimit: rateLimitStatus,
      connection: connectionTest,
      usage: {
        endpoint: '/api/test-email',
        methods: ['GET', 'POST'],
        postActions: ['test', 'status', 'report-delivery', 'report-ready'],
      },
    });
  } catch (error) {
    console.error('Email status check error:', error);

    return NextResponse.json(
      {
        error: 'Failed to check email service status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
