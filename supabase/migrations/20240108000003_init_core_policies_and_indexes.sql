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
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
            FOR SELECT USING (deleted_at IS NULL);
    END IF;

    -- Users (including anonymous) can insert their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.profiles
            FOR INSERT 
            WITH CHECK (
                auth.uid() = id 
                OR (auth.jwt()->>'aud' = 'anon' AND id = auth.uid())
            );
    END IF;

    -- Users (including anonymous) can update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
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
    END IF;

    -- Soft deletion policy (authenticated users only)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can soft delete own profile'
    ) THEN
        CREATE POLICY "Users can soft delete own profile" ON public.profiles
            FOR UPDATE 
            USING (auth.uid() = id AND auth.jwt()->>'aud' = 'authenticated')
            WITH CHECK (deleted_at IS NOT NULL);
    END IF;
END $$;

-- Set up policies for features
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'features' 
        AND policyname = 'Users can view features'
    ) THEN
        CREATE POLICY "Users can view features" ON public.features
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Set up policies for subscription features
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscription_features' 
        AND policyname = 'Users can view subscription features'
    ) THEN
        CREATE POLICY "Users can view subscription features" ON public.subscription_features
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Set up policies for location history
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'location_history' 
        AND policyname = 'Users can view their own location history'
    ) THEN
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
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'location_history' 
        AND policyname = 'Users can add to their location history'
    ) THEN
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
    END IF;
END $$;

-- Set up policies for webhook events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_events' 
        AND policyname = 'System can view webhook events'
    ) THEN
        CREATE POLICY "System can view webhook events" ON public.webhook_events
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Zones policies
DO $$
DECLARE
    role_type_exists boolean;
    users_table_exists boolean;
    role_column_exists boolean;
BEGIN
    -- Check if user_role type exists
    SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'user_role'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app_types')
    ) INTO role_type_exists;

    -- Check if users table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
    ) INTO users_table_exists;

    -- Check if role column exists in users table
    IF users_table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'role'
        ) INTO role_column_exists;
    END IF;

    IF role_type_exists AND users_table_exists AND role_column_exists THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'zones' 
            AND policyname = 'Anyone can view public zones'
        ) THEN
            CREATE POLICY "Anyone can view public zones"
                ON public.zones
                FOR SELECT
                USING (
                    COALESCE(metadata->>'visibility', 'public') = 'public'
                    OR EXISTS (
                        SELECT 1 FROM public.users
                        WHERE id = auth.uid()
                        AND role::app_types.user_role = 'admin'
                    )
                );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'zones' 
            AND policyname = 'Only admins can modify zones'
        ) THEN
            CREATE POLICY "Only admins can modify zones"
                ON public.zones
                FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM public.users
                        WHERE id = auth.uid()
                        AND role::app_types.user_role = 'admin'
                    )
                );
        END IF;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;
