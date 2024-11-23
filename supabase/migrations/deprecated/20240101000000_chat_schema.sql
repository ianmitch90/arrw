-- Add unread_count and last_read to room_participants
ALTER TABLE room_participants ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;
ALTER TABLE room_participants ADD COLUMN IF NOT EXISTS last_read TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add is_pinned to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Add last_message_preview to rooms for quick access
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_message_timestamp TIMESTAMP WITH TIME ZONE;
