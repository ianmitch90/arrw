import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client with default session handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Let Supabase handle session persistence
    autoRefreshToken: true, // Let Supabase handle token refresh
    detectSessionInUrl: true // Handle OAuth redirects
  }
});

// Enhanced auth utilities
export const auth = {
  // Use Supabase's built-in session management
  getSession: async () => {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  },

  // Get current user with active session
  getUser: async () => {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  },

  // Age verification utilities
  verifyAge: async (method: 'modal' | 'document') => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const { error } = await supabase
      .from('users')
      .update({
        age_verified: true,
        age_verified_at: new Date().toISOString(),
        age_verification_method: method
      })
      .eq('id', user.id);

    if (error) throw error;
    return true;
  },

  checkAgeVerification: async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('users')
      .select('age_verified')
      .eq('id', user.id)
      .single();

    if (error || !data) return false;
    return data.age_verified;
  }
};
