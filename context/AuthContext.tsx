'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { sessionManager } from '@/utils/auth/session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to restore session from localStorage
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (error) {
        console.warn('Error initializing auth:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize authentication',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [supabase, toast]);

  // Handle auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        setUser(session.user);
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          // If profile doesn't exist, try to create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ 
              id: session.user.id,
              created_at: new Date().toISOString(),
              status: 'online'
            }]);
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
            toast({
              title: 'Error',
              description: 'Failed to create user profile',
              variant: 'destructive',
            });
            return;
          }
        }
        
        router.replace('/(protected)/map');
      } else if (event === 'SIGNED_OUT') {
        sessionManager.clearSession();
        setSession(null);
        setUser(null);
        router.replace('/login');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, toast]);

  // Handle client-side route protection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const protectRoute = async () => {
      const path = window.location.pathname;
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        if (path === '/login' || path === '/signup' || path === '/') {
          router.replace('/(protected)/map');
        }
      } else {
        if (path.includes('/map') || path.includes('/profile')) {
          router.replace('/login');
        }
      }
    };

    protectRoute();
  }, [router, supabase.auth]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      sessionManager.clearSession();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
