import {
  createClient,
  SupabaseClient,
  User,
  Session
} from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Helper functions for common Supabase operations
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<{
  data: { user: User | null };
  error: Error | null;
}> => {
  return await supabase.auth.getUser();
};

export const getSession = async (): Promise<{
  data: { session: Session | null };
  error: Error | null;
}> => {
  return await supabase.auth.getSession();
};
