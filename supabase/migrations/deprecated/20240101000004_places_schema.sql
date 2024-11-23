-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Place tags enum
CREATE TYPE place_tag AS ENUM (
  'park',
  'private',
  'garage',
  'restaurant',
  'cafe',
  'shop',
  'venue',
  'other'
);

-- Places table
CREATE TABLE places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  location geography(Point, 4326) NOT NULL,
  tags place_tag[] DEFAULT '{}',
  average_rating numeric(2,1) DEFAULT 0,
  total_ratings integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  photo_url text
);

-- Place proposals table
CREATE TABLE place_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  location geography(Point, 4326) NOT NULL,
  tags place_tag[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  photo_url text,
  status text NOT NULL DEFAULT 'pending',
  approved_place_id uuid REFERENCES places(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  cluster_id uuid,
  distance numeric,
  similar_count integer DEFAULT 0
);

-- Place comments table
CREATE TABLE place_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid REFERENCES places(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text,
  rating integer CHECK (rating >= 0 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Function to update place rating
CREATE OR REPLACE FUNCTION update_place_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE places
  SET 
    total_ratings = (
      SELECT COUNT(*)
      FROM place_comments
      WHERE place_id = NEW.place_id
      AND rating IS NOT NULL
    ),
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM place_comments
      WHERE place_id = NEW.place_id
      AND rating IS NOT NULL
    )
  WHERE id = NEW.place_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update place rating on comment changes
CREATE TRIGGER update_place_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON place_comments
FOR EACH ROW
EXECUTE FUNCTION update_place_rating();

-- Function to get nearby proposals
CREATE OR REPLACE FUNCTION get_nearby_proposals(
  lat double precision,
  lng double precision,
  radius_miles double precision DEFAULT 1
)
RETURNS SETOF place_proposals
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM place_proposals
  WHERE ST_DWithin(
    location::geography,
    ST_MakePoint(lng, lat)::geography,
    radius_miles * 1609.34  -- Convert miles to meters
  )
  AND status = 'pending'
  ORDER BY 
    ST_Distance(
      location::geography,
      ST_MakePoint(lng, lat)::geography
    );
$$;

-- Spatial index for faster queries
CREATE INDEX places_location_idx ON places USING GIST (location::geography);
CREATE INDEX place_proposals_location_idx ON place_proposals USING GIST (location::geography);

-- RLS Policies
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_comments ENABLE ROW LEVEL SECURITY;

-- Places policies
CREATE POLICY "Public places are viewable by everyone"
ON places FOR SELECT
USING (true);

CREATE POLICY "Users can insert places"
ON places FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own places"
ON places FOR UPDATE
USING (auth.uid() = created_by);

-- Place proposals policies
CREATE POLICY "Users can view their own proposals"
ON place_proposals FOR SELECT
USING (
  auth.uid() = created_by OR
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE auth.jwt() ->> 'role' = 'admin'
  )
);

CREATE POLICY "Users can insert proposals"
ON place_proposals FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own pending proposals"
ON place_proposals FOR UPDATE
USING (
  auth.uid() = created_by AND
  status = 'pending'
);

CREATE POLICY "Users can delete their own pending proposals"
ON place_proposals FOR DELETE
USING (
  auth.uid() = created_by AND
  status = 'pending'
);

-- Place comments policies
CREATE POLICY "Comments are viewable by everyone"
ON place_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert comments"
ON place_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON place_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON place_comments FOR DELETE
USING (auth.uid() = user_id);
