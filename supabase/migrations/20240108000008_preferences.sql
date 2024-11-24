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

-- Enable RLS
ALTER TABLE public.sexual_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_preferences ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own sexual preferences"
    ON public.sexual_preferences
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sexual preferences"
    ON public.sexual_preferences
    FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own notification preferences"
    ON public.notification_preferences
    FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own privacy preferences"
    ON public.privacy_preferences
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own privacy preferences"
    ON public.privacy_preferences
    FOR ALL
    USING (user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.sexual_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.privacy_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
