-- Set up realtime publications safely
DO $$
BEGIN
    -- Drop existing publication if it exists
    DROP PUBLICATION IF EXISTS supabase_realtime;
    
    -- Create new publication with specific column selection
    CREATE PUBLICATION supabase_realtime FOR TABLE
        profiles (id, presence_status, last_seen_at, current_location),
        zones (id, name, geometry),
        zone_presence (id, user_id, zone_id, entered_at, exited_at);
END $$;
