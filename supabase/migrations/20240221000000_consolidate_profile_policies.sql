-- Drop all existing profile policies to prevent conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
    DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
END $$;

-- Create a single, comprehensive read policy for profiles
CREATE POLICY "profiles_read_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    -- Users can always read their own profile
    auth.uid() = id
    OR (
        -- Users can read other profiles if they meet these conditions:
        deleted_at IS NULL
        AND (
            -- Public profiles with valid location
            (current_location IS NOT NULL
            AND last_location_update >= (now() - interval '24 hours')
            AND (privacy_settings->>'location_sharing')::text = 'public')
        )
    )
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
CREATE POLICY "profiles_delete_policy"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Add comments for documentation
COMMENT ON POLICY "profiles_read_policy" ON public.profiles IS
'Unified read policy for profiles - allows users to read their own profile and public profiles with valid location';

COMMENT ON POLICY "profiles_insert_policy" ON public.profiles IS
'Users can only create their own profile';

COMMENT ON POLICY "profiles_update_policy" ON public.profiles IS
'Users can only update their own profile';

COMMENT ON POLICY "profiles_delete_policy" ON public.profiles IS
'Users can only delete their own profile';