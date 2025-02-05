-- Create search functions for users, places, and groups
CREATE OR REPLACE FUNCTION search_users_with_distance(
  search_query text,
  user_lat double precision,
  user_lng double precision
) RETURNS TABLE (
  id uuid,
  display_name text,
  bio text,
  avatar_url text,
  distance double precision,
  location jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.bio,
    p.avatar_url,
    ST_Distance(
      ST_Transform(p.last_location::geometry, 3857),
      ST_Transform(ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geometry, 3857)
    ) * 0.000621371 as distance, -- Convert meters to miles
    ST_AsGeoJSON(p.last_location)::jsonb as location
  FROM profiles p
  WHERE 
    p.display_name ILIKE '%' || search_query || '%'
    OR p.bio ILIKE '%' || search_query || '%'
  ORDER BY distance ASC
  LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION search_places_with_distance(
  search_query text,
  user_lat double precision,
  user_lng double precision
) RETURNS TABLE (
  id uuid,
  name text,
  description text,
  type text,
  image_url text,
  distance double precision,
  location jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.type,
    p.image_url,
    ST_Distance(
      ST_Transform(p.location::geometry, 3857),
      ST_Transform(ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geometry, 3857)
    ) * 0.000621371 as distance,
    ST_AsGeoJSON(p.location)::jsonb as location
  FROM places p
  WHERE 
    p.name ILIKE '%' || search_query || '%'
    OR p.description ILIKE '%' || search_query || '%'
    OR p.type ILIKE '%' || search_query || '%'
  ORDER BY distance ASC
  LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION search_groups_with_distance(
  search_query text,
  user_lat double precision,
  user_lng double precision
) RETURNS TABLE (
  id uuid,
  name text,
  description text,
  avatar_url text,
  distance double precision,
  location jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.description,
    g.avatar_url,
    ST_Distance(
      ST_Transform(g.location::geometry, 3857),
      ST_Transform(ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geometry, 3857)
    ) * 0.000621371 as distance,
    ST_AsGeoJSON(g.location)::jsonb as location
  FROM groups g
  WHERE 
    g.name ILIKE '%' || search_query || '%'
    OR g.description ILIKE '%' || search_query || '%'
  ORDER BY distance ASC
  LIMIT 20;
END;
$$;
