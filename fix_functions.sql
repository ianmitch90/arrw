-- Drop existing functions
DROP FUNCTION IF EXISTS update_profile_location CASCADE;
DROP FUNCTION IF EXISTS get_location_json CASCADE;

-- Add helper function to update location
CREATE OR REPLACE FUNCTION update_profile_location(profile_id uuid, lat double precision, lon double precision)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET current_location = ST_SetSRID(ST_MakePoint(lon, lat), 4326),
        updated_at = NOW()
    WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get location as JSON
CREATE OR REPLACE FUNCTION get_location_json(geom geometry)
RETURNS jsonb AS $$
BEGIN
    IF geom IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN jsonb_build_object(
        'type', 'Point',
        'coordinates', array[ST_X(geom), ST_Y(geom)]
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
