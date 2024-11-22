import { supabaseClient } from '../supabaseClient';

/**
 * Helper function to clean up anonymous users that are older than the specified days
 * @param daysOld Number of days after which anonymous users should be cleaned up
 * @returns Object containing success status and any error
 */
export async function cleanupAnonymousUsers(daysOld: number = 30) {
  const supabase = supabaseClient();
  if (!supabase) return { success: false, error: new Error('Supabase client not initialized') };

  const { data, error } = await supabase.rpc('cleanup_anonymous_users', {
    days_old: daysOld
  });

  return { success: !error, error };
}

/**
 * Helper function to get the RLS policy for anonymous users
 * Use this in your database migrations or when setting up tables
 * @param tableName The name of the table to create the policy for
 * @param policyName The name of the policy
 * @param operation The operation to allow/restrict (select, insert, update, delete)
 * @param allowAnonymous Whether to allow or restrict anonymous users
 * @returns The SQL statement for creating the policy
 */
export function getAnonymousRLSPolicy({
  tableName,
  policyName,
  operation = 'select',
  allowAnonymous = true
}: {
  tableName: string;
  policyName: string;
  operation?: 'select' | 'insert' | 'update' | 'delete';
  allowAnonymous?: boolean;
}): string {
  const condition = allowAnonymous
    ? 'true'
    : "(auth.jwt()->>'is_anonymous')::boolean is false";

  return `
    create policy "${policyName}"
    on ${tableName}
    as restrictive
    for ${operation}
    to authenticated
    using (${condition});
  `.trim();
}

/**
 * Helper function to link an anonymous user to an existing account
 * @param existingEmail The email of the existing account
 * @param password The password of the existing account
 * @param onConflict Function to handle data conflicts between anonymous and existing user
 */
export async function linkAnonymousToExisting(
  existingEmail: string,
  password: string,
  onConflict?: (anonymousUserId: string, existingUserId: string) => Promise<void>
) {
  const supabase = supabaseClient();
  if (!supabase) return { success: false, error: new Error('Supabase client not initialized') };

  // Get current anonymous session
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { success: false, error: new Error('No anonymous session found') };
  }

  const anonymousUserId = sessionData.session.user.id;

  // Try to sign in to existing account
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email: existingEmail,
    password
  });

  if (signInError) {
    return { success: false, error: signInError };
  }

  // Handle data conflicts if callback provided
  if (onConflict && data.user) {
    try {
      await onConflict(anonymousUserId, data.user.id);
    } catch (error) {
      return { success: false, error };
    }
  }

  return { success: true, error: null };
}
