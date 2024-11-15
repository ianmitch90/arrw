-- Create stories table
CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('image', 'video')),
  content_url text NOT NULL,
  thumbnail_url text,
  duration integer, -- Duration in seconds for videos
  dimensions jsonb, -- Store width and height
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add RLS policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Everyone can view stories
CREATE POLICY "Stories are viewable by everyone" 
ON stories FOR SELECT 
USING (true);

-- Users can insert their own stories
CREATE POLICY "Users can insert their own stories" 
ON stories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories
CREATE POLICY "Users can update their own stories" 
ON stories FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories" 
ON stories FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster expiration queries
CREATE INDEX stories_expires_at_idx ON stories (expires_at);

-- Create index for user stories
CREATE INDEX stories_user_id_idx ON stories (user_id);

-- Function to clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < now();
END;
$$;
