-- Update chat_rooms table to match application types
ALTER TABLE public.chat_rooms
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS last_message_preview text,
    ADD COLUMN IF NOT EXISTS last_message_timestamp timestamptz,
    ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Update chat_messages table to match application types
ALTER TABLE public.chat_messages
    ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice', 'system')),
    ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.chat_messages(id);

-- Add realtime replication for chat features
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;

-- Add function to update last message preview
CREATE OR REPLACE FUNCTION public.update_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_rooms
    SET 
        last_message_preview = NEW.content,
        last_message_timestamp = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updating last message
DROP TRIGGER IF EXISTS update_room_last_message ON public.chat_messages;
CREATE TRIGGER update_room_last_message
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_room_last_message();