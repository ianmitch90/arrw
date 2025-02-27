-- Set schema search path
SET search_path TO public, app_types;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own age verifications" ON public.age_verifications;
DROP POLICY IF EXISTS "Users can create their own age verifications" ON public.age_verifications;
DROP POLICY IF EXISTS "Only system can manage age verifications" ON public.age_verifications;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'age_verifications' 
        AND policyname = 'Users can view their own age verifications'
    ) THEN
        CREATE POLICY "Users can view their own age verifications"
            ON public.age_verifications
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'age_verifications' 
        AND policyname = 'Users can create their own age verifications'
    ) THEN
        CREATE POLICY "Users can create their own age verifications"
            ON public.age_verifications
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'age_verifications' 
        AND policyname = 'Users can update their own age verifications'
    ) THEN
        CREATE POLICY "Users can update their own age verifications"
            ON public.age_verifications
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (
                user_id = auth.uid() 
                AND status = 'pending'
            );
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'age_verifications' 
        AND policyname = 'System can manage all age verifications'
    ) THEN
        CREATE POLICY "System can manage all age verifications"
            ON public.age_verifications
            FOR ALL
            USING (auth.jwt()->>'role' = 'service_role');
    END IF;
END $$;
