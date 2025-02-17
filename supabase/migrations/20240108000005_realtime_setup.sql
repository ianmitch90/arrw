-- Set up realtime publications safely
DO $$
DECLARE
    presence_status_exists boolean;
    current_location_exists boolean;
    zones_exist boolean;
    zone_presence_exists boolean;
BEGIN
    -- Check column existence
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'presence_status'
    ) INTO presence_status_exists;

    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'current_location'
    ) INTO current_location_exists;

    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'zones'
    ) INTO zones_exist;

    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'zone_presence'
    ) INTO zone_presence_exists;

    -- Drop existing publication if it exists
    DROP PUBLICATION IF EXISTS supabase_realtime;
    
    -- Create new publication with specific column selection based on what exists
    IF presence_status_exists AND current_location_exists THEN
        IF zones_exist AND zone_presence_exists THEN
            CREATE PUBLICATION supabase_realtime FOR TABLE
                profiles (id, presence_status, last_seen_at, current_location),
                zones (id, name, geometry),
                zone_presence (id, user_id, zone_id, entered_at, exited_at);
        ELSE
            CREATE PUBLICATION supabase_realtime FOR TABLE
                profiles (id, presence_status, last_seen_at, current_location);
        END IF;
    ELSE
        IF zones_exist AND zone_presence_exists THEN
            CREATE PUBLICATION supabase_realtime FOR TABLE
                zones (id, name, geometry),
                zone_presence (id, user_id, zone_id, entered_at, exited_at);
        ELSE
            -- Create an empty publication if no tables are ready
            CREATE PUBLICATION supabase_realtime;
        END IF;
    END IF;
END $$;
