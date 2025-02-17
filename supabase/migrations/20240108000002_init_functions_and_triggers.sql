-- Set schema search path
SET search_path TO public, app_types;

-- Set up utility functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a logging table for debugging
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp timestamptz DEFAULT now(),
    function_name text,
    step text,
    user_id uuid,
    data jsonb,
    error text
);

-- Helper function to log debug information
CREATE OR REPLACE FUNCTION public.log_debug(
    function_name text,
    step text,
    user_id uuid,
    data jsonb DEFAULT NULL,
    error text DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.debug_logs (function_name, step, user_id, data, error)
    VALUES (function_name, step, user_id, data, error);
EXCEPTION WHEN OTHERS THEN
    -- If logging fails, write to PostgreSQL's internal log
    RAISE WARNING 'Failed to write to debug_logs: % | Function: % | Step: % | User: % | Data: % | Error: %',
        SQLERRM, function_name, step, user_id, data::text, error;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Core user management functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_anonymous boolean;
    v_user_metadata jsonb;
BEGIN
    -- Initial logging of incoming data
    PERFORM public.log_debug(
        'handle_new_user',
        'start',
        NEW.id,
        jsonb_build_object(
            'raw_user_meta_data', NEW.raw_user_meta_data,
            'email', NEW.email,
            'phone', NEW.phone,
            'aud', NEW.aud,
            'role', NEW.role
        )
    );

    BEGIN
        -- Parse and validate input data
        v_user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
        is_anonymous := v_user_metadata->>'is_anonymous' = 'true' OR NEW.aud = 'anon';

        PERFORM public.log_debug(
            'handle_new_user',
            'validation',
            NEW.id,
            jsonb_build_object(
                'is_anonymous', is_anonymous,
                'user_metadata', v_user_metadata
            )
        );

        -- Create a user record
        INSERT INTO public.users (
            id,
            email,
            phone,
            full_name,
            role,
            status
        ) VALUES (
            NEW.id,
            CASE WHEN is_anonymous THEN NULL ELSE NEW.email END,
            NULL, -- Phone is always NULL initially
            COALESCE(
                v_user_metadata->>'full_name',
                v_user_metadata->>'name',
                CASE 
                    WHEN is_anonymous THEN 'Anonymous User'
                    ELSE split_part(NEW.email, '@', 1)
                END
            ),
            CASE 
                WHEN is_anonymous THEN 'anonymous'::app_types.user_role
                ELSE 'free'::app_types.user_role
            END,
            CASE 
                WHEN is_anonymous THEN 'active'::app_types.user_status
                ELSE 'pending_verification'::app_types.user_status
            END
        );

        PERFORM public.log_debug(
            'handle_new_user',
            'users_insert_success',
            NEW.id,
            jsonb_build_object(
                'table', 'users',
                'is_anonymous', is_anonymous
            )
        );

        -- Create a profile record with default privacy settings
        INSERT INTO public.profiles (
            id,
            full_name,
            privacy_settings
        ) VALUES (
            NEW.id,
            COALESCE(
                v_user_metadata->>'full_name',
                v_user_metadata->>'name',
                CASE 
                    WHEN is_anonymous THEN 'Anonymous User'
                    ELSE split_part(NEW.email, '@', 1)
                END
            ),
            jsonb_build_object(
                'location_sharing', 'private'::app_types.privacy_level,
                'profile_visibility', 'private'::app_types.privacy_level,
                'online_status', 'private'::app_types.privacy_level,
                'allow_friend_requests', false,
                'allow_messages', false
            )
        );

        PERFORM public.log_debug(
            'handle_new_user',
            'profiles_insert_success',
            NEW.id,
            jsonb_build_object(
                'table', 'profiles',
                'is_anonymous', is_anonymous
            )
        );

    EXCEPTION WHEN OTHERS THEN
        -- Log any errors that occur
        PERFORM public.log_debug(
            'handle_new_user',
            'error',
            NEW.id,
            jsonb_build_object(
                'error_code', SQLSTATE,
                'error_message', SQLERRM,
                'error_hint', SQLERRM,
                'error_context', SQLSTATE,
                'is_anonymous', is_anonymous,
                'current_step', case 
                    when not exists (select 1 from public.users where id = NEW.id) then 'users_insert'
                    when not exists (select 1 from public.profiles where id = NEW.id) then 'profiles_insert'
                    else 'unknown'
                end
            ),
            SQLERRM
        );
        RAISE EXCEPTION 'Error in handle_new_user: % (Code: %)', SQLERRM, SQLSTATE;
    END;

    -- Log successful completion
    PERFORM public.log_debug(
        'handle_new_user',
        'complete',
        NEW.id,
        jsonb_build_object(
            'success', true,
            'is_anonymous', is_anonymous
        )
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
DO $$
DECLARE
    presence_status_exists boolean;
BEGIN
    -- Check if presence_status column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'presence_status'
    ) INTO presence_status_exists;

    -- Handle new user trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_new_user') THEN
        CREATE TRIGGER handle_new_user
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;

    -- Profile updated_at trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profiles') THEN
        CREATE TRIGGER set_updated_at_profiles
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Webhook events updated_at trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_webhook_events') THEN
        CREATE TRIGGER set_updated_at_webhook_events
            BEFORE UPDATE ON public.webhook_events
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Presence update trigger - only create if presence_status column exists
    IF presence_status_exists AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_presence_update') THEN
        CREATE TRIGGER on_presence_update
            AFTER UPDATE OF presence_status ON public.profiles
            FOR EACH ROW
            WHEN (OLD.presence_status IS DISTINCT FROM NEW.presence_status)
            EXECUTE FUNCTION public.handle_presence_update();
    END IF;
END $$;
