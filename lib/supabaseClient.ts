'use client';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

let supabase: ReturnType<typeof createClient<Database>> | null = null;

export const supabaseClient = () => {
  if (!supabase) {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'sb-auth-token',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabase;
};

// Helper functions for session management
export const clearSession = async () => {
  if (typeof window === 'undefined') return;
  const client = supabaseClient();
  try {
    await client.auth.signOut();
    window.localStorage.removeItem('sb-auth-token');
    window.localStorage.removeItem('sb-refresh-token');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const setSession = async (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;
  const client = supabaseClient();
  try {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  } catch (error) {
    console.error('Error setting session:', error);
  }
};
