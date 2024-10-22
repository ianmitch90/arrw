import { supabase } from '@/utils/supabase/client';
import { getURL } from '@/utils/helpers';

export async function handleMagicLinkLogin(email: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getURL('/auth/callback'),
        shouldCreateUser: false
      }
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  }
}
