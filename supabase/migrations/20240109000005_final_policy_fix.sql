-- Set schema search path
SET search_path TO public, app_types;

-- Drop ALL existing profile policies
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_name);
    END LOOP;
END $$;

-- Create a single consolidated policy for SELECT
CREATE POLICY "Profiles are viewable based on privacy settings"
    ON public.profiles
    FOR SELECT
    USING (
        deleted_at IS NULL
        AND (
            -- Users can always view their own profile
            id = auth.uid()
            OR (
                -- For other profiles, check privacy settings
                CASE 
                    -- Public profiles are visible to everyone
                    WHEN location_sharing = 'public' THEN true
                    -- Friend-only profiles are visible to friends
                    WHEN location_sharing = 'friends' THEN EXISTS (
                        SELECT 1 FROM public.friends
                        WHERE (user_id = auth.uid() AND friend_id = profiles.id)
                        AND status = 'accepted'
                    )
                    -- Private profiles are only visible to self
                    ELSE false
                END
            )
        )
    );

-- Allow users to create their own profile
CREATE POLICY "Users can create their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        id = auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow users to soft delete their own profile
CREATE POLICY "Users can delete their own profile"
    ON public.profiles
    FOR DELETE
    USING (id = auth.uid());

-- Update presence log policies to avoid recursion
DROP POLICY IF EXISTS "Users can view their own presence logs" ON public.presence_logs;
DROP POLICY IF EXISTS "Users can create their own presence logs" ON public.presence_logs;

CREATE POLICY "Users can manage their own presence logs"
    ON public.presence_logs
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Update zone presence policies to avoid recursion
DROP POLICY IF EXISTS "Users can view their own zone presence" ON public.zone_presence;
DROP POLICY IF EXISTS "Users can record their own zone presence" ON public.zone_presence;

CREATE POLICY "Users can manage their own zone presence"
    ON public.zone_presence
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
