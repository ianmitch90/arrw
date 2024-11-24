-- Set schema search path
SET search_path TO public, app_types;

-- Drop existing location history policies
DROP POLICY IF EXISTS "Users can view their own location history" ON public.location_history;

-- Create new location history policy without recursion
CREATE POLICY "Users can view their own location history" ON public.location_history
    FOR SELECT
    USING (user_id = auth.uid());

-- Create policy for inserting location history
CREATE POLICY "Users can insert their own location history" ON public.location_history
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create policy for deleting location history
CREATE POLICY "Users can delete their own location history" ON public.location_history
    FOR DELETE
    USING (user_id = auth.uid());
