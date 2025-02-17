-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- Places table
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    place_type TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    photo_url TEXT,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    media_url TEXT,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Function to find users within radius
DO $function_block$
BEGIN
    DROP FUNCTION IF EXISTS find_users_within_radius(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
    CREATE FUNCTION find_users_within_radius(
        user_lat DOUBLE PRECISION,
        user_lng DOUBLE PRECISION,
        radius_miles DOUBLE PRECISION
    )
    RETURNS SETOF profiles
    LANGUAGE plpgsql
    AS $function_definition$
    BEGIN
        RETURN QUERY
        SELECT *
        FROM profiles
        WHERE ST_DWithin(
            current_location::geography,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            radius_miles * 1609.34  -- Convert miles to meters
        )
        AND status = 'active'
        AND deleted_at IS NULL;
    END;
    $function_definition$;
END
$function_block$;

-- Function to find places within radius
DO $function_block$
BEGIN
    DROP FUNCTION IF EXISTS find_places_within_radius(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT[]);
    CREATE FUNCTION find_places_within_radius(
        user_lat DOUBLE PRECISION,
        user_lng DOUBLE PRECISION,
        radius_miles DOUBLE PRECISION,
        place_types TEXT[] DEFAULT NULL
    )
    RETURNS SETOF places
    LANGUAGE plpgsql
    AS $function_definition$
    BEGIN
        RETURN QUERY
        SELECT *
        FROM places
        WHERE ST_DWithin(
            location::geography,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            radius_miles * 1609.34
        )
        AND (place_types IS NULL OR place_type = ANY(place_types))
        AND status = 'active';
    END;
    $function_definition$;
END
$function_block$;

-- Function to find stories within radius
DO $function_block$
BEGIN
    DROP FUNCTION IF EXISTS find_stories_within_radius(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
    CREATE FUNCTION find_stories_within_radius(
        user_lat DOUBLE PRECISION,
        user_lng DOUBLE PRECISION,
        radius_miles DOUBLE PRECISION
    )
    RETURNS SETOF stories
    LANGUAGE plpgsql
    AS $function_definition$
    BEGIN
        RETURN QUERY
        SELECT *
        FROM stories
        WHERE ST_DWithin(
            location::geography,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            radius_miles * 1609.34
        )
        AND (expires_at IS NULL OR expires_at > now())
        AND status = 'active';
    END;
    $function_definition$;
END
$function_block$;

-- Enable RLS and create policies for new tables
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DO $policy_block$
BEGIN
    -- Places policies
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'places' 
        AND policyname = 'Places are viewable by everyone'
    ) THEN
        CREATE POLICY "Places are viewable by everyone"
            ON places FOR SELECT
            USING (status = 'active');
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'places' 
        AND policyname = 'Authenticated users can create places'
    ) THEN
        CREATE POLICY "Authenticated users can create places"
            ON places FOR INSERT
            WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'places' 
        AND policyname = 'Users can update their own places'
    ) THEN
        CREATE POLICY "Users can update their own places"
            ON places FOR UPDATE
            USING (auth.uid() = created_by);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'places' 
        AND policyname = 'Users can delete their own places'
    ) THEN
        CREATE POLICY "Users can delete their own places"
            ON places FOR DELETE
            USING (auth.uid() = created_by);
    END IF;

    -- Stories policies
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'stories' 
        AND policyname = 'Active stories are viewable by everyone'
    ) THEN
        CREATE POLICY "Active stories are viewable by everyone"
            ON stories FOR SELECT
            USING (status = 'active' AND (expires_at IS NULL OR expires_at > now()));
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'stories' 
        AND policyname = 'Authenticated users can create stories'
    ) THEN
        CREATE POLICY "Authenticated users can create stories"
            ON stories FOR INSERT
            WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'stories' 
        AND policyname = 'Users can update their own stories'
    ) THEN
        CREATE POLICY "Users can update their own stories"
            ON stories FOR UPDATE
            USING (auth.uid() = created_by);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'stories' 
        AND policyname = 'Users can delete their own stories'
    ) THEN
        CREATE POLICY "Users can delete their own stories"
            ON stories FOR DELETE
            USING (auth.uid() = created_by);
    END IF;
END
$policy_block$;