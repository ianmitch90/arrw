-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Feature access policies
DO $$
BEGIN
    -- Only admins can modify features
    CREATE POLICY "Only admins can modify features"
        ON public.features
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid()
                AND role = 'admin'
            )
        );

    -- Anyone can view features
    CREATE POLICY "Anyone can view features"
        ON public.features
        FOR SELECT
        USING (true);

    -- Only admins can modify subscription features
    CREATE POLICY "Only admins can modify subscription features"
        ON public.subscription_features
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid()
                AND role = 'admin'
            )
        );

    -- Anyone can view subscription features
    CREATE POLICY "Anyone can view subscription features"
        ON public.subscription_features
        FOR SELECT
        USING (true);
END $$;

-- Feature usage policies
CREATE POLICY "Users can view their own feature usage"
    ON public.feature_usage
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can record their own feature usage"
    ON public.feature_usage
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Presence logs policies
CREATE POLICY "Users can view their own presence logs"
    ON public.presence_logs
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own presence logs"
    ON public.presence_logs
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Zone presence policies
CREATE POLICY "Users can view their own zone presence"
    ON public.zone_presence
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can record their own zone presence"
    ON public.zone_presence
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Additional location-based policies
CREATE POLICY "Users can view nearby active users"
    ON public.profiles
    FOR SELECT
    USING (
        status = 'active'
        AND (
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
        )
    );

-- Add privacy-aware policies
CREATE POLICY "Users can view others based on privacy settings"
    ON public.profiles
    FOR SELECT
    USING (
        id = auth.uid()
        OR (
            CASE 
                WHEN location_sharing = 'public' THEN true
                WHEN location_sharing = 'friends' THEN EXISTS (
                    SELECT 1 FROM public.friends
                    WHERE (user_id = auth.uid() AND friend_id = profiles.id)
                    AND status = 'accepted'
                )
                ELSE false
            END
        )
    );

-- Add webhook policies
CREATE POLICY "Only system can access webhook events"
    ON public.webhook_events
    FOR ALL
    USING (auth.uid() IS NULL);

-- Add customer policies
CREATE POLICY "Users can view their own customer data"
    ON public.customers
    FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "System can manage customer data"
    ON public.customers
    FOR ALL
    USING (auth.uid() IS NULL);

-- Add verification status policies
CREATE POLICY "Users can view verification status"
    ON public.profiles
    FOR SELECT
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update verification status"
    ON public.profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
