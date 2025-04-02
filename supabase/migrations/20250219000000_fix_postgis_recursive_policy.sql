-- This migration fixes the recursive policy issue with PostGIS functions
-- Based on the solution discussed in https://github.com/orgs/supabase/discussions/19143

-- Drop existing problematic functions if they exist
DROP FUNCTION IF EXISTS public.get_location_json CASCADE;

-- Create a non-recursive function to get location data
-- This function uses SECURITY DEFINER to bypass RLS checks
CREATE OR REPLACE FUNCTION public.get_location_json(profile_row profiles)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    -- Direct access to location data without triggering RLS
    IF profile_row.current_location IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN jsonb_build_object(
        'latitude', ST_Y(profile_row.current_location::geometry),
        'longitude', ST_X(profile_row.current_location::geometry),
        'last_update', profile_row.last_location_update
    );
END;
$$;

-- Create a function to check if a user can access another user's location
-- This avoids the recursive policy check problem
CREATE OR REPLACE FUNCTION public.can_access_user_location(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    requesting_user_id uuid;
    target_location_sharing text;
    target_has_location boolean;
    target_location_fresh boolean;
BEGIN
    -- Get the authenticated user ID
    requesting_user_id := auth.uid();
    
    -- Users can always access their own location
    IF requesting_user_id = target_user_id THEN
        RETURN true;
    END IF;
    
    -- Direct query to check location sharing settings without using RLS
    SELECT 
        current_location IS NOT NULL,
        last_location_update >= (now() - interval '24 hours'),
        COALESCE(location_sharing, 'private')
    INTO 
        target_has_location,
        target_location_fresh,
        target_location_sharing
    FROM public.profiles
    WHERE id = target_user_id;
    
    -- Check if location is accessible based on sharing settings
    RETURN (
        target_has_location AND 
        target_location_fresh AND 
        target_location_sharing = 'public'
    );
END;
$$;

-- Update the profile policy to use the non-recursive function
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

CREATE POLICY "Enable read access for authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id OR 
    public.can_access_user_location(id)
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_location_json(profiles) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_location_json(profiles) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_access_user_location(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_user_location(uuid) TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_location_json(profiles) IS 'Safely retrieves location data from a profile without triggering recursive RLS checks';
COMMENT ON FUNCTION public.can_access_user_location(uuid) IS 'Checks if the current user can access another user''s location without triggering recursive RLS checks';