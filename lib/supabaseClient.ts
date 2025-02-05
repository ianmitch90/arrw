'use client';

import { createClient, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

let supabase: SupabaseClient<Database> | null = null;

export const supabaseClient = (): SupabaseClient<Database> => {
  if (!supabase) {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'sb-auth-token',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key: string): string | null => {
            if (typeof window === 'undefined') return null;
            const value = window.localStorage.getItem(key);
            if (key.includes('supabase.auth.token')) {
              try {
                const session = JSON.parse(value || '{}');
                if (session.user?.aud === 'authenticated') {
                  return value;
                }
                // For anon users, only clear if token is expired
                if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
                  window.localStorage.removeItem(key);
                  return null;
                }
              } catch (e) {
                return null;
              }
            }
            return value;
          },
          setItem: (key: string, value: string): void => {
            if (typeof window === 'undefined') return;
            window.localStorage.setItem(key, value);
          },
          removeItem: (key: string): void => {
            if (typeof window === 'undefined') return;
            window.localStorage.removeItem(key);
          },
        },
      } satisfies SupabaseClientOptions<Database>['auth']
    });
  }
  return supabase;
};

// Helper functions for session management
export const clearSession = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  const client = supabaseClient();
  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user.aud === 'authenticated') {
      window.localStorage.setItem('was_authenticated', 'true');
    }
    await client.auth.signOut();
    
    // Only clear everything if it was an authenticated user
    const wasAuthenticated = window.localStorage.getItem('was_authenticated');
    if (wasAuthenticated === 'true') {
      window.localStorage.clear();
    } else {
      // For anon users, only clear auth tokens
      window.localStorage.removeItem('sb-auth-token');
      window.localStorage.removeItem('sb-refresh-token');
    }
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const setSession = async (accessToken: string, refreshToken: string): Promise<void> => {
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
