import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // If user is authenticated
  if (session) {
    // Redirect from auth routes to map if logged in
    if (path.startsWith('/auth') || path === '/landing') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/map';
      return NextResponse.redirect(redirectUrl);
    }
    // Allow access to all other routes
    return res;
  }

  // If user is NOT authenticated
  if (!session) {
    // Allow access to auth routes and landing page
    if (path.startsWith('/auth') || path === '/landing') {
      return res;
    }

    // Redirect all other routes to landing
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/landing';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Specify which routes should be handled by middleware
export const config = {
  matcher: [
    '/app/:path*',
    '/map/:path*',
    '/auth/:path*',
    '/landing',
    '/'
    // Add other routes that need session checking here
  ]
};
