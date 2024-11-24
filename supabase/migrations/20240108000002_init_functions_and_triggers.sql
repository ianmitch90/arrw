-- Set up utility functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Core user management functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        email,
        phone,
        role,
        status
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email,
        NEW.phone,
        CASE 
            WHEN NEW.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
            THEN 'admin'::user_role
            ELSE 'free'::user_role
        END,
        'pending_verification'::user_status
    );

    -- Create customer record
    INSERT INTO public.customers (
        user_id,
        email
    ) VALUES (
        NEW.id,
        NEW.email
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Location management functions
CREATE OR REPLACE FUNCTION public.update_location(
    p_latitude double precision,
    p_longitude double precision,
    p_accuracy float DEFAULT NULL,
    p_record_history boolean DEFAULT true
) RETURNS void AS $$
DECLARE
    v_allow_history boolean;
    v_location geography(Point, 4326);
BEGIN
    -- Check privacy settings
    SELECT (privacy_settings->>'allowLocationHistory')::boolean
    INTO v_allow_history
    FROM public.profiles
    WHERE id = auth.uid();

    v_location := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);

    -- Update current location
    UPDATE public.profiles
    SET 
        current_location = v_location,
        location_accuracy = p_accuracy,
        last_location_update = now()
    WHERE id = auth.uid();

    -- Record in history if allowed
    IF p_record_history AND v_allow_history THEN
        INSERT INTO public.location_history (user_id, location, accuracy)
        VALUES (auth.uid(), v_location, p_accuracy);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Presence management functions
CREATE OR REPLACE FUNCTION public.handle_presence_update()
RETURNS trigger AS $$
BEGIN
    -- Record presence history
    INSERT INTO public.presence_history (
        user_id,
        old_status,
        new_status
    ) VALUES (
        NEW.id,
        OLD.presence_status,
        NEW.presence_status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_presence(p_status presence_status)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET 
        presence_status = p_status,
        last_seen_at = CASE 
            WHEN p_status = 'offline' THEN now()
            ELSE last_seen_at
        END,
        online_at = CASE 
            WHEN p_status = 'online' AND (presence_status = 'offline' OR presence_status IS NULL)
            THEN now()
            ELSE online_at
        END
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Feature and subscription management functions
CREATE OR REPLACE FUNCTION public.check_feature_access(
    feature_id uuid,
    for_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean AS $$
DECLARE
    v_feature_tier subscription_tier;
    v_user_tier subscription_tier;
    v_feature_limit integer;
    v_used_count integer;
BEGIN
    -- Get feature tier and user's current tier
    SELECT subscription_tier INTO v_feature_tier
    FROM public.subscription_features
    WHERE id = feature_id;

    SELECT subscription_tier INTO v_user_tier
    FROM public.customers
    WHERE id = for_user_id;

    -- Check if user's tier is sufficient
    IF v_user_tier::text >= v_feature_tier::text THEN
        -- Check usage limits if any
        SELECT (limits->>'amount')::integer INTO v_feature_limit
        FROM public.subscription_features
        WHERE id = feature_id;

        IF v_feature_limit IS NOT NULL THEN
            SELECT used_count INTO v_used_count
            FROM public.feature_usage
            WHERE feature_id = feature_id
            AND user_id = for_user_id
            AND (reset_at IS NULL OR reset_at > now());

            RETURN COALESCE(v_used_count, 0) < v_feature_limit;
        END IF;

        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.track_feature_usage(
    feature_id uuid,
    amount integer DEFAULT 1
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.feature_usage (
        user_id,
        feature_id,
        used_count,
        last_used_at
    ) VALUES (
        auth.uid(),
        feature_id,
        amount,
        now()
    )
    ON CONFLICT (user_id, feature_id)
    DO UPDATE SET
        used_count = feature_usage.used_count + amount,
        last_used_at = now(),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cleanup procedure for location history
CREATE OR REPLACE PROCEDURE public.cleanup_location_history()
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete location history older than 30 days
    DELETE FROM public.location_history
    WHERE created_at < now() - interval '30 days';
END;
$$;

-- Set up core triggers
CREATE TRIGGER handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_webhook_events
    BEFORE UPDATE ON public.webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Set up presence triggers
CREATE TRIGGER on_presence_update
    AFTER UPDATE OF presence_status ON public.profiles
    FOR EACH ROW
    WHEN (OLD.presence_status IS DISTINCT FROM NEW.presence_status)
    EXECUTE FUNCTION public.handle_presence_update();
