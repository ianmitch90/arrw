-- Ensure user_status type exists
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending_verification', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure users table exists
CREATE TABLE IF NOT EXISTS users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text,
    status user_status DEFAULT 'pending_verification',
    birth_date date,
    age integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop existing age verification related tables and functions
DROP TABLE IF EXISTS age_verifications CASCADE;

-- Recreate age_verifications table with new schema
CREATE TABLE age_verifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    acknowledged boolean DEFAULT false,
    acknowledged_at timestamp with time zone,
    verified boolean DEFAULT false,
    verified_at timestamp with time zone,
    birth_date date,
    method text CHECK (method IN ('modal', 'document')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX age_verifications_user_id_idx ON age_verifications(user_id);
CREATE INDEX age_verifications_verified_idx ON age_verifications(verified);
CREATE INDEX age_verifications_acknowledged_idx ON age_verifications(acknowledged);

-- Add RLS policies
ALTER TABLE age_verifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own age verification status
CREATE POLICY "Users can read their own age verification"
    ON age_verifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own age verification
CREATE POLICY "Users can update their own age verification"
    ON age_verifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own age verification
CREATE POLICY "Users can insert their own age verification"
    ON age_verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_age_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_age_verifications_updated_at
    BEFORE UPDATE ON age_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_age_verifications_updated_at();

-- Update user status enum to include pending_verification
DO $$ BEGIN
    ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'pending_verification';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comment for documentation
COMMENT ON TABLE age_verifications IS 'Tracks user age verification status with a two-step process: initial acknowledgment and full verification';
COMMENT ON COLUMN age_verifications.acknowledged IS 'Indicates if user has acknowledged age requirement via modal';
COMMENT ON COLUMN age_verifications.verified IS 'Indicates if user has completed full age verification with birth date';
COMMENT ON COLUMN age_verifications.method IS 'Method used for verification: modal (quick acknowledgment) or document (full verification)';
