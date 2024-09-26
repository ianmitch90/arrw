'use client';

import { type Provider, createClient } from '@supabase/supabase-js';
import { getURL } from '@/utils/helpers';
import { redirectToPath } from './server';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { supabase } from '@/lib/supabaseClient';

// Function to create Supabase client from environment variables
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''; // Get Supabase URL from env
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Get Supabase anon key from env
  return createClient(supabaseUrl, supabaseAnonKey); // Create and return Supabase client
};

export const handleRequest = async (
  e: React.FormEvent<HTMLFormElement>,
  action: Function,
  formData: FormData
) => {
  e.preventDefault(); // Prevent default form submission

  try {
    const result = await action(formData); // Call the action with formData
    return result; // Return the result
  } catch (error) {
    console.error('Error handling request:', error);
    throw error; // Rethrow the error for further handling
  }
};

export async function signInWithOAuth(e: React.FormEvent<HTMLFormElement>) {
  // Prevent default form submission refresh
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const provider = String(formData.get('provider')).trim() as Provider;

  // Use the existing supabase client
  const redirectURL = getURL('/auth/callback');
  await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirectURL
    }
  });
}
