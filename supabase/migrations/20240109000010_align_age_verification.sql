-- Set schema search path
SET search_path TO public, app_types;

-- Add method type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_method') THEN
        CREATE TYPE app_types.verification_method AS ENUM ('modal', 'document');
    END IF;
END$$;

-- Update profiles table
DO $$
BEGIN
    -- Add age_verified_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'age_verified_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN age_verified_at timestamptz;
    END IF;

    -- Add age_verification_method if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'age_verification_method'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN age_verification_method verification_method;
    END IF;

    -- Add is_anonymous if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_anonymous'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_anonymous boolean DEFAULT false;
    END IF;
END $$;

-- Create or replace the function to handle age verification
CREATE OR REPLACE FUNCTION public.verify_user_age(
    birth_date date,
    verification_method verification_method,
    is_anonymous boolean DEFAULT false
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
            age_verification_method,
            is_anonymous,
            updated_at
        ) VALUES (
            v_user_id,
            birth_date,
            true,
            now(),
            verification_method,
            is_anonymous,
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            birth_date = EXCLUDED.birth_date,
            age_verified = true,
            age_verified_at = now(),
            age_verification_method = EXCLUDED.age_verification_method,
            is_anonymous = EXCLUDED.is_anonymous,
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
            verification_method::text::age_verification_method,
            'verified',
            jsonb_build_object(
                'birth_date', birth_date,
                'age', v_age,
                'is_anonymous', is_anonymous,
                'verification_type', CASE 
                    WHEN auth.jwt()->>'aal' = 'aal1' THEN 'email'
                    ELSE 'anonymous'
                END
            ),
            now()
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            method = EXCLUDED.method,
            status = EXCLUDED.status,
            verification_data = EXCLUDED.verification_data,
            verified_at = EXCLUDED.verified_at,
            updated_at = now();
            
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get age verification status
CREATE OR REPLACE FUNCTION public.get_age_verification_status(user_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'isVerified', age_verified,
        'verifiedAt', age_verified_at,
        'verificationMethod', age_verification_method,
        'isAnonymous', is_anonymous
    )
    INTO v_result
    FROM public.profiles
    WHERE id = user_id;

    RETURN COALESCE(v_result, jsonb_build_object(
        'isVerified', false,
        'verifiedAt', null,
        'verificationMethod', null,
        'isAnonymous', false
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
