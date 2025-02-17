-- Set schema search path
SET search_path TO public, app_types;

-- Create location helper functions
CREATE OR REPLACE FUNCTION get_location_json(profile_row profiles)
RETURNS json
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    IF profile_row.current_location IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN json_build_object(
        'latitude', ST_Y(profile_row.current_location::geometry),
        'longitude', ST_X(profile_row.current_location::geometry),
        'last_update', profile_row.last_location_update
    );
END;
$$;

-- Handle columns and function
DO $main_block$
DECLARE
    _column_exists boolean;
    _publication_exists boolean;
BEGIN
    -- Check if location columns already exist
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'current_location'
    ) INTO _column_exists;

    -- Only add columns if they don't exist
    IF NOT _column_exists THEN
        ALTER TABLE public.profiles 
        ADD COLUMN current_location geography(Point, 4326),
        ADD COLUMN last_location_update timestamptz DEFAULT now();
    END IF;

    -- Create or replace function (safe to do always)
    CREATE OR REPLACE FUNCTION update_profile_location(
        lat double precision,
        lon double precision
    ) RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function_definition$
    BEGIN
        UPDATE public.profiles
        SET 
            current_location = ST_SetSRID(ST_MakePoint(lon, lat)::geometry, 4326)::geography,
            last_location_update = now()
        WHERE id = auth.uid();
    END;
    $function_definition$;

    -- Handle realtime publication
    SELECT EXISTS (
        SELECT FROM pg_publication 
        WHERE pubname = 'supabase_realtime'
    ) INTO _publication_exists;

    IF _publication_exists THEN
        -- Only add columns if they're not already in the publication
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'profiles'
        ) THEN
            ALTER PUBLICATION supabase_realtime
            ADD TABLE profiles (current_location, last_location_update);
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Migration failed: % %', SQLERRM, SQLSTATE;
END $main_block$;

-- Handle policies separately
DO $policy_block$
BEGIN
    -- For update location policy
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update their own location'
    ) THEN
        CREATE POLICY "Users can update their own location"
            ON public.profiles
            FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;

    -- For nearby users policy
    DROP POLICY IF EXISTS "Users can view nearby users" ON public.profiles;
    
    CREATE POLICY "Users can view nearby users"
        ON public.profiles
        FOR SELECT
        USING (
            id = auth.uid()
            OR (
                EXISTS (
                    SELECT 1 FROM public.privacy_preferences pp
                    WHERE pp.user_id = profiles.id
                    AND pp.share_location = true
                )
                AND current_location IS NOT NULL
                AND last_location_update >= now() - interval '24 hours'
                AND EXISTS (
                    SELECT 1
                    FROM public.profiles viewer
                    WHERE viewer.id = auth.uid()
                    AND viewer.current_location IS NOT NULL
                    AND ST_DWithin(
                        profiles.current_location::geometry,
                        viewer.current_location::geometry,
                        5000
                    )
                )
            )
        );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Policy creation failed: % %', SQLERRM, SQLSTATE;
END $policy_block$;

-- Grant permissions (idempotent)
GRANT EXECUTE ON FUNCTION update_profile_location(double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_json(profiles) TO authenticated;