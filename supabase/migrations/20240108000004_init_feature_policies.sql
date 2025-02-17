-- Profiles policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile"
            ON public.profiles
            FOR SELECT
            USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile"
            ON public.profiles
            FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Feature access policies
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
        -- Only admins can modify features
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'features' 
            AND policyname = 'Only admins can modify features'
        ) THEN
            CREATE POLICY "Only admins can modify features"
                ON public.features
                FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM public.users
                        WHERE id = auth.uid()
                        AND role::app_types.user_role = 'admin'
                    )
                );
        END IF;

        -- Anyone can view features
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'features' 
            AND policyname = 'Anyone can view features'
        ) THEN
            CREATE POLICY "Anyone can view features"
                ON public.features
                FOR SELECT
                USING (true);
        END IF;

        -- Only admins can modify subscription features
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'subscription_features' 
            AND policyname = 'Only admins can modify subscription features'
        ) THEN
            CREATE POLICY "Only admins can modify subscription features"
                ON public.subscription_features
                FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM public.users
                        WHERE id = auth.uid()
                        AND role::app_types.user_role = 'admin'
                    )
                );
        END IF;

        -- Anyone can view subscription features
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'subscription_features' 
            AND policyname = 'Anyone can view subscription features'
        ) THEN
            CREATE POLICY "Anyone can view subscription features"
                ON public.subscription_features
                FOR SELECT
                USING (true);
        END IF;
    END IF;
END $$;

-- Feature usage policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'feature_usage' 
        AND policyname = 'Users can track their own feature usage'
    ) THEN
        CREATE POLICY "Users can track their own feature usage"
            ON public.feature_usage
            FOR ALL
            USING (
                user_id = auth.uid()
                AND (
                    -- Allow both authenticated and anonymous users
                    auth.jwt()->>'aud' IN ('authenticated', 'anon')
                )
            )
            WITH CHECK (
                user_id = auth.uid()
                AND (
                    -- Allow both authenticated and anonymous users
                    auth.jwt()->>'aud' IN ('authenticated', 'anon')
                )
            );
    END IF;
END $$;

-- Allow anonymous users to view available features
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'features' 
        AND policyname = 'Anonymous users can view features'
    ) THEN
        CREATE POLICY "Anonymous users can view features"
            ON public.features
            FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscription_features' 
        AND policyname = 'Anonymous users can view subscription features'
    ) THEN
        CREATE POLICY "Anonymous users can view subscription features"
            ON public.subscription_features
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Presence logs policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'presence_logs' 
        AND policyname = 'Users can view their own presence logs'
    ) THEN
        CREATE POLICY "Users can view their own presence logs"
            ON public.presence_logs
            FOR SELECT
            USING (
                user_id = auth.uid() 
                AND EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid()
                    AND (privacy_settings->>'sharePresence')::boolean = true
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'presence_logs' 
        AND policyname = 'Users can create their own presence logs'
    ) THEN
        CREATE POLICY "Users can create their own presence logs"
            ON public.presence_logs
            FOR INSERT
            WITH CHECK (
                user_id = auth.uid()
                AND EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid()
                    AND (privacy_settings->>'sharePresence')::boolean = true
                    AND auth.jwt()->>'aud' = 'authenticated'
                )
            );
    END IF;
END $$;

-- Zone presence policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'zone_presence' 
        AND policyname = 'Users can view their own zone presence'
    ) THEN
        CREATE POLICY "Users can view their own zone presence"
            ON public.zone_presence
            FOR SELECT
            USING (
                user_id = auth.uid()
                AND EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid()
                    AND auth.jwt()->>'aud' = 'authenticated'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'zone_presence' 
        AND policyname = 'Users can record their own zone presence'
    ) THEN
        CREATE POLICY "Users can record their own zone presence"
            ON public.zone_presence
            FOR INSERT
            WITH CHECK (
                user_id = auth.uid()
                AND EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid()
                    AND auth.jwt()->>'aud' = 'authenticated'
                )
            );
    END IF;
END $$;

-- Additional location-based policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view nearby users'
    ) THEN
        CREATE POLICY "Users can view nearby users"
            ON public.profiles
            FOR SELECT
            USING (
                id = auth.uid()
                OR (
                    current_location IS NOT NULL
                    AND last_location_update >= now() - interval '24 hours'
                    AND ST_DWithin(
                        current_location::geometry,
                        (
                            SELECT current_location::geometry
                            FROM public.profiles
                            WHERE id = auth.uid()
                        ),
                        5000  -- 5km radius
                    )
                )
            );
    END IF;

    -- Add privacy-aware policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view others based on privacy settings'
    ) THEN
        CREATE POLICY "Users can view others based on privacy settings"
            ON public.profiles
            FOR SELECT
            USING (
                id = auth.uid()
                OR (
                    privacy_settings->>'locationSharing' = 'public'
                    OR (
                        privacy_settings->>'locationSharing' = 'friends'
                        AND EXISTS (
                            SELECT 1 FROM public.friends
                            WHERE (user_id = auth.uid() AND friend_id = profiles.id)
                            AND status = 'accepted'
                        )
                    )
                )
            );
    END IF;
END $$;

-- Add webhook policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_events' 
        AND policyname = 'Only system can access webhook events'
    ) THEN
        CREATE POLICY "Only system can access webhook events"
            ON public.webhook_events
            FOR ALL
            USING (auth.uid() IS NULL);
    END IF;
END $$;

-- Add customer policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Users can view their own customer data'
    ) THEN
        CREATE POLICY "Users can view their own customer data"
            ON public.customers
            FOR SELECT
            USING (id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'System can manage customer data'
    ) THEN
        CREATE POLICY "System can manage customer data"
            ON public.customers
            FOR ALL
            USING (auth.uid() IS NULL);
    END IF;
END $$;

-- Add verification status policies
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
            WHERE tablename = 'profiles' 
            AND policyname = 'Users can view verification status'
        ) THEN
            CREATE POLICY "Users can view verification status"
                ON public.profiles
                FOR SELECT
                USING (
                    id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM public.users
                        WHERE id = auth.uid()
                        AND role::app_types.user_role = 'admin'
                    )
                );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' 
            AND policyname = 'Only admins can update verification status'
        ) THEN
            CREATE POLICY "Only admins can update verification status"
                ON public.profiles
                FOR UPDATE
                USING (
                    EXISTS (
                        SELECT 1 FROM public.users
                        WHERE id = auth.uid()
                        AND role::app_types.user_role = 'admin'
                    )
                )
                WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM public.users
                        WHERE id = auth.uid()
                        AND role::app_types.user_role = 'admin'
                    )
                );
        END IF;
    END IF;
END $$;
