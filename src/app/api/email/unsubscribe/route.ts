import { NextRequest, NextResponse } from 'next/server';
import { emailComplianceService } from '@/shared/services/email/compliance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, reason, userAgent } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get client IP address for audit trail
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded
      ? forwarded.split(',')[0]
      : request.headers.get('x-real-ip') || 'unknown';

    // Use the compliance service to handle unsubscribe
    const result = await emailComplianceService.unsubscribeByToken({
      token,
      reason,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      email: result.email,
      practiceId: result.practiceId,
      message: 'Successfully unsubscribed from email list',
    });
  } catch (error) {
    console.error('Error processing unsubscribe request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
