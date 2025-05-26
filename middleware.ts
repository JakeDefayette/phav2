import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard'];

// Define auth routes that should redirect if already authenticated
const authRoutes = ['/auth/login', '/auth/register'];

// Define role-based route restrictions
const roleBasedRoutes = {
  chiropractor: ['/dashboard/practice', '/dashboard/assessments/create'],
  parent: ['/dashboard/children', '/dashboard/assessments/view'],
} as const;

type UserRole = 'chiropractor' | 'parent';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get the current session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Handle session errors
  if (sessionError) {
    console.error('Session error in middleware:', sessionError);
    // Clear any corrupted session data
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');

    // Redirect to login if on protected route
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // Check if user is on a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if user is on an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Handle protected routes
  if (isProtectedRoute) {
    if (!session) {
      // No session, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if session is close to expiring (within 5 minutes)
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          // Redirect to login if refresh fails
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('redirectTo', pathname);
          return NextResponse.redirect(loginUrl);
        }
      } else if (timeUntilExpiry <= 0) {
        // Session has expired
        await supabase.auth.signOut();
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Check role-based route restrictions
    if (session.user) {
      // Get user profile to check role
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        // If we can't get the profile, redirect to login
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (profileData) {
        // Map database role to frontend role
        const userRole: UserRole =
          profileData.role === 'Chiropractor' ? 'chiropractor' : 'parent';

        // Check if user is trying to access a role-restricted route
        for (const [role, routes] of Object.entries(roleBasedRoutes)) {
          const restrictedRoutes = routes as readonly string[];
          const isAccessingRestrictedRoute = restrictedRoutes.some(route =>
            pathname.startsWith(route)
          );

          if (isAccessingRestrictedRoute && userRole !== role) {
            // User doesn't have the required role, redirect to unauthorized page
            return NextResponse.redirect(new URL('/unauthorized', request.url));
          }
        }
      }
    }
  }

  // Handle auth routes when user is already authenticated
  if (isAuthRoute && session) {
    // User is already logged in, redirect to dashboard or specified redirect
    const redirectTo =
      request.nextUrl.searchParams.get('redirectTo') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
