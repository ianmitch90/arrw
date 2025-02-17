-- Add preferences tables
CREATE TABLE IF NOT EXISTS public.sexual_preferences (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_genders gender_identity[],
    preferred_age_min integer CHECK (preferred_age_min >= 18),
    preferred_age_max integer CHECK (preferred_age_max >= preferred_age_min),
    preferred_distance integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications jsonb DEFAULT '{"marketing": false, "security": true, "social": true}'::jsonb,
    push_notifications jsonb DEFAULT '{"marketing": false, "security": true, "social": true}'::jsonb,
    quiet_hours_start time,
    quiet_hours_end time,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.privacy_preferences (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_location boolean DEFAULT true,
    share_activity boolean DEFAULT true,
    share_presence boolean DEFAULT true,
    share_contacts boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS (idempotent, safe to run multiple times)
ALTER TABLE public.sexual_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_preferences ENABLE ROW LEVEL SECURITY;

-- Add RLS policies defensively
DO $$
BEGIN
    -- Sexual preferences policies
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'sexual_preferences' 
        AND policyname = 'Users can view their own sexual preferences'
    ) THEN
        CREATE POLICY "Users can view their own sexual preferences"
            ON public.sexual_preferences
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'sexual_preferences' 
        AND policyname = 'Users can manage their own sexual preferences'
    ) THEN
        CREATE POLICY "Users can manage their own sexual preferences"
            ON public.sexual_preferences
            FOR ALL
            USING (user_id = auth.uid());
    END IF;

    -- Notification preferences policies
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'notification_preferences' 
        AND policyname = 'Users can view their own notification preferences'
    ) THEN
        CREATE POLICY "Users can view their own notification preferences"
            ON public.notification_preferences
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'notification_preferences' 
        AND policyname = 'Users can manage their own notification preferences'
    ) THEN
        CREATE POLICY "Users can manage their own notification preferences"
            ON public.notification_preferences
            FOR ALL
            USING (user_id = auth.uid());
    END IF;

    -- Privacy preferences policies
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'privacy_preferences' 
        AND policyname = 'Users can view their own privacy preferences'
    ) THEN
        CREATE POLICY "Users can view their own privacy preferences"
            ON public.privacy_preferences
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'privacy_preferences' 
        AND policyname = 'Users can manage their own privacy preferences'
    ) THEN
        CREATE POLICY "Users can manage their own privacy preferences"
            ON public.privacy_preferences
            FOR ALL
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Add triggers defensively
DO $$
BEGIN
    -- Sexual preferences trigger
    IF NOT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'set_updated_at' 
        AND tgrelid = 'public.sexual_preferences'::regclass
    ) THEN
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.sexual_preferences
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Notification preferences trigger
    IF NOT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'set_updated_at' 
        AND tgrelid = 'public.notification_preferences'::regclass
    ) THEN
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.notification_preferences
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Privacy preferences trigger
    IF NOT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'set_updated_at' 
        AND tgrelid = 'public.privacy_preferences'::regclass
    ) THEN
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.privacy_preferences
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;
