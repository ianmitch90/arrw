-- Enhanced Chat System Migration
-- This migration adds and updates tables for the chat system

-- Message Types
CREATE TYPE public.message_type AS ENUM (
    'text',
    'image',
    'file',
    'voice',
    'system'
);

-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT CHECK (type IN ('direct', 'group')) NOT NULL,
    name TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_message_preview TEXT,
    last_message_timestamp TIMESTAMP WITH TIME ZONE
);

-- Chat Room Participants
CREATE TABLE IF NOT EXISTS public.chat_participants (
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    unread_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (room_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message_type public.message_type DEFAULT 'text'::public.message_type,
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    parent_id UUID REFERENCES public.chat_messages(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_updated ON public.chat_rooms(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent ON public.chat_messages(parent_id) WHERE parent_id IS NOT NULL;

-- Function to update room's last message
CREATE OR REPLACE FUNCTION public.update_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_rooms
    SET 
        last_message_preview = 
            CASE 
                WHEN NEW.message_type = 'text' THEN 
                    SUBSTRING(NEW.content, 1, 100)
                WHEN NEW.message_type = 'image' THEN 
                    '📷 Image'
                WHEN NEW.message_type = 'file' THEN 
                    CASE 
                        WHEN NEW.metadata->>'fileName' IS NOT NULL 
                        THEN '📎 ' || (NEW.metadata->>'fileName')
                        ELSE '📎 File'
                    END
                WHEN NEW.message_type = 'voice' THEN 
                    '🎤 Voice Message'
                ELSE 
                    'Message'
            END,
        last_message_timestamp = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update unread counts
CREATE OR REPLACE FUNCTION public.update_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_participants
    SET unread_count = unread_count + 1
    WHERE room_id = NEW.room_id
    AND user_id != NEW.sender_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS on_message_inserted ON public.chat_messages;
CREATE TRIGGER on_message_inserted
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_room_last_message();

DROP TRIGGER IF EXISTS on_message_inserted_unread ON public.chat_messages;
CREATE TRIGGER on_message_inserted_unread
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_unread_counts();

-- RLS Policies
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Room access policies
CREATE POLICY "Users can view rooms they're in" ON public.chat_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = id AND user_id = auth.uid()
        )
    );

-- Message access policies
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their rooms" ON public.chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
        )
    );

-- Participant access policies
CREATE POLICY "Users can view participants in their rooms" ON public.chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants AS cp
            WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
        )
    );

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(room_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.chat_participants
    SET 
        last_read_at = NOW(),
        unread_count = 0
    WHERE 
        room_id = $1 
        AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
