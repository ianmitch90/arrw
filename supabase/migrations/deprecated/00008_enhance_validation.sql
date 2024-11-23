-- Enhanced cross-table validation functions
CREATE OR REPLACE FUNCTION validate_user_access(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  viewer_subscription_tier text;
  target_privacy_settings jsonb;
BEGIN
  -- Get viewer's subscription tier
  SELECT 
    prod.metadata->>'tier' INTO viewer_subscription_tier
  FROM subscriptions s
  JOIN prices p ON s.price_id = p.id
  JOIN products prod ON p.product_id = prod.id
  WHERE s.user_id = auth.uid()
  AND s.status = 'active'
  LIMIT 1;

  -- Get target user's privacy settings
  SELECT privacy_settings INTO target_privacy_settings
  FROM profiles
  WHERE id = target_user_id;

  -- Self access always allowed
  IF auth.uid() = target_user_id THEN
    RETURN true;
  END IF;

  -- Premium users can access more data
  IF viewer_subscription_tier = 'premium' THEN
    RETURN true;
  END IF;

  -- Check privacy settings and subscription requirements
  RETURN (
    target_privacy_settings->>'public_profile' = 'true'
    AND (
      viewer_subscription_tier IS NOT NULL
      OR target_privacy_settings->>'allow_free_users' = 'true'
    )
  );
END;
$$;

-- Enhanced subscription validation
CREATE OR REPLACE FUNCTION validate_subscription_feature(
  feature_name text,
  required_tier text DEFAULT 'regular'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_tier text;
  feature_limit int;
  current_usage int;
BEGIN
  -- Get user's current tier
  SELECT 
    prod.metadata->>'tier' INTO user_tier
  FROM subscriptions s
  JOIN prices p ON s.price_id = p.id
  JOIN products prod ON p.product_id = prod.id
  WHERE s.user_id = auth.uid()
  AND s.status = 'active'
  AND s.current_period_end > CURRENT_TIMESTAMP
  LIMIT 1;

  -- Check tier requirements
  IF user_tier IS NULL OR NOT (
    CASE user_tier
      WHEN 'premium' THEN true
      WHEN 'regular' THEN required_tier = 'regular'
      ELSE false
    END
  ) THEN
    RETURN false;
  END IF;

  -- Get feature limit for user's tier
  SELECT 
    CASE user_tier
      WHEN 'premium' THEN 1000
      WHEN 'regular' THEN 100
      ELSE 10
    END INTO feature_limit;

  -- Check usage within time window
  SELECT COUNT(*)
  INTO current_usage
  FROM usage_records
  WHERE user_id = auth.uid()
  AND feature = feature_name
  AND created_at > CURRENT_TIMESTAMP - interval '1 day';

  RETURN current_usage < feature_limit;
END;
$$;

-- Enhanced RLS policies with new validation
ALTER TABLE ar_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AR content access with subscription check"
  ON ar_content
  FOR SELECT
  USING (
    validate_subscription_feature('ar_view', 'regular')
    AND (
      auth.uid() = owner_id
      OR is_public = true
      OR validate_user_access(owner_id)
    )
  );

CREATE POLICY "AR content creation with tier check"
  ON ar_content
  FOR INSERT
  WITH CHECK (
    validate_subscription_feature('ar_create', 'regular')
    AND auth.uid() = owner_id
  );

-- Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION log_sensitive_operation()
RETURNS trigger
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
    ip_address
  )
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    jsonb_build_object(
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW),
      'subscription_tier', (
        SELECT prod.metadata->>'tier'
        FROM subscriptions s
        JOIN prices p ON s.price_id = p.id
        JOIN products prod ON p.product_id = prod.id
        WHERE s.user_id = auth.uid()
        AND s.status = 'active'
        LIMIT 1
      )
    ),
    inet_client_addr()
  );
  RETURN NULL;
END;
$$;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_ar_content_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ar_content
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_operation();

CREATE TRIGGER audit_subscription_changes
  AFTER UPDATE OF status, price_id ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_operation();

-- Add performance monitoring table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  feature_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  memory_usage_mb FLOAT,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add function to record performance metrics
CREATE OR REPLACE FUNCTION record_performance_metric(
  p_feature_name TEXT,
  p_duration_ms INTEGER,
  p_memory_usage_mb FLOAT DEFAULT NULL,
  p_error_count INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO performance_metrics (
    user_id,
    feature_name,
    duration_ms,
    memory_usage_mb,
    error_count,
    metadata
  )
  VALUES (
    auth.uid(),
    p_feature_name,
    p_duration_ms,
    p_memory_usage_mb,
    p_error_count,
    p_metadata
  );
END;
$$; 