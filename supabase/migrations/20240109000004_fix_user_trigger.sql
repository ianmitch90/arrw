-- Set schema search path
SET search_path TO public, app_types;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Then drop the function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a simplified user handler that avoids recursion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_anonymous boolean;
    v_user_metadata jsonb;
BEGIN
    -- Parse input data
    v_user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    is_anonymous := v_user_metadata->>'is_anonymous' = 'true' OR NEW.aud = 'anon';

    -- Create a user record
    INSERT INTO public.users (
        id,
        email,
        phone,
        full_name,
        role,
        status
    ) VALUES (
        NEW.id,
        CASE WHEN is_anonymous THEN NULL ELSE NEW.email END,
        NULL,
        COALESCE(
            v_user_metadata->>'full_name',
            v_user_metadata->>'name',
            CASE 
                WHEN is_anonymous THEN 'Anonymous User'
                ELSE split_part(NEW.email, '@', 1)
            END
        ),
        CASE 
            WHEN is_anonymous THEN 'anonymous'::app_types.user_role
            ELSE 'free'::app_types.user_role
        END,
        CASE 
            WHEN is_anonymous THEN 'active'::app_types.user_status
            ELSE 'pending_verification'::app_types.user_status
        END
    );

    -- Create a profile record
    INSERT INTO public.profiles (
        id,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        'active',
        NOW(),
        NOW()
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to handle new user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
