import { NextRequest, NextResponse } from 'next/server';
import { emailTrackingService } from '@/shared/services/email/tracking';

interface RouteParams {
  params: {
    token: string;
  };
}

/**
 * GET /api/track/click/[token]
 * 
 * Handle email click tracking and redirect to original URL.
 * Records click event in analytics and redirects user to intended destination.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = params;

  try {
    // Extract tracking information from request
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;

    // Process click tracking and get original URL
    const originalUrl = await emailTrackingService.processClickTracking(
      token,
      userAgent,
      ipAddress
    );

    if (!originalUrl) {
      console.warn(`Click tracking failed - invalid token: ${token}`);
      
      // Redirect to a default page or show error
      return NextResponse.redirect(
        new URL('/tracking-error?reason=invalid-link', request.url),
        { status: 302 }
      );
    }

    // Validate the original URL before redirecting
    if (!isValidRedirectUrl(originalUrl)) {
      console.warn(`Click tracking blocked - invalid URL: ${originalUrl}`);
      
      return NextResponse.redirect(
        new URL('/tracking-error?reason=invalid-destination', request.url),
        { status: 302 }
      );
    }

    console.log(`Click tracked successfully - redirecting to: ${originalUrl}`);

    // Redirect to original URL
    return NextResponse.redirect(originalUrl, { status: 302 });

  } catch (error) {
    console.error('Click tracking error:', error);
    
    // Redirect to error page with fallback
    return NextResponse.redirect(
      new URL('/tracking-error?reason=server-error', request.url),
      { status: 302 }
    );
  }
}

/**
 * Validate that the redirect URL is safe and allowed
 */
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Allow common protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return false;
      }
      
      // Block private IP ranges
      const ipRanges = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
      ];
      
      if (ipRanges.some(range => range.test(hostname))) {
        return false;
      }
    }

    // Additional validation rules can be added here
    // - Whitelist specific domains
    // - Block known malicious domains
    // - Check against URL reputation services

    return true;
  } catch {
    return false;
  }
}

/**
 * HEAD request for preflight checks
 */
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  const { token } = params;

  try {
    // Check if tracking token exists without processing the click
    const trackingUrl = await emailTrackingService.getTrackingUrl(token);
    
    if (!trackingUrl) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Click tracking HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
} 