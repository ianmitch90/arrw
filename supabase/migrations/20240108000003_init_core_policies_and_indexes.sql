-- Set schema search path
SET search_path TO public, app_types;

-- Enable RLS on all core tables
DO $$
BEGIN
    -- Core tables
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
END $$;

-- Set default deny policies
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN (
            'users',
            'profiles',
            'features',
            'subscription_features',
            'location_history',
            'webhook_events'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;

-- Set up policies for profiles table
DO $$
BEGIN
    -- Anyone can view non-deleted profiles
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
        FOR SELECT USING (deleted_at IS NULL);

    -- Users (including anonymous) can insert their own profile
    CREATE POLICY "Users can insert own profile" ON public.profiles
        FOR INSERT 
        WITH CHECK (
            auth.uid() = id 
            OR (auth.jwt()->>'aud' = 'anon' AND id = auth.uid())
        );

    -- Users (including anonymous) can update their own profile
    CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE 
        USING (
            (auth.uid() = id AND deleted_at IS NULL)
            OR (auth.jwt()->>'aud' = 'anon' AND id = auth.uid())
        )
        WITH CHECK (
            (auth.uid() = id)
            OR (auth.jwt()->>'aud' = 'anon' AND id = auth.uid())
        );

    -- Soft deletion policy (authenticated users only)
    CREATE POLICY "Users can soft delete own profile" ON public.profiles
        FOR UPDATE 
        USING (auth.uid() = id AND auth.jwt()->>'aud' = 'authenticated')
        WITH CHECK (deleted_at IS NOT NULL);
END $$;

-- Set up policies for features
DO $$
BEGIN
    CREATE POLICY "Users can view features" ON public.features
        FOR SELECT
        USING (true);
END $$;

-- Set up policies for subscription features
DO $$
BEGIN
    CREATE POLICY "Users can view subscription features" ON public.subscription_features
        FOR SELECT
        USING (true);
END $$;

-- Set up policies for location history
DO $$
BEGIN
    CREATE POLICY "Users can view their own location history" ON public.location_history
        FOR SELECT
        USING (
            user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND (privacy_settings->>'allowLocationHistory')::boolean = true
            )
        );
    
    CREATE POLICY "Users can add to their location history" ON public.location_history
        FOR INSERT
        WITH CHECK (
            user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND (privacy_settings->>'allowLocationHistory')::boolean = true
            )
        );
END $$;

-- Set up policies for webhook events
DO $$
BEGIN
    CREATE POLICY "System can view webhook events" ON public.webhook_events
        FOR SELECT
        USING (true);
END $$;

-- Zones policies
CREATE POLICY "Anyone can view public zones"
    ON public.zones
    FOR SELECT
    USING (
        COALESCE(metadata->>'visibility', 'public') = 'public'
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can modify zones"
    ON public.zones
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;
