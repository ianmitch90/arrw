-- Add content_type column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';

-- Add check constraint to ensure valid content types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stories_content_type_check'
    ) THEN
        ALTER TABLE stories ADD CONSTRAINT stories_content_type_check
            CHECK (content_type IN ('text', 'image', 'video', 'audio'));
    END IF;
END $$;
