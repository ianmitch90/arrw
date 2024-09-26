import SignUpForm from '@/components/ui/AuthForms/SignUpForm';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MultiStepSignUp from '@/components/ui/AuthForms/UserRegistration/MultiStepSignUp';

export default async function SignUpPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/app');
  }

  const variants = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 10 }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      {/* <SignUpForm/> */}
      <MultiStepSignUp />
    </div>
  );
}
