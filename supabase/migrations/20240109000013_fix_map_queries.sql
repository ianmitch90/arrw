-- Drop existing function first
DROP FUNCTION IF EXISTS find_places_within_radius;

-- Recreate function with updated return type
CREATE OR REPLACE FUNCTION find_places_within_radius(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_miles DOUBLE PRECISION,
    place_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    location GEOMETRY(Point, 4326),
    place_type TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    photo_url TEXT,
    status TEXT,
    metadata JSONB,
    creator_id UUID,
    creator_full_name TEXT,
    creator_avatar_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.*,
        u.id as creator_id,
        u.full_name as creator_full_name,
        prof.avatar_url as creator_avatar_url
    FROM places p
    LEFT JOIN users u ON p.created_by = u.id
    LEFT JOIN profiles prof ON u.id = prof.id
    WHERE ST_DWithin(
        p.location::geography,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_miles * 1609.34
    )
    AND (place_types IS NULL OR p.place_type = ANY(place_types))
    AND p.status = 'active';
END;
$$;
