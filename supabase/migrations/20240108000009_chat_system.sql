-- Add chat system tables
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('direct', 'group', 'global')),
    name text,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    last_read_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_room_participant UNIQUE (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    content text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_message_reaction UNIQUE (message_id, user_id, reaction)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON public.chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_message ON public.chat_message_reactions(message_id);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies defensively
DO $$
BEGIN
    -- Chat rooms policies
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'chat_rooms' 
        AND policyname = 'Users can view rooms they''re in'
    ) THEN
        CREATE POLICY "Users can view rooms they're in"
            ON public.chat_rooms
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.chat_participants
                    WHERE room_id = id AND user_id = auth.uid()
                )
                OR type = 'global'
            );
    END IF;

    -- Chat participants policies
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'chat_participants' 
        AND policyname = 'Users can view their chat participation'
    ) THEN
        CREATE POLICY "Users can view their chat participation"
            ON public.chat_participants
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'chat_participants' 
        AND policyname = 'Users can manage their chat participation'
    ) THEN
        CREATE POLICY "Users can manage their chat participation"
            ON public.chat_participants
            FOR ALL
            USING (user_id = auth.uid());
    END IF;

    -- Chat messages policies
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'chat_messages' 
        AND policyname = 'Users can view messages in their rooms'
    ) THEN
        CREATE POLICY "Users can view messages in their rooms"
            ON public.chat_messages
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.chat_participants
                    WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'chat_messages' 
        AND policyname = 'Users can send messages to their rooms'
    ) THEN
        CREATE POLICY "Users can send messages to their rooms"
            ON public.chat_messages
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.chat_participants
                    WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
                )
            );
    END IF;

    -- Chat message reactions policies
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE schemaname = 'public' 
        AND tablename = 'chat_message_reactions' 
        AND policyname = 'Users can manage their reactions'
    ) THEN
        CREATE POLICY "Users can manage their reactions"
            ON public.chat_message_reactions
            FOR ALL
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Add triggers defensively
DO $$
BEGIN
    -- Chat rooms trigger
    IF NOT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'set_updated_at' 
        AND tgrelid = 'public.chat_rooms'::regclass
    ) THEN
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.chat_rooms
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Chat participants trigger
    IF NOT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'set_updated_at' 
        AND tgrelid = 'public.chat_participants'::regclass
    ) THEN
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.chat_participants
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Chat messages trigger
    IF NOT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'set_updated_at' 
        AND tgrelid = 'public.chat_messages'::regclass
    ) THEN
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.chat_messages
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;