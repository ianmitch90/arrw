import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options
          });
        }
      }
    }
  );

  try {
    // Check session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    // Protected routes check
    if (request.nextUrl.pathname.startsWith('/app')) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Check age verification
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('age_verified')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      if (!userData?.age_verified) {
        return NextResponse.redirect(new URL('/auth/verify-age', request.url));
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      switch (error.message) {
        case 'Session not found':
          return NextResponse.redirect(new URL('/auth/login', request.url));
        case 'Database error':
          // Log error and show error page
          return NextResponse.redirect(new URL('/error', request.url));
        default:
          // Handle other errors
          return NextResponse.redirect(new URL('/error', request.url));
      }
    }

    return response;
  }
}

export const config = {
  matcher: ['/app/:path*', '/auth/verify-age']
};
