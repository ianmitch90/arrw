-- Add real-time messaging tables
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('direct', 'group', 'location')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE chat_participants (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add presence tracking
CREATE TABLE presence_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('online', 'offline', 'away')),
  location GEOGRAPHY(POINT),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add real-time location tracking
CREATE TABLE location_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT) NOT NULL,
  accuracy FLOAT,
  speed FLOAT,
  heading FLOAT,
  altitude FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add enhanced security policies
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

-- Chat room access policies
CREATE POLICY "Users can view rooms they're in" ON chat_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = chat_rooms.id
      AND user_id = auth.uid()
    )
  );

-- Message policies
CREATE POLICY "Users can view messages in their rooms" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = messages.room_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their rooms" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = messages.room_id
      AND user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  );

-- Location tracking policies
CREATE POLICY "Users can only track their own location" ON location_updates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view locations based on privacy settings" ON location_updates
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = location_updates.user_id
      AND privacy_settings->>'shareLocation' = 'true'
      AND (
        -- Within 50 miles
        ST_DWithin(
          location_updates.location::geography,
          (SELECT location::geography FROM profiles WHERE id = auth.uid()),
          80467.2 -- 50 miles in meters
        )
      )
    )
  );

-- Add functions for real-time features
CREATE OR REPLACE FUNCTION get_nearby_users(
  latitude double precision,
  longitude double precision,
  radius_miles double precision DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  distance double precision,
  last_seen timestamp with time zone
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    ST_Distance(
      p.location::geography,
      ST_MakePoint(longitude, latitude)::geography
    ) / 1609.34 as distance,
    p.last_seen
  FROM profiles p
  WHERE 
    p.privacy_settings->>'shareLocation' = 'true'
    AND ST_DWithin(
      p.location::geography,
      ST_MakePoint(longitude, latitude)::geography,
      radius_miles * 1609.34
    )
    AND p.id != auth.uid()
  ORDER BY distance;
END;
$$;

-- Add indexes for performance
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_location_updates_user_created ON location_updates(user_id, created_at DESC);
CREATE INDEX idx_presence_logs_user_created ON presence_logs(user_id, created_at DESC);
CREATE INDEX idx_location_updates_location ON location_updates USING GIST(location); 