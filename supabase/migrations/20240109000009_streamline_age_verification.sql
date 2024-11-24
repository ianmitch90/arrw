-- Set schema search path
SET search_path TO public, app_types;

-- Add age_verified flag to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'age_verified'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN age_verified boolean DEFAULT false;
    END IF;
END $$;

-- Create or replace the function to handle age verification
CREATE OR REPLACE FUNCTION public.verify_user_age(
    birth_date date
) RETURNS boolean AS $$
DECLARE
    v_age integer;
    v_user_id uuid;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Calculate age
    v_age := date_part('year', age(birth_date));
    
    -- Check if user is at least 18
    IF v_age >= 18 THEN
        -- Update or create profile
        INSERT INTO public.profiles (
            id,
            birth_date,
            age_verified,
            age_verified_at,
            updated_at
        ) VALUES (
            v_user_id,
            birth_date,
            true,
            now(),
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            birth_date = EXCLUDED.birth_date,
            age_verified = true,
            age_verified_at = EXCLUDED.age_verified_at,
            updated_at = now();
        
        -- Create or update age verification record
        INSERT INTO public.age_verifications (
            user_id,
            method,
            status,
            verification_data,
            verified_at
        ) VALUES (
            v_user_id,
            'none',
            'verified',
            jsonb_build_object(
                'birth_date', birth_date,
                'age', v_age,
                'verification_type', CASE 
                    WHEN auth.jwt()->>'aal' = 'aal1' THEN 'email'
                    ELSE 'anonymous'
                END
            ),
            now()
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            status = 'verified',
            verification_data = jsonb_build_object(
                'birth_date', birth_date,
                'age', v_age,
                'verification_type', CASE 
                    WHEN auth.jwt()->>'aal' = 'aal1' THEN 'email'
                    ELSE 'anonymous'
                END
            ),
            verified_at = now(),
            updated_at = now();
            
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS is enabled
ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own age verifications" ON public.age_verifications;
DROP POLICY IF EXISTS "Users can verify their age" ON public.age_verifications;
DROP POLICY IF EXISTS "Users can update pending verifications" ON public.age_verifications;

-- Update policies to be more permissive for both regular and anonymous users
CREATE POLICY "Users can view their own age verifications"
    ON public.age_verifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can verify their age"
    ON public.age_verifications
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update pending verifications"
    ON public.age_verifications
    FOR UPDATE
    USING (user_id = auth.uid() AND status = 'pending')
    WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Create a function to check if a user is age verified
CREATE OR REPLACE FUNCTION public.is_age_verified(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = user_id 
        AND age_verified = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
