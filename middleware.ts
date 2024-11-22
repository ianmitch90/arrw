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
  const { pathname } = request.nextUrl;

  // Allow access to static informational pages
  if (STATIC_PAGES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create response early to modify headers if needed
  const response = NextResponse.next();
  
  // Get auth data from request headers
  const authHeader = request.headers.get('authorization');
  const hasAuthHeader = !!authHeader && authHeader.startsWith('Bearer ');
  
  // Initialize Supabase client
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  try {
    // Check session state
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (AUTH_ROUTES.some(route => pathname === route || pathname === `/auth${route}`)) {
        return NextResponse.next();
      }
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check age verification for protected routes
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      // Check both verification sources in parallel
      const [{ data: verification }, { data: userData }] = await Promise.all([
        supabase
          .from('age_verifications')
          .select('verified, acknowledged')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('users')
          .select('status')
          .eq('id', user.id)
          .single()
      ]);

      // If they haven't even acknowledged the age check, send them to login
      if (!verification?.acknowledged) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // If they've acknowledged but not verified, send them to verify-age
      if (!verification?.verified) {
        return NextResponse.redirect(new URL('/verify-age', request.url));
      }
    }

    if (AUTH_ROUTES.some(route => pathname === route || pathname === `/auth${route}`)) {
      return NextResponse.redirect(new URL('/map', request.url));
    }

    // Add user context to headers for downstream use
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.role || 'user');
    return response;
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // On error in protected route, redirect to login
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    return response;
  }
}

export const config = {
  matcher: [
    '/app/:path*',
    '/map/:path*',
    '/messages/:path*',
    '/explore/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/chat/:path*',
    '/login',
    '/signup',
    '/auth/:path*',
  ],
};
