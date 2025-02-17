-- Set schema search path
SET search_path TO public, app_types;

-- Drop existing location history policies
DROP POLICY IF EXISTS "Users can view their own location history" ON public.location_history;

DO $$
BEGIN
    -- Policy for viewing location history
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'location_history' 
        AND policyname = 'Users can view their own location history'
    ) THEN
        CREATE POLICY "Users can view their own location history"
            ON public.location_history
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    -- Policy for inserting location history
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'location_history' 
        AND policyname = 'Users can insert their own location history'
    ) THEN
        CREATE POLICY "Users can insert their own location history"
            ON public.location_history
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;

    -- Policy for deleting location history
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'location_history' 
        AND policyname = 'Users can delete their own location history'
    ) THEN
        CREATE POLICY "Users can delete their own location history"
            ON public.location_history
            FOR DELETE
            USING (user_id = auth.uid());
    END IF;
END $$;