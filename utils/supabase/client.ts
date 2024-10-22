import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We'll handle session persistence ourselves
    autoRefreshToken: false, // We'll handle token refresh ourselves
    storage: {
      // Custom storage to use JWT instead of cookies
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
      }
    }
  }
});

// Helper functions for auth
export const auth = {
  getSession: async () => {
    const token = localStorage.getItem('supabase_jwt');
    if (!token) return null;

    try {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser(token);
      if (error || !user) return null;
      return { user, token };
    } catch {
      return null;
    }
  },

  setSession: (token: string) => {
    localStorage.setItem('supabase_jwt', token);
  },

  clearSession: () => {
    localStorage.removeItem('supabase_jwt');
  },

  refreshSession: async () => {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      auth.setSession(session.access_token);
    }
    return { session, error };
  }
};
