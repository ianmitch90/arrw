-- Drop existing get_location_json function
DROP FUNCTION IF EXISTS public.get_location_json CASCADE;

-- Create a new get_location_json function that works with profiles directly
CREATE OR REPLACE FUNCTION public.get_location_json(profile_row profiles)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    IF profile_row.current_location IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN jsonb_build_object(
        'type', 'Point',
        'coordinates', ARRAY[
            ST_X(profile_row.current_location::geometry),
            ST_Y(profile_row.current_location::geometry)
        ]
    );
END;
$$;

-- Drop existing places_created_by_fkey if it exists
ALTER TABLE IF EXISTS public.places
DROP CONSTRAINT IF EXISTS places_created_by_fkey;

-- Update places table to reference profiles instead of auth.users
ALTER TABLE public.places
ADD CONSTRAINT places_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Create index for the foreign key if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_places_created_by
ON public.places(created_by);

-- Update profile policies to fix infinite recursion
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
CREATE POLICY "Enable read access for authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id
    OR (
        current_location IS NOT NULL
        AND last_location_update >= (now() - interval '24 hours')
        AND location_sharing = 'public'
    )
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_location_json(profiles) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_location_json(profiles) TO service_role;