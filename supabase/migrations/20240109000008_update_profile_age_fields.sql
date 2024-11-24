-- Set schema search path
SET search_path TO public, app_types;

-- Add age verification status to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'age_verified'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN age_verified boolean DEFAULT false;
    END IF;

    -- Ensure birth_date exists (it should, but let's be safe)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'birth_date'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN birth_date date;
    END IF;
END $$;

-- Create a function to validate and update age verification
CREATE OR REPLACE FUNCTION public.verify_user_age(
    p_user_id uuid,
    p_birth_date date
) RETURNS boolean AS $$
DECLARE
    v_age integer;
BEGIN
    -- Calculate age
    v_age := date_part('year', age(p_birth_date));
    
    -- Check if user is at least 18
    IF v_age >= 18 THEN
        -- Update profile
        UPDATE public.profiles
        SET 
            birth_date = p_birth_date,
            age_verified = true,
            updated_at = now()
        WHERE id = p_user_id;
        
        -- Create or update age verification record
        INSERT INTO public.age_verifications (
            user_id,
            method,
            status,
            verification_data,
            verified_at
        ) VALUES (
            p_user_id,
            'birth_date',
            'verified',
            jsonb_build_object(
                'birth_date', p_birth_date,
                'age', v_age
            ),
            now()
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            status = 'verified',
            verification_data = jsonb_build_object(
                'birth_date', p_birth_date,
                'age', v_age
            ),
            verified_at = now(),
            updated_at = now();
            
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
