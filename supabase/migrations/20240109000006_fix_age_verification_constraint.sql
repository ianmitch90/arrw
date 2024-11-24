-- Set schema search path
SET search_path TO public, app_types;

-- First, drop the existing constraint
ALTER TABLE public.age_verifications
DROP CONSTRAINT IF EXISTS age_verifications_user_id_fkey;

-- Add the new constraint referencing auth.users
ALTER TABLE public.age_verifications
ADD CONSTRAINT age_verifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a trigger to ensure profile exists before age verification
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- If profile doesn't exist, create it
    INSERT INTO public.profiles (id, status, created_at, updated_at)
    VALUES (NEW.user_id, 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS ensure_profile_before_verification ON public.age_verifications;
CREATE TRIGGER ensure_profile_before_verification
    BEFORE INSERT ON public.age_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_profile_exists();

-- Update existing age verifications to ensure all profiles exist
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    FOR v_user_id IN 
        SELECT DISTINCT user_id 
        FROM public.age_verifications av
        WHERE NOT EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = av.user_id
        )
    LOOP
        INSERT INTO public.profiles (id, status, created_at, updated_at)
        VALUES (v_user_id, 'active', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;
