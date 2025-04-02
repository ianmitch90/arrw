-- This migration adds the missing location-related functions that are being called from the frontend
-- Created to fix 404 errors when calling get_nearby_users and get_profile_with_location

-- Function to get nearby users based on location
CREATE OR REPLACE FUNCTION public.get_nearby_users(
  user_location text,  -- Format: POINT(lng lat)
  radius_meters float,
  max_results integer DEFAULT 50
) RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_point geometry;
BEGIN
  -- Convert the text point to a geometry
  user_point := ST_GeomFromText(user_location, 4326);
  
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  WHERE 
    p.current_location IS NOT NULL AND
    p.id <> auth.uid() AND
    p.last_location_update >= (now() - interval '24 hours') AND
    ST_DWithin(
      p.current_location::geometry,
      user_point,
      radius_meters
    )
  ORDER BY 
    ST_Distance(
      p.current_location::geometry,
      user_point
    ) ASC
  LIMIT max_results;
END;
$$;

-- Alternative version of get_nearby_users with different parameters
CREATE OR REPLACE FUNCTION public.get_nearby_users(
  user_id uuid,
  hours integer DEFAULT 24,
  limit_count integer DEFAULT 50
) RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_location geometry;
BEGIN
  -- Get the user's location
  SELECT current_location INTO user_location
  FROM profiles
  WHERE id = user_id;
  
  -- Return empty set if user has no location
  IF user_location IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  WHERE 
    p.current_location IS NOT NULL AND
    p.id <> user_id AND
    p.last_location_update >= (now() - interval '1 hour' * hours) AND
    ST_DWithin(
      p.current_location::geometry,
      user_location,
      5000  -- Default 5km radius
    )
  ORDER BY 
    ST_Distance(
      p.current_location::geometry,
      user_location
    ) ASC
  LIMIT limit_count;
END;
$$;

-- Function to get a profile with location information
CREATE OR REPLACE FUNCTION public.get_profile_with_location(
  profile_id uuid
) RETURNS TABLE (
  id uuid,
  display_name text,
  bio text,
  avatar_url text,
  location jsonb,
  last_seen timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.bio,
    p.avatar_url,
    CASE 
      WHEN p.current_location IS NOT NULL THEN
        jsonb_build_object(
          'type', 'Point',
          'coordinates', ARRAY[
            ST_X(p.current_location::geometry),
            ST_Y(p.current_location::geometry)
          ],
          'last_update', p.last_location_update
        )
      ELSE NULL
    END as location,
    p.last_seen
  FROM profiles p
  WHERE 
    p.id = profile_id AND
    (p.id = auth.uid() OR public.can_access_user_location(p.id));
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_nearby_users(text, float, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_users(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_with_location(uuid) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_nearby_users(text, float, integer) IS 'Returns nearby users based on a location point and radius';
COMMENT ON FUNCTION public.get_nearby_users(uuid, integer, integer) IS 'Returns nearby users based on a user ID and time window';
COMMENT ON FUNCTION public.get_profile_with_location(uuid) IS 'Returns a profile with formatted location data if accessible';