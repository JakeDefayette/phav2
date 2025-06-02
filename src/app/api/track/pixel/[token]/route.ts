import { NextRequest, NextResponse } from 'next/server';
import { emailTrackingService } from '@/shared/services/email/tracking';

interface RouteParams {
  params: {
    token: string;
  };
}

// 1x1 transparent pixel image in base64
const TRACKING_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

/**
 * GET /api/track/pixel/[token]
 * 
 * Serve tracking pixel for email open tracking.
 * Returns a 1x1 transparent PNG and records the open event.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = params;

  try {
    // Extract tracking information from request
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;

    // Process open tracking (this will record the event)
    const success = await emailTrackingService.processOpenTracking(
      token,
      userAgent,
      ipAddress
    );

    if (success) {
      console.log(`Email open tracked successfully for token: ${token}`);
    } else {
      console.warn(`Email open tracking failed for token: ${token}`);
    }

    // Always return the pixel, even if tracking failed
    // This ensures emails display correctly regardless of tracking issues
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': TRACKING_PIXEL.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Pixel tracking error:', error);
    
    // Still return the pixel to avoid breaking email display
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': TRACKING_PIXEL.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

/**
 * HEAD request for checking pixel availability
 */
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  const { token } = params;

  try {
    // Check if tracking token exists
    const trackingPixel = await emailTrackingService.getTrackingPixel(token);
    
    if (!trackingPixel) {
      return new NextResponse(null, { 
        status: 404,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Expires': '0',
        }
      });
    }

    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': TRACKING_PIXEL.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Pixel tracking HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 