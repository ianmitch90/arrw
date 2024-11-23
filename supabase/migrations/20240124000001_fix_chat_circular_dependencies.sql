-- Drop existing policies
DROP POLICY IF EXISTS "Users can view rooms they're in" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON public.chat_participants;

-- Create base policy for chat_participants
CREATE POLICY "Enable all for authenticated users" ON public.chat_participants
    FOR ALL USING (auth.role() = 'authenticated');

-- Room access policies - now depends on user's auth status only
CREATE POLICY "Users can view their rooms" ON public.chat_rooms
    FOR SELECT USING (
        id IN (
            SELECT room_id 
            FROM public.chat_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Message access policies - now depends on user's auth status only
CREATE POLICY "Users can view their messages" ON public.chat_messages
    FOR SELECT USING (
        room_id IN (
            SELECT room_id 
            FROM public.chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        room_id IN (
            SELECT room_id 
            FROM public.chat_participants 
            WHERE user_id = auth.uid()
        )
        AND sender_id = auth.uid()
    );

-- Add specific policies for chat_participants
CREATE POLICY "Users can view room participants" ON public.chat_participants
    FOR SELECT USING (
        -- A user can view participants in rooms where they are a member
        room_id IN (
            SELECT room_id 
            FROM public.chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join rooms" ON public.chat_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can leave rooms" ON public.chat_participants
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Add function to create a chat room with initial participants
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

    RETURN new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
