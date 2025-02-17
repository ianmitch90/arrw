-- Rename location column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE public.profiles RENAME COLUMN location TO current_location;
    END IF;
END $$;

-- Add current_location column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_location geometry(Point, 4326);

-- Drop old index if it exists
DROP INDEX IF EXISTS idx_profiles_location;

-- Create new index
CREATE INDEX IF NOT EXISTS idx_profiles_current_location ON public.profiles USING GIST (current_location);
