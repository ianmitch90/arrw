import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/app',
  '/map',
  '/messages',
  '/explore',
  '/profile',
  '/dashboard',
  '/chat'
];

// Auth routes that authenticated users should be redirected from
const AUTH_ROUTES = ['/login', '/signup'];

// Static informational pages that are always accessible
const STATIC_PAGES = [
  '/info/about',
  '/info/terms',
  '/info/privacy',
  '/info/safety',
  '/info/community-guidelines',
  '/info/faq',
  '/info/contact',
  '/info/support',
  '/info/accessibility',
  '/info/cookie-policy'
];

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Normalize the path by removing (protected) prefix
    const normalizedPath = pathname.replace('/(protected)', '');

    // Allow access to static informational pages without auth checks
    if (STATIC_PAGES.some(route => normalizedPath.startsWith(route))) {
      return NextResponse.next();
    }

    // Create response early to modify headers if needed
    const response = NextResponse.next();
    
    // Initialize Supabase client
    const supabase = createMiddlewareClient({ req: request, res: response });

    // Get current session state
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    const hasValidSession = !!session && !!user;

    // Handle unauthenticated users
    if (!hasValidSession) {
      // Allow access to auth routes
      if (AUTH_ROUTES.some(route => normalizedPath === route || normalizedPath === `/auth${route}`)) {
        return NextResponse.next();
      }

      // Redirect to login for protected routes
      if (PROTECTED_ROUTES.some(route => normalizedPath.startsWith(route))) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', normalizedPath);
        return NextResponse.redirect(redirectUrl);
      }

      return NextResponse.next();
    }

    // Handle authenticated users
    if (AUTH_ROUTES.some(route => normalizedPath === route || normalizedPath === `/auth${route}`)) {
      return NextResponse.redirect(new URL('/map', request.url));
    }

    // Add user context to headers for downstream use
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.role || 'user');
    response.headers.set('x-session-id', session.access_token);

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error, return next response to avoid infinite redirects
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/(protected)/:path*',
    '/app/:path*',
    '/map/:path*',
    '/messages/:path*',
    '/explore/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/chat/:path*',
    '/login',
    '/signup',
    '/info/:path*'
  ]
};
