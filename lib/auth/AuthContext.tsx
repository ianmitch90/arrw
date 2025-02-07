'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient, User, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Create the Supabase client with our custom configuration
const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key: string) => {
          const value = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
          if (key.includes('supabase.auth.token')) {
            try {
              const session = JSON.parse(value || '{}');
              if (session.user?.aud === 'authenticated') {
                return value;
              }
              // For anon users, only clear if token is expired
              if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
                if (typeof window !== 'undefined') localStorage.removeItem(key);
                return null;
              }
            } catch (e) {
              return null;
            }
          }
          return value;
        },
        setItem: (key: string, value: string) => localStorage.setItem(key, value),
        removeItem: (key: string) => localStorage.removeItem(key),
      }
    }
  }
);

interface AuthContextType {
  user: User | null;
  supabase: SupabaseClient<Database>;
  isAnonymous: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Check for initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setIsAnonymous(session.user.aud !== 'authenticated');
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        
        if (session.user.aud !== 'authenticated') {
          setIsAnonymous(true);
          const existingAnonId = localStorage.getItem('anon_user_id');
          if (!existingAnonId) {
            localStorage.setItem('anon_user_id', session.user.id);
          } else if (existingAnonId !== session.user.id) {
            await migrateAnonUserData(existingAnonId, session.user.id);
          }
        } else {
          setIsAnonymous(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // Only clear everything if it was an authenticated user
        const wasAuthenticated = localStorage.getItem('was_authenticated');
        if (wasAuthenticated === 'true') {
          localStorage.clear();
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // First check if we can get a session
      const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
      console.log('Current session:', currentSession);

      // Clear any existing session if present
      if (currentSession) {
        console.log('Clearing existing session');
        await supabaseClient.auth.signOut();
      }

      console.log('Attempting to sign in with:', { email });
      
      // First try with the exact email as provided
      let { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log('First attempt failed:', error);
        // Try checking if the user exists
        const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers();
        if (usersError) {
          console.error('Failed to list users:', usersError);
        } else {
          const matchingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
          console.log('Found matching user:', matchingUser ? 'yes' : 'no');
        }

        // If that fails, try with lowercase email
        ({ data, error } = await supabaseClient.auth.signInWithPassword({
          email: email.toLowerCase(),
          password
        }));

        if (error) {
          console.log('Second attempt failed:', error);
          // If that fails too, try with trimmed lowercase email
          ({ data, error } = await supabaseClient.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password
          }));
          
          if (error) {
            console.log('Third attempt failed:', error);
          }
        }
      }

      if (error) {
        console.error('All sign in attempts failed:', error);
        throw error;
      }

      if (!data?.user) {
        console.error('No user data returned');
        throw new Error('No user data returned from authentication');
      }

      console.log('Sign in successful:', data);
      return data;
    } catch (error: any) {
      console.error('Sign in error:', error);
      // Enhance error message for common cases
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    if (user?.aud === 'authenticated') {
      localStorage.setItem('was_authenticated', 'true');
    }
    await supabaseClient.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, supabase: supabaseClient, isAnonymous, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

async function migrateAnonUserData(oldId: string, newId: string) {
  // Migrate user preferences
  const { data: oldPrefs } = await supabaseClient
    .from('user_preferences')
    .select('*')
    .eq('user_id', oldId)
    .single();

  if (oldPrefs) {
    await supabaseClient.from('user_preferences').insert({
      ...oldPrefs,
      user_id: newId
    });
  }

  // Migrate location history if needed
  const { data: oldLocations } = await supabaseClient
    .from('location_history')
    .select('*')
    .eq('user_id', oldId);

  if (oldLocations?.length) {
    await supabaseClient.from('location_history').insert(
      oldLocations.map(loc => ({
        ...loc,
        user_id: newId
      }))
    );
  }
}
