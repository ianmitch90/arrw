-- Enhanced RLS policies for real-time features
CREATE POLICY "Presence visibility based on location and subscription"
  ON presence_state
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      -- Check if user has required subscription
      EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN prices p ON s.price_id = p.id
        JOIN products prod ON p.product_id = prod.id
        WHERE s.user_id = auth.uid()
        AND s.status = 'active'
        AND (
          prod.metadata->>'tier' = 'premium'
          OR (
            prod.metadata->>'tier' = 'regular'
            AND ST_DWithin(
              presence_state.location::geography,
              (SELECT location::geography FROM profiles WHERE id = auth.uid()),
              80467.2 -- 50 miles in meters
            )
          )
        )
      )
      -- Check privacy settings
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = presence_state.user_id
        AND privacy_settings->>'shareLocation' = 'true'
      )
    )
  );

-- Add rate limiting for real-time updates
CREATE OR REPLACE FUNCTION check_realtime_rate_limit(
  user_id uuid,
  feature_name text,
  max_requests int DEFAULT 100,
  window_minutes int DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count int;
BEGIN
  SELECT COUNT(*)
  INTO request_count
  FROM realtime_usage_logs
  WHERE user_id = user_id
  AND feature = feature_name
  AND created_at > NOW() - (window_minutes || ' minutes')::interval;

  RETURN request_count < max_requests;
END;
$$;

-- Create realtime usage logging
CREATE TABLE realtime_usage_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  feature text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add trigger for rate limiting
CREATE OR REPLACE FUNCTION enforce_realtime_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT check_realtime_rate_limit(NEW.user_id, TG_TABLE_NAME) THEN
    RAISE EXCEPTION 'Rate limit exceeded for %', TG_TABLE_NAME;
  END IF;
  
  INSERT INTO realtime_usage_logs (user_id, feature)
  VALUES (NEW.user_id, TG_TABLE_NAME);
  
  RETURN NEW;
END;
$$;

-- Apply rate limiting to real-time tables
CREATE TRIGGER enforce_presence_rate_limit
  BEFORE INSERT OR UPDATE ON presence_state
  FOR EACH ROW
  EXECUTE FUNCTION enforce_realtime_rate_limit();

CREATE TRIGGER enforce_location_rate_limit
  BEFORE INSERT OR UPDATE ON location_updates
  FOR EACH ROW
  EXECUTE FUNCTION enforce_realtime_rate_limit(); 