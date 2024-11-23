-- First, drop all existing chat-related policies
DROP POLICY IF EXISTS "Users can view rooms they're in" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.chat_participants;

-- Create materialized view for user room memberships
-- This will serve as our source of truth for room membership
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_room_memberships AS
SELECT DISTINCT user_id, room_id
FROM public.chat_participants;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_room_memberships 
ON public.user_room_memberships(user_id, room_id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_user_room_memberships()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_room_memberships;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to refresh the view when chat_participants changes
DROP TRIGGER IF EXISTS refresh_memberships_trigger ON public.chat_participants;
CREATE TRIGGER refresh_memberships_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.chat_participants
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.refresh_user_room_memberships();

-- Create policies using the materialized view
CREATE POLICY "Users can view their rooms" ON public.chat_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM public.user_room_memberships 
            WHERE user_id = auth.uid() 
            AND room_id = chat_rooms.id
        )
    );

CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM public.user_room_memberships 
            WHERE user_id = auth.uid() 
            AND room_id = chat_messages.room_id
        )
    );

CREATE POLICY "Users can send messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.user_room_memberships 
            WHERE user_id = auth.uid() 
            AND room_id = chat_messages.room_id
        )
        AND sender_id = auth.uid()
    );

-- Policies for chat_participants
CREATE POLICY "Users can view room participants" ON public.chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM public.user_room_memberships 
            WHERE user_id = auth.uid() 
            AND room_id = chat_participants.room_id
        )
    );

CREATE POLICY "Users can join rooms" ON public.chat_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        -- Add any additional checks for room joining permissions here
    );

CREATE POLICY "Users can leave rooms" ON public.chat_participants
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Create helper function for creating chat rooms
CREATE OR REPLACE FUNCTION public.create_chat_room(
    room_type TEXT,
    room_name TEXT,
    participant_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
    new_room_id UUID;
BEGIN
    -- Insert the new room
    INSERT INTO public.chat_rooms (type, name, created_by)
    VALUES (room_type, room_name, auth.uid())
    RETURNING id INTO new_room_id;

    -- Add the creator as a participant
    INSERT INTO public.chat_participants (room_id, user_id, role)
    VALUES (new_room_id, auth.uid(), 'owner');

    -- Add other participants
    INSERT INTO public.chat_participants (room_id, user_id)
    SELECT new_room_id, unnest(participant_ids)
    WHERE NOT unnest(participant_ids) = auth.uid();

    -- Refresh the memberships view
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_room_memberships;

    RETURN new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW public.user_room_memberships;
