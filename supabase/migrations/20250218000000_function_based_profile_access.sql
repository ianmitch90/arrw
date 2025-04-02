-- This migration implements a function-based approach to solve recursive policy issues
-- Based on the solution discussed in https://github.com/orgs/supabase/discussions/3328

-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE policyname = 'Enable read access for authenticated users' AND tablename = 'profiles') THEN
        DROP POLICY "Enable read access for authenticated users" ON "public"."profiles";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE policyname = 'Enable insert for authenticated users only' AND tablename = 'profiles') THEN
        DROP POLICY "Enable insert for authenticated users only" ON "public"."profiles";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE policyname = 'Enable update for users based on id' AND tablename = 'profiles') THEN
        DROP POLICY "Enable update for users based on id" ON "public"."profiles";
    END IF;
    
    -- Drop any consolidated policies if they exist
    DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
END $$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.check_profile_access(uuid);

-- Create a function to check if a user has access to a profile
-- This avoids recursive policy checks by using direct SQL queries
CREATE OR REPLACE FUNCTION public.check_profile_access(target_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    requesting_user_id uuid;
    has_access boolean;
    profile_record record;
BEGIN
    -- Get the authenticated user ID
    requesting_user_id := auth.uid();
    
    -- If user is checking their own profile, always allow access
    IF requesting_user_id = target_profile_id THEN
        RETURN true;
    END IF;
    
    -- Direct query to check profile visibility without using RLS
    SELECT 
        id,
        current_location,
        last_location_update,
        privacy_settings->>'location_sharing' as location_sharing,
        deleted_at
    INTO profile_record
    FROM public.profiles
    WHERE id = target_profile_id;
    
    -- Check if profile exists and meets visibility criteria
    has_access := (
        profile_record.id IS NOT NULL AND
        profile_record.deleted_at IS NULL AND
        profile_record.current_location IS NOT NULL AND
        profile_record.last_location_update >= (now() - interval '24 hours') AND
        profile_record.location_sharing = 'public'
    );
    
    RETURN has_access;
END;
$$;

-- Create new policies using the function
CREATE POLICY "profiles_read_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id OR 
    public.check_profile_access(id)
);

-- Simple insert policy - users can only create their own profile
CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Simple update policy - users can only update their own profile
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Simple delete policy - users can only delete their own profile
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE policyname = 'profiles_delete_policy' AND tablename = 'profiles') THEN
        CREATE POLICY "profiles_delete_policy"
        ON public.profiles
        FOR DELETE
        TO authenticated
        USING (auth.uid() = id);
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_profile_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_profile_access(uuid) TO service_role;

-- Add comment explaining the function's purpose
COMMENT ON FUNCTION public.check_profile_access(uuid) IS 'Checks if the authenticated user has access to view a profile without causing recursive policy checks';