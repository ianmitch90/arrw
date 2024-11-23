-- Enhanced RLS policies for all tables

-- Age verification policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own age verification"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own age verification"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    CASE 
      WHEN age_verified = true THEN
        -- Only allow setting age_verified to true if not previously verified
        NOT EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND age_verified = true
        )
      ELSE true
    END
  );

-- Location tracking policies
CREATE POLICY "Users can only track their own location"
  ON location_history FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND age_verified = true
    )
  );

CREATE POLICY "Users can only view locations based on privacy settings"
  ON location_history FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = location_history.user_id
        AND privacy_settings->>'shareLocation' = 'true'
      )
    )
  );

-- Subscription validation policies
CREATE POLICY "Users can only access features within their subscription tier"
  ON usage_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN prices p ON s.price_id = p.id
      WHERE s.user_id = auth.uid()
      AND s.status = 'active'
      AND p.metadata->>'tier' >= (
        SELECT p2.metadata->>'tier'
        FROM usage_records ur
        JOIN subscriptions s2 ON ur.subscription_id = s2.id
        JOIN prices p2 ON s2.price_id = p2.id
        WHERE ur.id = usage_records.id
      )
    )
  );

-- Cross-table validation functions
CREATE OR REPLACE FUNCTION check_subscription_access(feature_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions s
    JOIN prices p ON s.price_id = p.id
    WHERE s.user_id = auth.uid()
    AND s.status = 'active'
    AND (
      p.metadata->>'features' ? feature_name
      OR p.metadata->>'tier' = 'premium'
    )
  );
END;
$$;

-- Function to validate location access
CREATE OR REPLACE FUNCTION validate_location_access(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is accessing their own location
  IF auth.uid() = target_user_id THEN
    RETURN true;
  END IF;

  -- Check privacy settings and distance restrictions
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    WHERE id = target_user_id
    AND privacy_settings->>'shareLocation' = 'true'
    AND (
      -- Check if within allowed distance (50 miles)
      ST_DWithin(
        p.location::geography,
        (SELECT location::geography FROM profiles WHERE id = auth.uid()),
        80467.2 -- 50 miles in meters
      )
    )
  );
END;
$$;

-- Add subscription tier validation trigger
CREATE OR REPLACE FUNCTION validate_subscription_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Prevent downgrading while features are in use
  IF TG_OP = 'UPDATE' AND NEW.tier < OLD.tier THEN
    IF EXISTS (
      SELECT 1 FROM usage_records ur
      WHERE ur.subscription_id = NEW.id
      AND ur.feature_name = ANY(
        SELECT jsonb_object_keys(OLD.features::jsonb)
        EXCEPT
        SELECT jsonb_object_keys(NEW.features::jsonb)
      )
    ) THEN
      RAISE EXCEPTION 'Cannot downgrade while premium features are in use';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_subscription_downgrade
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription_tier(); 