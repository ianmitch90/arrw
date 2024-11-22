'use client';

import { supabaseClient } from './supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Store JWT token in localStorage
const TOKEN_KEY = 'sb-access-token';
const REFRESH_TOKEN_KEY = 'sb-refresh-token';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const supabase = supabaseClient();
  if (!supabase) return { user: null, session: null, error: new Error('Supabase client not initialized') };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (data.session) {
    setSession(data.session);
  }

  return { user: data.user, session: data.session, error: error };
}

export async function signInWithMagicLink(email: string) {
  const supabase = supabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });

  return { data, error };
}

export async function signInAnonymously(): Promise<AuthResponse> {
  const supabase = supabaseClient();
  if (!supabase) return { user: null, session: null, error: new Error('Supabase client not initialized') };

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    return { user: null, session: null, error };
  }

  if (data.session) {
    setSession(data.session);
  }

  return { user: data.user, session: data.session, error: null };
}

export function setSession(session: Session) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  
  // Set up Supabase to use the new session
  const supabase = supabaseClient();
  if (supabase) {
    supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });
  }
}

export function getSession(): { access_token: string | null; refresh_token: string | null } {
  if (typeof window === 'undefined') {
    return { access_token: null, refresh_token: null };
  }

  return {
    access_token: localStorage.getItem(TOKEN_KEY),
    refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY)
  };
}

export async function refreshSession() {
  const supabase = supabaseClient();
  if (!supabase) return null;

  const session = getSession();
  if (!session.access_token || !session.refresh_token) return null;

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });

    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      return data.session;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing session:', error);
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function signOut() {
  const supabase = supabaseClient();
  if (!supabase) return;
  
  await supabase.auth.signOut();
  clearSession();
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = supabaseClient();
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
