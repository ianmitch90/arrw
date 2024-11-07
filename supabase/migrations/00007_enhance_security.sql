-- Enhanced RLS policies and security functions

-- Cross-table validation functions
CREATE OR REPLACE FUNCTION validate_subscription_access(feature_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has active subscription with required feature
  RETURN EXISTS (
    SELECT 1 
    FROM subscriptions s
    JOIN prices p ON s.price_id = p.id
    JOIN products prod ON p.product_id = prod.id
    WHERE s.user_id = auth.uid()
    AND s.status = 'active'
    AND (
      prod.metadata->>'features' ? feature_name
      OR prod.metadata->>'tier' = 'premium'
    )
    AND s.current_period_end > CURRENT_TIMESTAMP
  );
END;
$$;

-- Enhanced age verification check
CREATE OR REPLACE FUNCTION check_age_verification()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users
    WHERE id = auth.uid()
    AND age_verified = true
    AND age_verified_at IS NOT NULL
    AND age_verified_at <= CURRENT_TIMESTAMP
  );
END;
$$;

-- Location privacy validation
CREATE OR REPLACE FUNCTION validate_location_access(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_privacy jsonb;
  user_location geography;
  viewer_location geography;
BEGIN
  -- Get target user's privacy settings and location
  SELECT 
    privacy_settings,
    location::geography
  INTO user_privacy, user_location
  FROM profiles
  WHERE id = target_user_id;

  -- Get viewer's location
  SELECT location::geography
  INTO viewer_location
  FROM profiles
  WHERE id = auth.uid();

  -- Self access always allowed
  IF auth.uid() = target_user_id THEN
    RETURN true;
  END IF;

  -- Check privacy settings and distance
  RETURN (
    user_privacy->>'shareLocation' = 'true'
    AND (
      user_privacy->>'showDistance' = 'true'
      OR ST_DWithin(
        user_location,
        viewer_location,
        (COALESCE((user_privacy->>'maxViewDistance')::float, 50) * 1609.34)  -- Convert miles to meters
      )
    )
  );
END;
$$;

-- Enhanced RLS policies for real-time features
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their rooms with age verification"
  ON messages
  FOR SELECT
  USING (
    check_age_verification()
    AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = messages.room_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages with subscription check"
  ON messages
  FOR INSERT
  WITH CHECK (
    check_age_verification()
    AND validate_subscription_access('chat')
    AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = messages.room_id
      AND user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  );

-- Enhanced location tracking policies
CREATE POLICY "Location privacy enforcement"
  ON location_updates
  FOR SELECT
  USING (
    validate_location_access(user_id)
  );

CREATE POLICY "Location update with subscription check"
  ON location_updates
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND validate_subscription_access('location_tracking')
  );

-- Add rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  feature_name text,
  time_window interval DEFAULT interval '1 hour'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  limit_count int;
  current_count int;
BEGIN
  -- Get limit based on subscription tier
  SELECT 
    CASE 
      WHEN prod.metadata->>'tier' = 'premium' THEN 1000
      WHEN prod.metadata->>'tier' = 'regular' THEN 100
      ELSE 10
    END INTO limit_count
  FROM subscriptions s
  JOIN prices p ON s.price_id = p.id
  JOIN products prod ON p.product_id = prod.id
  WHERE s.user_id = auth.uid()
  AND s.status = 'active'
  LIMIT 1;

  -- Count recent actions
  SELECT COUNT(*)
  INTO current_count
  FROM usage_records
  WHERE user_id = auth.uid()
  AND feature = feature_name
  AND created_at > CURRENT_TIMESTAMP - time_window;

  RETURN current_count < COALESCE(limit_count, 10);
END;
$$;

-- Add audit logging
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  action text,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    auth.uid(),
    action,
    entity_type,
    entity_id,
    metadata,
    inet_client_addr(),
    current_setting('request.headers')::jsonb->>'user-agent'
  );
END;
$$;

-- Add triggers for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_audit_event(
    TG_OP,
    TG_TABLE_NAME::text,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    jsonb_build_object(
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW)
    )
  );
  RETURN NULL;
END;
$$;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_messages_trigger
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_location_updates_trigger
  AFTER INSERT OR UPDATE OR DELETE ON location_updates
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function(); 