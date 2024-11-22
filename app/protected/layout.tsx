import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProtectedLayoutProvider } from './ProtectedLayoutProvider';

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    // Check both session and JWT token
    if (!session?.access_token) {
      redirect('/login');
    }

    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(session.access_token);
    
    if (error || !user) {
      // If token is invalid or expired, redirect to login
      redirect('/login');
    }

    return <ProtectedLayoutProvider>{children}</ProtectedLayoutProvider>;
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/login');
  }
}
