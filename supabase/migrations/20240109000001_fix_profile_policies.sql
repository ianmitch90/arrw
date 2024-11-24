-- Set schema search path
SET search_path TO public, app_types;

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can soft delete own profile" ON public.profiles;

-- Create new policies without recursive checks
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (deleted_at IS NULL);

-- Allow profile creation for authenticated and anonymous users
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (id = auth.uid());

-- Allow profile updates for authenticated users
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    USING (id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (id = auth.uid());

-- Allow soft deletion for authenticated users
CREATE POLICY "Users can soft delete own profile" ON public.profiles
    FOR UPDATE 
    USING (id = auth.uid())
    WITH CHECK (deleted_at IS NOT NULL);

-- Create trigger to ensure profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
