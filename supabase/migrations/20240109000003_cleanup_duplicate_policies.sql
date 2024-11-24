-- Set schema search path
SET search_path TO public, app_types;

-- Drop all existing profile policies to ensure no duplicates
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can soft delete own profile" ON public.profiles;

-- Drop all existing presence log policies
DROP POLICY IF EXISTS "Users can view their own presence logs" ON public.presence_logs;
DROP POLICY IF EXISTS "Users can create their own presence logs" ON public.presence_logs;

-- Create clean profile policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Create clean presence log policies
CREATE POLICY "Users can manage own presence logs" ON public.presence_logs
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
