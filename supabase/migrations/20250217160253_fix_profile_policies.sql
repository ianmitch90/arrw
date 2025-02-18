-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE policyname = 'Enable read access for authenticated users' AND tablename = 'profiles') THEN
        DROP POLICY "Enable read access for authenticated users" ON "public"."profiles";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE policyname = 'Enable insert for authenticated users only' AND tablename = 'profiles') THEN
        DROP POLICY "Enable insert for authenticated users only" ON "public"."profiles";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE policyname = 'Enable update for users based on id' AND tablename = 'profiles') THEN
        DROP POLICY "Enable update for users based on id" ON "public"."profiles";
    END IF;
END $$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS "public"."get_location_json" CASCADE;

-- Create the get_location_json function
CREATE OR REPLACE FUNCTION public.get_location_json(record_table regclass)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'type', 'Point',
            'coordinates', ARRAY[
                ST_X(current_location::geometry),
                ST_Y(current_location::geometry)
            ]
        )
        FROM record_table
        WHERE current_location IS NOT NULL
        LIMIT 1
    );
END;
$$;

-- Create new, optimized policies
CREATE POLICY "Enable read access for authenticated users"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR (
    current_location IS NOT NULL 
    AND last_location_update >= (now() - interval '24 hours')
  )
);

CREATE POLICY "Enable insert for authenticated users only"
ON "public"."profiles"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add index to improve location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON "public"."profiles" 
USING GIST (current_location)
WHERE current_location IS NOT NULL;

-- Add index for last_location_update
CREATE INDEX IF NOT EXISTS idx_profiles_last_location_update
ON "public"."profiles" (last_location_update)
WHERE last_location_update IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_location_json(regclass) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_location_json(regclass) TO service_role;

-- Check if foreign key constraint exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'places_created_by_fkey'
    ) THEN
        -- Add created_by foreign key to places table
        ALTER TABLE "public"."places" 
        ADD CONSTRAINT "places_created_by_fkey" 
        FOREIGN KEY ("created_by") 
        REFERENCES "public"."profiles"("id") 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS "idx_places_created_by" 
ON "public"."places"("created_by");