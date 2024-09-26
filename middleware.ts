import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  // If no session and trying to access protected route, redirect to landing
  if (!session && req.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/landing', req.url));
  }

  // If session exists and trying to access public routes, redirect to app
  if (
    session &&
    (req.nextUrl.pathname === '/' ||
      req.nextUrl.pathname === '/landing' ||
      req.nextUrl.pathname.startsWith('/auth/'))
  ) {
    return NextResponse.redirect(new URL('/app', req.url));
  }

  // Redirect root to landing page for unauthenticated users
  if (!session && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/landing', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/', '/landing', '/auth/:path*', '/app/:path*']
};
