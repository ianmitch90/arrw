import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export async function handleAnonymousLogin() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    console.log(data);

    if (error) {
      console.error('Anonymous login failed:', error.message);
      throw new Error('Anonymous login failed');
    }

    // Redirect to the main app page after successful login
    const router = useRouter();
    router.push('/app');
  } catch (error) {
    console.error('Error during anonymous login:', error);
  }
}
