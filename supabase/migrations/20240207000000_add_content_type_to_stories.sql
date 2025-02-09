-- Add content_type column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';

-- Add check constraint to ensure valid content types
ALTER TABLE stories ADD CONSTRAINT stories_content_type_check 
    CHECK (content_type IN ('text', 'image', 'video', 'audio'));
