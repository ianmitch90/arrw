-- Test script for age verification flow
SET search_path TO public, app_types;

-- Helper function to simulate the flow
CREATE OR REPLACE FUNCTION test_age_verification_flow(
    test_email text,
    test_password text,
    birth_date date,
    is_anonymous boolean DEFAULT false
) RETURNS text AS $$
DECLARE
    v_user_id uuid;
    v_verification_status jsonb;
    v_verification_result boolean;
BEGIN
    -- Step 1: Create a test user (or get anonymous session)
    IF NOT is_anonymous THEN
        -- Regular user signup
        v_user_id := (
            SELECT id FROM auth.users 
            WHERE email = test_email
            LIMIT 1
        );
        
        IF v_user_id IS NULL THEN
            v_user_id := (
                SELECT id FROM auth.users
                WHERE email = test_email
                LIMIT 1
            );
            
            IF v_user_id IS NULL THEN
                RETURN 'Error: Failed to create or find test user';
            END IF;
        END IF;
    ELSE
        -- For anonymous, we'll use a placeholder ID
        -- In reality, this would be handled by Supabase's anon signing
        v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;

    -- Step 2: Check initial verification status
    v_verification_status := get_age_verification_status(v_user_id);
    IF (v_verification_status->>'isVerified')::boolean = true THEN
        RETURN 'User is already verified';
    END IF;

    -- Step 3: Verify age
    v_verification_result := verify_user_age(
        birth_date,
        'modal'::verification_method,
        is_anonymous
    );

    IF NOT v_verification_result THEN
        RETURN 'Age verification failed - User might be under 18';
    END IF;

    -- Step 4: Check final verification status
    v_verification_status := get_age_verification_status(v_user_id);
    
    -- Step 5: Verify all data was stored correctly
    IF NOT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = v_user_id 
        AND age_verified = true 
        AND age_verified_at IS NOT NULL
        AND birth_date = $3
        AND is_anonymous = is_anonymous
    ) THEN
        RETURN 'Error: Profile data not stored correctly';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM public.age_verifications 
        WHERE user_id = v_user_id 
        AND status = 'verified'
        AND verified_at IS NOT NULL
    ) THEN
        RETURN 'Error: Age verification record not stored correctly';
    END IF;

    RETURN 'Success: User verified and all data stored correctly';
END;
$$ LANGUAGE plpgsql;

-- Test Cases

-- Test 1: Regular user, valid age
SELECT test_age_verification_flow(
    'test_user@example.com',
    'password123',
    '2000-01-01'::date,
    false
) AS "Test 1: Regular user, valid age";

-- Test 2: Regular user, underage
SELECT test_age_verification_flow(
    'test_underage@example.com',
    'password123',
    '2010-01-01'::date,
    false
) AS "Test 2: Regular user, underage";

-- Test 3: Anonymous user, valid age
SELECT test_age_verification_flow(
    NULL,
    NULL,
    '1995-01-01'::date,
    true
) AS "Test 3: Anonymous user, valid age";

-- Test 4: Anonymous user, underage
SELECT test_age_verification_flow(
    NULL,
    NULL,
    '2010-01-01'::date,
    true
) AS "Test 4: Anonymous user, underage";

-- Cleanup test data
DO $$
BEGIN
    -- Clean up test profiles
    DELETE FROM public.profiles 
    WHERE id IN (
        SELECT id FROM auth.users 
        WHERE email IN ('test_user@example.com', 'test_underage@example.com')
    );
    
    -- Clean up test age verifications
    DELETE FROM public.age_verifications 
    WHERE user_id IN (
        SELECT id FROM auth.users 
        WHERE email IN ('test_user@example.com', 'test_underage@example.com')
    );
    
    -- Clean up test users
    DELETE FROM auth.users 
    WHERE email IN ('test_user@example.com', 'test_underage@example.com');
END $$;
