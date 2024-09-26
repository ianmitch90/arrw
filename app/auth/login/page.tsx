import LoginForm from '@/components/ui/AuthForms/LoginForm';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LoginPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/app');
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <LoginForm />
      <div className="mt-4">
        <Link href="/auth/sign-up" className="text-blue-500 hover:underline">
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  );
}
