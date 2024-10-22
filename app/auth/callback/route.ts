import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const {
      data: { session },
      error
    } = await supabase.auth.exchangeCodeForSession(code);

    if (session) {
      // Instead of trying to use localStorage on server,
      // we'll set the token in the URL and handle it client-side
      const redirectUrl = new URL('/auth/confirm', requestUrl.origin);
      redirectUrl.searchParams.set('token', session.access_token);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(new URL('/map', requestUrl.origin));
}
