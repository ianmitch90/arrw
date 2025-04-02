-- Drop existing problematic policies
DO $$
BEGIN
    -- Drop profile-related policies that might cause recursion
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can view their own location history" ON public.location_history;
    DROP POLICY IF EXISTS "Users can add to their location history" ON public.location_history;

    -- Drop story-related policies if they exist
    DROP POLICY IF EXISTS "Enable read access for stories" ON public.stories;
    DROP POLICY IF EXISTS "Enable write access for stories" ON public.stories;
END $$;

-- Create optimized profile policies without recursive checks
CREATE POLICY "Enable read access for authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    -- Direct access to own profile
    auth.uid() = id
    OR (
        -- Access to public profiles with valid location
        current_location IS NOT NULL
        AND last_location_update >= (now() - interval '24 hours')
        AND (privacy_settings->>'location_sharing')::text = 'public'
        AND deleted_at IS NULL
    )
);

-- Create non-recursive location history policies
CREATE POLICY "Users can view their own location history"
ON public.location_history
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (privacy_settings->>'allowLocationHistory')::boolean IS TRUE
        AND deleted_at IS NULL
    )
);

CREATE POLICY "Users can add to their location history"
ON public.location_history
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (privacy_settings->>'allowLocationHistory')::boolean IS TRUE
        AND deleted_at IS NULL
    )
);

-- Create optimized story policies
CREATE POLICY "Enable read access for stories"
ON public.stories
FOR SELECT
TO authenticated
USING (
    auth.uid() = created_by
    OR (
        status = 'public'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = stories.created_by
            AND deleted_at IS NULL
        )
    )
);

CREATE POLICY "Enable write access for stories"
ON public.stories
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND deleted_at IS NULL
    )
);

-- Create indexes to optimize policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_location
ON public.profiles ((privacy_settings->>'location_sharing'))
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_privacy_location_history
ON public.profiles ((privacy_settings->>'allowLocationHistory'))
WHERE deleted_at IS NULL;

-- Add comments for future maintenance
COMMENT ON POLICY "Enable read access for authenticated users" ON public.profiles IS
'Allows users to access their own profile and public profiles with valid location data without recursive checks';

COMMENT ON POLICY "Users can view their own location history" ON public.location_history IS
'Allows users to view their location history with optimized non-recursive profile checks';

COMMENT ON POLICY "Enable read access for stories" ON public.stories IS
'Allows users to view their own stories and public stories with optimized creator profile checks';