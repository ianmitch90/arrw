import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client with localStorage session handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development'
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
    if (error) throw error;
    return session;
  },

  // Get current user with active session
  getUser: async () => {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();
    if (error) throw error;
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
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
    }
  },

  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};
