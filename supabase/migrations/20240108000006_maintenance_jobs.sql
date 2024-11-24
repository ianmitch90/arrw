-- Set up maintenance jobs safely
DO $$
BEGIN
    -- Only create schedules if pg_cron extension exists
    IF EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'pg_cron'
    ) THEN
        -- Remove existing jobs if they exist
        PERFORM cron.unschedule('cleanup_location_history');
        PERFORM cron.unschedule('cleanup_presence_logs');

        -- Schedule new jobs
        PERFORM cron.schedule(
            'cleanup_location_history',
            '0 0 * * *',  -- Run daily at midnight
            'CALL public.cleanup_location_history()'
        );

        PERFORM cron.schedule(
            'cleanup_presence_logs',
            '0 * * * *',  -- Run hourly
            'DELETE FROM presence_logs WHERE created_at < now() - interval ''7 days'''
        );
    END IF;
END $$;
