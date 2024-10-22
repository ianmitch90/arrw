import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/utils/supabase/client';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Get JWT from Authorization header
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  const session = token ? await auth.getSession() : null;

  const path = req.nextUrl.pathname;

  // If user is authenticated
  if (session) {
    // Redirect from auth routes to map if logged in
    if (path.startsWith('/auth') || path === '/landing') {
      return NextResponse.redirect(new URL('/map', req.url));
    }
    return res;
  }

  // If user is NOT authenticated
  if (!session) {
    // Allow access to auth routes and landing page
    if (path.startsWith('/auth') || path === '/landing') {
      return res;
    }

    // Redirect all other routes to landing
    return NextResponse.redirect(new URL('/landing', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/app/:path*', '/map/:path*', '/auth/:path*', '/landing', '/']
};
